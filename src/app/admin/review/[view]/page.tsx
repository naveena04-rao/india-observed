import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { connectorManifests } from "@/lib/discovery/connectors/registry";
import { getEditorialAdminSession } from "@/lib/editorial/admin";
import {
  groupCandidatesByState,
  partitionCandidateReviewRows,
} from "@/lib/editorial/candidateGrouping";
import { ManualGdeltDryRunControl } from "../ManualGdeltDryRunControl";
import { ManualFallbackDryRunControl } from "../ManualFallbackDryRunControl";
import { ManualPibRssDryRunControl } from "../ManualPibRssDryRunControl";
import { ManualDailyScannerControl } from "../ManualDailyScannerControl";

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
  target_event_internal_id: string | null;
  matching_signals: string[];
  conflicting_signals: string[];
  source_is_newer_than_event: boolean | null;
  candidate_sources: Array<{
    publisher: string | null;
    canonical_url: string;
    published_at: string | null;
    source_family: string | null;
  }>;
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
        "id,candidate_type,suggested_title,state,district_or_region,priority,confidence,corroboration_status,independent_source_count,review_status,discovery_time,target_event_slug,target_event_internal_id,matching_signals,conflicting_signals,source_is_newer_than_event,candidate_sources(publisher,canonical_url,published_at,source_family)",
      )
      .order("discovery_time", { ascending: false })
      .limit(100),
    session.supabase
      .from("scan_runs")
      .select(
        "id,status,trigger_type,started_at,completed_at,source_count,success_count,failure_count,dry_run,quota_usage,scan_jobs(status,attempt_count,request_count,items_discovered,error_code,safe_error_summary)",
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
  const approvedFallbackSources = sources.filter((source) => {
    const review = compliance.find((record) => record.id === source.compliance_registry_id);
    return (
      source.enabled &&
      ["rss", "atom", "sitemap", "html_list", "youtube_api", "bluesky_api"].includes(
        source.scan_method,
      ) &&
      review?.production_enabled === true &&
      [
        "approved_metadata_only",
        "approved_link_and_excerpt",
        "approved_official_api",
        "approved_internal_review_only",
      ].includes(review.legal_review_status) &&
      review.robots_policy !== "not_assessed" &&
      review.robots_policy !== "restricted" &&
      review.robots_policy !== "forbidden" &&
      Boolean(review.review_expires_at && new Date(review.review_expires_at) > new Date())
    );
  });
  const activeFallbackRun = (scanResult.data ?? []).some(
    (run) =>
      run.trigger_type === "manual_fallback_dry_run" &&
      (run.status === "queued" || run.status === "running"),
  );
  const approvedPibRssSources = sources.filter((source) => {
    const review = compliance.find((record) => record.id === source.compliance_registry_id);
    return (
      source.name === "Press Information Bureau RSS" &&
      source.scan_method === "rss" &&
      source.enabled === false &&
      source.manual_dry_run_only &&
      source.manual_run_consumed_at === null &&
      source.connector_config?.status === "approved_for_one_manual_metadata_dry_run_only" &&
      review?.production_enabled === true &&
      review.legal_review_status === "approved_for_controlled_metadata_dry_run" &&
      Boolean(review.review_expires_at && new Date(review.review_expires_at) > new Date())
    );
  });
  const activePibRssRun = (scanResult.data ?? []).some(
    (run) =>
      run.trigger_type === "manual_pib_rss_dry_run" &&
      (run.status === "queued" || run.status === "running"),
  );
  const approvedDailySources = sources.filter((source) => {
    const review = compliance.find((record) => record.id === source.compliance_registry_id);
    return (
      source.enabled &&
      !source.manual_dry_run_only &&
      source.connector_config?.status === "approved_metadata_only" &&
      ["rss", "atom", "sitemap", "html_list"].includes(source.scan_method) &&
      review?.production_enabled === true &&
      ["approved_metadata_only", "approved_internal_review_only"].includes(
        review.legal_review_status,
      ) &&
      ["allowed", "not_applicable"].includes(review.robots_policy) &&
      Boolean(review.review_expires_at && new Date(review.review_expires_at) > new Date())
    );
  });
  const activeDailyScannerRun = (scanResult.data ?? []).some(
    (run) =>
      ["manual_daily_scanner_dry_run", "scheduled"].includes(run.trigger_type) &&
      (run.status === "queued" || run.status === "running"),
  );
  const dryRunDisabledReason = activeManualRun
    ? "A dry scan is already running."
    : approvedManualSources.length === 0
      ? "The approved one-time GDELT dry scan is not currently available."
      : null;
  const fallbackDisabledReason = activeFallbackRun
    ? "A fallback dry scan is already running."
    : approvedFallbackSources.length === 0
      ? "No approved non-GDELT production source is currently available."
      : null;
  const pibRssDisabledReason = activePibRssRun
    ? "A PIB RSS dry scan is already running."
    : approvedPibRssSources.length === 0
      ? "The approved one-time PIB RSS dry scan is not currently available."
      : null;
  const dailyScannerDisabledReason = activeDailyScannerRun
    ? "A daily-scanner run is already active."
    : approvedDailySources.length < 2
      ? "At least two approved, working daily sources are required."
      : null;
  const { eventCandidates, diagnostics } = partitionCandidateReviewRows(candidates);
  const filtered = eventCandidates.filter((candidate) =>
    view === "new-events"
      ? candidate.candidate_type === "new_event"
      : view === "event-updates"
        ? ["event_update", "official_response", "outcome_status_change"].includes(
            candidate.candidate_type,
          )
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
            <dd>{eventCandidates.filter((item) => item.review_status === "unreviewed").length}</dd>
          </div>
          <div>
            <dt>High priority</dt>
            <dd>
              {
                eventCandidates.filter((item) =>
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
            <dd>{approvedDailySources.length}</dd>
            <small>Daily source readiness; schedule state is shown under Settings</small>
          </div>
        </dl>
        {view === "today" || view === "scan-runs" ? (
          <>
            <ManualGdeltDryRunControl disabledReason={dryRunDisabledReason} />
            <ManualFallbackDryRunControl disabledReason={fallbackDisabledReason} />
            <ManualPibRssDryRunControl disabledReason={pibRssDisabledReason} />
            <ManualDailyScannerControl disabledReason={dailyScannerDisabledReason} />
          </>
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
        ) : view === "today" ? (
          <>
            <CandidateList heading="Event candidates" candidates={filtered} />
            <CandidateList heading="Scanner diagnostics" candidates={diagnostics} collapsed />
          </>
        ) : (
          <CandidateList heading={title} candidates={filtered} />
        )}
      </main>
    </ArchiveShell>
  );
}

function CandidateList({
  heading,
  candidates,
  collapsed = false,
}: {
  heading: string;
  candidates: Candidate[];
  collapsed?: boolean;
}) {
  const groups = groupCandidatesByState(candidates);
  const headingId = `candidate-heading-${heading.toLowerCase().replaceAll(" ", "-")}`;
  const content =
    candidates.length === 0 ? (
      <p className="editor-review__empty">No candidates in this view.</p>
    ) : (
      <div className="editor-review__state-groups">
        {groups.map((group) => (
          <section key={group.state} aria-labelledby={`${headingId}-${group.state}`}>
            <h3 id={`${headingId}-${group.state}`}>{group.state}</h3>
            <CandidateCards items={group.items} />
          </section>
        ))}
      </div>
    );
  return (
    <section aria-labelledby={headingId} className="editor-review__candidate-section">
      <h2 id={headingId}>{heading}</h2>
      {collapsed ? (
        <details>
          <summary>Show {candidates.length} diagnostic rows</summary>
          <p>
            Irrelevant, duplicate, failed, generic manual-review and sub-50% confidence rows remain
            available here for private scanner QA.
          </p>
          {content}
        </details>
      ) : (
        content
      )}
    </section>
  );
}

function CandidateCards({ items }: { items: Candidate[] }) {
  return (
    <ol className="editor-review__list">
      {items.map((item) => (
        <li key={item.id}>
          <div>
            <span className="editor-review__badge">{item.candidate_type.replaceAll("_", " ")}</span>
            <span>{item.priority}</span>
          </div>
          <h3>
            <Link href={`/admin/review/candidates/${item.id}`}>
              {item.suggested_title ?? "Untitled candidate"}
            </Link>
          </h3>
          <p>
            {[
              item.state,
              item.district_or_region,
              item.target_event_internal_id ?? item.target_event_slug,
            ]
              .filter(Boolean)
              .join(" · ") || "Location or event match requires review"}
          </p>
          {item.candidate_sources[0] ? (
            <p>
              <a href={item.candidate_sources[0].canonical_url} target="_blank" rel="noreferrer">
                {item.candidate_sources[0].publisher ??
                  item.candidate_sources[0].source_family ??
                  "Open source"}
              </a>
              {item.candidate_sources[0].published_at
                ? ` · ${new Date(item.candidate_sources[0].published_at).toLocaleString("en-IN")}`
                : ""}
            </p>
          ) : null}
          <p>{item.matching_signals.join(" · ") || "No existing-event match signals"}</p>
          <dl>
            <div>
              <dt>Confidence</dt>
              <dd>
                {item.confidence === null ? "Not scored" : `${Math.round(item.confidence * 100)}%`}
              </dd>
            </div>
            <div>
              <dt>Corroboration</dt>
              <dd>
                {item.corroboration_status.replaceAll("_", " ")} ({item.independent_source_count})
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
