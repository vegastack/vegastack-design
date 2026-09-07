#!/usr/bin/env node
// Deterministically mirror the lucide-animated registry into VegaStack's canonical icon sources.
//
// Default mode regenerates from the committed URL/MIT/SHA-256 manifest and fails closed if upstream
// bytes have changed. `--refresh` is the explicit upstream-update operation: it re-reads the index,
// records fresh hashes, and then regenerates. `--check` performs the same fetch/transform without
// writing. This script intentionally does NOT touch registry.json, docs copy-ins, or public registry
// JSON; the normal registry build owns those derived artifacts.
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { format, resolveConfig } from "prettier";
import ts from "typescript";
import {
  assertExistingPathInside,
  assertGeneratedName,
  assertWritablePathInside,
  resolveInside,
} from "./safe-path.mjs";

const REGISTRY = "https://lucide-animated.com/r";
const INDEX_URL = `${REGISTRY}/registry.json`;
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = resolveInside(REPO_ROOT, "packages/ui/registry/ui/icons");
const MANIFEST_PATH = resolveInside(
  REPO_ROOT,
  "packages/ui/animated-icon-sources.json",
);
const SAFE_SOURCE_DIR = existsSync(SOURCE_DIR)
  ? assertExistingPathInside(REPO_ROOT, SOURCE_DIR)
  : assertWritablePathInside(REPO_ROOT, SOURCE_DIR);
const EXPECTED_COUNT = 439;
const CONCURRENCY = 12;

const args = new Set(process.argv.slice(2));
const refresh = args.has("--refresh");
const check = args.has("--check");
const unknownArgs = [...args].filter(
  (arg) => !["--refresh", "--check"].includes(arg),
);
if (unknownArgs.length > 0) {
  throw new Error(`unknown argument(s): ${unknownArgs.join(", ")}`);
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

// `registry:build` owns the single provenance header at line 1. The mirror owns
// everything after it, so deterministic checks compare the normalized body and
// do not erase a valid stamp when upstream bytes are unchanged.
function stripRegistryProvenance(source) {
  return source.replace(/^\/\/ @vegastack icon-[^\n]+\n\n/, "");
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableJson(child)]),
    );
  }
  return value;
}

async function fetchJson(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "error" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === tries) {
        throw new Error(
          `fetch ${url}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  throw new Error(`fetch ${url}: exhausted retries`);
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await fn(items[index], index);
      }
    }),
  );
  return results;
}

function parse(source, filename) {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const diagnostics = file.parseDiagnostics;
  if (diagnostics.length > 0) {
    throw new Error(
      `${filename}: generated invalid TSX: ${diagnostics
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
        )
        .join("; ")}`,
    );
  }
  return file;
}

function applyEdits(source, edits) {
  const ordered = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let previousStart = source.length + 1;
  let output = source;
  for (const edit of ordered) {
    if (edit.end > previousStart)
      throw new Error("overlapping generator edits");
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
    previousStart = edit.start;
  }
  return output;
}

function namedImport(source, filename, moduleName, { add = [], remove = [] }) {
  const file = parse(source, filename);
  const declaration = file.statements.find(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === moduleName &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      !statement.importClause.isTypeOnly,
  );
  if (!declaration || !ts.isImportDeclaration(declaration)) {
    throw new Error(`${filename}: missing value import from ${moduleName}`);
  }
  const clause = declaration.importClause;
  const named = clause?.namedBindings;
  if (!clause || !named || !ts.isNamedImports(named)) {
    throw new Error(`${filename}: unsupported import shape from ${moduleName}`);
  }
  const specifiers = named.elements
    .filter((specifier) => !remove.includes(specifier.name.text))
    .map((specifier) => specifier.getText(file));
  const importedNames = new Set(
    named.elements.map((specifier) => specifier.name.text),
  );
  for (const name of add) if (!importedNames.has(name)) specifiers.push(name);
  const defaultName = clause.name ? `${clause.name.text}, ` : "";
  return applyEdits(source, [
    {
      start: declaration.getStart(file),
      end: declaration.end,
      text: `import ${defaultName}{ ${specifiers.join(", ")} } from ${JSON.stringify(moduleName)};`,
    },
  ]);
}

function findForwardRef(source, filename) {
  const file = parse(source, filename);
  let call;
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "forwardRef"
    ) {
      if (call) throw new Error(`${filename}: multiple forwardRef calls`);
      call = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!call || !ts.isCallExpression(call))
    throw new Error(`${filename}: missing forwardRef call`);
  if (call.typeArguments?.length !== 2 || call.arguments.length !== 1) {
    throw new Error(`${filename}: unsupported forwardRef signature`);
  }
  const arrow = call.arguments[0];
  if (!ts.isArrowFunction(arrow) || arrow.parameters.length !== 2) {
    throw new Error(
      `${filename}: forwardRef must wrap a two-parameter arrow function`,
    );
  }
  return { file, call, arrow };
}

function convertRefAsProp(source, filename) {
  const { file, call, arrow } = findForwardRef(source, filename);
  const handleName = call.typeArguments[0].getText(file);
  const propsName = call.typeArguments[1].getText(file);
  const firstParameter = arrow.parameters[0];
  if (!ts.isObjectBindingPattern(firstParameter.name)) {
    throw new Error(`${filename}: icon props must be destructured`);
  }

  const bindingText = firstParameter.name.getText(file);
  const restIndex = bindingText.lastIndexOf("...");
  let bindingWithRef =
    restIndex === -1
      ? bindingText.replace(/}\s*$/, "ref }")
      : `${bindingText.slice(0, restIndex)}ref, ${bindingText.slice(restIndex)}`;
  if (!/\bsize\b/.test(bindingWithRef)) {
    const updatedRestIndex = bindingWithRef.lastIndexOf("...");
    bindingWithRef =
      updatedRestIndex === -1
        ? bindingWithRef.replace(/}\s*$/, 'size = "var(--icon-default)" }')
        : `${bindingWithRef.slice(0, updatedRestIndex)}size = "var(--icon-default)", ${bindingWithRef.slice(updatedRestIndex)}`;
  }
  const arrowText = arrow.getText(file);
  const relativeParameterStart =
    firstParameter.getStart(file) - arrow.getStart(file);
  const relativeParameterEnd = arrow.parameters[1].end - arrow.getStart(file);
  const propsDeclaration = file.statements.find(
    (statement) =>
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === propsName,
  );
  const annotation = propsDeclaration
    ? propsName
    : `Omit<${propsName}, "ref"> & { size?: number | string; ref?: React.Ref<${handleName}> }`;
  const refArrow =
    arrowText.slice(0, relativeParameterStart) +
    `${bindingWithRef}: ${annotation}` +
    arrowText.slice(relativeParameterEnd);

  if (!propsDeclaration) {
    return applyEdits(source, [
      { start: call.getStart(file), end: call.end, text: refArrow },
    ]);
  }
  const propsText = propsDeclaration.getText(file);
  if (!/size\?:\s*number\s*;/.test(propsText)) {
    throw new Error(
      `${filename}: ${propsName} must declare numeric upstream size`,
    );
  }
  const refPropsText = propsText.replace(
    /size\?:\s*number\s*;/,
    `size?: number | string;\n  ref?: React.Ref<${handleName}>;`,
  );

  return applyEdits(source, [
    {
      start: propsDeclaration.getStart(file),
      end: propsDeclaration.end,
      text: refPropsText,
    },
    { start: call.getStart(file), end: call.end, text: refArrow },
  ]);
}

function normalizeSvgContract(source, filename) {
  let output = source.replace(
    /size\s*=\s*\d+(?:\.\d+)?\b/g,
    'size = "var(--icon-default)"',
  );
  const file = parse(output, filename);
  const edits = [];
  let roots = 0;

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(file);
      const attributes = new Map(
        node.attributes.properties
          .filter(ts.isJsxAttribute)
          .map((attribute) => [attribute.name.getText(file), attribute]),
      );
      if (
        (tagName === "svg" || tagName === "motion.svg") &&
        attributes.has("xmlns")
      ) {
        roots += 1;
        if (!attributes.has("viewBox")) {
          const width = attributes.get("width");
          if (!width)
            throw new Error(
              `${filename}: root SVG missing width anchor for viewBox`,
            );
          const lineStart = output.lastIndexOf("\n", width.getStart(file)) + 1;
          const attributeIndent = output.slice(lineStart, width.getStart(file));
          edits.push({
            start: width.getStart(file),
            end: width.getStart(file),
            text: `viewBox="0 0 24 24"\n${attributeIndent}`,
          });
        }
        for (const name of ["height", "width"]) {
          const attribute = attributes.get(name);
          if (!attribute?.initializer)
            throw new Error(`${filename}: root SVG missing ${name}`);
          edits.push({
            start: attribute.initializer.getStart(file),
            end: attribute.initializer.end,
            text: "{size}",
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (roots !== 1)
    throw new Error(`${filename}: expected one root SVG, found ${roots}`);
  output = applyEdits(output, edits);
  return output;
}

function normalizePublicHandleName(source, filename) {
  const file = parse(source, filename);
  const handle = file.statements.find(
    (statement) =>
      ts.isInterfaceDeclaration(statement) &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) &&
      statement.members.some(
        (member) => member.name?.getText(file) === "startAnimation",
      ) &&
      statement.members.some(
        (member) => member.name?.getText(file) === "stopAnimation",
      ),
  );
  if (!handle || !ts.isInterfaceDeclaration(handle)) {
    throw new Error(`${filename}: missing exported animation handle`);
  }
  const displayNameMatch = source.match(
    /\.displayName\s*=\s*"([A-Za-z0-9]+Icon)"/,
  );
  let exportedIconName = displayNameMatch?.[1];
  if (!exportedIconName) {
    for (const statement of file.statements) {
      if (
        ts.isExportDeclaration(statement) &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
      ) {
        exportedIconName ??= statement.exportClause.elements.find((element) =>
          /Icon$/.test(element.name.text),
        )?.name.text;
      }
      if (
        ts.isVariableStatement(statement) &&
        statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      ) {
        const declaration = statement.declarationList.declarations.find(
          (candidate) =>
            ts.isIdentifier(candidate.name) &&
            /Icon$/.test(candidate.name.text),
        );
        if (declaration && ts.isIdentifier(declaration.name))
          exportedIconName ??= declaration.name.text;
      }
    }
  }
  if (!exportedIconName)
    throw new Error(`${filename}: missing exported icon symbol`);
  const existingName = handle.name.text;
  const expectedName = `${exportedIconName}Handle`;
  if (existingName === expectedName) return source;

  const renamed = source.replace(
    new RegExp(`\\b${existingName}\\b`, "g"),
    expectedName,
  );
  const renamedFile = parse(renamed, filename);
  const renamedHandle = renamedFile.statements.find(
    (statement) =>
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === expectedName,
  );
  if (!renamedHandle)
    throw new Error(`${filename}: failed to normalize handle name`);
  return applyEdits(renamed, [
    {
      start: renamedHandle.end,
      end: renamedHandle.end,
      text: `\n\n/** @deprecated Use ${expectedName}. */\nexport type ${existingName} = ${expectedName};`,
    },
  ]);
}

function componentFacts(source, filename) {
  const file = parse(source, filename);
  let component;
  const controls = [];
  let imperativeStatement;
  let enterStatement;
  let leaveStatement;
  let autoTriggerRoot;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isArrowFunction(node.initializer) &&
      node.initializer.getText(file).includes("useImperativeHandle(")
    ) {
      component ??= node.initializer;
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === "useAnimation"
    ) {
      controls.push(node.name.text);
    }
    if (
      ts.isExpressionStatement(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "useImperativeHandle"
    ) {
      imperativeStatement = node;
    }
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "handleMouseEnter"
        ) {
          enterStatement = node;
        }
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "handleMouseLeave"
        ) {
          leaveStatement = node;
        }
      }
    }
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === "div") {
      const mouseEnter = node.attributes.properties.find(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(file) === "onMouseEnter",
      );
      if (
        mouseEnter &&
        ts.isJsxAttribute(mouseEnter) &&
        ts.isJsxExpression(mouseEnter.initializer) &&
        mouseEnter.initializer.expression?.getText(file) === "handleMouseEnter"
      ) {
        autoTriggerRoot = node;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (
    !component ||
    !ts.isArrowFunction(component) ||
    !ts.isBlock(component.body)
  ) {
    throw new Error(`${filename}: missing icon component arrow body`);
  }
  if (!imperativeStatement)
    throw new Error(`${filename}: missing useImperativeHandle`);
  return {
    file,
    component,
    controls,
    imperativeStatement,
    enterStatement,
    leaveStatement,
    autoTriggerRoot,
  };
}

function normalizeImperativeHandle(source, filename) {
  const facts = componentFacts(source, filename);
  const { file, imperativeStatement } = facts;
  const call = imperativeStatement.expression;
  const callback = call.arguments[1];
  if (!callback || !ts.isArrowFunction(callback)) {
    throw new Error(`${filename}: unsupported useImperativeHandle callback`);
  }
  const returnStatement = ts.isBlock(callback.body)
    ? callback.body.statements.find(ts.isReturnStatement)
    : undefined;
  const expressionBody = ts.isParenthesizedExpression(callback.body)
    ? callback.body.expression
    : callback.body;
  const returned = ts.isObjectLiteralExpression(expressionBody)
    ? expressionBody
    : returnStatement?.expression;
  if (!returned || !ts.isObjectLiteralExpression(returned)) {
    throw new Error(`${filename}: imperative handle must return an object`);
  }

  const declarations = [];
  for (const name of ["startAnimation", "stopAnimation"]) {
    const property = returned.properties.find(
      (candidate) => candidate.name?.getText(file) === name,
    );
    if (!property)
      throw new Error(`${filename}: imperative handle missing ${name}`);
    if (ts.isShorthandPropertyAssignment(property)) continue;
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`${filename}: unsupported ${name} handle property`);
    }
    declarations.push(`const ${name} = ${property.initializer.getText(file)};`);
  }

  const indent = source.slice(
    source.lastIndexOf("\n", imperativeStatement.getStart(file)) + 1,
    imperativeStatement.getStart(file),
  );
  const declarationText = declarations
    .map((line) => `${indent}${line}\n`)
    .join("");
  const replacement =
    declarationText +
    `${indent}useImperativeHandle(ref, () => {\n` +
    `${indent}  isControlledRef.current = true;\n` +
    `${indent}  return { startAnimation, stopAnimation };\n` +
    `${indent}});`;

  return applyEdits(source, [
    {
      start: imperativeStatement.getStart(file),
      end: imperativeStatement.end,
      text: replacement,
    },
  ]);
}

function addReducedMotionEngine(source, filename) {
  const facts = componentFacts(source, filename);
  const { file, component, controls, imperativeStatement } = facts;
  const componentStatements = component.body.statements;
  if (controls.length === 0) {
    // `volume` is the sole upstream state/AnimatePresence archetype. Keep that upstream mechanism,
    // but make the active state unreachable under reduced motion and reset it on a live preference
    // change. The guard is generator-derived from the upstream state setter, not hand-maintained.
    const stateStatement = componentStatements.find(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.getText(file).includes("useState(false)"),
    );
    if (!stateStatement || !source.includes("setIsHovered(true)")) {
      throw new Error(`${filename}: unsupported non-controls Motion archetype`);
    }
    const indent = source.slice(
      source.lastIndexOf("\n", stateStatement.getStart(file)) + 1,
      stateStatement.getStart(file),
    );
    let output = applyEdits(source, [
      {
        start: stateStatement.end,
        end: stateStatement.end,
        text: `\n${indent}const shouldReduceMotion = useReducedMotion();`,
      },
    ]).replace(
      /setIsHovered\(true\)/g,
      "shouldReduceMotion ? setIsHovered(false) : setIsHovered(true)",
    );
    const updated = componentFacts(output, filename);
    const effectIndent = output.slice(
      output.lastIndexOf(
        "\n",
        updated.imperativeStatement.getStart(updated.file),
      ) + 1,
      updated.imperativeStatement.getStart(updated.file),
    );
    return applyEdits(output, [
      {
        start: updated.imperativeStatement.end,
        end: updated.imperativeStatement.end,
        text:
          `\n\n${effectIndent}useEffect(() => {\n` +
          `${effectIndent}  if (shouldReduceMotion) stopAnimation();\n` +
          `${effectIndent}});`,
      },
    ]);
  }
  const controlStatements = componentStatements.filter(
    (statement) =>
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some(
        (declaration) =>
          ts.isIdentifier(declaration.name) &&
          controls.includes(declaration.name.text),
      ),
  );
  const lastControl = controlStatements.at(-1);
  if (!lastControl)
    throw new Error(`${filename}: no control declaration statement`);
  const indent = source.slice(
    source.lastIndexOf("\n", lastControl.getStart(file)) + 1,
    lastControl.getStart(file),
  );
  const primary = controls[0];
  const helperText =
    `\n${indent}const shouldReduceMotion = useReducedMotion();\n` +
    `${indent}const runAnimation = useCallback(\n` +
    `${indent}  (\n` +
    `${indent}    control: typeof ${primary},\n` +
    `${indent}    definition: Parameters<typeof ${primary}.start>[0],\n` +
    `${indent}    transitionOverride?: Parameters<typeof ${primary}.start>[1]\n` +
    `${indent}  ) => {\n` +
    `${indent}    if (shouldReduceMotion) {\n` +
    `${indent}      control.stop();\n` +
    `${indent}      return Promise.resolve();\n` +
    `${indent}    }\n` +
    `${indent}    return control.start(definition, transitionOverride);\n` +
    `${indent}  },\n` +
    `${indent}  [shouldReduceMotion]\n` +
    `${indent});\n` +
    `${indent}const resetAnimation = useCallback(\n` +
    `${indent}  (\n` +
    `${indent}    control: typeof ${primary},\n` +
    `${indent}    definition: Parameters<typeof ${primary}.start>[0],\n` +
    `${indent}    transitionOverride?: Parameters<typeof ${primary}.start>[1]\n` +
    `${indent}  ) => {\n` +
    `${indent}    if (shouldReduceMotion) {\n` +
    `${indent}      control.stop();\n` +
    `${indent}      control.set(definition);\n` +
    `${indent}      return Promise.resolve();\n` +
    `${indent}    }\n` +
    `${indent}    return control.start(definition, transitionOverride);\n` +
    `${indent}  },\n` +
    `${indent}  [shouldReduceMotion]\n` +
    `${indent});`;

  let output = applyEdits(source, [
    { start: lastControl.end, end: lastControl.end, text: helperText },
  ]);

  // Reparse after insertion, then route every upstream animation command through the reduced-motion
  // gate. Commands in stopAnimation are resting-state commands, so reduced motion sets their target
  // immediately; all other commands become no-ops while reduction is requested.
  let updatedFacts = componentFacts(output, filename);
  const updatedFile = updatedFacts.file;
  let stopDeclaration;
  function findStop(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "stopAnimation"
    ) {
      stopDeclaration = node;
    }
    ts.forEachChild(node, findStop);
  }
  findStop(updatedFile);
  if (!stopDeclaration)
    throw new Error(`${filename}: missing normalized stopAnimation`);
  const controlSet = new Set(updatedFacts.controls);
  const edits = [];
  function replaceStarts(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "start" &&
      ts.isIdentifier(node.expression.expression) &&
      controlSet.has(node.expression.expression.text)
    ) {
      const receiver = node.expression.expression.text;
      const helper =
        node.getStart(updatedFile) >= stopDeclaration.getStart(updatedFile) &&
        node.end <= stopDeclaration.end
          ? "resetAnimation"
          : "runAnimation";
      edits.push({
        start: node.getStart(updatedFile),
        end: node.end,
        text: `${helper}(${receiver}${node.arguments.length ? `, ${node.arguments.map((arg) => arg.getText(updatedFile)).join(", ")}` : ""})`,
      });
    }
    ts.forEachChild(node, replaceStarts);
  }
  replaceStarts(updatedFile);
  output = applyEdits(output, edits);

  updatedFacts = componentFacts(output, filename);
  const effectIndent = output.slice(
    output.lastIndexOf(
      "\n",
      updatedFacts.imperativeStatement.getStart(updatedFacts.file),
    ) + 1,
    updatedFacts.imperativeStatement.getStart(updatedFacts.file),
  );
  const effectText =
    `\n\n${effectIndent}useEffect(() => {\n` +
    `${effectIndent}  if (shouldReduceMotion) stopAnimation();\n` +
    `${effectIndent}});`;
  output = applyEdits(output, [
    {
      start: updatedFacts.imperativeStatement.end,
      end: updatedFacts.imperativeStatement.end,
      text: effectText,
    },
  ]);
  return output;
}

function addMultiInputTriggers(source, filename) {
  const facts = componentFacts(source, filename);
  if (!facts.autoTriggerRoot) return source;
  if (!facts.enterStatement || !facts.leaveStatement) {
    throw new Error(`${filename}: auto-trigger root is missing mouse handlers`);
  }
  const { file, enterStatement, leaveStatement } = facts;
  const indent = source.slice(
    source.lastIndexOf("\n", enterStatement.getStart(file)) + 1,
    enterStatement.getStart(file),
  );
  const handlers =
    `${indent}const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {\n` +
    `${indent}  onPointerEnter?.(event);\n` +
    `${indent}  if (!isControlledRef.current && event.pointerType !== "touch") startAnimation();\n` +
    `${indent}};\n\n` +
    `${indent}const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {\n` +
    `${indent}  onPointerLeave?.(event);\n` +
    `${indent}  if (!isControlledRef.current && event.pointerType !== "touch") stopAnimation();\n` +
    `${indent}};\n\n` +
    `${indent}const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {\n` +
    `${indent}  onPointerDown?.(event);\n` +
    `${indent}  if (!isControlledRef.current && event.pointerType === "touch") startAnimation();\n` +
    `${indent}};\n\n` +
    `${indent}const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {\n` +
    `${indent}  onFocus?.(event);\n` +
    `${indent}  if (!isControlledRef.current) startAnimation();\n` +
    `${indent}};\n\n` +
    `${indent}const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {\n` +
    `${indent}  onBlur?.(event);\n` +
    `${indent}  if (!isControlledRef.current) stopAnimation();\n` +
    `${indent}};`;

  let output = applyEdits(source, [
    {
      start: enterStatement.getStart(file),
      end: enterStatement.end,
      text: handlers,
    },
    { start: leaveStatement.getStart(file), end: leaveStatement.end, text: "" },
  ]);

  // Destructure consumer callbacks so every upstream callback is invoked exactly once, regardless
  // of whether the icon is in auto-trigger or imperative-control mode.
  let updatedFacts = componentFacts(output, filename);
  const firstParameter = updatedFacts.component.parameters[0];
  if (!ts.isObjectBindingPattern(firstParameter.name)) {
    throw new Error(
      `${filename}: normalized component props are not destructured`,
    );
  }
  const binding = firstParameter.name.getText(updatedFacts.file);
  const additions = [
    "onPointerEnter",
    "onPointerLeave",
    "onPointerDown",
    "onFocus",
    "onBlur",
  ];
  let updatedBinding = binding;
  const restIndex = updatedBinding.lastIndexOf("...");
  const prefix = additions
    .filter((name) => !new RegExp(`\\b${name}\\b`).test(updatedBinding))
    .join(", ");
  if (prefix) {
    updatedBinding =
      restIndex === -1
        ? updatedBinding.replace(/}\s*$/, `${prefix} }`)
        : `${updatedBinding.slice(0, restIndex)}${prefix}, ${updatedBinding.slice(restIndex)}`;
  }
  output = applyEdits(output, [
    {
      start: firstParameter.name.getStart(updatedFacts.file),
      end: firstParameter.name.end,
      text: updatedBinding,
    },
  ]);

  updatedFacts = componentFacts(output, filename);
  const root = updatedFacts.autoTriggerRoot;
  if (!root)
    throw new Error(`${filename}: lost auto-trigger root during transform`);
  const rootText = root.getText(updatedFacts.file);
  const updatedRoot = rootText
    .replace("onMouseEnter={handleMouseEnter}", "onMouseEnter={onMouseEnter}")
    .replace(
      "onMouseLeave={handleMouseLeave}",
      "onMouseLeave={onMouseLeave}\n" +
        `${indent}  onPointerEnter={handlePointerEnter}\n` +
        `${indent}  onPointerLeave={handlePointerLeave}\n` +
        `${indent}  onPointerDown={handlePointerDown}\n` +
        `${indent}  onFocus={handleFocus}\n` +
        `${indent}  onBlur={handleBlur}`,
    );
  if (updatedRoot === rootText)
    throw new Error(`${filename}: failed to replace root trigger props`);
  return applyEdits(output, [
    {
      start: root.getStart(updatedFacts.file),
      end: root.end,
      text: updatedRoot,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Data-module extraction
//
// Everything above normalizes upstream into ONE canonical controller shape. That
// shape is now an intermediate, not the artifact: the controller lives once in
// `createAnimatedIcon`, so the extractor below reduces the normalized component
// to the only things that are genuinely per-icon — its geometry, its Motion
// variants, and (for the handful of icons whose upstream choreography is not a
// plain play/rest pair) its start/stop steps.
//
// Every step fails closed. An upstream archetype the extractor cannot model is
// an exception, never a silent approximation.
// ---------------------------------------------------------------------------

const ROOT_DEFAULT_ATTRS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/** SVG elements the factory knows how to draw, plain and Motion-wrapped. */
const DRAWABLE_TAGS = new Set([
  "circle",
  "defs",
  "ellipse",
  "g",
  "line",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "rect",
  "text",
]);

/** Presentation attributes forwarded to the DOM verbatim. */
const STATIC_ATTRS = new Set([
  "clipPath",
  "clipRule",
  "cx",
  "cy",
  "d",
  "dominantBaseline",
  "fill",
  "fillOpacity",
  "fillRule",
  "fontSize",
  "fontWeight",
  "height",
  "id",
  "mask",
  "opacity",
  "overflow",
  "pathLength",
  "patternUnits",
  "points",
  "r",
  "rx",
  "ry",
  "stroke",
  "strokeDasharray",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeOpacity",
  "strokeWidth",
  "textAnchor",
  "transform",
  "vectorEffect",
  "width",
  "x",
  "x1",
  "x2",
  "y",
  "y1",
  "y2",
]);

/** Motion props the spec models directly. */
const MOTION_ATTRS = new Set([
  "animate",
  "className",
  "custom",
  "exit",
  "initial",
  "style",
  "transition",
  "variants",
]);

/** Attributes the factory owns, so a data module must not restate them. */
const DROPPED_ATTRS = new Set(["key", "xmlns"]);

/**
 * Node keys the spec itself owns. Static SVG attributes sit flat alongside them
 * (one line per element instead of a nested `attrs` object), so a future SVG
 * attribute that collides with one of these must fail rather than be swallowed.
 */
const RESERVED_NODE_KEYS = new Set([
  "animate",
  "children",
  "className",
  "custom",
  "exit",
  "group",
  "inherit",
  "initial",
  "style",
  "tag",
  "text",
  "transition",
  "variants",
]);

/** The state identifier upstream uses for a mount/unmount presence swap. */
const PRESENCE_STATE_IDENTIFIER = "isHovered";

/**
 * The icons whose upstream `startAnimation`/`stopAnimation` reach for something
 * the mechanical rewriter cannot express — a component-local helper, a timer, or
 * React state. Each entry is a hand-reviewed transcription of that upstream
 * choreography onto the factory's context, and is reachable ONLY once the
 * mechanical path has already refused the icon. A new archetype therefore throws
 * rather than silently taking the default play/rest pair, and upstream cannot
 * change one of these without failing the manifest's SHA-256 first.
 */
const CHOREOGRAPHY_OVERRIDES = {
  // Timer-driven: show the question mark, then hide it 1.5s later. The factory
  // cancels pending work on stop and on unmount, so `cancelHide` is implicit.
  "wifi-low": {
    groups: ["default", "question"],
    start: `async ({ run, controls, after }) => {
      await run(controls.default, "fadeOut");
      run(controls.default, "fadeIn");
      run(controls.question, "show");
      after(1500, () => run(controls.question, "hide"));
    }`,
    stop: `({ reset, controls }) => {
      reset(controls.default, "fadeIn");
      reset(controls.question, "hide");
    }`,
  },
  // Upstream wrapped both halves in `startAll`/`stopAll` purely to attach
  // `.catch()` guards; the factory's `run` already resolves on interruption.
  projector: {
    groups: ["path", "body"],
    start: `async ({ run, controls }) => {
      run(controls.body, "animate");
      await run(controls.path, "hidden");
      await run(controls.path, "animate");
    }`,
    stop: `({ run, controls }) => {
      run(controls.body, "normal");
      run(controls.path, "visible");
    }`,
  },
  // `runPathIntro` is a single-use helper; inlined.
  "phone-call": {
    groups: ["svg", "path"],
    start: `async ({ run, controls }) => {
      await Promise.all([
        run(controls.svg, "animate"),
        (async () => {
          await run(controls.path, "fadeOut");
          run(controls.path, "fadeIn");
        })(),
      ]);
    }`,
    stop: `({ reset, controls }) => {
      reset(controls.svg, "normal");
      reset(controls.path, "normal");
    }`,
  },
  "satellite-dish": {
    groups: ["svg", "path"],
    start: `async ({ run, controls }) => {
      await Promise.all([
        run(controls.svg, "animate"),
        (async () => {
          await run(controls.path, "fadeOut");
          run(controls.path, "fadeIn");
        })(),
      ]);
    }`,
    stop: `({ reset, controls }) => {
      reset(controls.svg, "normal");
      reset(controls.path, "normal");
    }`,
  },
  // Upstream drove this from an effect on hover state rather than from the
  // handle; the flicker definition and its instant reset move onto the handle.
  keyboard: {
    groups: ["default"],
    start: `({ run, controls }) =>
      run(controls.default, (i: number) => ({
        opacity: [1, 0.2, 1],
        transition: {
          duration: 1.5,
          times: [0, 0.5, 1],
          delay: i * 0.2 * Math.random(),
          repeat: 1,
          repeatType: "reverse",
        },
      }))`,
    stop: `({ set, controls }) => set(controls.default, { opacity: 1 })`,
  },
  // Purely presence-driven: the factory's own active state is the whole
  // mechanism, so neither half touches a control.
  volume: { groups: [], start: null, stop: null },
};

function jsxAttributeMap(node, file) {
  const attributes = new Map();
  for (const property of node.attributes.properties) {
    if (!ts.isJsxAttribute(property)) {
      throw new Error("unsupported JSX spread attribute on an icon element");
    }
    attributes.set(property.name.getText(file), property);
  }
  return attributes;
}

/**
 * Evaluate an expression to a literal, optionally under a `.map()` scope.
 * Deliberately tiny: identifiers, member access, literals and arithmetic are
 * everything the upstream corpus uses. Anything else returns `undefined`, which
 * every caller treats as "cannot model — fail".
 */
function literalValue(node, file, scope, constants) {
  if (!node) return undefined;
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isTypeAssertionExpression?.(node)
  ) {
    return literalValue(node.expression, file, scope, constants);
  }
  if (ts.isConditionalExpression(node)) {
    const condition = literalValue(node.condition, file, scope, constants);
    if (condition === undefined) return undefined;
    return literalValue(
      condition ? node.whenTrue : node.whenFalse,
      file,
      scope,
      constants,
    );
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken
  ) {
    const operand = literalValue(node.operand, file, scope, constants);
    return typeof operand === "number" ? -operand : undefined;
  }
  if (ts.isIdentifier(node)) {
    if (scope && Object.hasOwn(scope, node.text)) return scope[node.text];
    if (constants && constants.has(node.text)) return constants.get(node.text);
    return undefined;
  }
  if (ts.isPropertyAccessExpression(node)) {
    const target = literalValue(node.expression, file, scope, constants);
    if (target && typeof target === "object" && !Array.isArray(target)) {
      return Object.hasOwn(target, node.name.text)
        ? target[node.name.text]
        : undefined;
    }
    return undefined;
  }
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      const value = literalValue(span.expression, file, scope, constants);
      if (value === undefined) return undefined;
      out += String(value) + span.literal.text;
    }
    return out;
  }
  if (ts.isBinaryExpression(node)) {
    const left = literalValue(node.left, file, scope, constants);
    const right = literalValue(node.right, file, scope, constants);
    if (left === undefined || right === undefined) return undefined;
    switch (node.operatorToken.kind) {
      case ts.SyntaxKind.PlusToken:
        return typeof left === "number" && typeof right === "number"
          ? left + right
          : `${left}${right}`;
      case ts.SyntaxKind.MinusToken:
        return left - right;
      case ts.SyntaxKind.AsteriskToken:
        return left * right;
      case ts.SyntaxKind.SlashToken:
        return right === 0 ? undefined : left / right;
      case ts.SyntaxKind.PercentToken:
        return right === 0 ? undefined : left % right;
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
        return left === right;
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        return left !== right;
      case ts.SyntaxKind.LessThanToken:
        return left < right;
      case ts.SyntaxKind.LessThanEqualsToken:
        return left <= right;
      case ts.SyntaxKind.GreaterThanToken:
        return left > right;
      case ts.SyntaxKind.GreaterThanEqualsToken:
        return left >= right;
      default:
        return undefined;
    }
  }
  if (ts.isArrayLiteralExpression(node)) {
    // A trailing elision is an upstream typo (`"…", ,`). `Array.prototype.map`
    // skips holes, so the icon never drew one — drop it and match that. An
    // interior hole would shift `custom` indices, so refuse it instead.
    const elements = [...node.elements];
    while (elements.length > 0 && ts.isOmittedExpression(elements.at(-1))) {
      elements.pop();
    }
    if (elements.some((element) => ts.isOmittedExpression(element)))
      return undefined;
    const items = elements.map((element) =>
      literalValue(element, file, scope, constants),
    );
    return items.some((item) => item === undefined) ? undefined : items;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const property of node.properties) {
      if (ts.isShorthandPropertyAssignment(property)) {
        const value = literalValue(property.name, file, scope, constants);
        if (value === undefined) return undefined;
        out[property.name.text] = value;
        continue;
      }
      if (!ts.isPropertyAssignment(property)) return undefined;
      const key =
        ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
          ? property.name.text
          : undefined;
      if (key === undefined) return undefined;
      const value = literalValue(property.initializer, file, scope, constants);
      if (value === undefined) return undefined;
      out[key] = value;
    }
    return out;
  }
  return undefined;
}

function attributeExpression(attribute, file) {
  if (!attribute.initializer) return undefined;
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer;
  if (ts.isJsxExpression(attribute.initializer))
    return attribute.initializer.expression;
  return undefined;
}

/** Render an expression back to source, resolving any `.map()` scope first. */
function expressionText(node, file, scope, constants) {
  if (!scope) return node.getText(file);
  const value = literalValue(node, file, scope, constants);
  if (value !== undefined) return JSON.stringify(value);
  let usesScope = false;
  const visit = (child) => {
    if (ts.isIdentifier(child) && Object.hasOwn(scope, child.text))
      usesScope = true;
    ts.forEachChild(child, visit);
  };
  visit(node);
  if (usesScope) {
    throw new Error(
      `cannot resolve mapped expression \`${node.getText(file)}\` to a literal`,
    );
  }
  return node.getText(file);
}

function jsxChildren(node) {
  return (node.children ?? []).filter((child) => {
    if (ts.isJsxText(child)) return child.getText().trim().length > 0;
    return !ts.isJsxExpression(child) || Boolean(child.expression);
  });
}

/**
 * Turn one JSX child into spec nodes. Returns an array because `.map()` and a
 * transparent `<AnimatePresence>` each expand to several nodes in place.
 */
function extractNodes(child, file, context, scope) {
  if (ts.isJsxText(child)) {
    throw new Error(`unexpected text node \`${child.getText().trim()}\``);
  }
  if (ts.isJsxExpression(child)) {
    if (!child.expression) return [];
    return extractExpressionChild(child.expression, file, context, scope);
  }
  if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
    const opening = ts.isJsxElement(child) ? child.openingElement : child;
    const tag = opening.tagName.getText(file);
    if (tag === "AnimatePresence") {
      // Only a conditional swap is a real presence boundary; upstream also uses
      // the wrapper decoratively around children that never unmount.
      const inner = ts.isJsxElement(child) ? jsxChildren(child) : [];
      return inner.flatMap((node) => extractNodes(node, file, context, scope));
    }
    return [extractElement(child, file, context, scope)];
  }
  if (ts.isJsxFragment(child)) {
    return jsxChildren(child).flatMap((node) =>
      extractNodes(node, file, context, scope),
    );
  }
  throw new Error(
    `unsupported JSX child \`${child.getText(file).slice(0, 60)}\``,
  );
}

function extractExpressionChild(expression, file, context, scope) {
  if (
    ts.isCallExpression(expression) &&
    ts.isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === "map"
  ) {
    return extractMap(expression, file, context, scope);
  }
  if (ts.isConditionalExpression(expression)) {
    return [extractPresence(expression, file, context, scope)];
  }
  throw new Error(
    `unsupported JSX expression child \`${expression.getText(file).slice(0, 60)}\``,
  );
}

/** Unroll `ARRAY.map((item, index) => <el/>)` into explicit nodes. */
function extractMap(call, file, context, scope) {
  if (scope) throw new Error("nested .map() is not supported");
  const source = call.expression.expression;
  const items = literalValue(source, file, undefined, context.constants);
  if (!Array.isArray(items)) {
    throw new Error(
      `cannot resolve \`${source.getText(file)}\` to a literal array`,
    );
  }
  const callback = call.arguments[0];
  if (!callback || !ts.isArrowFunction(callback)) {
    throw new Error(".map() callback must be an arrow function");
  }
  const [itemParameter, indexParameter] = callback.parameters;
  const body = ts.isParenthesizedExpression(callback.body)
    ? callback.body.expression
    : callback.body;
  if (!ts.isJsxElement(body) && !ts.isJsxSelfClosingElement(body)) {
    throw new Error(".map() callback must return a single JSX element");
  }
  return items.map((item, index) => {
    const mapScope = {};
    if (itemParameter && ts.isIdentifier(itemParameter.name))
      mapScope[itemParameter.name.text] = item;
    if (indexParameter && ts.isIdentifier(indexParameter.name))
      mapScope[indexParameter.name.text] = index;
    return extractElement(body, file, context, mapScope);
  });
}

/** `{state ? <Fragment/> : <Fragment/>}` inside `<AnimatePresence>`. */
function extractPresence(conditional, file, context, scope) {
  if (
    !ts.isIdentifier(conditional.condition) ||
    conditional.condition.text !== PRESENCE_STATE_IDENTIFIER
  ) {
    throw new Error(
      `presence swap must be driven by \`${PRESENCE_STATE_IDENTIFIER}\`, got \`${conditional.condition.getText(file)}\``,
    );
  }
  context.usesPresence = true;
  const branch = (input) => {
    const node = ts.isParenthesizedExpression(input) ? input.expression : input;
    if (!ts.isJsxElement(node) && !ts.isJsxFragment(node)) {
      throw new Error("presence branches must be fragments");
    }
    return jsxChildren(node).flatMap((child) =>
      extractNodes(child, file, context, scope),
    );
  };
  return {
    tag: "presence",
    active: branch(conditional.whenTrue),
    rest: branch(conditional.whenFalse),
  };
}

function extractElement(element, file, context, scope) {
  const opening = ts.isJsxElement(element) ? element.openingElement : element;
  const rawTag = opening.tagName.getText(file);
  const baseTag = rawTag.startsWith("motion.") ? rawTag.slice(7) : rawTag;
  if (!DRAWABLE_TAGS.has(baseTag)) {
    throw new Error(`unsupported SVG element \`${rawTag}\``);
  }
  const node = { tag: rawTag };
  const attrs = {};
  for (const [name, attribute] of jsxAttributeMap(opening, file)) {
    if (DROPPED_ATTRS.has(name)) continue;
    const expression = attributeExpression(attribute, file);
    if (!expression) throw new Error(`attribute \`${name}\` has no value`);
    if (STATIC_ATTRS.has(name)) {
      if (RESERVED_NODE_KEYS.has(name)) {
        throw new Error(
          `SVG attribute \`${name}\` collides with a reserved spec key`,
        );
      }
      const value = literalValue(expression, file, scope, context.constants);
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(
          `attribute \`${name}\` must resolve to a string or number, got \`${expression.getText(file)}\``,
        );
      }
      attrs[name] = value;
      continue;
    }
    if (!MOTION_ATTRS.has(name)) {
      throw new Error(`unsupported attribute \`${name}\` on \`${rawTag}\``);
    }
    if (name === "animate") {
      const group = context.groupOf(expression, file);
      if (group) {
        node.group = group;
        continue;
      }
    }
    if (name === "custom") {
      // Motion passes `custom` straight to a variant resolver, so it may be any
      // serializable value — an index, a delay, or a small offset object.
      const value = literalValue(expression, file, scope, context.constants);
      if (value === undefined) {
        throw new Error(
          `\`custom\` must resolve to a literal on \`${rawTag}\`, got \`${expression.getText(file)}\``,
        );
      }
      node.custom = value;
      continue;
    }
    node[name] = {
      raw: expressionText(expression, file, scope, context.constants),
    };
  }
  if (Object.keys(attrs).length > 0) node.attrs = attrs;

  const driven = Boolean(node.group || node.animate);
  if (rawTag.startsWith("motion.") && !driven) {
    // Not bound to a control and carrying no literal target: Motion's variant
    // propagation drives it from an animated ancestor, a presence branch mounts
    // it, or — in a few upstream icons — nothing drives it at all and it simply
    // renders statically. All three are preserved verbatim; the check that a
    // control did not get LOST during extraction is `assertGroupsBound` below,
    // which is the property this generator can actually get wrong.
    node.inherit = true;
    if (!context.animatedAncestor && !context.usesPresence) {
      context.inertNodes += 1;
    }
  }

  if (ts.isJsxElement(element)) {
    const children = jsxChildren(element);
    const text = children.filter((child) => ts.isJsxText(child));
    if (text.length > 0) {
      if (children.length !== text.length) {
        throw new Error(`\`${rawTag}\` mixes text and element children`);
      }
      node.text = text.map((child) => child.getText().trim()).join("");
    } else if (children.length > 0) {
      const outer = context.animatedAncestor;
      context.animatedAncestor = outer || driven || Boolean(node.inherit);
      node.children = children.flatMap((child) =>
        extractNodes(child, file, context, scope),
      );
      context.animatedAncestor = outer;
    }
  }
  return node;
}

/**
 * Every control upstream declared must still drive something after extraction.
 * This is the failure mode a data-model generator actually has — silently
 * dropping an `animate={xControls}` binding leaves an icon that renders
 * correctly and never moves — so it is checked directly rather than inferred.
 */
function assertGroupsBound(filename, groups, root, elements) {
  const bound = new Set();
  if (root.group) bound.add(root.group);
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.tag === "presence") {
        walk(node.active);
        walk(node.rest);
        continue;
      }
      if (node.group) bound.add(node.group);
      if (node.children) walk(node.children);
    }
  };
  walk(elements);
  const unbound = groups.filter((group) => !bound.has(group));
  if (unbound.length > 0) {
    throw new Error(
      `${filename}: control group(s) [${unbound.join(", ")}] drive nothing after extraction`,
    );
  }
}

/** `bodyControls` → `body`; the lone `controls` → `default`. */
function groupNameFor(identifier) {
  if (identifier === "controls") return "default";
  const stripped = identifier.replace(/Controls$/, "");
  if (!stripped || stripped === identifier) {
    throw new Error(
      `cannot derive a control-group name from \`${identifier}\``,
    );
  }
  return stripped;
}

/**
 * `declarations` are the module-scope statements a data module may carry over
 * verbatim. `literals` additionally includes component-local constants, because
 * a `.map()` source array is sometimes declared inside the component body — and
 * those are unrolled at generation time rather than carried.
 */
function collectModuleConstants(file, componentBody) {
  const declarations = new Map();
  const literals = new Map();
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      // The component itself is what this whole generator exists to delete, so
      // it must never be eligible to be carried over as a "referenced constant".
      const text = statement.getText(file);
      if (!/\buse[A-Z]/.test(text))
        declarations.set(declaration.name.text, text);
      const value = literalValue(declaration.initializer, file, undefined);
      if (value !== undefined) literals.set(declaration.name.text, value);
    }
  }
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (!literals.has(node.name.text)) {
        const value = literalValue(node.initializer, file, undefined, literals);
        if (value !== undefined) literals.set(node.name.text, value);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);

  // Some upstream icons declare their variants inside the component rather than
  // at module scope. Those are still pure data, so they are eligible to be
  // hoisted — but only the component body's OWN statements, never a declaration
  // nested inside a callback, whose free variables do not exist at module scope.
  if (componentBody && ts.isBlock(componentBody)) {
    for (const statement of componentBody.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      const text = statement.getText(file);
      if (/\buse[A-Z]/.test(text)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        if (declarations.has(declaration.name.text)) continue;
        declarations.set(declaration.name.text, text);
      }
    }
  }
  return { declarations, literals };
}

/** Named value imports the upstream module took from `motion/react`. */
function collectMotionValueImports(file) {
  const names = new Set();
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "motion/react" ||
      statement.importClause?.isTypeOnly
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const specifier of bindings.elements) {
      if (specifier.isTypeOnly) continue;
      names.add(specifier.name.text);
    }
  }
  // The controller's own imports are what this generator deletes; only helpers
  // a variants object still calls (an easing factory, say) survive.
  for (const owned of [
    "AnimatePresence",
    "motion",
    "useAnimation",
    "useReducedMotion",
  ]) {
    names.delete(owned);
  }
  return names;
}

/** Reduce the normalized component to the icon's data. */
function extractSpec(source, name, componentName) {
  const filename = `${name}.tsx`;
  // One parse, one AST: node positions are only meaningful against the
  // SourceFile they came from, so everything below reads `facts.file`.
  const facts = componentFacts(source, filename);
  const file = facts.file;
  const { declarations, literals } = collectModuleConstants(
    file,
    facts.component.body,
  );
  const controlNames = facts.controls;
  const groups = controlNames.map(groupNameFor);
  const groupByIdentifier = new Map(
    controlNames.map((identifier, index) => [identifier, groups[index]]),
  );

  const context = {
    constants: literals,
    usesPresence: false,
    animatedAncestor: false,
    inertNodes: 0,
    groupOf(expression) {
      if (!ts.isIdentifier(expression)) return undefined;
      return groupByIdentifier.get(expression.text);
    },
  };

  let rootElement;
  const findRoot = (node) => {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText(file);
      if (tag === "svg" || tag === "motion.svg") {
        if (rootElement) throw new Error(`${filename}: multiple root SVGs`);
        rootElement = node;
      }
    }
    ts.forEachChild(node, findRoot);
  };
  findRoot(file);
  if (!rootElement) throw new Error(`${filename}: no root SVG element`);

  const rootTag = rootElement.openingElement.tagName.getText(file);
  const root = {};
  for (const [attribute, node] of jsxAttributeMap(
    rootElement.openingElement,
    file,
  )) {
    if (DROPPED_ATTRS.has(attribute)) continue;
    if (attribute === "width" || attribute === "height") continue; // factory owns `size`
    const expression = attributeExpression(node, file);
    if (!expression) throw new Error(`root SVG \`${attribute}\` has no value`);
    if (attribute === "animate") {
      const group = context.groupOf(expression, file);
      if (group) {
        root.group = group;
        continue;
      }
    }
    if (STATIC_ATTRS.has(attribute) || attribute === "viewBox") {
      const value = literalValue(expression, file, undefined, literals);
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(`root SVG \`${attribute}\` must be a literal`);
      }
      if (String(ROOT_DEFAULT_ATTRS[attribute] ?? "") === String(value))
        continue;
      root[attribute] = value;
      continue;
    }
    if (!MOTION_ATTRS.has(attribute)) {
      throw new Error(`unsupported root SVG attribute \`${attribute}\``);
    }
    root[attribute] = { raw: expression.getText(file) };
  }
  if (rootTag === "motion.svg") {
    root.tag = "motion.svg";
    if (!root.group && !root.animate) root.inherit = true;
  }

  // Motion propagates a variant state down the tree, so a child that binds no
  // control of its own is legitimate exactly when an ancestor is animated.
  context.animatedAncestor = Boolean(
    root.group || root.animate || root.variants,
  );
  const elements = jsxChildren(rootElement).flatMap((child) =>
    extractNodes(child, file, context, undefined),
  );
  if (elements.length === 0) throw new Error(`${filename}: icon draws nothing`);

  assertGroupsBound(filename, groups, root, elements);

  const choreography = extractChoreography(
    source,
    name,
    groups,
    groupByIdentifier,
  );
  if (choreography.groups) {
    // An override states the group order it was written against; hold the
    // extraction to it so a reordered upstream cannot silently rebind controls.
    const declared = choreography.groups.join(",");
    if (declared !== groups.join(",")) {
      throw new Error(
        `${filename}: choreography override expects control groups [${declared}], found [${groups.join(",")}]`,
      );
    }
  }

  return {
    name: componentName,
    root,
    elements,
    groups,
    usesPresence: context.usesPresence,
    start: choreography.start,
    stop: choreography.stop,
    declarations,
    motionValueImports: collectMotionValueImports(file),
  };
}

/**
 * Move `startAnimation`/`stopAnimation` onto the factory context. The default
 * play/rest pair collapses to nothing; anything else is rewritten mechanically,
 * and an icon the rewriter refuses must have a reviewed override.
 */
function extractChoreography(source, name, groups, groupByIdentifier) {
  const filename = `${name}.tsx`;
  const file = parse(source, filename);
  const bodies = {};
  const find = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      (node.name.text === "startAnimation" ||
        node.name.text === "stopAnimation") &&
      node.initializer
    ) {
      bodies[node.name.text] ??= node.initializer;
    }
    ts.forEachChild(node, find);
  };
  find(file);
  if (!bodies.startAnimation || !bodies.stopAnimation) {
    if (CHOREOGRAPHY_OVERRIDES[name]) return CHOREOGRAPHY_OVERRIDES[name];
    throw new Error(`${filename}: missing start/stop declarations`);
  }

  const locals = collectChoreographyLocals(file, file);
  const rewritten = {};
  for (const key of ["startAnimation", "stopAnimation"]) {
    let node = bodies[key];
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "useCallback"
    ) {
      node = node.arguments[0];
    }
    // `const startAnimation = triggerEffect;` — an alias for a local helper.
    if (ts.isIdentifier(node) && locals.helpers.has(node.text)) {
      node = locals.helpers.get(node.text);
    }
    if (!node || !ts.isArrowFunction(node)) {
      rewritten[key] = undefined;
      continue;
    }
    rewritten[key] = rewriteChoreographyBody(
      node,
      file,
      groupByIdentifier,
      locals,
    );
  }

  if (
    rewritten.startAnimation === undefined ||
    rewritten.stopAnimation === undefined
  ) {
    const override = CHOREOGRAPHY_OVERRIDES[name];
    if (!override) {
      throw new Error(
        `${filename}: choreography uses a construct the generator cannot model; add a reviewed CHOREOGRAPHY_OVERRIDES entry`,
      );
    }
    return override;
  }

  const primary = groups[0] ?? "default";
  const normalize = (text) => text.replace(/\s+/g, " ").trim();
  if (
    groups.length <= 1 &&
    normalize(rewritten.startAnimation) ===
      `run(controls.${primary}, "animate")` &&
    normalize(rewritten.stopAnimation) ===
      `reset(controls.${primary}, "normal")`
  ) {
    return { start: null, stop: null };
  }
  return {
    start: choreographyClosure(rewritten.startAnimation),
    stop: choreographyClosure(rewritten.stopAnimation),
  };
}

/** Destructure only the context keys the body actually reaches for. */
function choreographyClosure(body) {
  const used = ["after", "controls", "flags", "reset", "run", "set"].filter(
    (key) => new RegExp(`\\b${key}\\b`).test(body),
  );
  const parameter = used.length > 0 ? `{ ${used.join(", ")} }` : "";
  const prefix = /\bawait\b/.test(body) ? "async " : "";
  return `${prefix}(${parameter}) => { ${body}; }`;
}

/** Globals a choreography body may legitimately reach for. */
const CHOREOGRAPHY_GLOBALS = new Set([
  "Math",
  "Number",
  "Promise",
  "undefined",
]);

/** Identifiers a nested function or block introduces, which are always in scope. */
function collectBoundNames(node, into) {
  if (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node)
  ) {
    for (const parameter of node.parameters) {
      const visitBinding = (binding) => {
        if (ts.isIdentifier(binding)) into.add(binding.text);
        else ts.forEachChild(binding, visitBinding);
      };
      visitBinding(parameter.name);
    }
  }
  if (ts.isVariableDeclaration(node)) {
    const visitBinding = (binding) => {
      if (ts.isIdentifier(binding)) into.add(binding.text);
      else ts.forEachChild(binding, visitBinding);
    };
    visitBinding(node.name);
  }
  ts.forEachChild(node, (child) => collectBoundNames(child, into));
}

/**
 * Rewrite one arrow body onto the factory context, or return `undefined` when it
 * reaches for something the context cannot express.
 *
 * Three component-local idioms are translated rather than refused, because each
 * is a mechanical consequence of the per-icon controller the factory replaces:
 * a zero-argument helper (inlined at its call site), a `useRef` latch used as a
 * re-entrancy guard (mapped onto the context's per-instance `flags`), and the
 * `runAnimation`/`resetAnimation` pair (the context's `run`/`reset`).
 */
function rewriteChoreographyBody(
  arrow,
  file,
  groupByIdentifier,
  locals,
  depth = 0,
) {
  if (depth > 3) return undefined;
  const body = arrow.body;
  const statements = ts.isBlock(body) ? body.statements : [body];
  const bound = new Set();
  for (const statement of statements) collectBoundNames(statement, bound);

  const edits = [];
  let modellable = true;

  const visit = (node) => {
    // A zero-argument call to a component-local helper is inlined as an IIFE so
    // `await helper()` keeps its ordering.
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.arguments.length === 0 &&
      locals.helpers.has(node.expression.text)
    ) {
      const helper = locals.helpers.get(node.expression.text);
      const inner = rewriteChoreographyBody(
        helper,
        file,
        groupByIdentifier,
        locals,
        depth + 1,
      );
      if (inner === undefined) {
        modellable = false;
        return;
      }
      const isAsync = helper.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
      );
      edits.push({
        start: node.getStart(file),
        end: node.end,
        text: `(${isAsync ? "async " : ""}() => { ${inner}; })()`,
      });
      return; // do not descend: the whole call has been replaced
    }
    // `somethingRef.current` — a per-instance latch the factory keeps for us.
    if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === "current" &&
      ts.isIdentifier(node.expression) &&
      locals.latches.has(node.expression.text)
    ) {
      edits.push({
        start: node.getStart(file),
        end: node.end,
        text: `flags.${node.expression.text.replace(/Ref$/, "")}`,
      });
      return;
    }
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      const isPropertyName =
        parent && ts.isPropertyAccessExpression(parent) && parent.name === node;
      const isPropertyKey =
        parent &&
        (ts.isPropertyAssignment(parent) ||
          ts.isShorthandPropertyAssignment(parent)) &&
        parent.name === node;
      if (!isPropertyName && !isPropertyKey) {
        if (groupByIdentifier.has(node.text)) {
          edits.push({
            start: node.getStart(file),
            end: node.end,
            text: `controls.${groupByIdentifier.get(node.text)}`,
          });
        } else if (node.text === "runAnimation") {
          edits.push({
            start: node.getStart(file),
            end: node.end,
            text: "run",
          });
        } else if (node.text === "resetAnimation") {
          edits.push({
            start: node.getStart(file),
            end: node.end,
            text: "reset",
          });
        } else if (
          !CHOREOGRAPHY_GLOBALS.has(node.text) &&
          !bound.has(node.text)
        ) {
          modellable = false;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  for (const statement of statements) visit(statement);
  if (!modellable) return undefined;

  const start = statements[0].getStart(file);
  const end = statements.at(-1).end;
  const slice = file.text.slice(start, end);
  const localEdits = [];
  for (const edit of edits) {
    if (edit.start < start || edit.end > end) continue;
    const scoped = {
      start: edit.start - start,
      end: edit.end - start,
      text: edit.text,
    };
    // An inlined helper swallows every edit inside it, so drop nested edits.
    if (
      localEdits.some(
        (existing) =>
          scoped.start >= existing.start && scoped.end <= existing.end,
      )
    ) {
      continue;
    }
    localEdits.push(scoped);
  }
  return applyEdits(slice, localEdits).replace(/;\s*$/, "");
}

/** Component-local helpers and latches a choreography body may reference. */
function collectChoreographyLocals(componentBody, file) {
  const helpers = new Map();
  const latches = new Set();
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      let initializer = node.initializer;
      if (
        initializer &&
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression)
      ) {
        if (initializer.expression.text === "useCallback") {
          initializer = initializer.arguments[0];
        } else if (initializer.expression.text === "useRef") {
          if (node.name.text !== "isControlledRef") latches.add(node.name.text);
          initializer = undefined;
        }
      }
      if (
        initializer &&
        ts.isArrowFunction(initializer) &&
        initializer.parameters.length === 0 &&
        node.name.text !== "startAnimation" &&
        node.name.text !== "stopAnimation"
      ) {
        helpers.set(node.name.text, initializer);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(componentBody);
  return { helpers, latches };
}

// ---------------------------------------------------------------------------
// Data-module emission
// ---------------------------------------------------------------------------

const IDENTIFIER_PATTERN = /\b[A-Za-z_$][\w$]*\b/g;

function literalLiteral(value) {
  return JSON.stringify(value);
}

function emitNode(node) {
  if (node.tag === "presence") {
    return `{ tag: "presence", active: [${node.active
      .map(emitNode)
      .join(", ")}], rest: [${node.rest.map(emitNode).join(", ")}] }`;
  }
  // A static `<path d="…"/>` — by far the commonest node — is just its geometry.
  const attrKeys = Object.keys(node.attrs ?? {});
  const bare =
    node.tag === "path" &&
    attrKeys.length === 1 &&
    attrKeys[0] === "d" &&
    !node.children &&
    !node.text;
  if (bare) return JSON.stringify(node.attrs.d);

  const parts = [`tag: ${JSON.stringify(node.tag)}`];
  for (const [key, value] of Object.entries(node.attrs ?? {})) {
    parts.push(
      `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${literalLiteral(value)}`,
    );
  }
  for (const key of [
    "variants",
    "initial",
    "animate",
    "exit",
    "transition",
    "style",
    "className",
  ]) {
    if (node[key]) parts.push(`${key}: ${node[key].raw}`);
  }
  if (node.custom !== undefined)
    parts.push(`custom: ${literalLiteral(node.custom)}`);
  // `default` is the factory's implicit group, so only a named one is stated.
  if (node.group && node.group !== "default")
    parts.push(`group: ${JSON.stringify(node.group)}`);
  if (node.inherit) parts.push("inherit: true");
  if (node.text) parts.push(`text: ${JSON.stringify(node.text)}`);
  if (node.children)
    parts.push(`children: [${node.children.map(emitNode).join(", ")}]`);
  return `{ ${parts.join(", ")} }`;
}

function emitRoot(root) {
  const parts = [];
  if (root.tag) parts.push(`tag: ${JSON.stringify(root.tag)}`);
  for (const key of [
    "viewBox",
    "fill",
    "stroke",
    "strokeWidth",
    "strokeLinecap",
    "strokeLinejoin",
    "overflow",
  ]) {
    if (root[key] !== undefined)
      parts.push(`${key}: ${literalLiteral(root[key])}`);
  }
  for (const key of [
    "variants",
    "initial",
    "animate",
    "transition",
    "style",
    "className",
  ]) {
    if (root[key]) parts.push(`${key}: ${root[key].raw}`);
  }
  if (root.custom !== undefined)
    parts.push(`custom: ${literalLiteral(root.custom)}`);
  if (root.group && root.group !== "default")
    parts.push(`group: ${JSON.stringify(root.group)}`);
  if (root.inherit) parts.push("inherit: true");
  return parts.length > 0 ? `{ ${parts.join(", ")} }` : undefined;
}

/**
 * Carry over exactly the module-scope declarations the emitted spec still
 * references — transitively, and in their original order.
 */
function carriedDeclarations(spec, referenceText) {
  // Identifiers inside string literals are data (path geometry, variant labels,
  // the component's own name) and must not pull a declaration in.
  const withoutStrings = (text) => text.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const wanted = new Set();
  const queue = [withoutStrings(referenceText)];
  while (queue.length > 0) {
    const text = queue.pop();
    for (const identifier of text.match(IDENTIFIER_PATTERN) ?? []) {
      if (wanted.has(identifier)) continue;
      const declaration = spec.declarations.get(identifier);
      if (!declaration) continue;
      wanted.add(identifier);
      queue.push(withoutStrings(declaration));
    }
  }
  const ordered = [];
  for (const [identifier, text] of spec.declarations) {
    if (wanted.has(identifier)) ordered.push(text);
  }
  return ordered;
}

function emitModule(spec, name) {
  const rootText = emitRoot(spec.root);
  const elementsText = spec.elements.map(emitNode).join(",\n    ");
  const specParts = [`name: ${JSON.stringify(spec.name)}`];
  if (rootText) specParts.push(`svg: ${rootText}`);
  specParts.push(`elements: [\n    ${elementsText},\n  ]`);
  if (spec.groups.length > 1)
    specParts.push(`groups: ${JSON.stringify(spec.groups)}`);
  if (spec.start) specParts.push(`start: ${spec.start}`);
  if (spec.stop) specParts.push(`stop: ${spec.stop}`);

  const specText = `{\n  ${specParts.join(",\n  ")},\n}`;
  const declarations = carriedDeclarations(spec, specText);
  const declarationText = declarations.join("\n\n");
  const typeImports = [];
  if (/\bVariants\b/.test(declarationText)) typeImports.push("Variants");
  if (/\bTransition\b/.test(declarationText)) typeImports.push("Transition");
  const valueImports = [...spec.motionValueImports]
    .filter((identifier) =>
      new RegExp(`\\b${identifier}\\b`).test(declarationText + specText),
    )
    .sort();

  const imports = [];
  if (valueImports.length > 0) {
    imports.push(`import { ${valueImports.join(", ")} } from "motion/react";`);
  }
  if (typeImports.length > 0) {
    imports.push(
      `import type { ${typeImports.join(", ")} } from "motion/react";`,
    );
  }
  imports.push(
    'import { createAnimatedIcon, type AnimatedIconHandle } from "@vegastack/design/create-animated-icon";',
  );

  const blocks = ['"use client";', imports.join("\n")];
  if (declarationText) blocks.push(declarationText);
  blocks.push(
    `export type ${spec.name}Handle = AnimatedIconHandle;`,
    `export const ${spec.name} = createAnimatedIcon(${specText});`,
  );
  return `${blocks.join("\n\n")}\n`;
}

async function transform(upstreamSource, name) {
  assertGeneratedName(name, "animated icon name");
  const filename = `${name}.tsx`;
  let source = upstreamSource.replace(/\r\n?/g, "\n").trimStart();
  source = source.replace(/(['"])@\/lib\/utils\1/g, '"@vegastack/design"');
  source = source
    .replace(/\bstroke-linecap=/g, "strokeLinecap=")
    .replace(/\bstroke-linejoin=/g, "strokeLinejoin=")
    .replace(/\bstroke-width=/g, "strokeWidth=")
    .replace(/\bfill-rule=/g, "fillRule=")
    .replace(/\bclip-rule=/g, "clipRule=");
  source = namedImport(source, filename, "motion/react", {
    add: ["useReducedMotion"],
  });
  source = namedImport(source, filename, "react", {
    add: ["useEffect", "useRef"],
    remove: ["forwardRef"],
  });
  source = convertRefAsProp(source, filename);
  source = source.replace(
    /const isControlled = !!ref;/,
    "const isControlledRef = useRef(false);",
  );
  source = source.replace(
    /const isRefControlled = ref != null;/,
    "const isControlledRef = useRef(ref != null);",
  );
  source = normalizeSvgContract(source, filename);
  source = source.replace(/Number\.POSITIVE_INFINITY|\bInfinity\b/g, "1");
  source = normalizeImperativeHandle(source, filename);
  source = addReducedMotionEngine(source, filename);
  source = addMultiInputTriggers(source, filename);
  source = normalizePublicHandleName(source, filename);

  // The normalized controller is now only an intermediate: reduce it to data and
  // emit a module that hands that data to the one shared factory.
  const componentName = componentSymbol(source, filename);
  const spec = extractSpec(source, name, componentName);
  const module = emitModule(spec, name);

  const hex = module.match(/#[0-9a-fA-F]{3,8}\b/);
  if (hex) throw new Error(`${filename}: hardcoded color ${hex[0]}`);
  if (
    /(?:bg|text|border|stroke|fill)-(?:red|orange|amber|green|blue|purple|neutral|gray|zinc|slate|stone)-\d{2,3}\b/.test(
      module,
    )
  ) {
    throw new Error(`${filename}: raw palette utility`);
  }

  const header =
    `// Mirrored from lucide-animated (${REGISTRY}/${name}.json) — MIT.\n` +
    `// Generated by tooling/mirror-animated-icons.mjs — do NOT hand-edit; re-run the mirror to update.\n\n`;
  const filepath = assertWritablePathInside(
    SAFE_SOURCE_DIR,
    resolveInside(SAFE_SOURCE_DIR, `${name}.tsx`),
  );
  const prettierConfig = (await resolveConfig(filepath)) ?? {};
  return format(header + module.trimStart() + "\n", {
    ...prettierConfig,
    filepath,
    parser: "typescript",
  });
}

/**
 * The public `<Pascal>Icon` symbol. The EXPORTED name is authoritative — it is
 * what consumers import and what `component-contracts.json` pins — and at least
 * one upstream icon (`chevron-first`) carries a copy-pasted `displayName` that
 * names a different icon entirely.
 */
function componentSymbol(source, filename) {
  const file = parse(source, filename);
  for (const statement of file.statements) {
    if (
      ts.isVariableStatement(statement) &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      const declaration = statement.declarationList.declarations.find(
        (candidate) =>
          ts.isIdentifier(candidate.name) && /Icon$/.test(candidate.name.text),
      );
      if (declaration && ts.isIdentifier(declaration.name))
        return declaration.name.text;
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      const specifier = statement.exportClause.elements.find((element) =>
        /Icon$/.test(element.name.text),
      );
      if (specifier) return specifier.name.text;
    }
  }
  const displayName = source.match(/\.displayName\s*=\s*"([A-Za-z0-9]+Icon)"/);
  if (displayName) return displayName[1];
  throw new Error(`${filename}: missing exported icon symbol`);
}

async function readUpstreamSource(item) {
  assertGeneratedName(item.name, "animated icon name");
  const payload = await fetchJson(item.url);
  const files =
    payload.files?.filter((file) => typeof file.content === "string") ?? [];
  if (files.length !== 1)
    throw new Error(`${item.name}: expected one upstream source file`);
  const source = files[0].content.replace(/\r\n?/g, "\n");
  const actualHash = sha256(source);
  if (item.sha256 && item.sha256 !== actualHash) {
    throw new Error(
      `${item.name}: upstream hash changed (${item.sha256} -> ${actualHash}); run with --refresh only after review`,
    );
  }
  return { ...item, sha256: actualHash, source };
}

async function refreshManifest() {
  const index = await fetchJson(INDEX_URL);
  const names = [
    ...new Set(
      index.items?.map((item) =>
        assertGeneratedName(item.name, "upstream animated icon name"),
      ) ?? [],
    ),
  ].sort();
  if (names.length !== EXPECTED_COUNT) {
    throw new Error(
      `upstream index: expected ${EXPECTED_COUNT} unique items, found ${names.length}`,
    );
  }
  const items = await pool(names, CONCURRENCY, async (name) =>
    readUpstreamSource({
      name,
      url: `${REGISTRY}/${name}.json`,
      license: "MIT",
    }),
  );
  return {
    manifest: {
      schemaVersion: 1,
      source: "lucide-animated",
      indexUrl: INDEX_URL,
      license: "MIT",
      itemCount: items.length,
      items: items.map(({ name, url, license, sha256: hash }) => ({
        name,
        url,
        license,
        sha256: hash,
      })),
    },
    fetched: items,
  };
}

function readManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`${MANIFEST_PATH} is missing; run once with --refresh`);
  }
  const manifest = JSON.parse(
    readFileSync(assertExistingPathInside(REPO_ROOT, MANIFEST_PATH), "utf8"),
  );
  if (
    manifest.schemaVersion !== 1 ||
    manifest.source !== "lucide-animated" ||
    manifest.indexUrl !== INDEX_URL ||
    manifest.license !== "MIT" ||
    manifest.itemCount !== EXPECTED_COUNT ||
    !Array.isArray(manifest.items) ||
    manifest.items.length !== EXPECTED_COUNT
  ) {
    throw new Error(`${MANIFEST_PATH}: invalid manifest contract`);
  }
  const sorted = [...manifest.items].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  if (JSON.stringify(sorted) !== JSON.stringify(manifest.items)) {
    throw new Error(`${MANIFEST_PATH}: items must be sorted by name`);
  }
  for (const item of manifest.items) {
    assertGeneratedName(item.name, "pinned animated icon name");
    if (
      item.url !== `${REGISTRY}/${item.name}.json` ||
      item.license !== "MIT" ||
      !/^[0-9a-f]{64}$/.test(item.sha256)
    ) {
      throw new Error(
        `${MANIFEST_PATH}: invalid source record for ${item.name}`,
      );
    }
  }
  return manifest;
}

const refreshed = refresh ? await refreshManifest() : undefined;
let manifest = refreshed?.manifest ?? readManifest();
const fetched =
  refreshed?.fetched ??
  (await pool(manifest.items, CONCURRENCY, readUpstreamSource));
const generated = await Promise.all(
  fetched.map(async (item) => ({
    name: item.name,
    source: await transform(item.source, item.name),
  })),
);

const expectedFiles = new Set(generated.map((item) => `${item.name}.tsx`));
const existingFiles = existsSync(SAFE_SOURCE_DIR)
  ? readdirSync(SAFE_SOURCE_DIR).filter((name) => name.endsWith(".tsx"))
  : [];
const orphaned = existingFiles
  .filter((name) => !expectedFiles.has(name))
  .sort();
const changed = generated.filter(({ name, source }) => {
  const path = resolveInside(SAFE_SOURCE_DIR, `${name}.tsx`);
  const safePath = existsSync(path)
    ? assertExistingPathInside(SAFE_SOURCE_DIR, path)
    : assertWritablePathInside(SAFE_SOURCE_DIR, path);
  return (
    !existsSync(safePath) ||
    stripRegistryProvenance(readFileSync(safePath, "utf8")) !== source
  );
});

if (check) {
  if (refresh) throw new Error("--refresh and --check are mutually exclusive");
  if (changed.length > 0 || orphaned.length > 0) {
    throw new Error(
      `animated-icon mirror drift: ${changed.length} changed/missing, ${orphaned.length} orphaned`,
    );
  }
  console.log(
    `✓ mirror check: ${generated.length} canonical icons match the pinned manifest`,
  );
  process.exit(0);
}

mkdirSync(SAFE_SOURCE_DIR, { recursive: true });
for (const { name, source } of generated)
  writeFileSync(
    assertWritablePathInside(
      SAFE_SOURCE_DIR,
      resolveInside(SAFE_SOURCE_DIR, `${name}.tsx`),
    ),
    source,
  );
for (const filename of orphaned) {
  const orphanPath = resolveInside(SAFE_SOURCE_DIR, filename);
  rmSync(assertExistingPathInside(SAFE_SOURCE_DIR, orphanPath));
}

if (refresh) {
  manifest = stableJson(manifest);
  writeFileSync(
    assertWritablePathInside(REPO_ROOT, MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

console.log(
  `✓ mirror: ${generated.length} canonical icon(s), ${changed.length} written/changed` +
    (orphaned.length ? `, ${orphaned.length} orphan(s) pruned` : "") +
    (refresh ? ", manifest refreshed" : ", pinned manifest verified"),
);
