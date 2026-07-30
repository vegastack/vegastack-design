#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
  cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CANDIDATE_CONTEXT,
  compareCandidateManifests,
  createCandidateManifest,
  selectLiveCandidate,
  validateCandidateManifest,
  verifyArchiveDigest,
  writeJsonAtomic,
} from "./lib/deploy-candidate.mjs";
import { ROOT } from "./lib/change-set.mjs";

const SHA = "a".repeat(40);
const producer = {
  repository: "vegastack/org-design",
  workflow: ".github/workflows/release.yml",
  runId: "41",
  runAttempt: "1",
  sha: SHA,
  ref: "refs/heads/main",
  event: "push",
  siteVisibility: "public",
  node: process.version,
  pnpm: "11.7.0",
};

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "deploy-candidate-"));
  for (const path of CANDIDATE_CONTEXT) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    cpSync(join(ROOT, path), join(root, path));
  }
  mkdirSync(join(root, "apps/docs/out/r"), { recursive: true });
  writeFileSync(join(root, "apps/docs/out/index.html"), "hello\n");
  writeFileSync(join(root, "apps/docs/out/r/integrity-manifest.json"), "{}\n");
  return root;
}

function rejected(label, fn, pattern) {
  assert.throws(fn, pattern, `${label} did not fail for the intended reason`);
  console.log(`✓ ${label}`);
}

const root = fixture();
try {
  const manifest = createCandidateManifest(root, producer);
  validateCandidateManifest(manifest, { root, expectedProducer: producer });
  compareCandidateManifests(manifest, structuredClone(manifest));
  console.log("✓ exact candidate and independently reconstructed manifest");
  const archive = Buffer.from("immutable archive fixture");
  const archiveDigest = `sha256:${createHash("sha256").update(archive).digest("hex")}`;
  assert.equal(verifyArchiveDigest(archive, archiveDigest), archiveDigest);
  rejected(
    "artifact archive digest mismatch",
    () => verifyArchiveDigest(Buffer.from("tampered"), archiveDigest),
    /archive digest does not match/,
  );

  for (const [label, mutate, pattern] of [
    [
      "wrong producer SHA",
      (x) => (x.producer.sha = "b".repeat(40)),
      /producer/,
    ],
    [
      "wrong producer workflow",
      (x) => (x.producer.workflow = ".github/workflows/deploy.yml"),
      /producer/,
    ],
    [
      "malformed content root",
      (x) => (x.contentRoot = "0".repeat(64)),
      /content root/,
    ],
    ["missing leaf", (x) => x.files.pop(), /file count|content root/],
    [
      "duplicate conflicting leaf",
      (x) => x.files.push({ ...x.files[0], sha256: "f".repeat(64) }),
      /sorted|duplicate|file count/,
    ],
    ["omitted toolchain context", (x) => x.context.pop(), /context authority/],
    [
      "malformed context mode",
      (x) => (x.context[0].mode = "9999"),
      /context mode/,
    ],
    ["wrong normalized mode", (x) => (x.files[0].mode = "0755"), /mode/],
    [
      "path escape",
      (x) => (x.files[0].path = "../secret"),
      /outside deploy inputs/,
    ],
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    rejected(
      label,
      () => validateCandidateManifest(changed, { expectedProducer: producer }),
      pattern,
    );
  }

  writeFileSync(join(root, "apps/docs/out/index.html"), "tampered\n");
  rejected(
    "downloaded file tamper",
    () =>
      validateCandidateManifest(manifest, { root, expectedProducer: producer }),
    /downloaded candidate files/,
  );
  writeFileSync(join(root, "apps/docs/out/index.html"), "hello\n");
  symlinkSync("index.html", join(root, "apps/docs/out/link"));
  rejected(
    "candidate symlink",
    () => createCandidateManifest(root, producer),
    /symlink/,
  );
  rmSync(join(root, "apps/docs/out/link"));

  const run = {
    id: 41,
    run_attempt: 1,
    head_sha: SHA,
    head_branch: "main",
    event: "push",
    status: "completed",
    conclusion: "success",
    path: ".github/workflows/release.yml@refs/heads/main",
    repository: { full_name: producer.repository },
  };
  const artifact = {
    id: 9,
    name: `docs-candidate-${SHA}-41-1`,
    expired: false,
    digest: `sha256:${"c".repeat(64)}`,
    workflow_run: { head_sha: SHA },
  };
  const expected = { repository: producer.repository, sha: SHA };
  assert.equal(selectLiveCandidate([], new Map(), expected).reason, "missing");
  assert.equal(
    selectLiveCandidate(
      [run],
      new Map([[41, [{ ...artifact, expired: true }]]]),
      expected,
    ).reason,
    "expired",
  );
  console.log("✓ missing and expired candidates are safe shadow misses");
  const rerun = { ...run, run_attempt: 2 };
  const currentAttempt = {
    ...artifact,
    id: 11,
    name: `docs-candidate-${SHA}-41-2`,
  };
  assert.equal(
    selectLiveCandidate(
      [rerun],
      new Map([[41, [artifact, currentAttempt]]]),
      expected,
    ).artifact.id,
    11,
  );
  console.log("✓ rerun selection ignores a prior-attempt artifact");
  rejected(
    "duplicate live artifacts",
    () =>
      selectLiveCandidate(
        [run],
        new Map([[41, [artifact, { ...artifact, id: 10 }]]]),
        expected,
      ),
    /ambiguous/,
  );
  rejected(
    "missing API digest",
    () =>
      selectLiveCandidate(
        [run],
        new Map([[41, [{ ...artifact, digest: null }]]]),
        expected,
      ),
    /digest/,
  );
  rejected(
    "artifact SHA mismatch",
    () =>
      selectLiveCandidate(
        [run],
        new Map([
          [41, [{ ...artifact, workflow_run: { head_sha: "b".repeat(40) } }]],
        ]),
        expected,
      ),
    /SHA/,
  );
  assert.equal(
    selectLiveCandidate(
      [{ ...run, event: "workflow_dispatch" }],
      new Map([[41, [artifact]]]),
      expected,
    ).state,
    "miss",
  );
  console.log("✓ non-push or wrong-tree producers are ineligible");

  const rebuilt = structuredClone(manifest);
  rebuilt.contentRoot = "d".repeat(64);
  rejected(
    "candidate/rebuild parity mismatch",
    () => compareCandidateManifests(manifest, rebuilt),
    /content root/,
  );
  const immutable = join(root, "candidate-report.json");
  writeJsonAtomic(immutable, { complete: true });
  rejected(
    "duplicate immutable manifest path",
    () => writeJsonAtomic(immutable, { complete: false }),
    /EEXIST/,
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log("✓ deploy-candidate: positive and negative fixtures passed");
