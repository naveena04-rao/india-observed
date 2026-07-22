"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type FollowResponse = { count: number; following: boolean };

type EventFollowControlProps = {
  className?: string;
  enabled: boolean;
  initiallySignedIn: boolean;
  slug: string;
};

function followerLabel(count: number) {
  return `${count} ${count === 1 ? "follower" : "followers"}`;
}

function FollowIcon({ following }: { following: boolean }) {
  return (
    <svg className="event-follow-icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" />
      {following ? <path d="m6.5 10 2.2 2.3 4.8-5" /> : <path d="M10 6v8M6 10h8" />}
    </svg>
  );
}

export function EventFollowControl({
  className,
  enabled,
  initiallySignedIn,
  slug,
}: EventFollowControlProps) {
  const [summary, setSummary] = useState<FollowResponse | null>(null);
  const [signedIn, setSignedIn] = useState(initiallySignedIn);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
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
          setError(true);
        }
      });

    return () => controller.abort();
  }, [enabled, slug]);

  async function toggleFollow() {
    if (!summary || pending) return;
    setPending(true);
    setError(false);

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
      setError(true);
    } finally {
      setPending(false);
      toggleRef.current?.focus();
    }
  }

  if (!enabled) return null;

  const following = summary?.following ?? false;
  const controlContent = (
    <>
      <FollowIcon following={following} />
      <span className="event-follow-label">{following ? "Following" : "Follow"}</span>
    </>
  );

  return (
    <div className={["event-follow-compact", className].filter(Boolean).join(" ")}>
      {signedIn ? (
        <button
          ref={toggleRef}
          type="button"
          className="event-follow-button"
          aria-pressed={following}
          aria-busy={pending}
          disabled={!summary || pending}
          onClick={toggleFollow}
        >
          {controlContent}
        </button>
      ) : (
        <Link
          className="event-follow-button"
          href={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
          aria-label="Sign in to follow this event"
        >
          {controlContent}
        </Link>
      )}

      <span className="event-follow-count" aria-live="polite" aria-atomic="true">
        {error ? (
          <span className="event-follow-error" role="alert">
            Unavailable
          </span>
        ) : summary ? (
          followerLabel(summary.count)
        ) : (
          <span className="event-follow-loading">
            <span className="visually-hidden">Loading follower count</span>
            <span aria-hidden="true">•••</span>
          </span>
        )}
      </span>
    </div>
  );
}
