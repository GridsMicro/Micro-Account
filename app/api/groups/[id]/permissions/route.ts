import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin, logActivity, clearPermissionCache } from "@/lib/permissions";
import pool from "@/lib/db";

// GET /api/groups/[id]/permissions - Get permissions for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    // Check if group exists
    const groupResult = await query(
      "SELECT * FROM groups WHERE id = $1",
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get all permissions for this group
    const permissionsResult = await query(
      "SELECT * FROM group_permissions WHERE group_id = $1 ORDER BY module",
      [groupId]
    );

    return NextResponse.json({ permissions: permissionsResult.rows });
  } catch (error) {
    console.error("GET /api/groups/[id]/permissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id]/permissions - Update permissions for a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    // Check if group exists
    const groupResult = await query(
      "SELECT * FROM groups WHERE id = $1",
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const existingGroup = groupResult.rows[0];
    const userIsSuperAdmin = await isSuperAdmin(session.user.id);

    // Only superadmin can modify system group permissions
    if (existingGroup.is_system && !userIsSuperAdmin) {
      return NextResponse.json(
        { error: "Only superadmin can modify system group permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { permissions } = body;

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions array is required" },
        { status: 400 }
      );
    }

    // Store old permissions for activity log
    const oldPermissionsResult = await query(
      "SELECT * FROM group_permissions WHERE group_id = $1",
      [groupId]
    );
    const oldPermissions = oldPermissionsResult.rows;

    // Delete existing permissions and insert new ones in one transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete existing permissions
      await client.query("DELETE FROM group_permissions WHERE group_id = $1", [groupId]);

      // Insert new permissions
      for (const perm of permissions) {
        await client.query(
          `
            INSERT INTO group_permissions 
            (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            groupId,
            perm.module,
            perm.can_create || false,
            perm.can_read || false,
            perm.can_update || false,
            perm.can_delete || false,
            perm.can_export || false,
            perm.can_manage || false,
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // Log the activity
    await logActivity(
      parseInt(session.user.id, 10),
      'UPDATE_PERMISSIONS',
      'group',
      groupId,
      { permissions: oldPermissions },
      { permissions },
      request.headers.get('x-forwarded-for') || '',
      request.headers.get('user-agent') || ''
    );

    // Clear permission cache for all users in this group
    const membersResult = await query(
      "SELECT user_id FROM user_groups WHERE group_id = $1",
      [groupId]
    );
    for (const member of membersResult.rows) {
      clearPermissionCache(member.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/groups/[id]/permissions error:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
