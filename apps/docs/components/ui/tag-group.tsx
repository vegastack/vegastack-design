// @vegastack tag-group@0.4.1 sha256-6YvjIP4LswI1x2xdD8hLt/CCGlf2U4NUgBOp+rR4MNU=

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * TagGroup / Tag — the record-tag system (Wave 2c, from the app-teardown categories-field
 * pattern): hue-tinted chips on the 10-hue `--tag-*` token palette with a `+N` overflow chip and
 * inline expansion. Distinct from `Badge`: a Badge is a STATUS voice (5 semantic intents, pill),
 * a Tag is a LABEL voice (10 decorative hues, pill-shaped, removable, overflows in groups).
 *
 * The chip formula (both themes, AA-gated in contrast-check.mjs): `tag-{hue}-subtle` fill +
 * `tag-{hue}-text` text + a hairline border of the hue text at the outline alpha — the crisp
 * bordered-tint read the teardown found on every Attio tag surface.
 * ----------------------------------------------------------------------------------------------*/

/** The tag hues — the 10-hue token palette plus the neutral `muted` chip. */
export type TagHue =
  | "neutral"
  | "blue"
  | "cyan"
  | "green"
  | "lime"
  | "yellow"
  | "orange"
  | "red"
  | "pink"
  | "magenta"
  | "purple";

/** Static class literals per hue (full strings so the Tailwind scanner sees them). */
const HUE_CLASSES: Record<TagHue, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  blue: "bg-tag-blue-subtle text-tag-blue-text border-tag-blue-text/(--alpha-outline-border)",
  cyan: "bg-tag-cyan-subtle text-tag-cyan-text border-tag-cyan-text/(--alpha-outline-border)",
  green:
    "bg-tag-green-subtle text-tag-green-text border-tag-green-text/(--alpha-outline-border)",
  lime: "bg-tag-lime-subtle text-tag-lime-text border-tag-lime-text/(--alpha-outline-border)",
  yellow:
    "bg-tag-yellow-subtle text-tag-yellow-text border-tag-yellow-text/(--alpha-outline-border)",
  orange:
    "bg-tag-orange-subtle text-tag-orange-text border-tag-orange-text/(--alpha-outline-border)",
  red: "bg-tag-red-subtle text-tag-red-text border-tag-red-text/(--alpha-outline-border)",
  pink: "bg-tag-pink-subtle text-tag-pink-text border-tag-pink-text/(--alpha-outline-border)",
  magenta:
    "bg-tag-magenta-subtle text-tag-magenta-text border-tag-magenta-text/(--alpha-outline-border)",
  purple:
    "bg-tag-purple-subtle text-tag-purple-text border-tag-purple-text/(--alpha-outline-border)",
};

/** Props for the decorative {@link Tag} label chip. */
export interface TagProps extends React.ComponentPropsWithRef<"span"> {
  /**
   * Chip hue from the tag palette. Decorative label color — never a status
   * signal (that's `Badge`'s job).
   * @default 'neutral'
   */
  hue?: TagHue;
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
 * `Tag` — one label chip. Compose a leading icon as the first child; pass
 * `onRemove` (+ `removeLabel`) for an editable tag field.
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
    <span
      ref={ref}
      data-slot="tag"
      data-hue={hue}
      className={cn(
        "inline-flex h-5 w-fit max-w-full min-w-0 shrink-0 items-center gap-1 rounded-full border px-1.5 text-label-sm whitespace-nowrap",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-compact)",
        HUE_CLASSES[hue],
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel ?? "Remove tag"}
          onClick={onRemove}
          className={cn(
            // 24px touch target via an invisible hit-area; the glyph stays compact.
            "relative inline-flex shrink-0 appearance-none items-center justify-center rounded-(--radius-xs) opacity-(--opacity-hint) transition-opacity duration-fast ease-standard before:absolute before:-inset-2 before:content-[''] hover:opacity-100",
          )}
        >
          <X aria-hidden />
        </button>
      ) : null}
    </span>
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
          <button
            type="button"
            data-slot="tag-group-overflow"
            aria-label={expandLabel ?? `Show ${hiddenCount} more tags`}
            onClick={() => {
              focusOnExpandRef.current = true;
              setExpanded(true);
            }}
            className={cn(
              // The interactive box owns a true 24px target. Its child keeps
              // the visible overflow chip at the compact 20px tag height, so
              // clipping ancestors cannot erase an out-of-bounds pseudo target.
              "inline-flex h-(--size-xs) min-w-(--size-xs) shrink-0 appearance-none items-center justify-center rounded-full text-label-sm text-muted-foreground select-none",
              "hover:text-foreground hover:[&>span]:bg-muted",
            )}
          >
            <span className="inline-flex h-5 items-center rounded-full border border-border bg-transparent px-1.5">
              +{hiddenCount}
            </span>
          </button>
        </span>
      ) : null}
    </div>
  );
}
