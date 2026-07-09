<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Key Next.js 16 differences (verified against bundled docs):
- `middleware.ts` is deprecated → use `proxy.ts` with an exported `proxy` function (nodejs runtime, edge not supported)
- `cookies()`, `headers()`, `params`, `searchParams` are async-only — always `await` them
- Turbopack is the default for dev and build
- `next lint` is removed; ESLint runs directly

# Project: WMS — warehouse management & ordering app

B2B ordering system for a disposable foodservice packaging distributor (sushi containers, PET cups, cutlery...). Customers order **by the case**; inventory is tracked in cases.

## Terminology (renamed 2026-07-08 at owner's request — was Category/Product before)
- **Product** = the grouping / product line (e.g. "Sushi Containers"). Table `products`. Just `name` + `sortOrder`.
- **Item** = the orderable SKU-level entry (e.g. "Sushi Tray Small"), stocked and sold by the case. Table `items`, FK `product_id`.
- Names are **single-field** (`name`, optional `detail`) — the earlier bilingual name_en/name_zh pairs were merged (Chinese preferred) in migration `20260709000100`. The bulk importer still accepts Chinese or English headers and takes whichever is filled (品名 wins over English name if both).

## Stack
Next.js 16 (App Router) + TypeScript + Prisma + PostgreSQL 17 (Docker locally, Neon in prod) + Tailwind v4 + zod. Hand-rolled auth: bcrypt password hashes, DB-backed sessions, httpOnly cookies. Deployed on Vercel, auto-deploy from `main`.

## Architectural decisions (agreed with the owner — do not silently change)
- **Accounts**: self-registration with admin approval. `User.accountStatus`: PENDING | APPROVED | DISABLED. Pending users can log in but only see an "awaiting approval" screen.
- **Roles**: ADMIN | CUSTOMER, enforced server-side on every route/action. Never trust the client.
- **Stock display**: customers see only In stock / Low / Out badges, never exact counts. Admins see exact counts.
- **Stock timing**: stock (in cases) is decremented at order submission inside a DB transaction with row locking (`SELECT ... FOR UPDATE`); restored if admin cancels. `CHECK (stock_cases >= 0)` as last line of defense.
- **Audit trail**: every stock change writes a StockAdjustment row (who, delta, reason, when). Order placement/cancellation writes there too.
- **Min order quantity** is per-item, in cases, validated server-side.
- SKU is optional and NOT a primary key.
- Order lines snapshot item name/SKU at purchase time so history survives item edits.

## Conventions
- All input validation with zod at every API boundary
- Quantities are integers only (cases are whole numbers)
- Work iteratively in phases; commit + push at each phase boundary; ask the owner before decisions with real tradeoffs

## Windows dev machine quirk
On the owner's work PC, `C:\Windows\System32\cmd.exe` is missing (IT policy). Before any npm/npx command set `$env:ComSpec = "C:\Windows\SysWOW64\cmd.exe"`.
