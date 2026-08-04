import "server-only";
import { headers } from "next/headers";

function isAllowedHost(host: string) {
  const configuredHost = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
    : "";
  const deploymentHost = process.env.VERCEL_URL ?? "";
  const branchHost = process.env.VERCEL_BRANCH_URL ?? "";
  return (
    host === "localhost:3000" ||
    host === configuredHost ||
    host === deploymentHost ||
    host === branchHost
  );
}

export async function getAuthenticationOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
  }
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "http" ? "http" : "https";
  if (!host || !isAllowedHost(host)) return null;
  return `${protocol}://${host}`;
}
