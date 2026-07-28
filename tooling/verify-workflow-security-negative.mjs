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
    id: "container on a self-hosted job",
    file: "ci.yml",
    find: "  verify:\n    needs: receipt-guard\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n",
    replace:
      "  verify:\n    needs: receipt-guard\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n    container: node:24\n",
    expect: /declares a job container/,
  },
  {
    id: "a free mini job moved onto billed capacity",
    file: "ci.yml",
    find: "  verify:\n    needs: receipt-guard\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n",
    replace:
      "  verify:\n    needs: receipt-guard\n    runs-on: ubuntu-latest\n",
    expect: /must run on \[self-hosted, vsk-runners-mac-mini\]/,
  },
  {
    id: "publish moved OFF ubuntu (npm OIDC would break)",
    file: "release.yml",
    find: "  publish:\n    needs: [changes, quality-gate, package-build]",
    replace:
      "  publish:\n    needs: [changes, quality-gate, package-build]\n    # moved\n",
    mutateAfter: (source) =>
      source.replace(
        /(  publish:\n(?:.*\n)*?)    runs-on: ubuntu-latest/,
        "$1    runs-on: [self-hosted, vsk-runners-mac-mini]",
      ),
    expect: /recorded as GitHub-hosted but runs on/,
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
    id: "deploy accepts a change/scoped receipt",
    file: "deploy.yml",
    find: "--profile production-full",
    replace: "--profile change",
    expect: /production-full evidence explicitly/,
  },
  {
    id: "shell injection through a run: body",
    file: "ci.yml",
    find: "      - name: Lint and design verification (single invocation)\n        run: pnpm lint",
    replace:
      "      - run: echo ${{ github.event.pull_request.title }}\n      - name: Lint and design verification (single invocation)\n        run: pnpm lint",
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
    find: "      needs.package-build.result == 'success'",
    replace: "      true",
    expect: /package-build to have SUCCEEDED/,
  },
  {
    id: "registry state returned to the fail-open classifier lookup",
    file: "release.yml",
    find: 'node tooling/classify-change.mjs --before "$BEFORE" --after "$CURRENT_SHA"',
    replace:
      'node tooling/classify-change.mjs --before "$BEFORE" --after "$CURRENT_SHA" --check-npm',
    expect: /classifier must not own npm state/,
  },
  {
    id: "hosted npm build made unconditional for registry-only releases",
    file: "release.yml",
    find: "needs.changes.outputs.npm_publish == 'true' &&\n      needs.quality-gate.result == 'success'",
    replace:
      "needs.changes.outputs.release_required == 'true' &&\n      needs.quality-gate.result == 'success'",
    expect: /hosted package build must run only/,
  },
  {
    id: "npm publish detached from exact-version state",
    file: "release.yml",
    find: "needs.changes.outputs.npm_publish == 'true' &&\n      needs.quality-gate.result == 'success' &&\n      needs.package-build.result == 'success'",
    replace:
      "needs.changes.outputs.release_required == 'true' &&\n      needs.quality-gate.result == 'success' &&\n      needs.package-build.result == 'success'",
    expect: /npm OIDC must be unreachable/,
  },
  {
    id: "post-publish exact-version readback removed",
    file: "release.yml",
    find: "      - name: Verify exact public versions after publish",
    replace: "      - name: Skip exact public version verification",
    expect: /publication must finish with an exact-version registry readback/,
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
    find: "  verify-public-boundary:\n    needs: deploy-curated\n",
    replace:
      "  verify-public-boundary:\n    needs: deploy-curated\n    if: always()\n",
    expect: /production boundary probe must run after every deploy/,
  },
  {
    id: "the canonical production probe removed",
    file: "deploy.yml",
    find: "        run: node apps/docs/scripts/probe-deployment.mjs\n",
    replace: "        run: echo boundary-check-skipped\n",
    expect: /canonical production probe/,
  },
  {
    id: "CI verify no longer waits for receipt-guard",
    file: "ci.yml",
    find: "  verify:\n    needs: receipt-guard\n",
    replace: "  verify:\n",
    expect: /verify must depend on receipt-guard/,
  },
  {
    id: "the self-hosted no-cache canary made unconditional",
    file: "ci.yml",
    find: "        if: vars.SELF_HOSTED_PNPM_CACHE_CANARY == 'enabled' && runner.name == vars.SELF_HOSTED_PNPM_CACHE_CANARY_RUNNER\n",
    replace: "        if: always()\n",
    expect: /explicitly enabled, runner-pinned canary/,
  },
  {
    id: "the cached control default removed",
    file: "ci.yml",
    find: "      - name: \"Setup Node (cached control/default)\"\n        if: vars.SELF_HOSTED_PNPM_CACHE_CANARY != 'enabled' || runner.name != vars.SELF_HOSTED_PNPM_CACHE_CANARY_RUNNER\n        uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6\n        with: { node-version: 24, cache: pnpm }\n",
    replace:
      "      - name: \"Setup Node (cached control/default)\"\n        if: vars.SELF_HOSTED_PNPM_CACHE_CANARY != 'enabled' || runner.name != vars.SELF_HOSTED_PNPM_CACHE_CANARY_RUNNER\n        uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6\n        with: { node-version: 24 }\n",
    expect: /control\/default/,
  },
  {
    id: "cache canary measurement removed",
    file: "ci.yml",
    find: "          node tooling/report-workflow-setup.mjs\n",
    replace: "          echo measurement-skipped\n",
    expect: /retain structured setup and frozen-install measurements/,
  },
  {
    id: "the duplicate explicit design verification restored",
    file: "ci.yml",
    find: "      - name: Lint and design verification (single invocation)\n        run: pnpm lint\n",
    replace:
      "      - run: pnpm design:verify\n      - name: Lint and design verification (single invocation)\n        run: pnpm lint\n",
    expect: /must not run explicitly and again/,
  },
  {
    id: "deployment completion detached from the live probe",
    file: "deploy.yml",
    find: "    needs: [sign-curated, deploy-curated, verify-public-boundary]\n",
    replace: "    needs: [sign-curated, deploy-curated]\n",
    expect:
      /must wait for signing, upload\/reverification, and the live boundary probe/,
  },
  {
    id: "deployment completion allowed after predecessor failure",
    file: "deploy.yml",
    find: "    needs: [sign-curated, deploy-curated, verify-public-boundary]\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n",
    replace:
      "    needs: [sign-curated, deploy-curated, verify-public-boundary]\n    if: always()\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n",
    expect: /must not use always\(\)/,
  },
  {
    id: "the live production probe made continue-on-error",
    file: "deploy.yml",
    find: "      - name: Verify the public/internal/registry boundary (fail-closed)\n",
    replace:
      "      - name: Verify the public/internal/registry boundary (fail-closed)\n        continue-on-error: true\n",
    expect: /production boundary probe must not continue on error/,
  },
  {
    id: "structured Cloudflare version capture removed",
    file: "deploy.yml",
    find: "          WRANGLER_OUTPUT_FILE_PATH: ${{ runner.temp }}/wrangler-output.ndjson\n",
    replace: "          WRANGLER_LOG: plain-text-only\n",
    expect: /structured deployment output/,
  },
  {
    id: "deploy candidate silently replaces the mandatory rebuild",
    file: "deploy.yml",
    find: "      - run: pnpm build\n",
    replace:
      "      - if: steps.candidate.outputs.state != 'hit'\n        run: pnpm build\n",
    expect: /exact-tree build fallback must remain unconditional/,
  },
  {
    id: "deploy candidate hard archive digest verification removed",
    file: "deploy.yml",
    find: "          node tooling/deploy-candidate.mjs download \\\n",
    replace: "          echo archive-digest-warning-only \\\n",
    expect: /immutable ID and verified after archive digest validation/,
  },
  {
    id: "candidate reuse made variable-switchable without D4 code review",
    file: "deploy.yml",
    find: '            echo "- Reuse: disabled (D4 requires MK approval and a code change)"\n',
    replace:
      '            echo "- Reuse: ${DEPLOY_CANDIDATE_REUSE:-disabled}"\n',
    expect: /candidate reuse must remain hard-disabled/,
  },
  {
    id: "credential-bearing signer downloads the shadow candidate",
    file: "deploy.yml",
    find: "      - uses: actions/download-artifact@018cc2cf5baa6db3ef3c5f8a56943fffe632ef53 # v6\n        with:\n          name: docs-unsigned-${{ github.sha }}\n",
    replace:
      "      - uses: actions/download-artifact@018cc2cf5baa6db3ef3c5f8a56943fffe632ef53 # v6\n        with:\n          name: docs-candidate-${{ github.sha }}\n",
    expect: /credential-bearing jobs must consume only/,
  },
  {
    id: "release adds a second candidate-only build",
    file: "release.yml",
    find: "      - name: Create exact-main deploy candidate manifest (shadow only)\n",
    replace:
      "      - run: pnpm build\n      - name: Create exact-main deploy candidate manifest (shadow only)\n",
    expect: /one already-required quality build/,
  },
  {
    id: "release candidate allowed to overwrite an existing artifact name",
    file: "release.yml",
    find: "          overwrite: false\n",
    replace: "          overwrite: true\n",
    expect: /must not hide corruption or overwrite/,
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
  `\n✓ workflow-security-negative: all ${CASES.length} mutations rejected — container ban, runner ` +
    `allowlist (both directions), receipt-guard presence and wiring, shell injection, credential ` +
    `persistence, token scope, pull_request_target, stray OIDC, publish dependencies, and the ` +
    `unconditional production-boundary chain`,
);
