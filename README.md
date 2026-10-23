# Sensor Reliability Analytics Platform

An engineering analytics application for a **simulated** multi-ion blood sensor program: manufacturing lots, characterization, reliability and environmental qualification testing, stored in PostgreSQL and analyzed with SQL.

The data is synthetic and does not represent validated clinical-device performance.

## Status

The **Executive Overview** runs locally against the live Supabase database. Its numbers are being validated with independent SQL before release. See [docs/ROADMAP.md](docs/ROADMAP.md) for what's next.

## Repository layout

| Path | What it is |
|---|---|
| [`web/`](web/) | The Next.js application (TypeScript, Tailwind CSS, shadcn/ui, Recharts). Setup, commands and preview: [web/README.md](web/README.md) |
| [`db/schema.sql`](db/schema.sql) | Hand-maintained snapshot of the Supabase schema, used for documentation and tests. Not synchronized automatically |
| [`db/verification/`](db/verification/) | Read-only SQL used to verify the data and the dashboard |
| [`docs/`](docs/) | Project documentation, listed below |
| `app.py`, `requirements.txt`, `.streamlit/` | The original Streamlit prototype, kept unchanged as a reference |

## Documentation

| Document | Answers |
|---|---|
| [PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) | Why the project exists, what it simulates, how it evolved, and its learning goals |
| [DATA_VERIFICATION.md](docs/DATA_VERIFICATION.md) | What is verified about the data, and how. The only place verified numbers are stated |
| [HYPOTHESES.md](docs/HYPOTHESES.md) | Patterns the data was designed to contain, and earlier findings, not yet verified |
| [ROADMAP.md](docs/ROADMAP.md) | Page status, open items and future analytics |
| [DECISIONS.md](docs/DECISIONS.md) | Significant technical decisions and their tradeoffs |

## Quick start

```bash
cd web
npm ci
npm run preview:fixture   # sample data, no database needed → http://localhost:3000
```

To run against Supabase, see [web/README.md](web/README.md).
