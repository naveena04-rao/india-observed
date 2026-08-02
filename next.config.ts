import type { NextConfig } from "next";

function validOrigin(value: string | undefined) {
  try {
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(
  nodeEnv: string | undefined,
  supabaseUrl: string | undefined,
) {
  const supabaseOrigin = validOrigin(supabaseUrl);
  const developmentScriptSource = nodeEnv === "development" ? " 'unsafe-eval'" : "";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${developmentScriptSource}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "frame-src 'self' https://www.ndtv.com https://www.instagram.com https://www.facebook.com",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} wss://${new URL(supabaseOrigin).host}` : ""}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const contentSecurityPolicy = buildContentSecurityPolicy(
  process.env.NODE_ENV,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { typedEnv: true },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
};

export default nextConfig;
