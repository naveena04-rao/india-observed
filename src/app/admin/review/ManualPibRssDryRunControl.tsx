"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { startPibRssDryRunAction, type ManualDryRunActionState } from "./actions";

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

export function ManualPibRssDryRunControl({ disabledReason }: { disabledReason: string | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(startPibRssDryRunAction, initialState);

  useEffect(() => {
    if (state.status === "completed" || state.status === "incomplete") router.refresh();
  }, [router, state.completedAt, state.status]);

  return (
    <section className="editor-review__dry-run" aria-labelledby="pib-rss-dry-run-heading">
      <div>
        <h2 id="pib-rss-dry-run-heading">Press Information Bureau RSS</h2>
        <p>
          Runs one 72-hour, metadata-only feed check for private editorial review. It does not fetch
          press-release pages, publish, notify followers, or enable scheduled scanning.
        </p>
      </div>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending || Boolean(disabledReason) || Boolean(state.runId)}
        >
          Run PIB RSS dry scan
        </button>
      ) : (
        <form action={formAction} className="editor-review__dry-run-confirmation">
          <p id="pib-rss-dry-run-confirmation">
            Run the one controlled PIB RSS metadata scan for the previous 72 hours?
          </p>
          <div role="group" aria-labelledby="pib-rss-dry-run-confirmation">
            <button type="submit" disabled={pending}>
              {pending ? "Running…" : "Run dry scan"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="editor-review__dry-run-status" role="status" aria-live="polite">
        {pending ? <p>Running… The one-request and metadata-only limits remain in force.</p> : null}
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
