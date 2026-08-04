import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/discovery/connectors/freeConnectors.ts", import.meta.url),
  "utf8",
);
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
Function(
  "require",
  "exports",
  "module",
  output,
)(() => ({}), compiledModule.exports, compiledModule);
const { parseFeed } = compiledModule.exports;

test("official Hindi feed entities and publication dates normalize without article fetching", () => {
  const feed = `
    <rss><channel><item>
      <title>&amp;#2350;&amp;#2332;&amp;#2342;&amp;#2370;&amp;#2352; &amp;#2343;&amp;#2352;&amp;#2344;&amp;#2366;</title>
      <link>https://mpinfo.org/example</link>
      <pubDate>&amp;#2360;&amp;#2379;&amp;#2350;&amp;#2357;&amp;#2366;&amp;#2352;, &amp;#2309;&amp;#2327;&amp;#2360;&amp;#2381;&amp;#2340; 3, 2026, 21:21 IST</pubDate>
    </item></channel></rss>`;
  const [item] = parseFeed(feed, "https://mpinfo.org/RSSFeed/RSSFeed_News.xml");
  assert.equal(item.title, "मजदूर धरना");
  assert.equal(item.publishedAt, "2026-08-03T15:51:00.000Z");
});
