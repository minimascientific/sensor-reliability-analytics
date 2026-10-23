import { DATA_VERIFICATION_URL } from "@/components/layout/app-sidebar";

/** What the page deliberately leaves out, and why. Mirrors docs/DATA_VERIFICATION.md. */
export function DataNotes() {
  return (
    <section aria-labelledby="notes-heading" className="mt-12 border-t border-rule pt-6">
      <h2 id="notes-heading" className="text-sm font-semibold">
        Not shown on this page yet
      </h2>
      <dl className="mt-3 grid gap-x-10 gap-y-4 text-sm md:grid-cols-3">
        <div>
          <dt className="font-medium text-ink-secondary">Failure modes</dt>
          <dd className="mt-1 leading-relaxed text-ink-muted">
            Many passing reliability records carry a failure mode, so the column&rsquo;s meaning is
            unresolved.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink-secondary">Specification limits and Cpk</dt>
          <dd className="mt-1 leading-relaxed text-ink-muted">
            The pass/fail criteria are not stored in the database. Pass rates come only from
            recorded results.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink-secondary">Device status</dt>
          <dd className="mt-1 leading-relaxed text-ink-muted">
            Every device is recorded as Active, including devices that failed tests.
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-xs text-ink-muted">
        Evidence and open checks:{" "}
        <a
          href={DATA_VERIFICATION_URL}
          className="text-ink-secondary underline decoration-rule-strong underline-offset-2 hover:text-ink"
        >
          Data verification
        </a>
      </p>
    </section>
  );
}
