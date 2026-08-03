"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { startDailyScannerDryRunAction, type ManualDryRunActionState } from "./actions";

const initialState: ManualDryRunActionState = {
  status: "idle",
  message: "",
  runId: null,
  startedAt: null,
  completedAt: null,
  queriesUsed: 0,
  itemsDiscovered: 0,
  candidatesCreated: 0,
  failures: 0,
};

export function ManualDailyScannerControl({ disabledReason }: { disabledReason: string | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(startDailyScannerDryRunAction, initialState);

  useEffect(() => {
    if (state.status === "completed" || state.status === "incomplete") router.refresh();
  }, [router, state.completedAt, state.status]);

  return (
    <section className="editor-review__dry-run" aria-labelledby="daily-scanner-heading">
      <div>
        <h2 id="daily-scanner-heading">Minimum daily scanner</h2>
        <p>
          Runs the two approved feeds over the previous 48 hours. Results stay private and no
          schedule, publication, email, notification, media, or public-record write is enabled.
        </p>
      </div>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending || Boolean(disabledReason) || Boolean(state.runId)}
        >
          Run scanner readiness check
        </button>
      ) : (
        <form action={formAction} className="editor-review__dry-run-confirmation">
          <p id="daily-scanner-confirmation">
            Run one controlled metadata-only scan for the previous 48 hours?
          </p>
          <div role="group" aria-labelledby="daily-scanner-confirmation">
            <button type="submit" disabled={pending}>
              {pending ? "Running…" : "Run readiness scan"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="editor-review__dry-run-status" role="status" aria-live="polite">
        {pending ? (
          <p>Running… Strict source, item, candidate and runtime limits remain active.</p>
        ) : null}
        {!pending && disabledReason ? <p>{disabledReason}</p> : null}
        {!pending && state.message ? <p>{state.message}</p> : null}
      </div>
      {state.runId ? (
        <>
          <dl className="editor-review__dry-run-result">
            <div>
              <dt>Items discovered</dt>
              <dd>{state.itemsDiscovered}</dd>
            </div>
            <div>
              <dt>Candidates created</dt>
              <dd>{state.candidatesCreated}</dd>
            </div>
            <div>
              <dt>Failures</dt>
              <dd>{state.failures}</dd>
            </div>
          </dl>
          <Link href="/admin/review/today">Open the resulting review queue</Link>
        </>
      ) : null}
    </section>
  );
}
