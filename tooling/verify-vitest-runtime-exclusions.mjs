#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { globSync, lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

import { ROOT } from "./lib/change-set.mjs";
import {
  reconcileVitestRuntimeExclusions,
  VITEST_RUNTIME_EXCLUSIONS,
  VITEST_RUNTIME_EXCLUSION_SOURCE,
  VITEST_RUNTIME_EXCLUSION_SOURCE_BINDING,
  vitestRuntimeExclusionsForGate,
} from "./lib/vitest-runtime-exclusions.mjs";

const printer = ts.createPrinter({ removeComments: true });
const DISABLING_PROPERTIES = new Set(["runIf", "skip", "skipIf", "todo"]);
const DISABLING_IDENTIFIERS = new Set(["xdescribe", "xit", "xtest"]);

function sourceFile(source, file) {
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  if (parsed.parseDiagnostics.length > 0)
    throw new Error(`${file}: test source has syntax errors`);
  return parsed;
}

function disablingApi(node) {
  if (
    ts.isPropertyAccessExpression(node) &&
    DISABLING_PROPERTIES.has(node.name.text)
  )
    return `.${node.name.text}`;
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression &&
    (ts.isStringLiteral(node.argumentExpression) ||
      ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)) &&
    DISABLING_PROPERTIES.has(node.argumentExpression.text)
  )
    return `[${JSON.stringify(node.argumentExpression.text)}]`;
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    DISABLING_IDENTIFIERS.has(node.expression.text)
  )
    return node.expression.text;
  if (ts.isBindingElement(node)) {
    const name = ts.isIdentifier(node.name) ? node.name.text : "";
    const property =
      node.propertyName && ts.isIdentifier(node.propertyName)
        ? node.propertyName.text
        : "";
    if (DISABLING_PROPERTIES.has(name) || DISABLING_PROPERTIES.has(property))
      return `binding:${property || name}`;
  }
  return null;
}

function inspectBoundSource(source) {
  const parsed = sourceFile(source, VITEST_RUNTIME_EXCLUSION_SOURCE);
  const capabilityNodes = [];
  const pasteNames = [];
  const disablingApis = [];

  for (const statement of parsed.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "syntheticClipboardFilesSupported"
    )
      capabilityNodes.push(statement);
    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some(
        (declaration) =>
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "pasteTest",
      )
    )
      capabilityNodes.push(statement);
  }

  function visit(node) {
    const disabledBy = disablingApi(node);
    if (disabledBy) disablingApis.push({ node, disabledBy });
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "pasteTest"
    ) {
      const [name, implementation] = node.arguments;
      if (
        !name ||
        !ts.isStringLiteral(name) ||
        !implementation ||
        (!ts.isArrowFunction(implementation) &&
          !ts.isFunctionExpression(implementation))
      )
        throw new Error(
          `${VITEST_RUNTIME_EXCLUSION_SOURCE}: pasteTest requires an exact string name and implementation`,
        );
      pasteNames.push(name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);

  if (capabilityNodes.length !== 2)
    throw new Error(
      `${VITEST_RUNTIME_EXCLUSION_SOURCE}: capability probe and pasteTest declaration must each exist exactly once`,
    );
  if (
    disablingApis.length !== 1 ||
    disablingApis[0].disabledBy !== ".skipIf" ||
    !ts.isPropertyAccessExpression(disablingApis[0].node) ||
    !ts.isIdentifier(disablingApis[0].node.expression) ||
    disablingApis[0].node.expression.text !== "test"
  )
    throw new Error(
      `${VITEST_RUNTIME_EXCLUSION_SOURCE}: only the exact test.skipIf capability declaration is allowed`,
    );
  const normalized = capabilityNodes
    .map((node) => printer.printNode(ts.EmitHint.Unspecified, node, parsed))
    .join("\n");
  const binding = createHash("sha256").update(normalized).digest("hex");
  if (binding !== VITEST_RUNTIME_EXCLUSION_SOURCE_BINDING)
    throw new Error(
      `${VITEST_RUNTIME_EXCLUSION_SOURCE}: capability/source binding changed; review the probe before updating its authority`,
    );
  const expectedNames = VITEST_RUNTIME_EXCLUSIONS.map(
    ({ testName }) => testName,
  ).sort();
  assert.deepEqual(
    [...pasteNames].sort(),
    expectedNames,
    `${VITEST_RUNTIME_EXCLUSION_SOURCE}: pasteTest calls must exactly match the reviewed exclusion authority`,
  );
  return { binding, pasteNames: [...pasteNames].sort() };
}

function rejectOtherSkipApis(source, file) {
  const parsed = sourceFile(source, file);
  const findings = [];
  function visit(node) {
    const disabledBy = disablingApi(node);
    if (disabledBy) findings.push(disabledBy);
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  if (findings.length > 0)
    throw new Error(
      `${file}: unreviewed Vitest disabling API (${findings.join(", ")}); runtime exclusions require exact authority`,
    );
}

const testFiles = globSync("packages/ui/**/*", {
  cwd: ROOT,
  exclude: ["packages/ui/node_modules/**"],
}).filter((file) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file));
const sourceTestFiles = testFiles.filter((file) =>
  lstatSync(join(ROOT, file)).isFile(),
);
for (const file of sourceTestFiles) {
  const source = readFileSync(join(ROOT, file), "utf8");
  if (file === VITEST_RUNTIME_EXCLUSION_SOURCE) inspectBoundSource(source);
  else rejectOtherSkipApis(source, file);
}

const realSource = readFileSync(
  join(ROOT, VITEST_RUNTIME_EXCLUSION_SOURCE),
  "utf8",
);
const firstName = VITEST_RUNTIME_EXCLUSIONS[0].testName;
for (const [label, source, expected] of [
  [
    "arbitrary test.skip",
    `${realSource}\ntest.skip("disabled regression", () => {});\n`,
    /only the exact test\.skipIf capability declaration/,
  ],
  [
    "arbitrary test.skipIf(true)",
    `${realSource}\ntest.skipIf(true)("disabled regression", () => {});\n`,
    /only the exact test\.skipIf capability declaration/,
  ],
  [
    "capability replaced by unconditional true",
    realSource.replace(
      "test.skipIf(!syntheticClipboardFilesSupported())",
      "test.skipIf(true)",
    ),
    /capability\/source binding changed/,
  ],
  [
    "reviewed test renamed",
    realSource.replace(firstName, `${firstName} renamed`),
    /pasteTest calls must exactly match/,
  ],
  [
    "reviewed test removed",
    realSource.replace(
      new RegExp(
        `pasteTest\\(\\n  ${JSON.stringify(firstName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")},[\\s\\S]*?\\n\\);`,
      ),
      "",
    ),
    /pasteTest calls must exactly match/,
  ],
  [
    "extra paste exclusion",
    `${realSource}\npasteTest("extra disabled regression", async () => {});\n`,
    /pasteTest calls must exactly match/,
  ],
]) {
  assert.throws(() => inspectBoundSource(source), expected, label);
}
assert.throws(
  () =>
    rejectOtherSkipApis(
      'import { test } from "vitest"; test.skip("disabled", () => {});',
      "packages/ui/other.test.ts",
    ),
  /unreviewed Vitest disabling API/,
  "a skip in another test file cannot inherit the Dropzone capability exception",
);
for (const [label, source] of [
  [
    "aliased property skip",
    'import { test } from "vitest"; const disabled = test.skip; disabled("regression", () => {});',
  ],
  [
    "destructured skip",
    'import { test } from "vitest"; const { skip: disabled } = test; disabled("regression", () => {});',
  ],
  [
    "computed skip",
    'import { test } from "vitest"; test["skip"]("regression", () => {});',
  ],
  ["todo", 'import { test } from "vitest"; test.todo("regression");'],
  [
    "conditional runIf",
    'import { test } from "vitest"; test.runIf(false)("regression", () => {});',
  ],
  ["xtest", 'import { xtest } from "vitest"; xtest("regression", () => {});'],
])
  assert.throws(
    () => rejectOtherSkipApis(source, "packages/ui/other.test.ts"),
    /unreviewed Vitest disabling API/,
    `${label} cannot bypass the reviewed runtime-exclusion authority`,
  );

const exactRuntimeLeaves = VITEST_RUNTIME_EXCLUSIONS.map((entry) => ({
  file: entry.file,
  engine: entry.engine,
  testName: entry.testName,
  status: "skipped",
}));
assert.deepEqual(
  vitestRuntimeExclusionsForGate("smoke", {
    files: ["packages/ui/registry/ui/button.test.tsx"],
    engines: ["chromium", "firefox", "webkit"],
  }),
  [],
  "a scoped lane that does not select Dropzone receives no unrelated exclusion authority",
);
assert.equal(
  vitestRuntimeExclusionsForGate("smoke", {
    files: [VITEST_RUNTIME_EXCLUSION_SOURCE],
    engines: ["chromium", "firefox", "webkit"],
  }).length,
  VITEST_RUNTIME_EXCLUSIONS.length,
  "the exact authority is available when the lane selects Dropzone and Firefox",
);
assert.deepEqual(
  reconcileVitestRuntimeExclusions({
    gate: "all-browsers",
    executedLeaves: exactRuntimeLeaves,
  }),
  {
    status: "pass",
    count: VITEST_RUNTIME_EXCLUSIONS.length,
    leaves: VITEST_RUNTIME_EXCLUSIONS.map(
      ({ file, engine, testName, capability }) => ({
        leaf: `${file}\0${engine}\0${testName}`,
        capability,
      }),
    ).sort((left, right) => left.leaf.localeCompare(right.leaf)),
  },
  "the exact reviewed runtime exclusions remain visible and accepted",
);
assert.throws(
  () =>
    reconcileVitestRuntimeExclusions({
      gate: "all-browsers",
      executedLeaves: [
        ...exactRuntimeLeaves,
        {
          ...exactRuntimeLeaves[0],
          testName: "arbitrarily disabled regression",
        },
      ],
    }),
  /unapproved runtime-excluded Vitest leaf/,
  "a reporter-visible arbitrary skip cannot inherit the exact authority",
);
assert.throws(
  () =>
    reconcileVitestRuntimeExclusions({
      gate: "all-browsers",
      executedLeaves: exactRuntimeLeaves,
      selectedLeaves: [
        `${exactRuntimeLeaves[0].file}\0${exactRuntimeLeaves[0].engine}\0${exactRuntimeLeaves[0].testName}`,
      ],
    }),
  /pre-listed required Vitest leaf was skipped/,
  "an allowlisted identity still fails when the independent pre-run list requires it",
);

console.log(
  `✓ Vitest runtime exclusions: ${VITEST_RUNTIME_EXCLUSIONS.length} exact Firefox capability leaves are source-bound; arbitrary, aliased, computed, conditional, stale, renamed, removed, and cross-file disabling rejects`,
);
