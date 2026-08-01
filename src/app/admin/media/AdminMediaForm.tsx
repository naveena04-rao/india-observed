"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  acceptedOriginalImageTypes,
  redistributableRightsBases,
  uploadLimitBytes,
} from "@/lib/media/validation";

type SourceOption = {
  publisher: string;
  headline: string;
  url: string;
};

type ApprovedOption = {
  id: string;
  label: string;
};

type AdminMediaFormProps = {
  eventSlug: string;
  sources: readonly SourceOption[];
  approvedOptions: readonly ApprovedOption[];
};

type ProcessedImage = {
  blob: Blob;
  originalFilename: string;
  originalSha256: string;
  originalSize: number;
  originalType: string;
  previewUrl: string;
  cropResizeDisclosure: string;
};

type SourceCandidate = {
  kind: string;
  url: string;
  caption: string | null;
  creator: string | null;
  publisher: string | null;
  width: number | null;
  height: number | null;
};

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function processImage(file: File): Promise<ProcessedImage> {
  if (!acceptedOriginalImageTypes.has(file.type)) {
    throw new Error("Choose a JPEG, PNG or WebP image.");
  }
  if (file.size <= 0 || file.size > uploadLimitBytes) {
    throw new Error("The original image must be no larger than 10 MB.");
  }

  const image = await createImageBitmap(file);
  const originalWidth = image.width;
  const originalHeight = image.height;
  const longestSide = Math.max(originalWidth, originalHeight);
  const scale = Math.min(1, 1600 / longestSide);
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser cannot process the selected image.");
  context.drawImage(image, 0, 0, width, height);
  image.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("WebP conversion failed."))),
      "image/webp",
      0.84,
    ),
  );
  if (blob.size > uploadLimitBytes) throw new Error("Processed WebP exceeds 10 MB.");

  return {
    blob,
    originalFilename: file.name,
    originalSha256: await sha256Hex(file),
    originalSize: file.size,
    originalType: file.type,
    previewUrl: URL.createObjectURL(blob),
    cropResizeDisclosure: `Aspect ratio preserved; resized from ${originalWidth}×${originalHeight} to ${width}×${height}; re-encoded as metadata-free WebP at 84% quality.`,
  };
}

export function AdminMediaForm({ eventSlug, sources, approvedOptions }: AdminMediaFormProps) {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<
    "uploaded_event_image" | "publisher_video_embed" | "official_social_embed"
  >("uploaded_event_image");
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceCandidates, setSourceCandidates] = useState<SourceCandidate[]>([]);
  const [extractingCandidates, setExtractingCandidates] = useState(false);
  const [publisher, setPublisher] = useState("");
  const [creator, setCreator] = useState("");
  const [originalMediaUrl, setOriginalMediaUrl] = useState("");

  useEffect(
    () => () => {
      if (processedImage) URL.revokeObjectURL(processedImage.previewUrl);
    },
    [processedImage],
  );

  async function handleFile(file: File | undefined) {
    setStatus("");
    if (!file) {
      setProcessedImage(null);
      return;
    }
    try {
      const processed = await processImage(file);
      setProcessedImage((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return processed;
      });
    } catch (error) {
      setProcessedImage(null);
      setStatus(error instanceof Error ? error.message : "Image processing failed.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const isUpload = mediaType === "uploaded_event_image";
    if (isUpload && !processedImage) {
      setStatus("Process and preview an image before creating the draft.");
      setSubmitting(false);
      return;
    }

    const payload = {
      eventSlug,
      mediaType,
      sourceUrl: String(formData.get("sourceUrl") ?? ""),
      mediaUrl: isUpload ? undefined : String(formData.get("mediaUrl") ?? ""),
      publisher: String(formData.get("publisher") ?? "") || undefined,
      creator: String(formData.get("creator") ?? "") || undefined,
      rightsHolder: String(formData.get("rightsHolder") ?? "") || undefined,
      creditLine: String(formData.get("creditLine") ?? ""),
      rightsBasis: String(formData.get("rightsBasis") ?? ""),
      licenceName: String(formData.get("licenceName") ?? "") || undefined,
      licenceUrl: String(formData.get("licenceUrl") ?? "") || undefined,
      permissionReference: String(formData.get("permissionReference") ?? "") || undefined,
      altText: String(formData.get("altText") ?? ""),
      focalPosition: String(formData.get("focalPosition") ?? "50% 50%"),
      sameEventVerified: formData.get("sameEventVerified") === "on",
      privacyReviewed: formData.get("privacyReviewed") === "on",
      safetyReviewed: formData.get("safetyReviewed") === "on",
      integrityReviewed: formData.get("integrityReviewed") === "on",
      sameEventReasoning: String(formData.get("sameEventReasoning") ?? ""),
      privacyNotes: String(formData.get("privacyNotes") ?? ""),
      safetyNotes: String(formData.get("safetyNotes") ?? ""),
      integrityNotes: String(formData.get("integrityNotes") ?? ""),
      permissionEvidence: String(formData.get("permissionEvidence") ?? "") || undefined,
      reviewNotes: String(formData.get("reviewNotes") ?? "") || undefined,
      originalFilename: processedImage?.originalFilename,
      originalSha256: processedImage?.originalSha256,
      originalSize: processedImage?.originalSize,
      originalType: processedImage?.originalType,
      originalMediaUrl: String(formData.get("originalMediaUrl") ?? "") || undefined,
      cropResizeDisclosure: processedImage?.cropResizeDisclosure,
      sourcePageVerified: formData.get("sourcePageVerified") === "on",
      reportingPurposeConfirmed: formData.get("reportingPurposeConfirmed") === "on",
      reducedResolutionConfirmed: formData.get("reducedResolutionConfirmed") === "on",
      noGalleryReuseConfirmed: formData.get("noGalleryReuseConfirmed") === "on",
      noUnrelatedCommercialReuseConfirmed:
        formData.get("noUnrelatedCommercialReuseConfirmed") === "on",
      takedownProcessConfirmed: formData.get("takedownProcessConfirmed") === "on",
      ownerAcceptance: formData.get("ownerAcceptance") === "on",
      rightsReviewedAt: String(formData.get("rightsReviewedAt") ?? "") || undefined,
      replacesMediaId: String(formData.get("replacesMediaId") ?? "") || undefined,
      replacementReason: String(formData.get("replacementReason") ?? "") || undefined,
    };

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        error?: string;
        id?: string;
        stagingPath?: string | null;
      };
      if (!response.ok || !result.id) throw new Error(result.error ?? "Draft creation failed.");

      if (isUpload && processedImage && result.stagingPath) {
        const supabase = createBrowserSupabaseClient();
        if (!supabase) throw new Error("Media storage is not configured.");
        const { error } = await supabase.storage
          .from("event-media-staging")
          .upload(result.stagingPath, processedImage.blob, {
            cacheControl: "0",
            contentType: "image/webp",
            upsert: false,
          });
        if (error) throw new Error("The processed image could not be uploaded to staging.");
      }

      form.reset();
      setProcessedImage(null);
      setSourceCandidates([]);
      setSourceUrl("");
      setPublisher("");
      setCreator("");
      setOriginalMediaUrl("");
      setStatus("Draft created. A separate administrator approval is still required.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Media draft could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  const rightsOptions =
    mediaType === "uploaded_event_image" ? redistributableRightsBases : ["official_embed"];

  async function extractCandidates() {
    if (!sourceUrl) {
      setStatus("Select an approved source before extracting candidates.");
      return;
    }
    setExtractingCandidates(true);
    setStatus("");
    setSourceCandidates([]);
    try {
      const response = await fetch("/api/admin/media/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSlug, sourceUrl }),
      });
      const result = (await response.json()) as {
        error?: string;
        candidates?: SourceCandidate[];
      };
      if (!response.ok) throw new Error(result.error ?? "Source metadata could not be read.");
      setSourceCandidates(result.candidates ?? []);
      setStatus(
        result.candidates?.length
          ? "Candidates extracted. Inspect the source page and image before selecting one."
          : "No candidate metadata was found. Review the source page manually.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Source metadata could not be read.");
    } finally {
      setExtractingCandidates(false);
    }
  }

  return (
    <form className="admin-media-form" onSubmit={submit}>
      <fieldset>
        <legend>Add media draft</legend>

        <label>
          Media type
          <select
            name="mediaType"
            value={mediaType}
            onChange={(event) => setMediaType(event.target.value as typeof mediaType)}
          >
            <option value="uploaded_event_image">Uploaded event image</option>
            <option value="publisher_video_embed">Publisher video embed</option>
            <option value="official_social_embed">Official social embed</option>
          </select>
        </label>

        <label>
          Approved source
          <select
            name="sourceUrl"
            required
            value={sourceUrl}
            onChange={(event) => {
              setSourceUrl(event.target.value);
              setSourceCandidates([]);
            }}
          >
            <option value="">Select a reviewed source</option>
            {sources.map((source) => (
              <option key={source.url} value={source.url}>
                {source.publisher} — {source.headline}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-source-candidate-tool">
          <button
            disabled={extractingCandidates || !sourceUrl}
            type="button"
            onClick={() => void extractCandidates()}
          >
            {extractingCandidates ? "Inspecting source…" : "Extract source-image candidates"}
          </button>
          <p>
            Metadata extraction is a review aid only. It never approves or publishes media. Reject
            ads, logos, recommended stories, generic graphics, file photographs and unrelated
            archive media.
          </p>
          {sourceCandidates.length > 0 ? (
            <ul>
              {sourceCandidates.map((candidate) => (
                <li key={`${candidate.kind}-${candidate.url}`}>
                  {/* Candidate URLs are private admin-only source metadata. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={candidate.url} />
                  <div>
                    <strong>{candidate.kind.replaceAll("_", " ")}</strong>
                    <p>{candidate.caption ?? "No source caption exposed."}</p>
                    <small>
                      {candidate.width && candidate.height
                        ? `${candidate.width}×${candidate.height}`
                        : "Dimensions not declared"}
                    </small>
                    <a href={candidate.url} rel="noreferrer" target="_blank">
                      Inspect candidate
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setOriginalMediaUrl(candidate.url);
                        if (candidate.publisher) setPublisher(candidate.publisher);
                        if (candidate.creator) setCreator(candidate.creator);
                        setStatus(
                          "Candidate selected for manual review. Download and upload only after confirming the exact event and all review gates.",
                        );
                      }}
                    >
                      Select for review
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {mediaType === "uploaded_event_image" ? (
          <label>
            Image file
            <input
              accept="image/jpeg,image/png,image/webp"
              name="image"
              type="file"
              required
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <small>
              JPEG, PNG or WebP; maximum 10 MB. Long edge is limited to 1,600px and re-encoded to
              metadata-free WebP.
            </small>
          </label>
        ) : (
          <>
            <label>
              Approved embed URL
              <input name="mediaUrl" type="url" required />
            </label>
            <label>
              Original media URL
              <input name="originalMediaUrl" type="url" required />
            </label>
          </>
        )}

        {processedImage ? (
          <figure className="admin-media-preview">
            {/* This is a local object URL created from the metadata-stripped WebP. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Processed upload preview" src={processedImage.previewUrl} />
            <figcaption>Processed WebP preview · original SHA-256 recorded privately</figcaption>
          </figure>
        ) : null}

        <div className="admin-media-form-grid">
          <label>
            Publisher/platform
            <input
              name="publisher"
              required
              value={publisher}
              onChange={(event) => setPublisher(event.target.value)}
            />
          </label>
          <label>
            Creator
            <input
              name="creator"
              value={creator}
              onChange={(event) => setCreator(event.target.value)}
            />
          </label>
          <label>
            Rights holder
            <input name="rightsHolder" required={mediaType === "uploaded_event_image"} />
          </label>
          <label>
            Rights basis
            <select name="rightsBasis" required>
              {rightsOptions.map((basis) => (
                <option key={basis} value={basis}>
                  {basis.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Licence name
            <input name="licenceName" />
          </label>
          <label>
            Licence URL
            <input name="licenceUrl" type="url" />
          </label>
        </div>

        <label>
          Credit line
          <input name="creditLine" required maxLength={500} />
        </label>
        <label>
          Alt text
          <textarea name="altText" required minLength={8} maxLength={500} />
        </label>
        <label>
          Focal position
          <input name="focalPosition" defaultValue="50% 50%" required />
        </label>
        <label>
          Permission or licence reference
          <textarea name="permissionReference" />
        </label>
        <label>
          Original source image or post URL
          <input
            name="originalMediaUrl"
            type="url"
            value={originalMediaUrl}
            onChange={(event) => setOriginalMediaUrl(event.target.value)}
          />
        </label>
        <fieldset className="admin-fair-dealing-review">
          <legend>Editorial fair-dealing review</legend>
          <p>
            This is an editorial fair-dealing assessment for current-events reporting. It is not
            permission, a licence or an assertion that India Observed owns the image.
          </p>
          <label>
            <input name="sourcePageVerified" type="checkbox" /> Exact source page verified
          </label>
          <label>
            <input name="reportingPurposeConfirmed" type="checkbox" /> Reporting purpose confirmed
          </label>
          <label>
            <input name="reducedResolutionConfirmed" type="checkbox" /> Reduced-resolution
            derivative confirmed
          </label>
          <label>
            <input name="noGalleryReuseConfirmed" type="checkbox" /> No standalone gallery use
          </label>
          <label>
            <input name="noUnrelatedCommercialReuseConfirmed" type="checkbox" /> No unrelated
            commercial reuse
          </label>
          <label>
            <input name="takedownProcessConfirmed" type="checkbox" /> Takedown process confirmed
          </label>
          <label>
            <input name="ownerAcceptance" type="checkbox" /> Owner accepted this individual
            editorial-use decision
          </label>
          <label>
            Rights review date
            <input name="rightsReviewedAt" type="date" />
          </label>
        </fieldset>
        <label>
          Private permission evidence
          <textarea name="permissionEvidence" />
        </label>
        <label>
          Same-event explanation
          <textarea name="sameEventReasoning" required minLength={12} />
        </label>
        <label>
          Privacy notes
          <textarea name="privacyNotes" required minLength={8} />
        </label>
        <label>
          Safety notes
          <textarea name="safetyNotes" required minLength={8} />
        </label>
        <label>
          Integrity notes
          <textarea name="integrityNotes" required minLength={8} />
        </label>
        <label>
          Private review notes
          <textarea name="reviewNotes" />
        </label>

        <div className="admin-review-checks">
          <label>
            <input name="sameEventVerified" type="checkbox" /> Exact event verified
          </label>
          <label>
            <input name="privacyReviewed" type="checkbox" /> Privacy reviewed
          </label>
          <label>
            <input name="safetyReviewed" type="checkbox" /> Safety reviewed
          </label>
          <label>
            <input name="integrityReviewed" type="checkbox" /> Integrity reviewed
          </label>
        </div>

        {approvedOptions.length > 0 ? (
          <div className="admin-media-replacement">
            <label>
              Replace approved media
              <select name="replacesMediaId">
                <option value="">Not a replacement</option>
                {approvedOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Replacement reason
              <textarea name="replacementReason" />
            </label>
          </div>
        ) : null}

        <button disabled={submitting} type="submit">
          {submitting ? "Creating draft…" : "Create media draft"}
        </button>
        {status ? <p role="status">{status}</p> : null}
      </fieldset>
    </form>
  );
}
