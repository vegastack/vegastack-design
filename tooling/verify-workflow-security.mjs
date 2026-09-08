import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

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
// SECOND RUNNER CLASS: the two LAN Debian boxes (`vsk-node-05`, `vsk-node-07`), enrolled by
// tooling/runner/provision-linux-runner.sh with the labels `self-hosted,linux,vsk-runner`. They
// exist for the one thing the minis cannot do: start a container and run a real browser. A job on
// them is still zero-billable — they are self-hosted hardware on the LAN.
//
// Membership is an ALLOWLIST, not a free choice, for the same reason the mac-mini rule is: a job
// silently moved onto the Linux boxes escapes the mini topology's assumptions, and a job silently
// moved OFF them loses the only lane that actually executes a browser in CI.
const LINUX_RUNNER = "[self-hosted, linux, vsk-runner]";
const LINUX_JOBS = {
  // Every job that EXECUTES a browser. Since WP2 that is the whole verification ladder: `pnpm verify`
  // on a pull request, before a publish, and — with `pnpm verify:release` after it — before a deploy.
  // The WP0 acceptance workflow (`verify-linux.yml`) was folded into `ci.yml`'s `verify` and deleted.
  "ci.yml": ["verify"],
  "release.yml": ["quality-gate"],
  "deploy.yml": ["verify"],
};
// A key naming a workflow that no longer exists would make its exception vanish silently, and the
// container ban would then read as enforced on a file nobody checks.
for (const name of Object.keys(LINUX_JOBS)) {
  assert.ok(
    discovered.includes(name),
    `LINUX_JOBS names ${name}, which is not in ${WORKFLOW_DIR} — remove the entry or restore the workflow`,
  );
}
//
// CI EXECUTES THE BROWSER LANES. It did not until 2026-09-08: under the local-first topology they ran
// only in `.husky/pre-push` and were ATTESTED by `.gates/receipt.json`, which a `receipt-guard` job in
// each workflow verified against the pushed tree. That existed because no free runner could launch a
// browser — the minis' Actions runner has no per-user Mach bootstrap namespace. The LAN Linux boxes
// can, inside the pinned image, so the receipt system and its guard jobs are deleted
// (docs/plans/2026-09-08-verification-rebuild.md, R1) and every LINUX_JOBS entry above runs
// `pnpm verify` for real. The minis still cannot launch a browser and no longer need to.
//
// NO JOB IS GITHUB-HOSTED. Every job runs on self-hosted hardware — the mac minis, plus the LAN
// Debian boxes for the LINUX_JOBS entries above — so a pull request, a release, and a deploy each
// cost zero billable minutes. Two release jobs and three deploy jobs used to be on ubuntu-latest;
// all moved, and none of the moves lost a property that actually existed:
//
//   release.yml publish — publishes token-free over npm OIDC TRUSTED PUBLISHING, which works on
//     self-hosted runners (sibling repo vegastack/vegafactory publishes the same way). Only the
//     provenance BUNDLE requires a GitHub-hosted runner (npm rejects a self-hosted one with E422), so
//     publish calls `npm publish --no-provenance`. Auth is unchanged: the
//     repository + release.yml trusted-publisher identity, and NO NPM_TOKEN (the rule below forbids one).
//   deploy.yml build-sign-deploy — builds the docs, Sigstore-signs the manifest (the only OIDC use;
//     signer identity is the workflow ref, not the runner, so cosign verification is unaffected), and
//     deploys to Cloudflare. Build+sign+deploy were three isolated jobs handing docs over as artifacts;
//     Actions artifact storage is unavailable under the billing lock, so they are merged into one job.
//   deploy.yml verify-public-boundary — the proof needs an OUTSIDE-the-network origin, so the minis
//     must not be enrolled in Cloudflare Access device posture / WARP. Fail-safe if they were: an
//     authenticated "anonymous" /r/* request returns 200 and the probe fails the deploy loudly.
//
// A job moved back onto ubuntu-latest silently reintroduces billed capacity; the empty allowlists
// below reject that in both directions (see verify-workflow-security-negative.mjs).
const GITHUB_HOSTED_JOBS = {
  "ci.yml": [],
  "release.yml": [],
  "deploy.yml": [],
};

/**
 * Every workflow that gates an outward step must EXECUTE the browser lanes, not attest them.
 *
 * This replaces the `receipt-guard` presence-and-wiring assertions. Requiring a named job to exist
 * was the right shape while a receipt was the only evidence a push carried; the evidence is now the
 * run itself, so what has to be asserted is that a browser-capable job actually invokes
 * `pnpm verify` — a workflow that quietly stopped would otherwise validate nothing and call it a pass.
 */
const MUST_RUN_VERIFY = ["ci.yml", "release.yml", "deploy.yml"];

/**
 * Job name → its parsed job mapping, for one workflow.
 *
 * STRUCTURAL, not regex-over-text, and that distinction is the whole point. The previous
 * implementation walked lines and only recognised a job whose key sat at exactly two spaces of
 * indentation followed by a newline — so a FLOW-STYLE job
 * (`hidden: {runs-on: ubuntu-latest, container: "node:24", steps: [{run: echo bypass}]}`) was not a
 * job as far as this gate was concerned. It ran on billed capacity, in a banned container, and both
 * the gate and its negative harness reported clean. YAML has one meaning; the parser is the only
 * thing that knows it.
 */
function workflowJobs(name, source) {
  let document;
  try {
    document = parseYaml(source);
  } catch (error) {
    assert.fail(`${name}: is not parseable YAML — ${error.message}`);
  }
  assert.ok(
    document && typeof document === "object" && !Array.isArray(document),
    `${name}: top level is not a YAML mapping`,
  );
  const jobs = document.jobs;
  assert.ok(
    jobs && typeof jobs === "object" && !Array.isArray(jobs),
    `${name}: has no top-level \`jobs\` mapping`,
  );
  for (const [job, body] of Object.entries(jobs)) {
    assert.ok(
      body && typeof body === "object" && !Array.isArray(body),
      `${name}: job ${job} is not a mapping`,
    );
  }
  return { document, jobs: new Map(Object.entries(jobs)) };
}

/** Render a parsed `runs-on` the way the workflow files write it, for readable failures. */
function formatRunner(value) {
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/**
 * The container image a job declares, or `undefined` when it declares no container. Both the
 * shorthand (`container: img`) and the mapping (`container: {image: img}`) forms are recognised; a
 * mapping with no `image` yields `null`, which the caller rejects rather than skipping.
 */
function containerImage(job) {
  const container = job.container;
  if (container === undefined || container === null) return undefined;
  if (typeof container === "string") return container;
  if (typeof container === "object" && !Array.isArray(container))
    return typeof container.image === "string" ? container.image : null;
  return null;
}

/**
 * An Actions expression with the `${{ }}` wrapper and incidental whitespace normalised away, so an
 * `if:` written either way compares equal.
 */
function normalizeExpression(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\$\{\{/g, " ")
    .replace(/\}\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// This repository is PUBLIC and the Linux boxes are on the LAN with a persistent pnpm store that
// survives every job. A `pull_request` from a fork would execute attacker-authored code there —
// poisoning the store, reading the host, and holding a foothold on the network. GitHub's
// "require approval for outside collaborators" setting is defence in depth but is a repo SETTING,
// invisible to this tree; this condition is the part that lives in code.
const FORK_GUARD =
  "github.event.pull_request.head.repo.full_name == github.repository";

/**
 * Every step of one job, as parsed YAML.
 *
 * STRUCTURAL, for the same reason `workflowJobs` is. The three checks that walk steps — action
 * SHA-pinning, `persist-credentials: false` on checkout, and `${{ }}` interpolated into a `run:`
 * body — all used to read the raw text: `uses:` was matched by a line regex, checkout steps were
 * carved out by an indentation-based `stepBlocks()`, and run bodies were reassembled by
 * `runScriptLines()`. All three were blind to flow style, so
 * `steps: [{uses: "evil/backdoor@main"}]`, a flow-style checkout with no `persist-credentials`, and
 * `steps: [{run: "echo ${{ github.event.pull_request.title }}"}]` each passed the gate untouched.
 * YAML has one meaning; the parser is the only thing that knows it.
 */
function jobSteps(workflow, job, body) {
  const steps = body.steps;
  if (steps === undefined) return [];
  assert.ok(
    Array.isArray(steps),
    `${workflow}: job ${job} has a \`steps\` key that is not a list`,
  );
  return steps.map((step, index) => {
    assert.ok(
      step && typeof step === "object" && !Array.isArray(step),
      `${workflow}: job ${job} step ${index} is not a mapping`,
    );
    return {
      step,
      label: `job ${job} step ${index}${step.name ? ` (${step.name})` : ""}`,
    };
  });
}

/**
 * `with:` of a step as a mapping, or an empty mapping when it declares none — so an ABSENT `with:`
 * and an absent key inside it fail the same way rather than being skipped.
 */
function stepWith(workflow, label, step) {
  const value = step.with;
  if (value === undefined || value === null) return {};
  assert.ok(
    typeof value === "object" && !Array.isArray(value),
    `${workflow}: ${label} has a \`with\` that is not a mapping`,
  );
  return value;
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

/**
 * The `playwright` version pnpm actually installs, read from the lockfile rather than hardcoded —
 * a hardcoded copy would let this gate agree with itself while disagreeing with the tree.
 *
 * EVERY occurrence is read, not the first. A pnpm lockfile names each package twice — once under
 * `packages:` and once under `snapshots:` — and would name it more than twice if two versions were
 * resolved for different importers. Taking `.exec()`'s first match silently picked whichever came
 * first in the file and pinned the container to it, so a tree that installs two Playwright versions
 * would have had one of them running against the other's browsers. They must agree, and a
 * disagreement is a failure with both versions named, not a coin flip.
 */
function lockfilePlaywrightVersion() {
  // Resolved from THIS FILE, not the cwd: the workflow directory is read cwd-relative on purpose so
  // verify-workflow-security-negative.mjs can point the gate at a mutated copy, and a cwd-relative
  // lockfile read would make every one of those mutation cases die on ENOENT instead of testing
  // anything.
  const lock = readFileSync(
    fileURLToPath(new URL("../pnpm-lock.yaml", import.meta.url)),
    "utf8",
  );
  const versions = [...lock.matchAll(/^ {2}playwright@([^\s:]+):$/gm)].map(
    (match) => match[1],
  );
  assert.ok(
    versions.length > 0,
    "pnpm-lock.yaml: could not find the resolved `playwright` package version — the lockfile " +
      "changed shape, so the container-image pin below would silently stop being checked",
  );
  const distinct = [...new Set(versions)];
  assert.equal(
    distinct.length,
    1,
    `pnpm-lock.yaml resolves ${distinct.length} different \`playwright\` versions (${distinct.join(", ")}). ` +
      `The container image can only pin one, so one lane would run against the wrong browsers. ` +
      `Dedupe the lockfile before pinning.`,
  );
  assert.match(
    distinct[0],
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/,
    `pnpm-lock.yaml: \`playwright@${distinct[0]}\` is not a plain version — the container tag is built from it`,
  );
  return distinct[0];
}

const PLAYWRIGHT_VERSION = lockfilePlaywrightVersion();
const PLAYWRIGHT_IMAGE = `mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble`;

for (const [name, source] of Object.entries(sources)) {
  assert.doesNotMatch(
    source,
    /\bTURBO_TOKEN\b|\bTURBO_TEAM\b/,
    `${name}: remote-cache credentials must not be workflow-wide`,
  );
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
  //
  // ONE NARROW EXCEPTION, added with the Linux runners: a job in LINUX_JOBS may declare a container,
  // and only the pinned Playwright image whose version matches pnpm-lock.yaml. That is the entire
  // reason those boxes exist. Everywhere else the ban stands unchanged, and
  // tooling/verify-workflow-security-negative.mjs proves both halves by mutation.
  const linuxJobs = new Set(LINUX_JOBS[name] ?? []);
  const { jobs } = workflowJobs(name, source);
  assert.ok(
    jobs.size > 0,
    `${name}: no jobs found — the parser or the file changed shape`,
  );

  // ---------------------------------------------------------------- per-step rules, structurally
  for (const [job, body] of jobs) {
    // A job may call a reusable workflow instead of declaring steps; that reference is an action
    // reference too and must be pinned the same way.
    if (typeof body.uses === "string") {
      assert.match(
        body.uses,
        /@[0-9a-f]{40}$/,
        `${name}: job ${job} calls a reusable workflow that is not pinned to a full commit SHA: ${body.uses}`,
      );
    }
    for (const { step, label } of jobSteps(name, job, body)) {
      if (step.uses !== undefined) {
        assert.equal(
          typeof step.uses,
          "string",
          `${name}: ${label} has a \`uses\` that is not a string`,
        );
        assert.match(
          step.uses,
          /@[0-9a-f]{40}$/,
          `${name}: action is not pinned to a full commit SHA: ${step.uses} (${label})`,
        );
        // A checkout that persists its token leaves the workflow's credential in .git/config for
        // every later step — including any that runs repository-authored code.
        if (/^actions\/checkout@/.test(step.uses)) {
          assert.equal(
            stepWith(name, label, step)["persist-credentials"],
            false,
            `${name}: checkout persists a token (${label})`,
          );
        }
      }
      // Script injection: a `${{ … }}` expression inside a `run:` body is substituted as raw text
      // BEFORE bash parses the line, so any shell metacharacter in an attacker-influenced value
      // executes. Pass such values through `env:` and reference them as "$VAR" instead.
      // Only `run:` BODIES are scanned — `if:`/`env:`/`with:` expressions are evaluated by Actions
      // itself, never by a shell, and are legitimate.
      if (step.run !== undefined) {
        assert.equal(
          typeof step.run,
          "string",
          `${name}: ${label} has a \`run\` that is not a string`,
        );
        const expression = /\$\{\{\s*([^}]+?)\s*\}\}/.exec(step.run);
        assert.ok(
          !expression,
          `${name}: \`\${{ ${expression?.[1]} }}\` is interpolated directly into a run: script ` +
            `(${label}) — pass it via env: and reference "$VAR" (shell-injection risk)`,
        );
      }
    }
  }

  for (const [job, body] of jobs) {
    const image = containerImage(body);
    if (image === undefined) continue;
    assert.ok(
      linuxJobs.has(job),
      `${name}: job ${job} declares a container but is not in LINUX_JOBS. Containers are Linux-only ` +
        `and cannot start on the self-hosted macOS minis at all; only a job on ${LINUX_RUNNER} may ` +
        `declare one.`,
    );
    assert.equal(
      image,
      PLAYWRIGHT_IMAGE,
      `${name}: job ${job} runs container image ${image ?? "(none declared)"}; the only sanctioned ` +
        `image is ${PLAYWRIGHT_IMAGE}, whose version is read from pnpm-lock.yaml. A container whose ` +
        `bundled browsers do not match the installed Playwright reports failures that are not defects.`,
    );
  }

  for (const job of linuxJobs) {
    const body = jobs.get(job);
    assert.ok(body, `${name}: LINUX_JOBS lists ${job}, which no longer exists`);

    // The container is REQUIRED, not merely permitted. Allowing it without requiring it made the
    // exception one-directional: deleting the `container:` block left the job running bare on the
    // host, where the browsers are whatever the box happens to have — the exact "failures that are
    // not defects" this pin exists to prevent — and every assertion still passed.
    const image = containerImage(body);
    assert.equal(
      image,
      PLAYWRIGHT_IMAGE,
      `${name}: job ${job} is a LAN Linux browser job and must declare the pinned Playwright ` +
        `container ${PLAYWRIGHT_IMAGE}; it declares ${image === undefined ? "no container at all" : (image ?? "a container with no image")}. ` +
        `Bare on the host it would run whatever browsers the box has.`,
    );

    // A container's default shell is `sh`. `set -o pipefail` — which every hardened run body here
    // uses — is a bashism, so without a bash default the job dies on "Illegal option -o pipefail"
    // and reads as a repository failure. This exact assertion existed before, guarding the old
    // Playwright container, and was deleted with it; the first Linux proof run reproduced the
    // failure within minutes.
    assert.equal(
      body.defaults?.run?.shell,
      "bash",
      `${name}: job ${job} runs in a container without \`defaults.run.shell: bash\`. The container's ` +
        `default shell is sh, so \`set -o pipefail\` fails with "Illegal option -o pipefail".`,
    );
  }

  // ---------------------------------------------------------------- the fork guard, on EVERY job
  //
  // Only for a workflow a fork can actually trigger. `release.yml` fires on `push` to main and
  // `deploy.yml` on `workflow_dispatch` from a ref `ref-guard` pins to main; neither can carry
  // fork-authored code, and an `if:` that is always false on the only events a workflow receives is
  // not a gate, it is a job that never runs.
  //
  // It applies to every job, not only the Linux ones. The mac minis are LAN hardware with a
  // persistent workspace for the same reasons the Debian boxes are, and until this rewrite they
  // carried no guard at all — a fork PR executed on them on every push.
  //
  // EXACT EQUALITY, not `.includes()`. A substring test is not a guard: an `if:` reading
  // `<the guard> || true`, or `!(<the guard>) || true`, CONTAINS the guard verbatim and evaluates to
  // true for every fork PR — the condition would have been documented, asserted, and inert. Only the
  // `${{ }}` wrapper and incidental whitespace are normalised away; any other addition is a
  // deliberate widening and must be re-reviewed here rather than slipped in beside it.
  if (/^\s*pull_request\s*:/m.test(source)) {
    for (const [job, body] of jobs) {
      assert.equal(
        normalizeExpression(body.if),
        FORK_GUARD,
        `${name}: job ${job} runs on a fork-triggerable workflow but its \`if:\` is not exactly the ` +
          `fork guard. Expected \`${FORK_GUARD}\`, got \`${normalizeExpression(body.if) || "(no if:)"}\`. ` +
          `This repository is public, and a fork PR would otherwise execute untrusted code on LAN ` +
          `hardware with a persistent pnpm store.`,
      );
    }
  }

  const allowed = new Set(GITHUB_HOSTED_JOBS[name] ?? []);
  const runners = new Map(
    [...jobs].map(([job, body]) => [job, body["runs-on"]]),
  );

  // The one command must actually be invoked, and on a machine that can run it.
  if (MUST_RUN_VERIFY.includes(name)) {
    const invocations = [...jobs]
      .filter(([job, body]) =>
        jobSteps(name, job, body).some(
          ({ step }) =>
            typeof step.run === "string" &&
            /^\s*pnpm verify\s*$/m.test(step.run),
        ),
      )
      .map(([job]) => job);
    assert.ok(
      invocations.length > 0,
      `${name}: no job runs \`pnpm verify\`. That command IS the verification — typecheck, lint, ` +
        `design:verify, and the @vegastack/ui browser suite — so a workflow without it validates ` +
        `nothing and reports that as a pass.`,
    );
    // …and in a LINUX_JOBS job. `pnpm verify` on a mini dies on the Chromium launch, so a `verify`
    // that drifted onto one is a broken gate rather than a moved one.
    assert.ok(
      invocations.some((job) => linuxJobs.has(job)),
      `${name}: \`pnpm verify\` runs only in ${invocations.join(", ")}, none of which is a LINUX_JOBS ` +
        `entry. The mac minis cannot launch a browser, so the suite would fail there for a reason ` +
        `that is not a defect.`,
    );
  }

  for (const [job, value] of runners) {
    assert.ok(
      value !== undefined && value !== null,
      `${name}: job ${job} declares no \`runs-on\`; a job without one would skip the runner allowlist`,
    );
    const runner = formatRunner(value);
    if (allowed.has(job)) {
      assert.equal(
        runner,
        "ubuntu-latest",
        `${name}: job ${job} is recorded as GitHub-hosted but runs on ${runner}`,
      );
      continue;
    }
    if (linuxJobs.has(job)) {
      assert.equal(
        runner,
        LINUX_RUNNER,
        `${name}: job ${job} is recorded as a LAN Linux job but runs on ${runner}`,
      );
      continue;
    }
    assert.equal(
      runner,
      SELF_HOSTED,
      `${name}: job ${job} must run on ${SELF_HOSTED}; add it to GITHUB_HOSTED_JOBS or LINUX_JOBS with a recorded reason if that is deliberate`,
    );
  }
  for (const job of allowed) {
    assert.ok(
      runners.has(job),
      `${name}: GITHUB_HOSTED_JOBS lists ${job}, which no longer exists`,
    );
  }
  for (const job of linuxJobs) {
    assert.ok(
      runners.has(job),
      `${name}: LINUX_JOBS lists ${job}, which no longer exists`,
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
}

for (const [name, source] of Object.entries(sources)) {
  // deploy.yml mints OIDC for Sigstore (sign-curated); release.yml mints OIDC for npm trusted
  // publishing (publish). Both work on self-hosted runners. ci.yml must mint none.
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
  "deploy.yml: OIDC must be scoped to the single build-sign-deploy job only",
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
// build → sign → deploy are one job (`build-sign-deploy`): Actions artifact storage is unavailable
// under the billing lock, so the built docs cannot be handed between separate jobs. It carries the
// single OIDC token and runs after the receipt guard.
const buildSignDeployJob = jobBlock(sources["deploy.yml"], "build-sign-deploy");
// The deploy cannot start until the full sweep has RUN. `main` has no branch protection and `ci.yml`
// fires only on `pull_request`, so without this edge a direct push to main could reach production
// having executed no browser assertion at all.
assert.match(
  buildSignDeployJob,
  /^    needs: verify$/m,
  "deploy.yml: build-sign-deploy must depend on the `verify` job",
);
{
  const verifyJob = jobBlock(sources["deploy.yml"], "verify");
  assert.match(
    verifyJob,
    /^      - run: pnpm verify$/m,
    "deploy.yml: the verify job must run `pnpm verify`",
  );
  assert.match(
    verifyJob,
    /^      - run: pnpm verify:release$/m,
    "deploy.yml: the verify job must run `pnpm verify:release` — the docs export, links, metadata, " +
      "registry idempotency, the consume round-trip, and the three-engine suite run nowhere else",
  );
}
assert.match(
  buildSignDeployJob,
  /id-token: write/,
  "deploy.yml: build-sign-deploy must carry the OIDC token for Sigstore signing",
);
assert.match(
  buildSignDeployJob,
  /command: deploy/,
  "deploy.yml: build-sign-deploy must run the Cloudflare deploy",
);
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
assert.match(publicVerificationJob, /^    needs: build-sign-deploy$/m);
assert.match(
  publicVerificationJob,
  /probe-deployment\.mjs/,
  "deploy.yml: the boundary job must execute the canonical production probe",
);
assert.equal(
  workflowJobs("deploy.yml", sources["deploy.yml"]).jobs.get(
    "verify-public-boundary",
  ).if,
  undefined,
  "deploy.yml: the production boundary probe must run after every deploy",
);

// release.yml mints exactly one OIDC token, for npm trusted publishing in `publish`.
assert.equal(
  [...sources["release.yml"].matchAll(/id-token:\s*write/g)].length,
  1,
  "release.yml: npm OIDC must be scoped to publish only",
);
const versionJob = jobBlock(sources["release.yml"], "version-pr");
const publishJob = jobBlock(sources["release.yml"], "publish");
assert.match(versionJob, /^    needs: \[changes, quality-gate\]$/m);
// Publishing is token-free trusted publishing. An NPM_TOKEN reintroduces a long-lived credential the
// proven OIDC flow does not need — forbid it anywhere in the workflow.
assert.doesNotMatch(
  sources["release.yml"],
  /secrets\.NPM_TOKEN|NODE_AUTH_TOKEN/,
  "release.yml: publishing is token-free OIDC trusted publishing — no NPM_TOKEN/NODE_AUTH_TOKEN",
);
// Provenance MUST be disabled with the explicit --no-provenance FLAG. npm can only verify a provenance
// bundle from a GitHub-hosted runner and rejects a self-hosted one (E422), and the NPM_CONFIG_PROVENANCE
// env is not honoured by the changesets action's OIDC path — so publishing calls npm publish directly
// with the flag (as vegastack/vegafactory does).
assert.match(
  publishJob,
  /npm publish[^\n]*--no-provenance/,
  "release.yml: publish must call `npm publish --no-provenance` — self-hosted runners cannot generate a provenance bundle",
);
// `publish` must depend on the quality gate. Pinning the list verbatim is the point: a `needs`
// quietly narrowed to `[changes]` would let the publish run without validation ever having happened.
// (There is no separate build job: Actions artifact storage is unavailable under the billing lock, so
// `publish` builds the two public packages in-job; the token-free OIDC flow needs no artifact
// isolation.)
assert.match(
  publishJob,
  /^    needs: \[changes, quality-gate\]$/m,
  "release.yml: publish must depend on [changes, quality-gate]",
);
assert.match(
  publishJob,
  /needs\.quality-gate\.result == 'success'/,
  "release.yml: publish must require quality-gate to have SUCCEEDED, not merely completed — a " +
    "skipped or failed dependency reads as neither in an `if:` without this",
);
// The quality gate itself must be gated on the receipt: validating the non-browser half while the
// browser half was never attested is the exact fail-open this topology has to avoid.
// `quality-gate` is now the verification itself rather than a job gated behind an attestation, so
// what has to hold is that it EXECUTES the one command. (That it does so on a browser-capable runner
// is asserted by MUST_RUN_VERIFY above.)
assert.match(
  jobBlock(sources["release.yml"], "quality-gate"),
  /^      - run: pnpm verify$/m,
  "release.yml: quality-gate must run `pnpm verify` — it is the only verification in the release chain",
);
assert.doesNotMatch(sources["release.yml"], /^  environment-guard:$/m);
assert.doesNotMatch(sources["release.yml"], /^    environment:/m);
assert.doesNotMatch(
  sources["release.yml"],
  /npm-production/,
  "release.yml: publishing must not depend on a reviewer-gated GitHub environment (unavailable on this plan)",
);
// The registry-build idempotency check moved out of release.yml with the rest of `quality-gate`'s
// hand-assembled step list: `pnpm verify` does not build the registry, and `pnpm verify:release` —
// which does, and asserts the tree afterwards through tooling/assert-clean-tree.mjs — runs in
// deploy.yml. The fragile command-substitution form must still never come back anywhere.
assert.doesNotMatch(
  sources["release.yml"],
  /test -z "\$\(git status --porcelain\)"/,
  "release.yml: command-substitution clean check can pass when git itself fails",
);
assert.match(sources["release.yml"], /npm install -g npm@11\.16\.0/);
assert.doesNotMatch(sources["release.yml"], /npm@latest/);

// ---------------------------------------------------------------------------------------------
// THE PLAYWRIGHT TAG HAS EXACTLY ONE AUTHORITY: pnpm-lock.yaml.
//
// The gate derives the sanctioned image from the lockfile, but the provisioning script and its
// runbook each carried their OWN literal `mcr.microsoft.com/playwright:v1.61.0-noble`. Nothing
// compared them, so a Playwright bump would have moved the workflow (checked) while the box
// pre-pulled and the runbook documented a stale image — the exact "browsers do not match the
// installed Playwright" failure the pin exists to prevent, arriving as a mystery on the hardware.
// The script now derives the tag from the lockfile or requires it to be passed in, and this
// assertion keeps a literal from creeping back into either surface.
//
// The workflow files are deliberately NOT covered: a literal there is REQUIRED (Actions cannot read
// a lockfile) and is checked against pnpm-lock.yaml above, which is what makes it safe.
{
  const scanned = [
    fileURLToPath(new URL("runner", import.meta.url)),
    fileURLToPath(new URL("../docs/runbooks", import.meta.url)),
  ];
  const literalTag = /playwright:v\d/;
  for (const directory of scanned) {
    const entries = readdirSync(directory, {
      recursive: true,
      withFileTypes: true,
    });
    const files = entries.filter((entry) => entry.isFile());
    assert.ok(
      files.length > 0,
      `${directory}: no files found — this assertion would silently check nothing`,
    );
    for (const entry of files) {
      const path = join(entry.parentPath ?? entry.path, entry.name);
      const contents = readFileSync(path, "utf8");
      const offending = contents
        .split("\n")
        .map((text, index) => ({ text, line: index + 1 }))
        .filter(({ text }) => literalTag.test(text));
      assert.equal(
        offending.length,
        0,
        `${path}:${offending[0]?.line}: hardcoded Playwright image tag — ` +
          `\`${offending[0]?.text.trim()}\`. The tag has one authority (the \`playwright\` version in ` +
          `pnpm-lock.yaml); a second copy here drifts silently on the next bump. Derive it, or accept ` +
          `it as --playwright-version / $PLAYWRIGHT_VERSION.`,
      );
    }
  }
}

console.log("verify-workflow-security: passed");
