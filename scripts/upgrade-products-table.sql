-- =====================================================
-- Micro-Account: Products Table Upgrade
-- Adding supplier_cost and markup_rate for automated journaling
-- =====================================================

-- First, check if columns exist before adding
DO $$
BEGIN
    -- Add supplier_cost column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'supplier_cost'
    ) THEN
        ALTER TABLE products ADD COLUMN supplier_cost DECIMAL(15,2) DEFAULT 0.00;
        RAISE NOTICE 'Added supplier_cost column to products table';
    END IF;

    -- Add markup_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'markup_rate'
    ) THEN
        ALTER TABLE products ADD COLUMN markup_rate DECIMAL(5,4) DEFAULT 0.0000;
        RAISE NOTICE 'Added markup_rate column to products table';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN products.supplier_cost IS 'ต้นทุนจากผู้ขาย (Cost from supplier) - ใช้สำหรับคำนวณกำไรและบันทึกบัญชี COGS';
COMMENT ON COLUMN products.markup_rate IS 'อัตรากำไร (Markup rate) - เช่น 0.30 = 30% markup, คำนวณจาก (selling_price - supplier_cost) / supplier_cost';

-- Create index for performance if needed
CREATE INDEX IF NOT EXISTS idx_products_supplier_cost ON products(supplier_cost) WHERE supplier_cost > 0;
CREATE INDEX IF NOT EXISTS idx_products_markup_rate ON products(markup_rate) WHERE markup_rate > 0;

-- Update existing products with default markup calculation (if they have price but no supplier_cost)
UPDATE products 
SET supplier_cost = ROUND(price * 0.70, 2), 
    markup_rate = ROUND((price - (price * 0.70)) / (price * 0.70), 4)
WHERE supplier_cost = 0 AND price > 0;

-- Verify the upgrade
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('supplier_cost', 'markup_rate')
ORDER BY column_name;

-- Sample data verification
SELECT 
    id, 
    name, 
    price, 
    supplier_cost, 
    markup_rate,
    ROUND((price - supplier_cost) / supplier_cost, 4) as calculated_markup
FROM products 
LIMIT 5;
