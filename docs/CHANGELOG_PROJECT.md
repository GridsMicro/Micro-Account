# Project Changelog (Behavioral)

Tracks meaningful behavior/architecture changes (not every small code diff).

## [2026-11-20]

- Extended the server-side authorization boundary to **every data-bearing Server Action** (invoices, quotations, journals, contacts, products, vouchers, services, reminders, COA, AI audit, Google Drive) and to the remaining sensitive API routes (company, payments, db_schema, ai/accounting, inventory, fx-rate, modules, payroll/[id], user/permissions); member management now checks admin from the DB instead of the JWT role
- `company_settings` is no longer read with `SELECT *` on client-facing paths: new `lib/company-public.ts` + allowlist in `lib/security-rules.ts` drop OAuth/RD/App-Password columns (new unknown columns are excluded by default); `/settings` also strips secret values before passing data into the Client Component (only `*_present` flags are serialized)
- CSV import is atomic: validation is separated into `lib/csv-import.ts`, writes run inside `withTransaction()` using `RETURNING id` (never `i + 1`), journal failures throw and roll back the whole file
- Added `tests/p0-behavior.test.mjs` — behavioral tests that execute the rules, CSV parser/importer (with an injected fake client) and `withTransaction()` (BEGIN/COMMIT/ROLLBACK/release); `npm test` now runs with the tsx loader (35/35 pass)
- Refactored the pure security rules (`isActiveStatus`, company-column allowlist, `assertPeriod`) into `lib/security-rules.ts` so both production and tests share one implementation
- Added `lib/server-auth.ts` as the single server-side authorization boundary: fresh DB status/role on every call, canonical admin bypass, fail-closed denials; applied to mutating actions (settings, tax reports, expenses) and sensitive API routes
- Login now accepts only `Active` accounts, returns one generic error for all failures, stops logging identity/password-match details, and embeds `status: "Active"` in the JWT; `proxy.ts` and `lib/auth.ts` verify that claim; root layout withholds page content from non-Active accounts
- Expense create/update/delete are now atomic with their journal entries via `withTransaction()`; INSERT uses the real `title` column and no longer writes a non-existent `vendor` column; all journal writes check `success`
- ภ.พ.30 preflight counters propagate query errors (fail-closed) and filing validates the month/year period before submitting
- Added read-only additive migration `migrations/2026-11-20_expenses_title_compatibility.sql` for legacy DBs (not executed) and `tests/p0-security-guards.test.mjs` regression guards

## [2026-11-19]

- Fixed the inactive "ลืมรหัสผ่าน?" button on `/login` (was a plain `<button>` with no handler): now links to a full forgot/reset password flow
- Added `/forgot-password` + `/reset-password` pages and `POST /api/auth/forgot-password` / `POST /api/auth/reset-password` (SHA-256 token hash, 30-minute expiry, single-use, transactional password update, anti-enumeration responses, 3 requests/minute guard)
- Added `lib/mailer.ts` — minimal Gmail SMTP (port 465, implicit TLS) via Node built-in `tls`, no new npm dependency; `lib/passwordReset.ts` for token helpers and read-only schema check
- Added `scripts/migrations/001_password_reset_tokens.sql`, public paths in `proxy.ts`, `.env.example` notes, and `docs/PASSWORD_RESET.md` — operator approval required before running the migration or sending real email

## [2026-11-18]

- Added read-only smart tax alerts (`lib/taxNotifications.ts`) shown on `/calendar`, in AI audit, and via optional LINE Notify (`TAX_LINE_TOKEN`); cron `tax:update` no longer has an empty notification TODO
- Corrected input-VAT data: expenses table now ensures `tax_deductible` / `pp36_exempt` / `withholding_tax_amount`; VAT > 0 requires tax invoice number + date; VAT is only claimable after explicit user confirmation; legacy records editable via `ExpenseTaxEditor` without deleting/recreating journals; `/tax-reports` warns about unclaimed/incomplete docs
- Replaced mock RD integration with real RD Open API (`lib/rd-api.ts`): `submit-filing-auth`, `submit-form` (PP30), `result-form`, `receipt-form`, `payin-form`, `cancel-form`; removed fake-success `batchSubmitToRDPortal`; added status sync into `tax_filing_submissions` and a status table on `/tax-reports`; submission requires typed confirmation and valid config
- Fixed missing closing brace in `jobs/scheduleTaxUpdate.ts` introduced by the smart-alert edit

## [2026-09-21]

- Added FX Rate Monitor: `GET /api/fx-rate` serves latest USD/THB (BOT reference via frankfurter.dev) with 30d series + trend; invoice creation page shows a live FX widget and "Use Latest Rate" button to prefill the markup calculator's exchange rate (supports FX-based billing, see DECISIONS Dominick markup 25%)
- Invoice markup calculator now supports FX mode: USD cost × rate × markup → THB price, and records the rate used into the line detail for evidence

## [2026-04-09]

- Standardized role model to canonical `superadmin/admin/user`
- Centralized role helper in `lib/core-standards.ts`
- Removed duplicate global AI chat rendering
- Removed dead sidebar routes without real pages
- Restored admin checks in user/group APIs (removed temporary bypass)
- Added persistent knowledge system documents under `docs/`
- Added governance enforcement:
  - PR/CI knowledge guard
  - Weekly docs-code consistency audit workflow
  - Node test coverage for governance guards
- Hardened RBAC endpoints:
  - invoice delete authorization uses canonical admin helper
  - group permissions update now uses atomic DB transaction with one client
- Added module extensibility baseline:
  - canonical module registry (`lib/module-registry.ts`)
  - module discovery API (`GET /api/modules`)
  - sidebar now renders from shared registry
  - RBAC group permission page now uses shared permission modules
  - added `services` and `payroll` routes for menu completeness

