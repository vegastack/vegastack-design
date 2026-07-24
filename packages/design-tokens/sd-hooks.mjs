// Custom Style Dictionary v5 hooks for the VegaStack token pipeline.
// Filters are TYPE-based (not value-shape based) so they survive reference resolution
// order: a transitive transform re-applied to an already-stringified alias value is a
// no-op (the object check inside each transform short-circuits).
import StyleDictionary from "style-dictionary";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------------------------------------
 * Preprocessor: derive-interaction-states (plan v5 T6 — "17 literal-OKLCH semantics → primitive
 * refs via SD preprocessor", register P2-23).
 *
 * The interaction steps of every chromatic family are DERIVED, not hand-authored:
 *  - `<family>-hover`  = fill with L − 0.05   (theme-invariant, light run)
 *  - `<family>-active` = fill with L − 0.09   (theme-invariant, light run)
 *  - `<family>-subtle-hover` = the fill composited over `<family>-subtle` in gamma sRGB at the
 *    theme's soft-hover wash (7% light — AA-tuned for `<family>-text`, see T2 log — / 30% dark),
 *    converted back to OKLCH. This is exactly what the browser paints for the old
 *    `bg-<family>/20|30` classes, precomposed so the pair is gate-checkable.
 * Change a fill primitive and every interaction step follows — no drift possible.
 * ----------------------------------------------------------------------------------------------*/
const FAMILIES = ["destructive", "success", "warning", "info"];
const HOVER_DELTA = -0.05;
const ACTIVE_DELTA = -0.09;
const SUBTLE_HOVER_ALPHA = { light: 0.07, dark: 0.3 };

const clamp01 = (x) => Math.max(0, Math.min(1, x));
function oklchToLinear(L, C, H) {
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
function linearToOklch(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}
const lin2gam = (x) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(clamp01(x), 1 / 2.4) - 0.055;
const gam2lin = (x) =>
  x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
// Composite the way the browser paints a translucent wash over an opaque backdrop: gamma sRGB.
function compositeOklch(fg, alpha, bg) {
  const f = oklchToLinear(...fg)
    .map(clamp01)
    .map(lin2gam);
  const g = oklchToLinear(...bg)
    .map(clamp01)
    .map(lin2gam);
  const lin = f.map((c, i) => gam2lin(alpha * c + (1 - alpha) * g[i]));
  return linearToOklch(...lin);
}
const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

// Resolve a `{a.b.c}`-style reference (or return the literal) within a raw token tree.
function resolveRaw(tree, value) {
  let v = value;
  while (typeof v === "string" && /^\{[^}]+\}$/.test(v)) {
    v = v
      .slice(1, -1)
      .split(".")
      .reduce((node, key) => node?.[key], tree)?.$value;
  }
  return v;
}

StyleDictionary.registerPreprocessor({
  name: "derive-interaction-states",
  preprocessor: (dictionary) => {
    // Identify the run by the SOURCE FILE of a token guaranteed present in both semantic files,
    // not by whether some token happens to be defined. The previous probe was
    // `Boolean(dictionary.destructive)`, which silently mislabelled the dark run as light the
    // moment `destructive` gained a dark override — picking the light subtle-hover alpha and
    // stamping the light `filePath`, so every `*-subtle-hover` token in `.dark` would be wrong
    // with no error. `background` is defined in both files and carries its filePath here.
    const runFilePath = String(dictionary.background?.filePath ?? "");
    if (!runFilePath) {
      throw new Error(
        "derive-interaction-states: cannot identify the theme run (no background token)",
      );
    }
    const isLightRun = !runFilePath.includes("semantic.dark");
    // The dark run's sources don't contain the (theme-invariant) fills — read the light
    // semantic file for the fill references and resolve them against this run's primitives.
    const lightSemantic = JSON.parse(
      readFileSync(join(PKG_DIR, "tokens/semantic.tokens.json"), "utf8"),
    );
    const filePath = isLightRun
      ? "tokens/semantic.tokens.json"
      : "tokens/semantic.dark.tokens.json";
    const alpha = SUBTLE_HOVER_ALPHA[isLightRun ? "light" : "dark"];

    for (const fam of FAMILIES) {
      const fillRaw = resolveRaw(
        dictionary,
        (dictionary[fam] ?? lightSemantic[fam]).$value,
      );
      const fill = fillRaw.components;
      const mk = (components, description) => ({
        $type: "color",
        $value: { colorSpace: "oklch", components, alpha: 1 },
        $description: description,
        filePath,
        isSource: true,
      });
      if (isLightRun) {
        dictionary[`${fam}-hover`] = mk(
          [round(fill[0] + HOVER_DELTA, 3), fill[1], fill[2]],
          `DERIVED: ${fam} fill at L${HOVER_DELTA} (hover step).`,
        );
        dictionary[`${fam}-active`] = mk(
          [round(fill[0] + ACTIVE_DELTA, 3), fill[1], fill[2]],
          `DERIVED: ${fam} fill at L${ACTIVE_DELTA} (active step).`,
        );
      }
      const subtle = resolveRaw(
        dictionary,
        dictionary[`${fam}-subtle`].$value,
      ).components;
      const [L, C, H] = compositeOklch(fill, alpha, subtle);
      dictionary[`${fam}-subtle-hover`] = mk(
        [round(L, 3), round(C, 3), round(H, 1)],
        `DERIVED: ${fam} fill @${alpha * 100}% composited over ${fam}-subtle (soft-hover surface, AA-gated against ${fam}-text).`,
      );
    }
    return dictionary;
  },
});

const typeOf = (t) => t.$type ?? t.type;
const valueOf = (t) => t.$value ?? t.value;

// DTCG oklch object -> `oklch(L C H / a)` string.
// REQUIRED: the built-in `color/css` transform emits hex/rgba and DESTROYS OKLCH.
StyleDictionary.registerTransform({
  name: "color/oklch",
  type: "value",
  transitive: true, // so aliased colors are transformed too
  filter: (t) => typeOf(t) === "color",
  transform: (t) => {
    const v = valueOf(t);
    // Registering a custom preprocessor activates SD's built-in DTCG color handling, which
    // stringifies color objects EARLY with zero-padded components ("oklch(0.5050 0.0030 75.00)").
    // Compact any such string back to canonical form so output stays byte-stable.
    if (typeof v === "string") {
      return v.replace(/oklch\(([^)]+)\)/g, (_, inner) => {
        const [nums, alpha] = inner.split("/");
        const compact = nums
          .trim()
          .split(/\s+/)
          .map((x) => +x)
          .join(" ");
        return alpha != null
          ? `oklch(${compact} / ${+alpha})`
          : `oklch(${compact})`;
      });
    }
    if (typeof v !== "object" || v === null || v.colorSpace !== "oklch")
      return v;
    // `+x` collapses any upstream padded formatting so output stays compact and byte-stable.
    const [l, c, h] = v.components.map((x) => +x);
    const a = +(v.alpha ?? 1);
    return a === 1 ? `oklch(${l} ${c} ${h})` : `oklch(${l} ${c} ${h} / ${a})`;
  },
});

// DTCG dimension {value,unit} -> `0.625rem`
StyleDictionary.registerTransform({
  name: "dimension/css",
  type: "value",
  transitive: true,
  filter: (t) => typeOf(t) === "dimension",
  transform: (t) => {
    const v = valueOf(t);
    if (typeof v !== "object" || v === null) return v;
    return `${v.value}${v.unit}`;
  },
});

// DTCG duration {value,unit} -> `150ms`
StyleDictionary.registerTransform({
  name: "duration/css",
  type: "value",
  transitive: true,
  filter: (t) => typeOf(t) === "duration",
  transform: (t) => {
    const v = valueOf(t);
    if (typeof v !== "object" || v === null) return v;
    return `${v.value}${v.unit}`;
  },
});

// DTCG cubicBezier [a,b,c,d] -> `cubic-bezier(a, b, c, d)`
StyleDictionary.registerTransform({
  name: "cubicBezier/css",
  type: "value",
  transitive: true,
  filter: (t) => typeOf(t) === "cubicBezier",
  transform: (t) => {
    const v = valueOf(t);
    if (!Array.isArray(v)) return v;
    return `cubic-bezier(${v.join(", ")})`;
  },
});

// DTCG fontFamily ["Geist","sans-serif"] -> `Geist, sans-serif` (multi-word families quoted)
StyleDictionary.registerTransform({
  name: "fontFamily/css",
  type: "value",
  transitive: true,
  filter: (t) => typeOf(t) === "fontFamily",
  transform: (t) => {
    const v = valueOf(t);
    if (!Array.isArray(v)) return v;
    return v.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ");
  },
});

// DTCG shadow string -> passed through verbatim (already a CSS box-shadow string).
StyleDictionary.registerTransform({
  name: "shadow/css",
  type: "value",
  transitive: true,
  filter: (t) => typeOf(t) === "shadow",
  transform: (t) => valueOf(t),
});

// @theme inline bridge: expose semantic colours + explicit radius scale + shadow + type-role utilities
// + the SCOPED two-layer text-* remap (plan v5 T1, CX-6):
//  - Ladder tokens (`type-product-*` / `type-doc-*`, typography type) carry the two size ladders:
//    the token-driven PRODUCT scale (xs 11 → 3xl 24, base = 14) and the DOC compatibility scale
//    (Tailwind's stock ladder — the deliberate 16px-prose spec for Fumadocs chrome/prose).
//  - A `:root` block emits both ladders as raw vars plus the ACTIVE binding `--type-<step>`,
//    defaulting to product (a token-consuming app IS a product surface).
//  - `@theme inline` maps Tailwind's `--text-<step>` onto `var(--type-<step>)`, so every `text-*`
//    utility resolves through the binding and any subtree can re-scope by re-pointing `--type-*`
//    (the docs app binds :root to the doc ladder and re-enters product scale inside previews).
//  - Role utilities (`text-h1`…`text-code-sm`, display tier) stay literal — theme-invariant.
StyleDictionary.registerFormat({
  name: "tailwind/inline-bridge",
  format: ({ dictionary }) => {
    const tk = dictionary.allTokens;
    const colors = tk
      .filter((t) => typeOf(t) === "color")
      .map((t) => `  --color-${t.name}: var(--${t.name});`)
      .join("\n");
    const isLadder = (t) =>
      typeOf(t) === "typography" && /^type-(product|doc)-/.test(t.name);
    const ladder = tk.filter(isLadder);
    const ladderVars = ladder
      .flatMap((t) => {
        const v = valueOf(t);
        return [
          `  --${t.name}: ${v.fontSize};`,
          `  --${t.name}--line-height: ${v.lineHeight};`,
        ];
      })
      .join("\n");
    const steps = [
      ...new Set(ladder.map((t) => t.name.replace(/^type-(product|doc)-/, ""))),
    ];
    const bindings = steps
      .flatMap((s) => [
        `  --type-${s}: var(--type-product-${s});`,
        `  --type-${s}--line-height: var(--type-product-${s}--line-height);`,
      ])
      .join("\n");
    const remap = steps
      .flatMap((s) => [
        `  --text-${s}: var(--type-${s});`,
        `  --text-${s}--line-height: var(--type-${s}--line-height);`,
      ])
      .join("\n");
    const type = tk
      .filter((t) => typeOf(t) === "typography" && !isLadder(t))
      .flatMap((t) => {
        const v = valueOf(t);
        const out = [
          `  --${t.name}: ${v.fontSize};`,
          `  --${t.name}--line-height: ${v.lineHeight};`,
        ];
        if (v.fontWeight)
          out.push(`  --${t.name}--font-weight: ${v.fontWeight};`);
        if (v.letterSpacing && v.letterSpacing !== "0em")
          out.push(`  --${t.name}--letter-spacing: ${v.letterSpacing};`);
        return out;
      })
      .join("\n");
    return [
      "/* Two-layer type scale (T1): both ladders + the active binding (product by default). */",
      ":root {",
      ladderVars,
      bindings,
      "}\n",
      "@theme inline {",
      colors,
      "  /* text-* remap — utilities resolve through the scoped --type-* binding (CX-6) */",
      remap,
      // radius scale — explicit, token-driven (2-sharp/2-xs/6/8/12; the 5th `xl` step is REMOVED
      // per spec — `rounded-xl` is lint-banned so it can never silently fall back to Tailwind's default)
      "  --radius-xs: var(--radius-xs);",
      "  --radius-sharp: var(--radius-sharp);",
      "  --radius-sm: var(--radius-sm);",
      "  --radius-md: var(--radius-md);",
      "  --radius-lg: var(--radius-lg);",
      // one overlay shadow (flat system; cards use none, overlays use this)
      "  --shadow-overlay: var(--shadow-overlay);",
      // semantic glass effect — the named Tailwind utility is `backdrop-blur-glass`.
      "  --blur-glass: var(--effect-blur-glass);",
      // type-role utilities
      type,
      "  --font-sans: var(--font-family-sans);", // distinct runtime name -> no self-reference (Codex F7)
      "  --font-mono: var(--font-family-mono);",
      "  --font-serif: var(--font-family-serif);",
      "  --ease-standard: var(--motion-ease-standard);",
      "  --ease-emphasized: var(--motion-ease-emphasized);",
      "  --ease-exit: var(--motion-ease-exit);",
      "  --ease-spring: var(--motion-ease-spring);",
      "  --blur-motion: var(--motion-blur);", // blur-motion utility for Phase M blur-fade reveals
      "  --transition-duration-fast: var(--duration-fast);",
      "  --transition-duration-base: var(--duration-base);",
      "  --transition-duration-slow: var(--duration-slow);",
      "}\n",
    ].join("\n");
  },
});
