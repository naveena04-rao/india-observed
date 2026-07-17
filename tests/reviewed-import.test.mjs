import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260717000100_import_reviewed_workbook.sql";
const migration = readFileSync(migrationPath, "utf8");

test("reviewed workbook import preserves editorial and publication guards", () => {
  assert.match(
    migration,
    /SHA-256: 594C6320521B2858FEA3487D333E3A2A5374F74201E8DE25646DFAD077A2EDCC/,
  );
  assert.match(migration, /Expected 22 events/);
  assert.match(migration, /Expected 136 claims/);
  assert.match(migration, /Expected 77 sources/);
  assert.match(migration, /Expected 90 organisations/);
  assert.match(migration, /Expected 314 claim-source links/);
  assert.match(migration, /Expected 2 corrections/);
  assert.match(migration, /publication_status <> 'candidate'/);
  assert.doesNotMatch(migration, /create\s+policy|publication_status[^\n]*'published'/i);
  assert.doesNotMatch(migration, /insert into public\.event_organisations/i);
});
