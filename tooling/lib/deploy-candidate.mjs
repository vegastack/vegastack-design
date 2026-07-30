import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstatSync,
  linkSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export const CANDIDATE_SCHEMA = "vegastack-deploy-candidate/v1";
export const RELEASE_WORKFLOW = ".github/workflows/release.yml";
export const CANDIDATE_CONTEXT = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "apps/docs/package.json",
  "apps/docs/next.config.mjs",
  "apps/docs/postcss.config.mjs",
  "apps/docs/wrangler.jsonc",
  "tooling/lib/deploy-candidate.mjs",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => `${JSON.stringify(value)}\n`;

export function verifyArchiveDigest(bytes, expected) {
  assert.match(
    expected ?? "",
    /^sha256:[0-9a-f]{64}$/,
    "expected artifact archive digest is malformed",
  );
  const actual = `sha256:${sha256(bytes)}`;
  assert.equal(
    actual,
    expected,
    "downloaded artifact archive digest does not match the GitHub API",
  );
  return actual;
}

function safeRelative(root, path) {
  const value = relative(root, path).split(sep).join("/");
  assert.ok(
    value && !value.startsWith("../"),
    `path escapes candidate root: ${path}`,
  );
  return value;
}

function leaf(path, root, normalizedMode = false) {
  const stat = lstatSync(path);
  assert.ok(
    !stat.isSymbolicLink(),
    `candidate contains a symlink: ${safeRelative(root, path)}`,
  );
  assert.ok(
    stat.isFile(),
    `candidate contains a non-regular leaf: ${safeRelative(root, path)}`,
  );
  return {
    path: safeRelative(root, path),
    type: "file",
    mode: normalizedMode
      ? "0644"
      : (stat.mode & 0o777).toString(8).padStart(4, "0"),
    size: stat.size,
    sha256: sha256(readFileSync(path)),
  };
}

function walkFiles(path, root, normalizedMode) {
  const stat = lstatSync(path);
  assert.ok(
    !stat.isSymbolicLink(),
    `candidate contains a symlink: ${safeRelative(root, path)}`,
  );
  if (stat.isFile()) return [leaf(path, root, normalizedMode)];
  assert.ok(
    stat.isDirectory(),
    `candidate contains an unsupported filesystem entry: ${path}`,
  );
  return readdirSync(path, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      walkFiles(join(path, entry.name), root, normalizedMode),
    );
}

function rootFor(leaves) {
  return sha256(leaves.map(canonical).join(""));
}

export function createCandidateManifest(
  root,
  producer,
  { normalizedMode = true } = {},
) {
  const absolute = resolve(root);
  const files = [
    ...walkFiles(join(absolute, "apps/docs/out"), absolute, normalizedMode),
    leaf(join(absolute, "apps/docs/wrangler.jsonc"), absolute, normalizedMode),
  ].sort((a, b) => a.path.localeCompare(b.path));
  const context = CANDIDATE_CONTEXT.map((path) =>
    leaf(join(absolute, path), absolute, false),
  );
  const manifest = {
    schema: CANDIDATE_SCHEMA,
    producer,
    artifactMode: "github-zip-normalized-0644",
    files,
    fileCount: files.length,
    contentRoot: rootFor(files),
    context,
    contextRoot: rootFor(context),
  };
  validateCandidateManifest(manifest, {
    root: absolute,
    expectedProducer: producer,
  });
  return manifest;
}

export function validateCandidateManifest(
  manifest,
  { root, contextRoot = root, expectedProducer } = {},
) {
  assert.equal(
    manifest?.schema,
    CANDIDATE_SCHEMA,
    "candidate schema is not supported",
  );
  assert.match(
    manifest.producer?.repository ?? "",
    /^[^/\s]+\/[^/\s]+$/,
    "candidate producer repository is malformed",
  );
  assert.equal(
    manifest.producer?.workflow,
    RELEASE_WORKFLOW,
    "candidate producer workflow is ineligible",
  );
  assert.match(
    String(manifest.producer?.runId ?? ""),
    /^\d+$/,
    "candidate producer run ID is malformed",
  );
  assert.match(
    String(manifest.producer?.runAttempt ?? ""),
    /^\d+$/,
    "candidate producer run attempt is malformed",
  );
  assert.match(
    manifest.producer?.sha ?? "",
    /^[0-9a-f]{40}$/,
    "candidate producer SHA is malformed",
  );
  assert.equal(
    manifest.producer?.ref,
    "refs/heads/main",
    "candidate producer ref is ineligible",
  );
  assert.equal(
    manifest.producer?.event,
    "push",
    "candidate producer event is ineligible",
  );
  assert.equal(
    manifest.producer?.siteVisibility,
    "public",
    "candidate discovery profile is ineligible",
  );
  assert.deepEqual(
    manifest.producer,
    expectedProducer ?? manifest.producer,
    "candidate producer does not match",
  );
  assert.equal(
    manifest.artifactMode,
    "github-zip-normalized-0644",
    "candidate artifact mode is not supported",
  );
  assert.ok(
    Array.isArray(manifest.files) && manifest.files.length > 0,
    "candidate file manifest is empty",
  );
  assert.equal(
    manifest.fileCount,
    manifest.files.length,
    "candidate file count is inconsistent",
  );
  assert.deepEqual(
    [...manifest.files].sort((a, b) => a.path.localeCompare(b.path)),
    manifest.files,
    "candidate files are not canonically sorted",
  );
  assert.equal(
    new Set(manifest.files.map((entry) => entry.path)).size,
    manifest.files.length,
    "candidate file manifest has duplicate paths",
  );
  for (const entry of manifest.files) {
    assert.match(
      entry.path,
      /^apps\/docs\/(?:out\/|wrangler\.jsonc$)/,
      `candidate path is outside deploy inputs: ${entry.path}`,
    );
    assert.equal(
      entry.type,
      "file",
      `candidate leaf is not a regular file: ${entry.path}`,
    );
    assert.equal(
      entry.mode,
      "0644",
      `candidate artifact mode is not normalized: ${entry.path}`,
    );
    assert.match(
      entry.sha256,
      /^[0-9a-f]{64}$/,
      `candidate leaf digest is malformed: ${entry.path}`,
    );
  }
  assert.equal(
    manifest.contentRoot,
    rootFor(manifest.files),
    "candidate content root is not reconstructable",
  );
  assert.deepEqual(
    manifest.context?.map((entry) => entry.path),
    CANDIDATE_CONTEXT,
    "candidate context authority is incomplete or reordered",
  );
  for (const entry of manifest.context) {
    assert.equal(
      entry.type,
      "file",
      `candidate context leaf is not a regular file: ${entry.path}`,
    );
    assert.match(
      entry.mode,
      /^0[0-7]{3}$/,
      `candidate context mode is malformed: ${entry.path}`,
    );
    assert.match(
      entry.sha256,
      /^[0-9a-f]{64}$/,
      `candidate context digest is malformed: ${entry.path}`,
    );
  }
  assert.equal(
    manifest.contextRoot,
    rootFor(manifest.context),
    "candidate context root is not reconstructable",
  );
  if (root) {
    const actual = createCandidateManifestUnchecked(
      root,
      contextRoot,
      manifest.producer,
    );
    assert.deepEqual(
      actual.files,
      manifest.files,
      "downloaded candidate files do not match their leaf manifest",
    );
    assert.deepEqual(
      actual.context,
      manifest.context,
      "candidate toolchain/config context does not match the checked-out tree",
    );
  }
  return manifest;
}

function createCandidateManifestUnchecked(root, contextRoot, producer) {
  const absolute = resolve(root);
  const files = [
    ...walkFiles(join(absolute, "apps/docs/out"), absolute, true),
    leaf(join(absolute, "apps/docs/wrangler.jsonc"), absolute, true),
  ].sort((a, b) => a.path.localeCompare(b.path));
  const contextAbsolute = resolve(contextRoot);
  const context = CANDIDATE_CONTEXT.map((path) =>
    leaf(join(contextAbsolute, path), contextAbsolute, false),
  );
  return { producer, files, context };
}

export function compareCandidateManifests(candidate, rebuilt) {
  validateCandidateManifest(candidate);
  validateCandidateManifest(rebuilt);
  assert.equal(
    candidate.contextRoot,
    rebuilt.contextRoot,
    "candidate and rebuild context roots differ",
  );
  assert.equal(
    candidate.contentRoot,
    rebuilt.contentRoot,
    "candidate and rebuild content roots differ",
  );
  assert.deepEqual(
    candidate.files,
    rebuilt.files,
    "candidate and rebuild leaf manifests differ",
  );
  return {
    equal: true,
    contentRoot: candidate.contentRoot,
    fileCount: candidate.fileCount,
  };
}

export function selectLiveCandidate(runs, artifactsByRun, expected) {
  const eligibleRuns = runs.filter(
    (run) =>
      run.head_sha === expected.sha &&
      run.head_branch === "main" &&
      run.event === "push" &&
      run.status === "completed" &&
      run.conclusion === "success" &&
      run.repository?.full_name === expected.repository &&
      String(run.path ?? "").startsWith(`${RELEASE_WORKFLOW}@`),
  );
  const claimed = eligibleRuns.flatMap((run) =>
    (artifactsByRun.get(run.id) ?? [])
      .filter(
        (artifact) =>
          artifact.name ===
          `docs-candidate-${expected.sha}-${run.id}-${run.run_attempt}`,
      )
      .map((artifact) => ({ run, artifact })),
  );
  const live = claimed.filter(({ artifact }) => !artifact.expired);
  if (live.length === 0)
    return {
      state: "miss",
      reason: claimed.length ? "expired" : "missing",
      name: null,
    };
  assert.equal(
    live.length,
    1,
    `candidate selection is ambiguous: ${live.length} live exact-name artifacts`,
  );
  const selected = live[0];
  assert.match(
    selected.artifact.digest ?? "",
    /^sha256:[0-9a-f]{64}$/,
    "live candidate API digest is missing or malformed",
  );
  assert.equal(
    selected.artifact.workflow_run?.head_sha,
    expected.sha,
    "artifact workflow_run SHA does not match",
  );
  return {
    state: "hit",
    name: selected.artifact.name,
    run: selected.run,
    artifact: selected.artifact,
  };
}

export function writeJsonAtomic(path, value) {
  const temp = `${path}.tmp-${process.pid}`;
  try {
    writeFileSync(temp, canonical(value), { flag: "wx", mode: 0o600 });
    linkSync(temp, path);
    unlinkSync(temp);
  } catch (error) {
    try {
      unlinkSync(temp);
    } catch {}
    throw error;
  }
}
