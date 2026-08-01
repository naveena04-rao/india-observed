import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { saveGlobalNotificationPreferenceAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Notification preferences | India Observed",
  robots: { index: false, follow: false },
};

export default async function NotificationPreferencesPage() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase)
    return (
      <ArchiveShell authReturnTo="/notifications">
        <main className="page-shell">
          <h1>Notification preferences unavailable</h1>
          <p>The private preference service is not configured.</p>
        </main>
      </ArchiveShell>
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?returnTo=%2Fnotifications");
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("event_slug,delivery_frequency,email_enabled,in_app_enabled,global_opt_out,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Notification preferences could not be loaded.");
  const preferences = data ?? [];
  const global = preferences.find((item) => item.event_slug === null);
  return (
    <ArchiveShell authReturnTo="/notifications">
      <main className="editorial-page page-shell">
        <header className="editorial-hero">
          <p className="section-kicker">YOUR ACCOUNT</p>
          <h1>Notification preferences</h1>
          <p>
            Notifications are opt-in and are created only after a reviewed event update is
            published. Real email delivery is currently disabled.
          </p>
        </header>
        <section>
          <h2>Global preference</h2>
          <form action={saveGlobalNotificationPreferenceAction}>
            <label>
              <input
                type="checkbox"
                name="globalOptOut"
                defaultChecked={global?.global_opt_out ?? false}
              />{" "}
              Unsubscribe from all event notifications
            </label>
            <p>
              <button type="submit">Save preference</button>
            </p>
          </form>
        </section>
        <section>
          <h2>Event-specific preferences</h2>
          {preferences.filter((item) => item.event_slug).length === 0 ? (
            <p>No event-specific notification preferences.</p>
          ) : (
            <ul>
              {preferences
                .filter((item) => item.event_slug)
                .map((item) => (
                  <li key={item.event_slug}>
                    {item.event_slug}: {item.delivery_frequency.replaceAll("_", " ")}{" "}
                    {item.email_enabled ? "and email" : ""}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </main>
    </ArchiveShell>
  );
}
