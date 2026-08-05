"use client";

import { useActionState } from "react";
import {
  reviewTwelveMonthVerificationLeadAction,
  type VerificationDecisionActionState,
} from "./actions";

const initialState: VerificationDecisionActionState = {
  status: "idle",
  message: "",
  completedAt: null,
};

export function VerificationDecisionForm({
  leadRef,
  initialNote,
  persistenceAvailable,
}: {
  leadRef: string;
  initialNote: string;
  persistenceAvailable: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    reviewTwelveMonthVerificationLeadAction,
    initialState,
  );
  const disabled = !persistenceAvailable || pending;

  return (
    <form action={formAction}>
      <input type="hidden" name="leadRef" value={leadRef} />
      <label htmlFor={`${leadRef}-note`}>Owner note (required for hold or reject)</label>
      <textarea
        id={`${leadRef}-note`}
        name="note"
        rows={2}
        defaultValue={initialNote}
        placeholder="Add context for the editorial record"
        disabled={!persistenceAvailable}
      />
      <div className="verification-review__actions" role="group" aria-label={`${leadRef} decision`}>
        <button type="submit" name="decision" value="approve_private_draft" disabled={disabled}>
          Approve private draft
        </button>
        <button type="submit" name="decision" value="hold_for_evidence" disabled={disabled}>
          Hold for evidence
        </button>
        <button type="submit" name="decision" value="reject" disabled={disabled}>
          Reject
        </button>
      </div>
      <p
        className={`verification-review__action-status verification-review__action-status--${state.status}`}
        role="status"
        aria-live="polite"
      >
        {pending ? "Saving decision…" : state.message}
      </p>
    </form>
  );
}
