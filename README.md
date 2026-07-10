# WMS — Warehouse Management & Ordering

B2B ordering system for a disposable foodservice packaging distributor. Customers order **by the case**; inventory is tracked in cases.

Terminology: a **Product** is a grouping/product line (e.g. "Sushi Containers"); an **Item** is the orderable SKU under a product, stocked and sold by the case.

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 7 · PostgreSQL 17 · Tailwind v4 · zod

Auth is hand-rolled: bcrypt password hashes, DB-backed sessions, httpOnly cookies. Roles (`ADMIN` / `CUSTOMER`) and account approval status are enforced server-side on every route and action.

## Prerequisites

- Node.js 20.9+ (LTS recommended)
- Docker Desktop (for the local Postgres database only — the app runs natively)

## Setup

```bash
git clone https://github.com/andre31517912/wms.git
cd wms
npm install
cp .env.example .env        # then edit: generate a real SESSION_SECRET
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Run (the full loop)

```bash
docker compose up -d        # start Postgres 17 (persists in a named volume)
npx prisma migrate dev      # apply migrations
npx prisma db seed          # seed the admin user
npm run dev                 # app on http://localhost:3000
```

Seeded admin login: `admin@wms.local` / `ChangeMe123!` (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars; **always** override in production).

## Reset the database

```bash
docker compose down -v      # drop the volume (all data!)
docker compose up -d
npx prisma migrate dev
npx prisma db seed
```

Or without dropping the container: `npx prisma migrate reset` (re-applies migrations + reruns seed).

## Accounts & roles

- **Self-registration**: new users register at `/register` and land in `PENDING` status — they can log in but only see an "awaiting approval" page until an admin approves them.
- **Admin** (`/admin`): warehouse management — catalog, inventory, orders (built up over Phases 2–4).
- **Customer** (`/catalog`): browse catalog and place orders by the case (Phase 3).

## Project phases

1. ✅ Skeleton + auth (scaffold, Docker Postgres, migrations, register/login/logout, roles)
2. ✅ Catalog & inventory (admin CRUD, stock audit trail, Excel import)
3. ✅ Customer catalog & cart (transactional order placement)
4. Order management (status workflow, delivery dates)
5. Hardening & deployment (tests, rate limiting, Vercel + Neon demo)
