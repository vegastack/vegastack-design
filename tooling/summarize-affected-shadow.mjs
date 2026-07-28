#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./lib/change-set.mjs";
import { summarizeAffectedSamples } from "./lib/gate-impact.mjs";

const DIRECTORY = join(ROOT, ".gates", "affected-shadow");
const samples = [];
const readErrors = [];
if (existsSync(DIRECTORY))
  for (const name of readdirSync(DIRECTORY).sort()) {
    if (!name.endsWith(".json")) continue;
    try {
      samples.push(JSON.parse(readFileSync(join(DIRECTORY, name), "utf8")));
    } catch (error) {
      readErrors.push(`${name}: ${error.message}`);
    }
  }
const summary = summarizeAffectedSamples(samples);
summary.invalid.push(...readErrors);
if (readErrors.length > 0) summary.checkpointReady = false;
console.log(JSON.stringify(summary, null, 2));
console.error(
  `affected shadow: ${summary.samples}/30 valid; ${summary.escapes.length} escape(s); ` +
    `${summary.missingScenarios.length} missing scenario(s); reuse DISABLED`,
);
process.exit(summary.invalid.length > 0 ? 2 : 0);
