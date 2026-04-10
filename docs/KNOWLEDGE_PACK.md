# Micro-Account Knowledge Pack

This is the persistent knowledge system for the project.
All AI and human contributors should use this pack as the primary operational memory.

## Canonical Order (Read First)

1. `CORE_RULES.md`
2. `docs/RBAC_STANDARD.md`
3. `docs/BUSINESS_RULES.md`
4. `docs/ARCHITECTURE.md`
5. `docs/OPERATION_RUNBOOK.md`
6. `docs/DECISIONS.md`
7. `docs/INCIDENT_LOG.md`
8. `docs/CHANGELOG_PROJECT.md`

## Purpose of Each File

- `BUSINESS_RULES.md`: authoritative business/accounting/tax rules
- `ARCHITECTURE.md`: technical structure and data flow
- `OPERATION_RUNBOOK.md`: safe operating and recovery procedures
- `DECISIONS.md`: key architecture/product decisions and rationale
- `INCIDENT_LOG.md`: production incident history and postmortem notes
- `CHANGELOG_PROJECT.md`: meaningful behavior changes over time

## Update Policy

- Update these documents before or together with code changes.
- Keep entries short, factual, and date-stamped.
- Never remove incident history; append corrections.
- If documents conflict, `CORE_RULES.md` and `RBAC_STANDARD.md` win.
- PRs are expected to pass knowledge enforcement checks in:
  - `.github/workflows/knowledge-guard.yml`
  - `.github/pull_request_template.md`

