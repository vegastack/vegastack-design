// Three Style Dictionary runs (LIGHT->:root, DARK->.dark, TS/JSON per theme) concatenated
// into one dist/theme.css, plus a non-colliding { light, dark } TS/JSON model.
import StyleDictionary from 'style-dictionary';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import './sd-hooks.mjs'; // registers the transforms + format above

// SD's DTCG color pipeline stringifies oklch() with zero-padded components ("0.5050 0.0030 75.00").
// Compact every oklch() in generated text back to canonical numbers so output stays byte-stable
// (and diffs read like the authored tokens).
const compactOklch = (text) =>
  text.replace(/oklch\(([^)]+)\)/g, (_, inner) => {
    const [nums, alpha] = inner.split('/');
    const compact = nums.trim().split(/\s+/).map(Number).join(' ');
    return alpha != null ? `oklch(${compact} / ${Number(alpha)})` : `oklch(${compact})`;
  });

mkdirSync('dist', { recursive: true });

const TRANSFORMS = [
  'attribute/cti',
  'name/kebab',
  'color/oklch',
  'dimension/css',
  'duration/css',
  'cubicBezier/css',
  'fontFamily/css',
  'shadow/css',
];

// 1. LIGHT -> :root (primitives included only to resolve aliases, filtered OUT of output)
await new StyleDictionary({
  preprocessors: ['derive-interaction-states'],
  source: ['tokens/primitives.tokens.json', 'tokens/semantic.tokens.json'],
  platforms: {
    css: {
      transforms: TRANSFORMS,
      buildPath: 'dist/',
      files: [
        {
          destination: '_root.css',
          format: 'css/variables',
          filter: (t) => t.filePath.includes('semantic.tokens') && (t.$type ?? t.type) !== 'typography',
          options: { selector: ':root', outputReferences: false },
        },
        {
          destination: '_inline.css',
          format: 'tailwind/inline-bridge',
          filter: (t) => t.filePath.includes('semantic.tokens'),
        },
      ],
    },
  },
}).buildAllPlatforms();

// 2. DARK -> .dark
await new StyleDictionary({
  preprocessors: ['derive-interaction-states'],
  source: ['tokens/primitives.tokens.json', 'tokens/semantic.dark.tokens.json'],
  platforms: {
    css: {
      transforms: TRANSFORMS,
      buildPath: 'dist/',
      files: [
        {
          destination: '_dark.css',
          format: 'css/variables',
          filter: (t) => t.filePath.includes('semantic.dark'),
          options: { selector: '.dark', outputReferences: false },
        },
      ],
    },
  },
}).buildAllPlatforms();

// 3. TS/JSON PER THEME — NEVER glob both light+dark into one dictionary (same names collide; Codex R2-F1).
async function flat(sources, needle, dest) {
  await new StyleDictionary({
    preprocessors: ['derive-interaction-states'],
    source: sources,
    platforms: {
      json: {
        transforms: TRANSFORMS,
        buildPath: 'dist/',
        files: [{ destination: dest, format: 'json/flat', filter: (t) => t.filePath.includes(needle) }],
      },
    },
  }).buildAllPlatforms();
  return JSON.parse(readFileSync(`dist/${dest}`, 'utf8'));
}
const light = await flat(['tokens/primitives.tokens.json', 'tokens/semantic.tokens.json'], 'semantic.tokens', '_light.json');
const dark = await flat(['tokens/primitives.tokens.json', 'tokens/semantic.dark.tokens.json'], 'semantic.dark', '_dark.json');

// build assertion: every dark key must have a light counterpart (catches drift/typos)
for (const k of Object.keys(dark)) if (!(k in light)) throw new Error(`dark token "${k}" has no light counterpart`);

// `semantic.dark.tokens.json` is a COLOR-ONLY override — radius/font/duration/motion-ease tokens are
// theme-invariant, so they only exist in the light source. Make the dark model SYMMETRIC by inheriting
// every non-overridden token from light (dark color overrides win). Otherwise `tokens.dark.radius`
// (a valid TokenName, since the type is the light keyset) would be `undefined` at runtime (Codex R2).
const darkModel = { ...light, ...dark };

// fail-closed: light and dark must now expose the SAME key set (the type is keyof light).
for (const k of Object.keys(light)) if (!(k in darkModel)) throw new Error(`light token "${k}" missing from dark model`);
for (const k of Object.keys(darkModel)) if (!(k in light)) throw new Error(`dark token "${k}" has no light counterpart`);

const model = { light, dark: darkModel }; // non-colliding namespaced model, symmetric key sets
writeFileSync('dist/tokens.json', compactOklch(JSON.stringify(model, null, 2)));
writeFileSync(
  'src/tokens.ts',
  `// AUTO-GENERATED — do not edit.\nexport const tokens = ${compactOklch(JSON.stringify(model, null, 2))} as const;\n` +
    `export type Theme = keyof typeof tokens;\nexport type TokenName = keyof (typeof tokens)['light'];\n`,
);

// 4. concat -> dist/theme.css + ship the opt-in reset
const parts = ['_root.css', '_dark.css', '_inline.css'].map((f) => compactOklch(readFileSync(`dist/${f}`, 'utf8')));
writeFileSync('dist/theme.css', `@custom-variant dark (&:where(.dark, .dark *));\n\n${parts.join('\n')}`);
writeFileSync('dist/base.css', readFileSync('src/base.css', 'utf8')); // Codex F3: base.css is real + exported
writeFileSync('dist/utilities.css', readFileSync('src/utilities.css', 'utf8')); // shared @utility helpers (shimmer / scroll-fade / scrollbar)
['_root.css', '_dark.css', '_inline.css', '_light.json', '_dark.json'].forEach((f) => rmSync(`dist/${f}`));

console.log('tokens built: dist/theme.css, dist/base.css, dist/tokens.json, src/tokens.ts');
