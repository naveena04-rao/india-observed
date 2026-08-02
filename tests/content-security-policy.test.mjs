import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const nextConfigSource = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
const transpiledConfig = ts.transpileModule(nextConfigSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const nextConfig = await import(
  `data:text/javascript;base64,${Buffer.from(transpiledConfig).toString("base64")}`
);

const supabaseUrl = "https://example.supabase.co";

test("development CSP permits eval without changing the other directives", () => {
  const development = nextConfig.buildContentSecurityPolicy("development", supabaseUrl);
  const production = nextConfig.buildContentSecurityPolicy("production", supabaseUrl);

  assert.match(development, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.equal(development.replace(" 'unsafe-eval'", ""), production);
});

test("production and Vercel Preview CSP output remain strict", () => {
  for (const vercelEnvironment of ["production", "preview"]) {
    const policy = nextConfig.buildContentSecurityPolicy("production", supabaseUrl);

    assert.doesNotMatch(policy, /'unsafe-eval'/, vercelEnvironment);
    assert.match(policy, /script-src 'self' 'unsafe-inline'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /base-uri 'self'/);
    assert.match(policy, /form-action 'self'/);
    assert.match(policy, /frame-ancestors 'none'/);
  }
});
