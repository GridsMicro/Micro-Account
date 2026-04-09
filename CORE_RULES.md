# =====================================================
# Micro-Account: Core System Rules & Blueprint
# Critical System Architecture and Guardrails
# Copyright (c) 2026 Micro-Account. All Rights Reserved.
# =====================================================

## 🚨 CRITICAL GUARDRAILS

### ❌ FORBIDDEN OPERATIONS
- **NEVER use `DROP TABLE` in production code
- **NEVER use `WIPE DATA` or `TRUNCATE TABLE` in production code
- **NEVER use `DELETE FROM table_name` without WHERE clause in production
- **NEVER modify existing column types in production tables
- **NEVER create new roles without explicit approval

### ⚠️ PROTECTED OPERATIONS
- **Database schema changes require migration scripts**
- **Role modifications must update both database and code logic**
- **Company settings changes must preserve existing data**
- **All fixes must be backward compatible**

---

## 📊 DATABASE SCHEMA (FINALIZED)

### expenses Table
**Purpose:** For tracking raw business costs (Marketing, Office supplies, Utilities). Must have amount field for dashboard calculations.
```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,                    -- Primary key for expense records
    title VARCHAR(255) NOT NULL,              -- Expense description/title
    category VARCHAR(100) NOT NULL DEFAULT 'อื่นๆ', -- Expense category
    amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- CRITICAL: Expense amount for dashboard
    expense_date DATE NOT NULL,              -- Date when expense was incurred
    reference_no VARCHAR(100),               -- Reference number for tracking
    notes TEXT,                               -- Additional notes about expense
    status VARCHAR(50) DEFAULT 'paid',       -- Payment status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### journal_entries Table
**Purpose:** For double-entry accounting records. Must have debit_account_id, credit_account_id, and amount fields for P&L calculations.
```sql
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,                    -- Primary key for journal entries
    entry_date DATE NOT NULL,                 -- Date of the accounting entry
    journal_type VARCHAR(20) NOT NULL,        -- Type of journal (sales, purchase, etc.)
    reference_type VARCHAR(50),               -- Type of reference document
    reference_id INTEGER,                     -- ID of the reference document
    description TEXT,                         -- Description of the accounting transaction
    debit_account_id INTEGER NOT NULL,       -- CRITICAL: Debit account ID from chart_of_accounts
    credit_account_id INTEGER NOT NULL,      -- CRITICAL: Credit account ID from chart_of_accounts
    amount DECIMAL(15,2) NOT NULL,           -- CRITICAL: Transaction amount for P&L
    vat_rate DECIMAL(5,2) DEFAULT 0,         -- VAT rate percentage (typically 7%)
    vat_amount DECIMAL(15,2) DEFAULT 0,      -- VAT amount calculated
    withholding_rate DECIMAL(5,2) DEFAULT 0,  -- Withholding tax rate percentage
    withholding_amount DECIMAL(15,2) DEFAULT 0, -- Withholding tax amount calculated
    fiscal_year INTEGER,                     -- Fiscal year for reporting
    fiscal_month INTEGER,                    -- Fiscal month for reporting
    document_number VARCHAR(50),             -- Document number (INV-xxx, QT-xxx)
    notes TEXT,                               -- Additional notes about the transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### chart_of_accounts Table
**Purpose:** The master list of account codes for double-entry accounting. All account IDs referenced in journal_entries must exist here.
```sql
CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,                    -- Primary key used as foreign key in journal_entries
    account_code INTEGER NOT NULL UNIQUE,     -- Unique account code (1111, 4110, 5110, etc.)
    account_name VARCHAR(255) NOT NULL,        -- Human-readable account name
    account_type VARCHAR(50) NOT NULL,         -- Account type (asset, liability, equity, revenue, expense)
    parent_account_id INTEGER REFERENCES chart_of_accounts(id), -- Self-reference for hierarchical accounts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### users Table
**Purpose:** System users with role-based access control. Only superadmin and admin roles allowed.
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                    -- Primary key for users
    name VARCHAR(255) NOT NULL,               -- User display name
    email VARCHAR(255) NOT NULL UNIQUE,       -- User email (unique login)
    password VARCHAR(255) NOT NULL,           -- Hashed password for authentication
    role VARCHAR(50) DEFAULT 'user',         -- CRITICAL: User role (superadmin, admin, user) - NO other roles allowed
    status VARCHAR(20) DEFAULT 'active',      -- User status (active, pending, inactive)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### company_settings Table
**Purpose:** Company branding, configuration settings, and Google Drive OAuth2 credentials for document storage.
```sql
CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY,                    -- Primary key for company settings
    company_name VARCHAR(255) NOT NULL DEFAULT 'Micro-Account', -- Company name displayed on dashboard
    tax_id VARCHAR(50) NOT NULL DEFAULT '',   -- Company tax identification number
    address TEXT,                              -- Company address for documents
    logo_url TEXT,                            -- URL to company logo for documents
    phone VARCHAR(50),                        -- Company phone number
    email VARCHAR(255),                       -- Company contact email
    website VARCHAR(255),                     -- Company website URL
    -- Google Drive OAuth2 Configuration (NEW 2026-04-04)
    google_client_id VARCHAR(255),           -- Google OAuth2 Client ID
    google_client_secret VARCHAR(255),       -- Google OAuth2 Client Secret
    google_refresh_token TEXT,               -- Google OAuth2 Refresh Token
    google_redirect_uri VARCHAR(255) DEFAULT 'https://developers.google.com/oauthplayground', -- OAuth2 Redirect URI
    google_drive_enabled BOOLEAN DEFAULT false, -- Enable OAuth2 mode (vs Service Account)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### invoices Table
**Purpose:** Customer invoices and billing records. Links to journal_entries for accounting.
```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,                    -- Primary key for invoices
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- Unique invoice number (INV-xxx format)
    customer_id INTEGER,                      -- Foreign key to contacts table
    net_amount DECIMAL(15,2) NOT NULL,        -- Net amount before VAT
    vat_amount DECIMAL(15,2) DEFAULT 0,       -- VAT amount calculated at 7%
    total_amount DECIMAL(15,2) NOT NULL,       -- Total amount including VAT
    invoice_date DATE NOT NULL,               -- Date invoice was issued
    due_date DATE,                            -- Payment due date
    status VARCHAR(20) DEFAULT 'pending',      -- Invoice status (pending, paid, overdue)
    notes TEXT,                               -- Additional notes about invoice
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### contacts Table
**Purpose:** Customer and supplier contact information. Referenced by invoices and other documents.
```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,                    -- Primary key for contacts
    name VARCHAR(255) NOT NULL,               -- Contact person or company name
    email VARCHAR(255),                       -- Contact email address
    phone VARCHAR(50),                        -- Contact phone number
    address TEXT,                             -- Contact address
    type VARCHAR(50) DEFAULT 'customer',      -- Contact type (customer, supplier, vendor)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 CRITICAL COLUMN REFERENCES

### Dashboard Queries
- **expenses.amount:** Used for monthly expense calculations
- **journal_entries.amount:** Used for P&L and cash flow calculations
- **journal_entries.debit_account_id:** Links to chart_of_accounts.id
- **journal_entries.credit_account_id:** Links to chart_of_accounts.id

### Foreign Key Relationships
- **journal_entries.debit_account_id → chart_of_accounts.id**
- **journal_entries.credit_account_id → chart_of_accounts.id**
- **invoices.customer_id → contacts.id**
- **chart_of_accounts.parent_account_id → chart_of_accounts.id**

---

## 👥 ROLE SYSTEM (STRICT DEFINITION)

### Allowed Roles
- **superadmin:** Full system access, can manage all users and settings
- **admin:** Standard admin access, can manage most features but not user roles
- **user:** Standard user access, can use basic features

### Role Hierarchy
```
superadmin > admin > user
```

### Role Validation Rules
- All role checks MUST use exact lowercase strings: `'superadmin'`, `'admin'`, `'user'`
- NO underscore roles: `SUPER_ADMIN`, `USER_ADMIN`, etc.
- Role-based UI rendering in Sidebar.tsx is mandatory
- Database role field must match code logic exactly

---

## 🔐 DYNAMIC RBAC GROUPS SYSTEM (IMPLEMENTED)

### Overview
Dynamic Role-Based Access Control system with granular group permissions. Replaces hardcoded roles with flexible group-based permissions.

### System Groups (Pre-defined)
| Group ID | Group Name | Description |
|----------|------------|-------------|
| 1 | Super Administrators | Full access + system management |
| 2 | Administrators | Full access except system groups |
| 3 | Accountants | Invoices, Journals, Vouchers, Reports |
| 4 | Sales Staff | Quotations, Invoices, Contacts |
| 5 | Warehouse Staff | Inventory, Expenses (read) |
| 6 | Viewers | Read-only all modules |

### Permission Actions
- **create** - Can add new records
- **read** - Can view records
- **update** - Can edit records
- **delete** - Can remove records
- **export** - Can export Excel/PDF
- **manage** - Can manage sub-features

### Modules (18 total)
Dashboard, Quotations, Invoices, Recurring, Receipts, Inventory, Expenses, Journals, Vouchers, Contacts, Payments, Tax Reports, Reports, Calendar, Settings, Member Management, Permissions, Groups

### Database Tables
```sql
-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    is_system BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group permissions table
CREATE TABLE group_permissions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    can_manage BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, module)
);

-- User groups assignment table
CREATE TABLE user_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Activity log table
CREATE TABLE activity_log (
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
```

### API Endpoints
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/[id]` - Get group details
- `PUT /api/groups/[id]` - Update group
- `DELETE /api/groups/[id]` - Delete group
- `GET /api/groups/[id]/permissions` - Get group permissions
- `PUT /api/groups/[id]/permissions` - Update group permissions
- `GET /api/users/[id]/groups` - Get user's groups
- `POST /api/users/[id]/groups` - Assign user to groups
- `GET /api/users` - List all users with groups
- `GET /api/user/permissions` - Get current user's permissions

### UI Components
- `/admin/groups` - Groups management page (create, edit, delete, set permissions)
- `/admin/members` - Member management with group assignment modal
- `PermissionGate.tsx` - Permission gate component for client-side checks
- Sidebar updated with Groups management link

### Access Control
- **Super Admin**: Full control including system groups (ID: 1)
- **Admin**: Can create/manage custom groups (ID: 2)
- **Users**: Inherit permissions from assigned groups
- **System Groups**: Protected from deletion (only Super Admin can modify)

### Migration
**File:** `scripts/migrate_rbac_groups.sql`
- Creates all 4 tables
- Inserts 6 system groups with permissions
- Migrates existing users to groups based on role
- Sets up activity logging

### Implementation Date
**Completed:** April 4, 2026
**Status:** PRODUCTION READY

---

## 🏢 COMPANY SETTINGS (REQUIRED)
- **company_name:** VARCHAR(255) - Display name on dashboard
- **tax_id:** VARCHAR(50) - Company tax identification
- **address:** TEXT - Company address
- **logo_url:** TEXT - Company logo URL
- **phone:** VARCHAR(50) - Company phone
- **email:** VARCHAR(255) - Company email
- **website:** VARCHAR(255) - Company website

---

## 🔧 MAINTENANCE RULES

### Schema Changes
1. **Create Migration Script:** `scripts/migrations/` with version numbers
2. **Use ALTER TABLE:** For schema modifications, never recreate
3. **Backup Data:** Always backup before major changes
4. **Test Migrations:** Verify in staging before production

### Code Deployment
1. **Database First:** Ensure database is ready before code changes
2. **Test Queries:** Verify all queries work with new schema
3. **No Data Loss:** Never implement changes that wipe user data
4. **Rollback Plan:** Always have rollback strategy

---

## 🚨 EMERGENCY PROCEDURES

### If Data is Accidentally Wiped
1. **STOP IMMEDIATELY:** Do not continue with deployment
2. **RESTORE FROM BACKUP:** Use latest database backup
3. **INVESTIGATE:** Root cause analysis required
4. **PREVENT RECURRENCE:** Update procedures to prevent future occurrences

### Data Recovery Script
```sql
-- Emergency data restoration (run ONLY if data wiped)
INSERT INTO company_settings (company_name, tax_id, address) 
VALUES ('Micro-Account Professional', '123456789012', '123 Accounting Street, Bangkok, Thailand')
ON CONFLICT (company_name) DO UPDATE SET 
  tax_id = EXCLUDED.tax_id,
  address = EXCLUDED.address;
```

---

## 📋 FINAL MEMBER AUDIT CHECKLIST

### Before Sign-Off Verification
- [ ] Verify all 3 users have correct roles: `superadmin`/`admin`
- [ ] Confirm `grids@microtronic.biz` shows role `superadmin`
- [ ] Confirm `neon13@microtronic.biz` shows role `admin`
- [ ] Confirm no `SUPER_ADMIN` roles exist in database
- [ ] Verify dashboard shows real data (not ฿0 if expenses exist)
- [ ] Test all admin functionality with both roles
- [ ] Confirm company settings display correctly on dashboard

### System Health Indicators
- ✅ **All Users Access:** Admin panel accessible to authorized users
- ✅ **Data Integrity:** No accidental data loss
- ✅ **Role Consistency:** Code and database roles match
- ✅ **UI Functionality:** All features working as expected
- ✅ **Production Ready:** System safe for commercial use

---

## 🎯 DEVELOPMENT GUIDELINES

### Code Standards
- **TypeScript Required:** All new code must have proper types
- **Error Handling:** All database operations must have try-catch
- **Logging:** Use structured logging, not console.log for debugging
- **Testing:** All features must work with sample data
- **Documentation:** Update this file for any architectural changes

### AI Development Rules
- **READ CORE_RULES.md:** Always review before making changes
- **NEVER MODIFY ROLES:** Without updating this blueprint
- **NEVER WIPE DATA:** Use migrations instead of destructive operations
- **PRESERVE USER DATA:** Commercial systems must protect client data

---

## 📞 CONTACT & ESCALATION

### System Architecture Questions
- **Database Issues:** Contact database administrator
- **Role Problems:** Contact system architect
- **Security Concerns:** Contact security team immediately
### Permission Actions
- **create** - Can add new records
- **read** - Can view records
- **update** - Can edit records
- **delete** - Can remove records
- **export** - Can export Excel/PDF
- **manage** - Can manage sub-features

### Modules (18 total)
Dashboard, Quotations, Invoices, Recurring, Receipts, Inventory, Expenses, Journals, Vouchers, Contacts, Payments, Tax Reports, Reports, Calendar, Settings, Member Management, Permissions, Groups

### Database Tables
```sql
-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    is_system BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group permissions table
CREATE TABLE group_permissions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    can_manage BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, module)
);

-- User groups assignment table
CREATE TABLE user_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Activity log table
CREATE TABLE activity_log (
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
```

### API Endpoints
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/[id]` - Get group details
- `PUT /api/groups/[id]` - Update group
- `DELETE /api/groups/[id]` - Delete group
- `GET /api/groups/[id]/permissions` - Get group permissions
- `PUT /api/groups/[id]/permissions` - Update group permissions
- `GET /api/users/[id]/groups` - Get user's groups
- `POST /api/users/[id]/groups` - Assign user to groups
- `GET /api/users` - List all users with groups
- `GET /api/user/permissions` - Get current user's permissions

### UI Components
- `/admin/groups` - Groups management page (create, edit, delete, set permissions)
- `/admin/members` - Member management with group assignment modal
- `PermissionGate.tsx` - Permission gate component for client-side checks
- Sidebar updated with Groups management link

### Access Control
- **Super Admin**: Full control including system groups (ID: 1)
- **Admin**: Can create/manage custom groups (ID: 2)
- **Users**: Inherit permissions from assigned groups
- **System Groups**: Protected from deletion (only Super Admin can modify)

### Migration
**File:** `scripts/migrate_rbac_groups.sql`
- Creates all 4 tables
- Inserts 6 system groups with permissions
- Migrates existing users to groups based on role
- Sets up activity logging

### Implementation Date
**Completed:** April 4, 2026
**Status:** PRODUCTION READY

---

## 🏢 COMPANY SETTINGS (REQUIRED)
- **company_name:** VARCHAR(255) - Display name on dashboard
- **tax_id:** VARCHAR(50) - Company tax identification
- **address:** TEXT - Company address
- **logo_url:** TEXT - Company logo URL
- **phone:** VARCHAR(50) - Company phone
- **email:** VARCHAR(255) - Company email
- **website:** VARCHAR(255) - Company website

---

## 🔧 MAINTENANCE RULES

### Schema Changes
1. **Create Migration Script:** `scripts/migrations/` with version numbers
2. **Use ALTER TABLE:** For schema modifications, never recreate
3. **Backup Data:** Always backup before major changes
4. **Test Migrations:** Verify in staging before production

### Code Deployment
1. **Database First:** Ensure database is ready before code changes
2. **Test Queries:** Verify all queries work with new schema
3. **No Data Loss:** Never implement changes that wipe user data
4. **Rollback Plan:** Always have rollback strategy

---

## 🚨 EMERGENCY PROCEDURES

### If Data is Accidentally Wiped
1. **STOP IMMEDIATELY:** Do not continue with deployment
2. **RESTORE FROM BACKUP:** Use latest database backup
3. **INVESTIGATE:** Root cause analysis required
4. **PREVENT RECURRENCE:** Update procedures to prevent future occurrences

### Data Recovery Script
```sql
-- Emergency data restoration (run ONLY if data wiped)
INSERT INTO company_settings (company_name, tax_id, address) 
VALUES ('Micro-Account Professional', '123456789012', '123 Accounting Street, Bangkok, Thailand')
ON CONFLICT (company_name) DO UPDATE SET 
  tax_id = EXCLUDED.tax_id,
  address = EXCLUDED.address;
```

---

## 📋 FINAL MEMBER AUDIT CHECKLIST

### Before Sign-Off Verification
- [ ] Verify all 3 users have correct roles: `superadmin`/`admin`
- [ ] Confirm `grids@microtronic.biz` shows role `superadmin`
- [ ] Confirm `neon13@microtronic.biz` shows role `admin`
- [ ] Confirm no `SUPER_ADMIN` roles exist in database
- [ ] Verify dashboard shows real data (not ฿0 if expenses exist)
- [ ] Test all admin functionality with both roles
- [ ] Confirm company settings display correctly on dashboard

### System Health Indicators
- ✅ **All Users Access:** Admin panel accessible to authorized users
- ✅ **Data Integrity:** No accidental data loss
- ✅ **Role Consistency:** Code and database roles match
- ✅ **UI Functionality:** All features working as expected
- ✅ **Production Ready:** System safe for commercial use

---

## 🎯 DEVELOPMENT GUIDELINES

### Code Standards
- **TypeScript Required:** All new code must have proper types
- **Error Handling:** All database operations must have try-catch
- **Logging:** Use structured logging, not console.log for debugging
- **Testing:** All features must work with sample data
- **Documentation:** Update this file for any architectural changes

### AI Development Rules
- **READ CORE_RULES.md:** Always review before making changes
- **NEVER MODIFY ROLES:** Without updating this blueprint
- **NEVER WIPE DATA:** Use migrations instead of destructive operations
- **PRESERVE USER DATA:** Commercial systems must protect client data

---

## 📞 CONTACT & ESCALATION

### System Architecture Questions
- **Database Issues:** Contact database administrator
- **Role Problems:** Contact system architect
- **Security Concerns:** Contact security team immediately
- **Data Recovery:** Contact database administrator with backup requirements

### Emergency Contacts
- **Database Admin:** For schema and migration issues
- **System Architect:** For role and permission problems
- **Security Team:** For authentication and authorization issues

---

## 📜 RECENT CHANGES & HISTORY

### 2026-04-09 - Dragon AI Brain Upgrade & Business Model Finalization
**Features Added:**
- ✅ **Dragon AI Side Assistant** - Redesigned the AI chat to a side-panel layout with minimize/maximize functionality.
- ✅ **Knowledge Cloning** - Synchronized the in-app AI with business-specific context (Intermediary model, key partners).
- ✅ **Side-by-Side Workflow** - Optimized UI for accounting work (scanning documents while consulting AI).

**Business Rules Established:**
- **Model:** Intermediary (Agent) business model.
- **WHT Policy:** Fixed at **3%** for software license services (Renews/Provisioning).
- **Accounts:** Standardized 5110 (Cost) and 4110 (Revenue) for renewal operations.
- **Key Partners:** Noventiq (Supplier - Teechada P.) and MICROTRONIC (B2B Customer).

**Files Modified:**
- `components/GlobalAiChat.tsx` - Full UI/UX Overhaul.
- `app/api/ai/accounting/route.ts` - Brain Upgrade (Context Injection).
- `docs/BUSINESS_CONTEXT.md` - New persistent knowledge base.
- `components/Sidebar.tsx` - Restored Contacts menu.

---

### 2026-04-04 - Google Drive OAuth2 Integration
**Features Added:**
- ✅ **Google Drive OAuth2 Settings Page** (`/settings`) - New tab for configuring OAuth2 credentials
- ✅ **Database Migration** - Added columns to `company_settings`: `google_client_id`, `google_client_secret`, `google_refresh_token`, `google_redirect_uri`, `google_drive_enabled`
- ✅ **Updated google-server.ts** - Now reads OAuth2 credentials from database (priority 1) with fallback to environment variables
- ✅ **Voucher Monthly Summary** - Added monthly summary report, history view, and print functionality to `/vouchers`
- ✅ **WHT Withholding Tax** - Added 3% WHT deduction feature to voucher creation form

**Files Modified:**
- `components/SettingsClient.tsx` - Added Google Drive OAuth2 configuration UI
- `app/actions.ts` - Updated `updateCompanySettings` to handle new OAuth2 fields
- `lib/google-server.ts` - Refactored to support database-driven OAuth2 configuration
- `app/vouchers/page.tsx` - Converted to client component with monthly summary features
- `app/vouchers/new/NewVoucherClient.tsx` - Added WHT withholding tax feature

**Migration:**
- Created: `migrations/add_google_oauth2_columns.sql`

---

### 2026-04-08 - Invoice Journal Stability Rules
**Rules Added:**
- `chart_of_accounts` is the accounting master. `accounts` is legacy compatibility only.
- For invoice journals, `reference_no` and `document_number` must both equal the real invoice number such as `INV26-003`.
- Standard invoice posting is one pattern only:
  - Debit `1121 ลูกหนี้การค้าทั่วไป`
  - Credit `4110 รายได้จากการขายสินค้าทั่วไป` for net amount
  - Credit `2121 ภาษีมูลค่าเพิ่มที่ต้องจ่าย` for VAT amount
- Do not re-enable duplicate revenue shadow rows like `รายได้จากใบแจ้งหนี้ #...` when they mirror the same A/R and revenue amount.
- UI, dashboard, journals, and exports must read mixed legacy/modern journal rows through the shared compatibility layer in `lib/journaling.ts`.
- Dashboard monthly profit must use accrual basis by `issue_date`, not a paid-only cash basis.
- Historical evidence must be preserved. Prefer presentation normalization first and targeted cleanup only when a specific broken posting is confirmed.

**Files to Respect:**
- `lib/journaling.ts`
- `app/journals/page.tsx`
- `app/actions.ts`
- `app/page.tsx`
- `lib/reports.ts`
