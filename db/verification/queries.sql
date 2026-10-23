-- =============================================================================
-- Data verification queries (read-only)
-- =============================================================================
-- Run in the Supabase SQL Editor. Every statement only reads data.
-- Status and results are recorded in docs/DATA_VERIFICATION.md.
--
--   RUN      results recorded in docs/DATA_VERIFICATION.md
--   PENDING  not yet run
--   RETIRED  no longer needed (reason given)
-- =============================================================================


-- [Q1] RUN: Keys and constraints -------------------------------------------
select conrelid::regclass as table_name, conname, contype,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
order by 1, 3;


-- [Q2] PENDING: Indexes ------------------------------------------------------
select tablename, indexname, indexdef
from pg_indexes where schemaname = 'public' order by 1;


-- [Q3] RUN: Exact row counts --------------------------------------------------
select 'production_lots' as t, count(*) from production_lots
union all select 'devices', count(*) from devices
union all select 'test_stations', count(*) from test_stations
union all select 'characterization_tests', count(*) from characterization_tests
union all select 'reliability_tests', count(*) from reliability_tests
union all select 'environmental_tests', count(*) from environmental_tests;


-- [Q4] RUN: Category values in use -------------------------------------------
select 'char ion_type' as col, ion_type as val, count(*) from characterization_tests group by 2
union all select 'rel ion_type', ion_type, count(*) from reliability_tests group by 2
union all select 'char pass_fail', pass_fail, count(*) from characterization_tests group by 2
union all select 'rel pass_fail', pass_fail, count(*) from reliability_tests group by 2
union all select 'env pass_fail', pass_fail, count(*) from environmental_tests group by 2
union all select 'failure_mode', failure_mode, count(*) from reliability_tests group by 2
union all select 'device_status', device_status, count(*) from devices group by 2
union all select 'stress_profile', stress_profile, count(*) from environmental_tests group by 2
union all select 'station_type', station_type, count(*) from test_stations group by 2
order by 1, 2;


-- [Q5] PENDING: Value ranges per ion (units) --------------------------------
select ion_type, min(reference_value), max(reference_value),
       min(measurement_error), max(measurement_error),
       avg(sensitivity), avg(noise)
from characterization_tests group by ion_type;

select ion_type, min(test_day), max(test_day), count(distinct test_day),
       min(drift), max(drift)
from reliability_tests group by ion_type;


-- [Q6] PENDING: Recover implicit characterization pass/fail thresholds -------
-- If max_abs_err for Pass is below min_abs_err for Fail, the boundary is the
-- implicit limit. Overlap means the rule uses more than measurement_error.
select ion_type, pass_fail,
       min(abs(measurement_error)) as min_abs_err,
       max(abs(measurement_error)) as max_abs_err
from characterization_tests group by 1, 2 order by 1, 2;


-- [Q7] RUN: Grain check (duplicate business keys) ---------------------------
-- Executed form: number of key groups with more than one row.
select 'characterization' as stage, count(*) as duplicate_groups
from (select device_id, ion_type from characterization_tests
      group by 1, 2 having count(*) > 1) d
union all
select 'reliability', count(*)
from (select device_id, ion_type, test_day from reliability_tests
      group by 1, 2, 3 having count(*) > 1) d;


-- [Q8] PENDING: Records per device per stage and stage coverage ------------
select 'char' as stage, n, count(*) as devices
from (select device_id, count(*) as n from characterization_tests group by 1) s group by 1, 2
union all
select 'rel', n, count(*) from (select device_id, count(*) as n from reliability_tests group by 1) s group by 1, 2
union all
select 'env', n, count(*) from (select device_id, count(*) as n from environmental_tests group by 1) s group by 1, 2
order by 1, 2;

select count(*) as devices,
  count(*) filter (where exists (select 1 from characterization_tests c where c.device_id = d.device_id)) as with_char,
  count(*) filter (where exists (select 1 from reliability_tests r where r.device_id = d.device_id)) as with_rel,
  count(*) filter (where exists (select 1 from environmental_tests e where e.device_id = d.device_id)) as with_env
from devices d;


-- [Q9] RETIRED: Orphan rows --------------------------------------------------
-- Q1 shows validated foreign keys on every device_id, lot_id and
-- test_station_id column, so orphan rows cannot exist.


-- [Q10] PENDING: Definition of measurement_error ----------------------------
select count(*) as rows,
  max(abs(measurement_error - (measured_value - reference_value))) as max_dev_from_abs_diff,
  max(abs(measurement_error - 100 * (measured_value - reference_value) / nullif(reference_value, 0)))
    as max_dev_from_pct_diff
from characterization_tests;


-- [Q11] PENDING: Timeline consistency ---------------------------------------
select 'device made before its lot date' as chk, count(*)
  from devices d join production_lots l using (lot_id)
  where d.manufacture_timestamp::date < l.production_date
union all select 'char test before manufacture', count(*)
  from characterization_tests c join devices d using (device_id)
  where c.test_timestamp < d.manufacture_timestamp
union all select 'rel test before manufacture', count(*)
  from reliability_tests r join devices d using (device_id)
  where r.test_timestamp < d.manufacture_timestamp
union all select 'env test before manufacture', count(*)
  from environmental_tests e join devices d using (device_id)
  where e.test_timestamp < d.manufacture_timestamp;


-- [Q12] PENDING: Station usage window vs. single calibration date ----------
select s.test_station_id, s.station_type, s.software_version, s.calibration_date,
       min(t.test_timestamp)::date as first_test, max(t.test_timestamp)::date as last_test,
       count(*) filter (where t.test_timestamp::date < s.calibration_date) as tests_before_calibration,
       count(*) as total_tests
from test_stations s
join (select test_station_id, test_timestamp from characterization_tests
      union all select test_station_id, test_timestamp from reliability_tests
      union all select test_station_id, test_timestamp from environmental_tests) t
  using (test_station_id)
group by 1, 2, 3, 4
order by 1;


-- [Q13] PENDING: Station confounding with lots and lines -------------------
select c.test_station_id,
       count(distinct d.lot_id) as lots,
       count(distinct l.assembly_line) as lines,
       count(*) as char_records
from characterization_tests c
join devices d using (device_id)
join production_lots l using (lot_id)
group by 1 order by 1;


-- [Q14] PENDING: failure_mode vs. pass_fail (OPEN ISSUE) --------------------
select pass_fail,
       coalesce(failure_mode, '(none)') as failure_mode,
       count(*) as records,
       round(avg(abs(drift)), 4)              as avg_abs_drift,
       round(avg(abs(measurement_error)), 4)  as avg_abs_error,
       round(avg(sensitivity_change), 4)      as avg_sensitivity_change
from reliability_tests
group by 1, 2
order by 1, 2;


-- [Q15] PENDING: Tests only use stations of the matching type? -------------
select 'characterization_tests' as tbl, s.station_type, count(*)
  from characterization_tests t join test_stations s using (test_station_id) group by 1, 2
union all
select 'reliability_tests', s.station_type, count(*)
  from reliability_tests t join test_stations s using (test_station_id) group by 1, 2
union all
select 'environmental_tests', s.station_type, count(*)
  from environmental_tests t join test_stations s using (test_station_id) group by 1, 2
order by 1, 2;


-- [Q16] PENDING: Device-level pass rates (reference answer for the dashboard)
select stage,
       count(*) as devices,
       count(*) filter (where all_pass) as passing_devices,
       round(100.0 * count(*) filter (where all_pass) / count(*), 2) as device_pass_pct
from (
  select 'characterization' as stage, device_id, bool_and(pass_fail = 'Pass') as all_pass
    from characterization_tests group by device_id
  union all
  select 'reliability', device_id, bool_and(pass_fail = 'Pass')
    from reliability_tests group by device_id
  union all
  select 'environmental', device_id, bool_and(pass_fail = 'Pass')
    from environmental_tests group by device_id
) d
group by stage
order by stage;


-- [Q17] PENDING: Reliability test-day grid completeness --------------------
select test_day, count(*) as records, count(distinct device_id) as devices
from reliability_tests
group by test_day
order by test_day;


-- [Q18] PENDING: Environmental grain (one record per device x profile?) -----
select count(*) as duplicate_groups
from (select device_id, stress_profile
      from environmental_tests
      group by 1, 2
      having count(*) > 1) d;
