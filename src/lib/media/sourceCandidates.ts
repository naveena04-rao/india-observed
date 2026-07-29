import "server-only";

const MAX_SOURCE_HTML_BYTES = 5 * 1024 * 1024;
const SOURCE_FETCH_TIMEOUT_MS = 15_000;

const rejectedCandidatePattern =
  /\b(?:advert|advertisement|banner|brand|default|file[-_ ]?photo|logo|placeholder|recommended|related[-_ ]?stor|representative|sprite|tracking)\b/i;

type CandidateKind =
  | "open_graph"
  | "twitter"
  | "structured_data"
  | "article_image"
  | "video_thumbnail"
  | "official_embed";

export type SourceMediaCandidate = {
  kind: CandidateKind;
  url: string;
  caption: string | null;
  creator: string | null;
  publisher: string | null;
  width: number | null;
  height: number | null;
};

export type SourceMediaExtraction = {
  sourceUrl: string;
  finalUrl: string;
  pageTitle: string | null;
  publisher: string | null;
  candidates: SourceMediaCandidate[];
};

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

function absoluteUrl(value: string, baseUrl: string) {
  try {
    const url = new URL(decodeHtml(value), baseUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ? decodeHtml(match[1]) : null;
}

function metaContent(html: string, key: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const property =
      attribute(tag, "property") ?? attribute(tag, "name") ?? attribute(tag, "itemprop");
    if (property?.toLowerCase() === key.toLowerCase()) return attribute(tag, "content");
  }
  return null;
}

function textContent(value: string | null) {
  if (!value) return null;
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function imageValue(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(imageValue);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return imageValue(object.url ?? object.contentUrl ?? object.thumbnailUrl);
  }
  return [];
}

function structuredDataCandidates(html: string, baseUrl: string) {
  const candidates: SourceMediaCandidate[] = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      if (!match[1]) continue;
      const parsed = JSON.parse(match[1]) as unknown;
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || typeof current !== "object") continue;
        const item = current as Record<string, unknown>;
        if (Array.isArray(item["@graph"])) queue.push(...item["@graph"]);
        const creatorValue = item.creator ?? item.author;
        const creator =
          typeof creatorValue === "string"
            ? creatorValue
            : creatorValue && typeof creatorValue === "object"
              ? String((creatorValue as Record<string, unknown>).name ?? "")
              : null;
        const publisherValue = item.publisher;
        const publisher =
          publisherValue && typeof publisherValue === "object"
            ? String((publisherValue as Record<string, unknown>).name ?? "")
            : typeof publisherValue === "string"
              ? publisherValue
              : null;
        const caption =
          typeof item.caption === "string"
            ? item.caption
            : typeof item.description === "string"
              ? item.description
              : null;
        for (const value of imageValue(item.image ?? item.thumbnailUrl)) {
          const url = absoluteUrl(value, baseUrl);
          if (!url) continue;
          candidates.push({
            kind: item.thumbnailUrl ? "video_thumbnail" : "structured_data",
            url,
            caption: textContent(caption),
            creator: textContent(creator),
            publisher: textContent(publisher),
            width: null,
            height: null,
          });
        }
      }
    } catch {
      // Invalid publisher JSON-LD is ignored; the administrator still sees other metadata.
    }
  }
  return candidates;
}

function articleImageCandidates(html: string, baseUrl: string) {
  const candidates: SourceMediaCandidate[] = [];
  for (const match of html.matchAll(
    /<(?:figure|picture)\b[^>]*>[\s\S]*?<\/(?:figure|picture)>/gi,
  )) {
    const block = match[0];
    const imageTag = block.match(/<img\b[^>]*>/i)?.[0];
    if (!imageTag) continue;
    const source =
      attribute(imageTag, "src") ??
      attribute(imageTag, "data-src") ??
      attribute(imageTag, "data-original");
    if (!source) continue;
    const url = absoluteUrl(source, baseUrl);
    if (!url) continue;
    const caption =
      textContent(block.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ?? null) ??
      attribute(imageTag, "alt");
    candidates.push({
      kind: "article_image",
      url,
      caption,
      creator: null,
      publisher: null,
      width: Number(attribute(imageTag, "width")) || null,
      height: Number(attribute(imageTag, "height")) || null,
    });
  }
  return candidates;
}

function officialEmbedCandidates(html: string, baseUrl: string) {
  const candidates: SourceMediaCandidate[] = [];
  for (const match of html.matchAll(/<(?:iframe|blockquote)\b[^>]*>/gi)) {
    const value =
      attribute(match[0], "src") ??
      attribute(match[0], "cite") ??
      attribute(match[0], "data-instgrm-permalink");
    if (!value) continue;
    const url = absoluteUrl(value, baseUrl);
    if (!url || !/(?:youtube|youtu\.be|instagram|facebook|twitter|x\.com|ndtv)/i.test(url)) {
      continue;
    }
    candidates.push({
      kind: "official_embed",
      url,
      caption: null,
      creator: null,
      publisher: null,
      width: null,
      height: null,
    });
  }
  return candidates;
}

function candidateKey(candidate: SourceMediaCandidate) {
  try {
    const url = new URL(candidate.url);
    url.hash = "";
    return url.toString();
  } catch {
    return candidate.url;
  }
}

export function extractSourceMediaCandidates(
  html: string,
  sourceUrl: string,
  finalUrl = sourceUrl,
): SourceMediaExtraction {
  const publisher =
    metaContent(html, "og:site_name") ??
    textContent(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null)
      ?.split("|")
      .at(-1) ??
    null;
  const pageTitle =
    metaContent(html, "og:title") ??
    metaContent(html, "twitter:title") ??
    textContent(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null);
  const pageCaption =
    metaContent(html, "og:description") ?? metaContent(html, "twitter:description") ?? null;
  const creator =
    metaContent(html, "article:author") ??
    metaContent(html, "author") ??
    metaContent(html, "byl") ??
    null;
  const candidates: SourceMediaCandidate[] = [];

  for (const [kind, key] of [
    ["open_graph", "og:image"],
    ["twitter", "twitter:image"],
    ["video_thumbnail", "og:video:thumbnail_url"],
  ] as const) {
    const value = metaContent(html, key);
    const url = value ? absoluteUrl(value, finalUrl) : null;
    if (!url) continue;
    candidates.push({
      kind,
      url,
      caption: metaContent(html, `${key}:alt`) ?? pageCaption,
      creator,
      publisher,
      width: Number(metaContent(html, `${key}:width`)) || null,
      height: Number(metaContent(html, `${key}:height`)) || null,
    });
  }

  candidates.push(...structuredDataCandidates(html, finalUrl));
  candidates.push(...articleImageCandidates(html, finalUrl));
  candidates.push(...officialEmbedCandidates(html, finalUrl));

  const seen = new Set<string>();
  const filtered = candidates.filter((candidate) => {
    const key = candidateKey(candidate);
    if (
      seen.has(key) ||
      rejectedCandidatePattern.test(`${candidate.url} ${candidate.caption ?? ""}`)
    ) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return { sourceUrl, finalUrl, pageTitle, publisher, candidates: filtered.slice(0, 30) };
}

export async function fetchSourceMediaCandidates(sourceUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "IndiaObservedMediaReview/1.0 (+https://india-observed.vercel.app)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("The source did not return an HTML page.");
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_SOURCE_HTML_BYTES) throw new Error("Source page is too large.");
    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_SOURCE_HTML_BYTES) {
      throw new Error("Source page is too large.");
    }
    return extractSourceMediaCandidates(html, sourceUrl, response.url);
  } finally {
    clearTimeout(timeout);
  }
}
