/**
 * Preview the app locally with generated sample data, no Supabase needed.
 *
 *   npm run preview:fixture
 *
 * Starts an in-process Postgres (PGlite) with the documented schema
 * (db/schema.sql) and generated sample rows, serves it over the Postgres wire
 * protocol on 127.0.0.1:54329, then starts `next dev` pointed at it. The app
 * labels every page as sample data.
 */
import { spawn } from "node:child_process";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createFixtureDatabase } from "../src/test/fixture-db";
import { buildPreviewFixture } from "../src/test/preview-fixture";

const DB_PORT = Number(process.env.PREVIEW_DB_PORT ?? 54329);
const APP_PORT = process.env.PORT ?? "3000";

async function main() {
  console.log("Building sample database…");
  const data = buildPreviewFixture();
  const db = await createFixtureDatabase(data);
  const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: DB_PORT });
  await server.start();
  console.log(
    `Sample database on 127.0.0.1:${DB_PORT}: ${data.devices.length} devices, ` +
      `${data.characterization.length + data.reliability.length + data.environmental.length} test records.`,
  );

  const next = spawn("npx", ["next", "dev", "--port", APP_PORT], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres?sslmode=disable`,
      DATABASE_POOL_MAX: "1",
      APP_DATA_SOURCE: "fixture",
    },
  });

  const shutdown = async () => {
    next.kill("SIGTERM");
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  next.on("exit", (code) => {
    void server.stop().then(() => process.exit(code ?? 0));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
