/**
 * The minimal database interface the query layer depends on.
 *
 * In the app it is backed by a `pg` connection pool (see ./client.ts). In
 * tests it is backed by PGlite, an in-process Postgres, so the exact same SQL
 * runs in both places.
 */
export interface Queryable {
  query<Row>(text: string, params?: unknown[]): Promise<{ rows: Row[] }>;
}
