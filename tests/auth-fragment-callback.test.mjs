import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const callback = read("src/app/components/AuthFragmentCallback.tsx");
const layout = read("src/app/layout.tsx");
const confirmRoute = read("src/app/auth/confirm/route.ts");
const nextConfig = read("next.config.ts");

test("implicit Auth fragments become cookie-backed sessions before admin redirect", () => {
  assert.match(callback, /window\.location\.hash\.slice\(1\)/);
  assert.match(callback, /fragment\.get\("access_token"\)/);
  assert.match(callback, /fragment\.get\("refresh_token"\)/);
  assert.match(callback, /supabase\.auth[\s\S]*?\.setSession/);
  assert.match(callback, /window\.location\.replace\(returnTo\)/);
  assert.match(callback, /const editorReturnPath = "\/admin\/review"/);
  assert.match(layout, /<AuthFragmentCallback \/>/);
});

test("fragment credentials are removed before they are exchanged or redirected", () => {
  const cleanupIndex = callback.indexOf("cleanCallbackUrl();");
  const sessionIndex = callback.indexOf(".setSession(");
  const redirectIndex = callback.indexOf("window.location.replace(returnTo)");

  assert.ok(cleanupIndex >= 0);
  assert.ok(sessionIndex > cleanupIndex);
  assert.ok(redirectIndex > sessionIndex);
  assert.doesNotMatch(callback, /console\.|localStorage|sessionStorage/);
});

test("token-hash confirmation and strict production CSP remain intact", () => {
  assert.match(confirmRoute, /verifyOtp\(\{ token_hash: tokenHash, type: "email" \}\)/);
  assert.match(nextConfig, /nodeEnv === "development" \? " 'unsafe-eval'" : ""/);
  assert.doesNotMatch(
    nextConfig.match(/nodeEnv === "development"[\s\S]*?return \[/)?.[0] ?? "",
    /VERCEL_ENV/,
  );
});
