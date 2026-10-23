import { describe, expect, it } from "vitest";
import { buildPoolConfig } from "./client";

describe("buildPoolConfig", () => {
  const url = "postgresql://reader:secret@db.example.com:6543/postgres?sslmode=require";

  it("passes the connection string through when no CA certificate is given", () => {
    const config = buildPoolConfig(url);
    expect(config.connectionString).toBe(url);
    expect(config.ssl).toBeUndefined();
  });

  it("verifies TLS against the CA and strips sslmode so it cannot override that", () => {
    const config = buildPoolConfig(url, "-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----");
    expect(config.connectionString).not.toContain("sslmode");
    expect(config.ssl).toEqual({
      ca: "-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----",
      rejectUnauthorized: true,
    });
  });

  it("keeps the pool small and bounds query time", () => {
    const config = buildPoolConfig(url);
    expect(config.max).toBe(5);
    expect(config.statement_timeout).toBe(15_000);
  });
});
