"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { startManualDryRunAction, type ManualDryRunActionState } from "./actions";

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

function formatTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function ManualGdeltDryRunControl({ disabledReason }: { disabledReason: string | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(startManualDryRunAction, initialState);

  useEffect(() => {
    if (state.status === "completed" || state.status === "incomplete") router.refresh();
  }, [router, state.completedAt, state.status]);

  const finished = state.status !== "idle" && state.status !== "already_running";

  return (
    <section className="editor-review__dry-run" aria-labelledby="gdelt-dry-run-heading">
      <div>
        <h2 id="gdelt-dry-run-heading">Controlled discovery</h2>
        <p>
          Creates private review candidates only. It does not publish, notify followers, or enable
          scheduled scanning.
        </p>
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending || Boolean(disabledReason) || finished}
        >
          Run GDELT dry scan
        </button>
      ) : (
        <form action={formAction} className="editor-review__dry-run-confirmation">
          <p id="gdelt-dry-run-confirmation">
            Run one controlled GDELT metadata scan for the previous 48 hours?
          </p>
          <div role="group" aria-labelledby="gdelt-dry-run-confirmation">
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
        {pending ? <p>Running… The controlled limits remain in force.</p> : null}
        {!pending && disabledReason ? <p>{disabledReason}</p> : null}
        {!pending && state.message ? <p>{state.message}</p> : null}
      </div>

      {state.runId ? (
        <dl className="editor-review__dry-run-result">
          <div>
            <dt>Status</dt>
            <dd>{state.status}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{formatTime(state.startedAt)}</dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{formatTime(state.completedAt)}</dd>
          </div>
          <div>
            <dt>Queries used</dt>
            <dd>{state.queriesUsed}</dd>
          </div>
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
      ) : null}

      {state.runId ? <Link href="/admin/review/today">Open the resulting review queue</Link> : null}
    </section>
  );
}
