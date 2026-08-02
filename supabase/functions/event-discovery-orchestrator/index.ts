declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

Deno.serve(async (request) => {
  const expected = Deno.env.get("DISCOVERY_SCHEDULER_SECRET") ?? "";
  const supplied = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!expected || supplied !== expected) return json({ error: "not_found" }, 404);
  if (
    Deno.env.get("DISCOVERY_SCHEDULER_ENABLED") !== "true" ||
    Deno.env.get("DISCOVERY_DRY_RUN_ONLY") !== "true"
  )
    return json({ error: "scheduler_disabled" }, 503);
  const url = Deno.env.get("DISCOVERY_ORCHESTRATOR_URL");
  if (!url) return json({ error: "orchestrator_unconfigured" }, 503);
  // The Edge Function holds no editorial logic or public credentials. It calls the protected
  // application orchestrator, which rechecks every database compliance gate.
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${expected}` },
  });
  return json(await response.json(), response.status);
});
