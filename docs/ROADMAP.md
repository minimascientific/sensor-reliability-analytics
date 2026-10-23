# Roadmap

**Current milestone (2026-10-23):** the Executive Overview runs locally against the live Supabase database. Independent SQL validation of its metrics and a visual review of its lower charts are still outstanding. PR #1 stays unmerged until both are done.

## Pages

| Page | Status | Scope |
|---|---|---|
| Executive Overview | **Live locally, validation in progress** | Record and device pass rates per stage, rolled throughput yield, yield by lot, lots to review, device pass rate by ion, reliability pass rate by test day |
| Reliability Analytics | Next | Drift vs. test day, drift by ion, reliability trends by lot, pass/fail over time, degradation labels vs. actual failures, station and calibration effects |
| Manufacturing Analytics | Planned | Comparisons by lot, line, shift, material batch, sensor batch, operator and test station |
| Environmental Qualification | Planned | Baseline, High Temperature, High Humidity and Thermal Cycling: pass rates and post-test error |
| Data Explorer | Planned | Filtered inspection of the underlying records behind any dashboard finding |

Rules that apply to every page:

- Always distinguish per-record rates from per-device yields.
- Present associations as leads to investigate, not proven root causes.
- No failure-mode Pareto chart until the `failure_mode` question below is resolved.

## Open items

| Item | Why it matters | Blocks |
|---|---|---|
| Validate Executive Overview numbers with independent SQL (`db/verification/`) | The dashboard values are observed, not yet verified | Merging PR #1 |
| Review the lower Executive Overview charts against real data | Layout was only checked with sample data | Merging PR #1 |
| Resolve the meaning of `failure_mode` | Labels outnumber recorded failures (DATA_VERIFICATION.md §3) | Failure-mode analysis |
| Pending verification checks Q2, Q5, Q6, Q8 and Q10–Q18 | Units, test days, station calibration history, pass/fail criteria | Reliability, Environmental and station analysis |
| Get the Supabase connection pooler working | Local development uses the direct connection, which may not be reachable from hosting platforms (see D-012) | Deployment |
| Create a read-only database role for the app | Least-privilege access; needs approval as a database change | Deployment |

## Future analytical capabilities

These are not requirements for the first release. Each one needs data support confirmed before it is built.

| Capability | Prerequisite |
|---|---|
| Statistical process control (SPC) charts | Agreed control metrics and subgrouping |
| Drift detection and anomaly identification | Verified drift units and test-day spacing |
| Survival analysis and Weibull modeling | Confirmed failure-event and censoring information, not just a pass/fail flag per test day |
| Root-cause investigation workflows | Manufacturing and station analysis in place |
| Automated engineering summaries and AI-assisted exploration | Validated metrics to summarize |
