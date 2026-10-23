# CLAUDE.md

Instructions for Claude Code in this repository. Keep this file short: it is loaded into every session. Facts live in `docs/`. Open the relevant file when a task needs it.

## What this is

An engineering analytics app for a **synthetic** multi-ion blood sensor dataset in Supabase PostgreSQL. The Next.js app is in `web/`. The Streamlit prototype in the repository root is a reference only.

## Hard rules

- **Never write to the database.** No `INSERT`, `UPDATE`, `DELETE`, DDL, roles or grants without the owner's explicit approval of the exact SQL. Verification queries are read-only.
- **Never modify the synthetic data**, and never invent specification limits or pass/fail criteria.
- **Do not modify the Streamlit prototype** (`app.py`, `requirements.txt`, `.streamlit/`).
- **Never commit secrets:** `.env.local`, passwords, connection strings, certificates or keys. Database credentials stay server-side, never in `NEXT_PUBLIC_` variables.
- **Keep TLS verification enabled** for database connections.
- **Never merge into `main`.** Open draft pull requests and let the owner merge.

## Data rules

- Verified facts and their evidence live only in `docs/DATA_VERIFICATION.md`. Don't restate its numbers elsewhere; link to it.
- Treat anything in `docs/HYPOTHESES.md` as unverified until DATA_VERIFICATION.md says otherwise.
- `failure_mode` and `device_status` are excluded from quality KPIs until their meaning is validated. They may be investigated, but don't turn them into KPIs, Pareto charts or failure counts.
- Label every pass rate as per record or per device, and show its denominator. Definitions: DATA_VERIFICATION.md §5.
- Aggregate in SQL. When a new metric is added, also write an independent read-only SQL check for it in `db/verification/`.
- `db/schema.sql` is a hand-maintained snapshot used for tests and documentation, not synchronized with Supabase. If Supabase's schema changes, update the snapshot in the same PR.

## Where things are

| Need | Look in |
|---|---|
| Why the project exists, the simulated product, learning goals | `docs/PROJECT_CONTEXT.md` |
| Verified data facts, open data issues, metric definitions | `docs/DATA_VERIFICATION.md` |
| Unverified generator intent and earlier findings | `docs/HYPOTHESES.md` |
| Page status, open items, what's next | `docs/ROADMAP.md` |
| Past technical decisions and their reasons | `docs/DECISIONS.md` |
| App setup, commands, code layout | `web/README.md` |
| SQL used to verify data and dashboard numbers | `db/verification/` |

## Commands (run from `web/`)

```bash
npm ci                    # install exactly the locked dependency versions
npm run typecheck         # route types and TypeScript
npm run lint
npm test                  # Vitest; query tests run on PGlite built from db/schema.sql
npm run build             # never connects to the database
npm run preview:fixture   # labelled sample data, no database needed
npm run dev               # needs web/.env.local (see web/.env.example)
```

Run typecheck, lint, test and build before every push. CI runs the same steps on pull requests.

## How to work

- **Explain as you go.** The owner is learning modern development workflows, so explain significant design choices, tradeoffs and important commands in plain language.
- **Branches and PRs:** one feature branch per piece of work, small focused commits, draft PRs with a summary, the testing done and what's still unverified.
- **Decisions:** add an entry to `docs/DECISIONS.md` for any significant technical choice. Supersede old entries; don't rewrite them.
- **Verification results:** when the owner runs a verification query, record the outcome in `docs/DATA_VERIFICATION.md`, and update the hypothesis status in `docs/HYPOTHESES.md` if it applies.
- **Ask first** before changes that are hard to undo, or that touch the database, deployment or the repository structure.
- **Look at UI changes** by rendering them. Prefer the sample-data preview, and say when something was only checked with sample data.
