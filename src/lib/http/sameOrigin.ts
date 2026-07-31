import "server-only";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

export function requestOrigin(request: Request) {
  const host = firstHeaderValue(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  );
  const protocol =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ||
    new URL(request.url).protocol.replace(":", "");
  if (!host || (protocol !== "http" && protocol !== "https")) return null;
  return `${protocol}://${host}`;
}

export function isSameOriginMutation(request: Request) {
  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) return false;

  try {
    const protocol =
      firstHeaderValue(request.headers.get("x-forwarded-proto")) ||
      new URL(request.url).protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") return false;

    const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
    const host = firstHeaderValue(request.headers.get("host"));
    const allowedOrigins = new Set([new URL(request.url).origin]);
    if (forwardedHost) allowedOrigins.add(`${protocol}://${forwardedHost}`);
    if (host) allowedOrigins.add(`${protocol}://${host}`);

    return allowedOrigins.has(new URL(suppliedOrigin).origin);
  } catch {
    return false;
  }
}

export function hasUnexpectedBody(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  return Number.isFinite(length) ? length > 0 : true;
}
