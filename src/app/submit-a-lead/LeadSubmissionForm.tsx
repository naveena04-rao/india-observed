"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { fieldErrors, leadSubmissionSchema } from "@/lib/leads/validation";

type FieldErrors = Record<string, string>;

const validationMessage = "Review the highlighted fields and submit again.";
const requestFailureMessage = "We could not submit this lead right now. Please try again later.";
const REQUEST_TIMEOUT_MS = 15_000;

const errorId = (name: string) => `${name}-error`;

export function LeadSubmissionForm() {
  const [datePrecision, setDatePrecision] = useState("exact");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [startedAt] = useState(() => Date.now());
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!message || !summaryRef.current) return;
    summaryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    summaryRef.current.focus({ preventScroll: true });
  }, [feedbackVersion, message]);

  function showFeedback(nextMessage: string) {
    setMessage(nextMessage);
    setFeedbackVersion((version) => version + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage("");
    setErrors({});

    const form = event.currentTarget;
    const data = new FormData(form);
    const sourceLinks = String(data.get("sourceLinks") ?? "")
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);

    const payload = {
      title: data.get("title"),
      description: data.get("description"),
      location: data.get("location"),
      datePrecision: data.get("datePrecision"),
      eventDate: data.get("eventDate"),
      sourceLinks,
      additionalContext: data.get("additionalContext"),
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
      showFeedback(validationMessage);
      return;
    }

    setSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        fieldErrors?: FieldErrors;
      };
      if (!response.ok || !result.ok) {
        setErrors(result.fieldErrors ?? {});
        showFeedback(result.message ?? requestFailureMessage);
        return;
      }
      setSuccess(true);
      showFeedback("Your lead has been submitted for review.");
      form.reset();
    } catch {
      showFeedback(requestFailureMessage);
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="lead-result" aria-labelledby="lead-success-title">
        <div ref={summaryRef} tabIndex={-1} role="status">
          <h2 id="lead-success-title">Your lead has been submitted for review.</h2>
          <p>Submission does not guarantee publication.</p>
          <p>Editors may contact you using the email address or phone number you provided.</p>
          <p>Please do not submit the same lead repeatedly.</p>
        </div>
      </section>
    );
  }

  const field = (name: string) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": errorId(name) } : {};

  return (
    <form className="lead-form" id="lead-submission-form" noValidate onSubmit={submit}>
      {message ? (
        <div className="lead-error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
          <h2>There is a problem with the submission</h2>
          <p>{message}</p>
        </div>
      ) : null}

      <div className="lead-field">
        <label htmlFor="lead-title">
          Event or lead title <span>Required</span>
        </label>
        <input
          id="lead-title"
          name="title"
          required
          minLength={5}
          maxLength={160}
          {...field("title")}
        />
        {errors.title ? (
          <p className="lead-field-error" id={errorId("title")}>
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="lead-field">
        <label htmlFor="lead-description">
          What happened? <span>Required</span>
        </label>
        <p className="lead-helper" id="lead-description-help">
          Include what occurred, where and when it occurred, the public institutions, organisations
          or officials involved, and what remains unclear.
        </p>
        <textarea
          id="lead-description"
          name="description"
          required
          minLength={40}
          maxLength={5000}
          rows={9}
          aria-describedby={`lead-description-help${errors.description ? ` ${errorId("description")}` : ""}`}
          aria-invalid={errors.description ? true : undefined}
        />
        {errors.description ? (
          <p className="lead-field-error" id={errorId("description")}>
            {errors.description}
          </p>
        ) : null}
      </div>

      <div className="lead-field">
        <label htmlFor="lead-location">
          Location <span>Required</span>
        </label>
        <p className="lead-helper" id="lead-location-help">
          City, district, state, venue or a broader location. Precise coordinates are not required.
        </p>
        <input
          id="lead-location"
          name="location"
          required
          minLength={2}
          maxLength={200}
          aria-describedby={`lead-location-help${errors.location ? ` ${errorId("location")}` : ""}`}
          aria-invalid={errors.location ? true : undefined}
        />
        {errors.location ? (
          <p className="lead-field-error" id={errorId("location")}>
            {errors.location}
          </p>
        ) : null}
      </div>

      <fieldset className="lead-field lead-date-field">
        <legend>
          When did this happen? <span>Required</span>
        </legend>
        <div className="lead-choice-row">
          {(
            [
              ["exact", "Exact date"],
              ["approximate", "Approximate date"],
              ["ongoing", "Ongoing event"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="datePrecision"
                value={value}
                checked={datePrecision === value}
                onChange={() => setDatePrecision(value)}
              />{" "}
              {label}
            </label>
          ))}
        </div>
        <label className="lead-date-label" htmlFor="lead-event-date">
          Date {datePrecision === "ongoing" ? "(optional)" : "(required)"}
        </label>
        <input
          id="lead-event-date"
          name="eventDate"
          type="date"
          required={datePrecision !== "ongoing"}
          {...field("eventDate")}
        />
        {errors.eventDate ? (
          <p className="lead-field-error" id={errorId("eventDate")}>
            {errors.eventDate}
          </p>
        ) : null}
      </fieldset>

      <div className="lead-field">
        <label htmlFor="lead-source-links">
          Source links <span>Optional</span>
        </label>
        <p className="lead-helper" id="lead-source-help">
          Add up to 10 public HTTP or HTTPS links, one per line, such as news reports, statements,
          social posts, videos or official notices.
        </p>
        <textarea
          id="lead-source-links"
          name="sourceLinks"
          rows={5}
          aria-describedby={`lead-source-help${errors.sourceLinks ? ` ${errorId("sourceLinks")}` : ""}`}
          aria-invalid={errors.sourceLinks ? true : undefined}
        />
        {errors.sourceLinks ? (
          <p className="lead-field-error" id={errorId("sourceLinks")}>
            {errors.sourceLinks}
          </p>
        ) : null}
      </div>

      <div className="lead-field">
        <label htmlFor="lead-additional-context">
          Additional context <span>Optional</span>
        </label>
        <textarea
          id="lead-additional-context"
          name="additionalContext"
          maxLength={3000}
          rows={5}
          {...field("additionalContext")}
        />
        {errors.additionalContext ? (
          <p className="lead-field-error" id={errorId("additionalContext")}>
            {errors.additionalContext}
          </p>
        ) : null}
      </div>

      <fieldset className="lead-contact-section">
        <legend>Contact details</legend>
        <div className="lead-field">
          <label htmlFor="lead-email">
            Email address <span>Required</span>
          </label>
          <p className="lead-helper" id="lead-email-help">
            Required. We may use this address to confirm the submission or ask follow-up questions.
          </p>
          <input
            id="lead-email"
            name="contactEmail"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            aria-describedby={`lead-email-help${errors.contactEmail ? ` ${errorId("contactEmail")}` : ""}`}
            aria-invalid={errors.contactEmail ? true : undefined}
          />
          {errors.contactEmail ? (
            <p className="lead-field-error" id={errorId("contactEmail")}>
              {errors.contactEmail}
            </p>
          ) : null}
        </div>
        <div className="lead-field">
          <label htmlFor="lead-phone">
            Phone number <span>Optional</span>
          </label>
          <p className="lead-helper" id="lead-phone-help">
            Optional. Provide a number only if you are comfortable being contacted about this
            submission.
          </p>
          <input
            id="lead-phone"
            name="contactPhone"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            aria-describedby={`lead-phone-help${errors.contactPhone ? ` ${errorId("contactPhone")}` : ""}`}
            aria-invalid={errors.contactPhone ? true : undefined}
          />
          {errors.contactPhone ? (
            <p className="lead-field-error" id={errorId("contactPhone")}>
              {errors.contactPhone}
            </p>
          ) : null}
        </div>
        <p>
          Your contact details will be used only to review or follow up on this submission and will
          not be published.
        </p>
      </fieldset>

      <div className="lead-confirmations">
        <label>
          <input
            name="goodFaith"
            type="checkbox"
            required
            aria-invalid={errors.goodFaith ? true : undefined}
            aria-describedby={errors.goodFaith ? errorId("goodFaith") : undefined}
          />{" "}
          I confirm that this submission is made in good faith and that I have not knowingly
          included private or unsafe information.
        </label>
        {errors.goodFaith ? (
          <p className="lead-field-error" id={errorId("goodFaith")}>
            {errors.goodFaith}
          </p>
        ) : null}
        <label>
          <input
            name="policyAcknowledgement"
            type="checkbox"
            required
            aria-invalid={errors.policyAcknowledgement ? true : undefined}
            aria-describedby={
              errors.policyAcknowledgement ? errorId("policyAcknowledgement") : undefined
            }
          />{" "}
          I have read the <Link href="/privacy">Privacy policy</Link>,{" "}
          <Link href="/editorial-policy">Editorial Policy</Link>,{" "}
          <Link href="/media-policy">Media Policy</Link> and <Link href="/terms">Terms</Link>.
        </label>
        {errors.policyAcknowledgement ? (
          <p className="lead-field-error" id={errorId("policyAcknowledgement")}>
            {errors.policyAcknowledgement}
          </p>
        ) : null}
      </div>

      <div className="lead-honeypot" aria-hidden="true">
        <label htmlFor="lead-website">Website</label>
        <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button className="lead-submit" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit lead"}
      </button>
      <p className="visually-hidden" aria-live="polite">
        {submitting ? "Submitting lead" : ""}
      </p>
    </form>
  );
}
