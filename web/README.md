# Sensor Reliability Analytics: web app

Next.js application for the Sensor Reliability Analytics Platform. It replaces the Streamlit prototype in the repository root, which is kept unchanged as a reference.

**Built so far:** the Executive Overview page, which shows per-record and per-device pass rates for each test stage, rolled throughput yield by lot, device pass rate by ion, and reliability pass rate by test day.

## Requirements

- Node.js 22 or later
- For real data: a connection string for the Supabase Postgres database

## Run it

All commands run from this `web/` folder.

```bash
npm install
```

### Option A: preview with sample data (no database needed)

```bash
npm run preview:fixture
```

Open http://localhost:3000. This starts a local in-process Postgres (PGlite) with the documented schema from `../db/schema.sql` and **generated sample data**, then starts the dev server against it. Every page shows a "Sample data" notice, because these numbers say nothing about the real dataset. Stop it with Ctrl+C.

### Option B: run against Supabase

1. Copy `.env.example` to `.env.local`. It's git-ignored, so credentials never get committed.
2. Set `DATABASE_URL` to the Supabase connection pooler URI (Project Settings → Database).
3. Recommended: set `DATABASE_CA_CERT` to Supabase's CA certificate, so the TLS connection is verified. See the comments in `.env.example`.
4. Run:

```bash
npm run dev
```

The connection settings are server-only. Queries run in React Server Components, and no database credential reaches the browser.

## Checks

| Command | What it does |
|---|---|
| `npm run typecheck` | Generates route types and runs the TypeScript compiler |
| `npm run lint` | ESLint (Next.js core-web-vitals and TypeScript rules) |
| `npm test` | Vitest. Query tests run the real SQL against PGlite with a hand-designed fixture whose answers are worked out by hand. |
| `npm run build` | Production build. It never connects to the database: data is fetched at request time. |

CI runs all four on every pull request (`.github/workflows/web-ci.yml`).

## Where things live

```
src/
  app/(dashboard)/      page shell, Executive Overview page, error boundary
  components/
    overview/           page sections (yield cascade, lots table, dot plot, notes)
    charts/             Recharts client components
    layout/             sidebar and navigation
    ui/                 shadcn/ui primitives
  lib/
    db/                 server-only Postgres pool and the Queryable interface
    queries/            SQL for each page, with tests
    domain/             metric definitions, ion metadata
  test/                 PGlite fixture builders (tests and preview)
scripts/preview-fixture.ts
```

## Data rules

The dashboard only uses facts verified in [`../docs/DATA_VERIFICATION.md`](../docs/DATA_VERIFICATION.md):

- Pass/fail comes only from stored `pass_fail` values. No specification limits are assumed.
- `failure_mode` (open issue) and `device_status` (always `Active`) are not used. A test fails if any overview query references them.
- Every pass rate is labelled per record or per device and shows its numerator and denominator.

## Adding shadcn/ui components

`components.json` is configured, so on a machine with normal internet access:

```bash
npx shadcn@latest add <component>
```
