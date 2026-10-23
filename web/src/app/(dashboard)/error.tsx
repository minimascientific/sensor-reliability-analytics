"use client";

import { useEffect } from "react";

/** Shown when a page's data cannot be loaded, for example when the database is unreachable. */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : null;

  return (
    <div role="alert" className="mt-8 max-w-2xl rounded-md border border-rule bg-surface p-5 text-sm">
      <p className="font-medium">The dashboard couldn&rsquo;t load data from the database.</p>
      <p className="mt-2 text-ink-secondary">
        Check that the database is reachable and that <code className="text-ink">DATABASE_URL</code>{" "}
        is correct. The server log has the full error
        {digest ? (
          <>
            {" "}
            (reference <code className="text-ink">{digest}</code>)
          </>
        ) : null}
        .
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-md border border-rule-strong px-3 py-1.5 font-medium hover:bg-surface-sunken"
      >
        Try again
      </button>
    </div>
  );
}
