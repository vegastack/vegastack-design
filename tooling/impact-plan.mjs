#!/usr/bin/env node

import { resolve } from "node:path";

import {
  defaultBaseRef,
  mergeBase,
  resolveCommit,
  ROOT,
  workingTreeChangeInventory,
  workingTreeContentHash,
} from "./lib/change-set.mjs";
import {
  affectedScenarioAttainability,
  planAffectedImpact,
} from "./lib/gate-impact.mjs";
import { atomicWriteJson } from "./lib/measurement-report.mjs";
import { validateDiagnosticReportPath } from "./lib/report-path.mjs";
import { reconcileGateTree } from "./lib/gate-tree.mjs";

const USAGE = `Usage: node tooling/impact-plan.mjs [options]

Explain the fail-closed dependency-aware local verification plan. This command is read-only unless
--report is supplied. Its result is diagnostic/shadow-only and never writes receipt evidence.

  --base <ref>       diff against this ref's merge-base (default: origin/main or main)
  --path <repo-path> classify an explicit path; repeat for controlled diagnostics
  --metadata-path <repo-path>
                     mark an explicit path as mode/type/symlink changed; repeat as needed
  --binary-path <repo-path>
                     mark an explicit path as binary content; repeat as needed
  --json             print the complete structured plan
  --report <path>    atomically retain the structured diagnostic report

Unknown, unmodeled, stale, metadata, or disagreeing inputs widen coverage. A selected or skipped
plan cannot satisfy production-full; final ship remains complete under current policy.`;

function fatal(message) {
  console.error(`impact-plan: ${message}`);
  process.exit(2);
}

function parse(argv) {
  const options = {
    base: defaultBaseRef(),
    paths: [],
    metadataPaths: [],
    binaryPaths: [],
    json: false,
    report: null,
  };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = () => {
      const next = argv[++index];
      if (!next) fatal(`${flag} requires a nonempty value`);
      return next;
    };
    if (flag === "--base") options.base = value();
    else if (flag === "--path") options.paths.push(value());
    else if (flag === "--metadata-path") options.metadataPaths.push(value());
    else if (flag === "--binary-path") options.binaryPaths.push(value());
    else if (flag === "--json") options.json = true;
    else if (flag === "--report") {
      try {
        options.report = validateDiagnosticReportPath(
          resolve(ROOT, value()),
          "impact-plan report",
        );
      } catch (error) {
        fatal(error.message);
      }
    } else if (flag === "--help" || flag === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else fatal(`unknown option ${flag}\n\n${USAGE}`);
  }
  return options;
}

// performance.now() is process-relative. Starting at zero includes module loading, argument parsing,
// inventory, all graph passes, and the final exact-tree reconciliation in the scheduler overhead.
const planningStarted = 0;
const options = parse(process.argv.slice(2));
const planningStartTree = workingTreeContentHash();
const baseSha = resolveCommit(options.base);
if (!baseSha) fatal(`base ref does not resolve to a commit: ${options.base}`);
const rangeStart = mergeBase(baseSha, "HEAD") ?? baseSha;
const explicitPaths = [
  ...new Set([
    ...options.paths,
    ...options.metadataPaths,
    ...options.binaryPaths,
  ]),
].sort();
const inventory = explicitPaths.length
  ? {
      base: rangeStart,
      allChanged: explicitPaths,
      changedFiles: explicitPaths,
      entries: explicitPaths.map((path) => ({
        path,
        changeKind: options.metadataPaths.includes(path)
          ? "explicit-metadata"
          : options.binaryPaths.includes(path)
            ? "explicit-binary"
            : "explicit-diagnostic",
        metadataChanged: options.metadataPaths.includes(path),
        binaryChanged: options.binaryPaths.includes(path),
      })),
      metadataChanged: new Set(options.metadataPaths),
      binaryChanged: new Set(options.binaryPaths),
    }
  : workingTreeChangeInventory(rangeStart);
let plan;
let tree;
let selectorDurationMs;
let attainability;
let attainabilityDurationMs;
let planningDurationMs;
try {
  const selectorStarted = performance.now();
  plan = planAffectedImpact(inventory.changedFiles, {
    metadataChanged: inventory.metadataChanged,
    binaryChanged: inventory.binaryChanged,
  });
  selectorDurationMs =
    Math.round((performance.now() - selectorStarted) * 1000) / 1000;
  const attainabilityStarted = performance.now();
  attainability = affectedScenarioAttainability({ externalTreeEnvelope: true });
  attainabilityDurationMs =
    Math.round((performance.now() - attainabilityStarted) * 1000) / 1000;
  tree = reconcileGateTree(planningStartTree, workingTreeContentHash()).hash;
  planningDurationMs =
    Math.round((performance.now() - planningStarted) * 1000) / 1000;
} catch (error) {
  fatal(error.message);
}
const report = {
  schema: 1,
  generation: "dynamic-impact-plan-v1",
  recordedAt: new Date().toISOString(),
  state: "diagnostic-shadow-only",
  evidenceWritten: false,
  receiptWritten: false,
  productionEligible: false,
  tree,
  base: { ref: options.base, sha: rangeStart },
  inventory: {
    ...inventory,
    metadataChanged: [...inventory.metadataChanged].sort(),
    binaryChanged: [...inventory.binaryChanged].sort(),
  },
  plan,
  measurements: {
    class: "measured",
    planningDurationMs,
    selectorDurationMs,
    attainabilityDurationMs,
    changedPaths: inventory.changedFiles.length,
    widenedPaths: plan.unknownPaths.length,
    importGraphSources: plan.oracles.importGraph.sourceCount,
    importGraphEdges: plan.oracles.importGraph.edgeCount,
  },
  rollout: {
    selectedExecutionEnabled: false,
    dynamicPrePushEnabled: false,
    dynamicProductionEnabled: false,
    scenarioAttainability: attainability,
    nextCheckpoint:
      "Do not collect a qualifying cohort while the foundation scenario has no agreeing >6-route fixture. Review gates:affected:status and resolve that authority/policy blocker with MK first; D7 remains separate for production.",
  },
};
if (options.report) atomicWriteJson(options.report, report);
if (options.json) console.log(JSON.stringify(report, null, 2));
else {
  console.log(
    `impact-plan: SHADOW ONLY — ${inventory.changedFiles.length} substantive path(s), selector ${plan.selectorDigest.slice(0, 12)}; total planning ${planningDurationMs}ms (impact ${selectorDurationMs}ms, checkpoint analysis ${attainabilityDurationMs}ms)`,
  );
  const scope = (lane) => {
    const entries = [
      ...(lane.files ?? []),
      ...(lane.routes ?? []),
      ...(lane.fullPageRoutes ?? []),
      ...(lane.items ?? []),
      ...(lane.layouts ?? []),
    ];
    if (lane.icons) entries.push("animated-icons");
    return entries.length === 0
      ? ""
      : ` — ${entries.length} leaf/leaves: ${entries.slice(0, 4).join(", ")}${entries.length > 4 ? ", …" : ""}`;
  };
  for (const [name, lane] of Object.entries(plan.lanes))
    console.log(
      `  ${name.padEnd(13)} ${lane.mode.padEnd(15)} ${lane.state} (${lane.reasonCode})${scope(lane)}`,
    );
  for (const reason of plan.reasons) console.log(`  reason        ${reason}`);
  const disagreements = [
    ...plan.oracles.importGraph.comparisons,
    ...plan.oracles.vitestRelated.comparisons,
  ].filter((comparison) => comparison.disagreement || comparison.widenedToFull);
  for (const disagreement of disagreements)
    console.log(
      `  disagreement  ${disagreement.path}: ${disagreement.widenedToFull ? "widened full" : "reported"}`,
    );
  if (plan.unknownPaths.length > 0)
    console.log(`  widened       ${plan.unknownPaths.join(", ")}`);
  if (!report.rollout.scenarioAttainability.foundation.attainable)
    console.log(
      `  checkpoint     BLOCKED — ${report.rollout.scenarioAttainability.foundation.blocker}`,
    );
  console.log(
    "impact-plan: no execution, evidence, receipt, reuse, or production acceptance changed",
  );
}
