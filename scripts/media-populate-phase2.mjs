import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const developmentProjectRef = "czdsfqykhpwiijhxwbps";
const mediaTables = [
  "media_event_registry",
  "media_event_sources",
  "event_media",
  "event_media_private_review",
  "media_admins",
];
const mediaBuckets = ["event-media-staging", "event-media-public"];

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value.replaceAll("\\n", "\n");
  }
  return values;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isWebp(bytes) {
  return (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function containsSensitiveMetadata(bytes) {
  return /\b(?:Exif|GPSLatitude|GPSLongitude|GPSInfo|xmpmeta)\b/i.test(bytes.toString("latin1"));
}

function safeDatabaseError(error) {
  const code = typeof error?.code === "string" ? error.code : "unknown";
  const message = typeof error?.message === "string" ? error.message : "database request failed";
  return `${code}: ${message}`;
}

async function loadConfiguration(envPath) {
  const env = parseEnv(await readFile(resolve(envPath), "utf8"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Preview Supabase URL, anonymous key and service-role key are required.");
  }
  const projectRef = new URL(url).hostname.split(".")[0];
  if (projectRef !== developmentProjectRef) {
    throw new Error("Phase 2 population is restricted to the India Observed development project.");
  }
  return {
    admin: createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    anonKey,
    projectRef,
    url,
  };
}

async function listBucketObjects(admin, bucket, prefix = "") {
  const objects = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Could not list ${bucket} objects.`);
    const entries = data ?? [];
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) {
        objects.push({ ...entry, path });
      } else {
        objects.push(...(await listBucketObjects(admin, bucket, path)));
      }
    }
    if (entries.length < 100) break;
  }
  return objects;
}

async function backupMedia(admin, backupDir) {
  const destination = resolve(backupDir);
  await mkdir(destination, { recursive: true });
  const tableCounts = {};
  for (const table of mediaTables) {
    const { data, error } = await admin.from(table).select("*");
    if (error) throw new Error(`Could not back up ${table}.`);
    await writeFile(join(destination, `${table}.json`), `${JSON.stringify(data, null, 2)}\n`);
    tableCounts[table] = data.length;
  }

  const storageCounts = {};
  for (const bucket of mediaBuckets) {
    const objects = await listBucketObjects(admin, bucket);
    storageCounts[bucket] = objects.length;
    const metadata = objects.map(({ path, id, name, metadata, created_at, updated_at }) => ({
      path,
      id,
      name,
      metadata,
      created_at,
      updated_at,
    }));
    await writeFile(
      join(destination, `${bucket}-objects.json`),
      `${JSON.stringify(metadata, null, 2)}\n`,
    );
    for (const object of objects) {
      const { data, error } = await admin.storage.from(bucket).download(object.path);
      if (error || !data) throw new Error(`Could not back up ${bucket}/${object.path}.`);
      const outputPath = join(destination, "storage", bucket, ...object.path.split("/"));
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, Buffer.from(await data.arrayBuffer()));
    }
  }
  await writeFile(
    join(destination, "backup-summary.json"),
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        projectRef: developmentProjectRef,
        storageCounts,
        tableCounts,
      },
      null,
      2,
    )}\n`,
  );
  return { destination, storageCounts, tableCounts };
}

async function createTemporaryMediaAdmin(admin, url, anonKey) {
  const email = `media-review-${randomUUID()}@invalid.india-observed.local`;
  const password = randomBytes(36).toString("base64url");
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user)
    throw new Error("Temporary media reviewer could not be created.");
  const userId = created.user.id;
  const { error: allowError } = await admin.from("media_admins").insert({ user_id: userId });
  if (allowError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error("Temporary media reviewer could not be allow-listed.");
  }

  const reviewer = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await reviewer.auth.signInWithPassword({ email, password });
  if (signInError) {
    await admin.from("media_admins").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    throw new Error("Temporary media reviewer could not authenticate.");
  }
  const { data: isAdmin, error: adminError } = await reviewer.rpc("is_media_admin");
  if (adminError || isAdmin !== true) {
    await admin.from("media_admins").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    throw new Error("Protected media-review access could not be confirmed.");
  }
  return { reviewer, userId };
}

async function destroyTemporaryMediaAdmin(admin, reviewer, userId) {
  await reviewer.auth.signOut();
  await admin.from("media_admins").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
}

async function populateMedia({ admin, anonKey, url }, manifestPath, derivativeRoot) {
  const manifest = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
  if (
    manifest.newTreatments !== 39 ||
    manifest.expectedApprovedTreatments !== 50 ||
    manifest.treatments?.length !== 39
  ) {
    throw new Error("Phase 2 manifest totals are invalid.");
  }

  const { count: beforeApproved, error: beforeError } = await admin
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  if (beforeError || beforeApproved !== 11) {
    throw new Error(`Expected 11 preserved approvals before population; found ${beforeApproved}.`);
  }

  const sourceRows = manifest.treatments.map((item) => ({
    event_slug: item.eventSlug,
    source_url: item.sourceUrl,
  }));
  const { error: sourceError } = await admin
    .from("media_event_sources")
    .upsert(sourceRows, { onConflict: "event_slug,source_url", ignoreDuplicates: true });
  if (sourceError) throw new Error("Reviewed media-source relationships could not be recorded.");

  const { reviewer, userId } = await createTemporaryMediaAdmin(admin, url, anonKey);
  const approvedIds = [];
  try {
    for (const item of manifest.treatments) {
      const derivative = await readFile(resolve(derivativeRoot, item.eventSlug, "primary.webp"));
      if (!isWebp(derivative)) throw new Error(`${item.eventSlug}: derivative is not WebP.`);
      if (containsSensitiveMetadata(derivative)) {
        throw new Error(`${item.eventSlug}: derivative contains EXIF/GPS metadata.`);
      }
      if (sha256(derivative) !== item.derivativeSha256) {
        throw new Error(`${item.eventSlug}: derivative SHA-256 mismatch.`);
      }
      if (
        !Number.isInteger(item.derivativeWidth) ||
        !Number.isInteger(item.derivativeHeight) ||
        Math.max(item.derivativeWidth, item.derivativeHeight) > 1600
      ) {
        throw new Error(`${item.eventSlug}: derivative dimensions are invalid.`);
      }

      const { data: existing, error: existingError } = await admin
        .from("event_media")
        .select("id,status,event_slug,source_url,storage_path")
        .eq("id", item.id)
        .maybeSingle();
      if (existingError) throw new Error(`${item.eventSlug}: existing media check failed.`);
      if (existing?.status === "approved") {
        if (
          existing.event_slug !== item.eventSlug ||
          existing.source_url !== item.sourceUrl ||
          existing.storage_path !== item.publicStoragePath
        ) {
          throw new Error(`${item.eventSlug}: an approved media ID has conflicting metadata.`);
        }
        approvedIds.push(item.id);
        continue;
      }

      if (!existing) {
        const { error: mediaError } = await reviewer.from("event_media").insert({
          id: item.id,
          event_slug: item.eventSlug,
          media_type: item.mediaType,
          public_display_kind: item.publicDisplayKind,
          status: "draft",
          storage_path: item.stagingPath,
          source_url: item.sourceUrl,
          publisher: item.publisher,
          creator: item.creator,
          rights_holder: item.rightsHolder,
          credit_line: item.creditLine,
          rights_basis: item.rightsBasis,
          alt_text: item.altText,
          focal_position: item.focalPosition,
          same_event_verified: item.sameEventVerified,
          privacy_reviewed: item.privacyReviewed,
          safety_reviewed: item.safetyReviewed,
          integrity_reviewed: item.integrityReviewed,
          approved_source_verified: item.approvedSourceVerified,
          uploaded_by: userId,
          source_page_verified: item.sourcePageVerified,
          reporting_purpose_confirmed: item.reportingPurposeConfirmed,
          reduced_resolution_confirmed: item.reducedResolutionConfirmed,
          no_gallery_reuse_confirmed: item.noGalleryReuseConfirmed,
          no_unrelated_commercial_reuse_confirmed: item.noUnrelatedCommercialReuseConfirmed,
          takedown_process_confirmed: item.takedownProcessConfirmed,
          owner_acceptance: item.ownerAcceptance,
          rights_reviewed_at: item.rightsReviewedAt,
        });
        if (mediaError) {
          throw new Error(
            `${item.eventSlug}: draft metadata could not be created (${safeDatabaseError(mediaError)}).`,
          );
        }

        const { error: privateError } = await reviewer.from("event_media_private_review").insert({
          media_id: item.id,
          permission_evidence: item.permissionEvidence,
          review_notes: item.reviewNotes,
          same_event_reasoning: item.sameEventReasoning,
          privacy_notes: item.privacyNotes,
          safety_notes: item.safetyNotes,
          integrity_notes: item.integrityNotes,
          original_filename: item.originalFilename,
          original_sha256: item.originalSha256,
          derivative_sha256: item.derivativeSha256,
          original_media_url: item.originalMediaUrl,
          staging_path: item.stagingPath,
          crop_resize_disclosure: item.cropResizeDisclosure,
          original_width: item.originalWidth,
          original_height: item.originalHeight,
          derivative_width: item.derivativeWidth,
          derivative_height: item.derivativeHeight,
        });
        if (privateError) {
          throw new Error(`${item.eventSlug}: private review metadata could not be created.`);
        }
      }

      const { error: stagingError } = await reviewer.storage
        .from("event-media-staging")
        .upload(item.stagingPath, derivative, {
          cacheControl: "0",
          contentType: "image/webp",
          upsert: true,
        });
      if (stagingError) throw new Error(`${item.eventSlug}: private staging upload failed.`);
      const { data: staged, error: stagedError } = await reviewer.storage
        .from("event-media-staging")
        .download(item.stagingPath);
      if (stagedError || !staged) {
        throw new Error(`${item.eventSlug}: private staging verification failed.`);
      }
      const stagedBytes = Buffer.from(await staged.arrayBuffer());
      if (sha256(stagedBytes) !== item.derivativeSha256 || !isWebp(stagedBytes)) {
        throw new Error(`${item.eventSlug}: staged derivative verification failed.`);
      }

      const { error: publicError } = await admin.storage
        .from("event-media-public")
        .upload(item.publicStoragePath, derivative, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: true,
        });
      if (publicError) throw new Error(`${item.eventSlug}: public derivative upload failed.`);

      const { error: approvalError } = await reviewer.rpc("approve_event_media", {
        p_media_id: item.id,
        p_public_storage_path: item.publicStoragePath,
      });
      if (approvalError) throw new Error(`${item.eventSlug}: protected RPC approval failed.`);
      await reviewer.storage.from("event-media-staging").remove([item.stagingPath]);
      approvedIds.push(item.id);
    }
  } finally {
    await destroyTemporaryMediaAdmin(admin, reviewer, userId);
  }

  const { count: approved, error: approvedError } = await admin
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  const { count: draft, error: draftError } = await admin
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");
  if (approvedError || draftError || approved !== 50 || draft !== 0) {
    throw new Error(`Hosted media totals are invalid: ${approved} approved, ${draft} draft.`);
  }
  return { approved, approvedIds, draft, preserved: beforeApproved };
}

async function verifyMedia({ admin, anonKey, url }) {
  const publicClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: rows, error: rpcError } = await publicClient.rpc("get_public_event_media", {
    p_event_slug: null,
  });
  if (rpcError || !Array.isArray(rows))
    throw new Error("Public-safe media RPC verification failed.");
  const uniqueEvents = new Set(rows.map((row) => row.event_slug));
  const uploaded = rows.filter((row) => row.media_type === "uploaded_event_image");
  const videos = rows.filter((row) => row.media_type === "publisher_video_embed");
  const posts = rows.filter((row) => row.media_type === "official_social_embed");
  const documents = rows.filter((row) => row.public_display_kind === "source_document_preview");
  const failedGates = rows.filter(
    (row) =>
      !row.same_event_verified ||
      !row.privacy_reviewed ||
      !row.safety_reviewed ||
      !row.integrity_reviewed ||
      !row.approved_source_verified,
  );
  if (
    rows.length !== 50 ||
    uniqueEvents.size !== 50 ||
    uploaded.length !== 46 ||
    videos.length !== 3 ||
    posts.length !== 1 ||
    failedGates.length
  ) {
    throw new Error("Hosted public-safe media totals or review gates are invalid.");
  }
  if (documents.length !== 1 || documents[0].event_slug !== "kolli-hills-land-patta-protest") {
    throw new Error("Hosted source-document exception is invalid.");
  }

  for (const row of uploaded) {
    const { data, error } = await admin.storage
      .from("event-media-public")
      .download(row.storage_path);
    if (error || !data) throw new Error(`${row.event_slug}: public derivative is unavailable.`);
    const bytes = Buffer.from(await data.arrayBuffer());
    if (data.type !== "image/webp" || !isWebp(bytes) || containsSensitiveMetadata(bytes)) {
      throw new Error(`${row.event_slug}: public derivative failed WebP or metadata verification.`);
    }
  }

  const stagingObjects = await listBucketObjects(admin, "event-media-staging");
  const publicObjects = await listBucketObjects(admin, "event-media-public");
  const { count: approved, error: approvedError } = await admin
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  const { count: draft, error: draftError } = await admin
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");
  const { count: rejected, error: rejectedError } = await admin
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("status", "rejected");
  const { count: mediaAdmins, error: adminsError } = await admin
    .from("media_admins")
    .select("user_id", { count: "exact", head: true });
  if (
    approvedError ||
    draftError ||
    rejectedError ||
    adminsError ||
    approved !== 50 ||
    draft !== 0 ||
    rejected !== 2 ||
    mediaAdmins !== 0 ||
    stagingObjects.length !== 0 ||
    publicObjects.length !== 50
  ) {
    throw new Error(
      "Hosted private status, Storage, or temporary-administrator cleanup is invalid.",
    );
  }
  return {
    approved,
    documents: documents.length,
    draft,
    posts: posts.length,
    publicObjects: publicObjects.length,
    rejected,
    rpcRows: rows.length,
    stagingObjects: stagingObjects.length,
    uploaded: uploaded.length,
    videos: videos.length,
  };
}

const [mode, envPath, target, derivativeRoot] = process.argv.slice(2);
if (
  !["backup", "populate", "verify"].includes(mode) ||
  !envPath ||
  (mode !== "verify" && !target) ||
  (mode === "populate" && !derivativeRoot)
) {
  throw new Error(
    "Usage: node scripts/media-populate-phase2.mjs <backup|populate|verify> <preview-env-file> [backup-dir|manifest-file] [private-derivative-root]",
  );
}
const configuration = await loadConfiguration(envPath);
if (mode === "backup") {
  const result = await backupMedia(configuration.admin, target);
  console.log(`Media backup completed: ${result.destination}`);
  console.log(
    `Backed up media table rows: ${Object.values(result.tableCounts).reduce((a, b) => a + b, 0)}`,
  );
  console.log(
    `Backed up storage objects: ${Object.values(result.storageCounts).reduce((a, b) => a + b, 0)}`,
  );
} else if (mode === "populate") {
  const result = await populateMedia(configuration, target, derivativeRoot);
  console.log(`Preserved approved treatments: ${result.preserved}`);
  console.log(`New protected-RPC approvals: ${result.approvedIds.length}`);
  console.log(`Approved treatments after population: ${result.approved}`);
  console.log(`Draft treatments after population: ${result.draft}`);
} else {
  const result = await verifyMedia(configuration);
  console.log(`Public-safe RPC rows: ${result.rpcRows}`);
  console.log(`Approved treatments: ${result.approved}`);
  console.log(`Uploaded static treatments: ${result.uploaded}`);
  console.log(`Publisher-video embeds: ${result.videos}`);
  console.log(`Official social embeds: ${result.posts}`);
  console.log(`Source-document exceptions: ${result.documents}`);
  console.log(`Draft candidates: ${result.draft}`);
  console.log(`Rejected candidates: ${result.rejected}`);
  console.log(`Private staging objects: ${result.stagingObjects}`);
  console.log(`Public WebP objects: ${result.publicObjects}`);
}
