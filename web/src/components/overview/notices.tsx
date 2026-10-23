import { Database, FlaskConical } from "lucide-react";

/** Shown when the page runs against the generated local preview database. */
export function FixtureDataNotice() {
  return (
    <div
      role="note"
      className="mt-6 flex gap-3 rounded-md border border-notice-rule bg-notice-bg px-4 py-3 text-sm text-notice-ink"
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-medium">Sample data.</span> These numbers come from a generated local
        preview database, not the Supabase dataset.
      </p>
    </div>
  );
}

/** Shown when DATABASE_URL is missing or invalid. */
export function SetupNotice({ detail }: { detail: string }) {
  return (
    <div role="alert" className="mt-8 max-w-2xl rounded-md border border-rule bg-surface p-5 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <Database className="size-4 text-ink-muted" aria-hidden="true" />
        The database connection isn&rsquo;t configured
      </div>
      <p className="mt-2 text-ink-secondary">{detail}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-ink-secondary">
        <li>
          Copy <code className="text-ink">web/.env.example</code> to{" "}
          <code className="text-ink">web/.env.local</code>.
        </li>
        <li>
          Set <code className="text-ink">DATABASE_URL</code> to your Supabase connection string.
        </li>
        <li>Restart the development server.</li>
      </ol>
      <p className="mt-3 text-ink-muted">
        To preview with sample data instead, run <code className="text-ink">npm run preview:fixture</code>.
      </p>
    </div>
  );
}
