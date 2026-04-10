# Operation Runbook

## Pre-Change Checklist

- Confirm latest backup exists
- Read `CORE_RULES.md` and `docs/RBAC_STANDARD.md`
- Confirm change is non-destructive
- Confirm rollback path

## Safe Deployment Sequence

1. Apply additive migration (if needed)
2. Deploy code
3. Verify critical routes
4. Verify journal write/read behavior
5. Verify RBAC access boundaries

## Critical Verification

- Login works for `superadmin`, `admin`, `user`
- Admin pages blocked for non-admin users
- Invoice/expense creation still posts journals correctly
- Dashboard reads expected values
- Governance checks pass:
  - `npm run check:knowledge`
  - `npm run check:consistency`
  - `npm test`

## Rollback Guidance

- Revert code changes first
- Keep data intact
- Apply compensating migration only if required
- Record incident in `docs/INCIDENT_LOG.md`

## Prohibited Recovery Actions

- No `DROP TABLE`
- No table recreation to fix column mismatch
- No mass destructive delete in production

