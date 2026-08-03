import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const evidenceDataset = read("src/data/reviewed-event-evidence-preview.ts");
const fallbackRegistry = read("src/data/event-media-registry.ts");
const publicLoader = read("src/lib/media/public.ts");
const mediaTypes = read("src/lib/events/types.ts");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const archiveMediaPreview = read("src/app/events/components/ArchiveMediaPreview.tsx");
const classificationLabel = read("src/app/events/components/MediaClassificationLabel.tsx");
const homepageEventEmbed = read("src/app/events/components/HomepageEventEmbed.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const detailPage = read("src/app/events/[slug]/page.tsx");
const homepageCarousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const homepagePage = read("src/app/page.tsx");
const rootLayout = read("src/app/layout.tsx");
const publicPresentation = read("src/lib/media/presentation.ts");
const adminReviewMedia = read("src/app/admin/media/homepage-review/HomepageReviewMedia.tsx");
const archivePage = read("src/app/events/page.tsx");
const archiveRow = read("src/app/events/components/EventArchiveRow.tsx");
const homepage = read("src/app/page.tsx");
const styles = read("src/app/globals.css");
const policy = read("docs/MEDIA_POLICY.md");
const audit = read("docs/EVENT_MEDIA_AUDIT.md");
const homepageMediaImport = read(
  "supabase/migrations/20260729000300_import_homepage_event_media.sql",
);
const archivePreviewMigration = read(
  "supabase/migrations/20260730000100_add_archive_embed_previews.sql",
);
const archivePreviewPreparation = read("scripts/media-prepare-archive-previews.mjs");

const publishedSlugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const auditRows = audit.split(/\r?\n/).filter((line) => line.startsWith("| `"));
const auditSlugs = auditRows.map((line) => line.match(/^\|\s+`([^`]+)`/)?.[1]);

function filesRecursively(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesRecursively(path) : [path];
  });
}

test("all 50 static records use a truthful fallback until database approval", () => {
  assert.equal(publishedSlugs.length, 50);
  assert.equal(new Set(publishedSlugs).size, 50);
  assert.match(fallbackRegistry, /createNoApprovedMediaVisual\(event\)/);
  assert.doesNotMatch(fallbackRegistry, /publisher_video|social_embed|https?:\/\//);
  assert.match(dataset, /createEventMediaRegistry\(reviewedEventsWithoutMedia\)/);
  assert.match(eventVisual, /Verified visual unavailable/);
  assert.doesNotMatch(eventVisual, /No approved event image available/);
  assert.match(eventVisual, /visual\.title/);
  assert.match(eventVisual, /visual\.location/);
  assert.match(eventVisual, /visual\.dateOrStatus/);
  assert.match(eventVisual, /visual\.sourceCount/);
  assert.match(eventVisual, />View event sources</);
});

test("the public model supports only approved images, publisher videos and official posts", () => {
  for (const mediaType of [
    "uploaded_event_image",
    "publisher_video_embed",
    "official_social_embed",
  ]) {
    assert.match(mediaTypes, new RegExp(`"${mediaType}"`));
  }
  for (const forbidden of [
    "context_media",
    "documentary_context",
    "editorial_illustration",
    "stock_image",
    "representative_image",
  ]) {
    assert.doesNotMatch(mediaTypes + fallbackRegistry + eventVisual, new RegExp(forbidden));
  }
});

test("approved public media is loaded server-side and rechecked against the media-source registry", () => {
  assert.match(publicLoader, /import "server-only"/);
  assert.match(publicLoader, /rpc\("get_public_event_media"/);
  assert.match(publicLoader, /event\.publicationStatus !== "published"/);
  assert.match(publicLoader, /row\.approved_source_verified/);
  assert.match(
    homepageMediaImport,
    /exists \([\s\S]*?from public\.media_event_sources mes[\s\S]*?mes\.source_url = em\.source_url/,
  );
  assert.match(publicLoader, /event-media-public/);
  assert.doesNotMatch(publicLoader, /event-media-staging/);
  assert.match(publicLoader, /approved\.has\(row\.event_slug\)/);
});

test("contextual assets and obsolete external image infrastructure remain absent", () => {
  const publicMediaRoot = fileURLToPath(new URL("../public/media/events", import.meta.url));
  assert.deepEqual(filesRecursively(publicMediaRoot), []);
  assert.equal(
    existsSync(new URL("../src/app/events/components/ExternalMediaImage.tsx", import.meta.url)),
    false,
  );
  assert.doesNotMatch(fallbackRegistry, /Wikimedia Commons|thumbnailUrl|publisher_image/);
});

test("official embeds remain click-to-load while archive rows use approved preview images", () => {
  assert.match(detailMedia, /useState<"idle" \| "loaded" \| "failed">\("idle"\)/);
  assert.match(detailMedia, /embedState === "loaded" \? \([\s\S]*?<iframe/);
  assert.match(detailMedia, /onClick=\{\(\) => setEmbedState\("loaded"\)\}/);
  assert.match(detailMedia, /No third-party frame loads[\s\S]*?before activation/);
  assert.match(detailMedia, /Event media unavailable/);
  assert.match(eventVisual, /<ArchiveMediaPreview/);
  assert.doesNotMatch(eventVisual, /event-source-media-cover/);
  assert.match(archiveMediaPreview, /approvedMedia\.previewImageUrl/);
  assert.match(archiveMediaPreview, /approvedMedia\.previewAltText/);
  assert.match(archiveMediaPreview, /href=\{eventHref\}/);
  assert.match(archiveMediaPreview, /onError=\{\(\) => setUnavailable\(true\)\}/);
  assert.match(archiveMediaPreview, /Event media unavailable/);
  assert.match(archiveMediaPreview, /href=\{approvedMedia\.sourceUrl\}/);
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
  assert.doesNotMatch(eventVisual, /iframe/i);
  assert.doesNotMatch(archiveMediaPreview, /iframe/i);
});

test("embed archive previews have independent provenance and all five review gates", () => {
  for (const field of [
    "preview_storage_path",
    "preview_same_event_verified",
    "preview_privacy_reviewed",
    "preview_safety_reviewed",
    "preview_integrity_reviewed",
    "preview_approved_source_verified",
  ]) {
    assert.match(archivePreviewMigration, new RegExp(field));
    assert.match(publicLoader, new RegExp(field));
  }
  assert.match(archivePreviewMigration, /preview_original_media_url/);
  assert.match(archivePreviewMigration, /preview_original_sha256/);
  assert.match(archivePreviewMigration, /preview_derivative_sha256/);
  assert.match(archivePreviewMigration, /event_media_approved_embed_preview_complete/);
  assert.match(archivePreviewMigration, /\/preview\.webp/);
  assert.match(publicLoader, /approved-event-media-v4/);
  assert.match(
    publicLoader,
    /if \(!availability\.enabled\) return \[\];[\s\S]*?loadPublicMediaRowsFromEnabledLibrary\(availability\.projectRef\)/,
  );
});

test("all four existing approved embeds receive matching archive preview derivatives", () => {
  for (const [mediaId, slug] of [
    ["14000000-0000-4000-8000-000000000001", "jamia-yuva-kumbh-campus-protest"],
    ["14000000-0000-4000-8000-000000000004", "dasiya-villagers-ethanol-plant"],
    ["14000000-0000-4000-8000-000000000005", "indore-dewas-ring-road-compensation"],
    ["15000000-0000-4000-8000-000000000001", "bidadi-farmers-land-acquisition"],
  ]) {
    assert.match(archivePreviewMigration, new RegExp(mediaId.replaceAll("-", "\\-")));
    assert.match(archivePreviewPreparation, new RegExp(slug));
  }
  assert.match(archivePreviewMigration, /event_slug \|\| '\/' \|\| id \|\| '\/preview\.webp'/);
  assert.match(
    archivePreviewMigration,
    /Jamia[\s\S]*?unrelated article-level file photograph was rejected/,
  );
});

test("uploaded media has visible credit, source, licence and focal-position handling", () => {
  assert.match(eventVisual, /getPublicMediaCaption\(approvedMedia\)/);
  assert.match(eventVisual, /href=\{approvedMedia\.sourceUrl\}/);
  assert.match(eventVisual, /objectPosition: approvedMedia\.focalPosition/);
  assert.match(detailMedia, /getPublicDisplayBasis\(approvedMedia\)/);
  assert.match(detailMedia, /approvedMedia\.licenceUrl/);
  assert.match(detailMedia, /Reviewed \{new Date\(approvedMedia\.approvedAt\)/);
  assert.match(detailMedia, /Rights remain with the credited creator or publisher\./);
  assert.match(detailPage, /approvedMedia=\{event\.approvedMedia\}/);
});

test("public routes omit internal media-verification labels while retaining useful credits", () => {
  const publicRouteSources = [
    homepagePage,
    homepageCarousel,
    homepageEventEmbed,
    archivePage,
    archiveRow,
    eventVisual,
    detailPage,
    detailMedia,
    rootLayout,
  ].join("\n");

  assert.doesNotMatch(publicRouteSources, /Verified event media/i);
  assert.doesNotMatch(publicRouteSources, /Same-event verified/i);
  assert.doesNotMatch(publicRouteSources, /Editorial current-events display/i);
  assert.doesNotMatch(publicRouteSources, /rightsBasis\.replaceAll/);
  assert.match(classificationLabel, /if \(evidenceClass === "verified_event_media"\) return null/);
  assert.match(publicPresentation, /return `\$\{getPublicMediaKind\(media\)\}: /);
  assert.match(publicPresentation, /"Photo" \| "Video" \| "Post"/);
  assert.match(publicPresentation, /`Source: \$\{media\.publisher\}`/);
  assert.match(publicPresentation, /View original source/);
  assert.match(publicPresentation, /View original/);
  assert.match(adminReviewMedia, /Verified event media/);
});

test("internal approval gates remain mandatory and are not exposed as public display text", () => {
  for (const field of [
    "same_event_verified",
    "privacy_reviewed",
    "safety_reviewed",
    "integrity_reviewed",
    "approved_source_verified",
  ]) {
    assert.match(publicLoader, new RegExp(field));
  }
  assert.match(
    publicLoader,
    /!row\.same_event_verified[\s\S]*?!row\.privacy_reviewed[\s\S]*?!row\.safety_reviewed[\s\S]*?!row\.integrity_reviewed[\s\S]*?!row\.approved_source_verified[\s\S]*?continue/,
  );
  assert.match(publicLoader, /event\.publicationStatus !== "published"\) continue/);
});

test("source-document previews retain their public distinction whenever one is configured", () => {
  const publicMediaSources = [eventVisual, homepageEventEmbed, detailMedia].join("\n");
  const usesSourceDocumentPreview = /Source document preview/i.test(publicMediaSources);

  if (usesSourceDocumentPreview) {
    assert.match(publicMediaSources, /Source document preview — not an event photograph/);
  } else {
    assert.match(
      audit,
      /`kolli-hills-land-patta-protest`[\s\S]*?No displayable exact-event candidate approved/,
    );
  }
});

test("approved-media dimensions are substantial while fallbacks may remain compact", () => {
  assert.match(styles, /\.event-record-visual,[\s\S]*?max-width: 68\.75rem/);
  assert.match(styles, /\.event-approved-image \{[\s\S]*?aspect-ratio: 16 \/ 9/);
  assert.match(
    styles,
    /\.event-archive-row \{[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(20rem, 42fr\)/,
  );
  assert.match(
    styles,
    /\.event-archive-row--fallback \{[\s\S]*?minmax\(0, 72fr\) minmax\(15rem, 28fr\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 700px\)[\s\S]*?\.event-record-visual \{[\s\S]*?width: calc\(100% \+ 2rem\)/,
  );
});

test("the source-only audit still covers every published record and source", () => {
  assert.equal(auditRows.length, 50);
  assert.equal(new Set(auditSlugs).size, 50);
  assert.deepEqual([...auditSlugs].sort(), [...publishedSlugs].sort());
  assert.match(audit, /165\s+approved source records available/i);
  assert.equal(
    Object.values(
      Function(
        `"use strict"; return (${evidenceDataset.slice(
          evidenceDataset.indexOf("export const reviewedEventEvidenceByInternalId = ") +
            "export const reviewedEventEvidenceByInternalId = ".length,
          evidenceDataset.indexOf(" as const satisfies"),
        )});`,
      )(),
    ).flatMap((event) => event.sources).length,
    172,
  );
});

test("media policy keeps source, credit, rights, privacy and safety as separate gates", () => {
  const normalised = policy.replace(/\s+/g, " ");
  for (const statement of [
    "A source article is not automatically a media licence.",
    "A search-engine image result is never sufficient provenance.",
    "An `og:image` URL is not itself permission.",
    "Auto-publication remains disabled",
    "No approved event image available",
  ]) {
    assert.match(normalised, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(policy, /rights approval cannot override a failed verification/i);
});

test("event facts, sources, safety, following and authentication remain wired", () => {
  assert.match(homepage, /EventFollowControl/);
  assert.match(detailPage, /EventFollowControl/);
  assert.match(detailPage, /createSessionSupabaseClient/);
  assert.match(detailPage, /<EventSafety event=\{event\} \/>/);
  assert.match(detailPage, /<EventSources sources=\{event\.sources\} \/>/);
});
