# Project Changelog (Behavioral)

Tracks meaningful behavior/architecture changes (not every small code diff).

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

