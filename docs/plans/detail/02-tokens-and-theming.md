# detail/02 — Tokens & Theming (verbatim)

Verified 2026-06-21 against tailwindcss.com, styledictionary.com, designtokens.org, github.com/Wombosvideo/tw-animate-css, github.com/pacocoursey/next-themes, and `references/fumadocs`. Versions: tailwindcss **4.3.1**, style-dictionary **5.4.4** (ESM, Node ≥22), tw-animate-css **1.4.0**, next-themes **0.4.6**, DTCG **2025.10**.

> **Two non-negotiable facts:** (1) DTCG 2025.10 color `$value` is a structured object, NOT a hex string. (2) Style Dictionary's built-in `color/css` transform converts to hex/rgba and **destroys OKLCH** — we register a custom `color/oklch` transform. (3) Semantic tokens use `@theme inline` (value is a `var()`); primitives use plain `@theme`.

## 1. Consumer `globals.css` (Tailwind v4, shadcn-canonical)

```css
@import "tailwindcss";
@import "tw-animate-css";

/* class-based dark mode — pairs with next-themes attribute="class" */
@custom-variant dark (&:where(.dark, .dark *));

/* tokens + @custom-variant dark + the @theme inline bridge are SHIPPED by the package (generated — §2) */
@import "@vegastack/tokens/theme.css";

/* optional base reset (border-border, body bg, :focus-visible, reduced-motion) */
@import "@vegastack/tokens/base.css";
```

> The downstream's ENTIRE CSS setup is these 4 imports — `:root`/`.dark` values, the `@theme inline` bridge, and `@custom-variant dark` all ship inside `@vegastack/tokens/theme.css` (see the generated output in §2). `@theme inline` works fine from an `@import`ed package file (Tailwind v4 inlines imports during compilation).

`@vegastack/tokens/base.css` (hand-written, opt-in reset — kept separate so consumers aren't forced into an opinionated base):

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  /* a11y: real focus ring (fixes the platform's outline:none defect, requirements §7.5) */
  :focus-visible {
    @apply outline-2 outline-offset-2 outline-ring;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- `@theme` (literal value) → primitives. `@theme inline` (value is `var()`) → semantics; without `inline`, the utility emits `var(--color-primary)` resolved at definition scope and runtime override breaks.
- Tailwind v4 declares `@layer theme, base, components, utilities;` internally — do not redeclare.
- Content auto-detection: no `content` array; `@source` only for class usage inside non-scanned packages (see §8).

Source: https://tailwindcss.com/docs/functions-and-directives · https://tailwindcss.com/docs/theme · https://tailwindcss.com/docs/dark-mode

## 2. Style Dictionary v5 pipeline

> **Approach (verified against the SD docs):** light and dark have the same token NAMES with different values, so they must be **separate builds** (one `source` set each) — otherwise they collide in one dictionary. Each build uses the **built-in `css/variables` format** with `options.selector` (`:root` / `.dark`) + `outputReferences: false` (aliases resolve to literal `oklch()`). Only two small custom hooks are needed: the `color/oklch` value transform and a trivial `tailwind/inline-bridge` format. This retires the earlier `getReferences` uncertainty — `css/variables` + `selector` + `outputReferences` are all documented.

**Token file roles** (drives the filters below):

- `tokens/primitives.tokens.json` — the raw color scale only (e.g. `color.neutral.*`, `color.brand.*`). **Never emitted** to CSS; exists only so semantic aliases can resolve. (Tailwind v4 already ships a default `red-500`-style palette, so we don't re-emit one.)
- `tokens/semantic.tokens.json` — the **exposed** tokens: semantic colors (`background`, `foreground`, `primary`, status…) **+ the foundation** (`radius`, `font-*`, `ease-*`, `duration-*`). Emitted to `:root`.
- `tokens/semantic.dark.tokens.json` — dark overrides of the semantic colors (same names). Emitted to `.dark`.

`packages/tokens/sd-hooks.mjs` (the two custom hooks):

```js
import StyleDictionary from "style-dictionary";

// DTCG oklch object -> `oklch(L C H / a)` string. REQUIRED: built-in color/css would emit hex/rgba and lose OKLCH.
StyleDictionary.registerTransform({
  name: "color/oklch",
  type: "value",
  transitive: true, // so aliased colors are transformed too
  filter: (t) =>
    t.$type === "color" &&
    typeof t.$value === "object" &&
    t.$value.colorSpace === "oklch",
  transform: (t) => {
    const [l, c, h] = t.$value.components;
    const a = t.$value.alpha ?? 1;
    return a === 1 ? `oklch(${l} ${c} ${h})` : `oklch(${l} ${c} ${h} / ${a})`;
  },
});

// @theme inline bridge: expose each semantic color as a Tailwind utility; foundation bridges are stable.
StyleDictionary.registerFormat({
  name: "tailwind/inline-bridge",
  format: ({ dictionary }) => {
    const colors = dictionary.allTokens
      .filter((t) => t.$type === "color")
      .map((t) => `  --color-${t.name}: var(--${t.name});`)
      .join("\n");
    return [
      "@theme inline {",
      colors,
      "  --radius-sm: calc(var(--radius) - 4px);",
      "  --radius-md: calc(var(--radius) - 2px);",
      "  --radius-lg: var(--radius);",
      "  --radius-xl: calc(var(--radius) + 4px);",
      "  --font-sans: var(--font-family-sans);", // distinct runtime name → no self-reference (Codex F7)
      "  --font-mono: var(--font-family-mono);",
      "  --font-serif: var(--font-family-serif);",
      "  --ease-standard: var(--motion-ease-standard);",
      "  --ease-emphasized: var(--motion-ease-emphasized);",
      "  --ease-exit: var(--motion-ease-exit);",
      "}\n",
    ].join("\n");
  },
});

StyleDictionary.registerFormat({
  name: "typescript/constants",
  format: ({ dictionary }) =>
    `// AUTO-GENERATED — do not edit.\nexport const tokens = {\n` +
    dictionary.allTokens
      .map((t) => `  '${t.name}': ${JSON.stringify(t.$value)},`)
      .join("\n") +
    `\n} as const;\nexport type TokenName = keyof typeof tokens;\n`,
});
```

`packages/tokens/build-tokens.mjs` (three SD runs + concat → one `theme.css`):

```js
import StyleDictionary from "style-dictionary";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import "./sd-hooks.mjs"; // registers the transform + formats above

const TRANSFORMS = [
  "attribute/cti",
  "name/kebab",
  "color/oklch",
  "size/rem",
  "time/seconds",
];

// 1. LIGHT → :root (primitives included only to resolve aliases, filtered OUT of output)
await new StyleDictionary({
  source: ["tokens/primitives.tokens.json", "tokens/semantic.tokens.json"],
  platforms: {
    css: {
      transforms: TRANSFORMS,
      buildPath: "dist/",
      files: [
        {
          destination: "_root.css",
          format: "css/variables",
          filter: (t) => t.filePath.includes("semantic.tokens"),
          options: { selector: ":root", outputReferences: false },
        },
        {
          destination: "_inline.css",
          format: "tailwind/inline-bridge",
          filter: (t) => t.filePath.includes("semantic.tokens"),
        },
      ],
    },
  },
}).buildAllPlatforms();

// 2. DARK → .dark
await new StyleDictionary({
  source: ["tokens/primitives.tokens.json", "tokens/semantic.dark.tokens.json"],
  platforms: {
    css: {
      transforms: TRANSFORMS,
      buildPath: "dist/",
      files: [
        {
          destination: "_dark.css",
          format: "css/variables",
          filter: (t) => t.filePath.includes("semantic.dark"),
          options: { selector: ".dark", outputReferences: false },
        },
      ],
    },
  },
}).buildAllPlatforms();

// 3. TS/JSON PER THEME — NEVER glob both light+dark into one dictionary (same names collide; Codex F1).
async function flat(sources, needle, dest) {
  await new StyleDictionary({
    source: sources,
    platforms: {
      json: {
        transforms: TRANSFORMS,
        buildPath: "dist/",
        files: [
          {
            destination: dest,
            format: "json/flat",
            filter: (t) => t.filePath.includes(needle),
          },
        ],
      },
    },
  }).buildAllPlatforms();
  return JSON.parse(readFileSync(`dist/${dest}`, "utf8"));
}
const light = await flat(
  ["tokens/primitives.tokens.json", "tokens/semantic.tokens.json"],
  "semantic.tokens",
  "_light.json",
);
const dark = await flat(
  ["tokens/primitives.tokens.json", "tokens/semantic.dark.tokens.json"],
  "semantic.dark",
  "_dark.json",
);

// build assertion: every dark key must have a light counterpart (catches drift/typos)
for (const k of Object.keys(dark))
  if (!(k in light))
    throw new Error(`dark token "${k}" has no light counterpart`);

const model = { light, dark }; // non-colliding namespaced model
writeFileSync("dist/tokens.json", JSON.stringify(model, null, 2));
writeFileSync(
  "src/tokens.ts",
  `// AUTO-GENERATED — do not edit.\nexport const tokens = ${JSON.stringify(model, null, 2)} as const;\n` +
    `export type Theme = keyof typeof tokens;\nexport type TokenName = keyof (typeof tokens)['light'];\n`,
);

// 4. concat → dist/theme.css + ship the opt-in reset
const parts = ["_root.css", "_dark.css", "_inline.css"].map((f) =>
  readFileSync(`dist/${f}`, "utf8"),
);
writeFileSync(
  "dist/theme.css",
  `@custom-variant dark (&:where(.dark, .dark *));\n\n${parts.join("\n")}`,
);
writeFileSync("dist/base.css", readFileSync("src/base.css", "utf8")); // Codex F3: base.css is real + exported
["_root.css", "_dark.css", "_inline.css", "_light.json", "_dark.json"].forEach(
  (f) => rmSync(`dist/${f}`),
);
```

`package.json` — the script is named **`build`** so `turbo run build` discovers it (Codex F4):

```json
"scripts": { "build": "node build-tokens.mjs && tsup src/tokens.ts --format esm --dts --out-dir dist" }
```

- `base.css` is authored at `packages/tokens/src/base.css` and copied to `dist/base.css` by step 4 (Codex F3); it is exported (`./base.css`) and in `files` — detail/01 §4.
- `tsup` (pinned in the version matrix; installed in detail/01) compiles `src/tokens.ts` → `dist/tokens.js` + `dist/tokens.d.ts`, so every `exports` entry (`.`, `./theme.css`, `./base.css`, `./tokens.json`) resolves.
- Drop the now-unused `typescript/constants` format from `sd-hooks.mjs`. `tokens.json`/`tokens.ts` are a non-colliding `{ light, dark }` model (DTCG source of truth for TS/Figma consumers).

**Generated `dist/theme.css` (what ships):**

```css
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.205 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.505 0.213 27.5);
  --radius: 0.625rem;
  --font-family-sans: "Geist", sans-serif;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
.dark {
  --background: oklch(0.205 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-destructive: var(--destructive);
  --radius-lg: var(--radius);
  --font-sans: var(--font-family-sans);
  --ease-standard: var(--motion-ease-standard);
}
```

Consumers get `bg-primary`/`text-foreground` utilities (from `@theme inline`), `bg-primary/10` opacity (Tailwind v4 → `color-mix(in oklab, var(--primary) 10%, transparent)`), dark-mode repaint by toggling `.dark`, and one-file override by redefining `--primary` (detail §1).

Source (verified): https://styledictionary.com/reference/hooks/formats/predefined/ (`css/variables` `selector` + `outputReferences`) · https://styledictionary.com/reference/hooks/transforms/ · https://styledictionary.com/reference/api.mdx (`registerTransform` `filter`/`transform`/`original`). The `color/oklch` transform is required (built-in `color/css` loses OKLCH — verified).

## 3. DTCG token files (2025.10)

`packages/tokens/tokens/primitives.tokens.json`:

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "color": {
    "$type": "color",
    "white": {
      "$value": { "colorSpace": "oklch", "components": [1, 0, 0], "alpha": 1 }
    },
    "black": {
      "$value": {
        "colorSpace": "oklch",
        "components": [0.145, 0, 0],
        "alpha": 1
      }
    },
    "neutral": {
      "50": {
        "$value": {
          "colorSpace": "oklch",
          "components": [0.985, 0, 0],
          "alpha": 1
        }
      },
      "900": {
        "$value": {
          "colorSpace": "oklch",
          "components": [0.205, 0, 0],
          "alpha": 1
        }
      }
    }
  }
}
```

> Primitives are the raw scale **only** (no radius/font/motion here — those are exposed, so they live in the semantic file). Primitives are never emitted to CSS; they exist to resolve semantic aliases.

`packages/tokens/tokens/semantic.tokens.json` — exposed semantic colors + foundation (emitted to `:root`):

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "background": { "$type": "color", "$value": "{color.white}" },
  "foreground": { "$type": "color", "$value": "{color.neutral.900}" },
  "primary": { "$type": "color", "$value": "{color.neutral.900}" },
  "primary-foreground": { "$type": "color", "$value": "{color.neutral.50}" },
  "radius": {
    "$type": "dimension",
    "$value": { "value": 0.625, "unit": "rem" }
  },
  "font-family-sans": {
    "$type": "fontFamily",
    "$value": ["Geist", "sans-serif"]
  },
  "font-family-mono": {
    "$type": "fontFamily",
    "$value": ["Geist Mono", "monospace"]
  },
  "font-family-serif": { "$type": "fontFamily", "$value": ["Lora", "serif"] },
  "duration-fast": {
    "$type": "duration",
    "$value": { "value": 150, "unit": "ms" }
  },
  "motion-ease-standard": { "$type": "cubicBezier", "$value": [0.2, 0, 0, 1] },
  "motion-ease-emphasized": {
    "$type": "cubicBezier",
    "$value": [0.3, 0, 0, 1]
  },
  "motion-ease-exit": { "$type": "cubicBezier", "$value": [0.4, 0, 1, 1] }
}
```

> **Runtime font/ease names are deliberately distinct** from Tailwind's `--font-*`/`--ease-*` namespaces (`--font-family-*`, `--motion-ease-*`) so the `@theme inline` bridge isn't self-referential (Codex F7). Colors don't need this (runtime `--background` vs Tailwind `--color-background` already differ).
> `packages/tokens/tokens/semantic.dark.tokens.json` — dark overrides of the SAME semantic color names (emitted to `.dark`):

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "background": { "$type": "color", "$value": "{color.neutral.900}" },
  "foreground": { "$type": "color", "$value": "{color.neutral.50}" },
  "primary": { "$type": "color", "$value": "{color.neutral.50}" },
  "primary-foreground": { "$type": "color", "$value": "{color.neutral.900}" }
}
```

oklch `components` = `[L (0–1), Chroma, Hue (0–<360)]`; `dimension.$value` = `{value,unit}`; `cubicBezier` = 4-number array; `fontFamily.$value` = array.

Source: https://www.designtokens.org/tr/drafts/format/ · https://www.designtokens.org/tr/drafts/color/

> DTCG 2025.10 is a _draft_ CG report; pin `$schema` to 2025.10. The `hex` field is an optional fallback only.

## 4. tw-animate-css

```bash
pnpm add -D tw-animate-css@^1.4.0
```

`@import "tw-animate-css";` (already in §1). Provides `animate-in/out`, `fade-in/out`, `zoom-in/out`, `slide-in-from-*`/`slide-out-to-*`, `spin-*`, `blur-*`, params (`duration-*`, `ease-*`, `delay-*`, `fill-mode-*`), and ready-made `accordion-down/up`, `collapsible-down/up`, `caret-blink`. shadcn deprecated `tailwindcss-animate` for this. **Pin `^1.4.0`** (v2 has breaking changes).
Source: https://github.com/Wombosvideo/tw-animate-css · https://ui.shadcn.com/docs/tailwind-v4

## 5. Motion tokens

Motion tokens live in `semantic.tokens.json` (so they emit to `:root`); the `--ease-*` are mirrored into the `@theme inline` bridge (§2) so the utilities exist. Generated:

```css
:root {
  --duration-fast: 150ms;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1); /* … */
}
@theme inline {
  --ease-standard: var(--motion-ease-standard); /* … */
}
```

- runtime `--motion-ease-*` bridged to Tailwind's `--ease-*` namespace → `ease-standard`/`ease-emphasized`/`ease-exit` utilities (distinct names avoid the self-reference — Codex F7).
- `--duration-*` is NOT a built-in namespace → use `duration-[var(--duration-fast)]` or define `@utility duration-fast { transition-duration: var(--duration-fast); }`.
- Apply: `transition-colors ease-standard duration-[var(--duration-fast)]`. Reduced-motion handled in `base.css` (§1) + per-utility `motion-reduce:transition-none`.

## 6. next-themes provider

`packages/ui/src/provider/vegastack-provider.tsx` (the `<VegaStackProvider>` bundles theme + toast + tooltip + direction):

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "./toaster"; // Sonner config
import { Tooltip } from "@base-ui/react/tooltip";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ReactNode } from "react";

export function VegaStackProvider({
  children,
  ...themeProps
}: { children: ReactNode } & React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...themeProps}
    >
      <DirectionProvider>
        <Tooltip.Provider>
          {children}
          <Toaster />
        </Tooltip.Provider>
      </DirectionProvider>
    </NextThemesProvider>
  );
}
```

Root layout requires `suppressHydrationWarning` (next-themes mutates `<html>`); next-themes injects a blocking pre-hydration script → no FOUC; `disableTransitionOnChange` suppresses switch flashes.

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <VegaStackProvider>{children}</VegaStackProvider>
      </body>
    </html>
  );
}
```

Theme toggle hook `useVegaStackTheme()` = thin wrapper over next-themes' `useTheme()`. next-themes 0.4.6 peer includes React 19.
Source: https://github.com/pacocoursey/next-themes

## 7. Multi-theme (data-theme) — designed-for (not built in v1)

Named runtime themes override the same semantic vars; light/dark stays class-based:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.205 0 0);
  --primary: oklch(0.205 0 0);
}
.dark {
  --background: oklch(0.205 0 0);
  --foreground: oklch(0.985 0 0);
}
[data-theme="ocean"] {
  --background: oklch(0.98 0.02 230);
  --primary: oklch(0.6 0.15 230);
}
[data-theme="ocean"].dark,
[data-theme="ocean"] .dark {
  --background: oklch(0.18 0.04 250);
}
```

For two independent axes (dark + named palette) run two next-themes providers with distinct `storageKey` and `attribute="class"` / `attribute="data-theme"`. Add `@custom-variant ocean (&:where([data-theme="ocean"], [data-theme="ocean"] *));` for `ocean:` utilities. v1 ships light/dark only; this is the documented path for later white-label.

## 8. Cross-package boundary

- Ship the token CSS as a real file imported by package path: `@import "@vegastack/tokens/theme.css";` (the package `exports` map exposes `./theme.css` — detail/01 §4). A package `@theme` block, once `@import`ed into the consumer root CSS, generates utilities normally — **no `@source` needed for tokens**.
- `@source` is for class _usage_ inside non-scanned files (e.g. a sibling/compiled package): `@source "../../packages/ui/src/**/*.{ts,tsx}";`. **Registry copy-in components need none** (they land in the consumer `src/`, auto-scanned).
- Everyone must be on Tailwind v4 (a v3 consumer silently won't style v4 components).
  Source: https://tailwindcss.com/blog/tailwindcss-v4
