-- =====================================================
-- Micro-Account: Role System Fix
-- Fixes SUPER_ADMIN to superadmin and removes redundant roles
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- Update Grids Jivapong role from SUPER_ADMIN to superadmin
UPDATE users 
SET role = 'superadmin' 
WHERE email = 'grids@microtronic.biz';

-- Remove any SUPER_ADMIN roles that might exist
DELETE FROM users 
WHERE role = 'SUPER_ADMIN';

-- Ensure all admin users have consistent roles
UPDATE users 
SET role = CASE 
    WHEN email = 'neon13@microtronic.biz' THEN 'admin'
    WHEN email = 'grids@microtronic.biz' THEN 'superadmin'
    ELSE role 
END
WHERE email IN ('neon13@microtronic.biz', 'grids@microtronic.biz');
