import { clsx, type ClassValue } from "clsx";
import { twMerge as tailwindMerge } from "tailwind-merge";
// TYPE-ONLY. This entry is server-safe by contract (see the @internal note below and
// tsup.config.ts): it must not touch a React runtime value, because under the
// `react-server` condition most React hooks are `undefined` and any Server Component
// importing `cn` would crash on import. `import type` is erased at build, so `mergeRefs`
// can be typed against React's ref shapes without pulling React into the module graph.
import type * as React from "react";

// Plain `twMerge`. Before the shadcn reset this was `extendTailwindMerge`, teaching tailwind-merge
// that the deleted role tokens (the h1-h4 tier, the label tier, the code tier, the mono label and
// the display tier) were FONT SIZES rather than text colours — without it a role plus a colour
// silently
// dropped the size. TYP-1 is decided as **shadcn**, so those roles no longer exist and the stock
// classifier is correct again: there is no custom font-size utility left to teach it about.
const twMerge = tailwindMerge;

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
 * cn('text-foreground', isError && 'text-destructive-text')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };

/**
 * DELETED BY THE SHADCN RESET (Batch 1, 2026-09-18), with no replacement and no alias
 * (mandate § 1, non-negotiable 2): `"hover:bg-accent"`, `"group-hover/wash:bg-accent"`,
 * the family's own hover wash, `FillTone`, `"rounded-lg border border-input bg-transparent transition-colors outline-none placeholder:text-muted-foreground focus:border-ring/70 not-focus:aria-invalid:border-destructive not-focus:data-invalid:border-destructive disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80"`, `"rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring/70 data-focused:border-ring/70 not-focus-within:aria-invalid:border-destructive not-focus-within:has-aria-invalid:border-destructive not-focus-within:data-invalid:border-destructive has-disabled:cursor-not-allowed has-disabled:bg-input/50 has-disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 dark:bg-input/30"` and the selected-chip recipe.
 *
 * Every one of them was a shared class-string recipe over the surface ladder, the alpha ladder and
 * the `<family>-subtle` tokens — the vocabulary this reset removes. COL-4/COL-5/COL-6/COL-8/COL-9
 * and FRM-1 are all decided as **shadcn**, which means the component, not a shared constant, owns
 * its own hover and pressed chrome, exactly as upstream writes it. The call sites were migrated to
 * upstream's own strings in this batch; Batches 2-7 replace those components with upstream's files.
 */

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
  /**
   * Hover delay before a tooltip opens. A tooltip is a cheap label, not a preview, so it is
   * deliberately much faster than {@link TIMINGS.hoverOpenDelayMs} — long enough that sweeping
   * across a toolbar does not flash five tips, short enough that a deliberate hover feels
   * instant. Base UI's `Tooltip.Provider` grouping then opens adjacent tips with no delay at
   * all. Set once, in the app-root provider.
   */
  tooltipOpenDelayMs: 300,
  /**
   * Delay before a tooltip closes. Zero: a tooltip has nothing to travel into (it is not
   * hoverable content, unlike a HoverCard), so holding it after the pointer leaves only
   * obscures what the user moved on to.
   */
  tooltipCloseDelayMs: 0,
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

/**
 * The prose recipe — one token vocabulary for rendered rich text, worn by `MarkdownView`'s root and
 * `TextEdit`'s editor surface so both render identical computed styles (audit B4-09). See
 * `./prose.ts` for why it is expressed as descendant variants rather than per-element classes.
 */
export { prose, proseClassName, type ProseElement } from "./prose";

/**
 * Fan one DOM node out to several refs — a forwarded `ref` prop plus one or more internal
 * refs — as a single ref callback. Skips `null`/`undefined` entries, so an optional
 * forwarded ref needs no guard at the call site. Handles both ref shapes React 19 accepts:
 * a callback ref is invoked, an object ref has its `.current` assigned.
 *
 * This lives in `@vegastack/design` rather than in any one component because ref-as-prop
 * (React 19, no `forwardRef`) makes "the component needs the node AND has to forward it"
 * the normal case, not a special one — it was hand-inlined in nine registry files and
 * exported from `use-animation-replay` before this. It touches no React runtime value
 * (only ref objects the caller already holds), so it is server-safe like `cn`.
 *
 * **Not memoized.** Calling it produces a NEW function every time, and React detaches a
 * changed ref callback (calls it with `null`) and reattaches it on every render. Wrap the
 * CALL at the call site when the inputs are stable:
 *
 * @example
 * const mergedRef = React.useMemo(() => mergeRefs(ref, internalRef), [ref]);
 * return <input ref={mergedRef} />;
 *
 * @example
 * // A ref callback that also does work — merge it with the forwarded ref
 * const setRef = React.useCallback(
 *   (node: HTMLDivElement | null) => { setContainer(node); },
 *   [],
 * );
 * const mergedRef = React.useMemo(() => mergeRefs(ref, setRef), [ref, setRef]);
 */
export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | null | undefined>
): React.RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.RefObject<T | null>).current = node;
      }
    }
  };
}
