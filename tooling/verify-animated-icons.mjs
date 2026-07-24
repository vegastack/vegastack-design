#!/usr/bin/env node
// Fail-closed static contract verifier for every generated lucide-animated mirror.
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import ts from "typescript";

const EXPECTED_COUNT = 439;
const SOURCE_DIR = "packages/ui/registry/ui/icons";
const MANIFEST_PATH = "packages/ui/animated-icon-sources.json";
const WRAPPER_PATH = "packages/design/src/icons/animated-icon.tsx";
const UPSTREAM = "https://lucide-animated.com/r";
// The generated mirrors preserve upstream Motion choreography as a sanctioned
// renderer-engine layer. Keep the observed archetypes explicit so a mirror
// refresh cannot silently introduce a new timing/easing language.
const SANCTIONED_DURATION_SECONDS = new Set([
  0, 0.01, 0.1, 0.15, 0.2, 0.25, 0.28, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6,
  0.7, 0.75, 0.8, 0.9, 0.95, 1, 1.05, 1.1, 1.2, 1.4, 1.5, 1.6, 1.8, 2, 2.4, 2.5,
  6,
]);
const SANCTIONED_EASINGS = new Set([
  '"circIn"',
  '"easeIn"',
  '"easeInOut"',
  '"easeOut"',
  '"linear"',
  "CUSTOM_EASING",
  '["easeInOut", "easeOut", "easeOut"]',
  '["easeInOut", "easeInOut", "easeOut", "easeOut"]',
  "[0.34, 1.56, 0.64, 1]",
  "[0.4, 0, 0.2, 1]",
  "[0.42, 0, 0.58, 1]",
  "[0.68, -0.6, 0.32, 1.6]",
  "easeInOut",
  "easeOut",
]);
const SANCTIONED_TRANSITION_TYPES = new Set(['"spring"', '"tween"']);

const failures = [];
const autoTriggerExceptions = [];
const durations = [];
const easings = new Map();
const transitionTypes = new Map();
let boundedRepeats = 0;

function fail(filename, message) {
  failures.push(`${filename}: ${message}`);
}

function count(map, value) {
  map.set(value, (map.get(value) ?? 0) + 1);
}

function parse(filename, source) {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  for (const diagnostic of file.parseDiagnostics) {
    fail(
      filename,
      ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
    );
  }
  return file;
}

function jsxAttributes(node, file) {
  return new Map(
    node.attributes.properties
      .filter(ts.isJsxAttribute)
      .map((attribute) => [attribute.name.getText(file), attribute]),
  );
}

function initializerText(attribute, file) {
  if (!attribute?.initializer) return undefined;
  if (ts.isStringLiteral(attribute.initializer))
    return attribute.initializer.text;
  if (ts.isJsxExpression(attribute.initializer))
    return attribute.initializer.expression?.getText(file);
  return attribute.initializer.getText(file);
}

function walk(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => walk(child, callback));
}

function verifyManifest() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  if (manifest.schemaVersion !== 1)
    fail(MANIFEST_PATH, "schemaVersion must be 1");
  if (manifest.source !== "lucide-animated")
    fail(MANIFEST_PATH, "source must be lucide-animated");
  if (manifest.indexUrl !== `${UPSTREAM}/registry.json`)
    fail(MANIFEST_PATH, "unexpected index URL");
  if (manifest.license !== "MIT")
    fail(MANIFEST_PATH, "family license must be MIT");
  if (manifest.itemCount !== EXPECTED_COUNT) {
    fail(
      MANIFEST_PATH,
      `itemCount must be ${EXPECTED_COUNT}, got ${manifest.itemCount}`,
    );
  }
  if (
    !Array.isArray(manifest.items) ||
    manifest.items.length !== EXPECTED_COUNT
  ) {
    fail(MANIFEST_PATH, `items must contain exactly ${EXPECTED_COUNT} records`);
    return { items: [] };
  }
  const names = manifest.items.map((item) => item.name);
  const sortedNames = [...names].sort();
  if (JSON.stringify(names) !== JSON.stringify(sortedNames)) {
    fail(MANIFEST_PATH, "items must be deterministically sorted by name");
  }
  if (new Set(names).size !== EXPECTED_COUNT)
    fail(MANIFEST_PATH, "duplicate item names");
  for (const item of manifest.items) {
    if (item.url !== `${UPSTREAM}/${item.name}.json`)
      fail(MANIFEST_PATH, `${item.name}: URL drift`);
    if (item.license !== "MIT")
      fail(MANIFEST_PATH, `${item.name}: license drift`);
    if (!/^[0-9a-f]{64}$/.test(item.sha256))
      fail(MANIFEST_PATH, `${item.name}: invalid SHA-256`);
  }
  return manifest;
}

function verifyIcon(item) {
  const filename = `${item.name}.tsx`;
  const path = join(SOURCE_DIR, filename);
  const source = readFileSync(path, "utf8");
  const provenance = /^\/\/ @vegastack icon-[^\n]+\n\n/;
  if (!provenance.test(source)) {
    fail(filename, "missing registry provenance header at line 1");
  }
  const mirrorSource = source.replace(provenance, "");
  const file = parse(filename, source);
  const numericConstants = new Map();
  walk(file, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isNumericLiteral(node.initializer)
    ) {
      numericConstants.set(node.name.text, Number(node.initializer.text));
    }
  });
  function numericValue(node) {
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isIdentifier(node)) return numericConstants.get(node.text);
    if (!ts.isBinaryExpression(node)) return undefined;
    const left = numericValue(node.left);
    const right = numericValue(node.right);
    if (left === undefined || right === undefined) return undefined;
    switch (node.operatorToken.kind) {
      case ts.SyntaxKind.PlusToken:
        return left + right;
      case ts.SyntaxKind.MinusToken:
        return left - right;
      case ts.SyntaxKind.AsteriskToken:
        return left * right;
      case ts.SyntaxKind.SlashToken:
        return right === 0 ? undefined : left / right;
      default:
        return undefined;
    }
  }
  const expectedHeader =
    `// Mirrored from lucide-animated (${item.url}) — MIT.\n` +
    "// Generated by tooling/mirror-animated-icons.mjs — do NOT hand-edit; re-run the mirror to update.\n";
  if (!mirrorSource.startsWith(expectedHeader))
    fail(filename, "deterministic attribution header drift");
  if (/\bforwardRef\b/.test(source))
    fail(filename, "React.forwardRef is forbidden under React 19");
  if (!source.includes('size = "var(--icon-default)"')) {
    fail(filename, "default size must resolve from --icon-default at runtime");
  }
  if (!source.includes("useReducedMotion"))
    fail(filename, "missing intrinsic reduced-motion hook");
  if (
    !/useEffect\([\s\S]*shouldReduceMotion[\s\S]*stopAnimation\(\)/.test(source)
  ) {
    fail(
      filename,
      "reduced-motion preference changes must settle via stopAnimation immediately",
    );
  }
  if (
    /Number\.POSITIVE_INFINITY|\bInfinity\b|setInterval\s*\(|requestAnimationFrame\s*\(/.test(
      source,
    )
  ) {
    fail(filename, "unbounded animation primitive detected");
  }
  if (/(['"])@\/lib\/utils\1/.test(source))
    fail(filename, "upstream utils alias was not rewritten");
  if (/#[0-9a-fA-F]{3,8}\b/.test(source))
    fail(filename, "hardcoded color detected");
  if (
    /\b(?:stroke-linecap|stroke-linejoin|stroke-width|fill-rule|clip-rule)=/.test(
      source,
    )
  ) {
    fail(filename, "invalid kebab-case React SVG property detected");
  }

  let rootSvgCount = 0;
  let hasHandle = false;
  let hasRefProp = false;
  let hasRefBinding = false;
  let hasImperativeRef = false;
  let hasComponentExport = false;
  let hasStart = false;
  let hasStop = false;
  let hasPointerEnter = false;
  let hasPointerLeave = false;
  let hasPointerDown = false;
  let hasFocus = false;
  let hasBlur = false;
  let hasAutoHandlers = false;

  walk(file, (node) => {
    if (
      ts.isInterfaceDeclaration(node) &&
      node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) &&
      node.members.some(
        (member) => member.name?.getText(file) === "startAnimation",
      ) &&
      node.members.some(
        (member) => member.name?.getText(file) === "stopAnimation",
      )
    ) {
      hasHandle = true;
      const members = new Set(
        node.members.map((member) => member.name?.getText(file)),
      );
      hasStart ||= members.has("startAnimation");
      hasStop ||= members.has("stopAnimation");
    }
    if (
      ts.isPropertySignature(node) &&
      node.name.getText(file) === "ref" &&
      /React\.Ref<.*Handle>/.test(node.type?.getText(file) ?? "")
    ) {
      hasRefProp = true;
    }
    if (
      ts.isParameter(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.name.elements.some((element) => element.name.getText(file) === "ref")
    ) {
      hasRefBinding = true;
      if (/React\.Ref<.*Handle>/.test(node.type?.getText(file) ?? ""))
        hasRefProp = true;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "useImperativeHandle" &&
      node.arguments[0]?.getText(file) === "ref"
    ) {
      hasImperativeRef = true;
    }
    if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      hasComponentExport ||= node.exportClause.elements.some((element) =>
        /Icon$/.test(element.name.text),
      );
    }
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      hasComponentExport ||= node.declarationList.declarations.some(
        (declaration) =>
          ts.isIdentifier(declaration.name) &&
          /Icon$/.test(declaration.name.text),
      );
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      hasPointerEnter ||= node.name.text === "handlePointerEnter";
      hasPointerLeave ||= node.name.text === "handlePointerLeave";
      hasPointerDown ||= node.name.text === "handlePointerDown";
      hasFocus ||= node.name.text === "handleFocus";
      hasBlur ||= node.name.text === "handleBlur";
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(file);
      const attributes = jsxAttributes(node, file);
      if (
        (tagName === "svg" || tagName === "motion.svg") &&
        attributes.has("xmlns")
      ) {
        rootSvgCount += 1;
        const viewBox = initializerText(attributes.get("viewBox"), file);
        const viewBoxParts = viewBox?.split(/\s+/).map(Number) ?? [];
        if (
          viewBoxParts.length !== 4 ||
          viewBoxParts.some((part) => !Number.isFinite(part)) ||
          viewBoxParts[2] <= 0 ||
          viewBoxParts[3] <= 0
        ) {
          fail(
            filename,
            `root SVG needs a valid positive viewBox, got ${viewBox ?? "missing"}`,
          );
        }
        if (initializerText(attributes.get("height"), file) !== "size") {
          fail(filename, "root SVG height must use size");
        }
        if (initializerText(attributes.get("width"), file) !== "size") {
          fail(filename, "root SVG width must use size");
        }
        const stroke = initializerText(attributes.get("stroke"), file);
        const fill = initializerText(attributes.get("fill"), file);
        if (stroke !== "currentColor" && fill !== "currentColor") {
          fail(filename, "root SVG must inherit currentColor");
        }
      }
      if (tagName === "div") {
        hasAutoHandlers ||= attributes.has("onPointerEnter");
        if (attributes.has("onPointerEnter")) {
          const required = [
            "onPointerLeave",
            "onPointerDown",
            "onFocus",
            "onBlur",
          ];
          for (const attribute of required) {
            if (!attributes.has(attribute))
              fail(filename, `auto-trigger root missing ${attribute}`);
          }
          if (
            initializerText(attributes.get("onMouseEnter"), file) !==
            "onMouseEnter"
          ) {
            fail(filename, "upstream onMouseEnter callback is not preserved");
          }
          if (
            initializerText(attributes.get("onMouseLeave"), file) !==
            "onMouseLeave"
          ) {
            fail(filename, "upstream onMouseLeave callback is not preserved");
          }
        }
      }
    }
    if (ts.isPropertyAssignment(node)) {
      const name = node.name.getText(file);
      const value = node.initializer.getText(file);
      if (name === "repeat") {
        if (
          !ts.isNumericLiteral(node.initializer) ||
          !Number.isFinite(Number(node.initializer.text))
        ) {
          fail(
            filename,
            `repeat must be a finite numeric literal, got ${value}`,
          );
        } else {
          boundedRepeats += 1;
        }
      }
      if (name === "duration") {
        const duration = numericValue(node.initializer);
        if (duration === undefined || !Number.isFinite(duration)) {
          fail(
            filename,
            `duration must resolve from sanctioned numeric constants, got ${value}`,
          );
        } else {
          durations.push(duration);
          if (!SANCTIONED_DURATION_SECONDS.has(duration)) {
            fail(filename, `unsanctioned Motion duration ${duration}s`);
          }
        }
      }
      if (name === "ease") {
        count(easings, value);
        if (!SANCTIONED_EASINGS.has(value)) {
          fail(filename, `unsanctioned Motion easing ${value}`);
        }
      }
      if (name === "type") {
        count(transitionTypes, value);
        if (!SANCTIONED_TRANSITION_TYPES.has(value)) {
          fail(filename, `unsanctioned Motion renderer type ${value}`);
        }
      }
    }
  });

  if (!hasHandle || !hasStart || !hasStop)
    fail(filename, "exported start/stop handle contract missing");
  if (!hasRefProp || !hasRefBinding || !hasImperativeRef)
    fail(filename, "React 19 ref-as-prop contract missing");
  if (!hasComponentExport) fail(filename, "icon component export missing");
  if (rootSvgCount !== 1)
    fail(filename, `expected one root SVG, found ${rootSvgCount}`);
  if (hasAutoHandlers) {
    if (
      !hasPointerEnter ||
      !hasPointerLeave ||
      !hasPointerDown ||
      !hasFocus ||
      !hasBlur
    ) {
      fail(filename, "multi-input handler declarations incomplete");
    }
  } else {
    autoTriggerExceptions.push(item.name);
  }
}

function verifyWrapper() {
  const source = readFileSync(WRAPPER_PATH, "utf8");
  parse(WRAPPER_PATH, source);
  if (/\bforwardRef\b|ForwardRefExoticComponent/.test(source)) {
    fail(
      WRAPPER_PATH,
      "wrapper must use React 19 ref-as-prop types and implementation",
    );
  }
  for (const token of [
    "--icon-inline",
    "--icon-default",
    "--icon-action",
    "--icon-feature",
  ]) {
    if (!source.includes(`var(${token})`))
      fail(WRAPPER_PATH, `missing runtime token ${token}`);
  }
  if (!source.includes("ref?: React.Ref<AnimatedIconHandle>")) {
    fail(WRAPPER_PATH, "wrapper props must expose the imperative ref");
  }
  if (!source.includes("ref={ref}"))
    fail(WRAPPER_PATH, "wrapper does not pass the ref through");
  if (!source.includes("useReducedMotion()")) {
    fail(
      WRAPPER_PATH,
      "JSDoc must document the intrinsic generated reduced-motion contract",
    );
  }
}

const manifest = verifyManifest();
const actualFiles = readdirSync(SOURCE_DIR)
  .filter((filename) => filename.endsWith(".tsx"))
  .sort();
const expectedFiles = manifest.items.map((item) => `${item.name}.tsx`).sort();
if (actualFiles.length !== EXPECTED_COUNT) {
  fail(
    SOURCE_DIR,
    `expected ${EXPECTED_COUNT} TSX files, found ${actualFiles.length}`,
  );
}
for (const filename of expectedFiles) {
  if (!actualFiles.includes(filename)) fail(SOURCE_DIR, `missing ${filename}`);
}
for (const filename of actualFiles) {
  if (!expectedFiles.includes(filename))
    fail(SOURCE_DIR, `orphaned ${filename}`);
}
for (const item of manifest.items) verifyIcon(item);
verifyWrapper();

if (failures.length > 0) {
  console.error(`animated-icon verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const durationRange = durations.length
  ? `${Math.min(...durations)}s..${Math.max(...durations)}s across ${durations.length} declarations`
  : "none";
const top = (map) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, occurrences]) => `${value} (${occurrences})`)
    .join(", ");

console.log(
  `✓ animated icons: ${EXPECTED_COUNT}/${EXPECTED_COUNT} sources verified`,
);
console.log(
  `  auto-trigger: ${EXPECTED_COUNT - autoTriggerExceptions.length}; imperative-only upstream: ${autoTriggerExceptions.length}`,
);
console.log(`  imperative-only: ${autoTriggerExceptions.join(", ") || "none"}`);
console.log(`  bounded repeat declarations: ${boundedRepeats}`);
console.log(`  Motion duration archetype: ${durationRange}`);
console.log(`  Motion easing archetypes: ${top(easings)}`);
console.log(`  Motion renderer types: ${top(transitionTypes)}`);
console.log(
  `  manifest: ${basename(MANIFEST_PATH)} (${manifest.items.length} URL/MIT/SHA-256 records)`,
);
