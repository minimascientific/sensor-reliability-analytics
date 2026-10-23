import "server-only";
import { z } from "zod";

/**
 * Server-side configuration. None of these values may be exposed to the
 * browser, so none of them use the NEXT_PUBLIC_ prefix.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is not set." })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a postgres:// connection string."),
  /** PEM contents of the database server's CA certificate (recommended for Supabase). */
  DATABASE_CA_CERT: z.string().optional(),
  /** Maximum pooled connections (keep small for serverless hosting). */
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  /**
   * Where the data comes from. `fixture` is the local preview database with
   * generated sample data; the UI labels it so it is never mistaken for the
   * real dataset.
   */
  APP_DATA_SOURCE: z.enum(["supabase", "fixture"]).default("supabase"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new ConfigError(parsed.error.issues.map((issue) => issue.message).join(" "));
  }
  return parsed.data;
}

/** The data-source label, readable even when the database is not configured. */
export function getDataSource(): ServerEnv["APP_DATA_SOURCE"] {
  return process.env.APP_DATA_SOURCE === "fixture" ? "fixture" : "supabase";
}
