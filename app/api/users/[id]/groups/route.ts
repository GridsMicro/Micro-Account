import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin, logActivity, clearPermissionCache } from "@/lib/permissions";

// GET /api/users/[id]/groups - Get groups for a user
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

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Users can view their own groups, or Admin can view any
    const isOwnProfile = parseInt(session.user.id) === userId;
    const userIsAdmin = await isAdmin(session.user.id);
    
    if (!isOwnProfile && !userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get user's groups
    const result = await query(
      `
        SELECT g.*, ug.assigned_at, u.name as assigned_by_name
        FROM user_groups ug
        JOIN groups g ON ug.group_id = g.id
        LEFT JOIN users u ON ug.assigned_by = u.id
        WHERE ug.user_id = $1
        ORDER BY g.is_system DESC, g.name ASC
      `,
      [userId]
    );

    return NextResponse.json({ groups: result.rows });
  } catch (error) {
    console.error("GET /api/users/[id]/groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user groups" },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/groups - Assign user to groups
export async function POST(
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

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { groupIds, replaceExisting = false } = body;

    if (!groupIds || !Array.isArray(groupIds)) {
      return NextResponse.json(
        { error: "groupIds array is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheck = await query(
      "SELECT id, name FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = userCheck.rows[0];

    // If replaceExisting, delete all current group assignments
    if (replaceExisting) {
      await query("DELETE FROM user_groups WHERE user_id = $1", [userId]);
    }

    // Add user to new groups
    const addedGroups = [];
    const skippedGroups = [];

    for (const groupId of groupIds) {
      // Check if group exists
      const groupCheck = await query(
        "SELECT id, name FROM groups WHERE id = $1",
        [groupId]
      );

      if (groupCheck.rows.length === 0) {
        skippedGroups.push({ groupId, reason: "Group not found" });
        continue;
      }

      // Check if already assigned
      const existingCheck = await query(
        "SELECT id FROM user_groups WHERE user_id = $1 AND group_id = $2",
        [userId, groupId]
      );

      if (existingCheck.rows.length > 0) {
        skippedGroups.push({ groupId, reason: "Already assigned" });
        continue;
      }

      // Assign user to group
      await query(
        `
          INSERT INTO user_groups (user_id, group_id, assigned_by)
          VALUES ($1, $2, $3)
        `,
        [userId, groupId, parseInt(session.user.id)]
      );

      addedGroups.push(groupCheck.rows[0]);
    }

    // Clear permission cache for this user
    clearPermissionCache(userId);

    // Log the activity
    await logActivity(
      parseInt(session.user.id),
      'ASSIGN_GROUPS',
      'user',
      userId,
      null,
      { userName: targetUser.name, addedGroups, skippedGroups },
      request.headers.get('x-forwarded-for') || '',
      request.headers.get('user-agent') || ''
    );

    return NextResponse.json({
      success: true,
      addedGroups,
      skippedGroups,
    });
  } catch (error) {
    console.error("POST /api/users/[id]/groups error:", error);
    return NextResponse.json(
      { error: "Failed to assign groups" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]/groups - Remove user from specific groups
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

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId query parameter is required" },
        { status: 400 }
      );
    }

    const groupIdNum = parseInt(groupId);
    if (isNaN(groupIdNum)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    // Check if assignment exists
    const checkResult = await query(
      "SELECT id FROM user_groups WHERE user_id = $1 AND group_id = $2",
      [userId, groupIdNum]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User is not in this group" },
        { status: 404 }
      );
    }

    // Remove user from group
    await query(
      "DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2",
      [userId, groupIdNum]
    );

    // Clear permission cache for this user
    clearPermissionCache(userId);

    // Log the activity
    await logActivity(
      parseInt(session.user.id),
      'REMOVE_FROM_GROUP',
      'user',
      userId,
      null,
      { removedGroupId: groupIdNum },
      request.headers.get('x-forwarded-for') || '',
      request.headers.get('user-agent') || ''
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id]/groups error:", error);
    return NextResponse.json(
      { error: "Failed to remove from group" },
      { status: 500 }
    );
  }
}
