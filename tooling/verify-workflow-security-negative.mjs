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
//   Since WP2 the `receipt-guard` cases are gone with the guard itself, and what replaced them is
//   asserted the same way: that a job actually runs `pnpm verify`, that it runs on a browser-capable
//   runner, that the deploy waits for it, and that `pnpm verify:release` still runs there. An
//   assertion that the browser lanes RAN is only as good as the proof that something still invokes
//   them.
//
//   The ban is now CONDITIONAL — a job in LINUX_JOBS may run the pinned Playwright container on the
//   LAN Debian boxes — which makes mutation coverage load-bearing rather than merely prudent: a
//   conditional exception is exactly the shape that quietly widens into a hole. Cases below pin it
//   shut from every side (wrong image, arbitrary image, the container REMOVED, un-allowlisted job on
//   the Linux label, allowlisted job moved off it, and the fork guard removed).
//
//   TOPOLOGY IS NOT EFFECTIVENESS. Until 2026-09-09 every case here mutated the SHAPE of a workflow —
//   a runner, an image, a dependency edge — and an adversarial review then built twelve mutations
//   that left the shape untouched and passed the gate. Three of them made a workflow report success
//   while executing nothing: `continue-on-error` on the deploy's verify job (a FAILED sweep still
//   deploys), the same key on ci.yml's `pnpm verify` step (a green check on a red suite), and
//   `if: false` on `pnpm verify:release` (the step stays in the file and leaves the run). Those
//   twelve, and the three defects that had to be fixed before they could even be mutated (unbounded
//   jobs, an over-scoped `publish`, ci.yml's missing SITE_VISIBILITY), are the last block of cases.
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

import { ROOT } from "./lib/fs.mjs";

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

/**
 * Replace one job's step list, bounded by the NEXT job header rather than by end of file.
 *
 * Several mutations gut a job. Expressing that as `/<anchor>[\s\S]*$/` is only equivalent while
 * the job happens to be the last one in its workflow: append a job and the same mutation deletes
 * that one too, so the case stops testing what it is named for. The bound here is structural.
 */
function replaceJobSteps(source, job, steps) {
  const header = new RegExp(`^ {2}${job}:\\n`, "m");
  const start = header.exec(source);
  if (!start) return source;
  const stepsKey = source.indexOf("\n    steps:\n", start.index);
  if (stepsKey === -1) return source;
  const bodyStart = stepsKey + "\n    steps:\n".length;
  const next = /^ {2}\S[^\n]*:\s*$/m.exec(source.slice(bodyStart));
  const bodyEnd = next ? bodyStart + next.index : source.length;
  return source.slice(0, bodyStart) + steps + source.slice(bodyEnd);
}

const CASES = [
  {
    id: "container on a mac-mini job",
    file: "ci.yml",
    find: "  verify-macos:\n",
    replace: "  verify-macos:\n    container: node:24\n",
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
      `${source.trimEnd()}\n  hidden: {runs-on: ubuntu-latest, timeout-minutes: 5, container: "node:24", steps: [{run: echo bypass}]}\n`,
    expect: /declares a container but is not in LINUX_JOBS/,
  },
  {
    // The image tag is derived from the workflow rather than typed here: a hardcoded `v1.61.0` made
    // this case a HARNESS BUG the moment the lockfile's playwright version moved, and a harness bug
    // reads exactly like a gate that stopped being exercised.
    id: "a container on the Linux runner pinned to the WRONG playwright version",
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(
        /(image: mcr\.microsoft\.com\/playwright:v)\d+\.\d+\.\d+(-noble)/,
        "$11.55.0$2",
      ),
    expect: /the only sanctioned\s+image is/,
  },
  {
    id: "a container smuggled onto the Linux runner as an arbitrary image",
    file: "ci.yml",
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
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(/^ {4}container:\n(?: {6}.*\n| *\n)*/m, ""),
    expect: /must declare the pinned Playwright\s+container/,
  },
  // ---------------------------------------------------------------- the one command actually runs
  //
  // These replace the `receipt-guard` presence-and-wiring cases. The guard existed because the
  // browser lanes ran only on a developer machine; they now run in CI, and what has to be pinned shut
  // is that they are still INVOKED, and still on a machine that can launch a browser.
  {
    id: "`pnpm verify` removed from ci.yml entirely",
    file: "ci.yml",
    find: "      - run: pnpm verify\n",
    replace: "      - run: echo verified\n",
    expect: /no job runs `pnpm verify`/,
  },
  {
    id: "`pnpm verify` moved off the browser-capable runner onto a mini",
    file: "ci.yml",
    mutateAfter: (source) =>
      source
        .replace("      - run: pnpm verify\n", "      - run: echo skipped\n")
        // Re-added at the END of the file, which lands in the last job — a mac mini — rather
        // than after a named step that is free to move or be renamed.
        .replace(/\n*$/, "\n      - run: pnpm verify\n"),
    expect: /none of which is a LINUX_JOBS\s+entry/,
  },
  {
    id: "the release quality gate no longer runs the one command",
    file: "release.yml",
    find: "      - run: pnpm verify\n",
    replace: "      - run: echo quality\n",
    expect: /no job runs `pnpm verify`/,
  },
  {
    id: "the deploy loses `pnpm verify:release` (docs export, consume, three engines)",
    file: "deploy.yml",
    find: "      - run: pnpm verify:release\n",
    replace: "",
    expect: /must run `pnpm verify:release`/,
  },
  {
    id: "the deploy no longer waits for the verify job",
    file: "deploy.yml",
    find: "  build-sign-deploy:\n    needs: verify\n",
    replace: "  build-sign-deploy:\n    needs: ref-guard\n",
    expect: /build-sign-deploy must depend on the `verify` job/,
  },
  // ---------------------------------------------------------------- flow-style STEPS
  // The job-level flow-style case above proved the gate discovers jobs structurally. These prove the
  // same for the three rules that walk STEPS. Each was regex-over-text until 2026-09-09 — `uses:`
  // matched by a line pattern, checkout steps carved out by an indentation-based `stepBlocks()`, run
  // bodies reassembled by `runScriptLines()` — and each therefore passed a step written in flow
  // style. All three are applied to BOTH a mac-mini job and a container job, because the two travel
  // different paths through the gate and only one of them was ever exercised. Appending to the end of
  // `ci.yml` lands in `verify-macos`; the `-container` variants insert into `ci.yml`'s Linux `verify`.
  ...[
    {
      label: "mini job",
      apply: (source, step) => `${source.trimEnd()}\n${step}`,
    },
    {
      label: "container job",
      apply: (source, step) =>
        source.replace(
          "      - run: pnpm verify\n",
          `${step}      - run: pnpm verify\n`,
        ),
    },
  ].flatMap(({ label, apply }) => [
    {
      id: `an UNPINNED action smuggled in as a flow-style step (${label})`,
      file: "ci.yml",
      mutateAfter: (source) =>
        apply(source, '      - {uses: "evil/backdoor@main"}\n'),
      expect: /not pinned to a full commit SHA/,
    },
    {
      id: `an expression interpolated into a flow-style run: body (${label})`,
      file: "ci.yml",
      mutateAfter: (source) =>
        apply(
          source,
          '      - {run: "echo ${{ github.event.pull_request.title }}"}\n',
        ),
      expect: /interpolated directly into a run: script/,
    },
  ]),
  {
    id: "a flow-style checkout that PERSISTS its credential",
    file: "ci.yml",
    // Placed IMMEDIATELY AFTER a compliant checkout, which is where the old text-based
    // `stepBlocks()` was genuinely blind: it carved blocks by indentation, so a flow-style step was
    // absorbed into the PRECEDING block — and that block already contained
    // `persist-credentials: false`, satisfying the assertion on the attacker's behalf. Appended at
    // the end of the file the same mutation was caught, but by the wrong step's text, which is luck
    // rather than coverage.
    mutateAfter: (source) =>
      source.replace(
        "          persist-credentials: false\n",
        '          persist-credentials: false\n      - {uses: "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803"}\n',
      ),
    expect: /checkout persists a token/,
  },
  {
    id: "a flow-style checkout that PERSISTS its credential (container job, release.yml)",
    file: "release.yml",
    // After the LAST line of the checkout's `with:` mapping rather than in the middle of it — an
    // insertion between two `with:` keys is not a step at all, it is unparseable YAML, and the gate
    // would then reject it for the wrong reason.
    mutateAfter: (source) =>
      source.replace(
        "          ref: ${{ github.sha }}\n",
        '          ref: ${{ github.sha }}\n      - {uses: "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803"}\n',
      ),
    expect: /checkout persists a token/,
  },
  // ---------------------------------------------------------------- fork guard, exactly
  // `.includes()` is not a guard. Both of these CONTAIN the guard verbatim and evaluate to true for
  // every fork pull request, so a substring test documented the protection and disabled it in the
  // same line. The gate now compares the normalised expression for equality — and since WP2 it does
  // so for EVERY job of a fork-triggerable workflow, not only the Linux ones: the mac mini is LAN
  // hardware too and carried no guard at all until then.
  {
    id: "the fork guard neutralised with `|| true`",
    file: "ci.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace:
      "    if: github.event.pull_request.head.repo.full_name == github.repository || true\n",
    expect: /is not exactly the\s+fork guard/,
  },
  {
    id: "the fork guard INVERTED and neutralised — `!(…) || true`",
    file: "ci.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace:
      "    if: ${{ !(github.event.pull_request.head.repo.full_name == github.repository) || true }}\n",
    expect: /is not exactly the\s+fork guard/,
  },
  {
    id: "the fork guard removed from the Linux browser job",
    file: "ci.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace: "",
    expect: /is not exactly the.*got `\(no if:\)`/s,
  },
  {
    id: "the fork guard removed from the MAC MINI job (unguarded until WP2)",
    file: "ci.yml",
    mutateAfter: (source) => {
      const guard =
        "    if: github.event.pull_request.head.repo.full_name == github.repository\n";
      const last = source.lastIndexOf(guard);
      return source.slice(0, last) + source.slice(last + guard.length);
    },
    expect: /job verify-macos .*is not exactly the/s,
  },
  {
    id: "the container job losing its bash default (sh cannot do `set -o pipefail`)",
    file: "ci.yml",
    find: "    defaults:\n      run:\n        shell: bash\n",
    replace: "",
    expect: /without `defaults.run.shell: bash`/,
  },
  {
    id: "a mini job moved onto the Linux runners without being allowlisted",
    file: "ci.yml",
    // REPLACE the existing `runs-on`, never prepend a second one: two `runs-on` keys in one job is
    // unparseable YAML, so the gate would reject the mutation without ever reaching the allowlist.
    find: "    runs-on: [self-hosted, vsk-runners-mac-mini]",
    replace: "    runs-on: [self-hosted, linux, vsk-runner]",
    expect: /must run on \[self-hosted, vsk-runners-mac-mini\]/,
  },
  {
    id: "the Linux browser job moved off the Linux runners",
    file: "ci.yml",
    find: "    runs-on: [self-hosted, linux, vsk-runner]",
    replace: "    runs-on: [self-hosted, vsk-runners-mac-mini]",
    expect: /recorded as a LAN Linux job but runs on/,
  },
  {
    id: "a free mini job moved onto billed capacity",
    file: "ci.yml",
    find: "    runs-on: [self-hosted, vsk-runners-mac-mini]",
    replace: "    runs-on: ubuntu-latest",
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
    // Inserted before the FIRST `- run:` step in the file, whichever it is. Anchoring on
    // `pnpm design:verify` tied the case to a step it is not about.
    id: "shell injection through a run: body",
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(
        /^( +)- run: /m,
        "$1- run: echo ${{ github.event.pull_request.title }}\n$1- run: ",
      ),
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
    find: "  verify-macos:\n",
    replace: "  verify-macos:\n    permissions:\n      id-token: write\n",
    expect: /OIDC/,
  },
  {
    id: "publish no longer requires the quality gate to have succeeded",
    file: "release.yml",
    // Scoped to the publish job's `if` — the has_changesets=='false' clause precedes it there,
    // whereas version-pr's identical quality-gate check is preceded by has_changesets=='true'.
    // Matched with tolerant whitespace: the exact line wrapping of a multi-line `if:` is the
    // formatter's business, not the policy's.
    mutateAfter: (source) =>
      source.replace(
        /(has_changesets == 'false' &&\s*)needs\.quality-gate\.result == 'success'/,
        "$1true",
      ),
    expect: /quality-gate to have SUCCEEDED/,
  },
  {
    // The mutation ADDS the fragile form and KEEPS the canonical one, so the only assertion that
    // can reject it is the ban this case is named for.
    //
    // The predecessor replaced the canonical line, which deleted it — and then accepted the
    // resulting rejection under an alternation (`/command-substitution clean check|git status
    // --porcelain/`) whose second branch matched the MISSING-canonical-form message instead. The
    // case reported green for four months without ever exercising the ban. Tightening the `expect`
    // is what surfaced it; that is the whole argument for never writing an alternation here.
    id: "the fragile clean-tree check reintroduced",
    file: "deploy.yml",
    find: '          git status --porcelain > "$RUNNER_TEMP/git-status"',
    replace:
      '          test -z "$(git status --porcelain)"\n          git status --porcelain > "$RUNNER_TEMP/git-status"',
    expect: /command-substitution clean check can pass when git itself fails/,
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
  // ------------------------------------------------------------- EFFECTIVENESS, not topology
  //
  // Every case above mutates the SHAPE of a workflow — a runner, an image, a dependency edge. On
  // 2026-09-09 an adversarial review built twelve mutations that left the shape untouched and the
  // gate passed all twelve; three of them made a workflow report success while executing nothing.
  // The cases below are those twelve plus the three defects that needed a fix before they could be
  // mutated at all (unbounded jobs, over-broad publish scope, and the missing SITE_VISIBILITY in
  // ci.yml). A gate that asserts topology and not effectiveness is a gate that can be satisfied by a
  // workflow which does no work.
  {
    // The single worst one. `continue-on-error` at JOB level sets the job's conclusion to `success`,
    // so `build-sign-deploy` — which `needs: verify` — signs and deploys to production after a full
    // sweep that FAILED.
    id: "continue-on-error on deploy.yml's verify job (a failed sweep deploys anyway)",
    file: "deploy.yml",
    find: "  verify:\n    needs: ref-guard\n",
    replace: "  verify:\n    continue-on-error: true\n    needs: ref-guard\n",
    expect: /forges the job's CONCLUSION/,
  },
  {
    id: "continue-on-error on ci.yml's `pnpm verify` step (green check on a red suite)",
    file: "ci.yml",
    find: "      - run: pnpm verify\n",
    replace: "      - run: pnpm verify\n        continue-on-error: true\n",
    expect: /its failure is reported as a pass/,
  },
  {
    // `if: false` leaves the step in the file, so every assertion that reads the text is satisfied,
    // and a skipped step does not fail its job.
    id: "`if: false` on deploy.yml's `pnpm verify:release` step",
    file: "deploy.yml",
    find: "      - run: pnpm verify:release\n",
    replace: "      - run: pnpm verify:release\n        if: false\n",
    expect: /under an `if:`/,
  },
  {
    id: "the deploy's verify job made conditional",
    file: "deploy.yml",
    find: "  verify:\n    needs: ref-guard\n",
    replace: "  verify:\n    needs: ref-guard\n    if: false\n",
    expect: /the `verify` job must carry no `if:`/,
  },
  {
    id: "release quality-gate's condition widened away from publish detection",
    file: "release.yml",
    find: "    if: needs.changes.outputs.publish == 'true'\n",
    replace: "    if: needs.changes.outputs.publish == 'nope'\n",
    expect: /must be exactly the publish-detection condition/,
  },
  {
    // `command: deploy` was a substring match, so this deployed nothing and reported success.
    id: "the Cloudflare deploy neutered to `deploy --dry-run`",
    file: "deploy.yml",
    find: "          command: deploy\n",
    replace: "          command: deploy --dry-run\n",
    expect: /wrangler command must be exactly `deploy`/,
  },
  {
    id: "wranglerVersion drifting from apps/docs/package.json",
    file: "deploy.yml",
    // Matched by SHAPE, not by the literal version: a `find` string carrying today's pin silently
    // stops matching the day wrangler is bumped, and a mutation that finds nothing reports as an
    // uncaught case rather than as a stale harness.
    mutateAfter: (source) =>
      source.replace(/wranglerVersion: [\d.]+/, "wranglerVersion: 3.0.0"),
    expect: /disagrees with apps\/docs\/package\.json/,
  },
  {
    // The only thing stopping a lifecycle script from running with npm OIDC publishing authority.
    id: "the publish-time lifecycle guard deleted",
    file: "release.yml",
    mutateAfter: (source) =>
      source.replace(
        /      - name: Reject publish-time lifecycle code\n[\s\S]*?          NODE\n/,
        "",
      ),
    expect: /exactly one step named "Reject publish-time lifecycle code"/,
  },
  {
    // The hook NAME is the policy; the comma-and-space that happens to follow it in today's array
    // literal is formatting.
    id: "the lifecycle guard stops checking a hook",
    file: "release.yml",
    mutateAfter: (source) => source.replace(/'prepublishOnly',?\s*/, ""),
    expect: /no longer checks `prepublishOnly`/,
  },
  {
    id: "npm publish disabled in place with `false &&`",
    file: "release.yml",
    find: "            npm publish --access public --no-provenance",
    replace: "            false && npm publish --access public --no-provenance",
    expect: /as a whole command on its own line/,
  },
  {
    // Production would export in the private/noindex matrix, and the turbo task hash would stop
    // matching the other two workflows.
    id: "SITE_VISIBILITY removed from deploy.yml",
    file: "deploy.yml",
    find: "env:\n  SITE_VISIBILITY: public\n",
    replace: "",
    expect: /must declare `env\.SITE_VISIBILITY: public`/,
  },
  {
    id: "SITE_VISIBILITY removed from ci.yml (turbo cache key stops matching)",
    file: "ci.yml",
    find: "env:\n  SITE_VISIBILITY: public\n",
    replace: "",
    expect: /must declare `env\.SITE_VISIBILITY: public`/,
  },
  {
    // Without the pin the job signs and deploys whatever main's tip is when it starts, not the
    // commit the `verify` job swept.
    id: "`ref: ${{ github.sha }}` dropped from build-sign-deploy's checkout",
    file: "deploy.yml",
    // Matched on the checkout input alone. Naming the step that FOLLOWS it made the case hostage
    // to step order, which is not the policy.
    mutateAfter: (source) =>
      source.replace(/^ {10}ref: \$\{\{ github\.sha \}\}\n/m, ""),
    expect: /checks out without `ref: \$\{\{ github\.sha \}\}`/,
  },
  {
    // `--frozen-lockfile` is the policy; `--store-dir /pnpm-store` is a container detail that
    // travels with the image and would orphan a literal `find`.
    id: "an install unfrozen (`--no-frozen-lockfile`)",
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(
        /pnpm install --frozen-lockfile/,
        "pnpm install --no-frozen-lockfile",
      ),
    expect: /--no-frozen-lockfile/,
  },
  {
    id: "an install with no lockfile flag at all",
    file: "ci.yml",
    // BY SHAPE. This was `find: "      - run: pnpm install --frozen-lockfile\n"` and rotted the
    // moment the mac-mini install grew a `--store-dir` flag (issue #94): the literal was absent, so
    // the case reported a harness bug rather than exercising the rule. The flag it strips is the
    // one the rule is about; everything else on the line is incidental to it.
    mutateAfter: (source) => source.replace(/ --frozen-lockfile\b/, ""),
    expect: /without `--frozen-lockfile`/,
  },
  {
    // The group's NAME is incidental; that a group exists is the policy.
    id: "concurrency removed (a superseded push keeps a runner busy)",
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(/^concurrency:\n(?: {2}.*\n)+/m, ""),
    expect: /declares no `concurrency`/,
  },
  {
    id: "timeout-minutes removed (a hung job holds a LAN runner for six hours)",
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(/^ {4}timeout-minutes: \d+\n/gm, ""),
    expect: /declares no `timeout-minutes`/,
  },
  {
    // The cap is the policy; the number any one job happens to carry is not. A `find` of
    // `timeout-minutes: 5` orphaned itself the day that job was retuned.
    id: "timeout-minutes set to the Actions default in disguise",
    file: "deploy.yml",
    mutateAfter: (source) =>
      source.replace(/^ {4}timeout-minutes: \d+$/m, "    timeout-minutes: 360"),
    expect: /the cap is 60/,
  },
  {
    // Checkout + echo: still green, still self-hosted, still fork-guarded — and the whole
    // cross-platform static signal plus the only `changeset status` check in CI simply stopped.
    id: "verify-macos reduced to checkout + echo",
    file: "ci.yml",
    // Scoped to the verify-macos job's own step list. The predecessor matched to END OF FILE,
    // which is only equivalent while verify-macos happens to be the last job in ci.yml — append
    // one job and the mutation silently guts that job instead.
    mutateAfter: (source) =>
      replaceJobSteps(source, "verify-macos", "      - run: echo ok\n"),
    // The gate names the install by shape (`pnpm install …`) because its flags carry runner
    // topology; pinning the old full command line here would fail on the gate's own message.
    expect: /verify-macos must run `pnpm install [^`]*`/,
  },
  {
    id: "the changeset presence check dropped from verify-macos",
    file: "ci.yml",
    find: "      - run: pnpm exec changeset status --since=origin/main",
    replace: "      - run: echo skipped",
    expect: /verify-macos must run `pnpm exec changeset status/,
  },
  {
    // Unused authority in the same job as the npm OIDC token.
    id: "publish regains contents:write and pull-requests:write",
    file: "release.yml",
    find: "    permissions:\n      contents: read\n      id-token: write\n",
    replace:
      "    permissions:\n      contents: write\n      pull-requests: write\n      id-token: write\n",
    expect: /job publish must declare exactly/,
  },
  {
    id: "OIDC granted at workflow level instead of one job",
    file: "release.yml",
    find: "permissions:\n  contents: read\n",
    replace: "permissions:\n  contents: read\n  id-token: write\n",
    expect:
      /grants OIDC \(`id-token: write`\) at WORKFLOW level|missing read-only workflow token/,
  },
  // ------------------------------------------------- the mac mini's shared pnpm store (issue #94)
  //
  // Two runner agents, one machine, one home directory. Every mutation here puts a pnpm directory
  // back into that shared space, which is what produced `ENOTEMPTY` inside `pnpm/action-setup` on
  // three of eight pushes on 2026-09-09 — a red run with nothing to do with the diff. Each is
  // matched by SHAPE (the step, the flag), never by a full command line, so a later flag change
  // cannot quietly turn a case into a no-op the way it just did to the two cases above.
  {
    id: "the mac-mini pnpm bootstrap left at its shared-home default",
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(
        /(uses: pnpm\/action-setup@[0-9a-f]{40}[^\n]*\n)\s*with:\n\s*dest:[^\n]*\n/,
        "$1",
      ),
    expect: /bootstraps pnpm into the default/,
  },
  {
    id: "the mac-mini pnpm bootstrap pointed back at the shared home",
    file: "release.yml",
    mutateAfter: (source) =>
      source.replace(/dest: [^\n]*setup-pnpm/, "dest: ~/setup-pnpm"),
    expect: /bootstraps pnpm into `~\/setup-pnpm`/,
  },
  {
    id: "a mac-mini install losing its per-agent store directory",
    file: "ci.yml",
    mutateAfter: (source) =>
      source.replace(/ --store-dir "\$RUNNER_WORKSPACE\/[^"]*"/, ""),
    expect: /installs without a per-agent/,
  },
  {
    id: "setup-node's package-manager cache re-enabled on a mini",
    file: "release.yml",
    mutateAfter: (source) =>
      source.replace(
        /with: \{ node-version: (\d+) \}/,
        "with: { node-version: $1, cache: pnpm }",
      ),
    expect: /enables setup-node's package-manager cache on a mini/,
  },
  {
    id: "the Sigstore OIDC token moved onto a second deploy job",
    file: "deploy.yml",
    // The job already declares `permissions:`, so the token is ADDED to that block — inserting a
    // second `permissions:` key would be unparseable YAML and the gate would reject the mutation
    // without ever reaching the scope rule.
    find: "    permissions:\n      contents: read\n    steps:",
    replace:
      "    permissions:\n      contents: read\n      id-token: write\n    steps:",
    expect: /unexpected OIDC permission scope|must declare exactly/,
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
    `written in flow style, against both a mac-mini job and a container job), the container ban and ` +
    `its single pinned-image exception (required, not merely permitted), the fork guard on EVERY job ` +
    `of a fork-triggerable workflow — the mac-mini jobs included, and required EXACTLY, so \`|| true\` and ` +
    `\`!(…) || true\` are both rejected — the runner allowlist (all three directions), the one ` +
    `command actually being invoked on a browser-capable runner in all three workflows, the deploy's ` +
    `dependency on it, \`verify:release\` still running there, shell injection, credential ` +
    `persistence, token scope, pull_request_target, stray OIDC, publish dependencies, and the ` +
    `unconditional production-boundary chain — and, since 2026-09-09, EFFECTIVENESS: no ` +
    `\`continue-on-error\` anywhere, no \`if:\` on a verification step or on the deploy's sweep, the ` +
    `Cloudflare command asserted exactly (\`deploy --dry-run\` deploys nothing and reports success), ` +
    `the wrangler version agreeing with apps/docs/package.json, the publish-time lifecycle guard and ` +
    `the \`npm publish\` line itself (a \`false &&\` prefix publishes nothing), SITE_VISIBILITY in all ` +
    `three workflows, the dispatched sha on every outward checkout, \`--frozen-lockfile\` on every ` +
    `install, a concurrency group and a bounded \`timeout-minutes\` on every job, the macOS lane's ` +
    `required steps, exact permission sets on every job that holds more than the default, and — ` +
    `since issue #94 — the mac mini's pnpm topology: a job-private bootstrap directory, a ` +
    `per-agent persistent store on every install, and no setup-node package-manager cache on a ` +
    `mini, each of which otherwise puts pnpm state back into the home directory the machine's ` +
    `two runner agents share`,
);
