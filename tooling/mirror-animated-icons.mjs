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

  const hex = source.match(/#[0-9a-fA-F]{3,8}\b/);
  if (hex) throw new Error(`${filename}: hardcoded color ${hex[0]}`);
  if (
    /(?:bg|text|border|stroke|fill)-(?:red|orange|amber|green|blue|purple|neutral|gray|zinc|slate|stone)-\d{2,3}\b/.test(
      source,
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
  return format(header + source.trimStart() + "\n", {
    ...prettierConfig,
    filepath,
    parser: "typescript",
  });
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
