import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import { ROOT, workingTreeContentHash } from "./change-set.mjs";
import {
  assertAuthorityFingerprint,
  authorityFingerprint,
} from "./authority-fingerprint.mjs";
import { buildConsumePlan } from "./consume-plan.mjs";
import {
  importDependencies,
  importImpact,
  repositoryImportGraph,
} from "./import-closure.mjs";
import {
  createRouteScopeModel,
  ROUTE_SCOPE_AUTHORITY_PATHS,
  selectRoutes,
} from "./route-scope.mjs";
import { gateGeneration, localEnvironment } from "./measurement-report.mjs";
import {
  createVitestImpactContext,
  smokeImpact,
  vitestImpact,
} from "./smoke-scope.mjs";

export const GATE_IMPACT_AUTHORITY_PATHS = [
  "packages/ui/component-contracts.json",
  "packages/ui/registry.json",
];

export function affectedCohortIdentity({
  turboVersion: overrideTurboVersion,
} = {}) {
  const importGraph = repositoryImportGraph({ fresh: true });
  const vitestContext = createVitestImpactContext({ fresh: true });
  const environment = localEnvironment();
  let turboVersion = overrideTurboVersion ?? null;
  if (overrideTurboVersion === undefined)
    try {
      const require = createRequire(join(ROOT, "package.json"));
      turboVersion = JSON.parse(
        readFileSync(require.resolve("turbo/package.json"), "utf8"),
      ).version;
    } catch {}
  const identity = {
    schema: 1,
    plannerGeneration: "dynamic-impact-shadow-v2",
    gateGeneration: gateGeneration(),
    environmentProfile: environment.profile,
    environment: {
      runnerType: environment.runnerType,
      platform: environment.platform,
      arch: environment.arch,
      node: environment.node,
      cpu: environment.cpu,
      logicalCpuCount: environment.logicalCpuCount,
    },
    toolchain: vitestContext.toolchain,
    toolchainDigest: vitestContext.toolchainDigest,
    turboVersion,
    authorities: {
      gateImpact: authorityFingerprint(GATE_IMPACT_AUTHORITY_PATHS),
      routeScope: authorityFingerprint(ROUTE_SCOPE_AUTHORITY_PATHS),
      vitestImpact: vitestContext.authorityFingerprint,
      vitestImpactInput: vitestContext.inputDigest,
      importGraphGeneration: importGraph.generation,
      importGraphDigest: importGraph.digest,
    },
  };
  return {
    ...identity,
    digest: createHash("sha256").update(JSON.stringify(identity)).digest("hex"),
  };
}

function createGateImpactAuthority() {
  const fingerprint = authorityFingerprint(GATE_IMPACT_AUTHORITY_PATHS);
  const contract = JSON.parse(
    readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
  );
  const registryItems = JSON.parse(
    readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8"),
  ).items;
  const records = [
    ...contract.components,
    ...contract.hooks,
    ...contract.blocks,
  ];
  const byName = new Map(records.map((record) => [record.name, record]));
  const byFile = new Map();
  for (const record of records)
    for (const path of [
      ...(record.sourceFiles ?? []),
      ...(record.testFiles ?? []),
    ]) {
      byFile.set(path, record);
      const mirror = /^packages\/ui\/registry\/(?:ui|blocks)\/(.+)$/.exec(path);
      if (mirror) byFile.set(`apps/docs/components/ui/${mirror[1]}`, record);
    }
  const directDependents = new Map();
  for (const record of records)
    for (const dependency of record.registryDependencies ?? []) {
      const name = dependency.replace(/^@vegastack\//, "");
      if (!directDependents.has(name)) directDependents.set(name, new Set());
      directDependents.get(name).add(record.name);
    }
  return {
    fingerprint,
    contract,
    registryItems,
    records,
    byName,
    byFile,
    directDependents,
    assertCurrent() {
      return assertAuthorityFingerprint(
        GATE_IMPACT_AUTHORITY_PATHS,
        fingerprint,
        "gate-impact authority",
      );
    },
  };
}

function dependentNames(name, directDependents) {
  const reached = new Set([name]);
  const queue = [name];
  while (queue.length > 0)
    for (const dependent of directDependents.get(queue.pop()) ?? []) {
      if (reached.has(dependent)) continue;
      reached.add(dependent);
      queue.push(dependent);
    }
  return [...reached].sort();
}

function importedFullPageRoute(path) {
  const content = /^apps\/docs\/content\/(.+)\.mdx$/.exec(path);
  if (content) return `/${content[1].replace(/\/index$/, "")}`;
  const page = /^apps\/docs\/app\/(.+\/)?page\.[cm]?[jt]sx?$/.exec(path);
  if (!page) return undefined;
  const segments = (page[1] ?? "")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\(.+\)$/.test(segment));
  if (segments.some((segment) => /[\[\]]/.test(segment))) return null;
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
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
  lanes = ["unit", "smoke", "all-browsers", "contracts", "vrt", "consume"],
) {
  for (const name of lanes) plan.lanes[name] = lane("full");
  plan.reasons.push(reason);
}

// These are semantic authorities, not filename heuristics. New locations and executable-looking
// neighbors must fall through to the unknown-path full oracle until they are explicitly modeled.
const KNOWN_PROSE = [
  /^docs\/(?:plans|ledger|research|audits)\/.*\.md$/,
  /^docs\/(?:README|RELEASING|requirements|gap-analysis)\.md$/,
  /^skills\/internal\/.*\.md$/,
  /^skills\/README\.md$/,
  /^\.agents\/skills\/internal\/.*\.md$/,
  /^\.claude\/skills\/internal\/.*\.md$/,
  /^(?:AGENTS|CLAUDE|README)\.md$/,
];
const KNOWN_WORKFLOW = [
  /^\.github\/workflows\/[^/]+\.ya?ml$/,
  /^\.github\/(?:CODEOWNERS|dependabot\.yml)$/,
  /^\.changeset\/(?:config\.json|README\.md|[^/]+\.md)$/,
];
const OPERATIONAL_PROSE = [
  /^docs\/(?:plans|ledger|research)\/.*\.md$/,
  /^skills\/internal\/.*\.md$/,
  /^\.agents\/skills\/internal\/.*\.md$/,
  /^\.claude\/skills\/internal\/.*\.md$/,
  /^(?:AGENTS|CLAUDE|README)\.md$/,
];
const PUBLIC_SKILL_INPUT = [/^skills\/public\//, /^packages\/design\/skills\//];
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
  /^tooling\/lib\/(?:authority-fingerprint|gate-report-validation|gate-tree|import-closure)\.mjs$/,
];
const VITEST_TOOLING = [
  /^tooling\/vitest-(run|structured-reporter)\.mjs$/,
  /^tooling\/lib\/(?:smoke-scope|vitest-selection)\.mjs$/,
  /^tooling\/sync-smoke-impact\.mjs$/,
];
const CONTRACT_TOOLING = [
  /^tooling\/contracts-run\.mjs$/,
  /^tooling\/lib\/contract-selection\.mjs$/,
];
const ROUTE_SCOPE_TOOLING = [/^tooling\/lib\/route-scope\.mjs$/];
const VRT_TOOLING = new Set([
  "tooling/vrt-review.mjs",
  "tooling/lib/vrt-selection.mjs",
  "tooling/sync-vrt-page-routes.mjs",
]);
const CONSUME_TOOLING = new Set([
  "tooling/registry-hash.mjs",
  "tooling/registry-header.mjs",
  "tooling/registry-request.mjs",
  "tooling/registry-stamp.mjs",
  "tooling/safe-path.mjs",
  "tooling/verify-item.mjs",
  "tooling/verify-registry-deps.mjs",
  "tooling/verify-registry-integrity-negative.mjs",
  "tooling/verify-shadcn-consume.mjs",
  "tooling/lib/consume-isolation.mjs",
  "tooling/lib/consume-plan.mjs",
]);
const KNOWN_NON_PRODUCT_TOOLING = new Set([
  "tooling/classify-change.mjs",
  "tooling/gate-receipt-carry.mjs",
  "tooling/gates-affected.mjs",
  "tooling/gates-digest.mjs",
  "tooling/gates-retry.mjs",
  "tooling/impact-plan.mjs",
  "tooling/release-classify.mjs",
  "tooling/release-state.mjs",
  "tooling/report-workflow-setup.mjs",
  "tooling/summarize-affected-shadow.mjs",
  "tooling/summarize-benchmarks.mjs",
  "tooling/verify-affected-oracle.mjs",
  "tooling/verify-change-inventory.mjs",
  "tooling/verify-classify-change.mjs",
  "tooling/verify-gate-impact.mjs",
  "tooling/verify-gate-receipt-negative.mjs",
  "tooling/verify-gate-receipt.mjs",
  "tooling/verify-gate-retry.mjs",
  "tooling/verify-impact-plan.mjs",
  "tooling/verify-measurement-report.mjs",
  "tooling/verify-operator-docs.mjs",
  "tooling/verify-release-chain.mjs",
  "tooling/verify-release-state.mjs",
  "tooling/verify-workflow-measurement.mjs",
  "tooling/verify-workflow-security-negative.mjs",
  "tooling/verify-workflow-security.mjs",
  "tooling/lib/affected-oracle.mjs",
  "tooling/lib/affected-paths.mjs",
  "tooling/lib/change-set.mjs",
  "tooling/lib/gate-receipt.mjs",
  "tooling/lib/gate-reuse.mjs",
  "tooling/lib/measurement-report.mjs",
  "tooling/lib/report-path.mjs",
  "tooling/lib/retry-plan.mjs",
  "tooling/lib/workflow-measurement.mjs",
]);
const GENERATED_NONRENDERED_AUTHORITY = [
  /^docs\/ledger\/component-matrix\.md$/,
  /^docs\/research\/design-md-audit\/(?:audit-register\.json|audits\/coverage\.json)$/,
  /^skills\/public\/vegastack-design-system\/references\/components\.md$/,
];

function staticAdd(plan, ...checks) {
  for (const check of checks) plan.staticChecks.add(check);
}

export function planAffectedImpact(
  changedFiles,
  { metadataChanged = new Set(), binaryChanged = new Set() } = {},
) {
  // Fresh on every plan: callers place this derivation inside an exact-tree envelope. Module-load
  // authority caches could otherwise bind a later tree to models read before the start snapshot.
  const authority = createGateImpactAuthority();
  const routeModel = createRouteScopeModel();
  const importGraph = repositoryImportGraph({ fresh: true });
  const vitestContext = createVitestImpactContext({ fresh: true });
  authority.assertCurrent();
  routeModel.assertCurrent();
  vitestContext.assertCurrent();
  const { contract: AUTHORITY, registryItems: REGISTRY_AUTHORITY } = authority;
  const { byName: BY_NAME, byFile: BY_FILE } = authority;
  const metadataPaths = new Set(metadataChanged);
  const plan = {
    schema: 1,
    generation: "dynamic-impact-shadow-v2",
    shadowOnly: true,
    reuseEnabled: false,
    executionEnabled: false,
    productionEligible: false,
    changedFiles: [...new Set(changedFiles)].sort(),
    fileFacts: [],
    unknownPaths: [],
    reasons: [],
    oracles: {
      importGraph: {
        generation: importGraph.generation,
        digest: importGraph.digest,
        sourceCount: importGraph.sources.length,
        edgeCount: importGraph.edges.length,
        issueCount: importGraph.issues.length,
        comparisons: [],
      },
      authorities: {
        gateImpact: authority.fingerprint,
        routeScope: routeModel.authorityFingerprint,
        vitestImpact: vitestContext.authorityFingerprint,
        vitestImpactInput: vitestContext.inputDigest,
        vitestToolchain: vitestContext.toolchainDigest,
      },
      routeScope: {},
      vitestRelated: { comparisons: [] },
    },
    staticChecks: new Set(),
    boundaryChecks: new Set(),
    turboTasks: new Set(),
    lanes: {
      unit: lane(),
      smoke: lane(),
      "all-browsers": lane(),
      contracts: lane(),
      vrt: lane(),
      consume: lane(),
    },
  };

  for (const path of plan.changedFiles) {
    const absolute = join(ROOT, path);
    if (!existsSync(absolute)) {
      metadataPaths.add(path);
      plan.fileFacts.push({ path, type: "missing", metadataChanged: true });
      continue;
    }
    const stat = lstatSync(absolute);
    const type = stat.isSymbolicLink()
      ? "symlink"
      : stat.isFile()
        ? "file"
        : stat.isDirectory()
          ? "directory"
          : "other";
    if (type !== "file") metadataPaths.add(path);
    const hash = createHash("sha256");
    hash.update(
      type === "symlink"
        ? readlinkSync(absolute)
        : type === "file"
          ? readFileSync(absolute)
          : type,
    );
    plan.fileFacts.push({
      path,
      type,
      mode: stat.mode & 0o777,
      sha256: hash.digest("hex"),
      metadataChanged: metadataPaths.has(path),
      binaryChanged: binaryChanged.has(path),
    });
  }

  for (const path of plan.changedFiles) {
    if (binaryChanged.has(path)) {
      plan.unknownPaths.push(path);
      makeFull(plan, `${path}: binary content cannot be dependency-modeled`);
      continue;
    }
    if (metadataPaths.has(path)) {
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
    if (path === "design.md") {
      staticAdd(plan, "design-sync", "prettier");
      plan.turboTasks.add("@vegastack/docs#build");
      addSelected(plan.lanes.vrt, "fullPageRoutes", [
        "/docs/foundations/colors",
        "/docs/foundations/elevation",
        "/docs/foundations/radius",
        "/docs/foundations/typography",
      ]);
      plan.reasons.push(`${path}: canonical generated docs authority`);
      continue;
    }
    if (path === "CHANGELOG.md") {
      staticAdd(plan, "changelog-lint", "changelog-sync", "prettier");
      plan.turboTasks.add("@vegastack/docs#build");
      addSelected(plan.lanes.vrt, "fullPageRoutes", ["/docs/changelog"]);
      plan.reasons.push(`${path}: canonical rendered changelog authority`);
      continue;
    }
    if (GENERATED_NONRENDERED_AUTHORITY.some((pattern) => pattern.test(path))) {
      staticAdd(plan, "derived-check", "prettier");
      if (path.startsWith("skills/public/")) {
        staticAdd(plan, "package-exports", "skill-lint", "skill-mirror");
        plan.turboTasks.add("@vegastack/design#build");
      }
      plan.reasons.push(`${path}: machine-owned component-derived output`);
      continue;
    }
    if (PUBLIC_SKILL_INPUT.some((pattern) => pattern.test(path))) {
      staticAdd(
        plan,
        "package-exports",
        "prettier",
        "skill-lint",
        "skill-mirror",
      );
      plan.turboTasks.add("@vegastack/design#build");
      plan.reasons.push(
        `${path}: public package skill input; shipped but non-rendered`,
      );
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
    if (ROUTE_SCOPE_TOOLING.some((pattern) => pattern.test(path))) {
      makeFull(plan, `${path}: contract/VRT route authority changed`, [
        "contracts",
        "vrt",
      ]);
      staticAdd(plan, "gate-negative", "prettier");
      continue;
    }
    if (VRT_TOOLING.has(path)) {
      makeFull(plan, `${path}: VRT selector/capture authority changed`, [
        "vrt",
      ]);
      staticAdd(plan, "derived-check", "gate-negative", "prettier");
      continue;
    }
    if (CONSUME_TOOLING.has(path)) {
      makeFull(plan, `${path}: consume/registry gate definition changed`, [
        "consume",
      ]);
      staticAdd(plan, "registry-negative", "prettier");
      continue;
    }
    if (KNOWN_NON_PRODUCT_TOOLING.has(path)) {
      staticAdd(plan, "gate-negative", "prettier");
      plan.reasons.push(`${path}: declared non-product gate tooling`);
      continue;
    }
    if (path.startsWith("tooling/")) {
      plan.unknownPaths.push(path);
      makeFull(plan, `${path}: unmodeled tooling dependency`);
      continue;
    }
    if (/^\.husky\//.test(path)) {
      staticAdd(plan, "hooks-installed", "prettier", "workflow-security");
      plan.reasons.push(`${path}: committed hook authority`);
      continue;
    }
    if (KNOWN_WORKFLOW.some((pattern) => pattern.test(path))) {
      staticAdd(plan, "prettier", "workflow-security");
      plan.reasons.push(`${path}: workflow/hook/release metadata`);
      continue;
    }
    if (KNOWN_PROSE.some((pattern) => pattern.test(path))) {
      staticAdd(plan, "operator-docs", "prettier", "skill-lint");
      plan.reasons.push(`${path}: prose/operator surface`);
      continue;
    }
    if (/^apps\/docs\/public\/r\/.+\.json$/.test(path)) {
      staticAdd(plan, "registry-idempotency", "registry-integrity");
      plan.reasons.push(
        `${path}: generated registry output; affected consume remains shadow-only`,
      );
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
      staticAdd(plan, "derived-check", "smoke-scope-negative");
      plan.reasons.push(
        `${path}: generated Vitest-related authority; freshness must pass before selected execution`,
      );
      continue;
    }
    if (path === "apps/docs/vrt/page-routes.generated.ts") {
      makeFull(plan, `${path}: complete rendered-page VRT authority changed`, [
        "vrt",
      ]);
      staticAdd(plan, "derived-check", "prettier");
      continue;
    }
    if (/^packages\/ui\/registry\/ui\/icons\/.+\.tsx$/.test(path)) {
      addSelected(plan.lanes.unit, "files", [
        "packages/ui/registry/ui/animated-icons.test.tsx",
      ]);
      addSelected(plan.lanes["all-browsers"], "files", [
        "packages/ui/registry/ui/animated-icons.test.tsx",
      ]);
      plan.lanes.vrt.icons = true;
      if (plan.lanes.vrt.mode === "none") plan.lanes.vrt.mode = "selected";
      staticAdd(
        plan,
        "animated-icons",
        "registry-idempotency",
        "registry-integrity",
      );
      plan.reasons.push(`${path}: modeled animated-icon member`);
      continue;
    }
    const record = BY_FILE.get(path);
    if (record) {
      if (path.startsWith("apps/docs/components/ui/"))
        staticAdd(plan, "registry-idempotency", "registry-integrity");
      const isTest = (record.testFiles ?? []).includes(path);
      const registryNames = isTest
        ? [record.name]
        : dependentNames(record.name, authority.directDependents);
      const imported = importImpact([path], importGraph);
      const selectedNames = [
        ...new Set([...registryNames, ...imported.owners]),
      ].sort();
      const oracleDisagreement =
        JSON.stringify([...registryNames].sort()) !==
        JSON.stringify(imported.owners);
      plan.oracles.importGraph.comparisons.push({
        path,
        registryOwners: registryNames,
        importOwners: imported.owners,
        selectedOwners: selectedNames,
        disagreement:
          JSON.stringify([...registryNames].sort()) !==
          JSON.stringify(imported.owners),
        widenedToFull: imported.full || (!isTest && oracleDisagreement),
        reasons: imported.reasons,
      });
      if (imported.full) {
        makeFull(
          plan,
          `${path}: import graph is incomplete (${imported.reasons.join("; ")})`,
        );
        staticAdd(plan, "import-closure-negative");
        continue;
      }
      if (!isTest && oracleDisagreement) {
        makeFull(
          plan,
          `${path}: registry/import dependency authorities disagree; current policy widens every product lane to full`,
        );
        staticAdd(plan, "import-closure-negative");
        continue;
      }
      if (isTest) addSelected(plan.lanes.unit, "files", [path]);
      else {
        const reached = selectedNames.map((name) => BY_NAME.get(name));
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
          plan.lanes.vrt,
          "routes",
          reached.map((entry) => entry?.docsSlug).filter(Boolean),
        );
        const importedPageRoutes = imported.files.map(importedFullPageRoute);
        const exactImportedPageRoutes = importedPageRoutes.filter(
          (route) => typeof route === "string",
        );
        // The docs catch-all module loads exact MDX pages. It is not itself an instruction to
        // capture every route when the same complete graph identifies the concrete MDX consumers.
        if (
          importedPageRoutes.includes(null) &&
          exactImportedPageRoutes.length === 0
        )
          makeFull(
            plan,
            `${path}: import closure reaches an unbounded docs app route`,
            ["vrt"],
          );
        else
          addSelected(
            plan.lanes.vrt,
            "fullPageRoutes",
            exactImportedPageRoutes,
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
      const vitest = vitestImpact([path], { context: vitestContext });
      plan.oracles.vitestRelated.comparisons.push({
        path,
        registryTests: isTest ? [path] : (plan.lanes.unit.files ?? []),
        selectedTests: vitest.tests,
        current: vitest.shadowCurrent,
        disagreement: vitest.disagreement,
        widenedToFull: vitest.full,
        reasons: vitest.reasons,
      });
      if (vitest.full) {
        plan.lanes.unit = lane("full");
        plan.lanes["all-browsers"] = lane("full");
        plan.reasons.push(
          `${path}: registry/import and Vitest-related unit authorities are stale or disagree`,
        );
      } else if (vitest.required) {
        addSelected(plan.lanes.unit, "files", vitest.tests);
        addSelected(plan.lanes["all-browsers"], "files", vitest.tests);
      }
      if (vitest.disagreement)
        plan.reasons.push(
          `${path}: registry/import and Vitest-related unit authorities disagree; unit and all-browser lanes widened to full`,
        );
      const smoke = smokeImpact([path], { context: vitestContext });
      if (smoke.full) plan.lanes.smoke = lane("full");
      else if (smoke.required)
        addSelected(plan.lanes.smoke, "files", smoke.tests);
      if (smoke.disagreement)
        plan.reasons.push(
          `${path}: registry and Vitest-related smoke authorities disagree; smoke widened to full`,
        );
      plan.turboTasks.add("@vegastack/ui#lint");
      plan.turboTasks.add("@vegastack/ui#typecheck");
      plan.reasons.push(
        `${path}: ${record.name} registry/import reverse-dependency union`,
      );
      continue;
    }
    const content = /^apps\/docs\/content\/(.+)\.mdx?$/.exec(path);
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
        const dependencies = importDependencies([path], importGraph);
        if (dependencies.full) {
          plan.unknownPaths.push(path);
          makeFull(
            plan,
            `${path}: rendered MDX dependency graph is incomplete (${dependencies.reasons.join("; ")})`,
          );
          continue;
        }
        staticAdd(plan, "content-lint", "links", "prettier");
        if (candidate)
          addSelected(plan.lanes.vrt, "fullPageRoutes", [candidate]);
        plan.oracles.importGraph.comparisons.push({
          path,
          direction: "forward-render-dependencies",
          importOwners: dependencies.owners,
          selectedOwners: dependencies.owners,
          disagreement: false,
          widenedToFull: false,
          reasons: [],
        });
        plan.reasons.push(
          `${path}: rendered docs content with ${dependencies.owners.length} modeled component dependency/dependencies`,
        );
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

  authority.assertCurrent();
  routeModel.assertCurrent();
  vitestContext.assertCurrent();
  const contractSelection = selectRoutes(
    plan.changedFiles,
    {},
    routeModel.contractScope,
  );
  plan.oracles.routeScope.contracts = {
    reason: contractSelection.reason,
    mode: contractSelection.routes === null ? "full" : "selected",
    routes:
      contractSelection.routes === null
        ? null
        : [...contractSelection.routes].sort(),
  };
  if (contractSelection.routes === null) plan.lanes.contracts = lane("full");
  else if (contractSelection.routes.size > 0)
    addSelected(plan.lanes.contracts, "routes", contractSelection.routes);

  const pixelSelection = selectRoutes(
    plan.changedFiles,
    {},
    routeModel.pixelScope,
  );
  plan.oracles.routeScope.vrt = {
    reason: pixelSelection.reason,
    mode: pixelSelection.routes === null ? "full" : "selected",
    routes:
      pixelSelection.routes === null ? null : [...pixelSelection.routes].sort(),
    fullPageRoutes:
      pixelSelection.fullPageRoutes === null
        ? null
        : [...pixelSelection.fullPageRoutes].sort(),
    icons: pixelSelection.icons,
  };
  if (pixelSelection.routes === null) plan.lanes.vrt = lane("full");
  else {
    if (pixelSelection.routes.size > 0)
      addSelected(plan.lanes.vrt, "routes", pixelSelection.routes);
    if (pixelSelection.fullPageRoutes.size > 0)
      addSelected(
        plan.lanes.vrt,
        "fullPageRoutes",
        pixelSelection.fullPageRoutes,
      );
    if (pixelSelection.icons) plan.lanes.vrt.icons = true;
  }

  if (plan.changedFiles.length === 0) plan.reasons.push("no changed files");
  const consumePlan = buildConsumePlan({
    changedFiles: plan.changedFiles,
    items: REGISTRY_AUTHORITY,
    metadata: {
      changed: metadataPaths.size > 0 || binaryChanged.size > 0,
    },
  });
  plan.lanes.consume =
    plan.lanes.consume.mode === "full" || consumePlan.mode === "full"
      ? lane("full", {
          layouts: consumePlan.layouts,
          execution: "current-full-oracle-required",
        })
      : consumePlan.mode === "affected-shadow"
        ? lane("selected-shadow", {
            items: consumePlan.roots,
            layouts: consumePlan.layouts,
            execution: "shadow-command-available-full-oracle-still-required",
          })
        : lane("none", {
            execution: "current-full-oracle-still-required-by-D1",
          });
  for (const [name, selected] of Object.entries(plan.lanes)) {
    selected.state =
      selected.mode === "none" ? "safely-skipped" : "not-reached";
    selected.reasonCode =
      selected.mode === "none"
        ? `no-${name}-impact`
        : selected.mode === "full"
          ? `${name}-full-impact`
          : `${name}-selected-impact`;
  }
  plan.selectorDigest = createHash("sha256")
    .update(
      JSON.stringify({
        generation: plan.generation,
        changedFiles: plan.changedFiles,
        fileFacts: plan.fileFacts,
        oracles: plan.oracles,
        lanes: plan.lanes,
      }),
    )
    .digest("hex");
  authority.assertCurrent();
  routeModel.assertCurrent();
  vitestContext.assertCurrent();
  return {
    ...plan,
    evidenceEligibility: "diagnostic-shadow-only",
    consumePlan,
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

export function affectedScenarioAttainability({
  externalTreeEnvelope = false,
} = {}) {
  // The standalone/status caller owns its own exact-tree envelope. Planner commands may reuse the
  // stronger start/final reconciliation that surrounds all their subphases, avoiding duplicate git
  // tree construction without weakening the boundary.
  const startTree = externalTreeEnvelope ? null : workingTreeContentHash().hash;
  const authority = createGateImpactAuthority();
  const graph = repositoryImportGraph({ fresh: true });
  const foundationFixtures = [];
  for (const record of authority.records) {
    const source = (record.sourceFiles ?? []).find((path) =>
      /^packages\/ui\/registry\/(?:ui|blocks)\/.+\.[cm]?[jt]sx?$/.test(path),
    );
    if (!source) continue;
    const registryOwners = dependentNames(
      record.name,
      authority.directDependents,
    );
    const imported = importImpact([source], graph);
    if (
      !imported.full &&
      JSON.stringify([...registryOwners].sort()) ===
        JSON.stringify(imported.owners)
    ) {
      const routes = registryOwners
        .map((name) => authority.byName.get(name)?.docsSlug)
        .filter(Boolean);
      if (routes.length > 6)
        foundationFixtures.push({ source, routes: routes.length });
    }
  }
  authority.assertCurrent();
  if (!externalTreeEnvelope && workingTreeContentHash().hash !== startTree)
    throw new Error(
      "working tree changed during affected scenario attainability analysis",
    );
  return {
    foundation: {
      attainable: foundationFixtures.length > 0,
      fixtures: foundationFixtures,
      blocker:
        foundationFixtures.length > 0
          ? null
          : "no current >6-route component has agreeing registry/import authorities; current policy widens those diffs to full",
    },
  };
}

export function affectedScenarioCandidates(
  changedFiles,
  plan,
  priorFailure = null,
) {
  const candidates = new Set();
  const allNone = Object.values(plan.lanes).every(
    (entry) => entry.mode === "none",
  );
  const allFull = [
    "unit",
    "smoke",
    "all-browsers",
    "contracts",
    "vrt",
    "consume",
  ].every((lane) => plan.lanes[lane]?.mode === "full");
  const hasSelectedExecutable =
    ["unit", "smoke", "all-browsers"].some(
      (lane) =>
        plan.lanes[lane]?.mode === "selected" &&
        (plan.lanes[lane]?.files?.length ?? 0) > 0,
    ) ||
    (plan.lanes.contracts?.mode === "selected" &&
      (plan.lanes.contracts?.routes?.length ?? 0) > 0) ||
    (plan.lanes.consume?.mode === "selected-shadow" &&
      (plan.lanes.consume?.items?.length ?? 0) > 0);
  if (
    changedFiles.length > 0 &&
    changedFiles.every((path) =>
      OPERATIONAL_PROSE.some((pattern) => pattern.test(path)),
    ) &&
    allNone
  )
    candidates.add("prose");
  if (
    !hasSelectedExecutable &&
    changedFiles.some((path) =>
      KNOWN_WORKFLOW.some((pattern) => pattern.test(path)),
    )
  )
    candidates.add("workflow");
  if (
    !hasSelectedExecutable &&
    changedFiles.includes("apps/docs/public/_headers") &&
    plan.boundaryChecks?.includes("deployment-boundaries")
  )
    candidates.add("header");
  if (plan.lanes.contracts.mode === "selected") {
    if (plan.lanes.contracts.routes?.length === 1) candidates.add("one-route");
    if ((plan.lanes.contracts.routes?.length ?? 0) > 6)
      candidates.add("foundation");
  }
  if (plan.lanes.consume.mode === "selected-shadow")
    candidates.add("registry-graph");
  if (allFull) candidates.add("global");
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

export function affectedScenarioProofProblems(sample) {
  const problems = [];
  const scenario = sample?.scenario;
  const plan = sample?.plan;
  const selected = sample?.selectedExecution;
  const result = (lane) => selected?.results?.[lane];
  const noSelectedExecution =
    selected?.state === "safely-skipped" &&
    Object.keys(selected?.results ?? {}).length === 0;
  if (!plan || typeof plan !== "object" || !plan.lanes) {
    return ["affected checkpoint sample has no structured impact plan"];
  }
  const allNone = Object.values(plan.lanes).every(
    ({ mode }) => mode === "none",
  );
  const allFull = [
    "unit",
    "smoke",
    "all-browsers",
    "contracts",
    "vrt",
    "consume",
  ].every((lane) => plan.lanes[lane]?.mode === "full");
  if (scenario === "prose") {
    if (!allNone || !noSelectedExecution)
      problems.push(
        "prose scenario must prove all product lanes safely skipped",
      );
  } else if (scenario === "workflow") {
    if (
      !Array.isArray(plan.changedFiles) ||
      !plan.changedFiles.some((path) =>
        KNOWN_WORKFLOW.some((pattern) => pattern.test(path)),
      ) ||
      !noSelectedExecution
    )
      problems.push(
        "workflow scenario must be a workflow diff with no selected product execution",
      );
  } else if (scenario === "header") {
    if (
      !Array.isArray(plan.changedFiles) ||
      !plan.changedFiles.includes("apps/docs/public/_headers") ||
      !plan.boundaryChecks?.includes("deployment-boundaries") ||
      !noSelectedExecution
    )
      problems.push(
        "header scenario must prove boundary checks without selected browser lanes",
      );
  } else if (scenario === "global") {
    if (!allFull || !noSelectedExecution)
      problems.push(
        "global scenario must widen every product lane and run no selected substitute",
      );
  } else if (scenario === "one-route") {
    if (
      plan.lanes.contracts?.mode !== "selected" ||
      plan.lanes.contracts.routes?.length !== 1 ||
      !result("contracts") ||
      result("contracts").executed <= 0
    )
      problems.push(
        "one-route scenario must execute the exact selected contract route",
      );
  } else if (scenario === "foundation") {
    const routes = plan.lanes.contracts?.routes ?? [];
    if (
      plan.lanes.contracts?.mode !== "selected" ||
      routes.length <= 6 ||
      !result("contracts") ||
      result("contracts").executed <= 0
    )
      problems.push(
        "foundation scenario must execute a bounded multi-route selected closure",
      );
  } else if (scenario === "registry-graph") {
    if (
      plan.lanes.consume?.mode !== "selected-shadow" ||
      !result("consume") ||
      result("consume").executed <= 0 ||
      result("consume").expected !== result("consume").executed
    )
      problems.push(
        "registry-graph scenario must execute the exact affected consume proof",
      );
  } else if (scenario === "unit-failure" || scenario === "smoke-failure") {
    const lane = scenario.replace("-failure", "");
    if (
      plan.lanes[lane]?.mode !== "selected" ||
      result(lane)?.state !== "executed/fail" ||
      !sample.oracle?.failedGateIds?.includes(lane)
    )
      problems.push(
        `${scenario} must execute and match the selected ${lane} failure`,
      );
  } else problems.push(`unknown affected checkpoint scenario ${scenario}`);
  return problems;
}

export function summarizeAffectedSamples(
  samples,
  { currentCohort = affectedCohortIdentity() } = {},
) {
  const byId = new Map();
  const invalid = [];
  for (const [index, sample] of samples.entries()) {
    const selected = sample?.selectedExecution;
    const selectedResults = Object.values(selected?.results ?? {});
    const selectedFailureCount = selectedResults.filter(
      ({ state }) => state === "executed/fail",
    ).length;
    const expectedSelectedState =
      selectedResults.length === 0
        ? "safely-skipped"
        : selectedResults.some(({ state }) => state === "unknown")
          ? "unknown"
          : selectedFailureCount > 0
            ? "executed/fail"
            : "executed/pass";
    const selectedValid =
      selected &&
      (selected.state === "safely-skipped"
        ? selectedResults.length === 0 && typeof selected.reason === "string"
        : ["executed/pass", "executed/fail"].includes(selected.state) &&
          selected.state === expectedSelectedState &&
          selectedResults.length > 0 &&
          selectedResults.every(
            (result) =>
              ["executed/pass", "executed/fail"].includes(result.state) &&
              Number.isFinite(result.durationMs) &&
              result.durationMs >= 0 &&
              Number.isInteger(result.executed) &&
              result.executed > 0 &&
              /^[a-f0-9]{64}$/.test(result.selectorDigest ?? "") &&
              Array.isArray(result.problems) &&
              result.problems.length === 0,
          ));
    const failedGateIds = new Set(sample?.oracle?.failedGateIds ?? []);
    const selectedOracleConsistent = Object.entries(
      selected?.results ?? {},
    ).every(
      ([lane, result]) =>
        (result.state === "executed/fail") === failedGateIds.has(lane),
    );
    const cohortValid =
      sample?.cohort?.schema === 1 &&
      /^[a-f0-9]{64}$/.test(sample.cohort.digest ?? "") &&
      JSON.stringify(sample.cohort) === JSON.stringify(currentCohort);
    const scenarioProofProblems = sample
      ? affectedScenarioProofProblems(sample)
      : ["missing sample"];
    if (
      !sample ||
      sample.schema !== 1 ||
      sample.generation !== "affected-shadow-v1" ||
      typeof sample.sampleId !== "string" ||
      !sample.sampleId ||
      !sample.oracle ||
      typeof sample.tree !== "string" ||
      !sample.tree ||
      !cohortValid ||
      !/^[a-f0-9]{64}$/.test(sample.classification?.inventoryDigest ?? "") ||
      !/^[a-f0-9]{64}$/.test(sample.plan?.selectorDigest ?? "") ||
      sample.checkpointEligible !== true ||
      sample.oracle.profile !== "production-full" ||
      sample.oracle.receiptUnchanged !== true ||
      sample.oracle.evidenceUnchanged !== true ||
      sample.oracle.treeUnchanged !== true ||
      !["pass", "fail"].includes(sample.oracle.status) ||
      !Array.isArray(sample.oracle.failedGateIds) ||
      (sample.oracle.status === "pass" &&
        sample.oracle.failedGateIds.length !== 0) ||
      sample.oracle.valid !== true ||
      sample.oracle.structuredSummaryVerified !== true ||
      typeof sample.oracle.structuredRunId !== "string" ||
      !sample.oracle.structuredRunId ||
      !Number.isFinite(sample.oracle.durationMs) ||
      sample.oracle.durationMs < 0 ||
      !Array.isArray(sample.oracle.escapes) ||
      !Array.isArray(sample.scenarioCandidates) ||
      !sample.scenarioCandidates.includes(sample.scenario) ||
      !selectedValid ||
      !selectedOracleConsistent ||
      !Number.isFinite(sample.measurements?.selectorDurationMs) ||
      !Number.isFinite(sample.measurements?.turboDryRunDurationMs) ||
      scenarioProofProblems.length > 0
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
  const candidates = [...byId.values()].map(({ sample }) => sample);
  const cohorts = new Map();
  const valid = [];
  for (const sample of candidates) {
    const cohort = `${sample.tree}\0${sample.plan.selectorDigest}`;
    if (cohorts.has(cohort)) {
      invalid.push(
        `sample ${sample.sampleId}: repeats tree/selector cohort ${cohorts.get(cohort)}`,
      );
      continue;
    }
    cohorts.set(cohort, sample.sampleId);
    valid.push(sample);
  }
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
  const scenarioAttainability = affectedScenarioAttainability();
  const authorityBlockers = Object.entries(scenarioAttainability)
    .filter(([, status]) => status.attainable !== true)
    .map(([scenario, status]) => ({ scenario, blocker: status.blocker }));
  const checkpointReady =
    invalid.length === 0 &&
    valid.length >= 30 &&
    escapes.length === 0 &&
    missingScenarios.length === 0 &&
    authorityBlockers.length === 0;
  return {
    schema: 1,
    samples: valid.length,
    pass: valid.filter((sample) => sample.oracle.status === "pass").length,
    predictedFailure: valid.filter((sample) => sample.oracle.status === "fail")
      .length,
    selectedDurationMs: valid.reduce(
      (total, sample) =>
        total +
        Object.values(sample.selectedExecution.results).reduce(
          (sum, result) => sum + result.durationMs,
          0,
        ),
      0,
    ),
    oracleDurationMs: valid.reduce(
      (total, sample) => total + sample.oracle.durationMs,
      0,
    ),
    invalid,
    escapes,
    scenarios: [...scenarios].sort(),
    missingScenarios,
    scenarioAttainability,
    authorityBlockers,
    checkpointReady,
    reuseEnabled: false,
    nextAction: checkpointReady
      ? "Ask MK to review the shadow evidence; do not enable reuse automatically."
      : authorityBlockers.length > 0
        ? "Keep reuse disabled; resolve the recorded authority/scenario blocker with MK before collecting a qualifying cohort."
        : "Keep reuse disabled and collect valid representative full-oracle samples.",
  };
}
