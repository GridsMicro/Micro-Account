import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin, logActivity, clearPermissionCache } from "@/lib/permissions";

// GET /api/groups/[id] - Get specific group with permissions
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

    // Get group details
    const groupResult = await query(
      "SELECT * FROM groups WHERE id = $1",
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const group = groupResult.rows[0];

    // Get group permissions
    const permissionsResult = await query(
      "SELECT * FROM group_permissions WHERE group_id = $1 ORDER BY module",
      [groupId]
    );

    // Get group members
    const membersResult = await query(
      `
        SELECT u.id, u.name, u.email, u.status, ug.assigned_at
        FROM user_groups ug
        JOIN users u ON ug.user_id = u.id
        WHERE ug.group_id = $1
        ORDER BY u.name
      `,
      [groupId]
    );

    return NextResponse.json({
      group,
      permissions: permissionsResult.rows,
      members: membersResult.rows,
    });
  } catch (error) {
    console.error("GET /api/groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - Update group
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

    // Check if group exists and is not a system group (only superadmin can modify system groups)
    const groupResult = await query(
      "SELECT * FROM groups WHERE id = $1",
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const existingGroup = groupResult.rows[0];
    const userIsSuperAdmin = await isSuperAdmin(session.user.id);

    if (existingGroup.is_system && !userIsSuperAdmin) {
      return NextResponse.json(
        { error: "Only superadmin can modify system groups" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color } = body;

    // Check if new name conflicts with existing group
    if (name && name !== existingGroup.name) {
      const nameCheck = await query(
        "SELECT id FROM groups WHERE name = $1 AND id != $2",
        [name, groupId]
      );
      if (nameCheck.rows.length > 0) {
        return NextResponse.json(
          { error: "Group name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the group
    const updateResult = await query(
      `
        UPDATE groups 
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            color = COALESCE($3, color),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `,
      [name, description, color, groupId]
    );

    const updatedGroup = updateResult.rows[0];

    // Log the activity
    await logActivity(
      parseInt(session.user.id),
      'UPDATE',
      'group',
      groupId,
      existingGroup,
      updatedGroup,
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

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error("PUT /api/groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
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

    // Cannot delete system groups
    if (existingGroup.is_system) {
      return NextResponse.json(
        { error: "Cannot delete system groups" },
        { status: 403 }
      );
    }

    const currentUserId = parseInt(session.user.id, 10);

    // Only superadmin or the creator can delete non-system groups
    if (!userIsSuperAdmin && Number(existingGroup.created_by) !== currentUserId) {
      return NextResponse.json(
        { error: "Only superadmin or the creator can delete this group" },
        { status: 403 }
      );
    }

    // Get all users in this group before deletion (for cache clearing)
    const membersResult = await query(
      "SELECT user_id FROM user_groups WHERE group_id = $1",
      [groupId]
    );

    // Delete the group (cascades to group_permissions and user_groups)
    await query("DELETE FROM groups WHERE id = $1", [groupId]);

    // Log the activity
    await logActivity(
      parseInt(session.user.id),
      'DELETE',
      'group',
      groupId,
      existingGroup,
      null,
      request.headers.get('x-forwarded-for') || '',
      request.headers.get('user-agent') || ''
    );

    // Clear permission cache for all users that were in this group
    for (const member of membersResult.rows) {
      clearPermissionCache(member.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
