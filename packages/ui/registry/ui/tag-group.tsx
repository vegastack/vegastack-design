// @vegastack tag-group@0.6.0 sha256-TYHxQwKu8kw71eppG4PKz2uw4qSfHepU42FsmGA/f88=

"use client";

import * as React from "react";
import { cn, surfaceInteractive } from "@vegastack/design";
import { Chip, type ChipHue } from "@/components/ui/chip";

/* ------------------------------------------------------------------------------------------------
 * TagGroup / Tag — the record-tag system (Wave 2c, from the app-teardown categories-field
 * pattern): hue-tinted chips on the 10-hue `--tag-*` token palette with a `+N` overflow chip and
 * inline expansion. Distinct from `Badge`: a Badge is a STATUS voice (5 semantic intents, pill),
 * a Tag is a LABEL voice (10 decorative hues, pill-shaped, removable, overflows in groups).
 *
 * A `Tag` IS a `Chip` at the inline (`sm`) tier (audit 2026-09-07, B5-03): the hue formula, the
 * geometry and the real 24×24 remove control all live in `chip.tsx` now, and this file owns only
 * what is genuinely about a GROUP of tags — the `+N` overflow disclosure and the focus move that
 * has to follow it.
 * ----------------------------------------------------------------------------------------------*/

/** Props for the decorative {@link Tag} label chip. */
export interface TagProps extends React.ComponentPropsWithRef<"span"> {
  /**
   * Chip hue from the tag palette. Decorative label color — never a status
   * signal (that's `Badge`'s job).
   * @default 'neutral'
   */
  hue?: ChipHue;
  /**
   * Render a remove affordance and call this when it is activated. The button
   * is labelled "Remove {label}" from the tag's text content via `removeLabel`.
   * @default undefined
   */
  onRemove?: () => void;
  /**
   * Accessible label for the remove button. Provide a specific label when `onRemove` is set.
   * @default 'Remove tag'
   */
  removeLabel?: string;
}

/**
 * `Tag` — one label chip: the {@link Chip} primitive at the inline (`sm`) tier. Compose a leading
 * icon as the first child; pass `onRemove` (+ `removeLabel`) for an editable tag field.
 *
 * @example
 * <Tag hue="blue" onRemove={() => removeTag('API')} removeLabel="Remove API">API</Tag>
 */
export function Tag({
  className,
  hue = "neutral",
  onRemove,
  removeLabel,
  children,
  ref,
  ...props
}: TagProps) {
  return (
    <Chip
      ref={ref}
      data-slot="tag"
      hue={hue}
      size="sm"
      onRemove={onRemove}
      removeLabel={removeLabel ?? "Remove tag"}
      className={className}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
    </Chip>
  );
}

/** Props for a wrapping {@link TagGroup} list with optional overflow collapsing. */
export interface TagGroupProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Collapse the group past this many tags behind a `+N` chip; activating it
   * expands the group inline (the "View all values" pattern). Omit to always
   * show every tag.
   * @default undefined
   */
  max?: number;
  /**
   * Accessible label for the group list.
   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Accessible label for the expand chip.
   * @default `Show ${hiddenCount} more tags`
   */
  expandLabel?: string;
}

/**
 * `TagGroup` — a wrapping row of `Tag` chips with optional `+N` overflow
 * collapsing. Renders `role="list"` (each tag wrapped as a `listitem`) so
 * assistive tech announces the tag count; the `+N` chip is a real button.
 *
 * @example
 * <TagGroup max={3} aria-label="Categories">
 *   <Tag hue="yellow">Information Technology</Tag>
 *   <Tag hue="blue">B2B</Tag>
 *   <Tag hue="green">SaaS</Tag>
 *   <Tag hue="purple">Enterprise</Tag>
 * </TagGroup>
 */
export function TagGroup({
  className,
  max,
  expandLabel,
  children,
  ref,
  ...props
}: TagGroupProps) {
  const [expanded, setExpanded] = React.useState(false);
  const items = React.Children.toArray(children);
  const limit = max != null && max >= 1 && !expanded ? max : items.length;
  const visible = items.slice(0, limit);
  const hiddenCount = items.length - visible.length;

  // Expanding UNMOUNTS the `+N` button (hiddenCount drops to 0). A keyboard or screen-reader user
  // who activated it would lose focus to <body> — the page context is gone and nothing announces
  // what changed. So focus moves to the first newly revealed tag, which both keeps a sensible
  // position in the list and makes assistive tech read the content that just appeared.
  // `tabIndex={-1}` keeps it programmatically focusable without adding a tab stop.
  const firstRevealedRef = React.useRef<HTMLSpanElement | null>(null);
  const focusOnExpandRef = React.useRef(false);
  const firstRevealedIndex = max != null && max >= 1 ? max : -1;
  React.useEffect(() => {
    if (!expanded || !focusOnExpandRef.current) return;
    focusOnExpandRef.current = false;
    firstRevealedRef.current?.focus();
  }, [expanded]);

  return (
    <div
      ref={ref}
      role="list"
      data-slot="tag-group"
      data-expanded={expanded ? "" : undefined}
      className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}
      {...props}
    >
      {visible.map((child, i) => (
        <span
          role="listitem"
          className="inline-flex min-w-0"
          key={i}
          ref={i === firstRevealedIndex ? firstRevealedRef : undefined}
          tabIndex={i === firstRevealedIndex ? -1 : undefined}
        >
          {child}
        </span>
      ))}
      {hiddenCount > 0 ? (
        // A list may only contain listitems (aria-required-children), so the
        // overflow control rides inside one. No aria-expanded: the button
        // REPLACES itself with the expanded tags rather than toggling a region.
        <span role="listitem" className="inline-flex">
          {/* The overflow control IS a chip — one geometry, and the whole pill is the pointer
              target, so the 24px floor is met by the real box with nothing to clip. It is the
              one interactive chip in the system, so it is also the one that carries the
              hover/pressed recipe; a plain Tag has neither, because clicking one does nothing.

              `min-w-(--size-sm)` is load-bearing, not decoration: a chip is `w-fit`, and "+2"
              at the sm tier measures 23.8px wide — under the 24px floor, which the contract
              lane caught. Flooring the width at the tier's own height makes the short cases a
              circle and lets longer counts ("+12") grow past it. */}
          <Chip
            size="sm"
            data-slot="tag-group-overflow"
            render={<button type="button" />}
            aria-label={expandLabel ?? `Show ${hiddenCount} more tags`}
            onClick={() => {
              focusOnExpandRef.current = true;
              setExpanded(true);
            }}
            className={cn(
              "min-w-(--size-sm) justify-center text-muted-foreground select-none hover:text-foreground",
              surfaceInteractive,
            )}
          >
            +{hiddenCount}
          </Chip>
        </span>
      ) : null}
    </div>
  );
}
