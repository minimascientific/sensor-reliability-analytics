# Project Context

Why this project exists, what it simulates, and how it got here. For current status see [ROADMAP.md](ROADMAP.md); for verified data facts see [DATA_VERIFICATION.md](DATA_VERIFICATION.md).

## Purpose

The Sensor Reliability Analytics Platform simulates the manufacturing, characterization, environmental qualification and reliability testing of a multi-ion blood sensor. It is a portfolio project, but it should behave like a useful engineering analytics tool rather than a gallery of charts.

It is built to demonstrate transferable engineering skills:

- Relational database design and SQL analytics
- Python-based engineering and reliability analysis
- Manufacturing quality and process troubleshooting
- Sensor characterization and degradation analysis
- Root-cause investigation and lot traceability
- Dashboard design and technical communication
- Modern, AI-assisted software development

## Engineering motivation

The project began as a manufacturing analytics concept built around PLC data from beverage bottling and packaging lines. It moved to blood-ion sensor reliability while exploring healthcare biosensor engineering roles, because sensor drift, lot-to-lot variation and qualification testing make richer engineering problems than throughput counts alone.

## The simulated product

A multi-ion sensor cartridge for point-of-care diagnostics, based on ion-selective electrode (ISE) measurement principles. It measures four analytes:

| Analyte | Ion | Charge | Stored `ion_type` |
|---|---|---|---|
| Sodium | Na⁺ | +1 | `Sodium` |
| Potassium | K⁺ | +1 | `Potassium` |
| Chloride | Cl⁻ | −1 | `Chloride` |
| Ionized calcium | Ca²⁺ | +2 | `Calcium` |

> **The data is synthetic.** It must not be presented as validated clinical-device performance. Units, acceptance limits and electrochemical assumptions are unverified, so the application does not show specification tables or interpret values as physical measurements.

The synthetic data was generated with deliberate patterns to investigate. They are listed, as untested hypotheses, in [HYPOTHESES.md](HYPOTHESES.md).

## Technology evolution

1. **Original architecture:** synthetic data → Supabase PostgreSQL → SQL → Python analysis → Power BI or reports.
2. **First prototype:** a Streamlit app in the repository root. An earlier version queried Supabase through SQLAlchemy in a Codespace. The committed `app.py` shows hard-coded summary figures and is kept unchanged as a reference.
3. **Current application:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui and Recharts in [`web/`](../web/), reading Supabase through server-side SQL. The reasoning behind each choice is in [DECISIONS.md](DECISIONS.md).

SQL stays the authoritative source for aggregate calculations. Python remains the right tool for advanced reliability and statistical work, but it is not part of every dashboard request.

## Development and learning goals

The project is both a working application and a way to learn modern software engineering. Work on it should:

- Explain significant design choices and their tradeoffs as they are made
- Keep code organized and readable, with tests for important calculations
- Use feature branches, small commits and reviewed pull requests
- Record meaningful technical decisions in [DECISIONS.md](DECISIONS.md)
- Preserve the original engineering intent while improving the implementation
- Avoid complexity that the next working feature does not need
- Never change the Supabase data or schema without explicit approval

A private engineering notebook holds the full design history and is not part of this repository.
