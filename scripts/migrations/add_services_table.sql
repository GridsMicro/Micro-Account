-- =======================================================
-- MIGRATION: ADD SERVICES CATALOG
-- Description: Creates a standardized catalog strictly for 
-- services. Separated from products (inventory) to handle 
-- WHT 3% logic, labor costs, and zero-stock accounting.
-- =======================================================

-- 1. ลบตาราง items เดิมทิ้ง (Cleanup)
DROP TABLE IF EXISTS items;

-- 2. สร้างตาราง services ที่ถูกต้อง
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(50) DEFAULT 'service', -- 'professional', 'maintenance', 'agent_fee'
    unit_price DECIMAL(15,2) DEFAULT 0,
    is_wht_applicable BOOLEAN DEFAULT TRUE, -- CRITICAL: Auto-flag for 3% WHT
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. เพิ่มข้อมูลค่าบริการมาตรฐาน (Rate Card)
INSERT INTO services (service_code, name, description, service_type, unit_price, is_wht_applicable) VALUES
('SRV-AGENT', 'Agent Management Fee', 'ค่าบริการประสานงานรายปี การจัดการใบอนุญาตและการสนับสนุนเบื้องต้น', 'agent_fee', 10000.00, true),
('SRV-SETUP', 'Setup & Provisioning Fee', 'ค่าบริการเปิดระบบและตั้งค่าเริ่มต้น', 'professional', 5000.00, true),
('SRV-TECHD', 'Technical Support (Man-Day)', 'ค่าบริการที่ปรึกษาและซัพพอร์ตเชิงเทคนิคแบบรายวัน', 'professional', 3500.00, true),
('SRV-TECHH', 'Technical Support (Man-Hour)', 'ค่าบริการที่ปรึกษาและซัพพอร์ตเชิงเทคนิคแบบรายชั่วโมง', 'professional', 500.00, true)
ON CONFLICT (service_code) DO NOTHING;
