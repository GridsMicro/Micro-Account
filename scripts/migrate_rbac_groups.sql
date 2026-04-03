-- =====================================================
-- Dynamic RBAC Groups System Migration
-- Micro-Account Database Schema Update
-- Date: 2026-04-03
-- =====================================================

-- =====================================================
-- STEP 1: Create groups table
-- =====================================================
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    is_system BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_is_system ON groups(is_system);

-- =====================================================
-- STEP 2: Create group_permissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS group_permissions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    can_manage BOOLEAN DEFAULT false,
    UNIQUE(group_id, module)
);

-- Create index for permission lookups
CREATE INDEX IF NOT EXISTS idx_group_permissions_group_id ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_module ON group_permissions(module);

-- =====================================================
-- STEP 3: Create user_groups junction table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Create indexes for user/group lookups
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id);

-- =====================================================
-- STEP 4: Add primary_group_id to users table
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'primary_group_id'
    ) THEN
        ALTER TABLE users ADD COLUMN primary_group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- STEP 5: Create ActivityLog table for audit trail
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity log queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- =====================================================
-- STEP 6: Create trigger function for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for groups table
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 7: Insert System Groups
-- =====================================================

-- Super Administrators (ID: 1)
INSERT INTO groups (id, name, description, color, is_system) VALUES
(1, 'Super Administrators', 'เจ้าของระบบ - เข้าถึงได้ทุกส่วน รวมถึงการจัดการระบบ', '#dc2626', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_system = EXCLUDED.is_system;

-- Administrators (ID: 2)
INSERT INTO groups (id, name, description, color, is_system) VALUES
(2, 'Administrators', 'ผู้ดูแลระบบ - จัดการทุกฟีเจอร์ยกเว้นการตั้งค่าระบบสูงสุด', '#7c3aed', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_system = EXCLUDED.is_system;

-- Accountants (ID: 3)
INSERT INTO groups (id, name, description, color, is_system) VALUES
(3, 'Accountants', 'นักบัญชี - จัดการใบแจ้งหนี้ สมุดรายวัน และรายงาน', '#0891b2', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_system = EXCLUDED.is_system;

-- Sales Staff (ID: 4)
INSERT INTO groups (id, name, description, color, is_system) VALUES
(4, 'Sales Staff', 'พนักงานขาย - ออกใบเสนอราคา ใบแจ้งหนี้ และจัดการลูกค้า', '#059669', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_system = EXCLUDED.is_system;

-- Warehouse Staff (ID: 5)
INSERT INTO groups (id, name, description, color, is_system) VALUES
(5, 'Warehouse Staff', 'พนักงานคลังสินค้า - จัดการสินค้าและสต็อก', '#d97706', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_system = EXCLUDED.is_system;

-- Viewers (ID: 6)
INSERT INTO groups (id, name, description, color, is_system) VALUES
(6, 'Viewers', 'ผู้ใช้ทั่วไป - ดูข้อมูลได้อย่างเดียว', '#6b7280', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_system = EXCLUDED.is_system;

-- Reset sequence to start after system groups
SELECT setval('groups_id_seq', 6, true);

-- =====================================================
-- STEP 8: Insert Permissions for Super Administrators (Full Access)
-- =====================================================
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage)
SELECT 1, module, true, true, true, true, true, true
FROM (VALUES
    ('dashboard'), ('quotations'), ('invoices'), ('recurring'), ('receipts'),
    ('inventory'), ('expenses'), ('journals'), ('vouchers'), ('contacts'),
    ('payments'), ('tax_reports'), ('reports'), ('calendar'), ('settings'),
    ('member_management'), ('permissions'), ('groups')
) AS modules(module)
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = true,
    can_read = true,
    can_update = true,
    can_delete = true,
    can_export = true,
    can_manage = true;

-- =====================================================
-- STEP 9: Insert Permissions for Administrators (All except member/permission management)
-- =====================================================
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage)
SELECT 2, module, true, true, true, true, true, true
FROM (VALUES
    ('dashboard'), ('quotations'), ('invoices'), ('recurring'), ('receipts'),
    ('inventory'), ('expenses'), ('journals'), ('vouchers'), ('contacts'),
    ('payments'), ('tax_reports'), ('reports'), ('calendar'), ('settings')
) AS modules(module)
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = true,
    can_read = true,
    can_update = true,
    can_delete = true,
    can_export = true,
    can_manage = true;

-- Administrators: Read-only for management modules
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage) VALUES
(2, 'member_management', false, true, false, false, false, false),
(2, 'permissions', false, true, false, false, false, false),
(2, 'groups', true, true, true, true, true, true)  -- Can manage custom groups
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = EXCLUDED.can_create,
    can_read = EXCLUDED.can_read,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export,
    can_manage = EXCLUDED.can_manage;

-- =====================================================
-- STEP 10: Insert Permissions for Accountants
-- =====================================================
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage) VALUES
(3, 'dashboard', false, true, false, false, false, false),
(3, 'invoices', true, true, true, true, true, false),
(3, 'journals', true, true, true, true, true, false),
(3, 'vouchers', true, true, true, true, true, false),
(3, 'receipts', true, true, true, true, true, false),
(3, 'contacts', false, true, false, false, false, false),
(3, 'inventory', false, true, false, false, false, false),
(3, 'tax_reports', false, true, false, false, true, false),
(3, 'reports', false, true, false, false, true, false),
(3, 'settings', false, true, false, false, false, false)
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = EXCLUDED.can_create,
    can_read = EXCLUDED.can_read,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export,
    can_manage = EXCLUDED.can_manage;

-- =====================================================
-- STEP 11: Insert Permissions for Sales Staff
-- =====================================================
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage) VALUES
(4, 'dashboard', false, true, false, false, false, false),
(4, 'quotations', true, true, true, true, true, false),
(4, 'invoices', true, true, true, true, true, false),
(4, 'contacts', true, true, true, true, false, false),
(4, 'inventory', false, true, false, false, false, false),
(4, 'calendar', true, true, true, true, false, false)
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = EXCLUDED.can_create,
    can_read = EXCLUDED.can_read,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export,
    can_manage = EXCLUDED.can_manage;

-- =====================================================
-- STEP 12: Insert Permissions for Warehouse Staff
-- =====================================================
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage) VALUES
(5, 'dashboard', false, true, false, false, false, false),
(5, 'inventory', true, true, true, true, true, true),
(5, 'expenses', false, true, false, false, false, false)
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = EXCLUDED.can_create,
    can_read = EXCLUDED.can_read,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export,
    can_manage = EXCLUDED.can_manage;

-- =====================================================
-- STEP 13: Insert Permissions for Viewers (Read-only all modules)
-- =====================================================
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage)
SELECT 6, module, false, true, false, false, false, false
FROM (VALUES
    ('dashboard'), ('quotations'), ('invoices'), ('recurring'), ('receipts'),
    ('inventory'), ('expenses'), ('journals'), ('vouchers'), ('contacts'),
    ('payments'), ('tax_reports'), ('reports'), ('calendar'), ('settings')
) AS modules(module)
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = false,
    can_read = true,
    can_update = false,
    can_delete = false,
    can_export = false,
    can_manage = false;

-- Viewers: No access to management modules
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage) VALUES
(6, 'member_management', false, false, false, false, false, false),
(6, 'permissions', false, false, false, false, false, false),
(6, 'groups', false, false, false, false, false, false)
ON CONFLICT (group_id, module) DO UPDATE SET
    can_create = false,
    can_read = false,
    can_update = false,
    can_delete = false,
    can_export = false,
    can_manage = false;

-- =====================================================
-- STEP 14: Migrate existing users to groups based on role
-- =====================================================

-- Migrate superadmin → Super Administrators (ID: 1)
INSERT INTO user_groups (user_id, group_id)
SELECT id, 1 FROM users WHERE role = 'superadmin' AND NOT EXISTS (
    SELECT 1 FROM user_groups WHERE user_id = users.id AND group_id = 1
);

-- Migrate admin → Administrators (ID: 2)
INSERT INTO user_groups (user_id, group_id)
SELECT id, 2 FROM users WHERE role = 'admin' AND NOT EXISTS (
    SELECT 1 FROM user_groups WHERE user_id = users.id AND group_id = 2
);

-- Migrate manager → Accountants (ID: 3)
INSERT INTO user_groups (user_id, group_id)
SELECT id, 3 FROM users WHERE role = 'manager' AND NOT EXISTS (
    SELECT 1 FROM user_groups WHERE user_id = users.id AND group_id = 3
);

-- Migrate staff → Viewers (ID: 6) - safest default
INSERT INTO user_groups (user_id, group_id)
SELECT id, 6 FROM users WHERE role = 'staff' AND NOT EXISTS (
    SELECT 1 FROM user_groups WHERE user_id = users.id AND group_id = 6
);

-- Migrate user/pending → Viewers (ID: 6) - safest default
INSERT INTO user_groups (user_id, group_id)
SELECT id, 6 FROM users WHERE role IN ('user', 'pending', 'tester') AND NOT EXISTS (
    SELECT 1 FROM user_groups WHERE user_id = users.id AND group_id = 6
);

-- =====================================================
-- STEP 15: Set primary_group_id for users
-- =====================================================
UPDATE users SET primary_group_id = 1 WHERE role = 'superadmin';
UPDATE users SET primary_group_id = 2 WHERE role = 'admin';
UPDATE users SET primary_group_id = 3 WHERE role = 'manager';
UPDATE users SET primary_group_id = 6 WHERE role IN ('staff', 'user', 'pending', 'tester');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- System is ready for Dynamic RBAC Groups
