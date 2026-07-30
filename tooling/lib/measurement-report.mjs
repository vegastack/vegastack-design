import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { arch, cpus, hostname, platform, release } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";

import { ROOT } from "./change-set.mjs";

export const MEASUREMENT_SCHEMA = "vegastack.measurement/v1";
export const MEASUREMENT_CLASSES = new Set([
  "measured",
  "api-reported",
  "modeled",
  "estimate",
  "unknown",
]);

const GENERATION_INPUTS = [
  "package.json",
  "pnpm-lock.yaml",
  "tooling/gates.mjs",
  "tooling/gates-retry.mjs",
  "tooling/gates-affected.mjs",
  "tooling/contracts-run.mjs",
  "tooling/vitest-run.mjs",
  "tooling/vitest-structured-reporter.mjs",
  "tooling/lib/change-set.mjs",
  "tooling/lib/gate-profile.mjs",
  "tooling/lib/gate-receipt.mjs",
  "tooling/lib/gate-reuse.mjs",
  "tooling/lib/gate-impact.mjs",
  "tooling/lib/retry-plan.mjs",
  "tooling/lib/measurement-report.mjs",
  "tooling/lib/route-scope.mjs",
  "tooling/lib/smoke-scope.mjs",
  "packages/ui/component-contracts.json",
  "packages/ui/vitest.config.ts",
  "packages/ui/vitest.smoke.config.ts",
  "packages/ui/vitest.all-browsers.config.ts",
  "packages/ui/smoke-impact.generated.json",
  "packages/ui/contract-smoke-tests.generated.json",
  "packages/ui/registry.json",
  "turbo.json",
  "apps/docs/playwright.config.ts",
];

function toolingGenerationInputs(directory = join(ROOT, "tooling")) {
  const found = [];
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      const absolute = join(current, name);
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) walk(absolute);
      else if (stat.isFile() && name.endsWith(".mjs"))
        found.push(absolute.slice(ROOT.length + 1));
    }
  };
  walk(directory);
  return found;
}

export function generationInputPaths() {
  return [
    ...new Set([...GENERATION_INPUTS, ...toolingGenerationInputs()]),
  ].sort();
}

function fingerprintPath(relativePath, contentOverride) {
  if (contentOverride?.has(relativePath))
    return Buffer.from(
      `${relativePath}\0override\0${0}\0${contentOverride.get(relativePath)}\n`,
    );
  const path = join(ROOT, relativePath);
  if (!existsSync(path)) return `${relativePath}\0missing\n`;
  const stat = lstatSync(path);
  const type = stat.isSymbolicLink()
    ? "symlink"
    : stat.isFile()
      ? "file"
      : "other";
  const content = stat.isSymbolicLink()
    ? Buffer.from(readlinkSync(path))
    : stat.isFile()
      ? readFileSync(path)
      : Buffer.alloc(0);
  return Buffer.concat([
    Buffer.from(`${relativePath}\0${type}\0${stat.mode.toString(8)}\0`),
    content,
    Buffer.from("\n"),
  ]);
}

export function gateGeneration({ contentOverride } = {}) {
  const digest = createHash("sha256");
  for (const path of generationInputPaths())
    digest.update(fingerprintPath(path, contentOverride));
  return `gate-v1-${digest.digest("hex")}`;
}

export function localEnvironment({ osRelease = release() } = {}) {
  const runnerType = process.env.GITHUB_ACTIONS
    ? process.env.RUNNER_ENVIRONMENT === "github-hosted"
      ? "github-hosted"
      : "self-hosted"
    : "local";
  const cpu = cpus()[0]?.model ?? "unknown";
  const profile = [
    platform(),
    osRelease,
    arch(),
    process.versions.node,
    runnerType,
    cpu,
  ]
    .join("|")
    .replace(/\s+/g, "-");
  return {
    profile,
    runnerType,
    runnerId: process.env.RUNNER_NAME ?? hostname(),
    platform: platform(),
    osRelease,
    arch: arch(),
    node: process.version,
    cpu,
    logicalCpuCount: cpus().length,
  };
}

export function newRunId(mode) {
  return `${new Date().toISOString().replaceAll(":", "-")}-${mode}-${randomUUID()}`;
}

export function validateMeasurement(report) {
  const errors = [];
  if (!report || typeof report !== "object")
    return ["report must be an object"];
  if (report.schema !== MEASUREMENT_SCHEMA)
    errors.push(`schema must be ${MEASUREMENT_SCHEMA}`);
  for (const field of ["generation", "runId", "kind", "mode", "segment"])
    if (typeof report[field] !== "string" || report[field].length === 0)
      errors.push(`${field} must be a nonempty string`);
  if (!MEASUREMENT_CLASSES.has(report.measurementClass))
    errors.push("measurementClass is not recognized");
  if (!["pass", "fail", "skipped", "unknown"].includes(report.status))
    errors.push("status is not recognized");
  if (!Number.isFinite(report.durationMs) || report.durationMs < 0)
    errors.push("durationMs must be a nonnegative finite number");
  if (!Number.isInteger(report.retryCount) || report.retryCount < 0)
    errors.push("retryCount must be a nonnegative integer");
  if (!report.environment || typeof report.environment !== "object")
    errors.push("environment must be an object");
  else if (
    typeof report.environment.profile !== "string" ||
    report.environment.profile.length === 0
  )
    errors.push("environment.profile must be a nonempty string");
  if (!report.cache || typeof report.cache.state !== "string")
    errors.push("cache.state must be explicit");
  if (Number.isNaN(Date.parse(report.startedAt)))
    errors.push("startedAt must be an ISO timestamp");
  if (Number.isNaN(Date.parse(report.completedAt)))
    errors.push("completedAt must be an ISO timestamp");
  return errors;
}

export function cohortKey(report) {
  return JSON.stringify({
    schema: report.schema,
    generation: report.generation,
    kind: report.kind,
    mode: report.mode,
    segment: report.segment,
    measurementClass: report.measurementClass,
    environment: report.environment?.profile ?? "unknown",
    cache: report.cache?.state ?? "unknown",
    coldWarm: report.coldWarm ?? "unknown",
    routeCount: report.scope?.routeCount ?? null,
    checkCount: report.scope?.checkCount ?? null,
    engine: report.scope?.engine ?? null,
    engineCount: report.scope?.engineCount ?? null,
    testFileCount: report.scope?.testFileCount ?? null,
  });
}

function nearestRank(values, percentile) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

export function summarizeMeasurements(reports) {
  const cohorts = new Map();
  for (const report of reports) {
    const errors = validateMeasurement(report);
    if (errors.length > 0)
      throw new Error(
        `invalid measurement ${report?.runId ?? "(unknown)"}/${report?.segment ?? "(unknown)"}: ${errors.join("; ")}`,
      );
    const key = cohortKey(report);
    if (!cohorts.has(key)) cohorts.set(key, []);
    cohorts.get(key).push(report);
  }
  return [...cohorts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, samples]) => {
      const durations = samples.map((sample) => sample.durationMs);
      return {
        cohort: JSON.parse(key),
        sampleSize: samples.length,
        minMs: Math.min(...durations),
        p50Ms: nearestRank(durations, 0.5),
        p95Ms: nearestRank(durations, 0.95),
        maxMs: Math.max(...durations),
        runIds: samples.map((sample) => sample.runId).sort(),
      };
    });
}

export function atomicWriteJson(path, value, { immutable = false } = {}) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  const absolute = resolve(path);
  const gatesRoot = join(ROOT, ".gates");
  const withinGates = (() => {
    const rel = relative(gatesRoot, absolute);
    return rel !== ".." && !rel.startsWith(`..${sep}`);
  })();
  const assertParents = () => {
    if (!withinGates) return;
    const parts = relative(gatesRoot, dirname(absolute))
      .split(sep)
      .filter(Boolean);
    let cursor = gatesRoot;
    for (const part of ["", ...parts]) {
      if (part) cursor = join(cursor, part);
      if (!existsSync(cursor)) continue;
      const stat = lstatSync(cursor);
      if (stat.isSymbolicLink() || !stat.isDirectory())
        throw new Error(
          `measurement report parent is not a regular directory: ${cursor}`,
        );
    }
  };
  assertParents();
  mkdirSync(dirname(absolute), { recursive: true });
  assertParents();
  if (immutable && existsSync(path)) {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile())
      throw new Error(
        `immutable measurement key is not a regular file: ${path}`,
      );
    if (readFileSync(path, "utf8") === body) return;
    throw new Error(`conflicting immutable measurement key: ${path}`);
  }
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  let descriptor;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, body);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    if (immutable) {
      try {
        linkSync(temporary, path);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const stat = lstatSync(path);
        if (
          stat.isSymbolicLink() ||
          !stat.isFile() ||
          readFileSync(path, "utf8") !== body
        )
          throw new Error(`conflicting immutable measurement key: ${path}`);
      }
      unlinkSync(temporary);
    } else renameSync(temporary, path);
    // Persist the directory entry as well as the file contents. If the process or host stops after
    // rename, recovery sees either the old complete JSON or the new complete JSON, never a pass from
    // a partially durable write.
    let directoryDescriptor;
    try {
      directoryDescriptor = openSync(dirname(path), "r");
      fsyncSync(directoryDescriptor);
    } finally {
      if (directoryDescriptor !== undefined) closeSync(directoryDescriptor);
    }
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export function writeRunMeasurement(report) {
  const errors = validateMeasurement(report);
  if (errors.length > 0)
    throw new Error(`refusing invalid measurement: ${errors.join("; ")}`);
  const path = join(
    ROOT,
    ".gates/runs",
    report.runId,
    `${report.segment}.json`,
  );
  atomicWriteJson(path, report, { immutable: true });
  return path;
}
