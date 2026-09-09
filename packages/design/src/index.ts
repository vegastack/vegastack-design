import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
// TYPE-ONLY. This entry is server-safe by contract (see the @internal note below and
// tsup.config.ts): it must not touch a React runtime value, because under the
// `react-server` condition most React hooks are `undefined` and any Server Component
// importing `cn` would crash on import. `import type` is erased at build, so `mergeRefs`
// can be typed against React's ref shapes without pulling React into the module graph.
import type * as React from "react";

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
 * THE hover/pressed recipe for a control that sits on a KNOWN surface (page, card, popover, well):
 * hover climbs one rung of the surface ladder, pressing climbs one more. Rows, menu items, ghost and
 * outline buttons, sidebar buttons, toggles, tabs, table rows, pagination — every transparent
 * control — spread this string instead of writing a `hover:bg-*` literal.
 *
 * `hover:` compiles under `@media (hover: hover)` in Tailwind v4, so touch devices keep the rest
 * fill and still get the pressed rung through `active:`. A selected/current state is the SAME rung
 * as pressed (`data-selected:bg-surface-3`), which is why the two are never far apart.
 *
 * @example
 * <button className={cn("rounded-md px-2", surfaceInteractive)} />
 */
export const surfaceInteractive = "hover:bg-surface-2 active:bg-surface-3";

/**
 * The GROUP-SCOPED twin of {@link surfaceInteractive}, for the one geometry where the two rungs
 * cannot live on the interactive element itself: a wash painted by an INNER chip inset from a
 * container hairline (`design.md` §Hover geometry — "a wash is inset ≥4px from a container hairline
 * and inherits its inner radius"). NumberField's steppers are the case: the button is full-height and
 * flush to the field's border, so its own background would run into that hairline; a `size-full` chip
 * inside the button's `p-1` paints the inset wash instead, and it must react to the BUTTON's hover.
 *
 * The group is named `wash` rather than left unnamed so a consumer's own `group` on an ancestor of a
 * copied-in component cannot fire it. Put `group/wash` on the interactive element, this string on the
 * chip. Everything else spreads {@link surfaceInteractive} directly — a group indirection where the
 * element can carry the rungs itself is noise.
 *
 * @example
 * <button className="group/wash p-1">
 *   <span className={cn("size-full rounded-sm", surfaceInteractiveGroup)} />
 * </button>
 */
export const surfaceInteractiveGroup =
  "group-hover/wash:bg-surface-2 group-active/wash:bg-surface-3";

/**
 * The inks a translucent hover/pressed wash can be composited from — the neutral ink and the five
 * chromatic families the Button matrix and its outline/soft variants use.
 */
export type FillTone =
  | "foreground"
  | "primary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "brand";

/**
 * The ALPHA twin of {@link surfaceInteractive}: the same two rungs composited from an ink at
 * `--alpha-hover` / `--alpha-pressed`, for a control whose backdrop is not a ladder surface (a kbd
 * inside a hovered row, a chip on a well, chrome over media) or one that hovers in its OWN hue (the
 * outline/soft status buttons). `foreground` is the neutral twin — it measures within 0.003 L of
 * `surface-2`/`surface-3` on the page in both themes and is AA-gated over page, card and popover.
 *
 * Solid fills do NOT use this: a solid already owns its darker `<tone>-hover` / `<tone>-active`
 * steps (`bg-primary hover:bg-primary-hover active:bg-primary-active`) — an alpha over a solid
 * would only thin it.
 *
 * Every value is a literal so Tailwind's scanner sees it in this file (and in the shipped `dist`,
 * which `preset.css` scans).
 *
 * @example
 * <button className={cn("bg-destructive-subtle text-destructive-text", fillInteractive.destructive)} />
 */
export const fillInteractive: Record<FillTone, string> = {
  foreground:
    "hover:bg-foreground/(--alpha-hover) active:bg-foreground/(--alpha-pressed)",
  primary:
    "hover:bg-primary/(--alpha-hover) active:bg-primary/(--alpha-pressed)",
  destructive:
    "hover:bg-destructive/(--alpha-hover) active:bg-destructive/(--alpha-pressed)",
  success:
    "hover:bg-success/(--alpha-hover) active:bg-success/(--alpha-pressed)",
  warning:
    "hover:bg-warning/(--alpha-hover) active:bg-warning/(--alpha-pressed)",
  info: "hover:bg-info/(--alpha-hover) active:bg-info/(--alpha-pressed)",
  brand: "hover:bg-brand/(--alpha-hover) active:bg-brand/(--alpha-pressed)",
};

/**
 * THE field chrome — the one border/fill/hover/focus/invalid/disabled grammar every text-entry
 * control wears (audit B1-11, 2026-09-07). Input, Textarea, NumberField's input, OTP slots, the
 * Select trigger and the Combobox input all spread this string; before it existed the same nine
 * declarations were copy-pasted in four files and restated a fifth time as slot overrides, so
 * retuning the field meant finding every copy.
 *
 * It is CHROME only — no width, padding, height or type. Those differ per control (a square OTP
 * slot is not `w-full`; a Textarea sizes by min-height, not `--size-*`), so each component adds its
 * own layout and size classes after this string.
 *
 * The three border rungs, in ascending weight:
 * - rest `border-input` (the derived `foreground` alpha hairline),
 * - hover `foreground` at `--alpha-border-subtle` — neutral ink, one step darker, guarded by
 *   `not-disabled:not-data-disabled:` because D7 keeps pointer events ON a disabled control so a
 *   Tooltip can explain it, which would otherwise let a dead field light up under the cursor,
 * - focus `ring` at `--alpha-tint-border`, on plain `focus` (not `focus-visible`) — a raw text field
 *   cannot tell mouse from keyboard, so the tint is the one cue for both. Forced colours erase a
 *   border tint outright, so the outline fallback for that case is written ONCE, unlayered, in
 *   `@vegastack/design-tokens`' `base.css` — never per component.
 *
 * @example
 * <input className={cn(fieldControl, "h-(--size-md) w-full min-w-0 px-3 text-base")} />
 */
export const fieldControl = [
  "rounded-md border border-input bg-transparent dark:bg-input/(--alpha-input)",
  "placeholder:text-muted-foreground-faint",
  "not-disabled:not-data-disabled:hover:border-foreground/(--alpha-border-subtle)",
  "focus:border-ring/(--alpha-tint-border)",
  "aria-invalid:border-destructive-border/(--alpha-tint-border)",
  "data-invalid:border-destructive-border/(--alpha-tint-border)",
  "disabled:cursor-not-allowed disabled:bg-surface-1 disabled:opacity-(--opacity-dim)",
  "data-disabled:cursor-not-allowed data-disabled:bg-surface-1 data-disabled:opacity-(--opacity-dim)",
].join(" ");

/**
 * The WRAPPER twin of {@link fieldControl}: the identical chrome on a bordered group whose state
 * comes from a descendant — Input's prefix/suffix group, NumberField's stepper group, ChipInput and
 * the Combobox input-group. Same three border rungs, read through `focus-within` / `has-*` /
 * Base UI's `data-focused` instead of the control's own pseudo-classes.
 *
 * Every element carrying this string must also carry `data-field-group` (a bare attribute). That is
 * the hook `base.css` uses to paint the forced-colours focus outline on the GROUP: the inner input's
 * own outline would be clipped by the group's `overflow-hidden`, which is exactly how a High
 * Contrast user lost the caret location on an addon field.
 *
 * @example
 * <div data-field-group className={cn(fieldControlGroup, "flex h-(--size-md) items-center")} />
 */
export const fieldControlGroup = [
  "rounded-md border border-input bg-transparent dark:bg-input/(--alpha-input)",
  "not-has-disabled:not-data-disabled:hover:border-foreground/(--alpha-border-subtle)",
  "focus-within:border-ring/(--alpha-tint-border)",
  "data-focused:border-ring/(--alpha-tint-border)",
  "has-aria-invalid:border-destructive-border/(--alpha-tint-border)",
  "data-invalid:border-destructive-border/(--alpha-tint-border)",
  "has-disabled:cursor-not-allowed has-disabled:bg-surface-1 has-disabled:opacity-(--opacity-dim)",
  "data-disabled:cursor-not-allowed data-disabled:bg-surface-1 data-disabled:opacity-(--opacity-dim)",
].join(" ");

/**
 * THE selected-chip recipe — one formula for every "raised chip on a muted track" control:
 * Tabs `pill` and `chip`, `Segmented`, `Toggle` pressed and `ToggleGroup` pressed. Before this
 * existed the four wrote four different selected looks (`bg-background`, `bg-secondary` + hairline,
 * `bg-foreground/10`); audit 2026-09-07 B6-02.
 *
 * The track is the ladder's well rung (`surface-1`); the chip is the PRESSED/SELECTED rung
 * (§Surfaces) expressed in its **alpha** form — `bg-foreground/(--alpha-ink-tint)` composites to
 * within a hair of `surface-3` over the track, and doctrine reaches for the alpha twin exactly here
 * ("a chip on a well"). Being an alpha is also what lets the SELECTED chip keep stepping: a hovered
 * selected chip strengthens to `--alpha-ink-tint-strong` and a pressed one drops back to the resting
 * tint (previewing the release), so no state ever reads as dead — an opaque `surface-3` chip would
 * have nowhere left to climb.
 *
 * Base UI spells "selected" differently per primitive, so the state rules ship as two literal
 * strings rather than a selector parameter (Tailwind v4's scanner only sees literals):
 * {@link selectedChipVariants.pressed} for Toggle/ToggleGroup/Segmented (`data-pressed`) and
 * {@link selectedChipVariants.active} for Tabs (`data-active`). The unselected steps are guarded by
 * the matching `not-*` variant so the two sets are mutually exclusive and never race on specificity.
 *
 * @example
 * <div className={cn("rounded-md p-0.5", selectedChipVariants.track)}>
 *   <Toggle className={cn("rounded-sm", selectedChipVariants.item, selectedChipVariants.pressed)} />
 * </div>
 */
export const selectedChipVariants = {
  /** The muted track the chips sit in — the ladder's well rung. */
  track: "bg-surface-1",
  /**
   * Chrome shared by every chip: a transparent hairline reserved at rest (so selecting adds no
   * layout shift) and the muted→ink text step.
   */
  item: "border border-transparent hover:text-foreground",
  /** Selected keyed on Base UI's `data-pressed` — Toggle, ToggleGroup, Segmented. */
  pressed:
    "not-data-pressed:hover:bg-foreground/(--alpha-hover) not-data-pressed:active:bg-foreground/(--alpha-pressed) data-pressed:border-border data-pressed:bg-foreground/(--alpha-ink-tint) data-pressed:text-foreground data-pressed:hover:bg-foreground/(--alpha-ink-tint-strong) data-pressed:active:bg-foreground/(--alpha-ink-tint)",
  /** Selected keyed on Base UI's `data-active` — Tabs. */
  active:
    "not-data-[active]:hover:bg-foreground/(--alpha-hover) not-data-[active]:active:bg-foreground/(--alpha-pressed) data-[active]:border-border data-[active]:bg-foreground/(--alpha-ink-tint) data-[active]:text-foreground data-[active]:hover:bg-foreground/(--alpha-ink-tint-strong) data-[active]:active:bg-foreground/(--alpha-ink-tint)",
} as const;

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
