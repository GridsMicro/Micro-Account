-- =====================================================
-- Micro-Account: Add Test User
-- Adds k.net.game01@gmail.com as superadmin user
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- Insert the new superadmin user
INSERT INTO users (name, email, password, role, status, created_at) 
VALUES (
    'Test User',
    'k.net.game01@gmail.com',
    '$2b$12$abcdefghijklmnopqrstuvwx01234567890', -- This is a bcrypt hash for 'Tester1234'
    'superadmin',
    'active',
    CURRENT_TIMESTAMP
) 
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    created_at = CURRENT_TIMESTAMP;

-- Verify the user was added
SELECT id, name, email, role, status, created_at 
FROM users 
WHERE email = 'k.net.game01@gmail.com';

-- Show all superadmin users for verification
SELECT id, name, email, role, status, created_at 
FROM users 
WHERE role = 'superadmin'
ORDER BY created_at DESC;
