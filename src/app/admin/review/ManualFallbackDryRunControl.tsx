"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { startFallbackDryRunAction, type FallbackDryRunActionState } from "./actions";

const initialState: FallbackDryRunActionState = {
  status: "idle",
  message: "",
  runId: null,
  startedAt: null,
  completedAt: null,
  queriesUsed: 0,
  itemsDiscovered: 0,
  candidatesCreated: 0,
  failures: 0,
  connectorResults: {},
};

export function ManualFallbackDryRunControl({ disabledReason }: { disabledReason: string | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(startFallbackDryRunAction, initialState);

  useEffect(() => {
    if (state.status === "completed" || state.status === "incomplete") router.refresh();
  }, [router, state.completedAt, state.status]);

  return (
    <section className="editor-review__dry-run" aria-labelledby="fallback-dry-run-heading">
      <div>
        <h2 id="fallback-dry-run-heading">Fallback discovery</h2>
        <p>
          Uses approved non-GDELT metadata sources only. It does not publish, notify followers, or
          enable scheduled scanning.
        </p>
      </div>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending || Boolean(disabledReason) || Boolean(state.runId)}
        >
          Run fallback dry scan
        </button>
      ) : (
        <form action={formAction} className="editor-review__dry-run-confirmation">
          <p id="fallback-dry-run-confirmation">
            Run one metadata-only fallback scan for the previous 48 hours?
          </p>
          <div role="group" aria-labelledby="fallback-dry-run-confirmation">
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
        <>
          <dl className="editor-review__dry-run-result">
            {Object.entries(state.connectorResults).map(([connector, result]) => (
              <div key={connector}>
                <dt>{connector.replaceAll("_", " ")}</dt>
                <dd>
                  {result.items} items · {result.candidates} candidates · {result.failures} failures
                </dd>
              </div>
            ))}
          </dl>
          <Link href="/admin/review/today">Open the resulting review queue</Link>
        </>
      ) : null}
    </section>
  );
}
