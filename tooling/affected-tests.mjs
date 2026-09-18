#!/usr/bin/env node

/**
 * Deterministic affected-test planner and runner.
 *
 * Component ownership, tests, previews and dependency edges come from
 * packages/ui/component-contracts.json. Registry dependency declarations are independently
 * reconciled against real imports by verify-registry-deps.mjs, so the reverse closure computed here
 * is an executable contract rather than a filename convention.
 *
 * Unknown paths fail. Broad inputs select owned contract suites and fixed geometry canaries; they
 * never silently expand to the complete component suite. The complete suite is manual-only.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { ROOT, readJson } from "./lib/fs.mjs";

const CONTRACT_PATH = "packages/ui/component-contracts.json";
const REGISTRY_PATH = "packages/ui/registry.json";
const PREFIX = "affected-tests";

const STATIC_PREFIXES = [
  ".changeset/",
  ".github/",
  ".husky/",
  ".agents/",
  ".claude/",
  "docs/",
  "skills/",
  // The pinned pristine shadcn baseline (`tooling/upstream/pull.mjs`). Nothing imports it and
  // nothing builds from it: it is the reference a patch is measured against, so a change to it
  // changes no rendered component until a batch re-derives one. The gate that reacts to it is
  // `upstream:check`, which runs inside `pnpm lint` on the static side.
  "vendor/",
];
const STATIC_FILES = new Set([
  "AGENTS.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "README.md",
  "design-v1.md",
  "design.md",
  ".gitignore",
  ".node-version",
  ".prettierignore",
  ".prettierrc",
  ".prettierrc.json",
  "eslint.config.mjs",
  "renovate.json",
  "tsconfig.json",
]);
const DEPENDENCY_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
]);
const CANARY_BROAD_GROUPS = new Set([
  "tokens",
  "shared-runtime",
  "test-infrastructure",
  "dependencies",
]);

function slash(path) {
  return path.split(sep).join("/").replace(/^\.\//, "");
}

function sorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function runGit(args, { cwd = ROOT, allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error)
    throw new Error(`git ${args[0]} did not run: ${result.error.message}`);
  if (result.signal)
    throw new Error(`git ${args[0]} ended on ${result.signal}`);
  if (result.status !== 0 && !allowFailure) {
    throw new Error(
      `git ${args.join(" ")} exited ${result.status}: ${(result.stderr ?? "").trim()}`,
    );
  }
  return result;
}

/** Parse `git diff --name-status -z`, including the two paths carried by rename/copy records. */
export function parseNameStatus(raw) {
  const fields = raw.split("\0");
  if (fields.at(-1) === "") fields.pop();
  const changes = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!status) throw new Error("git diff emitted an empty status field");
    const paths = [fields[index++]];
    if (/^[RC]/.test(status)) paths.push(fields[index++]);
    if (paths.some((path) => !path))
      throw new Error(`git diff emitted an incomplete ${status} record`);
    changes.push({ status, paths: paths.map(slash) });
  }
  return changes;
}

export function collectRangeChanges(base, head, { cwd = ROOT } = {}) {
  if (!base || !head) throw new Error("--base and --head are both required");
  const result = runGit(
    ["diff", "--name-status", "-z", "--find-renames", `${base}...${head}`],
    { cwd },
  );
  return parseNameStatus(result.stdout ?? "");
}

export function collectWorkingTreeChanges({ cwd = ROOT } = {}) {
  const tracked = parseNameStatus(
    runGit(["diff", "--name-status", "-z", "--find-renames", "HEAD"], {
      cwd,
    }).stdout ?? "",
  );
  const untracked = (
    runGit(["ls-files", "--others", "--exclude-standard", "-z"], { cwd })
      .stdout ?? ""
  )
    .split("\0")
    .filter(Boolean)
    .map((path) => ({ status: "?", paths: [slash(path)] }));
  const byKey = new Map();
  for (const change of [...tracked, ...untracked])
    byKey.set(`${change.status}\0${change.paths.join("\0")}`, change);
  return [...byKey.values()];
}

function jsonAtRef(ref, path, { cwd = ROOT } = {}) {
  if (!ref) return null;
  const result = runGit(["show", `${ref}:${path}`], {
    cwd,
    allowFailure: true,
  });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${ref}:${path} is not valid JSON: ${error.message}`);
  }
}

function richRecords(contracts) {
  return [
    ...(contracts.components ?? []),
    ...(contracts.hooks ?? []),
    ...(contracts.blocks ?? []),
    ...(contracts.libs ?? []),
  ];
}

function iconRecords(contracts) {
  return contracts.animatedIcons?.members ?? [];
}

function recordsByName(contracts) {
  return new Map(
    [...richRecords(contracts), ...iconRecords(contracts)].map((record) => [
      record.name,
      record,
    ]),
  );
}

function recordSources(record) {
  return record.sourceFiles ?? (record.sourceFile ? [record.sourceFile] : []);
}

function indexContracts(...contractSets) {
  const source = new Map();
  const tests = new Map();
  const previews = new Map();
  for (const contracts of contractSets.filter(Boolean)) {
    for (const record of [
      ...richRecords(contracts),
      ...iconRecords(contracts),
    ]) {
      for (const path of recordSources(record))
        source.set(slash(path), record.name);
      for (const path of record.testFiles ?? [])
        tests.set(slash(path), record.name);
      if (record.previewModule)
        previews.set(
          `apps/docs/components/preview/${record.previewModule}.tsx`,
          record.name,
        );
    }
  }
  return { source, tests, previews };
}

function registryGraph(registry) {
  const dependencies = new Map();
  for (const item of registry.items ?? []) {
    dependencies.set(
      item.name,
      (item.registryDependencies ?? []).map((dependency) =>
        dependency.replace(/^@vegastack\//, ""),
      ),
    );
  }
  return dependencies;
}

export function reverseClosure(seeds, dependencies) {
  const reverse = new Map([...dependencies.keys()].map((name) => [name, []]));
  for (const [consumer, deps] of dependencies) {
    for (const dependency of deps) {
      if (!reverse.has(dependency)) reverse.set(dependency, []);
      reverse.get(dependency).push(consumer);
    }
  }
  const queue = [...seeds];
  const affected = new Set();
  while (queue.length > 0) {
    const name = queue.shift();
    if (affected.has(name)) continue;
    affected.add(name);
    for (const consumer of reverse.get(name) ?? []) queue.push(consumer);
  }
  return sorted(affected);
}

function changedJsonRecords(before, after, bucketNames) {
  if (!before || !after) return [];
  const collect = (value) =>
    new Map(
      bucketNames
        .flatMap((bucket) => value[bucket] ?? [])
        .map((record) => [record.name, JSON.stringify(record)]),
    );
  const oldRecords = collect(before);
  const newRecords = collect(after);
  return sorted(new Set([...oldRecords.keys(), ...newRecords.keys()])).filter(
    (name) => oldRecords.get(name) !== newRecords.get(name),
  );
}

function changedContractRecords(before, after) {
  const rich = changedJsonRecords(before, after, [
    "components",
    "hooks",
    "blocks",
    "libs",
  ]);
  const oldIcons = before
    ? { icons: before.animatedIcons?.members ?? [] }
    : null;
  const newIcons = after ? { icons: after.animatedIcons?.members ?? [] } : null;
  return sorted([
    ...rich,
    ...changedJsonRecords(oldIcons, newIcons, ["icons"]),
  ]);
}

function changedRegistryRecords(before, after) {
  return changedJsonRecords(before, after, ["items"]);
}

/** AST-only export extraction: preview selection must never execute application code. */
export function exportedPreviewFixtures(path, { cwd = ROOT } = {}) {
  const absolute = resolve(cwd, path);
  if (!existsSync(absolute)) return [];
  const source = readFileSync(absolute, "utf8");
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const names = [];
  for (const statement of file.statements) {
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exported) continue;
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      // Geometry fixtures are exported functions; retaining only functions prevents a helper
      // constant/type from becoming a requested test name.
      if (ts.isFunctionDeclaration(statement)) names.push(statement.name.text);
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        )
          names.push(declaration.name.text);
      }
    }
  }
  return sorted(names);
}

export function validateAffectedPolicy(contracts, { cwd = ROOT } = {}) {
  const errors = [];
  const policy = contracts?.affectedTestPolicy;
  if (!policy || typeof policy !== "object")
    return ["component contracts have no affectedTestPolicy"];
  const records = recordsByName(contracts);
  if (
    !policy.geometryUnswept ||
    typeof policy.geometryUnswept !== "object" ||
    Array.isArray(policy.geometryUnswept)
  ) {
    errors.push("geometryUnswept must be an object of fixture -> reason");
  }
  const entries = policy.crossCuttingTests;
  if (!Array.isArray(entries)) return ["crossCuttingTests must be an array"];
  const declaredFiles = entries.map((entry) => entry.file);
  if (new Set(declaredFiles).size !== declaredFiles.length)
    errors.push("crossCuttingTests contains duplicate files");
  const actualFiles = readdirSync(join(cwd, "packages/ui/test"))
    .filter((name) => name.endsWith(".browser.test.tsx"))
    .map((name) => `packages/ui/test/${name}`)
    .sort();
  if (JSON.stringify(sorted(declaredFiles)) !== JSON.stringify(actualFiles))
    errors.push("crossCuttingTests does not exactly own every browser suite");
  for (const entry of entries) {
    if (!Array.isArray(entry.owners))
      errors.push(`${entry.file}: owners must be an array`);
    for (const owner of entry.owners ?? [])
      if (!records.has(owner))
        errors.push(`${entry.file}: unknown owner ${owner}`);
    if (!Array.isArray(entry.globalInputGroups))
      errors.push(`${entry.file}: globalInputGroups must be an array`);
    for (const group of entry.globalInputGroups ?? [])
      if (!new Set(["tokens", "shared-runtime"]).has(group))
        errors.push(`${entry.file}: unknown global input group ${group}`);
    if (
      entry.file !== policy.geometryTestFile &&
      existsSync(join(cwd, entry.file))
    ) {
      const source = readFileSync(join(cwd, entry.file), "utf8");
      const file = ts.createSourceFile(
        entry.file,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const importedOwners = new Set();
      for (const statement of file.statements) {
        if (!ts.isImportDeclaration(statement)) continue;
        const specifier = statement.moduleSpecifier;
        if (!ts.isStringLiteralLike(specifier)) continue;
        const match =
          /^@\/components\/ui\/([a-z0-9-]+)$/.exec(specifier.text) ??
          /(?:^|\/)registry\/(?:ui|lib)\/([a-z0-9-]+)$/.exec(specifier.text);
        if (match) importedOwners.add(match[1]);
      }
      for (const owner of importedOwners)
        if (!(entry.owners ?? []).includes(owner))
          errors.push(
            `${entry.file}: imported registry owner ${owner} is undeclared`,
          );
      if (
        /from\s+["']@vegastack\/design(?:\/[^"']*)?["']/.test(source) &&
        !(entry.globalInputGroups ?? []).includes("shared-runtime")
      )
        errors.push(
          `${entry.file}: imports design runtime without shared-runtime ownership`,
        );
    }
  }
  if (!declaredFiles.includes(policy.geometryTestFile))
    errors.push("geometryTestFile is not a crossCuttingTests entry");
  const fixtureNames = new Set(
    richRecords(contracts).flatMap((record) =>
      record.previewModule
        ? exportedPreviewFixtures(
            `apps/docs/components/preview/${record.previewModule}.tsx`,
            { cwd },
          )
        : [],
    ),
  );
  if (
    !Array.isArray(policy.geometryCanaries) ||
    policy.geometryCanaries.length === 0
  )
    errors.push("geometryCanaries must be a non-empty array");
  for (const fixture of policy.geometryCanaries ?? [])
    if (!fixtureNames.has(fixture))
      errors.push(`unknown geometry canary ${fixture}`);
  return sorted(errors);
}

function isStaticPath(path) {
  return (
    STATIC_FILES.has(path) ||
    STATIC_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    path.startsWith("apps/docs/content/") ||
    path.startsWith("apps/docs/scripts/") ||
    path.startsWith("apps/docs/lib/") ||
    /(?:^|\/)(?:tsconfig|eslint|prettier)[^/]*\.(?:json|mjs|js)$/.test(path)
  );
}

function broadGroupForPath(path) {
  if (
    (path.startsWith("packages/design-tokens/") &&
      !path.endsWith("/CHANGELOG.md") &&
      !path.endsWith("/package.json") &&
      !path.endsWith("/tsconfig.json")) ||
    path === "apps/docs/app/global.css"
  )
    return "tokens";
  if (
    path.startsWith("packages/design/src/") ||
    path === "packages/design/preset.css"
  )
    return "shared-runtime";
  if (
    path === "packages/ui/vitest.config.ts" ||
    path === "packages/ui/vitest.all-browsers.config.ts" ||
    path === "packages/ui/vitest.setup.ts" ||
    path === "packages/ui/run-all-browsers.ts" ||
    path === "packages/ui/webkit-lane.ts" ||
    path === "tooling/full-browser-suite.mjs" ||
    (path.startsWith("packages/ui/test/") &&
      !path.endsWith(".browser.test.tsx")) ||
    path.startsWith("tooling/affected-tests") ||
    path.startsWith("tooling/verify-affected-tests") ||
    path === "tooling/verify.mjs" ||
    path === "vitest.tooling.config.ts" ||
    path === "turbo.json"
  )
    return "test-infrastructure";
  if (
    DEPENDENCY_FILES.has(path) ||
    /^(?:apps|packages)\/[^/]+\/package\.json$/.test(path)
  )
    return "dependencies";
  return null;
}

function itemNameFromGeneratedPath(path) {
  const copy = /^apps\/docs\/components\/ui\/([^/]+)\.tsx?$/.exec(path);
  if (copy) return copy[1];
  const registry = /^apps\/docs\/public\/r\/([^/]+)\.json$/.exec(path);
  if (
    registry &&
    registry[1] !== "registry" &&
    registry[1] !== "integrity-manifest"
  )
    return registry[1];
  return null;
}

function relativeUiTest(path) {
  return path.replace(/^packages\/ui\//, "");
}

/**
 * Pure affected-plan builder. Tests supply explicit snapshots; the CLI supplies the checked-out
 * contract/registry plus the base-ref snapshots.
 */
export function createAffectedPlan({
  changes = [],
  explicitComponents = [],
  contracts,
  registry,
  previousContracts = null,
  previousRegistry = null,
  cwd = ROOT,
  base = null,
  head = null,
  source = "working-tree",
}) {
  if (!contracts?.affectedTestPolicy)
    throw new Error("component contracts have no affectedTestPolicy");
  const currentRecords = recordsByName(contracts);
  const oldRecords = previousContracts
    ? recordsByName(previousContracts)
    : new Map();
  const allKnownNames = new Set([
    ...currentRecords.keys(),
    ...oldRecords.keys(),
  ]);
  const animatedIconNames = new Set([
    ...iconRecords(contracts).map((record) => record.name),
    ...iconRecords(previousContracts ?? {}).map((record) => record.name),
  ]);
  const indexes = indexContracts(contracts, previousContracts);
  const policy = contracts.affectedTestPolicy;
  // Current AND previous, for the same reason `indexContracts` unions both: a suite DELETED in this
  // range exists only in the base contracts, and an unindexed deletion reports as an unowned
  // cross-cutting test — a gate failing on the one change that is unambiguously safe.
  const crossByFile = new Map(
    [
      ...(previousContracts?.affectedTestPolicy?.crossCuttingTests ?? []),
      ...policy.crossCuttingTests,
    ].map((entry) => [slash(entry.file), entry]),
  );
  const sourceSeeds = new Set();
  const directTestOwners = new Set();
  const previewOwners = new Set();
  const changedCrossTests = new Set();
  const generatedItems = new Set();
  const broadGroups = new Set();
  const classifications = [];
  const errors = validateAffectedPolicy(contracts, { cwd });
  let registryCheck = false;

  for (const name of explicitComponents) {
    if (!allKnownNames.has(name))
      errors.push(`unknown component/item: ${name}`);
    else sourceSeeds.add(name);
  }

  const changedPaths = sorted(changes.flatMap((change) => change.paths));
  // A deletion whose path is owned by the BASE contract still seeds its item, so the dependents of
  // a retired component are still exercised — that is the `retains base ownership` case the
  // indexes already handle. What they cannot handle is a deletion of a path NO contract ever
  // named: there is no owner to find in either revision, so it reaches the unowned-path error and
  // fails closed on a file that is gone. Batch 4 hit it on `command.characterization.test.tsx`.
  // Only a pure `D` counts — a rename carries its old path in the same record and must keep
  // resolving through the indexes.
  const deletedPaths = new Set(
    changes
      .filter((change) => change.status.startsWith("D"))
      .flatMap((change) => change.paths),
  );
  for (const path of changedPaths) {
    if (indexes.source.has(path)) {
      const item = indexes.source.get(path);
      sourceSeeds.add(item);
      registryCheck = true;
      classifications.push({ path, kind: "registry-source", item });
      continue;
    }
    if (indexes.tests.has(path)) {
      const item = indexes.tests.get(path);
      directTestOwners.add(item);
      classifications.push({ path, kind: "component-test", item });
      continue;
    }
    if (indexes.previews.has(path)) {
      const item = indexes.previews.get(path);
      previewOwners.add(item);
      classifications.push({ path, kind: "preview", item });
      continue;
    }
    if (crossByFile.has(path)) {
      // A suite the range DELETED is classified (so it is not "unowned") but never SELECTED —
      // vitest would fail to resolve the file. `crossByFile` carries the base contracts so the
      // deletion classifies; the presence check is what keeps it out of the run.
      if (existsSync(join(cwd, path))) changedCrossTests.add(path);
      if (path === policy.geometryTestFile)
        broadGroups.add("test-infrastructure");
      classifications.push({ path, kind: "cross-cutting-test" });
      continue;
    }
    const generatedItem = itemNameFromGeneratedPath(path);
    if (generatedItem) {
      generatedItems.add(generatedItem);
      registryCheck = true;
      classifications.push({
        path,
        kind: "generated-registry",
        item: generatedItem,
      });
      continue;
    }
    if (path === REGISTRY_PATH) {
      const items = changedRegistryRecords(previousRegistry, registry);
      for (const item of items) sourceSeeds.add(item);
      registryCheck = true;
      classifications.push({ path, kind: "registry-contract", items });
      continue;
    }
    if (path === CONTRACT_PATH) {
      const items = changedContractRecords(previousContracts, contracts);
      for (const item of items) sourceSeeds.add(item);
      if (
        previousContracts &&
        JSON.stringify(previousContracts.affectedTestPolicy) !==
          JSON.stringify(contracts.affectedTestPolicy)
      )
        broadGroups.add("test-infrastructure");
      classifications.push({ path, kind: "component-contract", items });
      continue;
    }
    if (
      path.startsWith("packages/ui/registry/ui/icons/") ||
      path === "packages/ui/animated-icon-sources.json" ||
      // The ONE test file for all 467 mirrors. `modeledExemptions.animated-icons-share-surfaces`
      // exempts the members from a per-item test, so no record lists this file and the pseudo-item
      // is its owner — the same owner the icon sources themselves resolve to.
      path === "packages/ui/registry/ui/animated-icons.test.tsx"
    ) {
      directTestOwners.add("__animated-icons__");
      registryCheck = true;
      classifications.push({ path, kind: "animated-icon-source" });
      continue;
    }
    if (
      path === "apps/docs/components/preview/index.tsx" ||
      path === "apps/docs/components/preview-controls.tsx" ||
      // Not a component's preview module: `utilities.tsx` demonstrates the shared `@utility`
      // helpers (shimmer, scroll-fade, scrollbar) on the Foundations pages and `wrapper.tsx` is the
      // frame every hero demo mounts inside, so no contract record owns either and none should.
      // Both are preview INFRASTRUCTURE, and a change to one selects the named contracts plus the
      // fixed canaries rather than nothing.
      path === "apps/docs/components/preview/utilities.tsx" ||
      path === "apps/docs/components/preview/wrapper.tsx"
    ) {
      broadGroups.add("test-infrastructure");
      classifications.push({ path, kind: "preview-infrastructure" });
      continue;
    }
    if (
      path === "apps/docs/public/r/registry.json" ||
      path.startsWith("apps/docs/public/r/integrity-manifest")
    ) {
      registryCheck = true;
      classifications.push({ path, kind: "generated-registry-index" });
      continue;
    }
    if (path.startsWith("packages/ui/registry/")) {
      if (deletedPaths.has(path)) {
        // Gone, and never owned. The registry check still runs so nothing is left dangling.
        registryCheck = true;
        classifications.push({ path, kind: "registry-deletion" });
        continue;
      }
      errors.push(`unowned registry path: ${path}`);
      continue;
    }
    if (path.startsWith("apps/docs/components/preview/")) {
      errors.push(`unowned preview module: ${path}`);
      continue;
    }
    if (
      path.startsWith("packages/ui/test/") &&
      path.endsWith(".browser.test.tsx")
    ) {
      errors.push(`unowned cross-cutting browser test: ${path}`);
      continue;
    }
    const broadGroup = broadGroupForPath(path);
    if (broadGroup) {
      broadGroups.add(broadGroup);
      classifications.push({ path, kind: "broad-input", group: broadGroup });
      continue;
    }
    if (
      path.startsWith("tooling/") ||
      path.startsWith("apps/docs/") ||
      path.startsWith("packages/design-tokens/") ||
      path.startsWith("packages/design/") ||
      path.startsWith("packages/ui/") ||
      isStaticPath(path)
    ) {
      classifications.push({ path, kind: "static-only" });
      continue;
    }
    errors.push(`unclassified path: ${path}`);
  }

  // A generated item is legal only alongside its source/contract seed. This catches hand edits to
  // copy-ins and public item JSON without requiring a full registry rebuild to discover them.
  for (const item of generatedItems) {
    // A registry item is not always a contract RECORD. `table-scroll-region` and `terminal-body`
    // are separate registry items whose canonical sources are listed under `table` and `terminal`
    // respectively, so the seed their source adds is the parent's name. Resolve through the source
    // index before reporting, or the gate fails on a correctly regenerated copy-in.
    const owner =
      indexes.source.get(`packages/ui/registry/ui/${item}.tsx`) ?? item;
    if (!sourceSeeds.has(item) && !sourceSeeds.has(owner))
      errors.push(
        `generated registry item ${item} changed without its canonical source or contract`,
      );
  }

  for (const seed of sourceSeeds) {
    if (!allKnownNames.has(seed))
      errors.push(
        `changed registry/contract record has no modeled item: ${seed}`,
      );
  }

  const dependencyGraph = registryGraph(registry);
  // Deleted/renamed records may exist only in the base registry; retain their old edges for the
  // selection calculation so removal cannot erase the very dependents it needs to test.
  if (previousRegistry) {
    for (const [name, deps] of registryGraph(previousRegistry))
      if (!dependencyGraph.has(name)) dependencyGraph.set(name, deps);
  }
  const affectedItems = reverseClosure(sourceSeeds, dependencyGraph);
  const testedOwners = new Set([...affectedItems, ...directTestOwners]);

  const componentTests = [];
  for (const owner of testedOwners) {
    if (owner === "__animated-icons__" || animatedIconNames.has(owner)) {
      componentTests.push("packages/ui/registry/ui/animated-icons.test.tsx");
      continue;
    }
    const record = currentRecords.get(owner) ?? oldRecords.get(owner);
    for (const file of record?.testFiles ?? []) componentTests.push(file);
  }

  const previewModules = new Set();
  for (const owner of new Set([...affectedItems, ...previewOwners])) {
    const record = currentRecords.get(owner) ?? oldRecords.get(owner);
    if (record?.previewModule) previewModules.add(record.previewModule);
  }
  // A fixture the geometry suite declares UNSWEPT is never requested. The suite rejects an unswept
  // request by name — correctly, because an author asking for one is asking for an assertion that
  // does not exist — and an automated planner enumerating a preview module's exports would hit that
  // every time the module became affected. `geometryUnswept` in the contracts is the one authority
  // both sides read, so the planner and the suite cannot disagree about it.
  const unswept = new Set(Object.keys(policy.geometryUnswept ?? {}));
  const geometryFixtures = [];
  for (const module of previewModules) {
    geometryFixtures.push(
      ...exportedPreviewFixtures(`apps/docs/components/preview/${module}.tsx`, {
        cwd,
      }).filter((name) => !unswept.has(name)),
    );
  }
  if ([...broadGroups].some((group) => CANARY_BROAD_GROUPS.has(group)))
    geometryFixtures.push(...policy.geometryCanaries);

  const crossCuttingTests = new Set(changedCrossTests);
  for (const entry of policy.crossCuttingTests) {
    if (entry.file === policy.geometryTestFile) continue;
    if (entry.owners.some((owner) => testedOwners.has(owner)))
      crossCuttingTests.add(entry.file);
    if (
      entry.globalInputGroups.some((group) => broadGroups.has(group)) ||
      broadGroups.has("test-infrastructure") ||
      broadGroups.has("dependencies")
    )
      crossCuttingTests.add(entry.file);
  }

  const selectedGeometryFixtures = sorted(geometryFixtures);
  if (selectedGeometryFixtures.length > 0)
    crossCuttingTests.add(policy.geometryTestFile);

  const nonBrowserPackageTests = [];
  if (
    changedPaths.some((path) => path.startsWith("packages/design/")) ||
    broadGroups.has("dependencies")
  )
    nonBrowserPackageTests.push("@vegastack/design");

  const browserTestFiles = sorted([...componentTests, ...crossCuttingTests]);
  const plan = {
    schemaVersion: 1,
    source,
    range: { base, head },
    changedFiles: changedPaths,
    classifications,
    seedItems: sorted(sourceSeeds),
    directTestOwners: sorted(directTestOwners),
    previewOwners: sorted(previewOwners),
    affectedItems,
    componentTestFiles: sorted(componentTests),
    previewModules: sorted(previewModules),
    geometryFixtures: selectedGeometryFixtures,
    crossCuttingTestFiles: sorted(crossCuttingTests),
    browserTestFiles,
    nonBrowserPackageTests: sorted(nonBrowserPackageTests),
    broadImpactGroups: sorted(broadGroups),
    broadImpactWarning:
      broadGroups.size > 0
        ? "Dedicated contracts and fixed canaries selected; the manual full-component audit was not run."
        : null,
    registryCheck,
    errors: sorted(errors),
  };
  return plan;
}

function printPlan(plan) {
  const list = (values) => (values.length > 0 ? values.join(", ") : "none");
  console.log(`\n${PREFIX}: ${plan.source}`);
  if (plan.range.base || plan.range.head)
    console.log(
      `  range: ${plan.range.base ?? "-"}..${plan.range.head ?? "-"}`,
    );
  console.log(`  changed: ${list(plan.changedFiles)}`);
  console.log(`  seeds: ${list(plan.seedItems)}`);
  console.log(`  affected items: ${list(plan.affectedItems)}`);
  console.log(`  component tests: ${list(plan.componentTestFiles)}`);
  console.log(`  cross-cutting tests: ${list(plan.crossCuttingTestFiles)}`);
  console.log(`  geometry fixtures: ${list(plan.geometryFixtures)}`);
  console.log(`  broad groups: ${list(plan.broadImpactGroups)}`);
  if (plan.broadImpactWarning)
    console.log(`  note: ${plan.broadImpactWarning}`);
  if (plan.errors.length > 0) {
    for (const error of plan.errors) console.error(`  ERROR: ${error}`);
  }
  console.log(`\n${JSON.stringify(plan, null, 2)}`);
}

function runCommand(command, args, { env, cwd = ROOT } = {}) {
  const started = Date.now();
  console.log(`\n${PREFIX}: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    stdio: "inherit",
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (result.error)
    throw new Error(`${command} did not run: ${result.error.message}`);
  if (result.signal) throw new Error(`${command} ended on ${result.signal}`);
  if (result.status !== 0)
    throw new Error(
      `${command} failed with ${result.status} after ${seconds}s`,
    );
  console.log(`${PREFIX}: step passed in ${seconds}s`);
}

export function executeAffectedPlan(
  plan,
  { fast = false, assumeBuilt = false, verifyRegistry = false } = {},
) {
  if (plan.errors.length > 0)
    throw new Error(
      `affected plan is invalid (${plan.errors.length} error(s))`,
    );

  if (fast) {
    runCommand("node", ["tooling/design-lint.mjs", "packages/ui/registry"]);
    const cache = join(
      ROOT,
      "node_modules/.cache/vegastack-ui-check.tsbuildinfo",
    );
    mkdirSync(dirname(cache), { recursive: true });
    runCommand("pnpm", [
      "-F",
      "@vegastack/ui",
      "exec",
      "tsc",
      "--noEmit",
      "--pretty",
      "false",
      "--incremental",
      "--tsBuildInfoFile",
      cache,
    ]);
  }

  if (verifyRegistry && plan.registryCheck) {
    const baseline = join(
      process.env.RUNNER_TEMP ?? process.env.TMPDIR ?? "/tmp",
      `vegastack-affected-registry-${process.pid}`,
    );
    runCommand("node", [
      "tooling/assert-clean-tree.mjs",
      "--snapshot",
      baseline,
      "the tree before affected registry verification",
    ]);
    runCommand("pnpm", ["registry:build"]);
    runCommand("node", [
      "tooling/assert-clean-tree.mjs",
      "--against",
      baseline,
      "the tree after affected registry verification",
    ]);
  }

  if (plan.browserTestFiles.length > 0) {
    if (!assumeBuilt)
      runCommand("pnpm", [
        "exec",
        "turbo",
        "run",
        "build",
        "--filter=@vegastack/design",
      ]);
    runCommand(
      "pnpm",
      [
        "-F",
        "@vegastack/ui",
        "exec",
        "vitest",
        "run",
        ...plan.browserTestFiles.map(relativeUiTest),
      ],
      {
        env:
          plan.geometryFixtures.length > 0
            ? {
                VEGASTACK_GEOMETRY_FIXTURES: plan.geometryFixtures.join(","),
              }
            : undefined,
      },
    );
  } else {
    console.log(`\n${PREFIX}: no browser tests selected`);
  }

  if (fast) {
    for (const pkg of plan.nonBrowserPackageTests)
      runCommand("pnpm", ["-F", pkg, "test"]);
  }
}

function parseCli(argv) {
  const options = {
    components: [],
    base: null,
    head: null,
    workingTree: false,
    dryRun: false,
    run: false,
    fast: false,
    assumeBuilt: false,
    verifyRegistry: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--component") options.components.push(argv[++index]);
    else if (value === "--base") options.base = argv[++index];
    else if (value === "--head") options.head = argv[++index];
    else if (value === "--working-tree") options.workingTree = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (value === "--run") options.run = true;
    else if (value === "--fast") options.fast = true;
    else if (value === "--assume-built") options.assumeBuilt = true;
    else if (value === "--verify-registry") options.verifyRegistry = true;
    else throw new Error(`unknown argument ${value}`);
  }
  if (options.components.some((value) => !value))
    throw new Error("--component requires a value");
  if ((options.base && !options.head) || (!options.base && options.head))
    throw new Error("--base and --head must be supplied together");
  if (options.components.length === 0 && !options.base && !options.workingTree)
    options.workingTree = true;
  return options;
}

export function planFromCli(options, { cwd = ROOT } = {}) {
  const contracts = readJson(join(cwd, CONTRACT_PATH));
  const registry = readJson(join(cwd, REGISTRY_PATH));
  const previousContracts = options.base
    ? jsonAtRef(options.base, CONTRACT_PATH, { cwd })
    : options.workingTree
      ? jsonAtRef("HEAD", CONTRACT_PATH, { cwd })
      : null;
  const previousRegistry = options.base
    ? jsonAtRef(options.base, REGISTRY_PATH, { cwd })
    : options.workingTree
      ? jsonAtRef("HEAD", REGISTRY_PATH, { cwd })
      : null;
  const changes = options.base
    ? collectRangeChanges(options.base, options.head, { cwd })
    : options.workingTree
      ? collectWorkingTreeChanges({ cwd })
      : [];
  return createAffectedPlan({
    changes,
    explicitComponents: options.components,
    contracts,
    registry,
    previousContracts,
    previousRegistry,
    cwd,
    base: options.base,
    head: options.head,
    source: options.base
      ? "git-range"
      : options.components.length > 0 && !options.workingTree
        ? "explicit-components"
        : "working-tree",
  });
}

const isMain =
  resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const options = parseCli(process.argv.slice(2));
    const plan = planFromCli(options);
    printPlan(plan);
    if (plan.errors.length > 0) process.exit(1);
    if (options.run && !options.dryRun)
      executeAffectedPlan(plan, {
        fast: options.fast,
        assumeBuilt: options.assumeBuilt,
        verifyRegistry: options.verifyRegistry,
      });
  } catch (error) {
    console.error(`${PREFIX}: ${error.message}`);
    process.exit(2);
  }
}
