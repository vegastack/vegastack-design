// Style Dictionary resolves LIGHT once and DARK once, into `:root` and `.dark`. The third scope
// this file used to emit, `.vs-marketing`, is gone with the marketing layer (shadcn reset,
// mandate § 1 non-negotiable 5).
import StyleDictionary from "style-dictionary";
import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import "./sd-hooks.mjs"; // registers the transforms + format above
import {
  DARK_SOURCES,
  LIGHT_SOURCES,
  cssPlatform,
  flatJsonPlatform,
  isCssSemantic,
  isDarkSemantic,
  isLightSemantic,
  tokenConfig,
} from "./sd.config.mjs";
import { verifyThemeParity } from "../../tooling/verify-theme-parity.mjs";

// SD's DTCG color pipeline stringifies oklch() with zero-padded components ("0.5050 0.0030 75.00").
// Compact every oklch() in generated text back to canonical numbers so output stays byte-stable
// (and diffs read like the authored tokens).
const compactOklch = (text) =>
  text.replace(/oklch\(([^)]+)\)/g, (_, inner) => {
    const [nums, alpha] = inner.split("/");
    const compact = nums.trim().split(/\s+/).map(Number).join(" ");
    return alpha != null
      ? `oklch(${compact} / ${Number(alpha)})`
      : `oklch(${compact})`;
  });

// This script owns the complete package build surface. Clean before Style Dictionary writes so the
// later TypeScript bundle can add its artifacts without deleting theme.css/base.css/tokens.json.
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

// 1. LIGHT -> :root (primitives included only to resolve aliases, filtered OUT of output)
await new StyleDictionary(
  tokenConfig(LIGHT_SOURCES, {
    name: "css",
    config: cssPlatform([
      {
        destination: "_root.css",
        format: "css/variables",
        filter: isCssSemantic,
        options: { selector: ":root", outputReferences: false },
      },
      {
        destination: "_inline.css",
        format: "tailwind/inline-bridge",
        filter: isLightSemantic,
      },
    ]),
  }),
).buildAllPlatforms();

// 2. DARK -> .dark
await new StyleDictionary(
  tokenConfig(DARK_SOURCES, {
    name: "css",
    config: cssPlatform([
      {
        destination: "_dark.css",
        format: "css/variables",
        filter: isDarkSemantic,
        options: { selector: ".dark", outputReferences: false },
      },
    ]),
  }),
).buildAllPlatforms();

// 3. TS/JSON PER THEME — NEVER glob both light+dark into one dictionary (same names collide; Codex R2-F1).
async function flat(sources, needle, dest) {
  await new StyleDictionary(
    tokenConfig(
      sources,
      flatJsonPlatform(dest, (t) => t.filePath.includes(needle)),
    ),
  ).buildAllPlatforms();
  return JSON.parse(readFileSync(`dist/${dest}`, "utf8"));
}
const light = await flat(LIGHT_SOURCES, "semantic.tokens", "_light.json");
const dark = await flat(DARK_SOURCES, "semantic.dark", "_dark.json");

// build assertion: every dark key must have a light counterpart (catches drift/typos)
for (const k of Object.keys(dark))
  if (!(k in light))
    throw new Error(`dark token "${k}" has no light counterpart`);

// `semantic.dark.tokens.json` is a COLOR-ONLY override — radius/font/duration/motion-ease tokens are
// theme-invariant, so they only exist in the light source. Make the dark model SYMMETRIC by inheriting
// every non-overridden token from light (dark color overrides win). Otherwise `tokens.dark.radius`
// (a valid TokenName, since the type is the light keyset) would be `undefined` at runtime (Codex R2).
const darkModel = { ...light, ...dark };

// fail-closed: light and dark must now expose the SAME key set (the type is keyof light).
for (const k of Object.keys(light))
  if (!(k in darkModel))
    throw new Error(`light token "${k}" missing from dark model`);
for (const k of Object.keys(darkModel))
  if (!(k in light))
    throw new Error(`dark token "${k}" has no light counterpart`);

const model = { light, dark: darkModel }; // non-colliding namespaced model, symmetric key sets
writeFileSync("dist/tokens.json", compactOklch(JSON.stringify(model, null, 2)));
writeFileSync(
  "src/tokens.ts",
  `// AUTO-GENERATED — do not edit.\nexport const tokens = ${compactOklch(JSON.stringify(model, null, 2))} as const;\n` +
    `export type Theme = keyof typeof tokens;\nexport type TokenName = keyof (typeof tokens)['light'];\n`,
);

// 4. Add native-control schemes (COL-22), then verify light/dark shape before public output.
function themePart(file, selector, colorScheme) {
  const css = compactOklch(readFileSync(`dist/${file}`, "utf8"));
  const marker = `${selector} {`;
  if (css.split(marker).length !== 2)
    throw new Error(`${file}: expected exactly one ${selector} block`);
  return css.replace(marker, `${marker}\n  color-scheme: ${colorScheme};`);
}

// The `dark` variant is UPSTREAM'S, character for character: `@custom-variant dark (&:is(.dark *))`
// is what `shadcn init` writes into a consumer's `globals.css`, and the `:is()` is load-bearing.
// This file used to emit `(&:where(.dark, .dark *))`, and `:where()` contributes ZERO specificity:
// `.dark\:bg-input\/30:where(.dark, .dark *)` is (0,1,0) where upstream's `:is(.dark *)` is (0,2,0).
// Measured in Batch 5's review artifact on upstream's own outline Button: the rule it ties with,
// `.aria-expanded\:bg-muted[aria-expanded="true"]`, is (0,2,0), so upstream resolves the tie on
// source order and paints `bg-input/30`, while this system silently painted `bg-muted` — an open
// popover trigger, an expanded collapsible, a menubar trigger, every `aria-expanded` control in
// dark mode. The `:where()` form also matches the `.dark` ELEMENT itself, which upstream's does
// not; nothing here puts a `dark:` utility on `<html>`, which is the only element that loses.
// Print is paper: a page printed from dark mode prints in the LIGHT palette. Browsers drop
// backgrounds when printing but keep text colours, so dark-mode ink (near-white) would land on
// white paper. The block restates the light values under `.dark` inside `@media print`, generated
// from the same `:root` block, so it can never drift from it; it is indented, so the shape gate
// (`verify-theme-parity`, which reads top-level blocks) still sees exactly one of each scope.
function printLight(rootCss) {
  const open = rootCss.indexOf(":root {");
  const body = rootCss.slice(
    rootCss.indexOf("{", open) + 1,
    rootCss.lastIndexOf("}"),
  );
  const declarations = body
    .split("\n")
    .filter((line) => /^\s*(color-scheme|--[a-z0-9-]+)\s*:/.test(line))
    .map(
      (line) => `    ${line.trim().replace(/\s*\/\*\*[\s\S]*?\*\/\s*$/, "")}`,
    )
    .join("\n");
  return `@media print {\n  .dark {\n${declarations}\n  }\n}\n`;
}
const rootPart = themePart("_root.css", ":root", "light");
const themeCss =
  `@custom-variant dark (&:is(.dark *));\n\n` +
  [
    rootPart,
    themePart("_dark.css", ".dark", "dark"),
    printLight(rootPart),
    compactOklch(readFileSync("dist/_inline.css", "utf8")),
  ].join("\n");
verifyThemeParity(themeCss, { source: "generated dist/theme.css" });
writeFileSync("dist/theme.css", themeCss);
writeFileSync("dist/base.css", readFileSync("src/base.css", "utf8")); // Codex F3: base.css is real + exported
writeFileSync("dist/utilities.css", readFileSync("src/utilities.css", "utf8")); // shared @utility helpers (shimmer / scroll-fade / scrollbar)
["_root.css", "_dark.css", "_inline.css", "_light.json", "_dark.json"].forEach(
  (f) => rmSync(`dist/${f}`),
);

// 5. BRD-12 (amended 2026-11-18): the corner roles for every platform, from one source. Web reads
// the CSS variables; the desktop app reads `corner-*` from this package; the Flutter app pulls
// dist/corners.dart (scripts/pull-design-corners.sh in the mobile repo). A capsule is 999 (any
// control is fully round at it) and a tile is a fraction of its size.
const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const platforms = JSON.parse(
  readFileSync("tokens/corner-platforms.json", "utf8"),
);
const CAPSULE = 999;
const cornerValue = (raw) => {
  if (raw === "9999px") return CAPSULE;
  const rem = /^([\d.]+)rem$/.exec(raw);
  if (rem) return Number(rem[1]) * 16;
  const px = /^([\d.]+)px$/.exec(raw);
  if (px) return Number(px[1]);
  const pct = /^([\d.]+)%$/.exec(raw);
  if (pct) return Number(pct[1]) / 100;
  throw new Error(`corner value not understood: ${raw}`);
};
const base = Object.fromEntries(
  Object.entries(light)
    .filter(([k]) => k.startsWith("corner-"))
    .map(([k, v]) => [k.slice("corner-".length), cornerValue(v)]),
);
const resolveRole = (table, value) =>
  typeof value === "number"
    ? value
    : value === "capsule"
      ? CAPSULE
      : table[value];
const corners = {};
for (const platform of ["pointer", "touch"]) {
  const table = { ...base };
  for (const [role, value] of Object.entries(platforms[platform])) {
    const resolved = resolveRole(table, value);
    if (typeof resolved !== "number")
      throw new Error(`corner ${platform}.${role}: ${value}`);
    table[role] = resolved;
  }
  corners[platform] = table;
}
writeFileSync(
  "dist/corners.json",
  JSON.stringify(
    { version: pkgVersion, capsule: CAPSULE, ...corners },
    null,
    2,
  ) + "\n",
);
const camel = (role) => role.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const dartTable = (name, table) =>
  `abstract final class ${name} {\n` +
  Object.entries(table)
    .map(([role, value]) =>
      role === "tile"
        ? `  /// A square tile is rounded at this fraction of its size.\n  static const double tileFraction = ${value};`
        : `  static const double ${camel(role)} = ${Number.isInteger(value) ? value.toFixed(1) : value};`,
    )
    .join("\n") +
  `\n}\n`;
writeFileSync(
  "dist/corners.dart",
  `// GENERATED from @vegastack/design-tokens ${pkgVersion} (BRD-12) — do not edit.\n` +
    `// Pull a release with scripts/pull-design-corners.sh; change a value in the design system.\n\n` +
    `/// The corner roles on a touch platform, in logical pixels. A capsule is ${CAPSULE}.\n` +
    dartTable("DesignCorners", corners.touch),
);

console.log(
  "tokens built: dist/theme.css, dist/base.css, dist/tokens.json, dist/corners.json, dist/corners.dart, src/tokens.ts",
);
