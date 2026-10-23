import "server-only";
import { Pool, type PoolConfig } from "pg";
import { getServerEnv } from "@/lib/env";
import type { Queryable } from "./types";

/**
 * Build the pool configuration.
 *
 * When DATABASE_CA_CERT is provided, TLS is verified against that CA. `pg`
 * lets `sslmode` in the connection string override an explicit `ssl` object,
 * so those parameters are removed from the URL in that case.
 */
export function buildPoolConfig(databaseUrl: string, caCert?: string, max = 5): PoolConfig {
  const base: PoolConfig = {
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
    application_name: "sensor-reliability-web",
  };

  if (!caCert) {
    return { ...base, connectionString: databaseUrl };
  }

  const url = new URL(databaseUrl);
  for (const param of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
    url.searchParams.delete(param);
  }
  return {
    ...base,
    connectionString: url.toString(),
    ssl: { ca: caCert.replace(/\\n/g, "\n"), rejectUnauthorized: true },
  };
}

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { srPool?: Pool };

function getPool(): Pool {
  if (!globalForDb.srPool) {
    const env = getServerEnv();
    globalForDb.srPool = new Pool(
      buildPoolConfig(env.DATABASE_URL, env.DATABASE_CA_CERT, env.DATABASE_POOL_MAX),
    );
  }
  return globalForDb.srPool;
}

/** Server-only database handle used by every query module. */
export const db: Queryable = {
  async query<Row>(text: string, params?: unknown[]) {
    const result = await getPool().query(text, params);
    return { rows: result.rows as Row[] };
  },
};
