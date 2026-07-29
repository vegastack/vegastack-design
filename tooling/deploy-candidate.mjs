#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  compareCandidateManifests,
  createCandidateManifest,
  selectLiveCandidate,
  validateCandidateManifest,
  verifyArchiveDigest,
  writeJsonAtomic,
} from "./lib/deploy-candidate.mjs";

const [command, ...args] = process.argv.slice(2);
const usage = `Usage: node tooling/deploy-candidate.mjs <command> [options]

Shadow-only exact-main deployment-candidate tooling. Candidate reuse remains disabled under D4;
missing or expired candidates are safe misses and the deploy performs its mandatory rebuild.

Commands:
  create    --root <dir> --output <json> --repository <owner/repo> --run-id <id>
            --run-attempt <n> --sha <commit>
            Build a canonical manifest for an already-required exact-main docs artifact.
  verify    --root <dir> --manifest <json> [--context-root <dir>] plus producer options
            Verify producer identity, exact SHA, toolchain, context, leaves, and content root.
  compare   --candidate <json> --rebuilt <json>
            Require candidate and mandatory-rebuild manifests to be byte-equivalent.
  discover  --repository <owner/repo> --sha <commit> --github-output <path> [--token <token>]
            Select one unambiguous live immutable artifact or emit a safe miss.
  download  --repository <owner/repo> --artifact-id <id> --expected-digest <sha256:...>
            --output <zip>
            Download by artifact ID and verify the API archive digest before writing.
  --help    Show this help without network access or filesystem mutation.`;
if (command === "--help" || command === "-h") {
  console.log(usage);
  process.exit(0);
}
const value = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const required = (name) => {
  const result = value(name);
  assert.ok(result, `${name} is required`);
  return result;
};
const producer = () => ({
  repository: required("--repository"),
  workflow: ".github/workflows/release.yml",
  runId: required("--run-id"),
  runAttempt: required("--run-attempt"),
  sha: required("--sha"),
  ref: "refs/heads/main",
  event: "push",
  siteVisibility: "public",
  node: process.version,
  pnpm: execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim(),
});

if (command === "create") {
  const root = resolve(value("--root", "."));
  const output = resolve(required("--output"));
  writeJsonAtomic(output, createCandidateManifest(root, producer()));
  console.log(`deploy-candidate: CREATED ${output}`);
} else if (command === "verify") {
  const root = resolve(required("--root"));
  const manifest = JSON.parse(
    readFileSync(resolve(required("--manifest")), "utf8"),
  );
  validateCandidateManifest(manifest, {
    root,
    contextRoot: resolve(value("--context-root", ".")),
    expectedProducer: producer(),
  });
  console.log(
    `deploy-candidate: VERIFIED ${manifest.fileCount} files ${manifest.contentRoot}`,
  );
} else if (command === "compare") {
  const candidate = JSON.parse(
    readFileSync(resolve(required("--candidate")), "utf8"),
  );
  const rebuilt = JSON.parse(
    readFileSync(resolve(required("--rebuilt")), "utf8"),
  );
  const result = compareCandidateManifests(candidate, rebuilt);
  console.log(
    `deploy-candidate: PARITY ${result.fileCount} files ${result.contentRoot}`,
  );
} else if (command === "discover") {
  const repository = required("--repository");
  const sha = required("--sha");
  const token = value("--token", process.env.GITHUB_TOKEN);
  assert.ok(token, "GITHUB_TOKEN is required");
  const output = required("--github-output");
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const api = async (path) => {
    const response = await fetch(`https://api.github.com${path}`, { headers });
    assert.equal(
      response.status,
      200,
      `GitHub API ${path} returned ${response.status}`,
    );
    return response.json();
  };
  const runsResult = await api(
    `/repos/${repository}/actions/workflows/release.yml/runs?branch=main&event=push&status=success&head_sha=${sha}&per_page=100`,
  );
  assert.ok(
    (runsResult.total_count ?? 0) <= 100,
    "more than 100 exact-SHA successful Release runs exist; candidate selection would be partial",
  );
  const artifacts = new Map();
  for (const run of runsResult.workflow_runs ?? []) {
    const result = await api(
      `/repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`,
    );
    assert.ok(
      (result.total_count ?? 0) <= 100,
      `run ${run.id} has more than 100 artifacts; selection would be partial`,
    );
    artifacts.set(run.id, result.artifacts ?? []);
  }
  const selected = selectLiveCandidate(
    runsResult.workflow_runs ?? [],
    artifacts,
    { repository, sha },
  );
  const lines = [
    `state=${selected.state}`,
    `reason=${selected.reason ?? "eligible"}`,
    `name=${selected.name}`,
  ];
  if (selected.state === "hit")
    lines.push(
      `run_id=${selected.run.id}`,
      `run_attempt=${selected.run.run_attempt}`,
      `artifact_id=${selected.artifact.id}`,
      `artifact_digest=${selected.artifact.digest}`,
    );
  writeFileSync(output, `${lines.join("\n")}\n`, { flag: "a" });
  console.log(
    `deploy-candidate: ${selected.state.toUpperCase()} ${selected.reason ?? selected.artifact.id}`,
  );
} else if (command === "download") {
  const repository = required("--repository");
  const artifactId = required("--artifact-id");
  const expected = required("--expected-digest");
  const output = resolve(required("--output"));
  const token = process.env.GITHUB_TOKEN;
  assert.ok(token, "GITHUB_TOKEN is required");
  const redirect = await fetch(
    `https://api.github.com/repos/${repository}/actions/artifacts/${artifactId}/zip`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      redirect: "manual",
    },
  );
  assert.equal(
    redirect.status,
    302,
    `artifact archive API returned ${redirect.status}`,
  );
  const location = redirect.headers.get("location");
  assert.ok(location, "artifact archive API omitted its signed redirect URL");
  const response = await fetch(location);
  assert.equal(
    response.status,
    200,
    `signed artifact archive download returned ${response.status}`,
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  verifyArchiveDigest(bytes, expected);
  writeFileSync(output, bytes, { flag: "wx", mode: 0o600 });
  console.log(`deploy-candidate: ARCHIVE VERIFIED ${artifactId} ${expected}`);
} else {
  console.error(usage);
  process.exit(2);
}
