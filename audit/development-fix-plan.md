# Development Fix Plan

Date: 2026-09-16
Project: Micro-Account
Audience: Kiro / engineering team

## Objective
Implement the security and correctness fixes in priority order, beginning with the P0 items that present the highest operational and data risk.

## Priority order

### P0 — Immediate blocking issues

#### P0-01: Enforce required JWT secret and remove default secret fallback
Files:
- lib/auth.ts
- proxy.ts
- app/api/login/route.ts
- lib/env.ts

Action:
- Remove the fallback to "secret-key"
- Fail startup if NEXTAUTH_SECRET or AUTH_SECRET is missing
- Require environment validation before auth routes are used
- Ensure all session signing and verification use the validated secret

Acceptance criteria:
- No code path signs JWTs with a hardcoded default secret
- Startup fails clearly if secret configuration is missing

#### P0-02: Lock down destructive reset API and remove unsafe GET access
Files:
- app/api/reset_billing/route.ts

Action:
- Require authenticated admin session
- Validate user role explicitly before delete operations execute
- Remove destructive GET behavior if not needed
- Consider moving this logic to a restricted internal-only route or admin-only endpoint

Acceptance criteria:
- No destructive action is possible without validated admin access
- GET cannot trigger data deletion

#### P0-03: Remove debug auth endpoint from production usage
Files:
- app/api/debug/auth/route.ts

Action:
- Delete or disable the route in production
- Replace with generic auth error handling if diagnostics are required in development only
- Do not return passwordMatch status, user existence status, or stack traces

Acceptance criteria:
- Production builds do not expose debug auth details
- All errors are generic and non-sensitive

#### P0-04: Restrict backup/export API to authorized admins only
Files:
- app/api/admin/backup/route.ts

Action:
- Validate administrator access before exporting any tables
- Add logging for backup access
- Consider limiting export to a trusted environment or non-production usage only
- Remove broad table export unless absolutely required

Acceptance criteria:
- Only privileged users can download backups
- Sensitive business and user data is not exposed to unauthorized users

### P1 — Security hardening

#### P1-01: Restore strict TLS validation for PostgreSQL
Files:
- lib/db.ts

Action:
- Remove ssl.rejectUnauthorized: false
- Use provider-approved SSL configuration with proper verification

Acceptance criteria:
- Database connection validates certificates

#### P1-02: Restrict CORS for auth endpoints
Files:
- app/api/auth/[...nextauth]/route.ts

Action:
- Replace wildcard origin handling with an explicit allowlist
- Validate allowed origins for production and staging

Acceptance criteria:
- No unrestricted cross-origin access is allowed for auth-related API calls

#### P1-03: Secure Google OAuth handling and secret storage
Files:
- lib/google-server.ts
- app/actions/settings.ts
- components/SettingsClient.tsx

Action:
- Keep secrets in a secure secret manager or server-only environment
- Do not surface secrets in UI or front-end state unnecessarily
- Restrict credential access to privileged admin contexts

Acceptance criteria:
- Secret values are not exposed outside secure server-side storage

#### P1-04: Standardize authentication approach
Files:
- lib/auth.ts
- proxy.ts
- app/api/login/route.ts
- app/api/auth/[...nextauth]/route.ts

Action:
- Choose a single authentication strategy and align all session logic to that strategy
- Remove ambiguity between custom JWT handling and NextAuth patterns

Acceptance criteria:
- Session validation is consistent across all auth routes

#### P1-05: Harden recurring automation secret flow
Files:
- app/api/recurring/generate/route.ts
- app/recurring/RecurringRunButton.tsx

Action:
- Do not expose a recurring secret through the browser UI unless strictly required
- Keep automation token checks server-side and restricted to trusted internal flows
- Review whether cron or admin service calls should use a different, more secure method

Acceptance criteria:
- Secret-based automation is not exposed through the front-end in normal user flows

### P2 — Correctness and policy checks

#### P2-01: Validate license verification logic
Files:
- lib/license-check.ts

Action:
- Review assumptions around license status, machine fingerprinting, and tamper detection
- Confirm they are aligned with actual business policy

Acceptance criteria:
- License checks behave correctly under valid and invalid conditions

#### P2-02: Validate registration and user-limit logic
Files:
- app/register/actions.ts
- app/admin/members/actions.ts

Action:
- Verify state transitions and seat-limit behavior match the intended business rules
- Confirm admin and default account creation flows remain correct after security changes

Acceptance criteria:
- User creation and registration policies remain functional and consistent

### P3 — Cleanup and repository hygiene

#### P3-01: Remove dead project scripts
Files:
- check_exp.js
- check_inv.js
- check_je.js
- check-schema.js
- cleanup.js
- fix_wht.js
- fix_wht_001.js
- final-test.js
- recover_wht.js
- test-license.js

Action:
- Remove scripts that are not used by the application or build process
- Archive only if they are required for historical review

Acceptance criteria:
- Repo contains only active and required scripts

#### P3-02: Remove secret-bearing and sensitive artifacts from repo
Files:
- secret.txt
- bug-report.zip
- db_cluster-06-01-2026@16-13-56.backup.gz
- kvswppixjaswjmbevrha.storage.zip

Action:
- Move archives to secure storage if needed for records
- Remove secret files from the working tree
- Rotate any embedded credentials immediately if they are real

Acceptance criteria:
- No secret-bearing files remain in the active repo

### Version review
Files:
- package.json

Action:
- Run dependency audit
- Review Next.js and auth package update path
- Upgrade patched packages and remove stale security risk where practical

Acceptance criteria:
- Dependency inventory reflects supported and patched versions

## Worktracking summary
- P0: 4 items
- P1: 5 items
- P2: 2 items
- P3: 3 items
- Version review: 3 items

## Exit criteria for closure
The project is ready to close the remediation cycle only when:
- all P0 items are resolved and verified
- no sensitive route remains public in production
- secrets are managed outside the repository
- DB connections and auth flows use secure defaults
- dead files and backup artifacts are removed or secured
