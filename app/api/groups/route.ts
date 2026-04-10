import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin, logActivity, clearPermissionCache } from "@/lib/permissions";

// GET /api/groups - List all groups with permission counts and member counts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get all groups with member counts
    const result = await query(
      `
        SELECT 
          g.*,
          COUNT(DISTINCT ug.user_id) as member_count,
          COUNT(DISTINCT gp.id) as permission_count
        FROM groups g
        LEFT JOIN user_groups ug ON g.id = ug.group_id
        LEFT JOIN group_permissions gp ON g.id = gp.group_id
        GROUP BY g.id
        ORDER BY g.is_system DESC, g.name ASC
      `
    );

    return NextResponse.json({ groups: result.rows });
  } catch (error) {
    console.error("GET /api/groups error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch groups", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin/superadmin can create groups
    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color, permissions } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Check if group name already exists
    const existingGroup = await query(
      "SELECT id FROM groups WHERE name = $1",
      [name]
    );

    if (existingGroup.rows.length > 0) {
      return NextResponse.json(
        { error: "Group name already exists" },
        { status: 400 }
      );
    }

    // Create the group
    const groupResult = await query(
      `
        INSERT INTO groups (name, description, color, is_system, created_by)
        VALUES ($1, $2, $3, false, $4)
        RETURNING *
      `,
      [name, description || null, color || '#6366f1', session.user.id]
    );

    const newGroup = groupResult.rows[0];

    // Create permissions if provided
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        await query(
          `
            INSERT INTO group_permissions 
            (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            newGroup.id,
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
    }

    // Log the activity
    await logActivity(
      parseInt(session.user.id, 10),
      'CREATE',
      'group',
      newGroup.id,
      null,
      { name, description, color, permissions },
      request.headers.get('x-forwarded-for') || '',
      request.headers.get('user-agent') || ''
    );

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
