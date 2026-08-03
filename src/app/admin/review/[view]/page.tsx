import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { connectorManifests } from "@/lib/discovery/connectors/registry";
import { getEditorialAdminSession } from "@/lib/editorial/admin";
import { groupCandidatesByState } from "@/lib/editorial/candidateGrouping";
import { ManualGdeltDryRunControl } from "../ManualGdeltDryRunControl";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Editorial review | India Observed",
  robots: { index: false, follow: false },
};

const views = [
  ["today", "Today"],
  ["new-events", "New Events"],
  ["event-updates", "Event Updates"],
  ["media", "Media"],
  ["sources", "Sources"],
  ["scan-runs", "Scan Runs"],
  ["settings", "Settings"],
  ["coverage", "Source Coverage"],
  ["compliance", "Compliance"],
] as const;
type View = (typeof views)[number][0];

type Candidate = {
  id: string;
  candidate_type: string;
  suggested_title: string | null;
  state: string | null;
  district_or_region: string | null;
  priority: string;
  confidence: number | null;
  corroboration_status: string;
  independent_source_count: number;
  review_status: string;
  discovery_time: string;
  target_event_slug: string | null;
};
type Compliance = {
  id: string;
  platform_or_source_name: string;
  subject_type: string;
  legal_review_status: string;
  review_expires_at: string | null;
  production_enabled: boolean;
  paywall_status: string;
  robots_policy: string;
  decision_reason: string;
};
type ScanSource = {
  id: string;
  name: string;
  source_type: string;
  state: string | null;
  language: string;
  enabled: boolean;
  scan_method: string;
  manual_dry_run_only: boolean;
  manual_run_consumed_at: string | null;
  connector_config: Record<string, unknown> | null;
  last_successful_scan: string | null;
  last_error_summary: string | null;
  compliance_registry_id: string | null;
};

export default async function EditorialReviewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view: requestedView } = await params;
  if (!views.some(([view]) => view === requestedView)) notFound();
  const view = requestedView as View;
  const session = await getEditorialAdminSession();
  if (!session.user)
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/admin/review/${view}`)}`);
  if (!session.editor || !session.supabase) notFound();

  const [
    candidateResult,
    scanResult,
    sourceResult,
    complianceResult,
    mediaResult,
    requestResult,
    coverageResult,
  ] = await Promise.all([
    session.supabase
      .from("editorial_candidates")
      .select(
        "id,candidate_type,suggested_title,state,district_or_region,priority,confidence,corroboration_status,independent_source_count,review_status,discovery_time,target_event_slug",
      )
      .order("discovery_time", { ascending: false })
      .limit(100),
    session.supabase
      .from("scan_runs")
      .select(
        "id,status,trigger_type,started_at,completed_at,source_count,success_count,failure_count,dry_run,quota_usage",
      )
      .order("started_at", { ascending: false })
      .limit(20),
    session.supabase
      .from("scan_sources")
      .select(
        "id,name,source_type,state,language,enabled,scan_method,manual_dry_run_only,manual_run_consumed_at,connector_config,last_successful_scan,last_error_summary,compliance_registry_id",
      )
      .order("name"),
    session.supabase
      .from("compliance_registry")
      .select(
        "id,platform_or_source_name,subject_type,legal_review_status,review_expires_at,production_enabled,paywall_status,robots_policy,decision_reason",
      )
      .order("platform_or_source_name"),
    session.supabase
      .from("candidate_media")
      .select(
        "id,candidate_id,media_type,publisher,creator,rights_display_status,privacy_concern,safety_concern,review_status,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    session.supabase
      .from("compliance_requests")
      .select("id,request_type,affected_url_or_record,received_at,emergency,status")
      .order("received_at", { ascending: false })
      .limit(50),
    session.supabase.from("source_coverage_metrics").select("*").order("state").order("name"),
  ]);
  const error = [
    candidateResult,
    scanResult,
    sourceResult,
    complianceResult,
    mediaResult,
    requestResult,
    coverageResult,
  ].find((result) => result.error)?.error;
  if (error) throw new Error("Private editorial review data could not be loaded.");
  const candidates = (candidateResult.data ?? []) as Candidate[];
  const compliance = (complianceResult.data ?? []) as Compliance[];
  const sources = (sourceResult.data ?? []) as ScanSource[];
  const approvedManualSources = sources.filter((source) => {
    const review = compliance.find((record) => record.id === source.compliance_registry_id);
    return (
      source.name === "GDELT DOC API" &&
      source.scan_method === "gdelt" &&
      source.enabled === false &&
      source.manual_dry_run_only &&
      source.manual_run_consumed_at === null &&
      source.connector_config?.status === "approved_for_manual_dry_run_only" &&
      review?.production_enabled === true &&
      review.legal_review_status === "approved_for_controlled_metadata_dry_run" &&
      Boolean(review.review_expires_at && new Date(review.review_expires_at) > new Date())
    );
  });
  const activeManualRun = (scanResult.data ?? []).some(
    (run) =>
      run.trigger_type === "manual_gdelt_dry_run" &&
      (run.status === "queued" || run.status === "running"),
  );
  const dryRunDisabledReason = activeManualRun
    ? "A dry scan is already running."
    : approvedManualSources.length === 0
      ? "The approved one-time GDELT dry scan is not currently available."
      : null;
  const filtered = candidates.filter((candidate) =>
    view === "new-events"
      ? candidate.candidate_type === "new_event"
      : view === "event-updates"
        ? ["event_update", "official_response", "new_source"].includes(candidate.candidate_type)
        : true,
  );
  const title = views.find(([key]) => key === view)?.[1] ?? "Review";

  return (
    <ArchiveShell authReturnTo={`/admin/review/${view}`}>
      <main className="editor-review page-shell">
        <header className="editor-review__header">
          <div>
            <p className="section-kicker">PRIVATE EDITORIAL WORKSPACE</p>
            <h1>{title}</h1>
            <p>
              Discovery creates review candidates only. Nothing here publishes, emails followers, or
              writes to GitHub automatically.
            </p>
          </div>
          <form action="/auth/sign-out" method="post">
            <input type="hidden" name="returnTo" value="/" />
            <button type="submit">Log out</button>
          </form>
        </header>
        <nav aria-label="Editorial review views" className="editor-review__nav">
          {views.map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/review/${key}`}
              aria-current={view === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <dl className="editor-review__metrics">
          <div>
            <dt>Unreviewed</dt>
            <dd>{candidates.filter((item) => item.review_status === "unreviewed").length}</dd>
          </div>
          <div>
            <dt>High priority</dt>
            <dd>
              {
                candidates.filter((item) =>
                  ["high", "urgent_editor_attention"].includes(item.priority),
                ).length
              }
            </dd>
          </div>
          <div>
            <dt>Source failures</dt>
            <dd>{sources.filter((item) => item.last_error_summary).length}</dd>
          </div>
          <div>
            <dt>Production connectors</dt>
            <dd>{approvedManualSources.length}</dd>
            <small>Manual dry-run only · scheduled scanning disabled</small>
          </div>
        </dl>
        {view === "today" || view === "scan-runs" ? (
          <ManualGdeltDryRunControl disabledReason={dryRunDisabledReason} />
        ) : null}
        {view === "compliance" ? (
          <ComplianceView
            records={compliance}
            media={mediaResult.data ?? []}
            requests={requestResult.data ?? []}
          />
        ) : view === "coverage" || view === "sources" ? (
          <CoverageView sources={coverageResult.data ?? []} compliance={compliance} />
        ) : view === "scan-runs" ? (
          <JsonTable title="Recent scan runs" rows={scanResult.data ?? []} />
        ) : view === "settings" ? (
          <SettingsView />
        ) : view === "media" ? (
          <JsonTable
            title="Media awaiting rights, privacy and safety review"
            rows={mediaResult.data ?? []}
          />
        ) : (
          <CandidateList candidates={filtered} />
        )}
      </main>
    </ArchiveShell>
  );
}

function CandidateList({ candidates }: { candidates: Candidate[] }) {
  const groups = groupCandidatesByState(candidates);
  return (
    <section aria-labelledby="candidate-heading">
      <h2 id="candidate-heading">Review queue</h2>
      {candidates.length === 0 ? (
        <p className="editor-review__empty">
          No candidates in this view. Production scanning is disabled.
        </p>
      ) : (
        <div className="editor-review__state-groups">
          {groups.map((group) => (
            <section key={group.state} aria-labelledby={`state-${group.state}`}>
              <h3 id={`state-${group.state}`}>{group.state}</h3>
              <ol className="editor-review__list">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <span className="editor-review__badge">
                        {item.candidate_type.replaceAll("_", " ")}
                      </span>
                      <span>{item.priority}</span>
                    </div>
                    <h3>
                      <Link href={`/admin/review/candidates/${item.id}`}>
                        {item.suggested_title ?? "Untitled candidate"}
                      </Link>
                    </h3>
                    <p>
                      {[item.state, item.district_or_region, item.target_event_slug]
                        .filter(Boolean)
                        .join(" · ") || "Location or event match requires review"}
                    </p>
                    <dl>
                      <div>
                        <dt>Confidence</dt>
                        <dd>
                          {item.confidence === null
                            ? "Not scored"
                            : `${Math.round(item.confidence * 100)}%`}
                        </dd>
                      </div>
                      <div>
                        <dt>Corroboration</dt>
                        <dd>
                          {item.corroboration_status.replaceAll("_", " ")} (
                          {item.independent_source_count})
                        </dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{item.review_status.replaceAll("_", " ")}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
function CoverageView({
  sources,
  compliance,
}: {
  sources: Array<Record<string, unknown>>;
  compliance: Compliance[];
}) {
  return (
    <section>
      <h2>Source coverage and health</h2>
      <p>
        {sources.length} configured sources; {sources.filter((source) => source.enabled).length}{" "}
        enabled. Connector implementations do not imply source permission.
      </p>
      <JsonTable title="Configured sources" rows={sources} />
      <p>
        Weak states and languages are those with no enabled source or sustained low accepted yield.
        With production sources disabled, all coverage remains intentionally weak.
      </p>
      <h2>Connector capability</h2>
      <div className="editor-review__cards">
        {connectorManifests.map((item) => (
          <article key={item.id}>
            <h3>{item.label}</h3>
            <p>
              <strong>{item.status.replaceAll("_", " ")}</strong> · Production disabled
            </p>
            <p>{item.accessNotes}</p>
            <small>{item.retainedData}</small>
          </article>
        ))}
      </div>
      <p>
        {compliance.filter((record) => record.legal_review_status === "not_reviewed").length}{" "}
        compliance records await review.
      </p>
    </section>
  );
}
function ComplianceView({
  records,
  media,
  requests,
}: {
  records: Compliance[];
  media: Array<Record<string, unknown>>;
  requests: Array<Record<string, unknown>>;
}) {
  return (
    <section>
      <h2>Legal and platform gates</h2>
      <p>
        Designed with documented compliance controls; final legal assessment remains the
        responsibility of qualified counsel.
      </p>
      <dl className="editor-review__metrics">
        <div>
          <dt>Awaiting review</dt>
          <dd>
            {records.filter((record) => record.legal_review_status === "not_reviewed").length}
          </dd>
        </div>
        <div>
          <dt>Reviews with expiry</dt>
          <dd>{records.filter((record) => record.review_expires_at).length}</dd>
        </div>
        <div>
          <dt>Unknown media rights</dt>
          <dd>
            {media.filter((item) => item.rights_display_status === "unknown_pending_review").length}
          </dd>
        </div>
        <div>
          <dt>Open requests</dt>
          <dd>{requests.filter((item) => item.status !== "completed").length}</dd>
        </div>
      </dl>
      <JsonTable title="Connector and source reviews" rows={records} />
      <JsonTable title="Takedown, correction and deletion requests" rows={requests} />
    </section>
  );
}
function SettingsView() {
  return (
    <section>
      <h2>Fail-closed production settings</h2>
      <ul>
        <li>Daily scan schedule: 05:00 IST / 23:30 UTC, disabled</li>
        <li>Editor digest: 08:00 IST / 02:30 UTC, outbound email disabled</li>
        <li>GitHub writes and autonomous publication: disabled</li>
        <li>Follower email and real notifications: disabled</li>
        <li>
          Activation requires technical, security, source, platform, copyright, privacy, retention,
          vendor, counsel and owner approval.
        </li>
      </ul>
    </section>
  );
}
function JsonTable({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  return (
    <section className="editor-review__table-wrap">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="editor-review__empty">No records.</p>
      ) : (
        <table>
          <thead>
            <tr>
              {Object.keys(rows[0]!)
                .slice(0, 7)
                .map((key) => (
                  <th key={key}>{key.replaceAll("_", " ")}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {Object.entries(row)
                  .slice(0, 7)
                  .map(([key, value]) => (
                    <td key={key}>
                      {value === null
                        ? "—"
                        : typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : String(value)}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
