#!/usr/bin/env node
// generate-email-tokens — writes the email kit's colour module from the design tokens.
//
// Email clients cannot read CSS custom properties or OKLCH, so the `email-kit` block carries its
// colours as sRGB hex. They are never typed by hand: this script resolves the DTCG sources in
// `packages/design-tokens/tokens/` (light = semantic.tokens.json, dark = semantic.dark.tokens.json,
// both referencing primitives.tokens.json), converts OKLCH → sRGB hex, composites translucent
// tokens over the surface they sit on, and writes
// `packages/ui/registry/blocks/email-kit/email-tokens.ts` (marked GENERATED). That file is the ONE
// entry on design-lint's `HEX_COLOR_FILE_ALLOWLIST` for registry source, and the only registry file
// allowed a raw `!important` (the dark-mode overrides must beat inline styles).
//
// Two email-specific adjustments, both deterministic and documented in the output:
//   - Pure #ffffff / #000000 are nudged one step (#fffffe / #010101): Gmail's forced dark-mode
//     inversion treats exact white and black specially, and a near-value keeps the design intact.
//   - Every text/background pair the templates paint is contrast-checked here (WCAG AA 4.5:1) in
//     both modes, so a token change that would make an email unreadable fails generation.
//
// Usage:
//   node tooling/generate-email-tokens.mjs           # write the file
//   node tooling/generate-email-tokens.mjs --check   # fail if the committed file is stale (design:verify)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import prettier from "prettier";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyProvenanceHeader,
  readProvenanceHeader,
  stripProvenanceHeader,
} from "./registry-hash.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TOKENS = join(ROOT, "packages/design-tokens/tokens");
export const OUTPUT = join(
  ROOT,
  "packages/ui/registry/blocks/email-kit/email-tokens.ts",
);

// ── colour maths (OKLab → linear sRGB is the same matrix contrast-check.mjs uses) ───────────────
function oklchToLinearSrgb([L, C, H]) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const clamp = (x) => Math.max(0, Math.min(1, x));
const lin2gam = (x) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(clamp(x), 1 / 2.4) - 0.055;
const gam2lin = (x) =>
  x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);

/** OKLCH (+ alpha) → gamma-encoded sRGB channels 0..255, alpha-composited over `under`. */
function toRgb(color, under) {
  const rgb = oklchToLinearSrgb(color.components).map(clamp).map(lin2gam);
  const alpha = color.alpha ?? 1;
  if (alpha >= 1) return rgb.map((c) => Math.round(c * 255));
  if (!under)
    throw new Error("a translucent token needs a surface to composite over");
  return rgb.map((c, i) =>
    Math.round((alpha * c + (1 - alpha) * (under[i] / 255)) * 255),
  );
}
const hex = (rgb) =>
  `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
const fromHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const luminance = (h) => {
  const [r, g, b] = fromHex(h).map((c) => gam2lin(c / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(a, b) {
  const [x, y] = [luminance(a) + 0.05, luminance(b) + 0.05];
  return Math.max(x, y) / Math.min(x, y);
}
/** Gmail's forced inversion special-cases exact white and black; keep one step off both. */
const nudge = (h) =>
  h === "#ffffff" ? "#fffffe" : h === "#000000" ? "#010101" : h;

// ── DTCG resolution ─────────────────────────────────────────────────────────────────────────────
const read = (name) => JSON.parse(readFileSync(join(TOKENS, name), "utf8"));

function lookup(tree, path) {
  return path.split(".").reduce((node, key) => node?.[key], tree);
}

function resolver(primitives, semantic, fallback) {
  const resolve = (name, seen = new Set()) => {
    if (seen.has(name)) throw new Error(`token cycle at ${name}`);
    seen.add(name);
    const token = semantic[name] ?? fallback?.[name];
    if (!token) throw new Error(`unknown semantic token ${name}`);
    return value(token.$value, seen, name);
  };
  const value = (v, seen, name) => {
    if (typeof v === "string") {
      const ref = /^\{(.+)\}$/.exec(v);
      if (!ref) throw new Error(`${name}: unsupported value ${v}`);
      const target = lookup(primitives, ref[1]);
      if (target?.$value !== undefined) return value(target.$value, seen, name);
      return resolve(ref[1], seen);
    }
    if (v?.colorSpace !== "oklch")
      throw new Error(`${name}: expected an OKLCH colour`);
    return v;
  };
  return resolve;
}

// Each email role, the semantic token it comes from, and what it sits on (for translucent tokens).
// The light canvas is `neutral.50` rather than `muted`: footer copy (`muted-foreground`) sits on
// the canvas and measures 4.35:1 on `muted`, under AA.
const ROLES = {
  light: {
    canvas: { primitive: "color.neutral.50" },
    surface: { token: "card" },
    text: { token: "card-foreground" },
    muted: { token: "muted-foreground" },
    border: { token: "border", over: "surface" },
    buttonBg: { token: "primary" },
    buttonText: { token: "primary-foreground" },
    quoteBg: { token: "muted" },
    quoteBar: { token: "input", over: "quoteBg" },
  },
  dark: {
    canvas: { token: "background" },
    surface: { token: "card" },
    text: { token: "card-foreground" },
    muted: { token: "muted-foreground" },
    border: { token: "border", over: "surface" },
    buttonBg: { token: "primary" },
    buttonText: { token: "primary-foreground" },
    quoteBg: { token: "muted" },
    quoteBar: { token: "input", over: "quoteBg" },
  },
};

// Every text-on-background pair a template paints. AA for normal text in both modes.
const PAIRS = [
  ["text", "surface"],
  ["muted", "surface"],
  ["text", "canvas"],
  ["muted", "canvas"],
  ["buttonText", "buttonBg"],
  ["text", "quoteBg"],
  ["muted", "quoteBg"],
];
const AA = 4.5;

export function buildPalette() {
  const primitives = read("primitives.tokens.json");
  const light = read("semantic.tokens.json");
  const dark = read("semantic.dark.tokens.json");
  const out = {};
  for (const mode of ["light", "dark"]) {
    const resolve =
      mode === "light"
        ? resolver(primitives, light)
        : resolver(primitives, dark, light);
    const palette = {};
    const pending = Object.entries(ROLES[mode]);
    // Opaque roles first, so a translucent one can composite over its surface.
    pending.sort(
      ([, a], [, b]) => Number(Boolean(a.over)) - Number(Boolean(b.over)),
    );
    for (const [role, spec] of pending) {
      const color = spec.primitive
        ? lookup(primitives, spec.primitive).$value
        : resolve(spec.token);
      const under = spec.over ? fromHex(palette[spec.over]) : undefined;
      palette[role] = nudge(hex(toRgb(color, under)));
    }
    out[mode] = Object.fromEntries(
      Object.keys(ROLES[mode]).map((role) => [role, palette[role]]),
    );
  }
  const failures = [];
  for (const mode of ["light", "dark"])
    for (const [fg, bg] of PAIRS) {
      const ratio = contrast(out[mode][fg], out[mode][bg]);
      if (ratio < AA)
        failures.push(
          `${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1 (< ${AA})`,
        );
    }
  if (failures.length)
    throw new Error(`email palette fails AA:\n  ${failures.join("\n  ")}`);
  return out;
}

// Class hooks the templates put on elements. The dark rules beat the inline light styles, so each
// carries `!important` — written with a space before it, which classic Outlook requires.
const HOOKS = {
  canvas: [
    ["background-color", "canvas"],
    ["color", "text"],
  ],
  surface: [["background-color", "surface"]],
  text: [["color", "text"]],
  muted: [["color", "muted"]],
  border: [["border-color", "border"]],
  quote: [["background-color", "quoteBg"]],
  "quote-bar": [["border-color", "quoteBar"]],
  rule: [["border-top-color", "border"]],
  button: [
    ["background-color", "buttonBg"],
    ["border-color", "buttonBg"],
    ["color", "buttonText"],
  ],
};

function rules(dark, prefix) {
  return Object.entries(HOOKS)
    .map(
      ([cls, declarations]) =>
        `${prefix}.vs-${cls}{${declarations
          .map(([prop, role]) => `${prop}:${dark[role]} !important`)
          .join(";")}}`,
    )
    .join("");
}

/** The `prefers-color-scheme` block: Apple Mail, iOS Mail, Outlook on Mac. Gmail ignores it and inverts on its own. */
const darkCss = (dark) =>
  `@media (prefers-color-scheme:dark){${rules(dark, "")}}`;

/**
 * Outlook.com and the new Outlook recolour an email themselves and mark each element they changed
 * with `data-ogsc` (its text colour) or `data-ogsb` (its background), on that element itself. The
 * canvas carries both an inline colour and a background, so it is marked with both: it matches the
 * compound form, and every hook below it matches
 * either prefix — the whole palette, text and fill together, so a recoloured fill never meets the
 * light ink. Its own `<style>` element: a client that cannot parse an attribute selector may drop
 * the block it sits in, and the media block must survive that.
 */
const outlookCss = (dark) => {
  // The canvas is itself the marked element, so it needs the compound form too.
  const canvas = HOOKS.canvas
    .map(([prop, role]) => `${prop}:${dark[role]} !important`)
    .join(";");
  return (
    `.vs-canvas[data-ogsc],.vs-canvas[data-ogsb]{${canvas}}` +
    rules(dark, "[data-ogsc] ") +
    rules(dark, "[data-ogsb] ")
  );
};

const MOBILE_CSS =
  "@media only screen and (max-width:599px){.vs-gutter{padding-left:16px !important;padding-right:16px !important}.vs-pad{padding-left:20px !important;padding-right:20px !important}.vs-button{display:block !important}}";

export async function render() {
  const palette = buildPalette();
  const json = (v) =>
    JSON.stringify(v, null, 2).replace(/"([a-zA-Z]+)":/g, "$1:");
  const source = `/**
 * GENERATED by \`tooling/generate-email-tokens.mjs\` from \`packages/design-tokens/tokens/*.json\`.
 * Do not edit: change the tokens (or the generator's role map) and run
 * \`node tooling/generate-email-tokens.mjs\`. \`design:verify\` fails when this file is stale.
 *
 * The email kit's colours as sRGB hex — email clients read neither CSS variables nor OKLCH. Pure
 * white and black are nudged one step (#fffffe / #010101) so Gmail's forced dark inversion leaves
 * them alone, and every text/background pair below is AA (4.5:1) in both modes.
 */

/** One mode's email palette. */
export interface EmailPalette {
  /** The page behind the card. */
  canvas: string;
  /** The card the message sits on. */
  surface: string;
  /** Headings and body copy. */
  text: string;
  /** Secondary copy: meta, times, the footer. */
  muted: string;
  /** Card and divider hairlines. */
  border: string;
  /** The button fill. */
  buttonBg: string;
  /** The button label. */
  buttonText: string;
  /** A quoted comment's background. */
  quoteBg: string;
  /** A quoted comment's leading bar. */
  quoteBar: string;
}

/** Light and dark palettes, resolved from the design tokens. */
export const emailColors: { light: EmailPalette; dark: EmailPalette } = ${json(palette)};

/** The system font stack — web fonts do not load in Gmail or Outlook. */
export const emailFontFamily =
  ${JSON.stringify("-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif")};

/**
 * The dark-mode and phone-width \`<style>\` block: \`prefers-color-scheme\` for the clients that
 * honour it, and tighter gutters with a full-width button under 600px. Elements opt in with the
 * \`vs-*\` class hooks.
 */
export const emailCss =
  ${JSON.stringify(darkCss(palette.dark) + MOBILE_CSS)};

/**
 * The Outlook.com and new Outlook dark-mode block (\`[data-ogsc]\` / \`[data-ogsb]\`), in its own
 * \`<style>\` so a client that rejects attribute selectors cannot take the media block down with it.
 */
export const emailOutlookCss =
  ${JSON.stringify(outlookCss(palette.dark))};
`;
  // Formatted exactly as \`prettier --check\` expects, so the lint chain and this check agree.
  const options = (await prettier.resolveConfig(OUTPUT)) ?? {};
  return prettier.format(source, { ...options, filepath: OUTPUT });
}

async function main() {
  const check = process.argv.includes("--check");
  const body = await render();
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : null;
  if (check) {
    if (current === null || stripProvenanceHeader(current) !== body) {
      console.error(
        "✗ email-tokens.ts is stale or hand-edited — run `node tooling/generate-email-tokens.mjs` and `pnpm registry:build`",
      );
      process.exit(1);
    }
    console.log("✓ email-tokens.ts matches the design tokens");
    return;
  }
  const header = current ? readProvenanceHeader(current) : null;
  const next = header
    ? applyProvenanceHeader(body, header.name, header.version, header.integrity)
    : body;
  if (next !== current) writeFileSync(OUTPUT, next);
  console.log(`✓ wrote ${OUTPUT.slice(ROOT.length + 1)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
