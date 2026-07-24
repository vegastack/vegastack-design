import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge extended to treat EVERY custom design-token font size as a
 * font-size utility: the role tokens (`text-h1`…`text-h4`, `text-label*`,
 * `text-code*`, `text-mono-label`) and the display tier (`text-display-*`).
 * Without this, tailwind-merge misclassifies them as `text-{color}` and
 * strips them whenever they co-occur with a real color (e.g.
 * `text-h1 text-foreground`), silently dropping the size — the T1 rollout
 * hit exactly this in MarkdownView, and Phase B hit it again with
 * `text-mono-label text-brand` on the marketing CTA button variant
 * (`text-mono-label` was getting bucketed into the SAME text-color group as
 * `text-brand` and losing the conflict, since it's the earlier class).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "h1",
            "h2",
            "h3",
            "h4",
            "label",
            "label-sm",
            "code",
            "code-sm",
            "mono-label",
            "display-sm",
            "display-md",
            "display-lg",
            "display-xl",
          ],
        },
      ],
    },
  },
});

/**
 * Merges Tailwind CSS class names with intelligent conflict resolution.
 *
 * Combines `clsx` for conditional classes and `tailwind-merge` to handle
 * conflicting Tailwind utilities (e.g., `px-2` and `px-4` → keeps last one).
 *
 * @param inputs - Class names, objects, arrays, or conditional values
 * @returns Merged and deduplicated class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4'
 * cn('text-foreground', isError && 'text-destructive')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };

/**
 * @internal Registry theme-scope plumbing lives at `@vegastack/design/theme-scope`, NOT here.
 * It calls `React.createContext()` at module scope, which is `undefined` under the `react-server`
 * condition — re-exporting it from this entry would make every Server Component that imports
 * `cn` crash on import. This entry stays server-safe by contract (see tsup.config.ts).
 * Product code should use `MarketingSurface` rather than either symbol.
 */

/**
 * Interaction timing constants (ms) — design decisions, not magic numbers (register P2-14).
 * Single source for every JS-driven delay in the registry; change one value and every
 * component that expresses that role follows.
 */
export const TIMINGS = {
  /** How long transient success feedback holds before reverting (CopyButton "Copied ✓"). */
  feedbackRevertMs: 1500,
  /** Debounce before auto-persisting a text field (AutoSaveInput). */
  autoSaveDebounceMs: 800,
  /** Hover delay before a rich preview (HoverCard) opens — guards accidental opens. */
  hoverOpenDelayMs: 700,
  /** Hover delay before a rich preview closes — lets the pointer travel into the card. */
  hoverCloseDelayMs: 300,
} as const;

/**
 * Floating-surface positioning constants (px) — the unified sideOffset/collisionPadding
 * pair (register P2-14). Two offset roles, one collision padding:
 * - `sideOffsetAttached` (4): menu-like popups that read as attached to their trigger
 *   (dropdown, context menu, select, emoji picker).
 * - `sideOffsetDetached` (8): floating panels that read as detached (popover, hover-card,
 *   tooltip).
 * Submenus deliberately use 0 (flush) and are not part of this contract.
 */
export const FLOATING = {
  sideOffsetAttached: 4,
  sideOffsetDetached: 8,
  collisionPadding: 8,
} as const;
