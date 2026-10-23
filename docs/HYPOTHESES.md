# Hypotheses

Claims about the synthetic dataset that have **not** been independently verified. Each one is a starting point for an investigation, not a finding.

- **Origin: generator intent.** A pattern the synthetic-data generator was designed to produce. Design intent is not evidence that the stored data shows it.
- **Origin: notebook finding.** A result from earlier exploratory analysis that has not been reproduced against the current database.

**Status:** Untested → Confirmed / Refuted / Partly confirmed. When a hypothesis is tested, its evidence goes into [DATA_VERIFICATION.md](DATA_VERIFICATION.md) (the only file that states verified numbers) and the row here links to it.

> **Identifier caution:** lot and station names below (`LOT-017`, `ST-02`) are as written in the original notebook. The actual ID format in the database has not been checked yet.

## Generator intent

| ID | Hypothesis | Status | How to test |
|---|---|---|---|
| H-01 | 20 lots with 500 devices each | Partly confirmed: the lot and device totals are verified; devices per lot is untested | Count devices per lot |
| H-02 | About 5% overall failure | Untested: which population (records, devices, which stage) is unclear | Compare with the record and device rates in DATA_VERIFICATION.md |
| H-03 | `LOT-017` has an elevated failure rate (target 12%) and higher drift | Untested | Lot-level failure rate and drift on the Reliability page |
| H-04 | `LOT-008` has an elevated failure rate (target 10%) and higher drift | Untested | Same as H-03 |
| H-05 | Station `ST-02` shows a slight positive measurement bias | Untested | Mean `measurement_error` by station, within each stage |
| H-06 | Potassium has the highest drift of the four ions | Untested | `drift` by ion and test day; units still unverified |
| H-07 | Humidity above 80% increases measurement error or drift | Untested | `post_test_error` vs. `humidity` in `environmental_tests` (reliability tests have no humidity column) |
| H-08 | Thermal cycling increases qualification failure probability | Untested | Environmental pass rate by `stress_profile` |
| H-09 | `LOT-017` is more sensitive to environmental stress | Untested | Environmental pass rate by lot and profile |
| H-10 | About 2% of devices fail early in life | Untested: "early life" needs a definition | Failures at the first reliability test day; needs the test-day check (Q17) |

The original 5%, 10% and 12% targets may describe different populations or stages, so none of them is a record-level or device-level rate until tested.

## Notebook findings

| ID | Finding | Status | How to test |
|---|---|---|---|
| N-01 | *Calibration Drift* and *Reduced Sensitivity* are more strongly associated with reliability failures than *Excessive Noise* | Untested, and depends on what `failure_mode` means (open issue in DATA_VERIFICATION.md §3) | Q14 cross-tab of `failure_mode` × `pass_fail` |
| N-02 | Some lots have elevated reliability failure rates and need investigation | Untested. The notebook query joined `reliability_tests` to `devices` and grouped by lot, at record level | Reproduce at record and device level on the Reliability page |
| N-03 | Failures look close to independent across a device's records, and stage outcomes are slightly positively correlated | Untested. Observed informally from live dashboard values on 2026-10-23 | Compare observed device pass rates with rates expected under independence |
