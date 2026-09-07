#!/usr/bin/env node
// Fail-closed contract verifier for the animated-icon corpus.
//
// The corpus is one factory plus 439 data modules, so this script is split the
// same way. The controller contract — reduced motion, the imperative handle, the
// multi-input trigger rules, the host element — is asserted ONCE against
// `createAnimatedIcon`. Each mirrored module is then held to a schema whose most
// important clause is a negative one: a data module contains no controller at
// all. No JSX, no hook, no event handler, no animation control. If any of that
// reappears in a generated file, the duplication this architecture removed is
// creeping back and the gate fails.
//
// `--self-test` proves the assertions can actually fail, by mutating a copy of
// the real corpus and requiring each mutation to be rejected.
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import ts from "typescript";

const EXPECTED_COUNT = 439;
const SOURCE_DIR = "packages/ui/registry/ui/icons";
const MANIFEST_PATH = "packages/ui/animated-icon-sources.json";
const FACTORY_PATH = "packages/design/src/icons/create-animated-icon.tsx";
const WRAPPER_PATH = "packages/design/src/icons/animated-icon.tsx";
const FACTORY_MODULE = "@vegastack/design/create-animated-icon";
const CONTRACTS_PATH = "packages/ui/component-contracts.json";
const UPSTREAM = "https://lucide-animated.com/r";

/** The pinned public symbols, keyed by registry item name. */
const pinnedSymbols = new Map(
  (
    JSON.parse(readFileSync(CONTRACTS_PATH, "utf8")).animatedIcons?.members ??
    []
  ).map((member) => [member.name, member.publicSymbols]),
);

// The generated modules preserve upstream Motion choreography as a sanctioned
// renderer-engine layer. Keeping the observed archetypes explicit means a mirror
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

/** Spec keys `createAnimatedIcon` accepts on the root call. */
const SPEC_KEYS = new Set([
  "elements",
  "groups",
  "name",
  "start",
  "stop",
  "svg",
]);
/** Root-`<svg>` keys beyond the shared node keys. */
const ROOT_ONLY_KEYS = new Set([
  "fill",
  "overflow",
  "stroke",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeWidth",
  "viewBox",
]);
/** Modules a data module may import. Anything else is a controller creeping in. */
const ALLOWED_IMPORTS = new Set([FACTORY_MODULE, "motion/react"]);
/**
 * The controller vocabulary. None of it may appear in a data module — that is
 * the whole point of the factory, and the assertion that keeps it true.
 */
const CONTROLLER_IDENTIFIERS = [
  "AnimatePresence",
  "forwardRef",
  "useAnimation",
  "useCallback",
  "useEffect",
  "useImperativeHandle",
  "useReducedMotion",
  "useRef",
  "useState",
];

function parse(filename, source, failures) {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  for (const diagnostic of file.parseDiagnostics) {
    failures.push(
      `${filename}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
    );
  }
  return file;
}

function walk(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => walk(child, callback));
}

/**
 * Read the tag vocabulary and reserved-key set out of the factory itself rather
 * than restating them, so the verifier cannot drift from what it verifies.
 */
function readFactoryVocabulary(factorySource, failures) {
  const file = parse(FACTORY_PATH, factorySource, failures);
  const tags = new Set();
  const reserved = new Set();
  walk(file, (node) => {
    if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name)) return;
    if (node.name.text === "TAGS") {
      let initializer = node.initializer;
      if (initializer && ts.isAsExpression(initializer))
        initializer = initializer.expression;
      if (initializer && ts.isObjectLiteralExpression(initializer)) {
        for (const property of initializer.properties) {
          const key = property.name;
          if (!key) continue;
          tags.add(
            ts.isStringLiteral(key) || ts.isIdentifier(key)
              ? key.text
              : key.getText(file),
          );
        }
      }
    }
    if (node.name.text === "ANIMATED_ICON_RESERVED_KEYS") {
      walk(node, (child) => {
        if (ts.isStringLiteral(child)) reserved.add(child.text);
      });
    }
  });
  if (tags.size === 0)
    failures.push(`${FACTORY_PATH}: could not read the TAGS vocabulary`);
  if (reserved.size === 0)
    failures.push(
      `${FACTORY_PATH}: could not read ANIMATED_ICON_RESERVED_KEYS`,
    );
  return { tags, reserved };
}

/**
 * The controller contract, asserted once. Each clause names a behaviour that
 * used to be duplicated 439 times and is now guaranteed in exactly one place.
 */
function verifyFactory(source, failures) {
  const fail = (message) => failures.push(`${FACTORY_PATH}: ${message}`);
  const file = parse(FACTORY_PATH, source, failures);

  if (!/^"use client";/m.test(source)) fail("missing 'use client' directive");
  if (/\bforwardRef\b/.test(source))
    fail("React.forwardRef is forbidden under React 19");
  // The config-aware hook, deliberately: it honours the OS preference AND an
  // explicit <MotionConfig reducedMotion> from the consumer. The plain
  // useReducedMotion() reads a module singleton nothing can influence.
  if (!source.includes("useReducedMotionConfig()"))
    fail("missing the intrinsic reduced-motion hook");
  if (/\buseReducedMotion\(\)/.test(source))
    fail("use useReducedMotionConfig(), which also honours <MotionConfig>");
  if (!source.includes('size = "var(--icon-default)"'))
    fail("default size must resolve from --icon-default at runtime");
  if (
    /Number\.POSITIVE_INFINITY|\bInfinity\b|setInterval\s*\(|requestAnimationFrame\s*\(/.test(
      source,
    )
  ) {
    fail("unbounded animation primitive detected");
  }
  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) fail("hardcoded color detected");

  // The host is an inline-flex <span>: an icon sits in a line of text, so a
  // block-level box there is a layout bug (the audit's B9-01 finding).
  if (!/<span\b/.test(source)) fail("host element must be a <span>");
  if (!/inline-flex/.test(source)) fail("host must be inline-flex");

  // Reduced motion must settle the icon, and must do so on a dependency array.
  // A dependency-less effect re-runs after EVERY render — the defect this
  // architecture was built to delete, so the gate names it explicitly.
  let reducedMotionEffect;
  walk(file, (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(file).endsWith("useEffect") &&
      /shouldReduceMotion/.test(node.arguments[0]?.getText(file) ?? "") &&
      /stopAnimation\(\)/.test(node.arguments[0]?.getText(file) ?? "")
    ) {
      reducedMotionEffect = node;
    }
  });
  if (!reducedMotionEffect) {
    fail("reduced-motion preference changes must settle via stopAnimation");
  } else {
    const dependencies = reducedMotionEffect.arguments[1];
    if (!dependencies || !ts.isArrayLiteralExpression(dependencies)) {
      fail(
        "the reduced-motion effect must declare a dependency array; without one it re-runs after every render",
      );
    } else if (
      !dependencies.elements.some(
        (element) => element.getText(file) === "shouldReduceMotion",
      )
    ) {
      fail("the reduced-motion effect must depend on shouldReduceMotion");
    }
  }

  // Reduced motion must be a real gate on playback, not just a settle-on-change.
  if (!/reduceRef\.current/.test(source))
    fail("run/reset must consult the live reduced-motion preference");
  if (!/control\.stop\(\)/.test(source))
    fail("reduced motion must halt the control");
  if (!/control\.set\(definition\)/.test(source))
    fail("reduced motion must apply the resting target instantly");

  // The imperative handle, and the controlled-mode latch it sets.
  if (!/useImperativeHandle\(\s*ref\b/.test(source))
    fail("missing useImperativeHandle(ref, ...)");
  if (!/isControlledRef\.current = true/.test(source))
    fail("attaching a ref must flip the icon into controlled mode");

  // The multi-input trigger rules.
  const triggerRules = [
    [
      "handlePointerEnter",
      /handlePointerEnter[\s\S]{0,240}?pointerType !== "touch"/,
      "hover must play only on a fine pointer",
    ],
    [
      "handlePointerLeave",
      /handlePointerLeave[\s\S]{0,240}?pointerType !== "touch"/,
      "pointer-leave must rest only on a fine pointer",
    ],
    [
      "handlePointerDown",
      /handlePointerDown[\s\S]{0,240}?pointerType === "touch"/,
      "touch must play on pointer-down",
    ],
    [
      "handleFocus",
      /handleFocus[\s\S]{0,160}?startAnimation\(\)/,
      "focus must play",
    ],
    [
      "handleBlur",
      /handleBlur[\s\S]{0,160}?stopAnimation\(\)/,
      "blur must rest",
    ],
  ];
  for (const [name, pattern, message] of triggerRules) {
    if (!source.includes(name)) fail(`missing ${name}`);
    else if (!pattern.test(source)) fail(`${name}: ${message}`);
  }
  for (const handler of triggerRules.map(([name]) => name)) {
    const body = source.slice(
      source.indexOf(`const ${handler} =`),
      source.indexOf(`const ${handler} =`) + 260,
    );
    if (!/!isControlledRef\.current/.test(body)) {
      fail(`${handler} must not auto-trigger while the icon is ref-controlled`);
    }
  }

  // Deferred work must not outlive the icon.
  if (!/clearTimeout/.test(source)) fail("scheduled work must be cancellable");
  if (!/useEffect\(\(\) => clearTimers/.test(source))
    fail("pending timers must be cleared on unmount");
}

/** The AnimatedIcon wrapper's public contract. */
function verifyWrapper(source, failures) {
  const fail = (message) => failures.push(`${WRAPPER_PATH}: ${message}`);
  parse(WRAPPER_PATH, source, failures);
  if (/\bforwardRef\b|ForwardRefExoticComponent/.test(source)) {
    fail("wrapper must use React 19 ref-as-prop types and implementation");
  }
  for (const token of [
    "--icon-inline",
    "--icon-default",
    "--icon-action",
    "--icon-feature",
  ]) {
    if (!source.includes(`var(${token})`))
      fail(`missing runtime token ${token}`);
  }
  if (!source.includes("ref?: React.Ref<AnimatedIconHandle>"))
    fail("wrapper props must expose the imperative ref");
  if (!source.includes("ref={ref}"))
    fail("wrapper does not pass the ref through");
  if (!source.includes("useReducedMotionConfig()")) {
    fail("JSDoc must document the intrinsic reduced-motion contract");
  }
  if (!source.includes("HTMLSpanElement")) {
    fail("wrapper element type must match the factory's <span> host");
  }
}

function verifyManifest(manifestPath, failures) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const fail = (message) => failures.push(`${MANIFEST_PATH}: ${message}`);
  if (manifest.schemaVersion !== 1) fail("schemaVersion must be 1");
  if (manifest.source !== "lucide-animated")
    fail("source must be lucide-animated");
  if (manifest.indexUrl !== `${UPSTREAM}/registry.json`)
    fail("unexpected index URL");
  if (manifest.license !== "MIT") fail("family license must be MIT");
  if (manifest.itemCount !== EXPECTED_COUNT)
    fail(`itemCount must be ${EXPECTED_COUNT}, got ${manifest.itemCount}`);
  if (
    !Array.isArray(manifest.items) ||
    manifest.items.length !== EXPECTED_COUNT
  ) {
    fail(`items must contain exactly ${EXPECTED_COUNT} records`);
    return { items: [] };
  }
  const names = manifest.items.map((item) => item.name);
  if (JSON.stringify(names) !== JSON.stringify([...names].sort())) {
    fail("items must be deterministically sorted by name");
  }
  if (new Set(names).size !== EXPECTED_COUNT) fail("duplicate item names");
  for (const item of manifest.items) {
    if (item.url !== `${UPSTREAM}/${item.name}.json`)
      fail(`${item.name}: URL drift`);
    if (item.license !== "MIT") fail(`${item.name}: license drift`);
    if (!/^[0-9a-f]{64}$/.test(item.sha256))
      fail(`${item.name}: invalid SHA-256`);
  }
  return manifest;
}

/** One mirrored data module, against the schema and against the manifest. */
function verifyIcon(item, sourceDir, vocabulary, stats, failures) {
  const filename = `${item.name}.tsx`;
  const source = readFileSync(join(sourceDir, filename), "utf8");
  const fail = (message) => failures.push(`${filename}: ${message}`);

  const provenance = /^\/\/ @vegastack icon-[^\n]+\n\n/;
  if (!provenance.test(source))
    fail("missing registry provenance header at line 1");
  const mirrorSource = source.replace(provenance, "");
  const expectedHeader =
    `// Mirrored from lucide-animated (${item.url}) — MIT.\n` +
    "// Generated by tooling/mirror-animated-icons.mjs — do NOT hand-edit; re-run the mirror to update.\n";
  if (!mirrorSource.startsWith(expectedHeader))
    fail("deterministic attribution header drift");
  if (!/^"use client";$/m.test(source)) fail("missing 'use client' directive");

  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) fail("hardcoded color detected");
  if (
    /\b(?:stroke-linecap|stroke-linejoin|stroke-width|fill-rule|clip-rule)=/.test(
      source,
    )
  ) {
    fail("invalid kebab-case React SVG property detected");
  }
  if (/(['"])@\/lib\/utils\1/.test(source))
    fail("upstream utils alias was not rewritten");
  if (
    /Number\.POSITIVE_INFINITY|\bInfinity\b|setInterval\s*\(|requestAnimationFrame\s*\(/.test(
      source,
    )
  ) {
    fail("unbounded animation primitive detected");
  }

  const file = parse(filename, source, failures);

  // A data module is data. No JSX, and none of the controller vocabulary.
  walk(file, (node) => {
    if (
      ts.isJsxElement(node) ||
      ts.isJsxSelfClosingElement(node) ||
      ts.isJsxFragment(node)
    ) {
      fail("a data module must contain no JSX — the factory owns rendering");
    }
  });
  for (const identifier of CONTROLLER_IDENTIFIERS) {
    if (new RegExp(`\\b${identifier}\\b`).test(source)) {
      fail(`controller vocabulary leaked back in: ${identifier}`);
    }
  }

  // Imports: the factory, and Motion for its types/easing helpers. Nothing else.
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const module = statement.moduleSpecifier.getText(file).slice(1, -1);
    if (!ALLOWED_IMPORTS.has(module)) fail(`unexpected import from ${module}`);
  }
  if (!source.includes(`from "${FACTORY_MODULE}"`))
    fail(`must import createAnimatedIcon from ${FACTORY_MODULE}`);

  // Exports: exactly the icon and its handle alias, matching the pinned names.
  const exported = new Set();
  let componentName;
  let specObject;
  for (const statement of file.statements) {
    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) continue;
    if (ts.isTypeAliasDeclaration(statement)) {
      exported.add(statement.name.text);
      if (statement.type.getText(file) !== "AnimatedIconHandle") {
        fail(`${statement.name.text} must alias AnimatedIconHandle`);
      }
      continue;
    }
    if (!ts.isVariableStatement(statement)) {
      fail("unexpected exported declaration");
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      exported.add(declaration.name.text);
      componentName = declaration.name.text;
      const call = declaration.initializer;
      if (
        !call ||
        !ts.isCallExpression(call) ||
        call.expression.getText(file) !== "createAnimatedIcon" ||
        call.arguments.length !== 1 ||
        !ts.isObjectLiteralExpression(call.arguments[0])
      ) {
        fail("the icon must be a single createAnimatedIcon({ … }) call");
        continue;
      }
      specObject = call.arguments[0];
    }
  }
  // The public symbol is checked against the PINNED contract, not merely
  // against itself: consumers import this name, so a rename applied uniformly
  // across the file must still be rejected.
  const pinned = pinnedSymbols.get(`icon-${item.name}`);
  if (!componentName) fail("missing the <Name>Icon export");
  else if (!pinned) fail(`no pinned public symbols for icon-${item.name}`);
  else {
    const expected = [componentName, `${componentName}Handle`].sort();
    if (JSON.stringify([...pinned].sort()) !== JSON.stringify(expected)) {
      fail(
        `public symbols must be [${expected.join(", ")}], contract pins [${pinned.join(", ")}]`,
      );
    }
  }
  if (componentName && !exported.has(`${componentName}Handle`))
    fail(`missing the ${componentName}Handle type export`);
  if (exported.size !== 2)
    fail(
      `expected exactly 2 exports, found ${[...exported].sort().join(", ")}`,
    );

  if (!specObject) return;

  // Schema.
  const properties = new Map();
  for (const property of specObject.properties) {
    if (!ts.isPropertyAssignment(property) || !property.name) {
      fail("spec properties must be plain assignments");
      continue;
    }
    properties.set(property.name.getText(file), property.initializer);
  }
  for (const key of properties.keys()) {
    if (!SPEC_KEYS.has(key)) fail(`unknown spec key \`${key}\``);
  }
  const nameNode = properties.get("name");
  if (!nameNode || !ts.isStringLiteral(nameNode))
    fail("spec.name must be a string");
  else if (nameNode.text !== componentName)
    fail(
      `spec.name ${nameNode.text} does not match the export ${componentName}`,
    );

  const elements = properties.get("elements");
  if (!elements || !ts.isArrayLiteralExpression(elements)) {
    fail("spec.elements must be an array literal");
  } else {
    if (elements.elements.length === 0) fail("spec.elements is empty");
    for (const element of elements.elements)
      verifyNode(element, file, vocabulary, fail, stats);
  }

  const groups = properties.get("groups");
  if (groups) {
    if (!ts.isArrayLiteralExpression(groups))
      fail("spec.groups must be an array");
    else if (groups.elements.length < 2)
      fail("spec.groups is only needed for more than one control group");
    else stats.multiControl += 1;
  }
  if (properties.has("start") || properties.has("stop")) {
    if (!properties.has("start") || !properties.has("stop")) {
      fail("start and stop must be declared together");
    }
    stats.customChoreography += 1;
  } else {
    stats.defaultChoreography += 1;
  }

  const svg = properties.get("svg");
  if (svg) {
    if (!ts.isObjectLiteralExpression(svg)) fail("spec.svg must be an object");
    else {
      for (const property of svg.properties) {
        const key = property.name?.getText(file) ?? "";
        if (!vocabulary.reserved.has(key) && !ROOT_ONLY_KEYS.has(key)) {
          fail(`unknown root SVG key \`${key}\``);
        }
      }
    }
  }

  verifyMotionValues(file, fail, stats);
}

function verifyNode(node, file, vocabulary, fail, stats) {
  // The bare-string shorthand is a static `<path d="…"/>`.
  if (ts.isStringLiteral(node)) {
    stats.nodes += 1;
    return;
  }
  if (!ts.isObjectLiteralExpression(node)) {
    fail(
      `element must be a path string or an object, got \`${node.getText(file)}\``,
    );
    return;
  }
  stats.nodes += 1;
  const properties = new Map();
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !property.name) {
      fail("element properties must be plain assignments");
      continue;
    }
    properties.set(property.name.getText(file), property.initializer);
  }
  const tagNode = properties.get("tag");
  if (!tagNode || !ts.isStringLiteral(tagNode)) {
    fail("element `tag` must be a string literal");
    return;
  }
  const tag = tagNode.text;
  if (tag === "presence") {
    stats.presence += 1;
    for (const branch of ["active", "rest"]) {
      const list = properties.get(branch);
      if (!list || !ts.isArrayLiteralExpression(list)) {
        fail(`presence node needs an \`${branch}\` array`);
        continue;
      }
      for (const child of list.elements)
        verifyNode(child, file, vocabulary, fail, stats);
    }
    for (const key of properties.keys()) {
      if (!["tag", "active", "rest"].includes(key))
        fail(`unknown presence key \`${key}\``);
    }
    return;
  }
  if (!vocabulary.tags.has(tag)) fail(`unknown element tag \`${tag}\``);
  if (tag.startsWith("motion.")) stats.motionNodes += 1;

  for (const [key, value] of properties) {
    if (key === "children") {
      if (!ts.isArrayLiteralExpression(value)) {
        fail("`children` must be an array");
        continue;
      }
      for (const child of value.elements)
        verifyNode(child, file, vocabulary, fail, stats);
      continue;
    }
    if (vocabulary.reserved.has(key)) continue;
    // Anything not reserved is a static SVG attribute and must be a literal, so
    // a data module can never smuggle in a computed value.
    const literal =
      ts.isStringLiteral(value) ||
      ts.isNumericLiteral(value) ||
      (ts.isPrefixUnaryExpression(value) && ts.isNumericLiteral(value.operand));
    if (!literal) {
      fail(
        `static attribute \`${key}\` must be a literal, got \`${value.getText(file)}\``,
      );
    }
  }
}

/** Resolve a duration through the module's own numeric constants. */
function numericValue(node, constants) {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isParenthesizedExpression(node))
    return numericValue(node.expression, constants);
  if (ts.isIdentifier(node)) return constants.get(node.text);
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken
  ) {
    const operand = numericValue(node.operand, constants);
    return operand === undefined ? undefined : -operand;
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  const left = numericValue(node.left, constants);
  const right = numericValue(node.right, constants);
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

/** Motion timing archetypes, unchanged from the pre-factory corpus. */
function verifyMotionValues(file, fail, stats) {
  const constants = new Map();
  walk(file, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isNumericLiteral(node.initializer)
    ) {
      constants.set(node.name.text, Number(node.initializer.text));
    }
  });
  walk(file, (node) => {
    if (!ts.isPropertyAssignment(node) || !node.name) return;
    const name = node.name.getText(file);
    const value = node.initializer.getText(file);
    if (name === "repeat") {
      if (!ts.isNumericLiteral(node.initializer)) {
        fail(`repeat must be a finite numeric literal, got ${value}`);
      } else {
        stats.boundedRepeats += 1;
      }
    }
    if (name === "duration") {
      const duration = numericValue(node.initializer, constants);
      if (duration === undefined || !Number.isFinite(duration)) {
        // A duration may legitimately be a value bound inside an enclosing
        // variant resolver (e.g. a computed `delay`); those are opaque here.
        if (!/^[A-Za-z_$][\w$]*$/.test(value)) {
          fail(
            `duration must resolve from sanctioned numeric constants, got ${value}`,
          );
        }
        return;
      }
      stats.durations.push(duration);
      if (!SANCTIONED_DURATION_SECONDS.has(duration))
        fail(`unsanctioned Motion duration ${duration}s`);
    }
    if (name === "ease") {
      stats.easings.set(value, (stats.easings.get(value) ?? 0) + 1);
      if (!SANCTIONED_EASINGS.has(value))
        fail(`unsanctioned Motion easing ${value}`);
    }
    if (name === "type") {
      stats.transitionTypes.set(
        value,
        (stats.transitionTypes.get(value) ?? 0) + 1,
      );
      if (!SANCTIONED_TRANSITION_TYPES.has(value))
        fail(`unsanctioned Motion renderer type ${value}`);
    }
  });
}

function run({ sourceDir, manifestPath, factoryPath, wrapperPath }) {
  const failures = [];
  const stats = {
    nodes: 0,
    motionNodes: 0,
    presence: 0,
    multiControl: 0,
    customChoreography: 0,
    defaultChoreography: 0,
    boundedRepeats: 0,
    durations: [],
    easings: new Map(),
    transitionTypes: new Map(),
  };

  const factorySource = readFileSync(factoryPath, "utf8");
  verifyFactory(factorySource, failures);
  verifyWrapper(readFileSync(wrapperPath, "utf8"), failures);
  const vocabulary = readFactoryVocabulary(factorySource, failures);

  const manifest = verifyManifest(manifestPath, failures);
  const actualFiles = readdirSync(sourceDir)
    .filter((filename) => filename.endsWith(".tsx"))
    .sort();
  const expectedFiles = manifest.items.map((item) => `${item.name}.tsx`).sort();
  if (actualFiles.length !== EXPECTED_COUNT) {
    failures.push(
      `${sourceDir}: expected ${EXPECTED_COUNT} TSX files, found ${actualFiles.length}`,
    );
  }
  for (const filename of expectedFiles) {
    if (!actualFiles.includes(filename))
      failures.push(`${sourceDir}: missing ${filename}`);
  }
  for (const filename of actualFiles) {
    if (!expectedFiles.includes(filename))
      failures.push(`${sourceDir}: orphaned ${filename}`);
  }
  for (const item of manifest.items) {
    if (!actualFiles.includes(`${item.name}.tsx`)) continue;
    verifyIcon(item, sourceDir, vocabulary, stats, failures);
  }
  return { failures, stats, manifest };
}

/**
 * Prove the gate can fail. Every mutation below is a way the corpus could
 * silently regress; each must be rejected.
 */
function selfTest() {
  const mutations = [
    [
      "a hand-edited data module (controller re-introduced)",
      (dir) => {
        const path = join(dir, "icons", "bell.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8").replace(
            '"use client";',
            '"use client";\nimport { useAnimation } from "motion/react";',
          ),
        );
      },
    ],
    [
      "a hand-edited data module (JSX re-introduced)",
      (dir) => {
        const path = join(dir, "icons", "activity.tsx");
        writeFileSync(
          path,
          `${readFileSync(path, "utf8")}\nconst Extra = () => <svg />;\n`,
        );
      },
    ],
    [
      "a hand-edited data module (hardcoded colour)",
      (dir) => {
        const path = join(dir, "icons", "bell.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8").replace(
            "elements: [",
            'elements: [{ tag: "path", d: "M0 0", stroke: "#ff0000" },',
          ),
        );
      },
    ],
    [
      "a renamed public symbol",
      (dir) => {
        const path = join(dir, "icons", "activity.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8").replaceAll("ActivityIcon", "RenamedIcon"),
        );
      },
    ],
    ["a missing icon", (dir) => rmSync(join(dir, "icons", "airplay.tsx"))],
    [
      "an unsanctioned Motion duration",
      (dir) => {
        const path = join(dir, "icons", "bell.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8").replace("duration: 0.5", "duration: 42"),
        );
      },
    ],
    [
      "a dependency-less reduced-motion effect in the factory",
      (dir) => {
        const path = join(dir, "create-animated-icon.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8").replace(
            "}, [shouldReduceMotion, stopAnimation]);",
            "});",
          ),
        );
      },
    ],
    [
      "a factory that plays on touch hover",
      (dir) => {
        const path = join(dir, "create-animated-icon.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8").replace(
            'handlePointerEnter = (event: React.PointerEvent<HTMLSpanElement>) => {\n      onPointerEnter?.(event);\n      if (!isControlledRef.current && event.pointerType !== "touch")',
            "handlePointerEnter = (event: React.PointerEvent<HTMLSpanElement>) => {\n      onPointerEnter?.(event);\n      if (!isControlledRef.current)",
          ),
        );
      },
    ],
    [
      "a factory that auto-triggers while ref-controlled",
      (dir) => {
        const path = join(dir, "create-animated-icon.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8").replaceAll(
            "!isControlledRef.current && event.pointerType",
            "true && event.pointerType",
          ),
        );
      },
    ],
    [
      "a block-level host element",
      (dir) => {
        const path = join(dir, "create-animated-icon.tsx");
        writeFileSync(
          path,
          readFileSync(path, "utf8")
            .replaceAll("<span", "<div")
            .replaceAll("</span>", "</div>")
            .replace("inline-flex", "flex"),
        );
      },
    ],
  ];

  let passed = 0;
  for (const [label, mutate] of mutations) {
    const dir = mkdtempSync(join(tmpdir(), "animated-icons-selftest-"));
    try {
      cpSync(SOURCE_DIR, join(dir, "icons"), { recursive: true });
      cpSync(FACTORY_PATH, join(dir, "create-animated-icon.tsx"));
      cpSync(WRAPPER_PATH, join(dir, "animated-icon.tsx"));
      mutate(dir);
      const { failures } = run({
        sourceDir: join(dir, "icons"),
        manifestPath: MANIFEST_PATH,
        factoryPath: join(dir, "create-animated-icon.tsx"),
        wrapperPath: join(dir, "animated-icon.tsx"),
      });
      if (failures.length === 0) {
        console.error(`✗ self-test: ${label} was NOT rejected`);
        process.exit(1);
      }
      passed += 1;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  console.log(
    `✓ animated-icon verifier self-test: ${passed}/${mutations.length} mutations rejected`,
  );
}

if (process.argv.includes("--self-test")) {
  selfTest();
  process.exit(0);
}

const { failures, stats, manifest } = run({
  sourceDir: SOURCE_DIR,
  manifestPath: MANIFEST_PATH,
  factoryPath: FACTORY_PATH,
  wrapperPath: WRAPPER_PATH,
});

if (failures.length > 0) {
  console.error(`animated-icon verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const durationRange = stats.durations.length
  ? `${Math.min(...stats.durations)}s..${Math.max(...stats.durations)}s across ${stats.durations.length} declarations`
  : "none";
const top = (map) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, occurrences]) => `${value} (${occurrences})`)
    .join(", ");

console.log(
  `✓ animated icons: ${EXPECTED_COUNT}/${EXPECTED_COUNT} data modules verified`,
);
console.log(`  controller: 1 factory (${FACTORY_PATH})`);
console.log(
  `  choreography: ${stats.defaultChoreography} default play/rest, ${stats.customChoreography} custom, ${stats.multiControl} multi-control, ${stats.presence} presence`,
);
console.log(
  `  drawn nodes: ${stats.nodes} (${stats.motionNodes} Motion-driven)`,
);
console.log(`  bounded repeat declarations: ${stats.boundedRepeats}`);
console.log(`  Motion duration archetype: ${durationRange}`);
console.log(`  Motion easing archetypes: ${top(stats.easings)}`);
console.log(`  Motion renderer types: ${top(stats.transitionTypes)}`);
console.log(
  `  manifest: ${basename(MANIFEST_PATH)} (${manifest.items.length} URL/MIT/SHA-256 records)`,
);
