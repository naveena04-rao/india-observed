"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type FollowResponse = { count: number; following: boolean };

type EventFollowControlProps = {
  enabled: boolean;
  initiallySignedIn: boolean;
  preview: boolean;
  slug: string;
};

function followerLabel(count: number) {
  return `${count} ${count === 1 ? "follower" : "followers"}`;
}

export function EventFollowControl({
  enabled,
  initiallySignedIn,
  preview,
  slug,
}: EventFollowControlProps) {
  const [summary, setSummary] = useState<FollowResponse | null>(null);
  const [signedIn, setSignedIn] = useState(initiallySignedIn);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const returnTo = `/events/${slug}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    fetch(`/api/events/${slug}/follow`, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return (await response.json()) as FollowResponse;
      })
      .then((data) => setSummary(data))
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError("Following is temporarily unavailable.");
        }
      });

    return () => controller.abort();
  }, [enabled, slug]);

  async function toggleFollow() {
    if (!summary || pending) return;
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${slug}/follow`, {
        method: summary.following ? "DELETE" : "POST",
        credentials: "same-origin",
      });
      if (response.status === 401) {
        setSignedIn(false);
        throw new Error("signed-out");
      }
      if (!response.ok) throw new Error("unavailable");
      setSummary((await response.json()) as FollowResponse);
    } catch {
      setError("Following is temporarily unavailable.");
    } finally {
      setPending(false);
      toggleRef.current?.focus();
    }
  }

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/auth/sign-out?returnTo=${encodeURIComponent(returnTo)}`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("unavailable");
      window.location.assign(returnTo);
    } catch {
      setError("Sign out is temporarily unavailable.");
      setPending(false);
    }
  }

  if (!enabled) {
    return (
      <aside className="event-follow-control event-follow-control--unavailable" aria-label="Follow">
        <p>Following is temporarily unavailable.</p>
      </aside>
    );
  }

  return (
    <aside className="event-follow-control" aria-labelledby="event-follow-heading">
      <div className="event-follow-heading-row">
        <h2 id="event-follow-heading">Follow this record</h2>
        <p className="event-follower-count" aria-live="polite" aria-atomic="true">
          {summary ? followerLabel(summary.count) : "Loading follower count…"}
        </p>
      </div>

      {signedIn ? (
        <div className="event-follow-actions">
          <button
            ref={toggleRef}
            type="button"
            className="event-follow-toggle"
            aria-pressed={summary?.following ?? false}
            aria-busy={pending}
            disabled={!summary || pending}
            onClick={toggleFollow}
          >
            {summary?.following ? "✓ Following" : "Follow this event"}
          </button>
          <button
            type="button"
            className="event-follow-sign-out"
            disabled={pending}
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link className="event-follow-sign-in" href={`/auth/sign-in?returnTo=${returnTo}`}>
          Sign in to follow
        </Link>
      )}

      <p>
        Following records reader interest in this event. It does not indicate endorsement of the
        event or its claims.
      </p>
      <p>Follower identities are not displayed publicly.</p>
      {preview ? (
        <p className="event-follow-preview">
          Preview follow data may be reset before public launch.
        </p>
      ) : null}
      <p className="event-follow-privacy">
        <Link href="/privacy">Privacy</Link>
      </p>
      {error ? (
        <p className="event-follow-error" role="alert">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
