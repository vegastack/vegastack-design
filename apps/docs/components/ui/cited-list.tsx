// @vegastack cited-list@0.27.0 sha256-hjHwyaKWvgXyXJaWaNOeQbfOdXRiQWpJLLgitZoKgWk=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * CitedList — an answer as numbered points, each point a sentence followed by the sources it
 * rests on. The citations follow the sentence after a real space (never glued to its last word)
 * and stay together as one wrapping group. A Citation is a small muted chip: an inline-block cut
 * with an ellipsis, `overflow: clip` so it keeps the text's own baseline, an optional 1em icon
 * nudged down by `-0.125em`. It is a link by default and takes Base UI's `render` prop, so a host
 * can render a router link or a button (a "play from here" control) with the same look.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CitedList`. */
export type CitedListProps = React.ComponentPropsWithRef<"ol">;

/**
 * `CitedList` — a numbered list of cited points.
 *
 * @example
 * <CitedList>
 *   <CitedListItem citations={<Citation href="/source/1">Source 1</Citation>}>
 *     The launch moved to May.
 *   </CitedListItem>
 * </CitedList>
 */
export function CitedList({ className, ...props }: CitedListProps) {
  return (
    <ol
      data-slot="cited-list"
      className={cn(
        "flex list-decimal flex-col gap-1.5 ps-5 text-sm leading-relaxed tabular-nums marker:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Props for `CitedListItem`. */
export interface CitedListItemProps extends React.ComponentPropsWithRef<"li"> {
  /** The sources this point rests on, usually `Citation`s, shown after the text. @default undefined */
  citations?: React.ReactNode;
}

/**
 * `CitedListItem` — one point: its sentence (which may hold links), then its citations.
 *
 * @example
 * <CitedListItem citations={<Citation href="/source/1">Source 1</Citation>}>
 *   The launch moved to May.
 * </CitedListItem>
 */
export function CitedListItem({
  citations,
  className,
  children,
  ...props
}: CitedListItemProps) {
  const hasCitations =
    citations !== undefined && citations !== null && citations !== false;
  return (
    <li
      data-slot="cited-list-item"
      className={cn("ps-1", className)}
      {...props}
    >
      {children}
      {hasCitations ? (
        <>
          {" "}
          <span
            data-slot="cited-list-citations"
            className="ms-1 inline-flex flex-wrap gap-x-1 gap-y-2 align-baseline"
          >
            {citations}
          </span>
        </>
      ) : null}
    </li>
  );
}

/** Props for `Citation`. */
export interface CitationProps extends useRender.ComponentProps<"a"> {
  /** A leading glyph, drawn at 1em on the label's baseline. @default undefined */
  icon?: React.ReactNode;
}

/**
 * `Citation` — a small muted link chip naming one source. An `<a>` by default; pass `render` for a
 * router link or a `<button>`.
 *
 * @example
 * <Citation href="/notes/12" icon={<FileText />}>Kickoff notes</Citation>
 * <Citation render={<button type="button" onClick={play} />}>12:04</Citation>
 */
export function Citation({
  icon,
  className,
  children,
  render,
  ...props
}: CitationProps) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "relative inline-block max-w-56 overflow-x-clip text-ellipsis whitespace-nowrap rounded-sm bg-muted px-1.5 align-baseline text-xs leading-5 text-muted-foreground no-underline transition-colors state-layer hover:text-foreground before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
          className,
        ),
        children: (
          <>
            {icon ? (
              <span
                data-slot="citation-icon"
                aria-hidden
                className="me-1 inline-block size-[1em] shrink-0 align-[-0.125em] [&>svg]:size-full"
              >
                {icon}
              </span>
            ) : null}
            {children}
          </>
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "citation",
    },
  });
}
