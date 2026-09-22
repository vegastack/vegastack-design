// Custom Style Dictionary v5 hooks for the VegaStack token pipeline.
// Filters are TYPE-based (not value-shape based) so they survive reference resolution
// order: a transitive transform re-applied to an already-stringified alias value is a
// no-op (the object check inside each transform short-circuits).
//
// THE `derive-interaction-states` PREPROCESSOR IS GONE (shadcn reset, Batch 1, 2026-09-18).
// It derived a `border` hairline from `foreground` at `--alpha-border`, and `-hover`/`-active`/
// `-subtle-hover`/`-subtle-active` steps for the four chromatic families. The reset deletes every
// one of those tokens: `border` is shadcn's own opaque 0.922 light / white-at-10% dark, and a
// status family is now written exactly the way shadcn writes `destructive` — one fill plus one
// on-fill foreground, with hover and pressed expressed by the component as `/80`, `/90`, `/10`,
// `/20`. Nothing derives anything any more, so the whole preprocessor, its OKLCH compositing maths
// and its theme-run detection go with it.
import StyleDictionary from "style-dictionary";

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

// The `@theme inline` bridge, in upstream's own shape.
//
// It is deliberately thin. Before the reset this format carried two parallel type ladders, a
// scoped `--type-*` binding, a `--text-*` remap, a hand-written radius scale with the `xl` step
// REMOVED so a lint could ban it, a single `--shadow-overlay` role and a `--blur-glass` role. The
// reset deletes all of that (TYP-1, BRD-3/4/6 = shadcn): type SIZES are stock Tailwind, radius
// derives from `--radius` exactly as upstream derives it, and shadows are per-component
// `shadow-sm/md/lg`.
//
// TYP-15 (ours, MK 2026-09-22) adds back ONE thing, and only above the copy tier: the heading
// tier's optical metrics. See the HEADING TIER block below for why that is not a re-opening of
// TYP-1.
//
// What remains is what upstream's own `globals.css` bridges — every semantic colour, the radius
// ramp, the font families and the heading alias — plus the four VegaStack motion eases and three
// durations that the MOT-6/MOT-7 keyed-presence and docked utilities in `utilities.css` consume.
StyleDictionary.registerFormat({
  name: "tailwind/inline-bridge",
  format: ({ dictionary }) => {
    const colors = dictionary.allTokens
      .filter((t) => typeOf(t) === "color")
      .map((t) => `  --color-${t.name}: var(--${t.name});`)
      .join("\n");
    return [
      "@theme inline {",
      colors,
      "  /* Upstream derives its whole radius ramp from --radius (0.6/0.8/1/1.4/1.8/2.2/2.6x). */",
      "  --radius-sm: calc(var(--radius) * 0.6);",
      "  --radius-md: calc(var(--radius) * 0.8);",
      "  --radius-lg: var(--radius);",
      "  --radius-xl: calc(var(--radius) * 1.4);",
      "  --radius-2xl: calc(var(--radius) * 1.8);",
      "  --radius-3xl: calc(var(--radius) * 2.2);",
      "  --radius-4xl: calc(var(--radius) * 2.6);",
      "  /* ── TYP-15 (ours) — HEADING TIER OPTICAL METRICS ────────────────────────────────────",
      "     Geist's published spec splits a COPY tier (letter-spacing 0) from a HEADING tier whose",
      "     letter-spacing goes negative as size grows. This system's copy sizes are 12/14/16 —",
      "     exactly Geist's copy tier — so `text-xs`, `text-sm` and `text-base` are NOT declared",
      "     here: they stay stock, untouched, and the 202 component usages of them render",
      "     byte-identically. Restating them at their stock values would be the same dead",
      "     restatement `restated-motion-reduce` and `restated-focus` exist to reject.",
      "",
      "     SIZES ARE STOCK. Only `--line-height` and `--letter-spacing` move, so TYP-1 stays",
      "     **shadcn** and a pasted shadcn snippet still renders at upstream's size. The size is",
      "     restated on each step anyway because a modifier with no base is meaningless to read,",
      "     and it pins the ramp against a future Tailwind default change.",
      "",
      "     Two of these go LOOSER, not tighter. Stock Tailwind collapses 3xl-7xl toward 1.0, which",
      "     clips Geist's descenders once negative tracking pulls the glyphs together; Vercel runs",
      "     48px at 56px leading, not 48. And stock `text-lg` (1.556) is looser than `text-base`",
      "     (1.5) — non-monotonic, and backwards from the shape this ramp exists to produce. */",
      "  --text-lg: 1.125rem;",
      "  --text-lg--line-height: 1.625rem;",
      "  --text-lg--letter-spacing: -0.012em;",
      "  --text-xl: 1.25rem;",
      "  --text-xl--line-height: 1.625rem;",
      "  --text-xl--letter-spacing: -0.02em;",
      "  --text-2xl: 1.5rem;",
      "  --text-2xl--line-height: 2rem;",
      "  --text-2xl--letter-spacing: -0.04em;",
      "  --text-3xl: 1.875rem;",
      "  --text-3xl--line-height: 2.375rem;",
      "  --text-3xl--letter-spacing: -0.04em;",
      "  --text-4xl: 2.25rem;",
      "  --text-4xl--line-height: 2.75rem;",
      "  --text-4xl--letter-spacing: -0.05em;",
      "  --text-5xl: 3rem;",
      "  --text-5xl--line-height: 3.5rem;",
      "  --text-5xl--letter-spacing: -0.06em;",
      "  --text-6xl: 3.75rem;",
      "  --text-6xl--line-height: 4rem;",
      "  --text-6xl--letter-spacing: -0.06em;",
      "  --text-7xl: 4.5rem;",
      "  --text-7xl--line-height: 4.5rem;",
      "  --text-7xl--letter-spacing: -0.06em;",
      "  --font-sans: var(--font-family-sans);", // distinct runtime name -> no self-reference (Codex F7)
      "  --font-mono: var(--font-family-mono);",
      "  --font-serif: var(--font-family-serif);",
      "  --font-display: var(--font-family-display);",
      "  --font-heading: var(--font-family-sans);", // upstream's own alias; components use `font-heading`
      "  /* MOT-2 is shadcn, so nothing pairs a duration with an ease any more. These four eases and",
      "     three durations exist for the MOT-6/MOT-7 utilities in utilities.css, which are ours. */",
      "  --ease-standard: var(--motion-ease-standard);",
      "  --ease-emphasized: var(--motion-ease-emphasized);",
      "  --ease-exit: var(--motion-ease-exit);",
      "  --ease-spring: var(--motion-ease-spring);",
      "  --transition-duration-fast: var(--duration-fast);",
      "  --transition-duration-base: var(--duration-base);",
      "  --transition-duration-slow: var(--duration-slow);",
      "}\n",
    ].join("\n");
  },
});
