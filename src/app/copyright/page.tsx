import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";
import { getPublicContactEmail } from "@/lib/site";

export const metadata = {
  title: "Copyright and takedown requests",
  description: "Copyright, licensing and takedown request process for India Observed.",
  alternates: { canonical: "/copyright" },
};

export default function CopyrightPage() {
  const email = getPublicContactEmail();
  return (
    <LaunchPolicyPage
      description="Rights holders may request review, correction, restriction or removal of displayed media."
      kicker="COPYRIGHT & TAKEDOWN"
      path="/copyright"
      title="Rights and takedown requests"
    >
      <section>
        <h2>What to include</h2>
        <p>
          Identify the event page and media, describe your relationship to the work, state the
          requested action and provide a reliable way to respond. Do not send sensitive identity
          documents unless specifically requested through a secure channel.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        {email ? (
          <p>
            Email: <a href={`mailto:${email}`}>{email}</a>
          </p>
        ) : (
          <p role="status">
            The takedown contact address has not yet been configured; Production launch remains
            blocked when contact configuration is required.
          </p>
        )}
      </section>
    </LaunchPolicyPage>
  );
}
