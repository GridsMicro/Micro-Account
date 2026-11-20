# RBAC Standard (Canonical)

This document defines the single access-control standard for Micro-Account.

## Canonical Roles

- `superadmin`: full administrative control
- `admin`: administrative control for operations and configuration
- `user`: standard user access, constrained by assigned RBAC groups

Rules:
- Store roles in lowercase only.
- Do not introduce legacy role aliases from older revisions.
- Role labels in UI may be localized, but stored values must remain canonical.

## Canonical Permission Model

Permission source of truth is group-based RBAC:
- `groups`
- `group_permissions`
- `user_groups`

Actions:
- `create`
- `read`
- `update`
- `delete`
- `export`
- `manage`

## Authorization Policy

- Access checks must be permission-driven where module-level control exists.
- For administrative boundaries, use canonical helpers:
  - `normalizeRole()`
  - `canAccessAdmin()`

## Non-Destructive Change Policy

- Never reset, drop, or recreate production tables to "fix" schema mismatch.
- Use additive, backward-compatible migrations only.
- Preserve existing data and historical accounting evidence.

## Implementation Notes

- Canonical role helper file: `lib/core-standards.ts`
- **Server-side authorization boundary (2026-11-20): `lib/server-auth.ts`**
  - `requireActiveUser()` — verifies a real DB row with `status = "Active"` on every call (fail-closed 401/403/500)
  - `requirePermission(module, action)` — RBAC group permission + canonical admin bypass
  - `requireAdmin()` — canonical role (`superadmin`/`admin`) or group admin
  - `authErrorResponse()` / `authActionError()` — uniform denial results for API routes / Server Actions
  - `requireActionPermission(module, action)` / `requireActiveAction()` — thin helpers that return `null` on success or a `{ success: false, error }` value that can be returned directly from a Server Action
  - Apply at the top of **every** data-bearing Server Action (mutating or read) and sensitive API route; never rely on client-side gating
  - Module mapping used by the Server Actions: `invoices`, `quotations`, `journals`, `vouchers`/`payments`, `contacts`, `inventory` (products/categories), `services`, `calendar` (reminders), `settings` (COA + document patterns + Google Drive uploads), `reports` (AI audit)
  - Admin-only surface: `app/admin/members/actions.ts`, `GET /api/db_schema`, `PUT|DELETE /api/payroll/[id]` use `requireAdmin()` (DB-backed, not the JWT role)
  - Company settings exposed to clients go through `lib/company-public.ts` allowlist (`lib/security-rules.ts`) — secret columns are never selected
  - Regression guards: `tests/p0-security-guards.test.mjs` (structure) + `tests/p0-behavior.test.mjs` (executes rules, CSV import and transaction semantics)
- Master guardrail file: `CORE_RULES.md`

