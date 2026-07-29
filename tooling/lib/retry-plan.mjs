import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { ROOT } from "./change-set.mjs";
import {
  BROWSER_ENGINES,
  CONTRACT_ASSERTIONS,
  CONTRACT_PROJECTS,
} from "./gate-profile.mjs";
import { COMPONENT_ROUTES } from "./route-scope.mjs";

const VITEST_LANES = new Set(["unit", "smoke", "all-browsers"]);
const CONTRACT_TITLES = new Set(
  COMPONENT_ROUTES.flatMap((route) =>
    CONTRACT_ASSERTIONS.map(({ title }) => `${route} ${title}`),
  ),
);

function reject(message) {
  throw new Error(`gate retry: ${message}`);
}

export function fingerprintRetryEvidence(path) {
  if (!existsSync(path)) return "missing";
  const rootStat = lstatSync(path);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink())
    reject("evidence root must be a regular directory, never a symlink");
  const digest = createHash("sha256");
  const walk = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const entry = join(directory, name);
      const stat = lstatSync(entry);
      const key = relative(path, entry);
      const type = stat.isDirectory()
        ? "directory"
        : stat.isFile() && !stat.isSymbolicLink()
          ? "file"
          : "unsupported";
      digest.update(`${key}\0${type}\0${stat.mode.toString(8)}\0`);
      if (type === "directory") walk(entry);
      else if (type === "file") digest.update(readFileSync(entry));
      else reject(`evidence contains an unsupported or symlink entry: ${key}`);
    }
  };
  walk(path);
  return digest.digest("hex");
}

function exactString(value, label) {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0)
    reject(`${label} must be one nonempty exact string`);
  return value;
}

export function validateRetryTarget(target, { root = ROOT } = {}) {
  if (!target || typeof target !== "object" || Array.isArray(target))
    reject("target must be an object");
  if (target.kind === "vitest") {
    const lane = exactString(target.lane, "Vitest lane");
    if (!VITEST_LANES.has(lane)) reject(`unknown Vitest lane ${lane}`);
    const file = exactString(target.file, "Vitest file");
    if (!file.startsWith("packages/ui/") || !/\.test\.[cm]?[jt]sx?$/.test(file))
      reject(`Vitest file must be a canonical packages/ui test path: ${file}`);
    const absolute = resolve(root, file);
    const escaped = relative(root, absolute);
    if (
      escaped === ".." ||
      escaped.startsWith(`..${sep}`) ||
      resolve(root, escaped) !== absolute
    )
      reject(`Vitest file is not canonical: ${file}`);
    if (!existsSync(absolute) || !lstatSync(absolute).isFile())
      reject(`Vitest target is missing or was renamed: ${file}`);
    const engine = exactString(target.engine, "Vitest engine");
    if (!BROWSER_ENGINES.includes(engine))
      reject(`unknown Vitest engine ${engine}`);
    if (lane === "unit" && engine !== "chromium")
      reject("the unit lane has only the chromium engine");
    const testName = exactString(target.testName, "Vitest test name");
    return { kind: "vitest", lane, file, engine, testName };
  }
  if (target.kind === "contract") {
    const route = exactString(target.route, "contract route");
    if (!COMPONENT_ROUTES.includes(route))
      reject(`unknown contract route ${route}`);
    const project = exactString(target.project, "contract project");
    if (!CONTRACT_PROJECTS.includes(project))
      reject(`unknown contract project ${project}`);
    const title = exactString(target.title, "contract title");
    if (!CONTRACT_TITLES.has(title) || !title.startsWith(`${route} `))
      reject(`contract title is not an exact assertion for ${route}`);
    return { kind: "contract", route, project, title };
  }
  reject(`unknown target kind ${JSON.stringify(target.kind)}`);
}

export function buildRetryPlan(failure, { root = ROOT, treeHash } = {}) {
  if (!failure || typeof failure !== "object")
    reject("last-failure report is missing or malformed");
  if (typeof treeHash !== "string" || failure.tree !== treeHash)
    reject(
      `last failure describes a different tree (${failure.tree ?? "missing"} versus ${treeHash ?? "missing"})`,
    );
  if (!Array.isArray(failure.retryTargets) || failure.retryTargets.length === 0)
    reject("last failure has no exact nonempty retry selector");
  const failedLanes = new Set(
    (failure.failures ?? [])
      .filter((entry) => entry?.status === "fail")
      .map((entry) => entry.id),
  );
  const targets = failure.retryTargets.map((target) =>
    validateRetryTarget(target, { root }),
  );
  for (const target of targets) {
    const lane = target.kind === "contract" ? "contracts" : target.lane;
    if (!failedLanes.has(lane))
      reject(
        `retry target ${lane} is not present in the original failed lanes`,
      );
  }
  const keys = targets.map((target) => JSON.stringify(target));
  if (new Set(keys).size !== keys.length)
    reject("last failure contains a duplicate retry selector");
  return {
    schema: 1,
    diagnosticOnly: true,
    sourceRunId: exactString(failure.runId, "source run ID"),
    sourceMode: exactString(failure.mode, "source mode"),
    tree: failure.tree,
    targets,
  };
}

export function retryCommand(target) {
  if (target.kind === "vitest")
    return {
      command: process.execPath,
      args: [
        resolve(ROOT, "tooling/vitest-run.mjs"),
        "--lane",
        target.lane,
        "--file",
        target.file,
        "--engine",
        target.engine,
        "--test-name",
        target.testName,
        "--diagnostic",
      ],
    };
  return {
    command: process.execPath,
    args: [
      resolve(ROOT, "tooling/contracts-run.mjs"),
      "--routes",
      target.route,
      "--project",
      target.project,
      "--title",
      target.title,
      "--diagnostic",
    ],
  };
}

export function retryInvocation(target, { report, retryId }) {
  exactString(report, "retry report path");
  exactString(retryId, "retry run ID");
  const invocation = retryCommand(target);
  return {
    ...invocation,
    args: [...invocation.args, "--report", report, "--run-id", retryId],
  };
}

export function validateRetryDiagnosticReport(
  report,
  target,
  { retryId, tree, generation, environmentProfile },
) {
  const problems = [];
  const fail = (message) => problems.push(message);
  if (!report || typeof report !== "object")
    return {
      valid: false,
      outcome: "unknown",
      problems: ["report missing/corrupt"],
    };
  const gate = target.kind === "contract" ? "contracts" : target.lane;
  if (report.gate !== gate) fail(`wrong gate ${report.gate ?? "missing"}`);
  if (report.runId !== retryId) fail("stale retry runId");
  if (report.generation !== generation) fail("stale retry generation");
  if (report.environmentProfile !== environmentProfile)
    fail("stale retry environment profile");
  if (
    report.treeBinding?.started !== tree ||
    report.treeBinding?.completed !== tree ||
    report.treeBinding?.unchanged !== true
  )
    fail("retry report is not bound to the unchanged tree");
  if (
    report.diagnosticOnly !== true ||
    report.evidenceWritten !== false ||
    report.receiptWritten !== false ||
    report.evidenceEligibility !== "diagnostic-only"
  )
    fail("retry report crossed its diagnostic evidence boundary");
  if (!new Set(["executed/pass", "executed/fail"]).has(report.state))
    fail(`retry terminal state is invalid: ${report.state}`);
  if (!Number.isInteger(report.executed) || report.executed !== 1)
    fail(`retry must execute exactly one leaf, got ${report.executed}`);
  if ((report.results?.skipped ?? 0) !== 0)
    fail("retry report contains a skipped leaf");
  const expectedPassed = report.state === "executed/pass" ? 1 : 0;
  const expectedFailed = report.state === "executed/fail" ? 1 : 0;
  if (
    report.results?.passed !== expectedPassed ||
    report.results?.failed !== expectedFailed
  )
    fail("retry pass/fail counts disagree with the terminal state");

  if (target.kind === "vitest") {
    if (report.selectedShadow !== false)
      fail("exact retry is not affected shadow execution");
    const leaves = report.executedLeaves ?? [];
    if (
      leaves.length !== 1 ||
      leaves[0]?.file !== target.file ||
      leaves[0]?.engine !== target.engine ||
      leaves[0]?.testName !== target.testName ||
      !new Set(["passed", "failed"]).has(leaves[0]?.status)
    )
      fail(
        "Vitest retry report does not contain the exact file/engine/test leaf",
      );
    else if (
      (leaves[0].status === "passed") !==
      (report.state === "executed/pass")
    )
      fail("Vitest retry leaf outcome disagrees with the terminal state");
    if (
      report.selection?.status !== "pass" ||
      report.selection?.plannedFiles?.length !== 1 ||
      report.selection.plannedFiles[0] !== target.file ||
      report.selection?.listedLeaves !== 1 ||
      report.selection?.executedLeaves !== 1
    )
      fail("Vitest retry selection reconciliation is missing or stale");
  } else {
    if (report.selectedShadow !== true)
      fail("contract retry must be selected diagnostic-only");
    if (
      report.scope?.routes?.length !== 1 ||
      report.scope.routes[0] !== target.route ||
      report.scope?.project !== target.project ||
      report.scope?.title !== target.title ||
      report.scope?.full !== false
    )
      fail("contract retry scope does not match route/project/title target");
    const leaf = report.leafEvidence?.executed?.leaves?.[0];
    if (
      report.leafEvidence?.executed?.executed !== 1 ||
      leaf?.route !== target.route ||
      leaf?.project !== target.project ||
      leaf?.title !== target.title ||
      !new Set(["passed", "failed"]).has(leaf?.outcome)
    )
      fail("contract retry report does not contain the exact runtime leaf");
    else if ((leaf.outcome === "passed") !== (report.state === "executed/pass"))
      fail("contract retry leaf outcome disagrees with the terminal state");
  }
  const outcome =
    problems.length > 0
      ? "unknown"
      : report.state === "executed/pass"
        ? "pass"
        : "fail";
  return { valid: problems.length === 0, outcome, problems };
}
