-- =====================================================
-- Migration (สำหรับพี่ฆังพิจารณา — ฌอนไม่ได้รันกับ production)
-- วันที่: 2026-11-20
-- เรื่อง: ความเข้ากันได้ของคอลัมน์ expenses หลังแก้โค้ด P0
-- -----------------------------------------------------
-- สถานะปัจจุบัน:
--   app/expense-actions.ts ใช้ `title` ในการ INSERT/UPDATE แล้ว
--   (ก่อนหน้า INSERT ใช้ `description` ที่ไม่มีคอลัมน์ใน fresh install)
--
-- ไฟล์นี้ **ไม่จำเป็นสำหรับ production ที่มีคอลัมน์ title อยู่แล้ว**
-- ทำไว้สำหรับ legacy DB ที่อาจมีแค่ `description` → backfill กลับเข้า `title`
-- หลักการ: ADDITIVE เท่านั้น (ไม่ DROP / ไม่ ALTER TYPE / ไม่ลบข้อมูล)
-- =====================================================

BEGIN;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS title VARCHAR(255);

UPDATE expenses
SET title = description
WHERE (title IS NULL OR title = '')
  AND description IS NOT NULL
  AND description <> '';

-- ตรวจผลก่อน COMMIT (ควรเห็น 0 รายการที่ title ยังว่างทั้งที่ description มีค่า)
-- SELECT id, title, description FROM expenses
-- WHERE (title IS NULL OR title = '') AND description IS NOT NULL;

COMMIT;
