# Architecture Overview

## Stack

- App: Next.js (App Router) + TypeScript
- Database: PostgreSQL (Neon)
- Auth: NextAuth credentials

## Core Modules

- Sales: quotations, invoices, payments
- Purchase: expenses, vouchers
- Accounting: journal entries + chart of accounts
- Access control: RBAC groups/permissions
- Settings/integrations: company settings + Google integration

## Canonical Data Flow

1. Business document created (`invoice`, `expense`, `payment_voucher`, `payment`)
2. Accounting entry generated in `journal_entries`
3. Reports/dashboard read normalized journal presentation
4. Access enforced by RBAC (`groups`, `group_permissions`, `user_groups`)

## Canonical Access Standard

- Role baseline: `superadmin`, `admin`, `user`
- Permission model: module/action via RBAC
- Helper standard: `lib/core-standards.ts`

## FX Rate Source (`/api/fx-rate`)

- Endpoint: `GET /api/fx-rate` → latest USD/THB + 30d series + trend (low/high/%change)
- Source: Bank of Thailand reference rate via `https://api.frankfurter.dev/v2` (`providers=BOT`)
- Server-side cache: latest 6h, series 24h (in-memory Map)
- Used by invoice creation "FX Mode": prefill `fxRate` and monitor currency movement before billing Dominick (markup 25% / USD cost per decision 2026-09-21)

## Stability Rules

- Preserve historical accounting evidence
- Backward compatibility required
- No destructive schema operations in production

