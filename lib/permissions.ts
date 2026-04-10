import { query } from "./db";
import { auth } from "@/lib/auth";

// Permission action types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage';

// Module names (must match database)
export const MODULES = [
  'dashboard',
  'quotations',
  'invoices',
  'recurring',
  'receipts',
  'inventory',
  'services',
  'expenses',
  'payroll',
  'journals',
  'vouchers',
  'contacts',
  'payments',
  'tax_reports',
  'reports',
  'calendar',
  'settings',
  'member_management',
  'permissions',
  'groups',
] as const;

export type ModuleName = typeof MODULES[number];

// Permission cache (session-based)
const permissionCache = new Map<string, Map<string, boolean>>();

/**
 * Check if a user has a specific permission
 * Returns true if ANY of the user's groups grant this permission
 */
export async function checkPermission(
  userId: string | number,
  module: ModuleName | string,
  action: PermissionAction
): Promise<boolean> {
  const cacheKey = `${userId}:${module}:${action}`;
  
  // Check cache first
  const userCache = permissionCache.get(String(userId));
  if (userCache && userCache.has(cacheKey)) {
    return userCache.get(cacheKey)!;
  }

  try {
    // Query to check if any of the user's groups grant this permission
    const result = await query(
      `
        SELECT EXISTS (
          SELECT 1 
          FROM user_groups ug
          JOIN group_permissions gp ON ug.group_id = gp.group_id
          WHERE ug.user_id = $1 
            AND gp.module = $2
            AND ${getPermissionColumn(action)} = true
        ) as has_permission
      `,
      [userId, module]
    );

    const hasPermission = result.rows[0]?.has_permission || false;
    
    // Cache the result
    if (!permissionCache.has(String(userId))) {
      permissionCache.set(String(userId), new Map());
    }
    permissionCache.get(String(userId))!.set(cacheKey, hasPermission);
    
    return hasPermission;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get all permissions for a user (union of all groups)
 */
export async function getUserPermissions(userId: string | number): Promise<Record<string, Record<PermissionAction, boolean>>> {
  try {
    const result = await query(
      `
        SELECT 
          gp.module,
          BOOL_OR(gp.can_create) as can_create,
          BOOL_OR(gp.can_read) as can_read,
          BOOL_OR(gp.can_update) as can_update,
          BOOL_OR(gp.can_delete) as can_delete,
          BOOL_OR(gp.can_export) as can_export,
          BOOL_OR(gp.can_manage) as can_manage
        FROM user_groups ug
        JOIN group_permissions gp ON ug.group_id = gp.group_id
        WHERE ug.user_id = $1
        GROUP BY gp.module
      `,
      [userId]
    );

    const permissions: Record<string, Record<PermissionAction, boolean>> = {};
    
    // Initialize all modules with false
    MODULES.forEach(module => {
      permissions[module] = {
        create: false,
        read: false,
        update: false,
        delete: false,
        export: false,
        manage: false,
      };
    });

    // Merge actual permissions (union - most permissive wins)
    result.rows.forEach(row => {
      permissions[row.module] = {
        create: row.can_create || false,
        read: row.can_read || false,
        update: row.can_update || false,
        delete: row.can_delete || false,
        export: row.can_export || false,
        manage: row.can_manage || false,
      };
    });

    return permissions;
  } catch (error) {
    console.error('Get user permissions error:', error);
    return {};
  }
}

// Group type definition
export interface Group {
  id: number;
  name: string;
  description: string | null;
  color: string;
  is_system: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  assigned_at?: Date;
}

/**
 * Get all groups for a user
 */
export async function getUserGroups(userId: string | number): Promise<Group[]> {
  try {
    const result = await query(
      `
        SELECT g.*, ug.assigned_at 
        FROM user_groups ug
        JOIN groups g ON ug.group_id = g.id
        WHERE ug.user_id = $1
        ORDER BY g.is_system DESC, g.name ASC
      `,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Get user groups error:', error);
    return [];
  }
}

/**
 * Check if user is in a specific group
 */
export async function isInGroup(userId: string | number, groupId: number): Promise<boolean> {
  try {
    const result = await query(
      'SELECT EXISTS (SELECT 1 FROM user_groups WHERE user_id = $1 AND group_id = $2) as is_member',
      [userId, groupId]
    );
    return result.rows[0]?.is_member || false;
  } catch (error) {
    console.error('Is in group check error:', error);
    return false;
  }
}

/**
 * Check if user is superadmin
 */
export async function isSuperAdmin(userId: string | number): Promise<boolean> {
  return isInGroup(userId, 1); // canonical superadmin group ID
}

/**
 * Check if user is admin (includes superadmin)
 */
export async function isAdmin(userId: string | number): Promise<boolean> {
  return isInGroup(userId, 1) || isInGroup(userId, 2); // superadmin or admin group
}

/**
 * Get the permission column name for a given action
 */
function getPermissionColumn(action: PermissionAction): string {
  const columnMap: Record<PermissionAction, string> = {
    create: 'can_create',
    read: 'can_read',
    update: 'can_update',
    delete: 'can_delete',
    export: 'can_export',
    manage: 'can_manage',
  };
  return columnMap[action];
}

/**
 * Clear permission cache for a user
 */
export function clearPermissionCache(userId: string | number): void {
  permissionCache.delete(String(userId));
}

/**
 * Clear all permission cache
 */
export function clearAllPermissionCache(): void {
  permissionCache.clear();
}

// =====================================================
// Server-side permission gate (for use in Server Components)
// =====================================================

import { redirect } from "next/navigation";

export async function withPermissionGate(
  handler: () => Promise<Response | unknown>,
  module: ModuleName | string,
  action: PermissionAction
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const hasPermission = await checkPermission(session.user.id, module, action);
  
  if (!hasPermission) {
    redirect('/permission-denied');
  }

  return handler();
}

// =====================================================
// Activity Log functions
// =====================================================

/**
 * Log an activity to the activity_log table
 */
export async function logActivity(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  oldValues: Record<string, unknown> | null = null,
  newValues: Record<string, unknown> | null = null,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<void> {
  try {
    await query(
      `
        INSERT INTO activity_log 
        (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [userId, action, entityType, entityId, 
       oldValues ? JSON.stringify(oldValues) : null, 
       newValues ? JSON.stringify(newValues) : null,
       ipAddress || null, 
       userAgent || null]
    );
  } catch (error) {
    console.error('Activity log error:', error);
  }
}

// =====================================================
// Permission helpers for client components
// =====================================================

export function canCreate(permissions: Record<PermissionAction, boolean>): boolean {
  return permissions?.create || false;
}

export function canRead(permissions: Record<PermissionAction, boolean>): boolean {
  return permissions?.read || false;
}

export function canUpdate(permissions: Record<PermissionAction, boolean>): boolean {
  return permissions?.update || false;
}

export function canDelete(permissions: Record<PermissionAction, boolean>): boolean {
  return permissions?.delete || false;
}

export function canExport(permissions: Record<PermissionAction, boolean>): boolean {
  return permissions?.export || false;
}

export function canManage(permissions: Record<PermissionAction, boolean>): boolean {
  return permissions?.manage || false;
}
