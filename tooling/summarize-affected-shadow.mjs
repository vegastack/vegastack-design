#!/usr/bin/env node

import { summarizeAffectedSamples } from "./lib/gate-impact.mjs";
import { loadAffectedSamples } from "./lib/affected-paths.mjs";

const { samples, errors: readErrors } = loadAffectedSamples();
const summary = summarizeAffectedSamples(samples);
summary.invalid.push(...readErrors);
if (readErrors.length > 0) summary.checkpointReady = false;
console.log(JSON.stringify(summary, null, 2));
console.error(
  `affected shadow: ${summary.samples}/30 valid; ${summary.escapes.length} escape(s); ` +
    `${summary.missingScenarios.length} missing scenario(s); reuse DISABLED`,
);
process.exit(summary.invalid.length > 0 ? 2 : 0);
