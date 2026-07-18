#!/usr/bin/env node
// Fail-closed WCAG contrast gate for the generated token theme. Runs AFTER `build-tokens.mjs`
// (reads packages/design-tokens/dist/theme.css) and asserts every canonical foreground/background token
// pair clears WCAG 2.1 AA. This is the compiled-CSS contrast gate the design contract requires —
// the unit a11y tests deliberately run without compiled CSS, so token contrast is gated HERE (and
// in CI via `pnpm build`) rather than left to a deferred VRT pass.
//
// Contrast is computed deterministically from the OKLCH token values (OKLCH → linear sRGB →
// relative luminance → WCAG ratio), which is stricter and faster than rendering.
import { readFileSync } from 'node:fs';

const AA_NORMAL = 4.5; // WCAG 2.1 AA, normal text
const THEME_CSS = process.argv[2] ?? 'packages/design-tokens/dist/theme.css';

// Canonical (background, foreground) token pairs every component relies on as a readable contract.
// FAIL-CLOSED: every listed token must exist in both themes — a missing token is itself a failure
// (the old `continue` guard let a typo'd pair silently pass; register P2-24).
const PAIRS = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['destructive', 'destructive-foreground'],
  ['success', 'success-foreground'],
  ['warning', 'warning-foreground'],
  ['info', 'info-foreground'],
  ['sidebar', 'sidebar-foreground'],
  ['sidebar-primary', 'sidebar-primary-foreground'],
  ['sidebar-accent', 'sidebar-accent-foreground'],
  // The secondary-text workhorse must read on the page surfaces it actually sits on (P2-25).
  ['background', 'muted-foreground'],
  ['card', 'muted-foreground'],
];

// muted-foreground-faint is DELIBERATELY sub-AA (placeholders/disabled only — design.md), but it
// still needs a legibility floor so a retune can never render placeholders invisible.
const FAINT_FLOOR = 2.5;

// Non-text UI parts (WCAG 1.4.11, >=3:1 against the page): the focus ring, the checked-control
// fill (`primary` carries switch/checkbox/radio/tab/slider selection), and the brand marker.
// NOT gated: `border` hairlines and the switch off-`track` — decorative separation / redundant
// affordances (thumb + layout identify the control), the documented industry-standard exemption.
const AA_NONTEXT = 3;
const NONTEXT = ['ring', 'primary', 'brand'];

function oklchToLinearSrgb(L, C, H) {
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
const relLum = ([r, g, b]) => 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
function contrast(fg, bg) {
  const a = relLum(oklchToLinearSrgb(...fg)) + 0.05;
  const b = relLum(oklchToLinearSrgb(...bg)) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

// Chromatic families that ship a flat `-subtle` tint + a page-readable `-text` token. Both are now
// real opaque tokens (no opacity compositing), so contrast is a direct OKLCH→WCAG ratio.
const SUBTLE_FAMILIES = ['purple', 'destructive', 'success', 'warning', 'info'];

function parseBlock(css, selector) {
  const re = new RegExp(selector.replace('.', '\\.') + '\\s*\\{([^}]*)\\}');
  const m = css.match(re);
  const out = {};
  if (m) {
    for (const mm of m[1].matchAll(/--([a-z0-9-]+):\s*oklch\(([^)]+)\)/g)) {
      const [L, C, H] = mm[2].trim().split(/\s+/).map(Number);
      out[mm[1]] = [L, C || 0, H || 0];
    }
  }
  return out;
}

// The alpha tokens (`--alpha-*: NN%`) drive translucent washes (T2). Parse them per theme so the
// composited checks below use the values that actually render (e.g. soft-hover is theme-split).
function parseAlphas(css, selector) {
  const re = new RegExp(selector.replace('.', '\\.') + '\\s*\\{([^}]*)\\}');
  const m = css.match(re);
  const out = {};
  if (m) {
    for (const mm of m[1].matchAll(/--((?:alpha|opacity)-[a-z0-9-]+):\s*([0-9.]+)%/g)) {
      out[mm[1]] = Number(mm[2]) / 100;
    }
  }
  return out;
}

// Alpha compositing the way the browser paints a `color-mix(in oklab, C p%, transparent)` wash
// over an opaque backdrop: blending happens in gamma-encoded sRGB. Returns the composite as
// LINEAR sRGB, ready for relative luminance.
const lin2gam = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(clamp(x), 1 / 2.4) - 0.055);
const gam2lin = (x) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
function compositeLinear(fgOklch, alpha, bgOklch) {
  const fg = oklchToLinearSrgb(...fgOklch).map(clamp).map(lin2gam);
  const bg = oklchToLinearSrgb(...bgOklch).map(clamp).map(lin2gam);
  return fg.map((c, i) => gam2lin(alpha * c + (1 - alpha) * bg[i]));
}
function contrastCompositeBg(fgOklch, compositeLin) {
  const a = relLum(oklchToLinearSrgb(...fgOklch)) + 0.05;
  const b = relLum(compositeLin) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

const css = readFileSync(THEME_CSS, 'utf8');
const light = parseBlock(css, ':root');
const darkRaw = parseBlock(css, '.dark');
// `.dark` carries only theme-VARYING overrides; theme-independent tokens (the chromatic fills +
// foregrounds + hover/active) inherit `:root` through the CSS cascade. Resolve dark the way the
// browser does so every pair is checked against the values that actually render.
const themes = { light, dark: { ...light, ...darkRaw } };
const lightAlphas = parseAlphas(css, ':root');
const darkAlphas = { ...lightAlphas, ...parseAlphas(css, '.dark') };
const themeAlphas = { light: lightAlphas, dark: darkAlphas };

let failures = 0;
let checked = 0;
const fail = (msg) => {
  failures++;
  console.error(`✗ ${msg} (WCAG AA needs ${AA_NORMAL}:1)`);
};
for (const [theme, vars] of Object.entries(themes)) {
  for (const [bg, fg] of PAIRS) {
    if (!vars[bg] || !vars[fg]) {
      fail(`${theme}: pair (${bg}, ${fg}) references a token that does not exist — fail-closed`);
      continue;
    }
    checked++;
    const ratio = contrast(vars[fg], vars[bg]);
    if (ratio < AA_NORMAL) fail(`${theme}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`);
  }
  // Placeholder floor — sub-AA by design, but never illegible.
  for (const surface of ['background', 'card']) {
    if (!vars['muted-foreground-faint'] || !vars[surface]) {
      fail(`${theme}: muted-foreground-faint/${surface} missing — fail-closed`);
      continue;
    }
    checked++;
    const ratio = contrast(vars['muted-foreground-faint'], vars[surface]);
    if (ratio < FAINT_FLOOR)
      fail(`${theme}: muted-foreground-faint on ${surface} = ${ratio.toFixed(2)}:1 (below the ${FAINT_FLOOR}:1 placeholder floor)`);
  }
  // Non-text UI parts (1.4.11).
  for (const part of NONTEXT) {
    if (!vars[part] || !vars.background) {
      fail(`${theme}: non-text token ${part} missing — fail-closed`);
      continue;
    }
    checked++;
    const ratio = contrast(vars[part], vars.background);
    if (ratio < AA_NONTEXT)
      fail(`${theme}: non-text ${part} on background = ${ratio.toFixed(2)}:1 (WCAG 1.4.11 needs ${AA_NONTEXT}:1)`);
  }
  // Chromatic -text coverage: it must read both as page text (on background/card) AND on its own
  // flat -subtle tint (the badge/alert pattern), in both themes.
  for (const family of SUBTLE_FAMILIES) {
    const text = vars[`${family}-text`];
    if (!text) continue;
    for (const surface of ['background', 'card', `${family}-subtle`, `${family}-subtle-hover`]) {
      if (!vars[surface]) continue;
      checked++;
      const ratio = contrast(text, vars[surface]);
      if (ratio < AA_NORMAL) fail(`${theme}: ${family}-text on ${surface} = ${ratio.toFixed(2)}:1`);
    }
  }
  // COMPOSITED pairs (T2/CX-7): the translucent washes must stay readable once composited over
  // the backdrop they actually render on — the outline-button family (`bg-<family>/(faint|subtle)`
  // over `background`), carrying `<family>-text`. (The soft-button hover is now a PRECOMPOSED
  // `<family>-subtle-hover` token, checked directly above.)
  const alphas = themeAlphas[theme];
  for (const family of SUBTLE_FAMILIES) {
    const text = vars[`${family}-text`];
    const fill = vars[family];
    if (!text || !fill) continue;
    const cases = [
      ['alpha-surface-faint', 'background', 'outline rest'],
      ['alpha-surface-subtle', 'background', 'outline hover'],
    ];
    for (const [alphaName, surface, label] of cases) {
      const a = alphas[alphaName];
      const bg = vars[surface];
      if (a == null || !bg) continue;
      checked++;
      const composite = compositeLinear(fill, a, bg);
      const ratio = contrastCompositeBg(text, composite);
      if (ratio < AA_NORMAL)
        fail(`${theme}: ${family}-text on ${family}@${Math.round(a * 100)}% over ${surface} (${label}) = ${ratio.toFixed(2)}:1`);
    }
  }
}

if (failures) {
  console.error(`\n✗ contrast-check: ${failures} token pair(s) fail WCAG AA`);
  process.exit(1);
}
console.log(
  `✓ contrast-check: all ${checked} token contrast checks pass — fg/bg pairs incl. muted-foreground (AA ${AA_NORMAL}:1), placeholder floor (${FAINT_FLOOR}:1), non-text ring/primary/brand (1.4.11 ${AA_NONTEXT}:1), chromatic -text on surfaces + composited washes, both themes, fail-closed on missing tokens`,
);
