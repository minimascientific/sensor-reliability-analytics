# Decision Log

Significant technical decisions, newest last. Each entry records the **context**, the **decision**, and its **consequences**, including the tradeoffs accepted. When a decision changes, add a new entry that supersedes the old one rather than editing history.

D-001 to D-004 were made in the original engineering notebook; later entries were made while building the Next.js application.

---

### D-001: PostgreSQL on Supabase
**Context:** The project needed to demonstrate relational modeling and SQL, not just files.
**Decision:** Store the dataset in a Supabase-hosted PostgreSQL database rather than CSV files or SQLite.
**Consequences:** Real foreign keys, server-side aggregation and cloud connectivity, plus connection, TLS and credential management.

### D-002: Long-format ion measurements
**Context:** Each device is measured for four ions.
**Decision:** One row per device × ion, with an `ion_type` column, instead of one column per ion.
**Consequences:** Filtering, aggregation and trend analysis work the same for every ion, and adding an analyte needs no schema change. Per-device views need grouping or pivoting.

### D-003: Separate tables per test stage
**Context:** Characterization, reliability and environmental qualification are distinct engineering processes with different measurements.
**Decision:** `characterization_tests`, `reliability_tests` and `environmental_tests` are separate tables.
**Consequences:** Each stage has columns that fit it. Cross-stage metrics such as rolled throughput yield combine the tables at the device level.

### D-004: Reliability grain
**Context:** Reliability is tested repeatedly over time.
**Decision:** One record per device × ion × reliability time point.
**Consequences:** Uniqueness of this grain has since been verified in the data (DATA_VERIFICATION.md §2.4), though no constraint enforces it. The stored test days are not yet confirmed.

### D-005: New application in `web/`, Streamlit kept as reference
**Context:** The Streamlit proof of concept is being replaced, but it documents where the project started.
**Decision:** Build the Next.js app in a `web/` subfolder and leave `app.py`, `requirements.txt` and `.streamlit/` unchanged.
**Consequences:** One repository and history for both, with no risk to the prototype. The repository root mixes Python and Node files.

### D-006: Direct SQL from the server, not supabase-js
**Context:** The dashboard needs aggregate SQL (window functions, `FILTER`, `bool_and`) and must keep credentials out of the browser.
**Decision:** Query Postgres with the `pg` driver from React Server Components, behind a small `Queryable` interface (`web/src/lib/db/`).
**Consequences:** Full SQL, nothing secret reaches the client, and the same SQL runs in tests. The app manages its own connection pool and TLS, and does not use Supabase's REST API or row-level-security conveniences.

### D-007: Aggregate in SQL, compute rates from counts
**Context:** The dataset has hundreds of thousands of test records, but each chart needs at most a few hundred points.
**Decision:** SQL returns integer counts per group, and TypeScript turns them into rates.
**Consequences:** Small payloads, and every percentage can be shown beside its numerator and denominator. Rates computed this way are exact and easy to test.

### D-008: Fetch data at request time
**Context:** Next.js 16 Cache Components prerenders everything it can at build time.
**Decision:** Data components call `connection()` and render inside `<Suspense>`, so the database is only queried for real requests. Nothing is cached yet.
**Consequences:** Builds and CI never need database access, and every page load reflects the current data. Each visit runs the queries again; caching can be added once the data's update pattern is known.

### D-009: Test queries against PGlite built from `db/schema.sql`
**Context:** SQL logic needs real tests without touching Supabase.
**Decision:** Tests create an in-process Postgres (PGlite) from the documented schema snapshot and load hand-designed fixtures with hand-computed expected results.
**Consequences:** Fast, credential-free tests of the real SQL in CI. `db/schema.sql` is maintained by hand and is not synchronized with Supabase, so a schema change in Supabase must also be made there. PGlite's Postgres version may differ from Supabase's.

### D-010: Per-record and per-device metrics are always separated
**Context:** With many records per device, a high record pass rate can coexist with a much lower device pass rate.
**Decision:** Every pass rate is labelled per record or per device and states its denominator. The definitions are in DATA_VERIFICATION.md §5.
**Consequences:** Clearer engineering communication. Some views show two numbers where one would look simpler.

### D-011: Unvalidated fields stay out of quality KPIs
**Context:** `failure_mode` does not align with `pass_fail`, `device_status` is always `Active`, specification limits are not stored, and drift units are unverified.
**Decision:** None of these feed quality KPIs, spec bands, Cpk or mean-drift figures until their meaning is validated. They remain subjects of investigation.
**Consequences:** Fewer metrics in the first release, and none that could mislead. A test guards the Executive Overview SQL against using `failure_mode` and `device_status`.

### D-012: Direct database connection for local development
**Context:** Connecting through the Supabase session pooler failed: the certificate was not trusted, then authentication failed, then `auth_query secret check timed out`. A direct connection with the existing password and Supabase's CA certificate worked.
**Decision:** Local development uses the direct connection, with TLS verified against Supabase's CA certificate (`DATABASE_CA_CERT`). Verification stays enabled.
**Consequences:** The dashboard runs locally against live data. Supabase's direct endpoint may require IPv6, which many hosting platforms lack, so the pooler problem must be solved before deployment (ROADMAP.md).

### D-013: Sample-data preview is always labelled
**Context:** The UI needs to be developed and reviewed without database access.
**Decision:** `npm run preview:fixture` serves generated sample data from PGlite, and the UI shows a "Sample data" notice whenever it is used.
**Consequences:** Anyone can run the app offline. The sample numbers are invented and must never be quoted as results.
