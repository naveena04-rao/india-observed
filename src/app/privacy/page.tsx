import Link from "next/link";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";

export const metadata = {
  title: "Privacy | India Observed",
  description: "How India Observed handles authentication and private event follows.",
};

export default function PrivacyPage() {
  return (
    <ArchiveShell>
      <article className="privacy-page page-shell">
        <header>
          <p className="section-kicker">PRIVACY</p>
          <h1>Reader accounts and event following</h1>
          <p>
            India Observed uses reader accounts only to authenticate a person and record or remove
            that person&apos;s private follow preference for a published event.
          </p>
        </header>

        <section>
          <h2>Information held for authentication</h2>
          <ul>
            <li>Email address held in Supabase Auth.</li>
            <li>Supabase account identifier.</li>
            <li>Authentication timestamps and security data managed by Supabase.</li>
          </ul>
        </section>

        <section>
          <h2>Information held when you follow</h2>
          <ul>
            <li>The published event slug.</li>
            <li>Your Supabase account identifier.</li>
            <li>The time the follow was created.</li>
          </ul>
          <p>Following does not indicate endorsement of an event or its claims.</p>
        </section>

        <section>
          <h2>What is public</h2>
          <p>Only the aggregate follower count for a published event is displayed publicly.</p>
          <p>
            Email addresses, account identifiers, individual follow records, lists of events
            followed by a person and follower directories are not displayed publicly.
          </p>
        </section>

        <section>
          <h2>Use and retention</h2>
          <p>
            Follower data is used to authenticate the reader, record and remove an event-follow
            preference and calculate an aggregate count. It is not sold to advertisers, and
            advertisers do not receive follower identities.
          </p>
          <p>
            Unfollowing removes the relevant event-follow row. Deleting a Supabase Auth account
            removes its follows through a database cascade. This version sends no email or push
            notifications about followed events.
          </p>
        </section>

        <section>
          <h2>Account deletion before public launch</h2>
          <p>
            India Observed has not yet approved a public account-deletion contact channel. Public
            Production following remains disabled until that channel and its handling process are
            approved and published.
          </p>
        </section>

        <p className="privacy-back-link">
          <Link href="/events">Return to Events</Link>
        </p>
      </article>
    </ArchiveShell>
  );
}
