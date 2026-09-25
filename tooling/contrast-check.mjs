#!/usr/bin/env node
// Fail-closed WCAG contrast gate for the generated token theme (A11Y-1).
//
//   node tooling/contrast-check.mjs [theme.css]
//   node tooling/contrast-check.mjs --self-test
//
// Runs AFTER `build-tokens.mjs` and asserts that every canonical foreground/background token pair
// clears WCAG 2.2 AA in BOTH themes. This is the compiled-CSS contrast gate the design contract
// requires — the unit a11y tests deliberately run without compiled CSS, so token contrast is gated
// HERE (and in CI via `pnpm build`) rather than left to a deferred VRT pass.
//
// REBUILT BY THE SHADCN RESET (Batch 1, 2026-09-18)
//   The old gate measured a token set that no longer exists: a three-rung surface ladder, a
//   22-entry alpha ladder, `<family>-subtle`/`-text`/`-border` for four chromatic families, and a
//   `brand` wash composited at three named alphas. All of it is gone. What is checked now is the
//   token contract this system actually ships:
//     * the neutral core's foreground/background pairs, including secondary ink on every neutral
//       surface a component can be mounted on;
//     * the four status families, which are written in shadcn's `destructive` shape — one fill, one
//       on-fill foreground — as page text AND as a fill under that foreground;
//     * the focus ring and the checked-control fill as non-text graphics (1.4.11);
//     * the 8 categorical chart hues and the 10-hue tag palette;
//     * the brand pair and the theme-invariant media chrome.
//
// WHAT THIS GATE DOES NOT CLAIM, stated so the absence is a decision rather than an oversight.
//   It gates the TOKEN CONTRACT, not every composition a component can build from it. Upstream's
//   soft status pattern — `bg-destructive/10 text-destructive` on the destructive Button, and the
//   same shape on Alert and Field — composites to 3.99:1 in light with shadcn's own red, below the
//   AA text floor. COL-13 and COL-17 are both decided as **shadcn**, so that composition ships as
//   upstream wrote it; it is named in the Batch 1 report rather than silently gated away, and no
//   VegaStack token can be retuned to fix it because `destructive` is adopted verbatim.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const AA_NORMAL = 4.5; // WCAG 2.2 AA, normal text
const AA_NONTEXT = 3; // WCAG 1.4.11, non-text UI parts

// Every neutral surface a control or a piece of copy can be mounted on. `muted`, `accent` and
// `secondary` share one value in shadcn's neutral base, and they are all listed anyway: the gate
// must keep holding if a consumer retunes one of them away from the others.
const NEUTRAL_SURFACES = [
  "background",
  "card",
  "popover",
  "muted",
  "accent",
  "secondary",
  "sidebar",
];

// Canonical (background, foreground) pairs. FAIL-CLOSED: every listed token must exist in both
// themes — a missing token is itself a failure.
const PAIRS = [
  ["background", "foreground"],
  ["card", "card-foreground"],
  ["popover", "popover-foreground"],
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["muted", "muted-foreground"],
  ["accent", "accent-foreground"],
  ["sidebar", "sidebar-foreground"],
  ["sidebar-primary", "sidebar-primary-foreground"],
  ["sidebar-accent", "sidebar-accent-foreground"],
];

// The secondary-text workhorse carries real copy on every neutral surface, not just its own.
// `muted-foreground` on `muted` is why this repository darkens shadcn's `0.556` to neutral-500
// (`0.539`): upstream's value measures 4.34:1 there, under the AA floor this gate enforces.
const SECONDARY_INK_SURFACES = NEUTRAL_SURFACES;

// The four status families (COL-12). Each is one fill plus one on-fill foreground, exactly the
// shape shadcn gives `destructive`. The fill doubles as page text (`text-destructive` in upstream's
// Field and Alert), so it takes the AA text floor on the page surfaces, and the foreground takes it
// on the fill.
const STATUS_FAMILIES = ["destructive", "success", "warning", "info"];
const STATUS_TEXT_SURFACES = ["background", "card", "popover"];
// The tint alphas a status surface is actually painted at: `bg-<family>/10` at rest, `/20` on
// hover, `/30` pressed — upstream's own vocabulary, and what Alert, Badge, Toast and the soft
// Button wear. It is also the HOVER of every non-primary button inside a status Alert (API-29,
// 2026-09-25): `<family>-text` on `<family>/10` over `card`, gated here in light and dark. The ink on them is `<family>-text`, never the fill: the fill measured 3.98-4.35:1 on
// its own tint in the rendered axe lane (2026-09-18), which is why the `-text` role exists.
const STATUS_TINT_ALPHAS = [0.1, 0.2, 0.3];

// Non-text UI parts (1.4.11): the focus ring (FOC-1/FOC-2 make it the ONLY focus affordance in the
// system) and `primary`, which carries switch/checkbox/radio/tab/slider selection.
const NONTEXT = ["ring", "primary"];
// FOC-3: text entry tints its BORDER with the ring at 70% rather than painting the outline, because
// a raw text field cannot tell a mouse click from a Tab. FOC-10 gates that composite.
const FOCUS_TINT_ALPHA = 0.7;

// Markers only ever sit on resting surfaces — nobody draws a chart or a status dot on a hovered row.
const MARKERS = ["brand", "chart-single"];
const MARKER_SURFACES = ["background", "card", "popover", "muted", "sidebar"];

// `brand` is a MARKER value: the cta Button painted its label in `text-brand` over its own wash and
// measured 3.41:1 in light, a live WCAG 1.4.3 failure on the public docs site (audit 2026-09-09,
// HIGH-2). Brand TEXT reads through `brand-text`, which takes the AA floor on every neutral surface.
const BRAND_TEXT_SURFACES = NEUTRAL_SURFACES;

// Charts and tags are categorical colour, not status or action colour. Their strokes, dots and
// swatches still communicate data, so every palette member must clear the non-text floor on the
// neutral surfaces ChartContainer and Card actually use. This does not claim pairwise hue
// distinguishability: charts retain labels, legends and `accessibilityLayer` as the non-colour cue
// 1.4.1 requires.
const CHART_TOKENS = Array.from({ length: 8 }, (_, i) => `chart-${i + 1}`);
const CATEGORICAL_SURFACES = ["background", "card", "muted"];
const TAG_HUES = [
  "blue",
  "cyan",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
  "pink",
  "magenta",
  "purple",
];

// Theme-invariant media chrome: the off-white ink over the two scrims, measured against the WORST
// backdrop a scrim can sit on (the light page — a scrim over a bright frame is the weakest case;
// over dark video it only improves). BOTH scrims are gated at AA TEXT, because `media-foreground`
// is documented as the ink for "every icon, LABEL and track", so the soft scrim carries text in
// practice (a timestamp or title over a video's gradient).
const MEDIA_CASES = [
  ["media-scrim-strong", AA_NORMAL, "pill text"],
  ["media-scrim", AA_NORMAL, "overlay icons AND labels"],
];

// ── colour maths ────────────────────────────────────────────────────────────────────────────────

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
const relLum = ([r, g, b]) =>
  0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
function contrast(fg, bg) {
  const a = relLum(oklchToLinearSrgb(...fg)) + 0.05;
  const b = relLum(oklchToLinearSrgb(...bg)) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}
// Alpha compositing the way the browser paints a translucent colour over an opaque backdrop:
// blending happens in gamma-encoded sRGB. Returns the composite as LINEAR sRGB.
const lin2gam = (x) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(clamp(x), 1 / 2.4) - 0.055;
const gam2lin = (x) =>
  x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
function compositeLinear(fgOklch, alpha, bgOklch) {
  const fg = oklchToLinearSrgb(...fgOklch)
    .map(clamp)
    .map(lin2gam);
  const bg = oklchToLinearSrgb(...bgOklch)
    .map(clamp)
    .map(lin2gam);
  return fg.map((c, i) => gam2lin(alpha * c + (1 - alpha) * bg[i]));
}
function contrastCompositeBg(fgOklch, compositeLin) {
  const a = relLum(oklchToLinearSrgb(...fgOklch)) + 0.05;
  const b = relLum(compositeLin) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

export function parseBlock(css, selector) {
  const re = new RegExp(selector.replace(".", "\\.") + "\\s*\\{([^}]*)\\}");
  const m = css.match(re);
  const out = {};
  if (m) {
    for (const declaration of m[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
      const [, name, value] = declaration;
      if (!value.trim().startsWith("oklch(")) continue;
      const color = value
        .trim()
        .match(
          /^oklch\(\s*([+-]?(?:\d+\.?\d*|\.\d+))\s+([+-]?(?:\d+\.?\d*|\.\d+))\s+([+-]?(?:\d+\.?\d*|\.\d+))(?:\s*\/\s*([+-]?(?:\d+\.?\d*|\.\d+)))?\s*\)$/,
        );
      if (!color) {
        throw new Error(
          `${selector}: cannot parse generated OKLCH token --${name}: ${value}`,
        );
      }
      const [, L, C, H, alpha = "1"] = color;
      const parsed = [L, C, H, alpha].map(Number);
      if (!parsed.every(Number.isFinite)) {
        throw new Error(
          `${selector}: non-finite OKLCH token --${name}: ${value}`,
        );
      }
      if (
        parsed[0] < 0 ||
        parsed[0] > 1 ||
        parsed[1] < 0 ||
        parsed[3] < 0 ||
        parsed[3] > 1
      ) {
        throw new Error(
          `${selector}: invalid OKLCH components in --${name}: ${value}`,
        );
      }
      // Keep the alpha as a 4th element: solid checks spread only L/C/H, the alpha-composite
      // checks (the dark hairline, the media scrims) read it explicitly.
      out[name] = parsed;
    }
  }
  return out;
}

/**
 * The whole gate as a pure function of one theme.css string.
 * Returns `{ failures, checked, clipped }` — never throws on a contrast miss, so `--self-test` can
 * observe the misses it deliberately creates.
 */
export function checkTheme(css) {
  const light = parseBlock(css, ":root");
  const darkRaw = parseBlock(css, ".dark");
  // `.dark` carries only theme-VARYING overrides; anything it omits inherits `:root` through the
  // cascade. Resolve dark the way the browser does, so every pair is checked against the values
  // that actually render.
  const themes = { light, dark: { ...light, ...darkRaw } };

  const failures = [];
  let checked = 0;
  const fail = (msg) => failures.push(msg);

  const need = (theme, vars, name, why) => {
    if (!vars[name]) {
      fail(`${theme}: ${name} is missing (${why}) — fail-closed`);
      return null;
    }
    return vars[name];
  };
  const gate = (theme, ink, surface, floor, label) => {
    checked++;
    const ratio = contrast(ink, surface);
    if (ratio < floor)
      fail(`${theme}: ${label} = ${ratio.toFixed(2)}:1 (needs ${floor}:1)`);
  };

  // WCAG 2.1 is evaluated in sRGB. Surface every valid OKLCH value whose conversion is clipped.
  const clipped = new Map();
  for (const [theme, vars] of Object.entries(themes)) {
    for (const [name, color] of Object.entries(vars)) {
      const channels = oklchToLinearSrgb(...color);
      if (!channels.every(Number.isFinite)) {
        fail(
          `${theme}: --${name} converts to non-finite linear-sRGB channels — fail-closed`,
        );
        continue;
      }
      const excursion = Math.max(
        0,
        ...channels.map((c) => -c),
        ...channels.map((c) => c - 1),
      );
      if (excursion > 1e-7) {
        const key = `${name}=${color.join(" ")}`;
        const previous = clipped.get(key);
        clipped.set(key, {
          excursion: Math.max(previous?.excursion ?? 0, excursion),
          themes: new Set([...(previous?.themes ?? []), theme]),
        });
      }
    }
  }

  for (const [theme, vars] of Object.entries(themes)) {
    // 1. The neutral core's canonical pairs.
    for (const [bg, fg] of PAIRS) {
      const surface = need(theme, vars, bg, `the ${fg}/${bg} pair`);
      const ink = need(theme, vars, fg, `the ${fg}/${bg} pair`);
      if (surface && ink)
        gate(theme, ink, surface, AA_NORMAL, `${fg} on ${bg}`);
    }

    // 2. Secondary ink on every neutral surface, and body ink on the tinted ones.
    for (const inkName of ["muted-foreground", "foreground"]) {
      const ink = need(theme, vars, inkName, "the neutral ink sweep");
      if (!ink) continue;
      for (const name of SECONDARY_INK_SURFACES) {
        const surface = need(theme, vars, name, `${inkName} on ${name}`);
        if (surface)
          gate(theme, ink, surface, AA_NORMAL, `${inkName} on ${name}`);
      }
    }

    // 3. Status families: fill as page text, foreground on the fill.
    for (const family of STATUS_FAMILIES) {
      const fill = need(theme, vars, family, "a status family fill");
      const ink = need(
        theme,
        vars,
        `${family}-foreground`,
        "a status family foreground",
      );
      if (!fill || !ink) continue;
      for (const name of STATUS_TEXT_SURFACES) {
        const surface = need(theme, vars, name, `${family} as text`);
        if (surface)
          gate(theme, fill, surface, AA_NORMAL, `${family} as text on ${name}`);
      }
      gate(theme, ink, fill, AA_NORMAL, `${family}-foreground on ${family}`);

      // …and the page-readable ink, on the page AND on every tint the family paints.
      const text = need(theme, vars, `${family}-text`, "a status family ink");
      if (!text) continue;
      for (const name of STATUS_TEXT_SURFACES) {
        const surface = need(theme, vars, name, `${family}-text`);
        if (!surface) continue;
        gate(theme, text, surface, AA_NORMAL, `${family}-text on ${name}`);
        for (const alpha of STATUS_TINT_ALPHAS) {
          checked++;
          const ratio = contrastCompositeBg(
            text,
            compositeLinear(fill, alpha, surface),
          );
          if (ratio < AA_NORMAL) {
            fail(
              `${theme}: ${family}-text on ${family}@${Math.round(alpha * 100)}% over ${name} = ${ratio.toFixed(2)}:1 (needs ${AA_NORMAL}:1)`,
            );
          }
        }
      }
    }

    // 4. Non-text UI parts (1.4.11).
    for (const part of NONTEXT) {
      const ink = need(theme, vars, part, "a non-text UI part");
      if (!ink) continue;
      for (const name of NEUTRAL_SURFACES) {
        const surface = need(theme, vars, name, `non-text ${part}`);
        if (surface)
          gate(theme, ink, surface, AA_NONTEXT, `non-text ${part} on ${name}`);
      }
    }
    for (const part of MARKERS) {
      const ink = need(theme, vars, part, "a marker");
      if (!ink) continue;
      for (const name of MARKER_SURFACES) {
        const surface = need(theme, vars, name, `marker ${part}`);
        if (surface)
          gate(theme, ink, surface, AA_NONTEXT, `marker ${part} on ${name}`);
      }
    }

    // 4b. TEXT-ENTRY FOCUS BORDER (FOC-3 + FOC-10, WCAG 1.4.11 >= 3:1).
    //     No text-entry control ever renders the ring SOLID: a text field cannot tell mouse from
    //     keyboard, so it carries `outline-hidden` and signals focus with `focus:border-ring/70` —
    //     the ring COMPOSITED at 70%. That composite is the entire focus affordance of every Input,
    //     Textarea, Field control, OTP slot, Select trigger, Combobox input, input group and
    //     TextEdit in the system, so it is measured rather than inferred from the solid token.
    {
      const ink = need(theme, vars, "ring", "the text-entry focus border");
      if (ink) {
        for (const name of NEUTRAL_SURFACES) {
          const surface = need(
            theme,
            vars,
            name,
            "the text-entry focus border",
          );
          if (!surface) continue;
          checked++;
          const ratio = contrastCompositeBg(
            surface,
            compositeLinear(ink, FOCUS_TINT_ALPHA, surface),
          );
          if (ratio < AA_NONTEXT) {
            fail(
              `${theme}: text-entry focus border ring@${Math.round(FOCUS_TINT_ALPHA * 100)}% on ${name} = ${ratio.toFixed(2)}:1 (needs ${AA_NONTEXT}:1)`,
            );
          }
        }
      }
    }

    // 5. Categorical chart hues.
    for (const token of CHART_TOKENS) {
      const hue = need(theme, vars, token, "a categorical chart hue");
      if (!hue) continue;
      for (const name of CATEGORICAL_SURFACES) {
        const surface = need(theme, vars, name, `categorical ${token}`);
        if (surface)
          gate(
            theme,
            hue,
            surface,
            AA_NONTEXT,
            `categorical ${token} on ${name}`,
          );
      }
    }

    // 6. Brand text.
    {
      const ink = need(theme, vars, "brand-text", "the brand ink");
      if (ink) {
        for (const name of BRAND_TEXT_SURFACES) {
          const surface = need(theme, vars, name, "brand-text");
          if (surface)
            gate(theme, ink, surface, AA_NORMAL, `brand-text on ${name}`);
        }
      }
    }

    // 7. The tag palette: text on its own subtle fill and as page text, base as a non-text accent.
    for (const hue of TAG_HUES) {
      const base = need(theme, vars, `tag-${hue}`, "a tag base");
      const subtle = need(
        theme,
        vars,
        `tag-${hue}-subtle`,
        "a tag subtle fill",
      );
      const text = need(theme, vars, `tag-${hue}-text`, "a tag ink");
      if (!base || !subtle || !text) continue;
      gate(
        theme,
        text,
        subtle,
        AA_NORMAL,
        `tag-${hue}-text on tag-${hue}-subtle`,
      );
      for (const name of CATEGORICAL_SURFACES) {
        const surface = need(theme, vars, name, `tag-${hue}`);
        if (!surface) continue;
        gate(theme, text, surface, AA_NORMAL, `tag-${hue}-text on ${name}`);
        gate(
          theme,
          base,
          surface,
          AA_NONTEXT,
          `categorical tag-${hue} on ${name}`,
        );
      }
    }

    // 8. Media chrome, measured over the light page as the worst-case backdrop in both runs.
    {
      const ink = need(theme, vars, "media-foreground", "the media ink");
      const worstBackdrop = light.background;
      for (const [scrimName, floor, label] of MEDIA_CASES) {
        const scrim = need(theme, vars, scrimName, "a media scrim");
        if (!ink || !scrim || !worstBackdrop) continue;
        const scrimAlpha = scrim[3];
        if (!(scrimAlpha > 0 && scrimAlpha < 1)) {
          fail(
            `${theme}: ${scrimName} must be an alpha colour (got alpha ${scrimAlpha}) — fail-closed`,
          );
          continue;
        }
        checked++;
        const composite = compositeLinear(scrim, scrimAlpha, worstBackdrop);
        const ratio = contrastCompositeBg(ink, composite);
        if (ratio < floor) {
          fail(
            `${theme}: media-foreground on ${scrimName} over a light page (${label}) = ${ratio.toFixed(2)}:1 (needs ${floor}:1)`,
          );
        }
      }
    }
  }

  return { failures, checked, clipped };
}

// ── self-test ───────────────────────────────────────────────────────────────────────────────────

/**
 * Observe the gate failing. A contrast gate that has never been seen rejecting a colour is
 * indistinguishable from one that cannot. Each claim mutates the REAL generated theme in a temp
 * copy, so the fixtures stay honest as the token set evolves.
 */
function selfTest(themePath) {
  const base = readFileSync(themePath, "utf8");
  const problems = [];
  const claim = (label, ok) => {
    console.log(
      `contrast-check:selftest ${ok ? "observed" : "DID NOT OBSERVE"} — ${label}`,
    );
    if (!ok) problems.push(label);
  };
  const failsWith = (mutate) => checkTheme(mutate(base)).failures.length > 0;
  const swap =
    (name, value, scope = ":root") =>
    (css) => {
      const block = css.match(
        new RegExp(scope.replace(".", "\\.") + "\\s*\\{[^}]*\\}"),
      )[0];
      return css.replace(
        block,
        block.replace(new RegExp(`--${name}:[^;]+;`), `--${name}: ${value};`),
      );
    };
  const drop =
    (name, scope = ":root") =>
    (css) => {
      const block = css.match(
        new RegExp(scope.replace(".", "\\.") + "\\s*\\{[^}]*\\}"),
      )[0];
      return css.replace(
        block,
        block.replace(new RegExp(`\\s*--${name}:[^;]+;`), ""),
      );
    };

  claim("the shipped theme passes", checkTheme(base).failures.length === 0);
  claim(
    "secondary ink lightened past AA on `muted` is rejected",
    failsWith(swap("muted-foreground", "oklch(0.62 0 0)")),
  );
  claim(
    "body ink dimmed past AA on the page is rejected",
    failsWith(swap("foreground", "oklch(0.62 0 0)")),
  );
  claim(
    "a status fill too pale to read as text is rejected",
    failsWith(swap("success", "oklch(0.82 0.15 150)")),
  );
  claim(
    "a status foreground that vanishes on its own fill is rejected",
    failsWith(swap("warning-foreground", "oklch(0.78 0 0)")),
  );
  claim(
    "a status ink that fails on its own 10% tint is rejected",
    failsWith(swap("info-text", "oklch(0.64 0.169 256)")),
  );
  claim(
    "a focus ring below the 1.4.11 non-text floor is rejected",
    failsWith(swap("ring", "oklch(0.95 0 0)")),
  );
  claim(
    "a focus ring too pale to survive the 70% text-entry tint is rejected",
    failsWith(swap("ring", "oklch(0.86 0 0)")),
  );
  claim(
    "a chart hue below the 1.4.11 non-text floor is rejected",
    failsWith(swap("chart-4", "oklch(0.95 0.05 41)")),
  );
  claim(
    "a tag ink that fails on its own subtle fill is rejected",
    failsWith(swap("tag-blue-text", "oklch(0.88 0.04 256)")),
  );
  claim(
    "a media scrim thinned below the AA text floor is rejected",
    failsWith(swap("media-scrim", "oklch(0.13 0.002 75 / 0.12)")),
  );
  claim(
    "a scrim authored as an opaque colour is rejected",
    failsWith(swap("media-scrim", "oklch(0.13 0.002 75)")),
  );
  claim(
    "a DARK-only regression is caught (the light half alone is not enough)",
    failsWith(swap("muted-foreground", "oklch(0.36 0 0)", ".dark")),
  );
  claim(
    "a missing token is rejected rather than skipped",
    failsWith(drop("brand-text")),
  );

  // A malformed value must throw rather than be quietly ignored.
  let threw = false;
  try {
    checkTheme(swap("primary", "oklch(bogus)")(base));
  } catch {
    threw = true;
  }
  claim("an unparseable OKLCH token throws instead of being skipped", threw);

  if (problems.length) {
    console.error(
      `✗ contrast-check:selftest: ${problems.length} claim(s) not observed`,
    );
    return 1;
  }
  console.log("✓ contrast-check:selftest: 15 claims observed");
  return 0;
}

// ── cli ─────────────────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const themePath =
  argv.find((a) => !a.startsWith("-")) ??
  "packages/design-tokens/dist/theme.css";

if (argv.includes("--self-test")) {
  process.exit(selfTest(themePath));
}

const { failures, checked, clipped } = checkTheme(
  readFileSync(themePath, "utf8"),
);
for (const failure of failures) console.error(`✗ ${failure}`);
if (failures.length) {
  console.error(
    `\n✗ contrast-check: ${failures.length} contrast/gamut contract failure(s)`,
  );
  process.exit(1);
}
if (clipped.size) {
  const rows = [...clipped.entries()];
  const maxExcursion = Math.max(...rows.map(([, report]) => report.excursion));
  console.warn(
    `⚠ contrast-check gamut: ${rows.length} unique OKLCH token value(s) require sRGB clipping for WCAG calculation (max linear-channel excursion ${maxExcursion.toFixed(4)}): ${rows
      .map(([token, report]) => `--${token} [${[...report.themes].join("+")}]`)
      .join(", ")}`,
  );
}
console.log(
  `✓ contrast-check: all ${checked} token contrast checks pass — WCAG 2.2 AA text pairs (${AA_NORMAL}:1) for the neutral core, the secondary-ink sweep and the four status families; WCAG 1.4.11 (${AA_NONTEXT}:1) for the focus ring, the checked fill, 8 chart hues and 10 tag hues; media chrome at the AA text floor; both themes, fail-closed on missing tokens`,
);
