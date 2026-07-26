import "server-only";
import { headers } from "next/headers";

function isAllowedHost(host: string) {
  return (
    host === "localhost:3000" ||
    host === "india-observed.vercel.app" ||
    host.endsWith("-india-observed.vercel.app")
  );
}

export async function getAuthenticationOrigin() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "http" ? "http" : "https";
  if (!host || !isAllowedHost(host)) return null;
  return `${protocol}://${host}`;
}
