// Style Dictionary resolves LIGHT once and DARK once. The same resolved DARK dictionary emits
// both `.dark` and `.vs-marketing`, then the generated scopes are parity-checked before write.
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

// 2. DARK -> .dark AND .vs-marketing. Both files are formatted from one resolved dictionary.
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
      {
        destination: "_marketing.css",
        format: "css/variables",
        filter: isDarkSemantic,
        options: { selector: ".vs-marketing", outputReferences: false },
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

// 4. Add native-control schemes, then verify exact dark/marketing parity before public output.
function themePart(file, selector, colorScheme) {
  const css = compactOklch(readFileSync(`dist/${file}`, "utf8"));
  const marker = `${selector} {`;
  if (css.split(marker).length !== 2)
    throw new Error(`${file}: expected exactly one ${selector} block`);
  return css.replace(marker, `${marker}\n  color-scheme: ${colorScheme};`);
}

const themeCss =
  `@custom-variant dark (&:where(.dark, .dark *));\n\n` +
  [
    themePart("_root.css", ":root", "light"),
    themePart("_dark.css", ".dark", "dark"),
    themePart("_marketing.css", ".vs-marketing", "dark"),
    compactOklch(readFileSync("dist/_inline.css", "utf8")),
  ].join("\n");
verifyThemeParity(themeCss, { source: "generated dist/theme.css" });
writeFileSync("dist/theme.css", themeCss);
writeFileSync("dist/base.css", readFileSync("src/base.css", "utf8")); // Codex F3: base.css is real + exported
writeFileSync("dist/utilities.css", readFileSync("src/utilities.css", "utf8")); // shared @utility helpers (shimmer / scroll-fade / scrollbar)
[
  "_root.css",
  "_dark.css",
  "_marketing.css",
  "_inline.css",
  "_light.json",
  "_dark.json",
].forEach((f) => rmSync(`dist/${f}`));

console.log(
  "tokens built: dist/theme.css, dist/base.css, dist/tokens.json, src/tokens.ts",
);
