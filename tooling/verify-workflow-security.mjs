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
    changes: MAC,
    "version-pr": MAC,
    "dispatch-version-pr-quality": MAC,
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
  "release.yml:version-pr": {
    contents: "write",
    "pull-requests": "write",
  },
  "release.yml:dispatch-version-pr-quality": {
    actions: "write",
    contents: "read",
  },
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
  assert.ok(
    ci.on?.workflow_dispatch,
    "ci.yml: must accept an internal Version PR dispatch",
  );
  for (const input of ["base_sha", "head_sha"])
    assert.equal(
      ci.on.workflow_dispatch.inputs[input]?.required,
      true,
      `ci.yml: ${input} dispatch input must be required`,
    );
  const quality = ci.jobs.quality;
  assert.equal(
    quality.name,
    "PR quality",
    "ci.yml: required check name drifted",
  );
  assert.equal(
    String(quality.if).replace(/^\$\{\{\s*|\s*\}\}$/g, ""),
    "github.event_name == 'workflow_dispatch' || github.event.pull_request.head.repo.full_name == github.repository",
    "ci.yml: persistent runner requires the fork guard or trusted internal dispatch",
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
  assert.ok(
    hasCommand(quality, /verify-release-output-scope\.mjs --base "\$BASE_SHA"/),
    "ci.yml: generated Version PRs must pass the positive output allowlist",
  );
  const changesetStep = steps(quality).find(
    (step) => step.name === "Require an applicable changeset",
  );
  const releaseOutputStep = steps(quality).find(
    (step) => step.name === "Restrict generated Version Packages output",
  );
  assert.match(
    String(changesetStep?.if),
    /event_name == 'pull_request'[\s\S]*head\.ref != 'changeset-release\/main'/,
    "ci.yml: ordinary PRs alone must require a changeset",
  );
  assert.match(
    String(releaseOutputStep?.if),
    /head\.ref == 'changeset-release\/main'[\s\S]*event_name == 'workflow_dispatch'/,
    "ci.yml: generated Version PRs alone must use the release-output guard",
  );
  const qualityCheckout = steps(quality).find((step) =>
    /^actions\/checkout@/.test(step.uses ?? ""),
  );
  assert.match(
    qualityCheckout?.with?.ref ?? "",
    /pull_request\.head\.sha[\s\S]*inputs\.head_sha/,
    "ci.yml: PR quality must check out the exact event or dispatched head",
  );
  const dispatchBinding = steps(quality).find(
    (step) =>
      step.name ===
      "Bind an internal dispatch to the generated Version Packages branch",
  );
  assert.equal(
    String(dispatchBinding?.if),
    "github.event_name == 'workflow_dispatch'",
    "ci.yml: exact generated-branch binding must run on every internal dispatch",
  );
  for (const pattern of [
    /"\$DISPATCH_REF" = "changeset-release\/main"/,
    /"\$EVENT_SHA" = "\$HEAD_SHA"/,
    /git rev-parse HEAD\)" = "\$HEAD_SHA"/,
    /git rev-parse origin\/main\)" = "\$BASE_SHA"/,
  ])
    assert.match(
      dispatchBinding?.run ?? "",
      pattern,
      "ci.yml: internal dispatch must bind branch, event head, checkout, and live main",
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
    "release.yml: must allow exact-SHA recovery dispatch",
  );
  assert.deepEqual(
    release.on?.push?.branches,
    ["main"],
    "release.yml: must coordinate releases on main pushes",
  );
  assert.ok(
    release.on.workflow_dispatch.inputs.expected_sha?.required,
    "release.yml: exact authorized SHA input is required",
  );
  const changes = release.jobs.changes;
  assert.ok(
    hasCommand(changes, /git rev-parse origin\/main/),
    "release.yml: release state must bind to the current main tip",
  );
  assert.ok(
    hasCommand(changes, /release-detect\.mjs[\s\S]*--check-npm/),
    "release.yml: one tested authority must classify Version PR, publish, and resume state",
  );
  const versionPr = release.jobs["version-pr"];
  assert.equal(
    String(versionPr.if).replace(/^\$\{\{\s*|\s*\}\}$/g, ""),
    "needs.changes.outputs.has_changesets == 'true'",
    "release.yml: Version PR creation must require pending changesets",
  );
  assert.ok(
    steps(versionPr).some(
      (step) =>
        /^changesets\/action@/.test(step.uses ?? "") &&
        step.with?.version === "pnpm run version-packages" &&
        step.with?.commitMode === "github-api" &&
        step.env?.GITHUB_TOKEN === "${{ secrets.GITHUB_TOKEN }}",
    ),
    "release.yml: Changesets must create the Version Packages PR through the GitHub API",
  );
  assert.ok(
    hasCommand(versionPr, /git\/ref\/heads\/\$VERSION_BRANCH/),
    "release.yml: Version PR resolution must bind the branch to its exact head",
  );
  const versionPrDispatch = release.jobs["dispatch-version-pr-quality"];
  assert.deepEqual(
    versionPrDispatch.needs,
    ["changes", "version-pr"],
    "release.yml: Version PR quality dispatch must wait for exact release state and generated head",
  );
  assert.ok(
    hasCommand(
      versionPrDispatch,
      /gh workflow run ci\.yml[\s\S]*-f base_sha="\$BASE_SHA"[\s\S]*-f head_sha="\$HEAD_SHA"/,
    ),
    "release.yml: the GITHUB_TOKEN-created Version PR must receive exact-SHA PR quality",
  );
  assert.ok(
    hasCommand(versionPrDispatch, /for attempt in 1 2 3/),
    "release.yml: Version PR quality dispatch retries must be bounded to three",
  );
  assert.doesNotMatch(
    sources["release.yml"],
    /git push[^\n]*HEAD:main|main-ruleset\.mjs --check-file/,
    "release.yml: Version PR topology may not retain a direct-main push or bypass dependency",
  );
  const publish = release.jobs.publish;
  assert.equal(
    publish.needs,
    "changes",
    "release.yml: publish must use the inspected Version PR merge",
  );
  assert.match(
    String(publish.if),
    /publish == 'true'[\s\S]*has_changesets == 'false'/,
    "release.yml: publication requires an unpublished, changeset-free Version PR merge",
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
    ["changes", "publish"],
    "release.yml: deploy dispatch must wait for release inspection and publication",
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
