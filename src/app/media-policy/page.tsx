import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";

export const metadata = {
  title: "Media policy",
  description: "Rights, source, privacy and safety rules for India Observed event media.",
  alternates: { canonical: "/media-policy" },
};

export default function MediaPolicyPage() {
  return (
    <LaunchPolicyPage
      description="Only media depicting the exact event may be approved, and source links or credit alone never establish permission."
      kicker="MEDIA POLICY"
      path="/media-policy"
      presentation="standards"
      title="Exact event, lawful display, human approval"
    >
      <section>
        <h2>Uploaded images</h2>
        <p>
          Uploads require ownership, explicit permission, official reuse terms, a supported Creative
          Commons licence, CC0 or public-domain status. Files are re-encoded as WebP and metadata is
          removed before publication.
        </p>
      </section>
      <section>
        <h2>Official embeds</h2>
        <p>
          Publisher video and official social posts remain hosted by their publisher or platform.
          India Observed does not download, crop, rehost or extract unofficial streams.
        </p>
      </section>
      <section>
        <h2>Fail-closed review</h2>
        <p>
          Same-event matching, approved-source membership, privacy, safety, integrity and a human
          reviewer are all required. A failed gate results in withdrawal and a truthful fallback.
        </p>
      </section>
    </LaunchPolicyPage>
  );
}
