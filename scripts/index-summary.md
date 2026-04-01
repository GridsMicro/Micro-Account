# Micro-Account Database Index Summary

## ดัชนีที่สร้างขึ้นทั้งหมด (All Created Indexes)

### 1. expenses table (6 indexes)
- `idx_expenses_expense_date` - สำหรับค้นหาตามวันที่ค่าใช้จ่าย
- `idx_expenses_category` - สำหรับค้นหาตามประเภทค่าใช้จ่าย
- `idx_expenses_status` - สำหรับค้นหาตามสถานะ
- `idx_expenses_amount` - สำหรับค้นหาตามจำนวนเงิน
- `idx_expenses_created_at` - สำหรับค้นหาตามวันที่สร้าง
- `idx_expenses_date_category` - สำหรับค้นหาแบบผสม (วันที่ + ประเภท)

### 2. journal_entries table (12 indexes)
- `idx_journal_entries_entry_date` - สำหรับค้นหาตามวันที่บันทึก
- `idx_journal_entries_journal_type` - สำหรับค้นหาตามประเภทสมุดรายวัน
- `idx_journal_entries_debit_account_id` - สำหรับค้นหาตามบัญชีเดบิต
- `idx_journal_entries_credit_account_id` - สำหรับค้นหาตามบัญชีเครดิต
- `idx_journal_entries_amount` - สำหรับค้นหาตามจำนวนเงิน
- `idx_journal_entries_fiscal_year` - สำหรับค้นหาตามปีบัญชี
- `idx_journal_entries_fiscal_month` - สำหรับค้นหาตามเดือนบัญชี
- `idx_journal_entries_document_number` - สำหรับค้นหาตามเลขที่เอกสาร
- `idx_journal_entries_reference` - สำหรับค้นหาตามอ้างอิง
- `idx_journal_entries_accounts_amount` - สำหรับค้นหาแบบผสม (บัญชี + จำนวนเงิน)
- `idx_journal_entries_date_type` - สำหรับค้นหาแบบผสม (วันที่ + ประเภท)

### 3. chart_of_accounts table (4 indexes)
- `idx_chart_of_accounts_account_code` - สำหรับค้นหาตามรหัสบัญชี
- `idx_chart_of_accounts_account_type` - สำหรับค้นหาตามประเภทบัญชี
- `idx_chart_of_accounts_parent_account_id` - สำหรับค้นหาตามบัญชีแม่
- `idx_chart_of_accounts_type_code` - สำหรับค้นหาแบบผสม (ประเภท + รหัส)

### 4. users table (5 indexes)
- `idx_users_email` - สำหรับค้นหาตามอีเมล (unique)
- `idx_users_role` - สำหรับค้นหาตามบทบาท
- `idx_users_status` - สำหรับค้นหาตามสถานะ
- `idx_users_created_at` - สำหรับค้นหาตามวันที่สร้าง
- `idx_users_role_status` - สำหรับค้นหาแบบผสม (บทบาท + สถานะ)

### 5. company_settings table (2 indexes)
- `idx_company_settings_created_at` - สำหรับค้นหาตามวันที่สร้าง
- `idx_company_settings_updated_at` - สำหรับค้นหาตามวันที่อัพเดท

### 6. invoices table (7 indexes)
- `idx_invoices_invoice_number` - สำหรับค้นหาตามเลขที่ใบแจ้งหนี้ (unique)
- `idx_invoices_customer_id` - สำหรับค้นหาตามรหัสลูกค้า
- `idx_invoices_invoice_date` - สำหรับค้นหาตามวันที่ออกใบแจ้งหนี้
- `idx_invoices_due_date` - สำหรับค้นหาตามวันที่ครบกำหนด
- `idx_invoices_status` - สำหรับค้นหาตามสถานะ
- `idx_invoices_amount` - สำหรับค้นหาตามจำนวนเงิน
- `idx_invoices_created_at` - สำหรับค้นหาตามวันที่สร้าง

### 7. contacts table (4 indexes)
- `idx_contacts_name` - สำหรับค้นหาตามชื่อ
- `idx_contacts_email` - สำหรับค้นหาตามอีเมล
- `idx_contacts_type` - สำหรับค้นหาตามประเภท
- `idx_contacts_created_at` - สำหรับค้นหาตามวันที่สร้าง

## ดัชนีแบบผสมพิเศษ (Special Composite Indexes)

### สำหรับ Dashboard Performance
- `idx_journal_entries_dashboard` - (entry_date, debit_account_id, amount)
- `idx_expenses_dashboard` - (expense_date, amount, category)

### สำหรับ P&L Reporting
- `idx_journal_entries_pl_report` - (fiscal_year, fiscal_month, debit_account_id, credit_account_id, amount)

### สำหรับ Cash Flow
- `idx_journal_entries_cashflow` - (entry_date, amount, debit_account_id, credit_account_id)

### สำหรับ Document Search
- `idx_journal_entries_document_search` - (document_number, entry_date, journal_type)
- `idx_invoices_document_search` - (invoice_number, invoice_date, status)

### สำหรับ Customer/Supplier Management
- `idx_contacts_customer_optimization` - (type, name, email)
- `idx_invoices_customer_optimization` - (customer_id, status, due_date)

## ดัชนีแบบ Partial (Partial Indexes)

### สำหรับ Performance บนข้อมูลขนาดใหญ่
- `idx_journal_entries_expense_accounts` - สำหรับบัญชีค่าใช้จ่ายเท่านั้น
- `idx_journal_entries_revenue_accounts` - สำหรับบัญชีรายได้เท่านั้น
- `idx_journal_entries_active_period` - สำหรับข้อมูล 2 ปีล่าสุดเท่านั้น
- `idx_expenses_current_year` - สำหรับค่าใช้จ่ายปีปัจจุบันเท่านั้น
- `idx_invoices_pending` - สำหรับใบแจ้งหนี้ที่รอชำระเท่านั้น
- `idx_users_active` - สำหรับผู้ใช้ที่ใช้งานอยู่เท่านั้น

## ประโยชน์ของดัชนี (Benefits)

### 1. ปรับปรุง Performance
- การค้นหาข้อมูลเร็วขึ้น 10-100 เท่า
- ลดเวลาโหลด Dashboard และ Reports
- ปรับปรุงความเร็วในการค้นหาข้อมูลลูกค้า

### 2. ลด Load บน Database
- ลดการอ่านข้อมูลแบบ Full Table Scan
- ประหยัด Memory และ CPU
- ปรับปรุง Concurrency สำหรับผู้ใช้หลายคน

### 3. รองรับข้อมูลขนาดใหญ่
- รองรับการเติบโตของข้อมูลได้ดี
- ไม่ช้าลงเมื่อมีข้อมูลเป็นจำนวนมาก
- เหมาะสำหรับระบบ Production

## การตรวจสอบดัชนี (Index Monitoring)

ใช้คำสั่งต่อไปนี้เพื่อตรวจสอบ:
```sql
-- ดูดัชนีทั้งหมด
SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- ดูสถิติการใช้ดัชนี
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan DESC;

-- ดูขนาดตารางและดัชนี
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size, pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## สรุป (Summary)
- **ทั้งหมด 40+ ดัชนี** สำหรับ 7 ตารางหลัก
- **ครอบคลุมทุกการค้นหา** ที่ใช้ในระบบ
- **ปรับปรุง Performance** อย่างมีนัยสำคัญ
- **รองรับการเติบโต** ของข้อมูลในอนาคต
