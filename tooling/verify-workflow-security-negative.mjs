#!/usr/bin/env node
// Prove tooling/verify-workflow-security.mjs actually rejects the things it claims to.
//
// WHY THIS EXISTS
//   That gate is a wall of assertions over YAML text. Assertions over text rot silently: a renamed
//   job, a restructured block, or a regex that no longer matches anything all leave the assertion
//   PASSING while it checks nothing. This repository already keeps
//   `verify-design-lint-structural.mjs` and `verify-registry-integrity-negative.mjs` for the same
//   reason — a gate never observed failing is an assumption.
//
//   It matters more now than it did. The container ban replaced two assertions that had become dead
//   (a digest-pin check and a `shell: bash` check, both guarding a container that no longer exists),
//   and the runner allowlist is the only thing preventing a job from silently moving back onto billed
//   capacity. Both are asserted here by mutation.
//
//   The ban is now CONDITIONAL — a job in LINUX_JOBS may run the pinned Playwright container on the
//   LAN Debian boxes — which makes mutation coverage load-bearing rather than merely prudent: a
//   conditional exception is exactly the shape that quietly widens into a hole. Cases below pin it
//   shut from every side (wrong image, arbitrary image, the container REMOVED, un-allowlisted job on
//   the Linux label, allowlisted job moved off it, and the fork guard removed).
//
//   One case is not a mutation of policy but of SHAPE: a flow-style job. Regex-over-text discovery
//   recognised only `  name:` at exactly two spaces followed by a newline, so a job written inline in
//   flow style was invisible to the gate AND to this harness — both reported clean while it ran on
//   billed capacity in a banned container. The gate now parses with the `yaml` package; this case is
//   the proof, and it PASSES the pre-fix gate.
//
// HOW
//   Each case copies the real workflows into a scratch directory, applies one mutation, and runs the
//   gate with that directory as its cwd — the gate reads `.github/workflows` relative to cwd, so no
//   change to it was needed for testability. A mutation that fails to apply is reported as a harness
//   bug rather than a pass, because "the pattern was absent" and "the gate accepted it" look
//   identical from the exit code alone.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ROOT } from "./lib/change-set.mjs";

const GATE = join(ROOT, "tooling/verify-workflow-security.mjs");
const WORKFLOWS = join(ROOT, ".github/workflows");

/** Sanity: the gate must PASS on the real workflows, or every rejection below proves nothing. */
{
  const clean = spawnSync("node", [GATE], { cwd: ROOT, encoding: "utf8" });
  assert.equal(
    clean.status,
    0,
    `the gate must pass on the real workflows before mutations mean anything:\n${clean.stderr}`,
  );
}

const CASES = [
  {
    id: "container on a mac-mini job",
    file: "ci.yml",
    find: "  verify:\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n",
    replace:
      "  verify:\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n    container: node:24\n",
    expect: /declares a container but is not in LINUX_JOBS/,
  },
  {
    // FLOW STYLE. The gate used to discover jobs by walking lines for a `  name:` key at exactly two
    // spaces of indentation — so this job, which YAML says is an ordinary job on billed capacity in a
    // banned container running an arbitrary command, was invisible to every assertion below. The gate
    // now parses each workflow with the `yaml` package and evaluates `jobs` as an object.
    id: "a flow-style job hiding a banned container on billed capacity",
    file: "ci.yml",
    mutateAfter: (source) =>
      `${source.trimEnd()}\n  hidden: {runs-on: ubuntu-latest, container: "node:24", steps: [{run: echo bypass}]}\n`,
    expect: /declares a container but is not in LINUX_JOBS/,
  },
  {
    // The image tag is derived from the workflow rather than typed here: a hardcoded `v1.61.0` made
    // this case a HARNESS BUG the moment the lockfile's playwright version moved, and a harness bug
    // reads exactly like a gate that stopped being exercised.
    id: "a container on the Linux runner pinned to the WRONG playwright version",
    file: "verify-linux.yml",
    mutateAfter: (source) =>
      source.replace(
        /(image: mcr\.microsoft\.com\/playwright:v)\d+\.\d+\.\d+(-noble)/,
        "$11.55.0$2",
      ),
    expect: /the only sanctioned\s+image is/,
  },
  {
    id: "a container smuggled onto the Linux runner as an arbitrary image",
    file: "verify-linux.yml",
    mutateAfter: (source) =>
      source.replace(
        /image: mcr\.microsoft\.com\/playwright:v\d+\.\d+\.\d+-noble/,
        "image: node:24",
      ),
    expect: /the only sanctioned\s+image is/,
  },
  {
    // The exception was one-directional: a container was PERMITTED on these jobs but not REQUIRED, so
    // deleting the block left the job running bare on the host with whatever browsers it has.
    id: "the pinned container REMOVED from the Linux browser job",
    file: "verify-linux.yml",
    mutateAfter: (source) =>
      source.replace(/^ {4}container:\n(?: {6}.*\n| *\n)*/m, ""),
    expect: /must declare the pinned Playwright\s+container/,
  },
  // ---------------------------------------------------------------- flow-style STEPS
  // The job-level flow-style case above proved the gate discovers jobs structurally. These prove the
  // same for the three rules that walk STEPS. Each was regex-over-text until 2026-09-09 — `uses:`
  // matched by a line pattern, checkout steps carved out by an indentation-based `stepBlocks()`, run
  // bodies reassembled by `runScriptLines()` — and each therefore passed a step written in flow
  // style. All three are applied to BOTH a mac-mini workflow and the container workflow, because the
  // two travel different paths through the gate and only one of them was ever exercised.
  ...["ci.yml", "verify-linux.yml"].flatMap((file) => [
    {
      id: `an UNPINNED action smuggled in as a flow-style step (${file})`,
      file,
      mutateAfter: (source) =>
        `${source.trimEnd()}\n      - {uses: "evil/backdoor@main"}\n`,
      expect: /not pinned to a full commit SHA/,
    },
    {
      id: `a flow-style checkout that PERSISTS its credential (${file})`,
      file,
      // Placed IMMEDIATELY AFTER a compliant checkout, which is where the old text-based
      // `stepBlocks()` was genuinely blind: it carved blocks by indentation, so a flow-style step
      // was absorbed into the PRECEDING block — and that block already contained
      // `persist-credentials: false`, satisfying the assertion on the attacker's behalf. Appended at
      // the end of the file the same mutation was caught, but by the wrong step's text, which is
      // luck rather than coverage.
      mutateAfter: (source) =>
        source.replace(
          "          persist-credentials: false\n",
          '          persist-credentials: false\n      - {uses: "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803"}\n',
        ),
      expect: /checkout persists a token/,
    },
    {
      id: `an expression interpolated into a flow-style run: body (${file})`,
      file,
      mutateAfter: (source) =>
        `${source.trimEnd()}\n` +
        '      - {run: "echo ${{ github.event.pull_request.title }}"}\n',
      expect: /interpolated directly into a run: script/,
    },
  ]),
  // ---------------------------------------------------------------- fork guard, exactly
  // `.includes()` is not a guard. Both of these CONTAIN the guard verbatim and evaluate to true for
  // every fork pull request, so a substring test documented the protection and disabled it in the
  // same line. The gate now compares the normalised expression for equality.
  {
    id: "the fork guard neutralised with `|| true`",
    file: "verify-linux.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace:
      "    if: github.event.pull_request.head.repo.full_name == github.repository || true\n",
    expect: /is not exactly the fork/,
  },
  {
    id: "the fork guard INVERTED and neutralised — `!(…) || true`",
    file: "verify-linux.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace:
      "    if: ${{ !(github.event.pull_request.head.repo.full_name == github.repository) || true }}\n",
    expect: /is not exactly the fork/,
  },
  {
    id: "the fork guard removed from the Linux browser job",
    file: "verify-linux.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace: "",
    expect: /is not exactly the fork.*got `\(no if:\)`/s,
  },
  {
    id: "the container job losing its bash default (sh cannot do `set -o pipefail`)",
    file: "verify-linux.yml",
    find: "    defaults:\n      run:\n        shell: bash\n",
    replace: "",
    expect: /without `defaults.run.shell: bash`/,
  },
  {
    id: "a mini job moved onto the Linux runners without being allowlisted",
    file: "ci.yml",
    find: "  verify:\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n",
    replace: "  verify:\n    runs-on: [self-hosted, linux, vsk-runner]\n",
    expect: /must run on \[self-hosted, vsk-runners-mac-mini\]/,
  },
  {
    id: "the Linux browser job moved off the Linux runners",
    file: "verify-linux.yml",
    find: "    runs-on: [self-hosted, linux, vsk-runner]",
    replace: "    runs-on: [self-hosted, vsk-runners-mac-mini]",
    expect: /recorded as a LAN Linux job but runs on/,
  },
  {
    id: "a free mini job moved onto billed capacity",
    file: "ci.yml",
    find: "  verify:\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n",
    replace: "  verify:\n    runs-on: ubuntu-latest\n",
    expect: /must run on \[self-hosted, vsk-runners-mac-mini\]/,
  },
  {
    id: "publish moved ONTO ubuntu (billed capacity reintroduced)",
    file: "release.yml",
    mutateAfter: (source) =>
      source.replace(
        /(  publish:\n(?:.*\n)*?)    runs-on: \[self-hosted, vsk-runners-mac-mini\]/,
        "$1    runs-on: ubuntu-latest",
      ),
    expect: /must run on \[self-hosted, vsk-runners-mac-mini\]/,
  },
  {
    id: "provenance re-enabled on the self-hosted publish (would fail the release)",
    file: "release.yml",
    find: "npm publish --access public --no-provenance",
    replace: "npm publish --access public --provenance",
    expect: /npm publish --no-provenance/,
  },
  {
    id: "a long-lived npm token reintroduced into release.yml",
    file: "release.yml",
    find: "env:\n  SITE_VISIBILITY: public",
    replace:
      "env:\n  SITE_VISIBILITY: public\n  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}",
    expect: /token-free OIDC trusted publishing/,
  },
  {
    id: "the receipt guard deleted from ci.yml",
    file: "ci.yml",
    find: "  receipt-guard:\n",
    replace: "  receipt-guard-disabled:\n",
    expect: /has no `receipt-guard` job/,
  },
  {
    id: "a receipt guard that does not verify the receipt",
    file: "ci.yml",
    find: "node tooling/verify-gate-receipt.mjs --before",
    replace: "echo skipping --before",
    expect: /receipt-guard does not run tooling\/verify-gate-receipt\.mjs/,
  },
  {
    id: "shell injection through a run: body",
    file: "ci.yml",
    find: "      - run: pnpm design:verify",
    replace:
      "      - run: echo ${{ github.event.pull_request.title }}\n      - run: pnpm design:verify",
    expect: /interpolated directly into a run: script/,
  },
  {
    id: "checkout persisting a credential",
    file: "ci.yml",
    find: "          persist-credentials: false\n",
    replace: "          persist-credentials: true\n",
    expect: /checkout persists a token/,
  },
  {
    id: "the read-only workflow token removed",
    file: "ci.yml",
    find: "permissions:\n  contents: read\n",
    replace: "permissions:\n  contents: write\n",
    expect: /missing read-only workflow token/,
  },
  {
    id: "pull_request_target added",
    file: "ci.yml",
    find: "on:\n  pull_request:\n",
    replace: "on:\n  pull_request:\n  pull_request_target:\n",
    expect: /pull_request_target/,
  },
  {
    id: "stray OIDC in ci.yml",
    file: "ci.yml",
    find: "    runs-on: [self-hosted, vsk-runners-mac-mini]\n    steps:\n      - uses: actions/checkout",
    replace:
      "    runs-on: [self-hosted, vsk-runners-mac-mini]\n    permissions:\n      id-token: write\n    steps:\n      - uses: actions/checkout",
    expect: /OIDC/,
  },
  {
    id: "publish no longer requires the quality gate to have succeeded",
    file: "release.yml",
    // Scoped to the publish job's `if` — the has_changesets=='false' line precedes it there, whereas
    // version-pr's identical quality-gate check is preceded by has_changesets=='true'.
    find: "      needs.changes.outputs.has_changesets == 'false' &&\n      needs.quality-gate.result == 'success'",
    replace:
      "      needs.changes.outputs.has_changesets == 'false' &&\n      true",
    expect: /quality-gate to have SUCCEEDED/,
  },
  {
    id: "quality-gate no longer depends on the receipt guard",
    file: "release.yml",
    find: "    needs: [changes, receipt-guard]",
    replace: "    needs: [changes]",
    expect: /quality-gate must depend on receipt-guard/,
  },
  {
    id: "the fragile clean-tree check reintroduced",
    file: "release.yml",
    find: '          git status --porcelain > "$RUNNER_TEMP/git-status"',
    replace: '          test -z "$(git status --porcelain)"',
    expect: /command-substitution clean check|git status --porcelain/,
  },
  {
    id: "an obsolete cutover phase reintroduced",
    file: "deploy.yml",
    find: "  workflow_dispatch:\n",
    replace:
      "  workflow_dispatch:\n    inputs:\n      cutover_phase:\n        required: true\n",
    expect: /obsolete cutover branches/,
  },
  {
    id: "the production boundary probe made conditional",
    file: "deploy.yml",
    find: "  verify-public-boundary:\n    needs: build-sign-deploy\n",
    replace:
      "  verify-public-boundary:\n    needs: build-sign-deploy\n    if: always()\n",
    expect: /production boundary probe must run after every deploy/,
  },
  {
    id: "the canonical production probe removed",
    file: "deploy.yml",
    find: "        run: node apps/docs/scripts/probe-deployment.mjs\n",
    replace: "        run: echo boundary-check-skipped\n",
    expect: /canonical production probe/,
  },
];

let failures = 0;
for (const testCase of CASES) {
  const scratch = mkdtempSync(join(tmpdir(), "workflow-security-negative-"));
  try {
    const directory = join(scratch, ".github/workflows");
    mkdirSync(directory, { recursive: true });
    cpSync(WORKFLOWS, directory, { recursive: true });

    const path = join(directory, testCase.file);
    const original = readFileSync(path, "utf8");
    let mutated = original;
    if (testCase.find) {
      if (!original.includes(testCase.find)) {
        console.log(
          `✗ ${testCase.id}\n    HARNESS BUG — pattern absent from ${testCase.file}, nothing mutated`,
        );
        failures++;
        continue;
      }
      mutated = original.replace(testCase.find, testCase.replace);
    }
    if (testCase.mutateAfter) mutated = testCase.mutateAfter(mutated);
    if (mutated === original) {
      console.log(
        `✗ ${testCase.id}\n    HARNESS BUG — mutation produced no change`,
      );
      failures++;
      continue;
    }
    writeFileSync(path, mutated);

    const result = spawnSync("node", [GATE], {
      cwd: scratch,
      encoding: "utf8",
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (result.status === 0) {
      console.log(
        `✗ ${testCase.id}\n    *** ACCEPTED — the gate does not catch this ***`,
      );
      failures++;
    } else if (!testCase.expect.test(output)) {
      console.log(
        `✗ ${testCase.id}\n    rejected, but for the WRONG reason (wanted /${testCase.expect.source}/)\n` +
          `    got: ${(/AssertionError[^\n]*/.exec(output)?.[0] ?? output.split("\n")[0]).slice(0, 140)}`,
      );
      failures++;
    } else {
      console.log(`✓ ${testCase.id}`);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (failures > 0) {
  console.error(
    `\nverify-workflow-security-negative: ${failures} of ${CASES.length} case(s) not caught — ` +
      "the workflow security gate has a hole or this harness has a bug. Both are defects.",
  );
  process.exit(1);
}
console.log(
  `\n✓ workflow-security-negative: all ${CASES.length} mutations rejected — flow-style job AND STEP ` +
    `discovery (unpinned action, credential-persisting checkout, and run-body interpolation, each ` +
    `written in flow style, in two workflows), the container ban and its single pinned-image ` +
    `exception (required, not merely permitted), the fork guard on the LAN runners — required ` +
    `EXACTLY, so \`|| true\` and \`!(…) || true\` are both rejected — the runner ` +
    `allowlist (all three directions), receipt-guard presence and wiring, shell injection, credential ` +
    `persistence, token scope, pull_request_target, stray OIDC, publish dependencies, and the ` +
    `unconditional production-boundary chain`,
);
