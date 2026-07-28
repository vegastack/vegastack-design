import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import { ROOT } from "./change-set.mjs";
import { smokeImpact } from "./smoke-scope.mjs";

const AUTHORITY = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
);
const RECORDS = [
  ...AUTHORITY.components,
  ...AUTHORITY.hooks,
  ...AUTHORITY.blocks,
];
const BY_NAME = new Map(RECORDS.map((record) => [record.name, record]));
const BY_FILE = new Map();
for (const record of RECORDS)
  for (const path of [
    ...(record.sourceFiles ?? []),
    ...(record.testFiles ?? []),
  ]) {
    BY_FILE.set(path, record);
    const mirror = /^packages\/ui\/registry\/(?:ui|blocks)\/(.+)$/.exec(path);
    if (mirror) BY_FILE.set(`apps/docs/components/ui/${mirror[1]}`, record);
  }

const DIRECT_DEPENDENTS = new Map();
for (const record of RECORDS)
  for (const dependency of record.registryDependencies ?? []) {
    const name = dependency.replace(/^@vegastack\//, "");
    if (!DIRECT_DEPENDENTS.has(name)) DIRECT_DEPENDENTS.set(name, new Set());
    DIRECT_DEPENDENTS.get(name).add(record.name);
  }

function dependentNames(name) {
  const reached = new Set([name]);
  const queue = [name];
  while (queue.length > 0)
    for (const dependent of DIRECT_DEPENDENTS.get(queue.pop()) ?? []) {
      if (reached.has(dependent)) continue;
      reached.add(dependent);
      queue.push(dependent);
    }
  return [...reached].sort();
}

function lane(mode = "none", extra = {}) {
  return { mode, ...extra };
}

function addSelected(target, key, values, mode = "selected") {
  if (target.mode === "full") return;
  if (target.mode === "none") target.mode = mode;
  if (target.mode !== mode && mode === "selected-shadow")
    target.mode = "selected-shadow";
  const current = new Set(target[key] ?? []);
  for (const value of values) current.add(value);
  target[key] = [...current].sort();
}

function makeFull(
  plan,
  reason,
  lanes = ["unit", "smoke", "all-browsers", "contracts", "consume"],
) {
  for (const name of lanes) plan.lanes[name] = lane("full");
  plan.reasons.push(reason);
}

const KNOWN_PROSE = [
  /^docs\//,
  /^skills\//,
  /^\.agents\/skills\//,
  /^\.claude\/skills\//,
  /(^|\/)(AGENTS|CLAUDE|README)\.md$/,
  /^CHANGELOG\.md$/,
];
const KNOWN_WORKFLOW = [/^\.github\//, /^\.husky\//, /^\.changeset\//];
const GLOBAL_PRODUCT = [
  /^pnpm-lock\.yaml$/,
  /^package\.json$/,
  /^turbo\.json$/,
  /^packages\/design-tokens\//,
  /^packages\/design\//,
  /^apps\/docs\/app\//,
  /^apps\/docs\/(next|postcss|source)\.config/,
  /^apps\/docs\/playwright\.config\.ts$/,
  /^apps\/docs\/components\/ui\/index\.ts$/,
  /^apps\/docs\/components\/preview\/(index|utilities|wrapper)\.tsx$/,
  /^packages\/ui\/vitest(?:\.[\w-]+)?\.config\.ts$/,
  /^packages\/ui\/vitest\.setup\.ts$/,
];
const BROWSER_GATE_TOOLING = [
  /^tooling\/gates\.mjs$/,
  /^tooling\/lib\/gate-impact\.mjs$/,
  /^tooling\/lib\/gate-profile\.mjs$/,
];
const VITEST_TOOLING = [
  /^tooling\/vitest-(run|structured-reporter)\.mjs$/,
  /^tooling\/lib\/smoke-scope\.mjs$/,
  /^tooling\/sync-smoke-impact\.mjs$/,
];
const CONTRACT_TOOLING = [
  /^tooling\/contracts-run\.mjs$/,
  /^tooling\/lib\/route-scope\.mjs$/,
];
const CONSUME_TOOLING = [
  /^tooling\/verify-shadcn-consume\.mjs$/,
  /^tooling\/(registry-|verify-registry|verify-item|safe-path)/,
];
const KNOWN_NON_PRODUCT_TOOLING = [
  /^tooling\/(?:release-|verify-release|classify-change|gate-receipt|verify-gate-receipt)/,
  /^tooling\/(?:gate-reuse|verify-gate-reuse|gates-retry|verify-gate-retry)/,
  /^tooling\/lib\/(?:change-set|gate-receipt|gate-reuse|retry-plan|workflow-measurement|measurement-report)\.mjs$/,
  /^tooling\/(?:report-workflow|verify-workflow|summarize-benchmarks|verify-measurement|verify-operator-docs)/,
];

function staticAdd(plan, ...checks) {
  for (const check of checks) plan.staticChecks.add(check);
}

export function planAffectedImpact(
  changedFiles,
  { metadataChanged = new Set() } = {},
) {
  const plan = {
    schema: 1,
    shadowOnly: true,
    reuseEnabled: false,
    changedFiles: [...new Set(changedFiles)].sort(),
    unknownPaths: [],
    reasons: [],
    staticChecks: new Set(),
    boundaryChecks: new Set(),
    turboTasks: new Set(),
    lanes: {
      unit: lane(),
      smoke: lane(),
      "all-browsers": lane(),
      contracts: lane(),
      consume: lane(),
    },
  };

  for (const path of plan.changedFiles) {
    if (metadataChanged.has(path)) {
      plan.unknownPaths.push(path);
      makeFull(plan, `${path}: file type/mode/symlink metadata changed`);
      continue;
    }
    if (path === "apps/docs/public/_headers") {
      plan.boundaryChecks.add("build-public");
      plan.boundaryChecks.add("deployment-boundaries");
      plan.turboTasks.add("@vegastack/docs#build");
      staticAdd(plan, "headers", "prettier");
      plan.reasons.push(`${path}: exact HTTP boundary authority (shadow)`);
      continue;
    }
    if (GLOBAL_PRODUCT.some((pattern) => pattern.test(path))) {
      makeFull(plan, `${path}: global product/toolchain input`);
      plan.turboTasks.add("build");
      plan.turboTasks.add("lint");
      plan.turboTasks.add("typecheck");
      continue;
    }
    if (BROWSER_GATE_TOOLING.some((pattern) => pattern.test(path))) {
      makeFull(plan, `${path}: browser gate definition changed`);
      staticAdd(plan, "gate-negative", "prettier");
      continue;
    }
    if (VITEST_TOOLING.some((pattern) => pattern.test(path))) {
      makeFull(plan, `${path}: Vitest gate definition changed`, [
        "unit",
        "smoke",
        "all-browsers",
      ]);
      staticAdd(plan, "gate-negative", "prettier");
      continue;
    }
    if (CONTRACT_TOOLING.some((pattern) => pattern.test(path))) {
      makeFull(plan, `${path}: contract gate definition changed`, [
        "contracts",
      ]);
      staticAdd(plan, "gate-negative", "prettier");
      continue;
    }
    if (CONSUME_TOOLING.some((pattern) => pattern.test(path))) {
      makeFull(plan, `${path}: consume/registry gate definition changed`, [
        "consume",
      ]);
      staticAdd(plan, "registry-negative", "prettier");
      continue;
    }
    if (KNOWN_NON_PRODUCT_TOOLING.some((pattern) => pattern.test(path))) {
      staticAdd(plan, "gate-negative", "prettier");
      plan.reasons.push(`${path}: declared non-product gate tooling`);
      continue;
    }
    if (path.startsWith("tooling/")) {
      plan.unknownPaths.push(path);
      makeFull(plan, `${path}: unmodeled tooling dependency`);
      continue;
    }
    if (KNOWN_WORKFLOW.some((pattern) => pattern.test(path))) {
      staticAdd(plan, "prettier", "workflow-security");
      plan.reasons.push(`${path}: workflow/hook/release metadata`);
      continue;
    }
    if (
      KNOWN_PROSE.some((pattern) => pattern.test(path)) ||
      path.endsWith(".md")
    ) {
      staticAdd(plan, "operator-docs", "prettier", "skill-lint");
      plan.reasons.push(`${path}: prose/operator surface`);
      continue;
    }
    if (/^apps\/docs\/public\/r\/.+\.json$/.test(path)) {
      plan.lanes.consume = lane("full");
      staticAdd(plan, "registry-idempotency", "registry-integrity");
      plan.reasons.push(`${path}: generated registry output`);
      continue;
    }
    if (
      path === "packages/ui/registry.json" ||
      path === "packages/ui/component-contracts.json"
    ) {
      makeFull(plan, `${path}: dependency/coverage authority changed`);
      staticAdd(plan, "registry-idempotency", "registry-integrity");
      continue;
    }
    if (path === "packages/ui/smoke-impact.generated.json") {
      plan.lanes.smoke = lane("full");
      staticAdd(plan, "derived-check", "smoke-scope-negative");
      plan.reasons.push(`${path}: Vitest-related smoke authority changed`);
      continue;
    }
    const record = BY_FILE.get(path);
    if (record) {
      const isTest = (record.testFiles ?? []).includes(path);
      if (isTest) addSelected(plan.lanes.unit, "files", [path]);
      else {
        const reached = dependentNames(record.name).map((name) =>
          BY_NAME.get(name),
        );
        addSelected(
          plan.lanes.unit,
          "files",
          reached.flatMap((entry) => entry?.testFiles ?? []),
        );
        addSelected(
          plan.lanes.contracts,
          "routes",
          reached.map((entry) => entry?.docsSlug).filter(Boolean),
        );
        addSelected(
          plan.lanes.consume,
          "items",
          reached.map((entry) => entry?.name).filter(Boolean),
          "selected-shadow",
        );
        plan.lanes.consume.execution = "deferred-to-production-full-oracle";
      }
      addSelected(
        plan.lanes["all-browsers"],
        "files",
        isTest ? [path] : (plan.lanes.unit.files ?? []),
      );
      const smoke = smokeImpact([path]);
      if (smoke.full) plan.lanes.smoke = lane("full");
      else if (smoke.required)
        addSelected(plan.lanes.smoke, "files", smoke.tests);
      plan.turboTasks.add("@vegastack/ui#lint");
      plan.turboTasks.add("@vegastack/ui#typecheck");
      plan.reasons.push(`${path}: ${record.name} reverse-dependency closure`);
      continue;
    }
    const content = /^apps\/docs\/content\/(.+)\.mdx$/.exec(path);
    const preview = /^apps\/docs\/components\/preview\/([^/]+)\.tsx$/.exec(
      path,
    );
    if (content || preview) {
      const candidate = content
        ? `/${content[1].replace(/\/index$/, "")}`
        : BY_NAME.get(preview[1])?.docsSlug;
      if (
        candidate &&
        AUTHORITY.components.some((entry) => entry.docsSlug === candidate)
      )
        addSelected(plan.lanes.contracts, "routes", [candidate]);
      else if (content) {
        staticAdd(plan, "content-lint", "links", "prettier");
        plan.reasons.push(`${path}: non-component docs content`);
      } else {
        plan.unknownPaths.push(path);
        makeFull(plan, `${path}: unmodeled docs fixture`);
      }
      plan.turboTasks.add("@vegastack/docs#build");
      continue;
    }
    if (/^packages\/ui\/registry\/.+\.[cm]?[jt]sx?$/.test(path)) {
      plan.unknownPaths.push(path);
      makeFull(plan, `${path}: unmodeled registry source/test`);
      continue;
    }
    if (
      /(^|\/)package\.json$/.test(path) ||
      /(^|\/)tsconfig[^/]*\.json$/.test(path)
    ) {
      makeFull(plan, `${path}: package/task configuration input`);
      plan.turboTasks.add("build");
      plan.turboTasks.add("lint");
      plan.turboTasks.add("typecheck");
      continue;
    }
    plan.unknownPaths.push(path);
    makeFull(plan, `${path}: unknown path widens all coverage`);
  }

  if (plan.changedFiles.length === 0) plan.reasons.push("no changed files");
  return {
    ...plan,
    staticChecks: [...plan.staticChecks].sort(),
    boundaryChecks: [...plan.boundaryChecks].sort(),
    turboTasks: [...plan.turboTasks].sort(),
    unknownPaths: [...new Set(plan.unknownPaths)].sort(),
  };
}

const PACKAGE_DIRS = [
  "apps/docs",
  "config/eslint-config",
  "config/typescript-config",
  "packages/design",
  "packages/design-tokens",
  "packages/ui",
];

function manifests(root = ROOT) {
  return PACKAGE_DIRS.map((directory) => {
    const path = join(root, directory, "package.json");
    return { directory, manifest: JSON.parse(readFileSync(path, "utf8")) };
  });
}

function externalReferences(scripts, task, directory) {
  const queue = [task, `pre${task}`, `post${task}`];
  const visited = new Set();
  const references = new Set();
  while (queue.length > 0) {
    const name = queue.shift();
    if (visited.has(name) || typeof scripts[name] !== "string") continue;
    visited.add(name);
    const script = scripts[name];
    const matched = [
      ...script.matchAll(/(?:\.\.\/)+tooling\/[\w./-]+\.mjs/g),
    ].map(([value]) => value);
    const residual = matched.reduce(
      (remaining, value) => remaining.replaceAll(value, ""),
      script,
    );
    if (residual.includes("tooling/"))
      throw new Error(
        `${directory}#${name}: dynamic or unparsed tooling reference is forbidden`,
      );
    for (const value of matched) {
      const absolute = resolve(ROOT, directory, value);
      const repoPath = relative(ROOT, absolute).split(sep).join("/");
      if (!repoPath.startsWith("tooling/"))
        throw new Error(
          `${directory}#${name}: external tool escapes tooling/: ${value}`,
        );
      references.add(repoPath);
    }
    for (const match of script.matchAll(/pnpm (?:run )?([\w:-]+)/g))
      queue.push(match[1]);
  }
  return references;
}

function relativeImports(path, source) {
  return [...source.matchAll(/(?:from\s+|import\s*\()?["'](\.[^"']+)["']/g)]
    .map(([, specifier]) => specifier)
    .filter(Boolean)
    .map((specifier) => {
      let absolute = resolve(ROOT, dirname(path), specifier);
      if (!existsSync(absolute) && existsSync(`${absolute}.mjs`))
        absolute = `${absolute}.mjs`;
      return relative(ROOT, absolute).split(sep).join("/");
    })
    .filter(
      (entry) => entry.startsWith("tooling/") && existsSync(join(ROOT, entry)),
    );
}

export function validateTurboScriptInventory(options = {}) {
  if (options.scripts) {
    externalReferences(options.scripts, "build", ".");
    return { references: 0, tasks: 1 };
  }
  let references = 0;
  let tasks = 0;
  for (const { directory, manifest } of manifests(options.root ?? ROOT))
    for (const task of ["build", "lint", "test", "typecheck"])
      if (manifest.scripts?.[task]) {
        references += externalReferences(
          manifest.scripts,
          task,
          directory,
        ).size;
        tasks++;
      }
  return { references, tasks };
}

export function proposedTurboExternalInputs(taskId) {
  const split = taskId.lastIndexOf("#");
  if (split < 1)
    throw new Error(`Turbo task ID must be package#task: ${taskId}`);
  const packageName = taskId.slice(0, split);
  const task = taskId.slice(split + 1);
  const found = manifests().find(
    ({ manifest }) => manifest.name === packageName,
  );
  if (!found) throw new Error(`unknown Turbo package ${packageName}`);
  const roots = externalReferences(
    found.manifest.scripts ?? {},
    task,
    found.directory,
  );
  const closure = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const path = queue.shift();
    if (closure.has(path)) continue;
    if (!existsSync(join(ROOT, path)))
      throw new Error(
        `${taskId}: referenced external input is missing: ${path}`,
      );
    closure.add(path);
    const source = readFileSync(join(ROOT, path), "utf8");
    for (const imported of relativeImports(path, source)) queue.push(imported);
  }
  return [...closure].sort();
}

function fileFact(path, contentOverride) {
  const override = contentOverride?.get(path);
  if (override !== undefined)
    return { path, type: "override", mode: 0, content: String(override) };
  const absolute = join(ROOT, path);
  const stat = lstatSync(absolute);
  return {
    path,
    type: stat.isSymbolicLink() ? "symlink" : stat.isFile() ? "file" : "other",
    mode: stat.mode & 0o777,
    content: stat.isSymbolicLink()
      ? readlinkSync(absolute)
      : readFileSync(absolute),
  };
}

export function turboExternalFingerprint(taskId, { contentOverride } = {}) {
  const hash = createHash("sha256");
  hash.update(`vega-turbo-shadow-v1\0${taskId}\0`);
  for (const path of proposedTurboExternalInputs(taskId)) {
    const fact = fileFact(path, contentOverride);
    hash.update(`${fact.path}\0${fact.type}\0${fact.mode}\0`);
    hash.update(fact.content);
    hash.update("\0");
  }
  if (taskId === "@vegastack/docs#build")
    hash.update(`SITE_VISIBILITY=${process.env.SITE_VISIBILITY ?? ""}\0`);
  return hash.digest("hex");
}

export function turboShadowSnapshot(taskIds) {
  validateTurboScriptInventory();
  return {
    coverage:
      "direct package-script tooling roots plus transitive relative imports",
    activationEligible: false,
    activationBlocker:
      "root data/config reads and dynamically resolved inputs need an explicit complete inventory and mutation proof",
    tasks: Object.fromEntries(
      [...new Set(taskIds)]
        .filter((taskId) => taskId.includes("#"))
        .sort()
        .map((taskId) => [
          taskId,
          {
            externalInputs: proposedTurboExternalInputs(taskId),
            externalFingerprint: turboExternalFingerprint(taskId),
          },
        ]),
    ),
  };
}

export const REQUIRED_AFFECTED_SCENARIOS = [
  "prose",
  "workflow",
  "unit-failure",
  "smoke-failure",
  "one-route",
  "foundation",
  "header",
  "registry-graph",
  "global",
];

export function affectedScenarioCandidates(
  changedFiles,
  plan,
  priorFailure = null,
) {
  const candidates = new Set();
  if (
    changedFiles.length > 0 &&
    changedFiles.every(
      (path) =>
        KNOWN_PROSE.some((pattern) => pattern.test(path)) ||
        /^apps\/docs\/content\/.+\.mdx$/.test(path) ||
        path.endsWith(".md"),
    )
  )
    candidates.add("prose");
  if (
    changedFiles.some((path) =>
      KNOWN_WORKFLOW.some((pattern) => pattern.test(path)),
    )
  )
    candidates.add("workflow");
  if (changedFiles.includes("apps/docs/public/_headers"))
    candidates.add("header");
  if (plan.lanes.contracts.mode === "selected") {
    if (plan.lanes.contracts.routes?.length === 1) candidates.add("one-route");
    if ((plan.lanes.contracts.routes?.length ?? 0) > 6)
      candidates.add("foundation");
  }
  if (plan.lanes.consume.mode === "selected-shadow")
    candidates.add("registry-graph");
  if (Object.values(plan.lanes).some((entry) => entry.mode === "full"))
    candidates.add("global");
  const failed = new Set(
    (priorFailure?.failures ?? [])
      .filter((entry) => entry.status === "fail")
      .map((entry) => entry.id),
  );
  if (failed.has("unit")) candidates.add("unit-failure");
  if (failed.has("smoke")) candidates.add("smoke-failure");
  return [...candidates].sort();
}

function affectedTargetCovered(target, plan) {
  if (target.kind === "vitest") {
    const lane = plan.lanes[target.lane];
    return lane?.mode === "full" || lane?.files?.includes(target.file);
  }
  if (target.kind === "contract") {
    const lane = plan.lanes.contracts;
    return lane.mode === "full" || lane.routes?.includes(target.route);
  }
  return false;
}

export function affectedOracleEscapes(plan, failure) {
  const escapes = [];
  for (const entry of failure.failures ?? []) {
    if (["registry", "consume"].includes(entry.id)) {
      if (plan.lanes.consume.mode !== "full")
        escapes.push(
          `${entry.id}: current consume report is not granular enough to prove a selected item cone`,
        );
      continue;
    }
    if (["unit", "smoke", "all-browsers", "contracts"].includes(entry.id)) {
      const targets = (failure.retryTargets ?? []).filter((target) =>
        entry.id === "contracts"
          ? target.kind === "contract"
          : target.lane === entry.id,
      );
      if (targets.length === 0)
        escapes.push(`${entry.id}: failure has no exact structured target`);
      else
        for (const target of targets)
          if (!affectedTargetCovered(target, plan))
            escapes.push(
              `${entry.id}: ${JSON.stringify(target)} is outside predicted cone`,
            );
      continue;
    }
    const expectedTurbo = plan.turboTasks.some(
      (task) => task === entry.id || task.endsWith(`#${entry.id}`),
    );
    if (!expectedTurbo)
      escapes.push(
        `${entry.id}: non-browser failure was not selected by the shadow plan`,
      );
  }
  return escapes;
}

export function summarizeAffectedSamples(samples) {
  const byId = new Map();
  const invalid = [];
  for (const [index, sample] of samples.entries()) {
    if (
      !sample ||
      sample.schema !== 1 ||
      sample.generation !== "affected-shadow-v1" ||
      typeof sample.sampleId !== "string" ||
      !sample.sampleId ||
      !sample.oracle ||
      sample.checkpointEligible !== true ||
      sample.oracle.profile !== "production-full" ||
      sample.oracle.receiptUnchanged !== true ||
      sample.oracle.evidenceUnchanged !== true ||
      sample.oracle.treeUnchanged !== true ||
      !["pass", "fail"].includes(sample.oracle.status) ||
      sample.oracle.valid !== true ||
      !Array.isArray(sample.oracle.escapes) ||
      !Array.isArray(sample.scenarioCandidates) ||
      !sample.scenarioCandidates.includes(sample.scenario)
    ) {
      invalid.push(`sample ${index}: malformed, partial, or not executed`);
      continue;
    }
    const encoded = JSON.stringify(sample);
    if (byId.has(sample.sampleId)) {
      if (byId.get(sample.sampleId).encoded !== encoded)
        invalid.push(
          `sample ${sample.sampleId}: duplicate key has conflicting bytes`,
        );
      continue;
    }
    byId.set(sample.sampleId, { sample, encoded });
  }
  const valid = [...byId.values()].map(({ sample }) => sample);
  const escapes = valid.flatMap((sample) =>
    sample.oracle.escapes.map((escape) => ({
      sampleId: sample.sampleId,
      escape,
    })),
  );
  const scenarios = new Set(
    valid
      .map((sample) => sample.scenario)
      .filter((value) => value !== "unclassified"),
  );
  const missingScenarios = REQUIRED_AFFECTED_SCENARIOS.filter(
    (scenario) => !scenarios.has(scenario),
  );
  const checkpointReady =
    invalid.length === 0 &&
    valid.length >= 30 &&
    escapes.length === 0 &&
    missingScenarios.length === 0;
  return {
    schema: 1,
    samples: valid.length,
    pass: valid.filter((sample) => sample.oracle.status === "pass").length,
    predictedFailure: valid.filter((sample) => sample.oracle.status === "fail")
      .length,
    invalid,
    escapes,
    scenarios: [...scenarios].sort(),
    missingScenarios,
    checkpointReady,
    reuseEnabled: false,
    nextAction: checkpointReady
      ? "Ask MK to review the shadow evidence; do not enable reuse automatically."
      : "Keep reuse disabled and collect valid representative full-oracle samples.",
  };
}
