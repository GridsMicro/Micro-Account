# Micro-Account Scripts & Database Reference

⚠️ **ATTENTION ALL AI ASSISTANTS:**
This folder has been cleaned up to prevent confusion between legacy (Era 1) and modern (Era 2) architectures.

### 📜 Source of Truth
- **`CURRENT_SCHEMA_MASTER.sql`**: This is the ONLY file you should read to understand the current database structure. It includes all tables, modern entity linking (invoice_id, expense_id), and updated journaling logic.
- **`init-chart-of-accounts.sql`**: The standard Chart of Accounts used for double-entry bookkeeping.

### 🚫 Rules:
1. **DO NOT** use any scripts ending in `.js` or legacy SQL files (most have been deleted).
2. **DO NOT** assume the old schema where debit/credit were separate columns for each total amount; we now use `debit_account_id` and `credit_account_id` pointing to the COA.
3. Always verify against `CURRENT_SCHEMA_MASTER.sql` before suggesting any database changes.

---
*Cleaned and Managed by Antigravity AI - April 2026*
