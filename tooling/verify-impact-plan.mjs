#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function invoke(args, expectedStatus = 0) {
  const result = spawnSync(
    process.execPath,
    ["tooling/impact-plan.mjs", ...args],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
      timeout: 30_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  assert.equal(
    result.status,
    expectedStatus,
    `${result.stdout}\n${result.stderr}`,
  );
  return result;
}

function plan(path, ...extra) {
  return JSON.parse(invoke(["--path", path, ...extra, "--json"]).stdout);
}

const prose = plan(
  "docs/plans/2026-07-29-dynamic-dependency-aware-verification.md",
);
assert.equal(prose.state, "diagnostic-shadow-only");
assert.equal(prose.evidenceWritten, false);
assert.equal(prose.receiptWritten, false);
assert.equal(prose.productionEligible, false);
assert.equal(prose.rollout.selectedExecutionEnabled, false);
assert.equal(prose.rollout.dynamicPrePushEnabled, false);
assert.equal(prose.rollout.dynamicProductionEnabled, false);
assert.equal(prose.plan.lanes.vrt.state, "safely-skipped");
assert.equal(prose.plan.lanes.vrt.reasonCode, "no-vrt-impact");
assert.match(prose.plan.selectorDigest, /^[a-f0-9]{64}$/);
assert.equal(prose.measurements.class, "measured");
assert.ok(prose.measurements.selectorDurationMs >= 0);
assert.ok(prose.measurements.attainabilityDurationMs >= 0);
assert.ok(
  prose.measurements.planningDurationMs >=
    prose.measurements.selectorDurationMs +
      prose.measurements.attainabilityDurationMs,
  "reported total planning cost must include selector and checkpoint analysis",
);
const proseText = invoke([
  "--path",
  "docs/plans/2026-07-29-dynamic-dependency-aware-verification.md",
]).stdout;
assert.match(proseText, /total planning .*impact .*checkpoint analysis/);
assert.match(proseText, /reason\s+.*operational|reason\s+.*prose\/operator/i);
assert.match(proseText, /checkpoint\s+BLOCKED/);

const rendered = plan("apps/docs/content/docs/guides/quickstart.mdx");
assert.equal(rendered.plan.lanes.vrt.mode, "selected");
assert.deepEqual(rendered.plan.lanes.vrt.fullPageRoutes, [
  "/docs/guides/quickstart",
]);

const component = plan("packages/ui/registry/ui/marker.tsx");
assert.equal(component.plan.lanes.unit.mode, "selected");
assert.ok(
  component.plan.lanes.unit.files.includes(
    "packages/ui/registry/ui/timeline.test.tsx",
  ),
);
assert.ok(
  component.plan.lanes.contracts.routes.includes("/docs/components/timeline"),
);
assert.equal(
  component.plan.lanes.vrt.mode,
  "selected",
  "an agreeing registry/import closure may select the exact component and dependent VRT routes",
);

const unknown = plan("unmodeled/new-input.bin");
for (const lane of Object.values(unknown.plan.lanes))
  assert.equal(lane.mode, "full");
assert.deepEqual(unknown.plan.unknownPaths, ["unmodeled/new-input.bin"]);

const metadata = plan(
  "packages/ui/registry/ui/button.tsx",
  "--metadata-path",
  "packages/ui/registry/ui/button.tsx",
);
for (const lane of Object.values(metadata.plan.lanes))
  assert.equal(lane.mode, "full");
assert.equal(metadata.plan.fileFacts[0].metadataChanged, true);

const binary = plan(
  "packages/ui/registry/ui/button.tsx",
  "--binary-path",
  "packages/ui/registry/ui/button.tsx",
);
for (const lane of Object.values(binary.plan.lanes))
  assert.equal(lane.mode, "full");
assert.equal(binary.plan.fileFacts[0].binaryChanged, true);
assert.match(binary.plan.reasons.join("\n"), /binary content/);

const invalid = invoke(["--base", "definitely-not-a-ref", "--json"], 2);
assert.match(invalid.stderr, /base ref does not resolve to a commit/);

console.log(
  "✓ impact plan: operational prose, rendered MDX, dependent closure, unknown inputs, metadata, and disabled rollout verified",
);
