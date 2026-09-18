# Fix Tracking Checklist for Kiro / Development Team

## Audit status
This checklist is intended to track remediation work item by item after the audit review.

### Completed review items
- [x] Dependency manifest reviewed
- [x] Environment variables and secrets reviewed
- [x] Database connection security reviewed
- [x] JWT/session logic reviewed
- [x] Auth and route protection reviewed
- [x] Admin backup/export route reviewed
- [x] Destructive billing reset route reviewed
- [x] Recurring secret automation reviewed
- [x] Debug authentication route reviewed
- [x] Google OAuth handling reviewed
- [x] License logic reviewed
- [x] Dead scripts and cleanup artifacts reviewed
- [x] Sensitive backup archive review completed

## Priority 0: immediate stop / blocking fixes
- [ ] P0-01: Remove default JWT fallback secret and enforce required env secret at startup
  - Files involved: lib/auth.ts, proxy.ts, app/api/login/route.ts, lib/env.ts
  - Owner: backend/security
  - Status: not started
  - Evidence: secret fallback currently exists in multiple auth-related files

- [ ] P0-02: Lock down destructive admin endpoints and remove unsafe GET behavior
  - Files involved: app/api/reset_billing/route.ts
  - Owner: backend/security
  - Status: not started
  - Evidence: DELETE operations are invoked directly without strong authorization in the route

- [ ] P0-03: Remove or disable production debug auth route exposing password match and stack traces
  - Files involved: app/api/debug/auth/route.ts
  - Owner: backend/security
  - Status: not started
  - Evidence: route returns passwordMatch and raw error stack

- [ ] P0-04: Restrict sensitive data export to admin-only flow with audit logging
  - Files involved: app/api/admin/backup/route.ts
  - Owner: backend/security
  - Status: not started
  - Evidence: endpoint exports full sensitive tables without visible authorization gate

## Priority 1: security hardening
- [ ] P1-01: Re-enable strict PostgreSQL TLS validation
  - Files involved: lib/db.ts
  - Owner: backend/devops
  - Status: not started
  - Evidence: ssl.rejectUnauthorized is set to false

- [ ] P1-02: Reduce CORS exposure for auth endpoints
  - Files involved: app/api/auth/[...nextauth]/route.ts
  - Owner: backend/security
  - Status: not started
  - Evidence: Access-Control-Allow-Origin is set to *

- [ ] P1-03: Move OAuth secrets to secure storage and avoid rendering them in UI
  - Files involved: lib/google-server.ts, components/SettingsClient.tsx, app/actions/settings.ts
  - Owner: platform/security
  - Status: not started
  - Evidence: OAuth credentials and refresh token handling is spread across app and UI flows

- [ ] P1-04: Review and standardize authentication framework
  - Files involved: lib/auth.ts, proxy.ts, app/api/login/route.ts, app/api/auth/[...nextauth]/route.ts
  - Owner: backend/architecture
  - Status: not started
  - Evidence: custom JWT handling overlaps with NextAuth conventions and may lead to inconsistent enforcement

- [ ] P1-05: Review recurring secret automation and ensure it is not browser-exposed or loosely protected
  - Files involved: app/api/recurring/generate/route.ts, app/recurring/RecurringRunButton.tsx
  - Owner: backend/security
  - Status: not started
  - Evidence: secret is checked in a public API path and exposed in UI input flow

## Priority 2: correctness and operational hygiene
- [ ] P2-01: Validate the license verification logic and remove unsafe fallback assumptions
  - Files involved: lib/license-check.ts
  - Owner: backend
  - Status: not started

- [ ] P2-02: Review environment validation warnings and ensure fail-fast behavior for missing required settings
  - Files involved: lib/env.ts
  - Owner: backend
  - Status: not started

- [ ] P2-03: Verify admin membership and role enforcement across user creation and update actions
  - Files involved: app/admin/members/actions.ts
  - Owner: backend/security
  - Status: not started

- [ ] P2-04: Verify registration flow and licensing checks remain aligned with business policy
  - Files involved: app/register/actions.ts
  - Owner: backend/business logic
  - Status: not started

## Priority 3: repository cleanup and artifact management
- [ ] P3-01: Remove dead or unused JavaScript scripts from project root
  - Files involved: check_exp.js, check_inv.js, check_je.js, check-schema.js, cleanup.js, fix_wht.js, fix_wht_001.js, final-test.js, recover_wht.js, test-license.js
  - Owner: engineering
  - Status: not started

- [ ] P3-02: Remove secret-bearing artifact and rotate any exposed secret values
  - Files involved: secret.txt
  - Owner: security/devops
  - Status: not started

- [ ] P3-03: Move backup archives out of working repo or secure them in restricted storage
  - Files involved: bug-report.zip, db_cluster-06-01-2026@16-13-56.backup.gz, kvswppixjaswjmbevrha.storage.zip
  - Owner: engineering/security
  - Status: not started

## Dependency & version review
- [ ] V-01: Run dependency audit and patch known issues
  - Files involved: package.json
  - Owner: engineering
  - Status: not started

- [ ] V-02: Review Next.js and auth package upgrade path
  - Files involved: package.json
  - Owner: engineering
  - Status: not started

- [ ] V-03: Update stale production dependencies to supported patched versions
  - Files involved: package.json
  - Owner: engineering
  - Status: not started

## File review log
- [x] package.json
- [x] .env.example
- [x] .env.local
- [x] lib/env.ts
- [x] lib/db.ts
- [x] lib/auth.ts
- [x] proxy.ts
- [x] app/api/login/route.ts
- [x] app/api/logout/route.ts
- [x] app/api/auth/[...nextauth]/route.ts
- [x] app/api/debug/auth/route.ts
- [x] app/api/admin/backup/route.ts
- [x] app/api/reset_billing/route.ts
- [x] app/api/recurring/generate/route.ts
- [x] lib/google-server.ts
- [x] components/SettingsClient.tsx
- [x] app/actions/settings.ts
- [x] lib/license-check.ts
- [x] check_exp.js
- [x] check_inv.js
- [x] check_je.js
- [x] check-schema.js
- [x] cleanup.js
- [x] fix_wht.js
- [x] fix_wht_001.js
- [x] final-test.js
- [x] recover_wht.js
- [x] test-license.js
- [x] secret.txt
- [x] bug-report.zip
- [x] db_cluster-06-01-2026@16-13-56.backup.gz
- [x] kvswppixjaswjmbevrha.storage.zip

## Sign-off section
- Audit reviewed by: Kiro / verification role
- Risk classification: High
- Recommended escalation: Engineering leadership approval required before production deployment
