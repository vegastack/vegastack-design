#!/usr/bin/env node

// Fail-closed workflow topology for affected-only PR CI and one-instruction shipping. The negative
// harness mutates every decision-bearing assertion below; a rule that is not observed rejecting its
// own failure mode is not accepted as a gate.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { ROOT } from "./lib/fs.mjs";

const WORKFLOW_DIR = ".github/workflows";
const REQUIRED = ["ci.yml", "deploy.yml", "full-suite.yml", "release.yml"];
const MAC = "[self-hosted, vsk-runners-mac-mini]";
const LINUX = "[self-hosted, linux, vsk-runner]";
const EXPECTED_RUNNERS = {
  "ci.yml": { quality: LINUX },
  "full-suite.yml": { "full-component-suite": LINUX },
  "release.yml": {
    version: MAC,
    publish: MAC,
    "dispatch-deploy": MAC,
  },
  "deploy.yml": {
    "distribution-proof": LINUX,
    "build-sign-deploy": MAC,
    "verify-public-boundary": MAC,
  },
};
const LINUX_JOBS = new Set([
  "ci.yml:quality",
  "full-suite.yml:full-component-suite",
  "deploy.yml:distribution-proof",
]);
const EXPECTED_PERMISSIONS = {
  "release.yml:version": { contents: "write" },
  "release.yml:publish": { contents: "read", "id-token": "write" },
  "release.yml:dispatch-deploy": { actions: "write", contents: "read" },
  "deploy.yml:build-sign-deploy": {
    contents: "read",
    "id-token": "write",
  },
  "deploy.yml:verify-public-boundary": { contents: "read" },
};

function formatRunner(value) {
  return Array.isArray(value)
    ? `[${value.join(", ")}]`
    : typeof value === "string"
      ? value
      : JSON.stringify(value);
}

function normalizePermissions(value) {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function steps(job) {
  assert.ok(Array.isArray(job.steps), "workflow job has no steps array");
  return job.steps;
}

function commands(job) {
  return steps(job)
    .map((step) => (typeof step.run === "string" ? step.run.trim() : null))
    .filter(Boolean);
}

function hasCommand(job, pattern) {
  return commands(job).some((command) => pattern.test(command));
}

function parseWorkflow(name, source) {
  let document;
  try {
    document = parseYaml(source);
  } catch (error) {
    assert.fail(`${name}: invalid YAML: ${error.message}`);
  }
  assert.ok(
    document && typeof document === "object",
    `${name}: no YAML mapping`,
  );
  assert.ok(
    document.jobs && typeof document.jobs === "object",
    `${name}: no jobs`,
  );
  return document;
}

function playwrightVersion(root) {
  const lock = parseYaml(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"));
  const value = lock.importers?.["."]?.devDependencies?.playwright?.version;
  assert.match(
    value ?? "",
    /^\d+\.\d+\.\d+$/,
    "pnpm lockfile must resolve one exact root Playwright version",
  );
  return value;
}

export function verifyWorkflowSources(sources, { root = ROOT } = {}) {
  for (const required of REQUIRED)
    assert.ok(sources[required], `${required}: required workflow is missing`);

  const parsed = Object.fromEntries(
    Object.entries(sources).map(([name, source]) => [
      name,
      parseWorkflow(name, source),
    ]),
  );
  const image = `mcr.microsoft.com/playwright:v${playwrightVersion(root)}-noble`;

  assert.doesNotMatch(
    Object.values(sources).join("\n"),
    /\b(?:NPM_TOKEN|NODE_AUTH_TOKEN)\b/,
    "publishing must remain token-free OIDC",
  );

  for (const [name, workflow] of Object.entries(parsed)) {
    assert.deepEqual(
      normalizePermissions(workflow.permissions),
      { contents: "read" },
      `${name}: workflow default permissions must be contents: read`,
    );
    assert.equal(
      workflow.env?.SITE_VISIBILITY,
      "public",
      `${name}: automatic surfaces are public-only`,
    );

    const expectedJobs = EXPECTED_RUNNERS[name];
    assert.ok(expectedJobs, `${name}: workflow has no reviewed runner map`);
    assert.deepEqual(
      Object.keys(workflow.jobs).sort(),
      Object.keys(expectedJobs).sort(),
      `${name}: job inventory drifted`,
    );

    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      const key = `${name}:${jobName}`;
      assert.equal(
        formatRunner(job["runs-on"]),
        expectedJobs[jobName],
        `${key}: runner class drifted`,
      );
      assert.ok(
        Number.isInteger(job["timeout-minutes"]) &&
          job["timeout-minutes"] > 0 &&
          job["timeout-minutes"] <= 60,
        `${key}: timeout must be 1..60 minutes`,
      );
      assert.notEqual(
        job["continue-on-error"],
        true,
        `${key}: may not continue on error`,
      );
      assert.notEqual(
        job.if,
        false,
        `${key}: job may not be disabled with if: false`,
      );

      const linux = LINUX_JOBS.has(key);
      if (linux) {
        const container =
          typeof job.container === "string"
            ? job.container
            : job.container?.image;
        assert.equal(
          container,
          image,
          `${key}: Playwright image must match the root pin`,
        );
        assert.equal(
          job.defaults?.run?.shell,
          "bash",
          `${key}: Linux container jobs require bash`,
        );
      } else {
        assert.equal(
          job.container,
          undefined,
          `${key}: macOS job cannot declare a container`,
        );
      }

      for (const [index, step] of steps(job).entries()) {
        const label = `${key}:step-${index + 1}`;
        assert.notEqual(
          step["continue-on-error"],
          true,
          `${label}: may not continue on error`,
        );
        assert.notEqual(
          step.if,
          false,
          `${label}: may not be disabled with if: false`,
        );
        if (typeof step.uses === "string" && !step.uses.startsWith("./"))
          assert.match(
            step.uses,
            /^[^@]+@[0-9a-f]{40}$/,
            `${label}: action must be pinned by full commit SHA`,
          );
        if (typeof step.run === "string") {
          assert.doesNotMatch(
            step.run,
            /\$\{\{/,
            `${label}: expressions must enter shell through env, not direct interpolation`,
          );
          if (/\bpnpm install\b/.test(step.run))
            assert.match(
              step.run,
              /--frozen-lockfile/,
              `${label}: install must be frozen`,
            );
        }
        if (/^actions\/checkout@/.test(step.uses ?? "")) {
          assert.equal(
            step.with?.["persist-credentials"],
            false,
            `${label}: checkout credentials must not persist`,
          );
        }
        if (expectedJobs[jobName] === MAC) {
          if (/^pnpm\/action-setup@/.test(step.uses ?? ""))
            assert.match(
              step.with?.dest ?? "",
              /\$\{\{\s*runner\.temp\s*\}\}/,
              `${label}: macOS pnpm bootstrap must be per-job under runner.temp`,
            );
          if (typeof step.run === "string" && /\bpnpm install\b/.test(step.run))
            assert.match(
              step.run,
              /--store-dir "\$RUNNER_WORKSPACE\/pnpm-store"/,
              `${label}: macOS install must use the per-agent persistent store`,
            );
          if (/^actions\/setup-node@/.test(step.uses ?? ""))
            assert.equal(
              step.with?.cache,
              undefined,
              `${label}: setup-node cache is forbidden on the mac mini`,
            );
        }
      }
    }
  }

  for (const [workflow, document] of Object.entries(parsed)) {
    for (const [job, body] of Object.entries(document.jobs)) {
      const key = `${workflow}:${job}`;
      assert.deepEqual(
        normalizePermissions(body.permissions),
        normalizePermissions(EXPECTED_PERMISSIONS[key] ?? {}),
        `${key}: job permissions drifted`,
      );
    }
  }

  // Only the explicit manual audit may invoke a complete component suite.
  for (const [name, workflow] of Object.entries(parsed)) {
    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      if (name === "full-suite.yml" && jobName === "full-component-suite")
        continue;
      for (const command of commands(job)) {
        assert.doesNotMatch(
          command,
          /(?:pnpm\s+(?:test(?:\s|$)|test:full\b|verify(?:\s|$)|verify:release\b)|test:all-browsers|turbo\s+run\s+test[^\n]*@vegastack\/ui)/,
          `${name}:${jobName}: automatic workflows may not run the complete component suite`,
        );
      }
    }
  }

  const ci = parsed["ci.yml"];
  assert.ok(
    ci.on?.pull_request !== undefined,
    "ci.yml: must trigger on pull_request",
  );
  const quality = ci.jobs.quality;
  assert.equal(
    quality.name,
    "PR quality",
    "ci.yml: required check name drifted",
  );
  assert.equal(
    String(quality.if).replace(/^\$\{\{\s*|\s*\}\}$/g, ""),
    "github.event.pull_request.head.repo.full_name == github.repository",
    "ci.yml: persistent runner requires the exact fork guard",
  );
  assert.ok(
    hasCommand(
      quality,
      /pnpm verify:affected --base "\$BASE_SHA" --head "\$HEAD_SHA"/,
    ),
    "ci.yml: PR quality must run exact-SHA affected verification",
  );
  assert.ok(
    hasCommand(quality, /pnpm exec changeset status --since=origin\/main/),
    "ci.yml: PR quality must enforce changeset applicability",
  );

  const full = parsed["full-suite.yml"];
  assert.ok(full.on?.workflow_dispatch, "full-suite.yml: must be manual-only");
  assert.equal(
    full.on?.push,
    undefined,
    "full-suite.yml: must not trigger on push",
  );
  assert.equal(
    full.on?.pull_request,
    undefined,
    "full-suite.yml: must not trigger on PRs",
  );
  assert.deepEqual(
    full.on.workflow_dispatch.inputs.engines.options,
    ["chromium", "all"],
    "full-suite.yml: engine choices drifted",
  );
  assert.ok(
    hasCommand(
      full.jobs["full-component-suite"],
      /pnpm test:full --engines "\$AUDIT_ENGINES"/,
    ),
    "full-suite.yml: manual audit must invoke test:full with the selected engines",
  );

  const release = parsed["release.yml"];
  assert.ok(
    release.on?.workflow_dispatch,
    "release.yml: must be explicitly dispatched",
  );
  assert.equal(
    release.on?.push,
    undefined,
    "release.yml: must not run on main pushes",
  );
  assert.ok(
    release.on.workflow_dispatch.inputs.expected_sha?.required,
    "release.yml: exact authorized SHA input is required",
  );
  const version = release.jobs.version;
  assert.ok(
    hasCommand(version, /git rev-parse origin\/main/),
    "release.yml: version job must bind authorization to the current main tip",
  );
  assert.ok(
    hasCommand(version, /main-ruleset\.mjs --check-file/),
    "release.yml: direct release commit requires the enforced affected-PR ruleset",
  );
  assert.ok(
    hasCommand(version, /pnpm version-packages/),
    "release.yml: version job must assemble and version every pending changeset",
  );
  assert.ok(
    hasCommand(
      version,
      /verify-release-output-scope\.mjs --base "\$EXPECTED_SHA"/,
    ),
    "release.yml: generated release commit must pass the positive output allowlist",
  );
  for (const required of [
    "tooling/changelog-lint.mjs",
    "tooling/sync-changelog.mjs --check",
    "pnpm design:derived:check",
    "tooling/verify-component-contracts.mjs",
  ])
    assert.ok(
      commands(version).some((command) => command.includes(required)),
      `release.yml: generated metadata must run ${required}`,
    );
  assert.ok(
    hasCommand(version, /git log -1 --format=%s/),
    "release.yml: no-changeset resume must require a generated release commit",
  );
  const versioningStep = steps(version).find((step) =>
    String(step.name).startsWith("Version every pending changeset"),
  );
  const pushStep = steps(version).find(
    (step) => step.name === "Push the generated release commit",
  );
  assert.ok(
    versioningStep && pushStep,
    "release.yml: version and push steps are required",
  );
  assert.equal(
    versioningStep.env?.GITHUB_TOKEN,
    "${{ secrets.GITHUB_TOKEN }}",
    "release.yml: Changesets requires GitHub metadata while generating package changelogs",
  );
  assert.equal(
    pushStep.env?.GH_TOKEN,
    "${{ secrets.GITHUB_TOKEN }}",
    "release.yml: only the inert push step receives the repository write token",
  );
  assert.ok(
    hasCommand(version, /git push .*HEAD:main/),
    "release.yml: version job must push the direct release commit",
  );
  assert.ok(
    hasCommand(version, /gh auth setup-git/),
    "release.yml: direct push must use gh's environment-backed credential helper",
  );
  assert.doesNotMatch(
    sources["release.yml"],
    /x-access-token:/,
    "release.yml: never put the GitHub token in git's process arguments",
  );
  assert.equal(
    release.jobs["version-pr"],
    undefined,
    "release.yml: Version PR must stay removed",
  );
  const publish = release.jobs.publish;
  assert.equal(
    publish.needs,
    "version",
    "release.yml: publish must use the release commit",
  );
  assert.ok(
    hasCommand(publish, /for attempt in 1 2 3/),
    "release.yml: publish retries must be bounded to three attempts",
  );
  assert.ok(
    hasCommand(
      publish,
      /^set -euo pipefail[\s\S]*npm publish --access public --no-provenance/m,
    ),
    "release.yml: publish must use token-free OIDC without provenance on self-hosted runners",
  );
  assert.deepEqual(
    release.jobs["dispatch-deploy"].needs,
    ["version", "publish"],
    "release.yml: deploy dispatch must wait for version and publication",
  );
  assert.ok(
    hasCommand(release.jobs["dispatch-deploy"], /gh workflow run deploy\.yml/),
    "release.yml: successful publication must dispatch deployment",
  );
  assert.ok(
    hasCommand(release.jobs["dispatch-deploy"], /for attempt in 1 2 3/),
    "release.yml: deploy dispatch retries must be bounded to three",
  );

  const deploy = parsed["deploy.yml"];
  assert.ok(
    deploy.on?.workflow_dispatch,
    "deploy.yml: must accept explicit dispatch",
  );
  assert.ok(
    deploy.on.workflow_dispatch.inputs.expected_sha?.required,
    "deploy.yml: exact release SHA input is required",
  );
  assert.ok(
    hasCommand(deploy.jobs["distribution-proof"], /pnpm verify:distribution/),
    "deploy.yml: must prove the public distribution artifact",
  );
  assert.ok(
    hasCommand(
      deploy.jobs["distribution-proof"],
      /git merge-base --is-ancestor "\$EXPECTED_SHA" origin\/main/,
    ),
    "deploy.yml: requested artifact must be in protected main history",
  );
  assert.equal(
    deploy.jobs["build-sign-deploy"].needs,
    "distribution-proof",
    "deploy.yml: deployment must wait for distribution proof",
  );
  assert.equal(
    deploy.jobs["verify-public-boundary"].needs,
    "build-sign-deploy",
    "deploy.yml: production probe must follow deployment",
  );
  assert.ok(
    steps(deploy.jobs["build-sign-deploy"]).some((step) =>
      /^cloudflare\/wrangler-action@/.test(step.uses ?? ""),
    ),
    "deploy.yml: Cloudflare deploy step is missing",
  );
  const signingStep = steps(deploy.jobs["build-sign-deploy"]).find(
    (step) => step.name === "Sign and verify the exported integrity manifest",
  );
  assert.ok(signingStep, "deploy.yml: manifest signing step is missing");
  assert.match(
    signingStep.run,
    /if cosign verify-blob[^\n]*tampered-manifest\.json"; then\n\s+echo "::error::Tampered manifest unexpectedly verified"\n\s+exit 1\nfi/,
    "deploy.yml: tampered manifest must be observed failing",
  );
  assert.match(
    signingStep.run,
    /if cosign verify-blob[^\n]*"\$WRONG" "\$MANIFEST"; then\n\s+echo "::error::Wrong signer identity unexpectedly verified"\n\s+exit 1\nfi/,
    "deploy.yml: wrong signer identity must be observed failing",
  );
  assert.ok(
    hasCommand(deploy.jobs["verify-public-boundary"], /probe-deployment\.mjs/),
    "deploy.yml: canonical production boundary probe is missing",
  );

  const oidc = [];
  for (const [name, workflow] of Object.entries(parsed))
    for (const [job, body] of Object.entries(workflow.jobs))
      if (body.permissions?.["id-token"] === "write")
        oidc.push(`${name}:${job}`);
  assert.deepEqual(
    oidc.sort(),
    ["deploy.yml:build-sign-deploy", "release.yml:publish"],
    "OIDC authority must exist only in signing and npm publication jobs",
  );

  return true;
}

export function readWorkflowSources({ root = ROOT } = {}) {
  const directory = join(root, WORKFLOW_DIR);
  return Object.fromEntries(
    readdirSync(directory)
      .filter((name) => /\.ya?ml$/.test(name))
      .sort()
      .map((name) => [name, readFileSync(join(directory, name), "utf8")]),
  );
}

const isMain =
  resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (isMain) {
  verifyWorkflowSources(readWorkflowSources());
  console.log("verify-workflow-security: passed");
}
