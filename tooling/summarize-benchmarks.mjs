#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { ROOT } from "./lib/change-set.mjs";
import {
  summarizeMeasurements,
  validateMeasurement,
} from "./lib/measurement-report.mjs";

const USAGE = `Usage: node tooling/summarize-benchmarks.mjs [--dir <path>] [--json]

Read-only summary of retained structured measurements. p50/p95 are calculated only inside cohorts
with the same implementation generation, environment profile, measurement class, cache/cold state,
mode, segment, engine, and route/check counts. Different cohorts are never silently combined.`;

let directory = join(ROOT, ".gates/runs");
let json = false;
for (let index = 2; index < process.argv.length; index++) {
  if (process.argv[index] === "--dir")
    directory = resolve(ROOT, process.argv[++index]);
  else if (process.argv[index] === "--json") json = true;
  else if (["--help", "-h"].includes(process.argv[index])) {
    console.log(USAGE);
    process.exit(0);
  } else {
    console.error(`unknown option: ${process.argv[index]}\n\n${USAGE}`);
    process.exit(2);
  }
}

function filesBelow(path) {
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...filesBelow(child));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(child);
  }
  return files;
}

if (!existsSync(directory)) {
  console.error(`no measurement directory: ${directory}`);
  process.exit(1);
}

const reports = [];
for (const file of filesBelow(directory).sort()) {
  let report;
  try {
    report = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`unreadable measurement ${file}: ${error.message}`);
    process.exit(1);
  }
  const errors = validateMeasurement(report);
  if (errors.length > 0) {
    console.error(`invalid measurement ${file}: ${errors.join("; ")}`);
    process.exit(1);
  }
  reports.push(report);
}
if (reports.length === 0) {
  console.error(`no measurement reports under ${directory}`);
  process.exit(1);
}

const summaries = summarizeMeasurements(reports);
if (json) console.log(JSON.stringify({ cohorts: summaries }, null, 2));
else {
  console.log(
    `benchmark cohorts: ${summaries.length} (${reports.length} retained measurement(s))`,
  );
  for (const summary of summaries) {
    const cohort = summary.cohort;
    console.log(
      `${cohort.mode}/${cohort.segment} n=${summary.sampleSize} p50=${summary.p50Ms}ms p95=${summary.p95Ms}ms ` +
        `generation=${cohort.generation.slice(0, 20)} environment=${cohort.environment} ` +
        `routes=${cohort.routeCount ?? "n/a"} checks=${cohort.checkCount ?? "n/a"} cache=${cohort.cache}`,
    );
  }
}
