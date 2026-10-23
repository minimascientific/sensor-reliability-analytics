-- =============================================================================
-- Sensor Reliability Analytics: Supabase schema snapshot (DOCUMENTATION ONLY)
-- =============================================================================
--
-- Reconstructed on 2026-10-23 from read-only queries against the live Supabase
-- database:
--   * information_schema.columns   (column names, types, nullability, defaults)
--   * pg_constraint                (primary and foreign keys)
--
-- This file is a HAND-MAINTAINED SNAPSHOT, not a migration, and it is NOT
-- synchronized with Supabase automatically. Do not run it against Supabase:
-- the tables already exist and hold the synthetic dataset.
--
-- It has two uses:
--   * documentation: the schema is reviewable next to the code that queries it
--   * tests: web/src/test/fixture-db.ts builds an in-process Postgres (PGlite)
--     from this file, so query tests run against these table definitions
--
-- If the Supabase schema changes, update this file in the same pull request.
--
-- Not captured here (still to verify, see docs/DATA_VERIFICATION.md):
--   * indexes beyond the automatic primary-key indexes
--   * row-level security policies, grants, views and functions
--
-- Observed: no column has a default, and there are no UNIQUE or CHECK
-- constraints. Every primary key is a surrogate text ID.
-- =============================================================================

create table production_lots (
    lot_id                  text not null,
    production_date         date not null,
    assembly_line           text not null,
    shift                   text not null,
    material_batch          text not null,
    sensor_batch            text not null,
    manufacturing_operator  text not null,
    constraint production_lots_pkey primary key (lot_id)
);

create table devices (
    device_id               text not null,
    lot_id                  text not null,
    manufacture_timestamp   timestamp without time zone not null,
    device_status           text not null,   -- observed: every row is 'Active'
    constraint devices_pkey primary key (device_id),
    constraint devices_lot_id_fkey foreign key (lot_id)
        references production_lots (lot_id)
);

create table test_stations (
    test_station_id         text not null,
    station_name            text not null,
    station_type            text not null,   -- observed: Characterization | Reliability | Environmental
    software_version        text not null,   -- single current value, no history
    calibration_date        date not null,   -- single current value, no history
    constraint test_stations_pkey primary key (test_station_id)
);

create table characterization_tests (
    characterization_test_id text not null,
    device_id               text not null,
    test_station_id         text not null,
    ion_type                text not null,   -- observed: Calcium | Chloride | Potassium | Sodium
    reference_value         numeric not null,
    measured_value          numeric not null,
    measurement_error       numeric not null, -- definition (absolute vs %) not yet verified
    noise                   numeric,
    sensitivity             numeric,          -- units not yet verified
    calibration_offset      numeric,
    test_timestamp          timestamp without time zone not null,
    pass_fail               text not null,   -- observed: Pass | Fail
    constraint characterization_tests_pkey primary key (characterization_test_id),
    constraint characterization_tests_device_id_fkey foreign key (device_id)
        references devices (device_id),
    constraint characterization_tests_test_station_id_fkey foreign key (test_station_id)
        references test_stations (test_station_id)
);

create table reliability_tests (
    reliability_test_id     text not null,
    device_id               text not null,
    test_station_id         text not null,
    test_day                integer not null,
    ion_type                text not null,   -- observed: Calcium | Chloride | Potassium | Sodium
    drift                   numeric,          -- units not yet verified
    measurement_error       numeric,
    sensitivity_change      numeric,
    pass_fail               text not null,   -- observed: Pass | Fail
    failure_mode            text,            -- OPEN ISSUE: does not align with pass_fail
    test_timestamp          timestamp without time zone not null,
    constraint reliability_tests_pkey primary key (reliability_test_id),
    constraint reliability_tests_device_id_fkey foreign key (device_id)
        references devices (device_id),
    constraint reliability_tests_test_station_id_fkey foreign key (test_station_id)
        references test_stations (test_station_id)
);

create table environmental_tests (
    environmental_test_id   text not null,
    device_id               text not null,
    test_station_id         text not null,
    stress_profile          text not null,   -- observed: Baseline | High Humidity | High Temperature | Thermal Cycling
    temperature             numeric not null,
    humidity                numeric not null,
    cycle_count             integer,
    test_duration_hours     numeric,
    post_test_error         numeric,         -- per device, no ion_type column
    pass_fail               text not null,   -- observed: Pass | Fail
    test_timestamp          timestamp without time zone not null,
    constraint environmental_tests_pkey primary key (environmental_test_id),
    constraint environmental_tests_device_id_fkey foreign key (device_id)
        references devices (device_id),
    constraint environmental_tests_test_station_id_fkey foreign key (test_station_id)
        references test_stations (test_station_id)
);
