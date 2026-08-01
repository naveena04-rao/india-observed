import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";
import { getPublicContactEmail } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Public contact channels for India Observed.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = getPublicContactEmail();
  return (
    <LaunchPolicyPage
      description="Use the public channel below for corrections, source suggestions, privacy concerns and rights requests."
      kicker="CONTACT"
      path="/contact"
      title="Contact India Observed"
    >
      <section>
        <h2>Public contact</h2>
        {email ? (
          <p>
            Email: <a href={`mailto:${email}`}>{email}</a>
          </p>
        ) : (
          <p role="status">
            The public contact address has not yet been configured. Production launch remains
            blocked when contact configuration is required.
          </p>
        )}
        <p>
          Do not email participant lists, tactical locations, confidential-source identities or
          unnecessary personal data.
        </p>
      </section>
    </LaunchPolicyPage>
  );
}
