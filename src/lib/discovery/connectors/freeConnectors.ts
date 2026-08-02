import "server-only";
import { fetchApprovedSource } from "../fetchSafety";

export type DiscoveredLink = {
  url: string;
  title: string | null;
  publishedAt: string | null;
  sourceKind: "feed" | "sitemap" | "news_sitemap" | "api" | "public_post";
};
const text = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const tag = (block: string, name: string) =>
  block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] ?? null;
const safeAbsolute = (value: string, base: string) => {
  try {
    const url = new URL(text(value), base);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

export function discoverFeedLinks(html: string, baseUrl: string) {
  const found: string[] = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const node = match[0];
    if (
      !/rel=["'][^"']*alternate/i.test(node) ||
      !/type=["']application\/(?:rss\+xml|atom\+xml)/i.test(node)
    )
      continue;
    const href = node.match(/href=["']([^"']+)/i)?.[1];
    const url = href ? safeAbsolute(href, baseUrl) : null;
    if (url) found.push(url);
  }
  return [...new Set(found)].slice(0, 5);
}

export function parseFeed(xml: string, baseUrl: string): DiscoveredLink[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map(
    (match) => match[2] ?? "",
  );
  return blocks
    .flatMap((block) => {
      const atomHref = block.match(/<link\b[^>]*href=["']([^"']+)/i)?.[1];
      const rawUrl = atomHref ?? tag(block, "link") ?? tag(block, "guid");
      const url = rawUrl ? safeAbsolute(rawUrl, baseUrl) : null;
      if (!url) return [];
      return [
        {
          url,
          title: text(tag(block, "title") ?? "") || null,
          publishedAt:
            text(tag(block, "pubDate") ?? tag(block, "published") ?? tag(block, "updated") ?? "") ||
            null,
          sourceKind: "feed" as const,
        },
      ];
    })
    .slice(0, 250);
}

export function parseSitemap(xml: string, baseUrl: string) {
  const index = /<sitemapindex\b/i.test(xml);
  const blocks = [
    ...xml.matchAll(
      new RegExp(
        `<${index ? "sitemap" : "url"}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${index ? "sitemap" : "url"}>`,
        "gi",
      ),
    ),
  ].map((match) => match[1] ?? "");
  return {
    isIndex: index,
    entries: blocks
      .flatMap((block) => {
        const rawUrl = tag(block, "loc");
        const url = rawUrl ? safeAbsolute(rawUrl, baseUrl) : null;
        if (!url) return [];
        return [
          {
            url,
            title: text(tag(block, "news:title") ?? "") || null,
            publishedAt:
              text(tag(block, "news:publication_date") ?? tag(block, "lastmod") ?? "") || null,
            sourceKind: tag(block, "news:title") ? ("news_sitemap" as const) : ("sitemap" as const),
          },
        ];
      })
      .slice(0, 1000),
  };
}

export async function fetchSitemapCandidates(input: {
  url: string;
  modifiedAfter: string;
  maximumChildSitemaps?: number;
}) {
  const rootHost = new URL(input.url).hostname;
  const first = await fetchApprovedSource(input.url);
  const parsed = parseSitemap(first.body, input.url);
  const cutoff = Date.parse(input.modifiedAfter);
  if (!parsed.isIndex)
    return parsed.entries.filter(
      (entry) => !entry.publishedAt || Date.parse(entry.publishedAt) >= cutoff,
    );
  const children = parsed.entries
    .filter((entry) => new URL(entry.url).hostname === rootHost)
    .filter((entry) => !entry.publishedAt || Date.parse(entry.publishedAt) >= cutoff)
    .slice(0, Math.min(input.maximumChildSitemaps ?? 8, 20));
  const results: DiscoveredLink[] = [];
  for (const child of children) {
    const response = await fetchApprovedSource(child.url);
    const nested = parseSitemap(response.body, child.url);
    if (nested.isIndex) continue;
    results.push(
      ...nested.entries.filter(
        (entry) => !entry.publishedAt || Date.parse(entry.publishedAt) >= cutoff,
      ),
    );
  }
  return results.slice(0, 2000);
}

export function gdeltDocUrl(input: {
  query: string;
  minutes?: number;
  maxRecords?: number;
  domain?: string;
}) {
  const terms = [input.query, input.domain ? `domain:${input.domain}` : null]
    .filter(Boolean)
    .join(" ");
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", terms);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", String(Math.min(input.maxRecords ?? 75, 250)));
  url.searchParams.set("timespan", `${Math.min(input.minutes ?? 2880, 10080)}min`);
  return url.toString();
}

export async function fetchGdeltCandidates(input: {
  query: string;
  domain?: string;
  minutes?: number;
  maxRecords?: number;
}) {
  const response = await fetchApprovedSource(gdeltDocUrl(input));
  const payload = JSON.parse(response.body) as {
    articles?: Array<{
      url?: string;
      title?: string;
      seendate?: string;
      domain?: string;
      language?: string;
      sourcecountry?: string;
    }>;
  };
  return (payload.articles ?? []).flatMap((item) =>
    item.url
      ? [
          {
            url: item.url,
            title: item.title ?? null,
            publishedAt: item.seendate ?? null,
            publisher: item.domain ?? null,
            language: item.language ?? null,
            sourceCountry: item.sourcecountry ?? null,
            sourceKind: "api" as const,
          },
        ]
      : [],
  );
}

export function youtubeSearchUrl(input: {
  apiKey: string;
  query: string;
  publishedAfter: string;
  relevanceLanguage: string;
  pageToken?: string;
}) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("regionCode", "IN");
  url.searchParams.set("maxResults", "25");
  url.searchParams.set("publishedAfter", input.publishedAfter);
  url.searchParams.set("relevanceLanguage", input.relevanceLanguage);
  url.searchParams.set("q", input.query);
  url.searchParams.set("key", input.apiKey);
  if (input.pageToken) url.searchParams.set("pageToken", input.pageToken);
  return url.toString();
}

export async function fetchYoutubeCandidates(input: {
  apiKey: string;
  query: string;
  publishedAfter: string;
  relevanceLanguage: string;
}) {
  const response = await fetchApprovedSource(youtubeSearchUrl(input));
  const payload = JSON.parse(response.body) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: { title?: string; publishedAt?: string };
    }>;
  };
  return (payload.items ?? []).flatMap((item) =>
    item.id?.videoId
      ? [
          {
            url: `https://www.youtube.com/watch?v=${encodeURIComponent(item.id.videoId)}`,
            title: item.snippet?.title ?? null,
            publishedAt: item.snippet?.publishedAt ?? null,
            sourceKind: "api" as const,
          },
        ]
      : [],
  );
}

export function blueskySearchUrl(input: { query: string; limit?: number; cursor?: string }) {
  const url = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts");
  url.searchParams.set("q", input.query);
  url.searchParams.set("limit", String(Math.min(input.limit ?? 25, 100)));
  url.searchParams.set("sort", "latest");
  if (input.cursor) url.searchParams.set("cursor", input.cursor);
  return url.toString();
}

export async function fetchBlueskyCandidates(input: { query: string }) {
  const response = await fetchApprovedSource(blueskySearchUrl(input));
  const payload = JSON.parse(response.body) as {
    posts?: Array<{
      uri?: string;
      author?: { handle?: string };
      record?: { text?: string; createdAt?: string };
    }>;
  };
  return (payload.posts ?? []).flatMap((post) => {
    const match = post.uri?.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^/]+)$/);
    if (!match || !post.author?.handle) return [];
    return [
      {
        url: `https://bsky.app/profile/${post.author.handle}/post/${match[2]}`,
        title: text(post.record?.text ?? "").slice(0, 240) || null,
        publishedAt: post.record?.createdAt ?? null,
        sourceKind: "public_post" as const,
      },
    ];
  });
}
