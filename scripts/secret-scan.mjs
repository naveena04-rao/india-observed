import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);

const patterns = [
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  {
    name: "Non-empty Supabase service key assignment",
    regex: /SUPABASE_SERVICE_ROLE_KEY[ \t]*=[ \t]*[^\r\n#][^\r\n]{15,}/g,
  },
];

const binaryExtensions = /\.(?:xlsx|png|jpe?g|gif|ico|pdf|zip|bundle)$/i;
const findings = [];

for (const file of tracked) {
  if (binaryExtensions.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    const matches = text.match(pattern.regex) ?? [];
    for (const match of matches)
      findings.push({ file, type: pattern.name, preview: match.slice(0, 24) });
  }
}

if (findings.length > 0) {
  console.error(JSON.stringify(findings, null, 2));
  process.exit(1);
}

console.log(`Secret scan passed for ${tracked.length} tracked files.`);
