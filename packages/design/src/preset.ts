/**
 * `@vegastack/design/preset` — Tailwind v4 setup metadata for VegaStack.
 *
 * Tailwind v4 is CSS-first (no JS `presets` array), so the real "preset" is the
 * shipped `preset.css` (`@import "@vegastack/design/preset.css"`), which
 * wires Tailwind + tw-animate-css + the VegaStack token theme + base reset in one
 * import. This module exposes machine-readable metadata for tooling/agents.
 */
export const vegastackPreset = {
  /** The token package this preset is bound to. */
  tokens: "@vegastack/design-tokens",
  /** CSS entry consumers import to get the full setup. */
  css: "@vegastack/design/preset.css",
  /** Tailwind major version this preset targets. */
  tailwind: 4,
} as const;

export type VegastackPreset = typeof vegastackPreset;
