-- Migration: Add pp36_exempt flag to expenses
-- Purpose: Mark expenses where the foreign supplier already collects Thai VAT
--          (e.g. Google Workspace billed on card with TC rate) so ภ.พ. 36
--          reverse-charge draft skips them — they are not self-assessed VAT.
-- Created: 2026-09-21
-- Reason: ใบแจ้งยอด KTC 20/07/26 — Google Workspace เรียกเก็บ USD ผ่านบัตร、
--         VAT ถูกเรียกเก็บจากผู้ให้บริการแล้ว ไม่ใช่ reverse charge

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS pp36_exempt BOOLEAN NOT NULL DEFAULT false;

-- Verification query:
-- SELECT id, expense_date, vendor, original_currency, pp36_exempt
-- FROM expenses WHERE pp36_exempt = true;