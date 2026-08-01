"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { eventFieldDefinitions, type EventFieldKey } from "@/lib/leads/eventFieldMap";
import {
  eventStatuses,
  eventTypes,
  fieldErrors,
  leadSubmissionSchema,
  primaryTopics,
  sourceRoles,
  sourceTypes,
} from "@/lib/leads/validation";

type ContributionType = "new-event" | "public-source" | "correction" | "official-response";
type Proposal = {
  fieldKey: EventFieldKey;
  proposedValue: string;
  existingValueSnapshot: string;
  explanation: string;
};
type Source = {
  url: string;
  headline: string;
  publisher: string;
  sourceType: (typeof sourceTypes)[number];
  sourceRole: (typeof sourceRoles)[number];
  publicationDate: string;
  language: string;
  summary: string;
  supportedFieldKey: EventFieldKey | "";
};
type Media = {
  mediaType: "photo" | "video";
  url: string;
  caption: string;
  sourceOrCreator: string;
  publicationDate: string;
  depicts: string;
  privacySafetyNote: string;
};
type Props = {
  contributionType: ContributionType;
  relatedEventSlug?: string;
  relatedEventId?: string;
  relatedEventTitle?: string;
  currentValues?: Partial<Record<EventFieldKey, string>>;
};

const labels: Record<ContributionType, string> = {
  "new-event": "Propose a new event",
  "public-source": "Add a public source",
  correction: "Suggest a correction",
  "official-response": "Submit an official response",
};
const newSource = (role: Source["sourceRole"] = "Corroboration"): Source => ({
  url: "",
  headline: "",
  publisher: "",
  sourceType: "Original media reporting",
  sourceRole: role,
  publicationDate: "",
  language: "",
  summary: "",
  supportedFieldKey: "",
});
const newProposal = (
  fieldKey: EventFieldKey,
  currentValues: Props["currentValues"] = {},
): Proposal => ({
  fieldKey,
  proposedValue: "",
  existingValueSnapshot: currentValues?.[fieldKey] ?? "",
  explanation: "",
});
const newMedia = (): Media => ({
  mediaType: "photo",
  url: "",
  caption: "",
  sourceOrCreator: "",
  publicationDate: "",
  depicts: "",
  privacySafetyNote: "",
});

export function LeadSubmissionForm({
  contributionType,
  relatedEventSlug = "",
  relatedEventId = "",
  relatedEventTitle = "",
  currentValues = {},
}: Props) {
  const existing = Boolean(relatedEventSlug);
  const [proposals, setProposals] = useState<Proposal[]>(() =>
    contributionType === "public-source"
      ? []
      : [
          newProposal(
            contributionType === "official-response" ? "latest_official_response" : "title",
            currentValues,
          ),
        ],
  );
  const [sources, setSources] = useState<Source[]>(() =>
    ["public-source", "official-response"].includes(contributionType)
      ? [
          newSource(
            contributionType === "official-response" ? "Official response" : "Corroboration",
          ),
        ]
      : [],
  );
  const [media, setMedia] = useState<Media[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [startedAt] = useState(() => Date.now());
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      summaryRef.current?.focus({ preventScroll: true });
    }
  }, [message]);
  const updateProposal = (index: number, patch: Partial<Proposal>) =>
    setProposals((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
              ...(patch.fieldKey
                ? { existingValueSnapshot: currentValues[patch.fieldKey] ?? "" }
                : {}),
            }
          : item,
      ),
    );
  const updateSource = (index: number, patch: Partial<Source>) =>
    setSources((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  const updateMedia = (index: number, patch: Partial<Media>) =>
    setMedia((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const payload = {
      submissionMode: existing ? "existing-event" : "new-event",
      contributionType,
      relatedEventSlug,
      relatedEventId,
      proposals,
      sources,
      media,
      editorialNotes: data.get("editorialNotes"),
      contactEmail: data.get("contactEmail"),
      contactPhone: data.get("contactPhone"),
      goodFaith: data.get("goodFaith") === "on",
      policyAcknowledgement: data.get("policyAcknowledgement") === "on",
      website: data.get("website"),
      formStartedAt: startedAt,
    };
    const parsed = leadSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setMessage("Review the highlighted sections and submit again.");
      return;
    }
    setSubmitting(true);
    setErrors({});
    setMessage("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message ?? "We could not submit this contribution right now.");
        return;
      }
      setSuccess(true);
      setMessage("Your contribution has been submitted for editorial review.");
    } catch {
      setMessage("We could not submit this contribution right now. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success)
    return (
      <section className="lead-result">
        <div ref={summaryRef} tabIndex={-1} role="status">
          <h2>Your contribution has been submitted for editorial review.</h2>
          <p>
            Nothing has been published or changed automatically. Editors may contact you for
            clarification.
          </p>
        </div>
      </section>
    );

  return (
    <form className="lead-form" id="lead-submission-form" noValidate onSubmit={submit}>
      <div className="lead-contribution-context" role="note">
        <strong>{labels[contributionType]}</strong>
        {existing ? (
          <>
            <span>Record: {relatedEventTitle}</span>
            <Link href={`/events/${relatedEventSlug}`}>View current record</Link>
          </>
        ) : (
          <span>New event proposal</span>
        )}
      </div>
      {message ? (
        <div className="lead-error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
          <h2>There is a problem with the submission</h2>
          <p>{message}</p>
        </div>
      ) : null}

      {contributionType !== "public-source" ? (
        <section className="lead-repeat-section" aria-labelledby="proposal-heading">
          <h2 id="proposal-heading">{existing ? "Proposed record changes" : "Event details"}</h2>
          <p className="lead-helper">
            Add only the fields you are proposing. Internal verification, publication and moderation
            fields cannot be submitted.
          </p>
          {errors.proposals ? <p className="lead-field-error">{errors.proposals}</p> : null}
          {proposals.map((proposal, index) => {
            const definition = eventFieldDefinitions.find(({ key }) => key === proposal.fieldKey)!;
            const options =
              definition.type === "event-type"
                ? eventTypes
                : definition.type === "event-status"
                  ? eventStatuses
                  : definition.type === "primary-topic"
                    ? primaryTopics
                    : null;
            const proposalInputId = index === 0 ? "lead-title" : `proposal-value-${index}`;
            return (
              <fieldset className="lead-repeat-card" key={index}>
                <legend>Proposal {index + 1}</legend>
                <div className="lead-field">
                  <label htmlFor={`proposal-field-${index}`}>
                    Event field <span>Required</span>
                  </label>
                  <select
                    id={`proposal-field-${index}`}
                    value={proposal.fieldKey}
                    onChange={(e) =>
                      updateProposal(index, { fieldKey: e.target.value as EventFieldKey })
                    }
                  >
                    {eventFieldDefinitions.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.category} — {field.label}
                      </option>
                    ))}
                  </select>
                </div>
                {existing ? (
                  <div className="lead-current-value">
                    <strong>Current published value</strong>
                    <p>{proposal.existingValueSnapshot || "Not currently listed"}</p>
                  </div>
                ) : null}
                <div className="lead-field">
                  <label htmlFor={proposalInputId}>
                    Proposed value <span>Required</span>
                  </label>
                  {options ? (
                    <select
                      id={proposalInputId}
                      value={proposal.proposedValue}
                      onChange={(e) => updateProposal(index, { proposedValue: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : definition.type === "textarea" ? (
                    <textarea
                      id={proposalInputId}
                      rows={4}
                      value={proposal.proposedValue}
                      onChange={(e) => updateProposal(index, { proposedValue: e.target.value })}
                    />
                  ) : (
                    <input
                      id={proposalInputId}
                      type={definition.type === "date" ? "date" : "text"}
                      value={proposal.proposedValue}
                      onChange={(e) => updateProposal(index, { proposedValue: e.target.value })}
                    />
                  )}
                </div>
                <div className="lead-field">
                  <label htmlFor={`proposal-explanation-${index}`}>
                    Why should this change? <span>Optional</span>
                  </label>
                  <textarea
                    id={`proposal-explanation-${index}`}
                    rows={3}
                    value={proposal.explanation}
                    onChange={(e) => updateProposal(index, { explanation: e.target.value })}
                  />
                </div>
                {proposals.length > 1 ? (
                  <button
                    className="lead-secondary-button"
                    type="button"
                    onClick={() =>
                      setProposals((items) => items.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Remove proposal
                  </button>
                ) : null}
              </fieldset>
            );
          })}
          <button
            className="lead-secondary-button"
            type="button"
            onClick={() => setProposals((items) => [...items, newProposal("title", currentValues)])}
          >
            Add another field
          </button>
        </section>
      ) : null}

      <section className="lead-repeat-section" aria-labelledby="sources-heading">
        <h2 id="sources-heading">Public sources</h2>
        <p className="lead-helper">
          Add structured public evidence. A source is required for source and official-response
          submissions.
        </p>
        {errors.sources ? <p className="lead-field-error">{errors.sources}</p> : null}
        {sources.map((source, index) => (
          <fieldset className="lead-repeat-card" key={index}>
            <legend>Source {index + 1}</legend>
            <div className="lead-field">
              <label htmlFor={`source-url-${index}`}>
                Public URL <span>Required</span>
              </label>
              <input
                id={`source-url-${index}`}
                type="url"
                value={source.url}
                onChange={(e) => updateSource(index, { url: e.target.value })}
              />
            </div>
            <div className="lead-two-column">
              <div className="lead-field">
                <label htmlFor={`source-headline-${index}`}>
                  Headline or title <span>Required</span>
                </label>
                <input
                  id={`source-headline-${index}`}
                  value={source.headline}
                  onChange={(e) => updateSource(index, { headline: e.target.value })}
                />
              </div>
              <div className="lead-field">
                <label htmlFor={`source-publisher-${index}`}>
                  Publisher <span>Required</span>
                </label>
                <input
                  id={`source-publisher-${index}`}
                  value={source.publisher}
                  onChange={(e) => updateSource(index, { publisher: e.target.value })}
                />
              </div>
            </div>
            <div className="lead-two-column">
              <div className="lead-field">
                <label htmlFor={`source-type-${index}`}>Source type</label>
                <select
                  id={`source-type-${index}`}
                  value={source.sourceType}
                  onChange={(e) =>
                    updateSource(index, { sourceType: e.target.value as Source["sourceType"] })
                  }
                >
                  {sourceTypes.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="lead-field">
                <label htmlFor={`source-role-${index}`}>Source role</label>
                <select
                  id={`source-role-${index}`}
                  value={source.sourceRole}
                  onChange={(e) =>
                    updateSource(index, { sourceRole: e.target.value as Source["sourceRole"] })
                  }
                >
                  {sourceRoles.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="lead-two-column">
              <div className="lead-field">
                <label htmlFor={`source-date-${index}`}>
                  Publication date <span>Optional</span>
                </label>
                <input
                  id={`source-date-${index}`}
                  type="date"
                  value={source.publicationDate}
                  onChange={(e) => updateSource(index, { publicationDate: e.target.value })}
                />
              </div>
              <div className="lead-field">
                <label htmlFor={`source-language-${index}`}>
                  Language <span>Optional</span>
                </label>
                <input
                  id={`source-language-${index}`}
                  value={source.language}
                  onChange={(e) => updateSource(index, { language: e.target.value })}
                />
              </div>
            </div>
            <div className="lead-field">
              <label htmlFor={`source-field-${index}`}>
                What does this source support? <span>Optional</span>
              </label>
              <select
                id={`source-field-${index}`}
                value={source.supportedFieldKey}
                onChange={(e) =>
                  updateSource(index, { supportedFieldKey: e.target.value as EventFieldKey | "" })
                }
              >
                <option value="">General evidence</option>
                {eventFieldDefinitions.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="lead-field">
              <label htmlFor={`source-summary-${index}`}>
                Source summary <span>Optional</span>
              </label>
              <textarea
                id={`source-summary-${index}`}
                rows={3}
                value={source.summary}
                onChange={(e) => updateSource(index, { summary: e.target.value })}
              />
            </div>
            <button
              className="lead-secondary-button"
              type="button"
              onClick={() =>
                setSources((items) => items.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              Remove source
            </button>
          </fieldset>
        ))}
        <button
          className="lead-secondary-button"
          type="button"
          onClick={() => setSources((items) => [...items, newSource()])}
        >
          Add public source
        </button>
      </section>

      <section className="lead-repeat-section" aria-labelledby="media-heading">
        <h2 id="media-heading">Photo or video evidence</h2>
        <p className="lead-helper">
          Add a public URL only. Do not upload private files or identify people who may be at risk.
        </p>
        {media.map((item, index) => (
          <fieldset className="lead-repeat-card" key={index}>
            <legend>Media item {index + 1}</legend>
            <div className="lead-choice-row">
              <label>
                <input
                  name={`media-type-${index}`}
                  type="radio"
                  checked={item.mediaType === "photo"}
                  onChange={() => updateMedia(index, { mediaType: "photo" })}
                />{" "}
                Photo
              </label>
              <label>
                <input
                  name={`media-type-${index}`}
                  type="radio"
                  checked={item.mediaType === "video"}
                  onChange={() => updateMedia(index, { mediaType: "video" })}
                />{" "}
                Video
              </label>
            </div>
            <div className="lead-field">
              <label htmlFor={`media-url-${index}`}>
                Public media URL <span>Required</span>
              </label>
              <input
                id={`media-url-${index}`}
                type="url"
                value={item.url}
                onChange={(e) => updateMedia(index, { url: e.target.value })}
              />
            </div>
            <div className="lead-field">
              <label htmlFor={`media-caption-${index}`}>
                Caption <span>Required</span>
              </label>
              <input
                id={`media-caption-${index}`}
                value={item.caption}
                onChange={(e) => updateMedia(index, { caption: e.target.value })}
              />
            </div>
            <div className="lead-field">
              <label htmlFor={`media-source-${index}`}>
                Source or creator <span>Required</span>
              </label>
              <input
                id={`media-source-${index}`}
                value={item.sourceOrCreator}
                onChange={(e) => updateMedia(index, { sourceOrCreator: e.target.value })}
              />
            </div>
            <div className="lead-field">
              <label htmlFor={`media-date-${index}`}>
                Publication date <span>Optional</span>
              </label>
              <input
                id={`media-date-${index}`}
                type="date"
                value={item.publicationDate}
                onChange={(e) => updateMedia(index, { publicationDate: e.target.value })}
              />
            </div>
            <div className="lead-field">
              <label htmlFor={`media-depicts-${index}`}>
                What does it depict? <span>Required</span>
              </label>
              <textarea
                id={`media-depicts-${index}`}
                rows={3}
                value={item.depicts}
                onChange={(e) => updateMedia(index, { depicts: e.target.value })}
              />
            </div>
            <div className="lead-field">
              <label htmlFor={`media-safety-${index}`}>
                Privacy or safety note <span>Optional</span>
              </label>
              <textarea
                id={`media-safety-${index}`}
                rows={3}
                value={item.privacySafetyNote}
                onChange={(e) => updateMedia(index, { privacySafetyNote: e.target.value })}
              />
            </div>
            <button
              className="lead-secondary-button"
              type="button"
              onClick={() =>
                setMedia((items) => items.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              Remove media
            </button>
          </fieldset>
        ))}
        <button
          className="lead-secondary-button"
          type="button"
          onClick={() => setMedia((items) => [...items, newMedia()])}
        >
          Add photo or video
        </button>
      </section>

      <div className="lead-field">
        <label htmlFor="editorial-notes">
          Notes for the editorial team <span>Optional</span>
        </label>
        <textarea id="editorial-notes" name="editorialNotes" maxLength={3000} rows={5} />
      </div>
      <fieldset className="lead-contact-section">
        <legend>Contact details</legend>
        <div className="lead-field">
          <label htmlFor="lead-email">
            Email address <span>Required</span>
          </label>
          <input id="lead-email" name="contactEmail" type="email" required autoComplete="email" />
          {errors.contactEmail ? <p className="lead-field-error">{errors.contactEmail}</p> : null}
        </div>
        <div className="lead-field">
          <label htmlFor="lead-phone">
            Phone number <span>Optional</span>
          </label>
          <input id="lead-phone" name="contactPhone" type="tel" maxLength={30} autoComplete="tel" />
        </div>
        <p>Contact details are private and used only for review or follow-up.</p>
      </fieldset>
      <div className="lead-confirmations">
        <label>
          <input name="goodFaith" type="checkbox" required /> I confirm this is submitted in good
          faith and contains no private or unsafe information.
        </label>
        <label>
          <input name="policyAcknowledgement" type="checkbox" required /> I have read the{" "}
          <Link href="/privacy">Privacy policy</Link>,{" "}
          <Link href="/editorial-policy">Editorial Policy</Link>,{" "}
          <Link href="/media-policy">Media Policy</Link> and <Link href="/terms">Terms</Link>.
        </label>
      </div>
      <div className="lead-honeypot" aria-hidden="true">
        <label htmlFor="lead-website">Website</label>
        <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button className="lead-submit" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit for editorial review"}
      </button>
      <p className="visually-hidden" aria-live="polite">
        {submitting ? "Submitting contribution" : ""}
      </p>
    </form>
  );
}
