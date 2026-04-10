-- =======================================================
-- MIGRATION: ADD ITEMS AND SERVICES CATALOG
-- Description: Creates a standardized catalog for services,
-- licenses, and products with default standard pricing.
-- =======================================================

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) DEFAULT 'service', -- 'service', 'license', 'product'
    unit_price DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial standard pricing (Rate Card)
INSERT INTO items (item_code, name, description, item_type, unit_price) VALUES
('LIC-VAR', 'Software License & Subscription', 'ค่าสิทธิ์การใช้งานซอฟต์แวร์ประยุกต์และคลาวด์', 'license', 0.00),
('SRV-AGENT', 'Agent Management Fee', 'ค่าบริการประสานงานรายปี การจัดการใบอนุญาตและการสนับสนุนเบื้องต้น', 'service', 10000.00),
('SRV-SETUP', 'Setup & Provisioning Fee', 'ค่าบริการเปิดระบบและตั้งค่าเริ่มต้น', 'service', 5000.00),
('SRV-TECHD', 'Technical Support (Man-Day)', 'ค่าบริการที่ปรึกษาและซัพพอร์ตเชิงเทคนิคแบบรายวัน', 'service', 3500.00),
('SRV-TECHH', 'Technical Support (Man-Hour)', 'ค่าบริการที่ปรึกษาและซัพพอร์ตเชิงเทคนิคแบบรายชั่วโมง', 'service', 500.00)
ON CONFLICT (item_code) DO NOTHING;
