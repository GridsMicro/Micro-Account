# Business Rules (Canonical)

## Business Model

- Operating model: intermediary/agent model
- Supplier invoice recognized as cost
- Customer invoice recognized as revenue

## Accounting Rules

- Double-entry is mandatory for business events
- Canonical journal mapping uses:
  - `debit_account_id`
  - `credit_account_id`
  - `amount`

## Tax Rules (Current Policy)

- VAT policy follows configured company settings
- WHT operational default is 3% for supported service flows
- Any exception policy must be documented here before implementation

## Role and Access Rules

- Canonical roles only: `superadmin`, `admin`, `user`
- Access rights derive from RBAC group assignment

## Data Protection Rules

- No destructive data operations in production
- Historical accounting evidence must be preserved
- Migrations must be additive/backward-compatible

## Change Control

- Update this file when business logic changes
- Link related code changes and decision entries in `docs/DECISIONS.md`

