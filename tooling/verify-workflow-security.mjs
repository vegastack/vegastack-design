import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// DISCOVER every workflow rather than auditing a hard-coded list: a list meant a newly added
// .github/workflows/*.yml was silently exempt from every generic check below (unpinned actions,
// credential-persisting checkout, stray OIDC, script injection). The named set is still asserted
// to exist so a rename/removal fails loudly instead of quietly dropping its targeted assertions.
const WORKFLOW_DIR = ".github/workflows";
const discovered = readdirSync(WORKFLOW_DIR)
  .filter((name) => /\.ya?ml$/.test(name))
  .sort();
const REQUIRED_WORKFLOWS = ["ci.yml", "deploy.yml", "release.yml"];
for (const name of REQUIRED_WORKFLOWS) {
  assert.ok(
    discovered.includes(name),
    `${name} is missing — it carries targeted security assertions in this gate`,
  );
}
const sources = Object.fromEntries(
  discovered.map((name) => [
    name,
    readFileSync(join(WORKFLOW_DIR, name), "utf8"),
  ]),
);

// The self-hosted runners are macOS. `runs-on` is an allowlist, not a free choice: a job moved onto
// GitHub-hosted infrastructure without a recorded reason silently reintroduces the billed capacity
// this repository deliberately left, and a job moved OFF ubuntu-latest can break publishing or void
// a boundary proof. Every entry below states why it is where it is.
const SELF_HOSTED = "[self-hosted, vsk-runners-mac-mini]";
//
// NO BROWSER RUNS IN CI AT ALL. That is the whole point of the local-first topology
// (docs/plans/2026-07-25-cicd-local-first-revamp.md): the Vitest browser suite, the cross-engine
// smoke, the three-engine suite, and the 864 behaviour contracts run in `.husky/pre-push` on a
// developer machine and are attested by `.gates/receipt.json`, which the `receipt-guard` job in each
// workflow verifies against the pushed tree. So the mac minis' inability to launch Chromium — a host
// bug, recorded in AGENTS.md § Locked decisions — no longer blocks anything, and every job that
// executes repository code is free.
//
// Each entry below is a HARD requirement, not a preference. Removing one costs money; adding one
// without a reason here fails this gate.
//
const GITHUB_HOSTED_JOBS = {
  // Nothing. Pull requests cost zero billable minutes.
  "ci.yml": [],
  // package-build: PROVENANCE. `publish` uploads exactly these bytes and npm's OIDC provenance
  //   statement asserts they were built by this workflow in this repository; a persistent
  //   self-hosted runner can carry state between runs, which would make that assertion less true.
  // publish: npm trusted publishing does not support self-hosted runners
  //   (https://docs.npmjs.com/trusted-publishers/) and this repository holds no NPM_TOKEN, so moving
  //   it breaks publishing outright.
  "release.yml": ["package-build", "publish"],
  // sign-curated: the only OIDC job; self-hosted Sigstore behaviour is unverified, ~30s, no
  //   repository code. deploy-curated: credential-only, third-party actions, nothing to gain. The
  //   boundary job must originate OUTSIDE VegaStack's network — a runner inside it can be silently
  //   authenticated by Cloudflare device posture, which would void the anonymous registry-denial
  //   proof rather than merely risk it.
  "deploy.yml": ["sign-curated", "deploy-curated", "verify-public-boundary"],
};

/**
 * Every workflow must carry a `receipt-guard` job. It is the ONLY mechanism by which a push carries
 * evidence that the browser lanes ran, so a workflow that quietly loses it would validate the
 * non-browser half and call that a pass.
 */
const RECEIPT_GUARD_WORKFLOWS = ["ci.yml", "release.yml", "deploy.yml"];

/**
 * Job name → its `runs-on` value, for one workflow source. Only keys under the top-level `jobs:`
 * mapping count, and a job whose `runs-on` is absent or written in the block/mapping form is
 * returned as `null` rather than omitted — an omitted job would be silently exempt from the
 * allowlist below, which is the exact fail-open this gate exists to prevent.
 */
function jobRunners(source) {
  const runners = new Map();
  const lines = source.split("\n");
  let inJobs = false;
  let current = null;
  for (const line of lines) {
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }
    if (/^\S/.test(line)) inJobs = false;
    if (!inJobs) continue;
    const job = /^ {2}([a-zA-Z0-9_-]+):\s*$/.exec(line);
    if (job) {
      current = job[1];
      runners.set(current, null);
      continue;
    }
    const runsOn = /^ {4}runs-on:[ \t]*(\S.*?)\s*$/.exec(line);
    if (runsOn && current) runners.set(current, runsOn[1]);
  }
  return runners;
}

/**
 * Yield every line that ends up inside a `run:` script — both the inline form (`run: echo hi`) and
 * the block-scalar form (`run: |` followed by an indented body, optionally introduced by `- `).
 * Line-based rather than one regex: the list-item form (`- run: |`) shifts the body indent relative
 * to the `run:` key, which a single pattern silently failed to match — so the rule reported clean.
 */
function runScriptLines(source) {
  const out = [];
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(-\s+)?run:\s*(\|[-+]?|>[-+]?)?[ \t]*(.*)$/.exec(
      lines[i],
    );
    if (!match) continue;
    const [, indent, dash, blockScalar, inline] = match;
    if (!blockScalar) {
      if (inline) out.push({ line: i + 1, text: inline });
      continue;
    }
    // Body belongs to this scalar while it is blank or indented deeper than the `run:` key itself
    // (accounting for the `- ` prefix, which shifts the key right without changing the mapping).
    const keyIndent = indent.length + (dash ? dash.length : 0);
    for (let j = i + 1; j < lines.length; j++) {
      const body = lines[j];
      if (body.trim() === "") continue;
      const bodyIndent = body.length - body.trimStart().length;
      if (bodyIndent <= keyIndent) break;
      out.push({ line: j + 1, text: body });
    }
  }
  return out;
}

function jobBlock(source, name) {
  const marker = `  ${name}:\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `workflow is missing job ${name}`);
  const bodyStart = start + marker.length;
  const remainder = source.slice(bodyStart);
  const nextJob = remainder.search(/^  [a-zA-Z0-9_-]+:\n/m);
  return marker + (nextJob === -1 ? remainder : remainder.slice(0, nextJob));
}

function stepBlocks(source) {
  const lines = source.split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const start = /^(\s*)-\s+(?:name|uses|run):/.exec(lines[i]);
    if (!start) continue;
    const indent = start[1].length;
    let end = i + 1;
    while (
      end < lines.length &&
      !new RegExp(`^\\s{${indent}}-\\s+(?:name|uses|run):`).test(lines[end])
    )
      end++;
    blocks.push(lines.slice(i, end).join("\n"));
    i = end - 1;
  }
  return blocks;
}

/** Names of jobs that declare a `container:`, so the ban can be scoped to self-hosted jobs. */
function containerJobs(source) {
  const names = [];
  const lines = source.split("\n");
  let inJobs = false;
  let current = null;
  for (const line of lines) {
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }
    if (/^\S/.test(line)) inJobs = false;
    if (!inJobs) continue;
    const job = /^ {2}([a-zA-Z0-9_-]+):\s*$/.exec(line);
    if (job) {
      current = job[1];
      continue;
    }
    if (/^ {4}container:/.test(line) && current) names.push(current);
  }
  return names;
}

for (const [name, source] of Object.entries(sources)) {
  assert.doesNotMatch(
    source,
    /\bTURBO_TOKEN\b|\bTURBO_TEAM\b/,
    `${name}: remote-cache credentials must not be workflow-wide`,
  );
  for (const match of source.matchAll(
    /^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm,
  )) {
    const reference = match[1];
    assert.match(
      reference,
      /@[0-9a-f]{40}$/,
      `${name}: action is not pinned to a full commit SHA: ${reference}`,
    );
  }
  const checkoutSteps = stepBlocks(source).filter((block) =>
    block.includes("actions/checkout@"),
  );
  for (const block of checkoutSteps) {
    assert.match(
      block,
      /persist-credentials:\s*false/,
      `${name}: checkout persists a token`,
    );
  }
  // CONTAINERS ARE BANNED OUTRIGHT, and that is now a simplification rather than a restriction.
  // A container is Linux-only, so it cannot start on the macOS minis at all; and the one job that
  // legitimately needed one — `release.yml`'s `quality-gate`, which ran the three-engine suite in the
  // digest-pinned Playwright image because bare `ubuntu-latest` WebKit could not settle the compiled-CSS
  // Toaster contrast check — no longer runs a browser in CI. That suite now runs locally in 1m39s.
  //
  // With the image gone, the digest-pinning assertion that used to guard it, and the `shell: bash`
  // assertion that guarded a container's sh-not-bash default (run 30142154420 died on
  // "Illegal option -o pipefail" and reported it as registry drift), both guarded nothing. Dead
  // assertions are worse than absent ones: they read as coverage. So the ban replaces them, and
  // tooling/verify-workflow-security-negative.mjs proves the ban actually rejects a container.
  assert.deepEqual(
    containerJobs(source),
    [],
    `${name}: declares a job container. Containers are Linux-only and cannot start on the self-hosted ` +
      `macOS runners, and no GitHub-hosted job here drives a browser any more — the lane that needed ` +
      `the pinned Playwright image now runs locally.`,
  );

  const allowed = new Set(GITHUB_HOSTED_JOBS[name] ?? []);
  const runners = jobRunners(source);
  assert.ok(
    runners.size > 0,
    `${name}: no jobs found — the parser or the file changed shape`,
  );

  // The receipt guard is load-bearing: it is the only thing that checks the browser lanes ran.
  if (RECEIPT_GUARD_WORKFLOWS.includes(name)) {
    assert.ok(
      runners.has("receipt-guard"),
      `${name}: has no \`receipt-guard\` job. Under the local-first topology the browser lanes run ` +
        `only in .husky/pre-push, so without this job the workflow validates the non-browser half and ` +
        `reports that as a pass.`,
    );
    const guard = jobBlock(source, "receipt-guard");
    assert.match(
      guard,
      /verify-gate-receipt\.mjs/,
      `${name}: receipt-guard does not run tooling/verify-gate-receipt.mjs`,
    );
    if (name === "deploy.yml")
      assert.match(
        guard,
        /--profile production-full/,
        "deploy.yml: receipt-guard must require schema-v2 production-full evidence explicitly",
      );
  }

  for (const [job, runner] of runners) {
    assert.ok(
      runner !== null,
      `${name}: job ${job} has no inline \`runs-on: <value>\`; the block/mapping form would skip the runner allowlist`,
    );
    if (allowed.has(job)) {
      assert.equal(
        runner,
        "ubuntu-latest",
        `${name}: job ${job} is recorded as GitHub-hosted but runs on ${runner}`,
      );
      continue;
    }
    assert.equal(
      runner,
      SELF_HOSTED,
      `${name}: job ${job} must run on ${SELF_HOSTED}; add it to GITHUB_HOSTED_JOBS with a recorded reason if that is deliberate`,
    );
  }
  for (const job of allowed) {
    assert.ok(
      runners.has(job),
      `${name}: GITHUB_HOSTED_JOBS lists ${job}, which no longer exists`,
    );
  }

  // The committed-baseline pixel gate is gone: screenshots are captured locally by
  // tooling/vrt-review.mjs, on one machine, and never committed. A workflow reaching for its
  // machinery is reintroducing a gate that could only be cleared by overwriting its own evidence.
  assert.doesNotMatch(
    source,
    /verify:vrt-baselines|update_baselines|-snapshots/,
    `${name}: references the removed committed-baseline VRT machinery`,
  );

  assert.match(
    source,
    /^permissions:\n  contents: read$/m,
    `${name}: missing read-only workflow token`,
  );

  // `pull_request_target` runs with a privileged token against the BASE repo while checking out
  // fork-authored code — the canonical Actions privilege-escalation trigger. None of these
  // workflows needs it.
  assert.doesNotMatch(
    source,
    /^\s*pull_request_target\s*:/m,
    `${name}: pull_request_target grants a privileged token to fork-authored code`,
  );

  // Script injection: a `${{ … }}` expression inside a `run:` body is substituted as raw text
  // BEFORE bash parses the line, so any shell metacharacter in an attacker-influenced value
  // executes. Pass such values through `env:` and reference them as "$VAR" instead.
  // Only `run:` BODIES are scanned — `if:`/`env:`/`with:` expressions are evaluated by Actions
  // itself, never by a shell, and are legitimate.
  for (const { line, text } of runScriptLines(source)) {
    const expression = /\$\{\{\s*([^}]+?)\s*\}\}/.exec(text);
    if (!expression) continue;
    assert.fail(
      `${name}:${line}: \`\${{ ${expression[1]} }}\` is interpolated directly into a run: script — ` +
        `pass it via env: and reference "$VAR" (shell-injection risk)`,
    );
  }
}

for (const [name, source] of Object.entries(sources)) {
  const expectedOidc = name === "deploy.yml" || name === "release.yml" ? 1 : 0;
  assert.equal(
    [...source.matchAll(/id-token:\s*write/g)].length,
    expectedOidc,
    `${name}: unexpected OIDC permission count`,
  );
}

assert.equal(
  [...sources["deploy.yml"].matchAll(/id-token:\s*write/g)].length,
  1,
  "deploy.yml: OIDC must be scoped to the signing job only",
);
assert.match(
  sources["deploy.yml"],
  /DISPATCH_REF[^\n]*\n[\s\S]*refs\/heads\/main/,
);
assert.doesNotMatch(
  sources["deploy.yml"],
  /cutover_phase|PUBLIC_DOCS_CUTOVER|probe-precutover-protection|pre-cutover-purge|verify-protected-boundary/,
  "deploy.yml: the completed public-site rollout must not retain obsolete cutover branches",
);
const signingJob = jobBlock(sources["deploy.yml"], "sign-curated");
const deploymentJob = jobBlock(sources["deploy.yml"], "deploy-curated");
assert.match(signingJob, /^    needs: build-curated$/m);
assert.match(deploymentJob, /^    needs: sign-curated$/m);
assert.doesNotMatch(sources["deploy.yml"], /^  environment-guard:$/m);
assert.doesNotMatch(sources["deploy.yml"], /^    environment:/m);
assert.doesNotMatch(
  sources["deploy.yml"],
  /docs-production|public-docs-cutover/,
  "deploy.yml: Team-private releases must not depend on unavailable reviewer environments",
);
assert.match(
  sources["deploy.yml"],
  /group: production-docs\n\s+cancel-in-progress: false/,
);
assert.match(
  sources["deploy.yml"],
  /Reverify the exact artifact immediately before deployment/,
);
assert.match(
  sources["deploy.yml"],
  /git status --porcelain > "\$RUNNER_TEMP\/git-status"/,
);
assert.doesNotMatch(
  sources["deploy.yml"],
  /test -z "\$\(git status --porcelain\)"/,
  "deploy.yml: command-substitution clean check can pass when git itself fails",
);

const publicVerificationJob = jobBlock(
  sources["deploy.yml"],
  "verify-public-boundary",
);
assert.match(publicVerificationJob, /^    needs: deploy-curated$/m);
assert.match(
  publicVerificationJob,
  /probe-deployment\.mjs/,
  "deploy.yml: the boundary job must execute the canonical production probe",
);
assert.doesNotMatch(
  publicVerificationJob,
  /^    if:/m,
  "deploy.yml: the production boundary probe must run after every deploy",
);
assert.doesNotMatch(
  publicVerificationJob,
  /continue-on-error:\s*true/,
  "deploy.yml: production boundary probe must not continue on error",
);

const completionJob = jobBlock(sources["deploy.yml"], "deployment-complete");
assert.match(
  completionJob,
  /^    needs: \[sign-curated, deploy-curated, verify-public-boundary\]$/m,
  "deploy.yml: deployment-complete must wait for signing, upload/reverification, and the live boundary probe",
);
assert.doesNotMatch(
  completionJob,
  /^    if:/m,
  "deploy.yml: deployment-complete must not use always() or run after a failed/skipped predecessor",
);
assert.doesNotMatch(
  completionJob,
  /continue-on-error:\s*true/,
  "deploy.yml: deployment-complete must not continue after a summary failure",
);
assert.match(
  completionJob,
  /GITHUB_STEP_SUMMARY/,
  "deploy.yml: deployment-complete must publish the terminal operator summary",
);
assert.match(
  completionJob,
  /needs\.deploy-curated\.outputs\.version_id/,
  "deploy.yml: deployment-complete must name the structured Cloudflare version ID",
);
const deployCandidateJob = jobBlock(sources["deploy.yml"], "deploy-curated");
assert.match(
  deployCandidateJob,
  /WRANGLER_OUTPUT_FILE_PATH/,
  "deploy.yml: deploy-curated must request Wrangler's structured deployment output",
);
assert.match(
  deployCandidateJob,
  /version_id/,
  "deploy.yml: deploy-curated must fail closed while extracting a nonempty Cloudflare version ID",
);

const ciVerifyJob = jobBlock(sources["ci.yml"], "verify");
assert.match(
  ciVerifyJob,
  /^    needs: receipt-guard$/m,
  "ci.yml: verify must depend on receipt-guard so invalid attestation stops expensive reexecution",
);
assert.doesNotMatch(
  ciVerifyJob,
  /^\s*- run: pnpm design:verify$/m,
  "ci.yml: design:verify must not run explicitly and again through pnpm lint",
);
assert.match(
  ciVerifyJob,
  /name: Lint and design verification \(single invocation\)[\s\S]*run: pnpm lint/,
  "ci.yml: the single pnpm lint invocation must remain visibly responsible for design:verify",
);
assert.match(
  ciVerifyJob,
  /name: ["']?Setup Node \(cache canary: no Actions cache\)["']?\n\s+if: vars\.SELF_HOSTED_PNPM_CACHE_CANARY == 'enabled' && runner\.name == vars\.SELF_HOSTED_PNPM_CACHE_CANARY_RUNNER\n\s+uses:/,
  "ci.yml: self-hosted cache removal must remain an explicitly enabled, runner-pinned canary with cached control as the default",
);
assert.match(
  ciVerifyJob,
  /name: ["']?Setup Node \(cached control\/default\)["']?\n\s+if: vars\.SELF_HOSTED_PNPM_CACHE_CANARY != 'enabled' \|\| runner\.name != vars\.SELF_HOSTED_PNPM_CACHE_CANARY_RUNNER\n\s+uses:[\s\S]{0,180}cache: pnpm/,
  "ci.yml: missing canary variables must retain setup-node's pnpm cache as the control/default",
);
assert.match(
  ciVerifyJob,
  /report-workflow-setup\.mjs/,
  "ci.yml: cache canary/control runs must retain structured setup and frozen-install measurements",
);

assert.equal(
  [...sources["release.yml"].matchAll(/id-token:\s*write/g)].length,
  1,
  "release.yml: npm OIDC must be scoped to publish only",
);
const versionJob = jobBlock(sources["release.yml"], "version-pr");
const publishJob = jobBlock(sources["release.yml"], "publish");
assert.match(versionJob, /^    needs: \[changes, quality-gate\]$/m);
// `publish` additionally needs `package-build`, because it publishes exactly that job's artifact.
// Pinning the list verbatim is the point: a `needs` quietly narrowed to `[changes]` would let npm
// OIDC run without validation ever having happened.
assert.match(
  publishJob,
  /^    needs: \[changes, quality-gate, package-build\]$/m,
  "release.yml: publish must depend on the quality gate AND the artifact it publishes",
);
assert.match(
  publishJob,
  /needs\.package-build\.result == 'success'/,
  "release.yml: publish must require package-build to have SUCCEEDED, not merely completed — a " +
    "skipped or failed dependency reads as neither in an `if:` without this",
);
// The quality gate itself must be gated on the receipt: validating the non-browser half while the
// browser half was never attested is the exact fail-open this topology has to avoid.
assert.match(
  jobBlock(sources["release.yml"], "quality-gate"),
  /^    needs: \[changes, receipt-guard\]$/m,
  "release.yml: quality-gate must depend on receipt-guard",
);
assert.doesNotMatch(sources["release.yml"], /^  environment-guard:$/m);
assert.doesNotMatch(sources["release.yml"], /^    environment:/m);
assert.doesNotMatch(
  sources["release.yml"],
  /npm-production/,
  "release.yml: trusted publishing must retain the proven repository + workflow identity",
);
assert.match(
  sources["release.yml"],
  /git status --porcelain > "\$RUNNER_TEMP\/git-status"/,
);
assert.doesNotMatch(
  sources["release.yml"],
  /test -z "\$\(git status --porcelain\)"/,
  "release.yml: command-substitution clean check can pass when git itself fails",
);
assert.match(sources["release.yml"], /npm install -g npm@11\.16\.0/);
assert.doesNotMatch(sources["release.yml"], /npm@latest/);

console.log("verify-workflow-security: passed");
