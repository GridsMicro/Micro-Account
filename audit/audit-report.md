# Audit Report for Management Review

Date: 2026-09-16
Project: Micro-Account
Prepared for: Management / product owner / engineering leadership
Review scope: Security, correctness, dependency risk, and cleanup review

## Executive summary
This review identified a number of significant security and correctness risks that should be treated as blocking items before wider production rollout or continued operational use.

The main concerns are concentrated in four areas:
- authentication and session security
- admin and destructive APIs
- export / backup exposure
- repository hygiene and secret exposure

## Overall assessment
Risk level: High
Production readiness: Not ready without remediation

## Key findings

### 1) Authentication and token security
Finding:
JWT secret handling is not hardened. Several files rely on a fallback secret value instead of enforcing a required environment variable.

Affected files:
- lib/auth.ts
- proxy.ts
- app/api/login/route.ts

Impact:
If the environment is misconfigured or secrets are missing, tokens may be signed with a predictable default value, creating a high risk of session forgery.

Priority: Critical

### 2) Destructive reset actions are exposed without strong authorization
Finding:
The reset billing endpoint deletes accounting data without obvious admin-only gating.

Affected file:
- app/api/reset_billing/route.ts

Impact:
A malicious or accidental request could remove critical accounting data in a single request.

Priority: Critical

### 3) Backup/export route exposes business and user data
Finding:
The backup route exports data from multiple sensitive tables with no visible authorization gate.

Affected file:
- app/api/admin/backup/route.ts

Impact:
This creates a direct data exposure path for financial records, customer data, user accounts, and operational records.

Priority: Critical

### 4) Debug authentication endpoint leaks system information
Finding:
A debug route confirms account existence and password match status and returns stack traces.

Affected file:
- app/api/debug/auth/route.ts

Impact:
This increases the attack surface for credential guessing and reconnaissance.

Priority: Critical

### 5) Database connection security is weakened
Finding:
The PostgreSQL pool disables TLS certificate verification.

Affected file:
- lib/db.ts

Impact:
This weakens the trust boundary between the app and database and increases the chance of tampering or interception in insecure networks.

Priority: High

### 6) CORS is overly broad for auth APIs
Finding:
Wildcard CORS is enabled in the auth route.

Affected file:
- app/api/auth/[...nextauth]/route.ts

Impact:
This broadens cross-origin access beyond what is appropriate for authenticated APIs.

Priority: High

### 7) Sensitive OAuth credentials are exposed across application surfaces
Finding:
Google OAuth secrets and refresh tokens are handled in settings flows and stored across application layers.

Affected files:
- lib/google-server.ts
- app/actions/settings.ts
- components/SettingsClient.tsx
- .env.local

Impact:
This increases the chance of secret leakage and complicates secure rotation.

Priority: High

### 8) Dead-code and backup artifacts remain in the project tree
Finding:
Several legacy scripts, backups, and sensitive artifacts remain in the repository root.

Affected files:
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
- secret.txt
- bug-report.zip
- db_cluster-06-01-2026@16-13-56.backup.gz
- kvswppixjaswjmbevrha.storage.zip

Impact:
This increases security risk, makes the project harder to maintain, and may expose historical data or secrets.

Priority: Medium

## Files reviewed
- package.json
- .env.example
- .env.local
- lib/env.ts
- lib/db.ts
- lib/auth.ts
- proxy.ts
- app/api/login/route.ts
- app/api/logout/route.ts
- app/api/auth/[...nextauth]/route.ts
- app/api/debug/auth/route.ts
- app/api/admin/backup/route.ts
- app/api/reset_billing/route.ts
- app/api/recurring/generate/route.ts
- lib/google-server.ts
- components/SettingsClient.tsx
- app/actions/settings.ts
- lib/license-check.ts
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
- secret.txt
- bug-report.zip
- db_cluster-06-01-2026@16-13-56.backup.gz
- kvswppixjaswjmbevrha.storage.zip

## Recommended remediation path
1. Enforce required secret configuration and remove default fallback secrets.
2. Restrict destructive APIs to admin-only authentication and remove unsafe GET access.
3. Remove or disable debug auth endpoints in production.
4. Restore proper TLS validation for database connections.
5. Restrict CORS and sensitive admin exports.
6. Remove dead scripts and secret-bearing artifacts from the repo.
7. Run regular dependency security checks and apply patch updates.

## Management conclusion
The application should not be considered production-ready without remediation of the security issues above. These are not cosmetic concerns; they affect trust, data integrity, and operational safety.

Kiro responsibility: validate correctness and security posture; implementation of remediation should occur after this review is accepted by engineering leadership.
