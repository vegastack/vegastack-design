export const designMdConfig = {
  schemaVersion: 1,
  version: "2.1",
  name: "VegaStack",
  description:
    "Canonical VegaStack design contract. Light and dark are co-primary themes; token values are resolved from the current DTCG sources.",
  tokenSources: {
    primitives: "packages/design-tokens/tokens/primitives.tokens.json",
    light: "packages/design-tokens/tokens/semantic.tokens.json",
    dark: "packages/design-tokens/tokens/semantic.dark.tokens.json",
  },
  sourceManifest: "docs/research/design-md-audit/source-manifest.json",
  outputs: {
    canonical: "design.md",
    public: "apps/docs/public/design.md",
  },
  // REBUILT BY THE SHADCN RESET (Batch 1, 2026-09-18). The foundation tables and the recipe set
  // are resolved against the LIVE token contract, so every entry here names a token that must
  // exist. The radius ramp, the shadow role, the two type ladders and the four `<family>-subtle`
  // families are gone (BRD-3/BRD-4/BRD-6, TYP-1, COL-12 in shadcn's shape), so the tables and the
  // recipes are re-expressed on what the system actually ships. The doctrine PROSE around them is
  // rewritten in Batch 9; this is the machine-checked half.
  foundationTables: {
    charts: {
      path: "apps/docs/content/docs/foundations/colors.mdx",
      tokens: [
        "chart-1",
        "chart-2",
        "chart-3",
        "chart-4",
        "chart-5",
        "chart-6",
        "chart-7",
        "chart-8",
      ],
    },
  },
  recipes: {
    // Upstream's own Button, written as tokens. `hover`/`active` are alpha steps of the fill
    // (`hover:bg-primary/80`), not darker sibling tokens — `primary-hover` and `primary-active`
    // no longer exist (COL-10 = shadcn).
    "button-primary": {
      background: "{primary}",
      foreground: "{primary-foreground}",
      radius: "{radius}",
      typography: "text-sm/500",
    },
    "button-secondary": {
      background: "{secondary}",
      foreground: "{secondary-foreground}",
      hover: "{accent}",
      radius: "{radius}",
      typography: "text-sm/500",
    },
    // shadcn's destructive Button is SOFT: a 10% wash of the fill under the fill used as ink.
    "button-destructive": {
      background: "{destructive}",
      foreground: "{destructive-foreground}",
      radius: "{radius}",
      typography: "text-sm/500",
    },
    input: {
      background: "transparent",
      foreground: "{foreground}",
      border: "{input}",
      focusBorder: "{ring}",
      radius: "{radius}",
      typography: "text-sm",
    },
    card: {
      background: "{card}",
      foreground: "{card-foreground}",
      border: "{border}",
      radius: "{radius}",
      shadow: "none",
    },
    overlay: {
      background: "{popover}",
      foreground: "{popover-foreground}",
      border: "{border}",
      radius: "{radius}",
      shadow: "shadow-md",
    },
    "menu-item": {
      foreground: "{foreground}",
      hover: "{accent}",
      selected: "{accent}",
      radius: "{radius}",
      typography: "text-sm",
    },
  },
};
