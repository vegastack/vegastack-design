#!/usr/bin/env node
// Workflow gate (30-10-2026): actionlint (syntax, expressions, shell), zizmor (GitHub Actions
// security: injection, credential persistence, unpinned actions, excessive permissions) and the few
// house rules no general tool knows. It replaces verify-workflow-security.mjs and its mutation
// harness (~900 lines that re-encoded every job's exact shape, so each workflow edit meant editing the
// gate). CI runs it only when `.github/**` or this file changes.
//
//   node tooling/verify-workflows.mjs            all three
//   node tooling/verify-workflows.mjs --policy   house rules only (no binaries needed)
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIR = join(ROOT, ".github/workflows");
const RUNNER = ["self-hosted", "linux", "vsk-runner"];
/** Jobs allowed to mint an OIDC token (npm trusted publishing; Sigstore signing). */
const OIDC_JOBS = new Set(["release.yml:publish", "deploy.yml:deploy"]);
/** Workflows allowed to mount the trusted caches; none of them runs pull-request code. */
const TRUSTED_WORKFLOWS = new Set(["release.yml", "deploy.yml"]);

function policy() {
  const lock = parseYaml(readFileSync(join(ROOT, "pnpm-lock.yaml"), "utf8"));
  const playwright =
    lock.importers?.["."]?.devDependencies?.playwright?.version;
  assert.match(
    playwright ?? "",
    /^\d+\.\d+\.\d+$/,
    "lockfile must pin one root playwright",
  );
  const image = `mcr.microsoft.com/playwright:v${playwright}-noble`;
  const problems = [];
  const check = (ok, message) => ok || problems.push(message);

  for (const file of readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f))) {
    const source = readFileSync(join(DIR, file), "utf8");
    const workflow = parseYaml(source);
    check(
      !/\b(?:NPM_TOKEN|NODE_AUTH_TOKEN)\b/.test(source),
      `${file}: npm publishing is token-free OIDC`,
    );
    check(
      !("pull_request_target" in (workflow.on ?? {})),
      `${file}: pull_request_target is banned`,
    );
    check(
      !/mac-mini|macos/i.test(JSON.stringify(workflow.jobs)),
      `${file}: the Mac runners are retired (29-10-2026)`,
    );
    for (const [id, job] of Object.entries(workflow.jobs ?? {})) {
      const label = `${file}:${id}`;
      check(
        JSON.stringify(job["runs-on"]) === JSON.stringify(RUNNER),
        `${label}: runs-on must be ${JSON.stringify(RUNNER)}`,
      );
      check(
        job.container?.image === image,
        `${label}: container must be ${image} (derived from pnpm-lock.yaml)`,
      );
      check(
        Number.isInteger(job["timeout-minutes"]),
        `${label}: needs timeout-minutes`,
      );
      const oidc = job.permissions?.["id-token"] === "write";
      check(
        !oidc || OIDC_JOBS.has(label),
        `${label}: id-token: write is reserved for ${[...OIDC_JOBS].join(", ")}`,
      );
      const volumes = (job.container?.volumes ?? []).join(" ");
      check(
        !/trusted/.test(volumes) || TRUSTED_WORKFLOWS.has(file),
        `${label}: trusted caches are mounted only by ${[...TRUSTED_WORKFLOWS].join(", ")}`,
      );
    }
    if (file === "ci.yml") {
      for (const [id, job] of Object.entries(workflow.jobs ?? {}))
        check(
          String(job.if ?? "").includes(
            "github.event.pull_request.head.repo.full_name == github.repository",
          ),
          `ci.yml:${id}: fork pull requests must never run on the LAN runners`,
        );
    }
  }
  if (problems.length) {
    for (const problem of problems) console.error(`✗ ${problem}`);
    process.exit(1);
  }
  console.log(
    "✓ verify-workflows: house rules hold (runners, container, OIDC, trusted caches, forks)",
  );
}

function tool(name) {
  if (process.platform === "linux" && process.arch === "x64") {
    execFileSync(
      process.execPath,
      [join(ROOT, "tooling/trusted-tool.mjs"), name],
      { stdio: "inherit" },
    );
    const base = process.env.RUNNER_TEMP ?? "/tmp";
    return readdirSync(base)
      .filter((d) => d.startsWith(`${name}-`))
      .map((d) => join(base, d, name))[0];
  }
  return name; // a developer machine: brew install actionlint zizmor
}

function run(binary, args) {
  const result = spawnSync(binary, args, { cwd: ROOT, stdio: "inherit" });
  if (result.error) {
    console.error(
      `✗ verify-workflows: cannot run ${binary} (${result.error.message})`,
    );
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

policy();
if (!process.argv.includes("--policy")) {
  run(tool("actionlint"), ["-config-file", ".github/actionlint.yaml"]);
  run(tool("zizmor"), [
    "--offline",
    "--config",
    ".github/zizmor.yml",
    ".github/workflows",
  ]);
  console.log("✓ verify-workflows: actionlint and zizmor clean");
}
