"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { eventTypes, fieldErrors, publicLeadSubmissionSchema } from "@/lib/leads/validation";

type ContributionType = "new-event" | "public-source" | "correction" | "official-response";
type MediaChoice = "none" | "photo" | "video" | "photo-and-video";
type Props = {
  contributionType: ContributionType;
  relatedEventSlug?: string;
  relatedEventId?: string;
  relatedEventTitle?: string;
};

const modeLabels: Record<ContributionType, string> = {
  "new-event": "Tell us about a new event",
  "public-source": "Add a public source",
  correction: "Suggest a correction",
  "official-response": "Submit an official response",
};

const eventTypeLabels: Record<(typeof eventTypes)[number], string> = {
  "Multi-form civic protest": "Protest using several forms of action",
  Demonstration: "Public demonstration",
  March: "March",
  "Civic campaign": "Civic campaign",
  Strike: "Strike",
  "Sit-in / Dharna": "Sit-in or dharna",
  "Sit-in": "Sit-in",
  Shutdown: "Shutdown or bandh",
  Rally: "Rally",
  "Hunger strike": "Hunger strike",
};

const validationMessage = "Review the highlighted questions and submit again.";
const requestFailureMessage =
  "We could not submit this contribution right now. Please try again later.";

function RepeatableLinks({
  id,
  label,
  links,
  setLinks,
}: {
  id: string;
  label: string;
  links: string[];
  setLinks: (links: string[]) => void;
}) {
  return (
    <div className="lead-field lead-simple-links">
      <span className="lead-input-label">{label}</span>
      {links.map((link, index) => (
        <div className="lead-link-row" key={index}>
          <label className="visually-hidden" htmlFor={`${id}-${index}`}>
            {label} {index + 1}
          </label>
          <input
            id={`${id}-${index}`}
            type="url"
            inputMode="url"
            placeholder="https://example.org/…"
            value={link}
            onChange={(event) =>
              setLinks(
                links.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)),
              )
            }
          />
          {links.length > 1 ? (
            <button
              className="lead-link-remove"
              type="button"
              onClick={() => setLinks(links.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}
      <button
        className="lead-secondary-button"
        type="button"
        onClick={() => setLinks([...links, ""])}
      >
        Add another link
      </button>
    </div>
  );
}

export function LeadSubmissionForm({
  contributionType,
  relatedEventSlug = "",
  relatedEventId = "",
  relatedEventTitle = "",
}: Props) {
  const existing = Boolean(relatedEventSlug);
  const [datePrecision, setDatePrecision] = useState("");
  const [mediaChoice, setMediaChoice] = useState<MediaChoice>("none");
  const [sourceLinks, setSourceLinks] = useState([""]);
  const [photoUrls, setPhotoUrls] = useState([""]);
  const [videoUrls, setVideoUrls] = useState([""]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [startedAt] = useState(() => Date.now());
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!message) return;
    summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    summaryRef.current?.focus({ preventScroll: true });
  }, [message]);

  const error = (name: string) =>
    errors[name] ? (
      <p className="lead-field-error" id={`${name}-error`}>
        {errors[name]}
      </p>
    ) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");
    const payload = {
      submissionMode: existing ? "existing-event" : "new-event",
      contributionType,
      relatedEventSlug,
      relatedEventId,
      whatHappened: value("whatHappened"),
      location: value("location"),
      datePrecision,
      eventDate: value("eventDate"),
      eventType: value("eventType"),
      publicParticipants: value("publicParticipants"),
      mainIssues: value("mainIssues"),
      authorityResponse: value("authorityResponse"),
      outcome: value("outcome"),
      sourceLinks: sourceLinks.map((link) => link.trim()).filter(Boolean),
      sourceExplanation: value("sourceExplanation"),
      correctionIncorrect: value("correctionIncorrect"),
      correctionReplacement: value("correctionReplacement"),
      correctionReason: value("correctionReason"),
      authorityName: value("authorityName"),
      officialName: value("officialName"),
      responseDate: value("responseDate"),
      officialResponse: value("officialResponse"),
      responseAddresses: value("responseAddresses"),
      mediaChoice,
      photoUrls: ["photo", "photo-and-video"].includes(mediaChoice)
        ? photoUrls.map((link) => link.trim()).filter(Boolean)
        : [],
      videoUrls: ["video", "photo-and-video"].includes(mediaChoice)
        ? videoUrls.map((link) => link.trim()).filter(Boolean)
        : [],
      editorialNotes: value("editorialNotes"),
      contactEmail: value("contactEmail"),
      contactPhone: value("contactPhone"),
      goodFaith: data.get("goodFaith") === "on",
      policyAcknowledgement: data.get("policyAcknowledgement") === "on",
      website: value("website"),
      formStartedAt: startedAt,
    };
    const parsed = publicLeadSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setMessage(validationMessage);
      return;
    }

    setErrors({});
    setMessage("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message ?? requestFailureMessage);
        return;
      }
      setSuccess(true);
      setMessage("Your contribution has been submitted for editorial review.");
    } catch {
      setMessage(requestFailureMessage);
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
    <form
      className="lead-form lead-reader-form"
      id="lead-submission-form"
      noValidate
      onSubmit={submit}
    >
      <div className="lead-contribution-context" role="note">
        <strong>{modeLabels[contributionType]}</strong>
        {existing ? (
          <>
            <span>For: {relatedEventTitle}</span>
            <Link href={`/events/${relatedEventSlug}`}>View the current record</Link>
          </>
        ) : (
          <span>Share what you know in your own words.</span>
        )}
      </div>

      {message ? (
        <div className="lead-error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
          <h2>There is a problem with the submission</h2>
          <p>{message}</p>
        </div>
      ) : null}

      <section className="lead-form-section" aria-labelledby="about-contribution-heading">
        <h2 id="about-contribution-heading">About the event or contribution</h2>

        {contributionType === "new-event" ? (
          <>
            <div className="lead-field">
              <label htmlFor="lead-title">
                What happened? <span>Required</span>
              </label>
              <p className="lead-helper">
                Describe the event in your own words. Include what happened, who was involved
                publicly, and what people were asking for.
              </p>
              <textarea
                id="lead-title"
                name="whatHappened"
                rows={6}
                aria-describedby={errors.whatHappened ? "whatHappened-error" : undefined}
              />
              {error("whatHappened")}
            </div>
            <div className="lead-field">
              <label htmlFor="lead-location">
                Where did it happen? <span>Required</span>
              </label>
              <p className="lead-helper">
                City, district, state, venue, or another understandable location.
              </p>
              <input
                id="lead-location"
                name="location"
                aria-describedby={errors.location ? "location-error" : undefined}
              />
              {error("location")}
            </div>
            <fieldset className="lead-field lead-plain-fieldset">
              <legend>
                When did it happen? <span>Required</span>
              </legend>
              <div className="lead-choice-row">
                {(["exact", "approximate", "ongoing"] as const).map((choice) => (
                  <label key={choice}>
                    <input
                      type="radio"
                      name="datePrecision"
                      value={choice}
                      checked={datePrecision === choice}
                      onChange={() => setDatePrecision(choice)}
                    />
                    {choice === "exact"
                      ? "Exact date"
                      : choice === "approximate"
                        ? "Approximate date"
                        : "Ongoing"}
                  </label>
                ))}
              </div>
              {datePrecision && datePrecision !== "ongoing" ? (
                <div className="lead-field lead-nested-field">
                  <label htmlFor="lead-event-date">Event date</label>
                  <input id="lead-event-date" name="eventDate" type="date" />
                  {error("eventDate")}
                </div>
              ) : null}
              {error("datePrecision")}
            </fieldset>
            <div className="lead-field">
              <label htmlFor="lead-event-type">
                What kind of event was it? <span>Required</span>
              </label>
              <select id="lead-event-type" name="eventType" defaultValue="">
                <option value="">Choose one</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {eventTypeLabels[type]}
                  </option>
                ))}
              </select>
              {error("eventType")}
            </div>
            <div className="lead-field">
              <label htmlFor="lead-participants">
                Who organised or took part publicly? <span>Optional</span>
              </label>
              <p className="lead-helper">
                Include organisations, unions, public groups, authorities, or officials. Do not
                include private participant lists.
              </p>
              <input id="lead-participants" name="publicParticipants" />
            </div>
            <div className="lead-field">
              <label htmlFor="lead-issues">
                What were the main demands or issues? <span>Optional</span>
              </label>
              <textarea id="lead-issues" name="mainIssues" rows={4} />
            </div>
            <div className="lead-field">
              <label htmlFor="lead-authority-response">
                How did authorities respond? <span>Optional</span>
              </label>
              <textarea id="lead-authority-response" name="authorityResponse" rows={4} />
            </div>
            <div className="lead-field">
              <label htmlFor="lead-outcome">
                What happened afterward? <span>Optional</span>
              </label>
              <p className="lead-helper">
                Outcomes, commitments, escalation, withdrawal, or unresolved matters.
              </p>
              <textarea id="lead-outcome" name="outcome" rows={4} />
            </div>
          </>
        ) : null}

        {contributionType === "public-source" ? (
          <div className="lead-field">
            <label htmlFor="lead-title">
              What does this source help confirm or explain? <span>Optional</span>
            </label>
            <textarea id="lead-title" name="sourceExplanation" rows={5} />
          </div>
        ) : null}

        {contributionType === "correction" ? (
          <>
            <div className="lead-field">
              <label htmlFor="lead-title">
                What information appears incorrect? <span>Required</span>
              </label>
              <textarea id="lead-title" name="correctionIncorrect" rows={4} />
              {error("correctionIncorrect")}
            </div>
            <div className="lead-field">
              <label htmlFor="lead-correction">
                What should it say instead? <span>Required</span>
              </label>
              <textarea id="lead-correction" name="correctionReplacement" rows={4} />
              {error("correctionReplacement")}
            </div>
            <div className="lead-field">
              <label htmlFor="lead-correction-reason">
                Why do you believe it should change? <span>Optional</span>
              </label>
              <textarea id="lead-correction-reason" name="correctionReason" rows={4} />
            </div>
          </>
        ) : null}

        {contributionType === "official-response" ? (
          <>
            <div className="lead-field">
              <label htmlFor="lead-title">
                Name of authority or organisation <span>Required</span>
              </label>
              <input id="lead-title" name="authorityName" />
              {error("authorityName")}
            </div>
            <div className="lead-field">
              <label htmlFor="lead-official">
                Name or public role of the official <span>Optional</span>
              </label>
              <input id="lead-official" name="officialName" />
            </div>
            <div className="lead-field">
              <label htmlFor="lead-response-date">
                Date of response <span>Required</span>
              </label>
              <input id="lead-response-date" name="responseDate" type="date" />
              {error("responseDate")}
            </div>
            <div className="lead-field">
              <label htmlFor="lead-response">
                What was the official response? <span>Required</span>
              </label>
              <textarea id="lead-response" name="officialResponse" rows={6} />
              {error("officialResponse")}
            </div>
            <div className="lead-field">
              <label htmlFor="lead-response-addresses">
                What part of the event does this response address? <span>Optional</span>
              </label>
              <textarea id="lead-response-addresses" name="responseAddresses" rows={4} />
            </div>
          </>
        ) : null}
      </section>

      <section className="lead-form-section" aria-labelledby="sources-media-heading">
        <h2 id="sources-media-heading">Sources and media</h2>
        <RepeatableLinks
          id="lead-source"
          label={
            contributionType === "official-response"
              ? "Official statement or source links"
              : contributionType === "correction"
                ? "Supporting source links"
                : "Public source links"
          }
          links={sourceLinks}
          setLinks={setSourceLinks}
        />
        <p className="lead-helper">
          Add news reports, official statements, public posts, videos, or notices that support this
          submission.
        </p>
        {error("sourceLinks")}

        <fieldset className="lead-field lead-plain-fieldset">
          <legend>
            Photo or video <span>Optional</span>
          </legend>
          <div className="lead-choice-row">
            {(["none", "photo", "video", "photo-and-video"] as const).map((choice) => (
              <label key={choice}>
                <input
                  type="radio"
                  name="mediaChoice"
                  value={choice}
                  checked={mediaChoice === choice}
                  onChange={() => setMediaChoice(choice)}
                />
                {choice === "none"
                  ? "No photo or video"
                  : choice === "photo"
                    ? "Photo"
                    : choice === "video"
                      ? "Video"
                      : "Photo and video"}
              </label>
            ))}
          </div>
        </fieldset>
        {["photo", "photo-and-video"].includes(mediaChoice) ? (
          <>
            <RepeatableLinks
              id="lead-photo"
              label="Public photo links"
              links={photoUrls}
              setLinks={setPhotoUrls}
            />
            {error("photoUrls")}
          </>
        ) : null}
        {["video", "photo-and-video"].includes(mediaChoice) ? (
          <>
            <RepeatableLinks
              id="lead-video"
              label="Public video links"
              links={videoUrls}
              setLinks={setVideoUrls}
            />
            {error("videoUrls")}
          </>
        ) : null}
        <div className="lead-field">
          <label htmlFor="lead-notes">
            Anything else editors should know? <span>Optional</span>
          </label>
          <textarea id="lead-notes" name="editorialNotes" rows={4} maxLength={3000} />
        </div>
      </section>

      <section className="lead-form-section" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Contact details</h2>
        <div className="lead-field">
          <label htmlFor="lead-email">
            Email address <span>Required</span>
          </label>
          <input id="lead-email" name="contactEmail" type="email" autoComplete="email" />
          {error("contactEmail")}
        </div>
        <div className="lead-field">
          <label htmlFor="lead-phone">
            Phone number <span>Optional</span>
          </label>
          <input id="lead-phone" name="contactPhone" type="tel" maxLength={30} autoComplete="tel" />
        </div>
        <p className="lead-helper">
          Your contact details will be used only to review or follow up on this submission and will
          not be published.
        </p>
      </section>

      <section className="lead-form-section" aria-labelledby="confirm-heading">
        <h2 id="confirm-heading">Confirm and submit</h2>
        <div className="lead-confirmations">
          <label>
            <input name="goodFaith" type="checkbox" /> I confirm that this submission is made in
            good faith and that I have not knowingly included private or unsafe information.
          </label>
          {error("goodFaith")}
          <label>
            <input name="policyAcknowledgement" type="checkbox" /> I have read the{" "}
            <Link href="/privacy">Privacy policy</Link>,{" "}
            <Link href="/editorial-policy">Editorial Policy</Link>,{" "}
            <Link href="/media-policy">Media Policy</Link> and <Link href="/terms">Terms</Link>.
          </label>
          {error("policyAcknowledgement")}
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
      </section>
    </form>
  );
}
