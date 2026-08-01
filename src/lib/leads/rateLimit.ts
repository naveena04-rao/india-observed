import "server-only";
import { createHash, randomBytes } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const entries = new Map<string, number[]>();
const salt = randomBytes(32);

function clientAddress(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function consumeLeadSubmissionAttempt(request: Request, now = Date.now()) {
  const key = createHash("sha256").update(salt).update(clientAddress(request)).digest("hex");
  const recent = (entries.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return false;
  recent.push(now);
  entries.set(key, recent);
  return true;
}
