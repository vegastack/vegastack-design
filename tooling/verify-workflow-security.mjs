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
const PLAYWRIGHT_IMAGE =
  "mcr.microsoft.com/playwright:v1.61.0-noble@sha256:57b65fdc9ceabe0ef613124c7bbe2babcf9362c4d85e382fe3b03604e84b428a";

// The self-hosted runners are macOS. `runs-on` is an allowlist, not a free choice: a job moved onto
// GitHub-hosted infrastructure without a recorded reason silently reintroduces the billed capacity
// this repository deliberately left, and a job moved OFF ubuntu-latest can break publishing or void
// a boundary proof. Every entry below states why it is where it is.
const SELF_HOSTED = "[self-hosted, vsk-runners-mac-mini]";
//
// BROWSER LANES ARE GITHUB-HOSTED, AND THAT IS A HOST BUG, NOT A PREFERENCE.
// The mac minis cannot launch Chromium: their Actions runner has no per-user Mach bootstrap
// namespace, so every launch dies with `bootstrap_look_up
// org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP.
// Reproduced deterministically on both minis across all retries in run 30131471680, while the same
// suite passes locally on the same OS and CPU. The fix is on the host — reinstall the runner as a
// LaunchAgent inside a logged-in session rather than a LaunchDaemon. When that lands, move
// `verify`, `contracts`, `contracts-gate` (both workflows), and `quality-gate` back to SELF_HOSTED
// and delete this paragraph. Nothing in the repository needs to change.
//
const GITHUB_HOSTED_JOBS = {
  // Both drive real browsers — Vitest browser mode plus the cross-engine smoke in `verify`, and
  // Playwright in `contracts`.
  "ci.yml": ["verify", "contracts"],
  // publish: npm trusted publishing does not support self-hosted runners, and this repository holds
  // no NPM_TOKEN — moving it breaks publishing outright. contracts-gate + quality-gate: browsers.
  "release.yml": ["contracts-gate", "quality-gate", "publish"],
  // contracts-gate: browsers. sign-curated: the only OIDC job; self-hosted Sigstore behaviour is
  // unverified, ~30s, no repository code. deploy-curated: credential-only, third-party actions,
  // nothing to gain. The three boundary jobs must originate OUTSIDE VegaStack's network — a runner
  // inside it can be silently authenticated by Cloudflare device posture, which would void an
  // anonymous-rejection proof rather than merely risk it.
  "deploy.yml": [
    "contracts-gate",
    "sign-curated",
    "deploy-curated",
    "pre-cutover-purge",
    "verify-protected-boundary",
    "verify-public-boundary",
  ],
};

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

function containerImages(source) {
  const lines = source.split("\n");
  const images = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)container:\s*(\S+)?\s*$/.exec(lines[i]);
    if (!match) continue;
    if (match[2]) {
      images.push(match[2]);
      continue;
    }
    const indent = match[1].length;
    let image;
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].trim()) continue;
      const childIndent = lines[j].length - lines[j].trimStart().length;
      if (childIndent <= indent) break;
      const imageMatch = /^\s*image:\s*(\S+)\s*$/.exec(lines[j]);
      if (imageMatch) image = imageMatch[1];
    }
    assert.ok(image, "container mapping is missing image");
    images.push(image);
  }
  return images;
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
  // Job containers are Linux-only, so a `container:` on a self-hosted (macOS) job is not a
  // portability warning — the job cannot start at all. On a GitHub-hosted Linux job a container is
  // legitimate and sometimes REQUIRED for render determinism, but it must stay digest-pinned:
  // `release.yml`'s `quality-gate` runs the three-engine suite in the pinned Playwright image
  // because bare `ubuntu-latest` WebKit could not settle the Toaster contrast check.
  for (const containerImage of containerImages(source)) {
    assert.equal(
      containerImage,
      PLAYWRIGHT_IMAGE,
      `${name}: container image is not the digest-pinned Playwright image`,
    );
  }

  const allowed = new Set(GITHUB_HOSTED_JOBS[name] ?? []);
  const runners = jobRunners(source);
  assert.ok(runners.size > 0, `${name}: no jobs found — the parser or the file changed shape`);
  // A container on a self-hosted job cannot start. Check it job-by-job, not file-by-file.
  for (const job of containerJobs(source))
    assert.ok(
      allowed.has(job),
      `${name}: job ${job} is self-hosted and declares a container — job containers are Linux-only and cannot start on the macOS runners`,
    );

  // A CONTAINER job's default shell is `sh` (dash), not bash. A bash-only construct there fails at
  // parse time with a message that looks nothing like its cause: `set -euo pipefail` died with
  // "Illegal option -o pipefail" and exit 2, which the surrounding step reported as registry drift
  // (run 30142154420). Require the step to ask for bash explicitly.
  for (const job of containerJobs(source)) {
    const block = jobBlock(source, job);
    for (const step of stepBlocks(block)) {
      if (!/^\s*-?\s*run:/m.test(step)) continue;
      const bashism = /set -[a-z]*o pipefail|\[\[|<<<|\$\(\(|\bmapfile\b|\bshopt\b/.exec(step);
      if (!bashism) continue;
      assert.match(
        step,
        /^\s+shell: bash$/m,
        `${name}: job ${job} runs in a container and uses the bash-only construct \`${bashism[0]}\` ` +
          `without \`shell: bash\` — the container default is sh (dash) and this fails at parse time`,
      );
    }
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
assert.match(
  sources["deploy.yml"],
  /CUTOVER_PHASE: \$\{\{ inputs\.cutover_phase \}\}/,
);
assert.match(
  sources["deploy.yml"],
  /CUTOVER_STATE: \$\{\{ vars\.PUBLIC_DOCS_CUTOVER \}\}/,
);
assert.match(sources["deploy.yml"], /CUTOVER_PHASE" = "prepare"/);
assert.match(sources["deploy.yml"], /CUTOVER_STATE" = "complete"/);
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

const preCutoverJob = jobBlock(sources["deploy.yml"], "pre-cutover-purge");
const protectedVerificationJob = jobBlock(
  sources["deploy.yml"],
  "verify-protected-boundary",
);
const publicVerificationJob = jobBlock(
  sources["deploy.yml"],
  "verify-public-boundary",
);
assert.match(preCutoverJob, /^    needs: deploy-curated$/m);
assert.match(protectedVerificationJob, /^    needs: deploy-curated$/m);
assert.match(publicVerificationJob, /^    needs: deploy-curated$/m);

// The one-time purge asserts `/` is NOT 200; the public probe asserts it IS. They must be separate
// dispatch phases so an operator can remove root SSO between them without a GitHub Environment.
assert.match(
  preCutoverJob,
  /^    if: inputs\.cutover_phase == 'prepare' && vars\.PUBLIC_DOCS_CUTOVER != 'complete'$/m,
  "deploy.yml: purge must require the prepare phase and an incomplete cutover",
);
assert.match(
  sources["deploy.yml"],
  /cutover_phase:\n\s{8}description:[\s\S]{0,400}?\n\s{8}type: choice\n\s{8}options:\n\s{10}- ordinary\n\s{10}- prepare\n\s{10}- verify\n\s{8}default: ordinary/,
  "deploy.yml: cutover_phase must expose ordinary/prepare/verify and default to ordinary",
);
assert.doesNotMatch(
  publicVerificationJob,
  /pre-cutover-purge/,
  "deploy.yml: public verification must be a later dispatch, not chained to prepare",
);
assert.match(protectedVerificationJob, /inputs\.cutover_phase == 'ordinary'/);
assert.match(
  protectedVerificationJob,
  /vars\.PUBLIC_DOCS_CUTOVER != 'complete'/,
);
assert.match(protectedVerificationJob, /probe-precutover-protection\.mjs/);
assert.match(publicVerificationJob, /inputs\.cutover_phase == 'verify'/);
assert.match(publicVerificationJob, /inputs\.cutover_phase == 'ordinary'/);
assert.match(publicVerificationJob, /vars\.PUBLIC_DOCS_CUTOVER == 'complete'/);
assert.match(publicVerificationJob, /probe-deployment\.mjs/);

assert.equal(
  [...sources["release.yml"].matchAll(/id-token:\s*write/g)].length,
  1,
  "release.yml: npm OIDC must be scoped to publish only",
);
const versionJob = jobBlock(sources["release.yml"], "version-pr");
const publishJob = jobBlock(sources["release.yml"], "publish");
assert.match(versionJob, /^    needs: \[changes, quality-gate\]$/m);
assert.match(publishJob, /^    needs: \[changes, quality-gate\]$/m);
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
