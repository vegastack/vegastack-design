import { existsSync, lstatSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

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
    ],
  };
}
