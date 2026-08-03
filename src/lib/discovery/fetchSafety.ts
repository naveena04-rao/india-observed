import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { SafeFetchedSource } from "./types";

export const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
export const SOURCE_TIMEOUT_MS = 12_000;
export const MAX_REDIRECTS = 3;

export class SafeSourceFetchError extends Error {
  constructor(
    readonly code: string,
    readonly diagnostics: {
      stage: "http_request";
      statusCode: number;
      contentType: string | null;
      contentLength: number | null;
      retryAfterMs: number | null;
    },
  ) {
    super(code);
    this.name = "SafeSourceFetchError";
  }
}

const permittedContentTypes = [
  "application/atom+xml",
  "application/json",
  "application/rss+xml",
  "application/xml",
  "text/html",
  "text/plain",
  "text/xml",
];

function blockedIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const first = parts[0]!;
  const second = parts[1]!;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  );
}

function blockedIpv6(address: string) {
  const value = address.toLowerCase().split("%")[0]!;
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(value)) return true;
  if (value.startsWith("ff")) return true;
  if (value.startsWith("::ffff:")) {
    const mapped = value.slice("::ffff:".length);
    return isIP(mapped) !== 4 || blockedIpv4(mapped);
  }
  return false;
}

function retryAfterMilliseconds(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

export function isBlockedAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return blockedIpv4(address);
  if (version === 6) return blockedIpv6(address);
  return true;
}

export function validateSourceUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("invalid_source_url");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsafe_source_scheme");
  if (url.username || url.password) throw new Error("source_credentials_forbidden");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("unsafe_source_port");
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("local_source_forbidden");
  }
  if (isIP(hostname) && isBlockedAddress(hostname)) throw new Error("private_source_forbidden");
  return url;
}

export async function assertPublicHostname(hostname: string, resolver: typeof lookup = lookup) {
  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) throw new Error("private_source_forbidden");
    return;
  }
  const results = await resolver(hostname, { all: true, verbatim: true });
  if (!results.length || results.some((result) => isBlockedAddress(result.address))) {
    throw new Error("private_source_resolution");
  }
}

async function readBoundedBody(response: Response, maximumBytes: number) {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maximumBytes) throw new Error("source_too_large");
  if (!response.body) return { body: "", bytesRead: 0 };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > maximumBytes) {
      await reader.cancel();
      throw new Error("source_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: new TextDecoder("utf-8", { fatal: false }).decode(bytes), bytesRead };
}

export async function fetchApprovedSource(
  value: string,
  options: {
    fetchImpl?: typeof fetch;
    resolver?: typeof lookup;
    maximumBytes?: number;
    timeoutMs?: number;
    etag?: string | null;
    lastModified?: string | null;
  } = {},
): Promise<SafeFetchedSource> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maximumBytes = options.maximumBytes ?? MAX_SOURCE_BYTES;
  const timeoutMs = options.timeoutMs ?? SOURCE_TIMEOUT_MS;
  let current = validateSourceUrl(value);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicHostname(current.hostname, options.resolver ?? lookup);
    const response = await fetchImpl(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/json, text/html;q=0.8",
        "User-Agent":
          "IndiaObservedEditorialDiscovery/1.0 (+https://india-observed.vercel.app/methodology)",
        ...(options.etag ? { "If-None-Match": options.etag } : {}),
        ...(options.lastModified ? { "If-Modified-Since": options.lastModified } : {}),
      },
    });

    if (response.status === 304) {
      return {
        finalUrl: current.toString(),
        contentType: "",
        body: "",
        bytesRead: 0,
        etag: response.headers.get("etag") ?? options.etag ?? null,
        lastModified: response.headers.get("last-modified") ?? options.lastModified ?? null,
        notModified: true,
      };
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirect === MAX_REDIRECTS) throw new Error("source_redirect_limit");
      const location = response.headers.get("location");
      if (!location) throw new Error("source_redirect_missing");
      current = validateSourceUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) {
      const lengthHeader = response.headers.get("content-length");
      const declaredLength = lengthHeader === null ? Number.NaN : Number(lengthHeader);
      throw new SafeSourceFetchError(`source_http_${response.status}`, {
        stage: "http_request",
        statusCode: response.status,
        contentType: response.headers.get("content-type"),
        contentLength: Number.isFinite(declaredLength) ? declaredLength : null,
        retryAfterMs: retryAfterMilliseconds(response.headers.get("retry-after")),
      });
    }
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0]!.trim();
    if (!permittedContentTypes.includes(contentType)) throw new Error("source_content_type");
    const { body, bytesRead } = await readBoundedBody(response, maximumBytes);
    return {
      finalUrl: current.toString(),
      contentType,
      body,
      bytesRead,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      notModified: false,
    };
  }
  throw new Error("source_redirect_limit");
}

export function extractSafeText(body: string) {
  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120_000);
}
