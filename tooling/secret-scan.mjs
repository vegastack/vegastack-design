#!/usr/bin/env node
// Local, deterministic high-confidence credential gate. It never prints matched values.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const signatures = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
  [
    "GitHub token",
    /\b(?:github_pat_[A-Za-z0-9_]{40,}|gh[pousr]_[A-Za-z0-9]{36,})\b/,
  ],
  ["npm token", /\bnpm_[A-Za-z0-9]{36,}\b/],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Stripe live secret", /\bsk_live_[0-9A-Za-z]{20,}\b/],
];

const credentialAssignment =
  /(?:client[_-]?secret|access[_-]?token|api[_-]?key|password|secret|token)\s*["']?\s*[:=]\s*["']?([^\s"',;]+)/gi;
const placeholder =
  /(?:\$\{|\{\{|(?:process\.)?env\.|secrets\.|vars\.|<[^>]+>|placeholder|example|dummy|replace[-_ ]?me|your[-_]|s3cr3t|^--|^secret$|^token$|^password$)/i;

function entropy(value) {
  const counts = new Map();
  for (const character of value)
    counts.set(character, (counts.get(character) ?? 0) + 1);
  return [...counts.values()].reduce((sum, count) => {
    const probability = count / value.length;
    return sum - probability * Math.log2(probability);
  }, 0);
}

function findingsFor(source) {
  const findings = [];
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    for (const [rule, pattern] of signatures) {
      if (pattern.test(line)) findings.push({ line: index + 1, rule });
    }
    for (const assignment of line.matchAll(credentialAssignment)) {
      const value = assignment[1] ?? "";
      if (
        value.length >= 20 &&
        entropy(value) >= 3.5 &&
        !placeholder.test(value)
      ) {
        findings.push({
          line: index + 1,
          rule: "high-entropy credential assignment",
        });
      }
    }
  }
  return findings;
}

assert.equal(findingsFor('token: "${{ secrets.DEPLOY_TOKEN }}"').length, 0);
assert.equal(findingsFor("client_secret=<CF_ACCESS_CLIENT_SECRET>").length, 0);
assert.equal(findingsFor("token: env.CF_ACCESS_CLIENT_SECRET").length, 0);
assert.equal(findingsFor("token: '--motion-ease-emphasized'").length, 0);
assert.equal(
  findingsFor(["-----BEGIN", "PRIVATE KEY-----"].join(" ")).length,
  1,
);
assert.equal(
  findingsFor(`api_key="${["A7f3b9Q2x8K4", "m6N1v5R0z9Y2"].join("")}"`).length,
  1,
);
assert.equal(
  findingsFor(
    `token=placeholder api_key="${["Q8v2N5m9R4x7", "K3z6P1c8W0y5"].join("")}"`,
  ).length,
  1,
);

const listed = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
)
  .split("\0")
  .filter(Boolean)
  .filter(
    (file) => !file.startsWith("output/") && !file.startsWith("apps/docs/out/"),
  );

const findings = [];
for (const file of listed) {
  let bytes;
  try {
    bytes = readFileSync(file);
  } catch {
    continue;
  }
  if (bytes.includes(0) || bytes.length > 8 * 1024 * 1024) continue;
  for (const finding of findingsFor(bytes.toString("utf8")))
    findings.push({ file, ...finding });
}

if (findings.length) {
  console.error(`secret-scan: ${findings.length} high-confidence finding(s)`);
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line} — ${finding.rule}`);
  }
  process.exit(1);
}
console.log(
  `secret-scan: passed (${listed.length} repository files checked; binary/large outputs skipped)`,
);
