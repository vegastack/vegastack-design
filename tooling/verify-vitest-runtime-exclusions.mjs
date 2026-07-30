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
  const capabilityFunctions = [];
  const pasteDeclarations = [];
  const vitestTestImports = [];
  const directPasteCalls = [];
  const pasteNames = [];
  const disablingApis = [];
  const invalidBindings = [];

  for (const statement of parsed.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "syntheticClipboardFilesSupported"
    )
      capabilityFunctions.push(statement);
    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.length === 1 &&
      ts.isIdentifier(statement.declarationList.declarations[0].name) &&
      statement.declarationList.declarations[0].name.text === "pasteTest"
    ) {
      pasteDeclarations.push({
        statement,
        declaration: statement.declarationList.declarations[0],
      });
    }
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === "vitest" &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    )
      for (const specifier of statement.importClause.namedBindings.elements)
        if (
          specifier.name.text === "test" &&
          (specifier.propertyName?.text ?? "test") === "test"
        )
          vitestTestImports.push(specifier);
    if (
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression) &&
      statement.expression.expression.text === "pasteTest"
    )
      directPasteCalls.push(statement.expression);
  }

  if (
    capabilityFunctions.length !== 1 ||
    pasteDeclarations.length !== 1 ||
    vitestTestImports.length !== 1
  )
    throw new Error(
      `${VITEST_RUNTIME_EXCLUSION_SOURCE}: capability probe, top-level pasteTest declaration, and direct Vitest test import must each exist exactly once`,
    );
  const capabilityFunction = capabilityFunctions[0];
  const { statement: pasteStatement, declaration: pasteDeclaration } =
    pasteDeclarations[0];
  const pasteInitializer = pasteDeclaration.initializer;
  const pasteTestApiIdentifier =
    pasteInitializer &&
    ts.isCallExpression(pasteInitializer) &&
    ts.isPropertyAccessExpression(pasteInitializer.expression) &&
    pasteInitializer.expression.name.text === "skipIf" &&
    ts.isIdentifier(pasteInitializer.expression.expression) &&
    pasteInitializer.expression.expression.text === "test"
      ? pasteInitializer.expression.expression
      : null;
  if (!pasteTestApiIdentifier)
    throw new Error(
      `${VITEST_RUNTIME_EXCLUSION_SOURCE}: pasteTest must bind directly to imported test.skipIf`,
    );
  const directPasteCallSet = new Set(directPasteCalls);

  function visit(node) {
    const disabledBy = disablingApi(node);
    if (disabledBy) disablingApis.push({ node, disabledBy });
    if (ts.isIdentifier(node) && node.text === "pasteTest") {
      const isDeclaration = node === pasteDeclaration.name;
      const isDirectCall =
        ts.isCallExpression(node.parent) &&
        node.parent.expression === node &&
        directPasteCallSet.has(node.parent);
      if (!isDeclaration && !isDirectCall)
        invalidBindings.push(
          "pasteTest must not be shadowed, aliased, assigned, or deferred",
        );
    }
    if (ts.isIdentifier(node) && node.text === "test") {
      const isImport = vitestTestImports.some(
        (specifier) =>
          node === specifier.name || node === specifier.propertyName,
      );
      const isDirectTestCall =
        ts.isCallExpression(node.parent) && node.parent.expression === node;
      const isBoundSkipIf = node === pasteTestApiIdentifier;
      if (!isImport && !isDirectTestCall && !isBoundSkipIf)
        invalidBindings.push(
          "imported test must not be shadowed, aliased, assigned, or mutated",
        );
    }
    if (directPasteCallSet.has(node)) {
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

  if (invalidBindings.length > 0)
    throw new Error(
      `${VITEST_RUNTIME_EXCLUSION_SOURCE}: registration binding is not exact (${[...new Set(invalidBindings)].join("; ")})`,
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
  const normalized = [
    "vitest:test<-test",
    printer.printNode(ts.EmitHint.Unspecified, capabilityFunction, parsed),
    printer.printNode(ts.EmitHint.Unspecified, pasteStatement, parsed),
  ].join("\n");
  const binding = createHash("sha256").update(normalized).digest("hex");
  if (binding !== VITEST_RUNTIME_EXCLUSION_SOURCE_BINDING)
    throw new Error(
      `${VITEST_RUNTIME_EXCLUSION_SOURCE}: capability/source binding changed; review the probe before updating its authority (actual ${binding})`,
    );
  const expectedNames = VITEST_RUNTIME_EXCLUSIONS.map(
    ({ testName }) => testName,
  ).sort();
  assert.deepEqual(
    [...pasteNames].sort(),
    expectedNames,
    `${VITEST_RUNTIME_EXCLUSION_SOURCE}: direct top-level pasteTest registrations must exactly match the reviewed exclusion authority`,
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

function rewriteFirstPasteRegistration(source, rewrite) {
  const parsed = sourceFile(source, VITEST_RUNTIME_EXCLUSION_SOURCE);
  const statement = parsed.statements.find(
    (entry) =>
      ts.isExpressionStatement(entry) &&
      ts.isCallExpression(entry.expression) &&
      ts.isIdentifier(entry.expression.expression) &&
      entry.expression.expression.text === "pasteTest",
  );
  assert.ok(
    statement,
    "fixture source must contain a direct pasteTest registration",
  );
  const start = statement.getStart(parsed);
  return `${source.slice(0, start)}${rewrite(source.slice(start, statement.end))}${source.slice(statement.end)}`;
}

for (const [label, source, expected] of [
  [
    "arbitrary test.skip",
    `${realSource}\ntest.skip("disabled regression", () => {});\n`,
    /registration binding is not exact|only the exact test\.skipIf/,
  ],
  [
    "arbitrary test.skipIf(true)",
    `${realSource}\ntest.skipIf(true)("disabled regression", () => {});\n`,
    /registration binding is not exact|only the exact test\.skipIf/,
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
    /direct top-level pasteTest registrations must exactly match/,
  ],
  [
    "reviewed test removed",
    realSource.replace(
      new RegExp(
        `pasteTest\\(\\n  ${JSON.stringify(firstName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")},[\\s\\S]*?\\n\\);`,
      ),
      "",
    ),
    /direct top-level pasteTest registrations must exactly match/,
  ],
  [
    "extra paste exclusion",
    `${realSource}\npasteTest("extra disabled regression", async () => {});\n`,
    /direct top-level pasteTest registrations must exactly match/,
  ],
  [
    "all reviewed registrations short-circuited",
    realSource.replaceAll("\npasteTest(", "\nfalse && pasteTest("),
    /registration binding is not exact|direct top-level pasteTest registrations/,
  ],
  [
    "one reviewed registration short-circuited",
    rewriteFirstPasteRegistration(
      realSource,
      (registration) => `false && ${registration}`,
    ),
    /registration binding is not exact|direct top-level pasteTest registrations/,
  ],
  [
    "reviewed registration behind if false",
    rewriteFirstPasteRegistration(
      realSource,
      (registration) => `if (false) {\n${registration}\n}`,
    ),
    /registration binding is not exact|direct top-level pasteTest registrations/,
  ],
  [
    "reviewed registration behind a ternary",
    rewriteFirstPasteRegistration(
      realSource,
      (registration) => `true ? undefined : ${registration.replace(/;$/, "")};`,
    ),
    /registration binding is not exact|direct top-level pasteTest registrations/,
  ],
  [
    "reviewed registration deferred in a function",
    rewriteFirstPasteRegistration(
      realSource,
      (registration) =>
        `function deferredPasteRegistration() {\n${registration}\n}`,
    ),
    /registration binding is not exact|direct top-level pasteTest registrations/,
  ],
  [
    "shadowed pasteTest registration",
    rewriteFirstPasteRegistration(
      realSource,
      (registration) =>
        `function deferredPasteRegistration(pasteTest: typeof test) {\n${registration}\n}`,
    ),
    /registration binding is not exact|direct top-level pasteTest registrations/,
  ],
  [
    "computed test API reassignment",
    realSource.replace(
      "const pasteTest =",
      '(test as any)["skip" + "If"] = () => () => {};\nconst pasteTest =',
    ),
    /registration binding is not exact/,
  ],
  [
    "defineProperty test API mutation",
    realSource.replace(
      "const pasteTest =",
      'Object.defineProperty(test, "skipIf", { value: () => () => {} });\nconst pasteTest =',
    ),
    /registration binding is not exact/,
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
const unrelatedDropzoneFirefoxLeaf = {
  file: VITEST_RUNTIME_EXCLUSION_SOURCE,
  engine: "firefox",
  testName: "unrelated Dropzone regression",
  status: "passed",
};
assert.throws(
  () =>
    reconcileVitestRuntimeExclusions({
      gate: "all-browsers",
      executedLeaves: [
        unrelatedDropzoneFirefoxLeaf,
        ...exactRuntimeLeaves.slice(1),
      ],
    }),
  /absent from the required-or-excluded universe/,
  "a partial runtime-exclusion cohort cannot silently omit one approved leaf",
);
assert.throws(
  () =>
    reconcileVitestRuntimeExclusions({
      gate: "all-browsers",
      executedLeaves: [unrelatedDropzoneFirefoxLeaf],
    }),
  /absent from the required-or-excluded universe/,
  "zero exclusions cannot masquerade as capability recovery when all approved leaves disappeared",
);
const recoveredCapabilityLeaves = exactRuntimeLeaves.map((entry) => ({
  ...entry,
  status: "passed",
}));
assert.deepEqual(
  reconcileVitestRuntimeExclusions({
    gate: "all-browsers",
    executedLeaves: [
      unrelatedDropzoneFirefoxLeaf,
      ...recoveredCapabilityLeaves,
    ],
    selectedLeaves: recoveredCapabilityLeaves.map(
      ({ file, engine, testName }) => `${file}\0${engine}\0${testName}`,
    ),
  }),
  { status: "pass", count: 0, leaves: [] },
  "a real capability recovery is accepted only when all five exact leaves were listed and passed",
);

console.log(
  `✓ Vitest runtime exclusions: ${VITEST_RUNTIME_EXCLUSIONS.length} exact source-bound direct registrations must each be excluded or listed-and-passed; missing, arbitrary, aliased, computed, conditional, stale, renamed, removed, and cross-file disabling rejects`,
);
