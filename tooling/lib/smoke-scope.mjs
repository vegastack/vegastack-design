import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
} from "node:fs";
import { join } from "node:path";
import ts from "typescript";

import {
  assertAuthorityFingerprint,
  authorityFingerprint,
} from "./authority-fingerprint.mjs";
import { ROOT } from "./change-set.mjs";
import {
  contractSha256,
  installedToolchain,
  pinnedToolchain,
} from "./gate-receipt.mjs";

export const VITEST_IMPACT_AUTHORITY_PATHS = [
  "packages/ui/component-contracts.json",
  "packages/ui/registry.json",
  "packages/ui/smoke-impact.generated.json",
];

function readRecords() {
  const authority = JSON.parse(
    readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
  );
  return [...authority.components, ...authority.hooks, ...authority.blocks];
}

export const SMOKE_GLOBAL_INPUTS = [
  /^pnpm-lock\.yaml$/,
  /^package\.json$/,
  /^packages\/ui\/package\.json$/,
  /^packages\/ui\/vitest(?:\.[\w-]+)?\.config\.ts$/,
  /^packages\/ui\/vitest\.setup\.ts$/,
  /^packages\/ui\/contract-smoke-tests\.generated\.json$/,
  /^packages\/ui\/component-contracts\.json$/,
  /^packages\/ui\/registry\.json$/,
];

export function vitestFullTestInventory({ root = ROOT } = {}) {
  const files = [];
  const walk = (relativeDirectory) => {
    const absoluteDirectory = join(root, relativeDirectory);
    const directoryStat = lstatSync(absoluteDirectory);
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory())
      throw new Error(
        `Vitest inventory root has unsupported filesystem type: ${relativeDirectory}`,
      );
    for (const name of readdirSync(absoluteDirectory).sort()) {
      const path = `${relativeDirectory}/${name}`;
      const stat = lstatSync(join(root, path));
      if (stat.isSymbolicLink())
        throw new Error(`Vitest inventory rejects symlink test/input: ${path}`);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile() && /\.test\.tsx$/.test(name)) files.push(path);
    }
  };
  walk("packages/ui/registry");
  walk("packages/ui/test");
  if (files.length === 0)
    throw new Error("Vitest full test inventory is empty");
  return files.sort();
}

function names(records) {
  return new Map(records.map((record) => [record.name, record]));
}

export function buildSmokeModel(records = readRecords()) {
  const byName = names(records);
  const selected = records.filter(
    (record) => record.coverage?.crossBrowserSmoke === "selected",
  );
  const selectedTests = new Set(
    selected.flatMap((record) => record.testFiles ?? []),
  );
  const impactByFile = new Map();

  function add(path, tests) {
    if (!impactByFile.has(path)) impactByFile.set(path, new Set());
    for (const test of tests) impactByFile.get(path).add(test);
  }

  for (const root of selected) {
    const tests = root.testFiles ?? [];
    const reached = new Set();
    const queue = [root.name];
    while (queue.length > 0) {
      const name = queue.pop();
      if (reached.has(name)) continue;
      reached.add(name);
      const record = byName.get(name);
      if (!record) continue;
      for (const path of record.sourceFiles ?? []) add(path, tests);
      for (const dependency of record.registryDependencies ?? [])
        queue.push(dependency.replace(/^@vegastack\//, ""));
    }
    for (const path of root.testFiles ?? []) add(path, tests);
  }

  return { records, selected, selectedTests, impactByFile };
}

export function buildUnitModel(records = readRecords()) {
  const byName = names(records);
  const directDependents = new Map();
  for (const record of records)
    for (const dependency of record.registryDependencies ?? []) {
      const name = dependency.replace(/^@vegastack\//, "");
      if (!directDependents.has(name)) directDependents.set(name, new Set());
      directDependents.get(name).add(record.name);
    }
  const impactByFile = new Map();
  for (const record of records) {
    const reached = new Set([record.name]);
    const queue = [record.name];
    while (queue.length > 0)
      for (const dependent of directDependents.get(queue.pop()) ?? []) {
        if (reached.has(dependent)) continue;
        reached.add(dependent);
        queue.push(dependent);
      }
    const tests = [...reached]
      .flatMap((name) => byName.get(name)?.testFiles ?? [])
      .sort();
    for (const path of record.sourceFiles ?? [])
      impactByFile.set(path, new Set(tests));
    for (const path of record.testFiles ?? [])
      impactByFile.set(path, new Set([path]));
  }
  return { records, impactByFile };
}

const IMPACT_INPUTS = [
  "pnpm-lock.yaml",
  "package.json",
  "packages/ui/package.json",
  "packages/ui/tsconfig.json",
  "config/typescript-config/package.json",
  "config/typescript-config/react-library.json",
  "config/typescript-config/base.json",
  "pnpm-workspace.yaml",
  "packages/ui/component-contracts.json",
  "packages/ui/registry.json",
  "packages/ui/vitest.config.ts",
  "packages/ui/vitest.smoke.config.ts",
  "packages/ui/vitest.all-browsers.config.ts",
  "packages/ui/vitest.setup.ts",
  "tooling/sync-smoke-impact.mjs",
  "tooling/lib/smoke-scope.mjs",
];

export function vitestImpactInputDigest({
  contentOverride = new Map(),
  records = readRecords(),
} = {}) {
  const hash = createHash("sha256");
  const inputs = [
    ...IMPACT_INPUTS,
    ...new Set(
      records.flatMap((record) => [
        ...(record.sourceFiles ?? []),
        ...(record.testFiles ?? []),
      ]),
    ),
  ].sort();
  const modeled = new Set(
    records.flatMap((record) => [
      ...(record.sourceFiles ?? []),
      ...(record.testFiles ?? []),
    ]),
  );
  for (const path of inputs) {
    const absolute = join(ROOT, path);
    const overridden = contentOverride.get(path);
    if (overridden === undefined && !existsSync(absolute)) {
      hash.update(`${path}\0missing\n`);
      continue;
    }
    const stat = overridden === undefined ? lstatSync(absolute) : null;
    const type =
      overridden !== undefined
        ? "override"
        : stat.isSymbolicLink()
          ? "symlink"
          : stat.isFile()
            ? "file"
            : "other";
    hash.update(`${path}\0${type}\0${stat?.mode.toString(8) ?? "0"}\0`);
    if (overridden !== undefined && !modeled.has(path)) {
      hash.update(String(overridden));
      hash.update("\n");
      continue;
    }
    if (type === "symlink") hash.update(readlinkSync(absolute));
    else if (
      (type === "file" || overridden !== undefined) &&
      modeled.has(path)
    ) {
      const source =
        overridden !== undefined
          ? String(overridden)
          : readFileSync(absolute, "utf8");
      const file = ts.createSourceFile(
        path,
        source,
        ts.ScriptTarget.Latest,
        true,
        path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const imports = [];
      const visit = (node) => {
        if (ts.isImportDeclaration(node))
          imports.push(
            ts.isStringLiteralLike(node.moduleSpecifier)
              ? `import:${node.moduleSpecifier.text}`
              : "import:computed",
          );
        else if (ts.isExportDeclaration(node) && node.moduleSpecifier)
          imports.push(
            ts.isStringLiteralLike(node.moduleSpecifier)
              ? `export:${node.moduleSpecifier.text}`
              : "export:computed",
          );
        else if (
          ts.isCallExpression(node) &&
          (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(node.expression) &&
              node.expression.text === "require"))
        )
          imports.push(
            ts.isStringLiteralLike(node.arguments[0])
              ? `dynamic:${node.arguments[0].text}`
              : "dynamic:computed",
          );
        ts.forEachChild(node, visit);
      };
      visit(file);
      hash.update(JSON.stringify(imports.sort()));
    } else if (type === "file") hash.update(readFileSync(absolute));
    hash.update("\n");
  }
  return hash.digest("hex");
}

function readShadow() {
  try {
    return JSON.parse(
      readFileSync(
        join(ROOT, "packages/ui/smoke-impact.generated.json"),
        "utf8",
      ),
    );
  } catch (error) {
    return { unreadable: error.message, entries: {}, unitEntries: {} };
  }
}

export function vitestImpactToolchain() {
  return { pinned: pinnedToolchain(), installed: installedToolchain() };
}

export function vitestImpactToolchainDigest(
  toolchain = vitestImpactToolchain(),
) {
  return createHash("sha256").update(JSON.stringify(toolchain)).digest("hex");
}

export function createVitestImpactContext() {
  const records = readRecords();
  const smokeModel = buildSmokeModel(records);
  const unitModel = buildUnitModel(records);
  const smokeRelatedModel = {
    records,
    impactByFile: new Map(
      [...unitModel.impactByFile.keys()].map((path) => [
        path,
        new Set(smokeModel.impactByFile.get(path) ?? []),
      ]),
    ),
  };
  const authorityFingerprintAtConstruction = authorityFingerprint(
    VITEST_IMPACT_AUTHORITY_PATHS,
  );
  const toolchain = vitestImpactToolchain();
  const toolchainDigest = vitestImpactToolchainDigest(toolchain);
  const inputDigest = vitestImpactInputDigest({ records });
  const shadow = readShadow();
  const shadowCurrent =
    !shadow.unreadable &&
    shadow.contractSha256 === contractSha256() &&
    shadow.inputDigest === inputDigest &&
    shadow.toolchainDigest === toolchainDigest &&
    JSON.stringify(shadow.toolchain) === JSON.stringify(toolchain);
  return {
    records,
    smokeModel,
    unitModel,
    smokeRelatedModel,
    shadow,
    shadowCurrent,
    inputDigest,
    toolchain,
    toolchainDigest,
    authorityFingerprint: authorityFingerprintAtConstruction,
    assertCurrent() {
      assertAuthorityFingerprint(
        VITEST_IMPACT_AUTHORITY_PATHS,
        authorityFingerprintAtConstruction,
        "Vitest-impact authority",
      );
      const currentToolchain = vitestImpactToolchain();
      if (
        vitestImpactToolchainDigest(currentToolchain) !== toolchainDigest ||
        JSON.stringify(currentToolchain) !== JSON.stringify(toolchain)
      )
        throw new Error(
          "Vitest-impact toolchain changed while its model was in memory",
        );
      return true;
    },
  };
}

const DEFAULT_CONTEXT = createVitestImpactContext();
export const SMOKE_MODEL = DEFAULT_CONTEXT.smokeModel;
export const SMOKE_SELECTED_TESTS = [...SMOKE_MODEL.selectedTests].sort();
export const SMOKE_DEPENDENCY_SOURCES = [...SMOKE_MODEL.impactByFile.keys()]
  .filter(
    (path) =>
      !SMOKE_MODEL.selected.some((record) =>
        [...(record.sourceFiles ?? []), ...(record.testFiles ?? [])].includes(
          path,
        ),
      ),
  )
  .sort();
export const UNIT_MODEL = DEFAULT_CONTEXT.unitModel;
export const SMOKE_RELATED_MODEL = DEFAULT_CONTEXT.smokeRelatedModel;

export function smokeImpact(
  changedFiles,
  { context = createVitestImpactContext(), shadow = context.shadow } = {},
) {
  context.assertCurrent();
  const tests = new Set();
  const reasons = [];
  let full = false;
  let disagreement = false;
  const shadowCurrent =
    shadow === context.shadow
      ? context.shadowCurrent
      : !shadow.unreadable &&
        shadow.contractSha256 === contractSha256() &&
        shadow.inputDigest === context.inputDigest &&
        shadow.toolchainDigest === context.toolchainDigest &&
        JSON.stringify(shadow.toolchain) === JSON.stringify(context.toolchain);

  for (const path of changedFiles) {
    if (SMOKE_GLOBAL_INPUTS.some((pattern) => pattern.test(path))) {
      full = true;
      reasons.push(`${path}: global smoke input`);
      continue;
    }
    const modeled = context.unitModel.impactByFile.has(path);
    const registry = context.smokeModel.impactByFile.get(path) ?? new Set();
    for (const test of registry) tests.add(test);

    const isRegistryCode = /^packages\/ui\/registry\/.+\.tsx?$/.test(path);
    if (isRegistryCode && !modeled) {
      full = true;
      reasons.push(`${path}: unmodeled registry source/test`);
      continue;
    }
    if (!modeled) continue;
    if (!shadowCurrent) {
      full = true;
      reasons.push(
        `${path}: Vitest-related shadow is missing, unreadable, or stale`,
      );
      continue;
    }
    const entry = shadow.entries?.[path];
    if (!entry) {
      full = true;
      reasons.push(`${path}: no Vitest-related shadow entry`);
      continue;
    }
    for (const test of entry.vitestTests ?? []) tests.add(test);
    if (entry.disagreement) {
      disagreement = true;
      reasons.push(`${path}: registry/Vitest related selection disagrees`);
    }
  }

  return {
    required: full || disagreement || tests.size > 0,
    full: full || disagreement,
    tests: [...tests].sort(),
    reasons,
    disagreement,
    shadowCurrent,
  };
}

export function vitestImpact(
  changedFiles,
  { context = createVitestImpactContext(), shadow = context.shadow } = {},
) {
  context.assertCurrent();
  const tests = new Set();
  const reasons = [];
  let full = false;
  let disagreement = false;
  const shadowCurrent =
    shadow === context.shadow
      ? context.shadowCurrent
      : !shadow.unreadable &&
        shadow.contractSha256 === contractSha256() &&
        shadow.inputDigest === context.inputDigest &&
        shadow.toolchainDigest === context.toolchainDigest &&
        JSON.stringify(shadow.toolchain) === JSON.stringify(context.toolchain);
  for (const path of changedFiles) {
    const registry = context.unitModel.impactByFile.get(path);
    if (!registry) {
      if (/^packages\/ui\/registry\/.+\.[cm]?[jt]sx?$/.test(path)) {
        full = true;
        reasons.push(`${path}: unmodeled unit source/test`);
      }
      continue;
    }
    for (const test of registry) tests.add(test);
    if (!shadowCurrent) {
      full = true;
      reasons.push(`${path}: Vitest-related unit authority is stale`);
      continue;
    }
    const entry = shadow.unitEntries?.[path];
    if (!entry) {
      full = true;
      reasons.push(`${path}: no Vitest-related unit entry`);
      continue;
    }
    for (const test of entry.vitestTests ?? []) tests.add(test);
    if (entry.disagreement) {
      disagreement = true;
      reasons.push(`${path}: registry/Vitest unit selection disagrees`);
    }
  }
  return {
    required: full || disagreement || tests.size > 0,
    full: full || disagreement,
    tests: [...tests].sort(),
    reasons,
    disagreement,
    shadowCurrent,
  };
}
