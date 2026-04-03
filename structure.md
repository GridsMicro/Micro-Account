# Micro-Account โครงสร้างโครงการ

**ระบบบัญชี Micro-Account** - Next.js Accounting System with RBAC

---

## 📁 โครงสร้างโฟลเดอร์หลัก

```
Micro-Account/
├── .git/                          # Git repository
├── .vscode/                       # VS Code settings
├── app/                           # Next.js App Router
├── components/                    # React Components
├── docs/                          # Documentation
├── lib/                           # Library & Utilities
├── manual/                        # User Manual
├── public/                        # Static Assets
├── scripts/                       # Database & Utility Scripts
├── site/                          # Static Site Documentation
└── [Config Files]
```

---

## 📂 รายละเอียดโครงสร้าง

### Root Configuration Files
| ไฟล์ | รายละเอียด |
|------|-----------|
| `.cursorrules` | Cursor IDE rules |
| `.env.example` | Environment template |
| `.env.test` | Test environment |
| `.gitignore` | Git ignore rules |
| `README.md` | Project readme |
| `CORE_RULES.md` | Core development rules |
| `package.json` | NPM dependencies |
| `tsconfig.json` | TypeScript config |
| `next.config.ts` | Next.js config |
| `postcss.config.mjs` | PostCSS config |
| `eslint.config.mjs` | ESLint config |
| `auth.d.ts` | Auth type definitions |

---

### 📁 app/ - Next.js Application Routes (78 items)

#### Core Application Files
| ไฟล์ | รายละเอียด |
|------|-----------|
| `layout.tsx` | Root layout |
| `page.tsx` | Dashboard page |
| `globals.css` | Global styles |
| `favicon.ico` | Favicon |
| `actions.ts` | Server actions |
| `expense-actions.ts` | Expense actions |

#### Feature Modules
```
app/
├── accounting/
│   └── reconciliation/
│       └── page.tsx              # หน้าการกระทบยอดบัญชี
│
├── admin/                         # ระบบจัดการผู้ใช้ (RBAC)
│   ├── members/
│   │   ├── page.tsx              # รายการสมาชิก
│   │   ├── actions.ts            # Server actions
│   │   ├── new/
│   │   │   └── page.tsx          # เพิ่มสมาชิกใหม่
│   │   └── edit/[id]/
│   │       ├── page.tsx          # แก้ไขสมาชิก
│   │       └── EditMemberClient.tsx
│   ├── permissions/
│   │   └── page.tsx              # จัดการสิทธิ์
│   └── groups/
│       └── page.tsx              # จัดการกลุ่มผู้ใช้
│
├── api/                          # API Routes
│   ├── auth/[...nextauth]/
│   │   └── route.ts              # NextAuth endpoint
│   ├── contacts/
│   │   └── route.ts              # Contacts API
│   ├── db_schema/
│   │   └── route.ts              # Schema API
│   ├── import/
│   │   └── route.ts              # Import API
│   ├── inventory/
│   │   └── route.ts              # Inventory API
│   ├── invoices/
│   │   └── delete/
│   │       └── route.ts          # Delete invoice API
│   ├── recurring/
│   │   └── generate/
│   │       └── route.ts          # Generate recurring
│   ├── reset_billing/
│   │   └── route.ts              # Reset billing
│   └── settings/
│       └── route.ts              # Settings API
│
├── calendar/                     # ปฏิทิน
│   ├── page.tsx
│   └── CalendarClient.tsx
│
├── contacts/                     # รายชื่อ
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   └── edit/[id]/
│       ├── page.tsx
│       └── EditContactClient.tsx
│
├── expenses/                     # ค่าใช้จ่าย
│   └── page.tsx
│
├── inventory/                    # สินค้าคงคลัง
│   ├── page.tsx
│   ├── InventoryRowActions.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── edit/[id]/
│   │   ├── page.tsx
│   │   └── EditProductClient.tsx
│   └── categories/
│       ├── page.tsx
│       └── CategoryListClient.tsx
│
├── invoices/                     # ใบแจ้งหนี้
│   ├── page.tsx
│   ├── InvoiceRowActions.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── edit/[id]/
│   │   ├── page.tsx
│   │   └── EditInvoiceClient.tsx
│   └── preview/[id]/
│       ├── page.tsx
│       └── PrintButton.tsx
│
├── journals/                     # สมุดรายวัน
│   ├── page.tsx
│   ├── ExportButton.tsx
│   ├── JournalEntryRow.tsx
│   └── new/
│       ├── page.tsx
│       └── NewJournalClient.tsx
│
├── payments/                     # การชำระเงิน
│   ├── page.tsx
│   └── new/
│       └── page.tsx
│
├── profile/                      # โปรไฟล์ผู้ใช้
│   ├── page.tsx
│   └── actions.ts
│
├── quotations/                   # ใบเสนอราคา
│   ├── page.tsx
│   ├── QuotationRowActions.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── edit/[id]/
│   │   ├── page.tsx
│   │   └── EditQuotationClient.tsx
│   └── preview/[id]/
│       ├── page.tsx
│       └── PrintButton.tsx
│
├── receipts/                     # ใบเสร็จ
│   └── page.tsx
│
├── recurring/                    # รายการประจำ
│   ├── page.tsx
│   └── new/
│       └── page.tsx
│
├── register/                     # สมัครสมาชิก
│   ├── page.tsx
│   ├── actions.ts
│   ├── layout.tsx
│   └── components/
│       └── RegisterForm.tsx
│
├── reports/                      # รายงาน
│   ├── page.tsx
│   └── profit-loss/
│       └── page.tsx
│
├── settings/                     # ตั้งค่า
│   ├── page.tsx
│   ├── actions.ts
│   └── billing/
│       └── page.tsx
│
├── system-audit/                 # ตรวจสอบระบบ
│   └── route.ts
│
├── tax-reports/                  # รายงานภาษี
│   ├── page.tsx
│   └── page.tsx (withholding)
│
└── vouchers/                     # ใบสำคัญ
    ├── page.tsx
    ├── VoucherRowActions.tsx
    └── new/
        ├── page.tsx
        └── NewVoucherClient.tsx
```

---

### 📁 components/ - React Components (8 items)

| ไฟล์ | รายละเอียด |
|------|-----------|
| `GoogleDrivePicker.tsx` | Google Drive file picker |
| `LayoutWrapper.tsx` | Layout wrapper component |
| `Providers.tsx` | React context providers |
| `SettingsClient.tsx` | Settings client component |
| `Sidebar.tsx` | Navigation sidebar |
| `SyncMonthlyButton.tsx` | Monthly sync button |
| `ToastProvider.tsx` | Toast notifications |
| `WaitingRoom.tsx` | License waiting room |

---

### 📁 lib/ - Libraries & Utilities (14 items)

| ไฟล์ | รายละเอียด |
|------|-----------|
| `auth.config.ts` | Auth configuration |
| `auth.ts` | Authentication logic |
| `contacts.ts` | Contacts utilities |
| `db.ts` | Database connection |
| `env.ts` | Environment validation |
| `expenses.ts` | Expense utilities |
| `google-server.ts` | Google API server |
| `journaling.ts` | Journaling system |
| `license-check.ts` | License validation |
| `rd-api.ts` | RD API integration |
| `reports.ts` | Report generation |
| `settings.ts` | Settings utilities |
| `tax.ts` | Tax calculations |
| `utils.ts` | General utilities |

---

### 📁 scripts/ - Database & Migration Scripts (57 items)

#### Database Management
- `init-database.sql` - สร้างฐานข้อมูลเริ่มต้น
- `init_db.ts` - TypeScript DB initialization
- `init-chart-of-accounts.sql` - สร้างผังบัญชี

#### Schema & Migration
- `SCHEMA-FIX-SUMMARY.md` - สรุปการแก้ไข Schema
- `FINAL-SOLUTION-SUMMARY.md` - สรุปโซลูชั่นสุดท้าย
- `check_schema.ts` - ตรวจสอบ schema
- `migrate_*.ts` - Migration files (expenses, journals, products, etc.)
- `upgrade-products-table.sql` - อัพเกรดตารางสินค้า

#### RBAC & Security
- `fix-roles.sql` - แก้ไข roles
- `audit-schema.sql` - Schema สำหรับ audit log
- `create-licenses-table-final.sql` - สร้างตาราง licenses

#### Testing & Utilities
- `test-*.js/ts` - Test scripts (db, google, journaling, etc.)
- `check-db.js/ts` - DB checker
- `create_admin_user.ts` - สร้าง admin user
- `seed-basic-data.sql` - Seed ข้อมูลพื้นฐาน
- `create-indexes.sql` - สร้าง indexes

---

### 📁 site/ - Static Documentation Site (16 items)

```
site/
├── 404.html
├── index.html                    # หน้าหลัก documentation
├── sitemap.xml
├── sitemap.xml.gz
├── assets/
│   └── javascripts/
│       └── lunr/
│           ├── wordcut.js
│           └── tinyseg.js
├── docs/
│   ├── index.html
│   ├── accounting/
│   │   └── journals/
│   │       └── index.html
│   └── modules/
│       ├── getting-started/
│       │   └── index.html
│       └── setup-google/
│           └── index.html
├── invoice/
│   └── index.html
├── payment/
│   └── index.html
├── search/
│   └── index.html
├── settings/
│   └── index.html
└── tax/
    └── index.html
```

---

### 📁 docs/ - Documentation (1 item)
- `USER_MANUAL.md` - คู่มือผู้ใช้

### 📁 manual/ - User Manual (2 items)
- `manual.md` - Manual markdown
- `manual.html` - Manual HTML

### 📁 public/ - Static Assets (0 items)
- Empty public folder

---

## 🗄️ สรุปสถิติโครงการ

| หมวดหมู่ | จำนวน |
|---------|--------|
| ไฟล์ทั้งหมด | ~236 ไฟล์ |
| โฟลเดอร์ | 30+ โฟลเดอร์ |
| API Routes | 9 endpoints |
| Page Routes | 25+ pages |
| Components | 8 components |
| Library files | 14 utilities |
| SQL Scripts | 30+ scripts |
| Migration scripts | 15+ migrations |

---

## 🔧 เทคโนโลยีที่ใช้

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **RBAC**: Custom role-based access control
- **Audit**: Activity logging system
- **Google Integration**: Google Drive API
- **Tax Integration**: RD API (ไทย)

---

## 🔐 ระบบ RBAC (Role-Based Access Control)

โครงการนี้มีระบบ RBAC ที่สมบูรณ์:

1. **Groups & Permissions**: ระบบกลุ่มผู้ใช้แบบยืดหยุ่น
2. **ActivityLog**: บันทึกการเปลี่ยนแปลงทั้งหมด
3. **Role Gates**: API protection ด้วย withRoleGate()
4. **Dynamic UI**: แสดง/ซ่อน UI ตามสิทธิ์
5. **Audit Trail**: ตรวจสอบการกระทำทั้งหมด

---

*สร้างเมื่อ: April 3, 2026*
*โครงการ: Micro-Account System*
*เวอร์ชัน: Production Ready*
