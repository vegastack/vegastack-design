#!/usr/bin/env node

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { ROOT } from "./lib/change-set.mjs";
import { contractSha256 } from "./lib/gate-receipt.mjs";
import { vitestImpactContentDigest } from "./lib/classifier-smoke.mjs";
import {
  SMOKE_MODEL,
  SMOKE_RELATED_MODEL,
  UNIT_MODEL,
  vitestImpactInputDigest,
  vitestImpactToolchain,
  vitestImpactToolchainDigest,
} from "./lib/smoke-scope.mjs";

const OUTPUT = join(ROOT, "packages/ui/smoke-impact.generated.json");
const check = process.argv.includes("--check");
const uiRoot = join(ROOT, "packages/ui");
const requireFromUi = createRequire(join(uiRoot, "package.json"));
const vitestNode = requireFromUi.resolve("vitest/node");
const { createVitest } = await import(pathToFileURL(vitestNode));

async function relatedEntries(model, config) {
  const vitest = await createVitest("test", {
    root: uiRoot,
    config: join(uiRoot, config),
    run: true,
    watch: false,
    passWithNoTests: true,
    silent: true,
  });
  const entries = {};
  try {
    for (const [path, expected] of [...model.impactByFile].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      vitest.config.related = [resolve(ROOT, path)];
      const specifications = await vitest.getRelevantTestSpecifications();
      const vitestTests = [
        ...new Set(
          specifications.map((specification) =>
            relative(ROOT, specification.moduleId),
          ),
        ),
      ].sort();
      const registryTests = [...expected].sort();
      entries[path] = {
        registryTests,
        vitestTests,
        disagreement:
          JSON.stringify(registryTests) !== JSON.stringify(vitestTests),
      };
    }
  } finally {
    await vitest.close();
  }
  return entries;
}

const entries = await relatedEntries(
  SMOKE_RELATED_MODEL,
  "vitest.smoke.config.ts",
);
const unitEntries = await relatedEntries(UNIT_MODEL, "vitest.config.ts");
const toolchain = vitestImpactToolchain();

const output = `${JSON.stringify(
  {
    generatedBy: "tooling/sync-smoke-impact.mjs",
    contractSha256: contractSha256(),
    contentDigest: vitestImpactContentDigest(),
    inputDigest: vitestImpactInputDigest(),
    toolchain,
    toolchainDigest: vitestImpactToolchainDigest(toolchain),
    entries,
    unitEntries,
  },
  null,
  2,
)}\n`;

if (check) {
  let current = null;
  try {
    current = readFileSync(OUTPUT, "utf8");
  } catch {}
  if (current !== output) {
    console.error(
      "sync-smoke-impact: generated shadow manifest is stale; run `node tooling/sync-smoke-impact.mjs`",
    );
    process.exit(1);
  }
} else writeFileSync(OUTPUT, output);

const disagreements = Object.values(entries).filter(
  (entry) => entry.disagreement,
).length;
const unitDisagreements = Object.values(unitEntries).filter(
  (entry) => entry.disagreement,
).length;
console.log(
  `✓ Vitest impact: ${Object.keys(unitEntries).length} unit/all-browser and ${Object.keys(entries).length} smoke paths compared; ${unitDisagreements + disagreements} disagreement(s) widen`,
);
