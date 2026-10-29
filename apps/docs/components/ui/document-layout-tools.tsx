// @vegastack document-layout@0.25.104 sha256-b7exp+HzwZ8CYzNXSY3NLoMQWGpOv+7lKi04geYYpz8=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

/* ------------------------------------------------------------------------------------------------
 * The tools a document page lays over or around its text: a find bar docked at the top of the
 * text, a cue pinned to the bottom of the view that jumps to something new, a floating action for
 * a phone, starter chips for an empty page and a note under the text. Client parts of
 * `document-layout`.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `DocumentLayoutFindBar`. */
export interface DocumentLayoutFindBarProps {
  /** The query. */
  value: string;
  /** Called with the query as it is typed. */
  onValueChange: (value: string) => void;
  /**
   * Where the find stands ("3 of 12", "No matches"); nothing while the query is empty.
   * @default undefined
   */
  status?: string;
  /** There are matches to step through (Previous and Next are disabled without). */
  hasMatches: boolean;
  /** The previous match (also Shift+Enter in the field). */
  onPrevious: () => void;
  /** The next match (also Enter in the field). */
  onNext: () => void;
  /** Closes the find (also Escape in the field). */
  onClose: () => void;
  /** Focus the field when the bar mounts. @default false */
  autoFocus?: boolean;
  /**
   * The CSS Custom Highlight names the host paints its matches under: every match on a light
   * primary tint, the current one in the primary ink. @default undefined (the host paints its own)
   */
  highlights?: { all: string; current: string };
  /** The bar's accessible name and the field's. @default "Find in page" */
  label?: string;
  /** Classes for the bar. @default undefined */
  className?: string;
}

/** CSS identifier characters only: a highlight name is written into a stylesheet. */
const HIGHLIGHT_NAME = /^[A-Za-z_][\w-]*$/;

/**
 * `DocumentLayoutFindBar` — find in a document's text: a search field docked at the top of the
 * text on a band of the page's own background (text scrolling under it never shows around the
 * field), with where the find stands ("3 of 12") and Previous, Next and Close. Enter steps on,
 * Shift+Enter back, Escape closes. The host finds the matches; with `highlights` the bar paints
 * them (the CSS Custom Highlight API). Put it at the top of `DocumentLayoutBody`. Hidden in print.
 *
 * @example
 * <DocumentLayoutFindBar value={query} onValueChange={setQuery} status="3 of 12" hasMatches
 *   onPrevious={back} onNext={on} onClose={close} highlights={{ all: "find", current: "find-now" }} />
 */
export function DocumentLayoutFindBar({
  value,
  onValueChange,
  status,
  hasMatches,
  onPrevious,
  onNext,
  onClose,
  autoFocus = false,
  highlights,
  label = "Find in page",
  className,
}: DocumentLayoutFindBarProps) {
  const paint =
    highlights &&
    HIGHLIGHT_NAME.test(highlights.all) &&
    HIGHLIGHT_NAME.test(highlights.current)
      ? `::highlight(${highlights.all}){background-color:color-mix(in oklab,var(--primary) 15%,transparent)}::highlight(${highlights.current}){background-color:var(--primary);color:var(--primary-foreground)}`
      : null;
  return (
    <div
      data-slot="document-layout-find-bar"
      role="search"
      aria-label={label}
      className={cn(
        "sticky top-0 z-10 -mx-2 flex justify-end self-stretch bg-background px-2 py-2 print:hidden",
        className,
      )}
    >
      {/* Keyed by both names (`|` never appears in one): React never updates a hoisted style in
          place. */}
      {paint ? (
        <style
          href={`document-layout-find:${highlights!.all}|${highlights!.current}`}
          precedence="default"
        >
          {paint}
        </style>
      ) : null}
      <InputGroup className="w-full max-w-sm bg-background shadow-sm">
        <InputGroupAddon align="inline-start" aria-hidden>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label={label}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            // An IME's Enter confirms its candidate, not a find step.
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === "Enter") {
              event.preventDefault();
              if (!hasMatches) return;
              if (event.shiftKey) onPrevious();
              else onNext();
            } else if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
          className="[&::-webkit-search-cancel-button]:hidden"
        />
        <InputGroupAddon align="inline-end" className="gap-0.5 pe-1">
          {/* Mounted from the start, empty until there is something to say, so the first count
              ("3 of 12", "No matches") is announced. */}
          <InputGroupText
            role="status"
            aria-atomic="true"
            data-slot="document-layout-find-status"
            className="me-1 text-xs whitespace-nowrap tabular-nums empty:sr-only"
          >
            {status ?? ""}
          </InputGroupText>
          <InputGroupButton
            size="icon-xs"
            aria-label="Previous match"
            disabled={!hasMatches}
            onClick={onPrevious}
          >
            <ChevronUp aria-hidden />
          </InputGroupButton>
          <InputGroupButton
            size="icon-xs"
            aria-label="Next match"
            disabled={!hasMatches}
            onClick={onNext}
          >
            <ChevronDown aria-hidden />
          </InputGroupButton>
          <InputGroupButton
            size="icon-xs"
            aria-label="Close find"
            onClick={onClose}
          >
            <X aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

/** Props accepted by `DocumentLayoutJumpCue`. */
export type DocumentLayoutJumpCueProps = React.ComponentProps<typeof Button>;

/**
 * `DocumentLayoutJumpCue` — "2 new comments ↓": a small pill pinned to the bottom of the view
 * over the text while something new is out of sight; a press jumps to it. It takes no room (a
 * zero-height sticky band), so showing it moves nothing. Hidden in print.
 *
 * @example
 * <DocumentLayoutJumpCue onClick={jump}>2 new comments<ArrowDown aria-hidden /></DocumentLayoutJumpCue>
 */
export function DocumentLayoutJumpCue({
  className,
  ...props
}: DocumentLayoutJumpCueProps) {
  return (
    <div
      data-slot="document-layout-jump-cue"
      // `items-end` sits the pill on the band's bottom edge, rising above it — not `-translate-y-full`
      // on the Button, whose press nudge sets `translate-y` and would drop the pill by its height.
      className="pointer-events-none sticky bottom-6 z-10 flex h-0 items-end justify-center print:hidden"
    >
      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "pointer-events-auto rounded-full border border-border shadow-md",
          className,
        )}
        {...props}
      />
    </div>
  );
}

/** Props accepted by `DocumentLayoutStarters`. */
export interface DocumentLayoutStartersProps extends React.ComponentPropsWithRef<"div"> {
  /** The row's lead-in, before the chips ("Start from:"). */
  label: React.ReactNode;
}

/**
 * `DocumentLayoutStarters` — a row of ways to start an empty page ("Start from: Meeting notes ·
 * Spec · More templates…"): its lead-in in the muted ink, then `DocumentLayoutStarter` pills. A
 * named group; hidden in print.
 *
 * @example
 * <DocumentLayoutStarters label="Start from:" aria-label="Start from a template">
 *   <DocumentLayoutStarter onClick={pick}>Meeting notes</DocumentLayoutStarter>
 *   <DocumentLayoutStarter more onClick={browse}><LayoutTemplate aria-hidden />More templates…</DocumentLayoutStarter>
 * </DocumentLayoutStarters>
 */
export function DocumentLayoutStarters({
  label,
  className,
  children,
  ...props
}: DocumentLayoutStartersProps) {
  return (
    <div
      role="group"
      data-slot="document-layout-starters"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground print:hidden",
        className,
      )}
      {...props}
    >
      <span className="me-1">{label}</span>
      {children}
    </div>
  );
}

/** Props accepted by `DocumentLayoutStarter`. */
export interface DocumentLayoutStarterProps extends React.ComponentProps<
  typeof Button
> {
  /** The row's last pill, quieter: the way to every other start ("More templates…"). @default false */
  more?: boolean;
}

/**
 * `DocumentLayoutStarter` — one way to start the page: an outline pill (`more`: a quiet ghost
 * pill, for the way to the rest).
 *
 * @example
 * <DocumentLayoutStarter loading={pending} onClick={pick}>Spec</DocumentLayoutStarter>
 */
export function DocumentLayoutStarter({
  more = false,
  className,
  ...props
}: DocumentLayoutStarterProps) {
  return (
    <Button
      variant={more ? "ghost" : "outline"}
      size="sm"
      data-slot="document-layout-starter"
      className={cn(
        "rounded-full font-normal",
        more && "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutNote`. */
export type DocumentLayoutNoteProps = React.ComponentPropsWithRef<"p">;

/**
 * `DocumentLayoutNote` — a quiet line under the text ("@Sanjay can't see this page yet"): 12px,
 * muted, 8px below what it follows. Hidden in print.
 *
 * @example
 * <DocumentLayoutNote>{hint}</DocumentLayoutNote>
 */
export function DocumentLayoutNote({
  className,
  ...props
}: DocumentLayoutNoteProps) {
  return (
    <p
      data-slot="document-layout-note"
      className={cn(
        "mt-2 text-xs text-muted-foreground print:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutDecisionBar`. */
export interface DocumentLayoutDecisionBarProps extends React.ComponentPropsWithRef<"div"> {
  /** The bar's accessible name ("Your review"). */
  "aria-label": string;
}

/**
 * `DocumentLayoutDecisionBar` — a decision the reader owes the page ("Asha asked you to review
 * this page · Request changes · Approve"): a card-surface bar that sticks under the top bar while
 * the page scrolls, and on a phone floats at the bottom of the window, clear of the home
 * indicator — the layout's floating buttons (`DocumentLayoutFloatingButton`,
 * `DocumentLayoutContentsButton`) then float above it. A named region; hidden in print. Hold a `DocumentLayoutDecisionBarText` and
 * `DocumentLayoutDecisionBarActions`.
 *
 * @example
 * <DocumentLayoutDecisionBar aria-label="Your review">
 *   <DocumentLayoutDecisionBarText>Asha asked you to review this page</DocumentLayoutDecisionBarText>
 *   <DocumentLayoutDecisionBarActions><Button size="sm">Approve</Button></DocumentLayoutDecisionBarActions>
 * </DocumentLayoutDecisionBar>
 */
export function DocumentLayoutDecisionBar({
  ref,
  className,
  ...props
}: DocumentLayoutDecisionBarProps) {
  const own = React.useRef<HTMLDivElement>(null);
  const refs = React.useMemo(() => mergeRefs<HTMLDivElement>(own, ref), [ref]);
  // Where the room under the page's end goes: the layout's grid, found once mounted.
  const [grid, setGrid] = React.useState<HTMLElement | null>(null);
  // Publishes its height (and an 8px gap) on the layout, so its floating buttons clear it on a
  // phone however tall a wrapped prompt or a row of answers makes it.
  React.useLayoutEffect(() => {
    const bar = own.current;
    const layout = bar?.closest<HTMLElement>("[data-slot=document-layout]");
    if (!bar || !layout) return;
    setGrid(
      layout.querySelector<HTMLElement>("[data-slot=document-layout-grid]"),
    );
    const publish = () =>
      layout.style.setProperty(
        "--document-layout-dock",
        `${bar.offsetHeight + 8}px`,
      );
    publish();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(publish);
    observer?.observe(bar);
    return () => {
      observer?.disconnect();
      layout.style.removeProperty("--document-layout-dock");
    };
  }, []);
  return (
    <>
      {/* On a phone the bar floats over the window's bottom: this keeps that much room under the
          page's end (the grid's last row), so its last lines scroll clear of the bar. */}
      {grid
        ? createPortal(
            <div
              aria-hidden
              data-slot="document-layout-dock-space"
              className="col-[text] row-start-4 hidden h-[calc(var(--document-layout-dock,0px)+--spacing(3)+env(safe-area-inset-bottom))] max-sm:block print:hidden"
            />,
            grid,
          )
        : null}
      <div
        ref={refs}
        role="region"
        data-slot="document-layout-decision-bar"
        className={cn(
          // Under the 56px top bar while the text scrolls, 24px above the text it leads (the gap the
          // header keeps from the text); on a phone, floating at the bottom (no margin there: a fixed
          // box's margin would lift it off its inset).
          "sticky top-14 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm print:hidden",
          "sm:mb-6 max-sm:fixed max-sm:inset-x-3 max-sm:top-auto max-sm:bottom-[calc(--spacing(3)+env(safe-area-inset-bottom))]",
          className,
        )}
        {...props}
      />
    </>
  );
}

/**
 * `DocumentLayoutDecisionBarText` — what is asked, taking the bar's free width.
 *
 * @example
 * <DocumentLayoutDecisionBarText>Asha asked you to review this page</DocumentLayoutDecisionBarText>
 */
export function DocumentLayoutDecisionBarText({
  className,
  ...props
}: React.ComponentPropsWithRef<"p">) {
  return (
    <p
      data-slot="document-layout-decision-bar-text"
      className={cn("min-w-0 flex-1", className)}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutDecisionBarActions` — the answers; on a phone a full row, spread to its ends.
 *
 * @example
 * <DocumentLayoutDecisionBarActions><Button size="sm">Approve</Button></DocumentLayoutDecisionBarActions>
 */
export function DocumentLayoutDecisionBarActions({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="document-layout-decision-bar-actions"
      className={cn(
        "flex flex-wrap gap-2 max-sm:w-full max-sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}
