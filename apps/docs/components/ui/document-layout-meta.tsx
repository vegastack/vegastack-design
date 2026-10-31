// @vegastack document-layout@0.26.4 sha256-VOQyQXAivI4hiaE/+y4GGEYwaci76A4yWCzWR8RxCLY=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn, mergeRefs } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------------------------------------
 * DocumentLayoutMeta — the lines of small facts under a document's title: who updated it, where it
 * came from, its owner and status chips. Each fact (`DocumentLayoutMetaItem`) opens with a `·`, and
 * the row is drawn one dot's width to the start of a clipped box, so the dot that would open a
 * wrapped line is clipped away: "a · b" never leaves a "·" hanging at a line's start or end.
 *
 * `variant="status"` is the status row: one line from `sm` and two on a phone, reserved from the
 * first paint so chips that stream in move nothing. Its chips keep their words while the row has
 * room; on a tight row they drop to their short forms (`DocumentLayoutMetaWords`), the longest
 * first, and only if those don't fit either does the row wrap — never truncated to nonsense.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `DocumentLayoutMeta`. */
export interface DocumentLayoutMetaProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * `line` — facts that wrap freely. `status` — the status row: one reserved line from `sm`, two
   * on a phone, its chips fitted to the width (short forms, then wrapping).
   * @default "line"
   */
  variant?: "line" | "status";
  /**
   * `status` only: what the chips say — the row is fitted again whenever any of these change (it
   * is also fitted on every width change and once web fonts arrive).
   * @default []
   */
  watch?: readonly unknown[];
}

const ROW =
  "-ms-2.5 flex min-w-0 items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground";

// The status row: a reserved line (two on a phone), its chips fitted by `useMetaFit`.
const STATUS =
  "group/document-meta min-h-6 data-wrap:flex-wrap max-sm:min-h-13 max-sm:flex-wrap max-sm:content-start";

/**
 * `DocumentLayoutMeta` — a line of facts under a document's title (`DocumentLayoutMetaItem`s,
 * each opening with a `·`), or with `variant="status"` the status row of owner and chips. Put it
 * in `DocumentLayoutHeader`. It prints; hide a line that means nothing on paper with your print
 * rules (an editor's status row, say).
 *
 * @example
 * <DocumentLayoutMeta>
 *   <DocumentLayoutMetaItem>Updated 3m ago by Sanjay</DocumentLayoutMetaItem>
 *   <DocumentLayoutMetaItem>Used in 2 tasks</DocumentLayoutMetaItem>
 * </DocumentLayoutMeta>
 */
export function DocumentLayoutMeta({
  variant = "line",
  watch = [],
  ref,
  className,
  children,
  ...props
}: DocumentLayoutMetaProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  useMetaFit(rowRef, variant === "status", watch);
  const refs = React.useMemo(
    () => mergeRefs<HTMLDivElement>(rowRef, ref),
    [ref],
  );
  // The clip box keeps the controls' focus rings (`overflow-clip-margin`).
  return (
    <div
      data-slot="document-layout-meta"
      data-variant={variant}
      className="min-w-0 overflow-clip [overflow-clip-margin:0.25rem]"
    >
      <div
        ref={refs}
        data-slot="document-layout-meta-row"
        className={cn(
          ROW,
          variant === "status" ? STATUS : "flex-wrap",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Fits the status row's chips (`ref` on the row): every chip says all its words while the row has
 * room; else they drop their rest one at a time, the longest first, down to their short forms;
 * if even those don't fit, the row wraps (`data-wrap`). Measured before paint, and again whenever
 * the row's width changes and once web fonts arrive.
 */
function useMetaFit(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  watch: readonly unknown[],
) {
  const fit = React.useCallback(() => {
    const row = ref.current;
    if (!row) return;
    const words = [
      ...row.querySelectorAll<HTMLElement>(
        "[data-slot=document-layout-meta-words]",
      ),
    ];
    for (const chip of words) chip.removeAttribute("data-compact");
    row.removeAttribute("data-wrap");
    // A plain line is never fitted: what a status row left behind is cleared.
    if (!enabled) return;
    // The row's natural width (every part at its own width, on one line) against the width it
    // has: set inline for the moment of measuring, which no class can outrank.
    const available = row.clientWidth;
    const { width, flexWrap } = row.style;
    row.style.width = "max-content";
    row.style.flexWrap = "nowrap";
    const over = () => row.scrollWidth > available + 1;
    const rest = (chip: HTMLElement) =>
      chip.querySelector<HTMLElement>(
        "[data-slot=document-layout-meta-words-rest]",
      )?.offsetWidth ?? 0;
    const longest = words
      .filter((chip) => rest(chip) > 0)
      .sort((a, b) => rest(b) - rest(a));
    while (over() && longest.length > 0)
      longest.shift()!.setAttribute("data-compact", "");
    if (over()) row.setAttribute("data-wrap", "");
    row.style.width = width;
    row.style.flexWrap = flexWrap;
  }, [ref, enabled]);
  // Re-fitted when any watched value changes (compared one by one, as a dependency list is).
  const version = useWatchVersion(watch);
  React.useLayoutEffect(fit, [fit, version]);
  React.useEffect(() => {
    const row = ref.current;
    if (!enabled || !row || typeof ResizeObserver === "undefined") return;
    let width = row.clientWidth;
    const observer = new ResizeObserver(() => {
      if (row.clientWidth === width) return;
      width = row.clientWidth;
      fit();
    });
    observer.observe(row);
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) fit();
    });
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [ref, enabled, fit, version]);
}

/** A number that changes whenever any of `values` changes (`Object.is`, one by one). */
function useWatchVersion(values: readonly unknown[]): number {
  const [state, setState] = React.useState({ values, version: 0 });
  const same =
    state.values.length === values.length &&
    state.values.every((value, index) => Object.is(value, values[index]));
  if (!same) setState({ values, version: state.version + 1 });
  return same ? state.version : state.version + 1;
}

/** Props accepted by `DocumentLayoutMetaItem`. */
export interface DocumentLayoutMetaItemProps extends React.ComponentPropsWithRef<"span"> {
  /** A leading icon, 14px in the muted ink; decorative. @default undefined */
  icon?: React.ReactNode;
  /**
   * On the status row, give way first: shrink before the owner's name does (a review badge with a
   * short form). @default false
   */
  yields?: boolean;
  /**
   * Keep the fact's words on one line — for a fact built around a `DocumentLayoutMetaLink`, which
   * truncates instead ("From meeting ‹name› · Oct 14"). Plain text wraps by default. @default false
   */
  nowrap?: boolean;
}

/**
 * `DocumentLayoutMetaItem` — one fact on a `DocumentLayoutMeta` line: its `·` separator, an
 * optional icon and its content, wrapping as one unit. With `nowrap` its words stay on one line
 * and a `DocumentLayoutMetaLink` in it truncates.
 *
 * @example
 * <DocumentLayoutMetaItem icon={<Video />}>From meeting</DocumentLayoutMetaItem>
 */
export function DocumentLayoutMetaItem({
  icon,
  yields = false,
  nowrap = false,
  className,
  children,
  ...props
}: DocumentLayoutMetaItemProps) {
  return (
    <span
      data-slot="document-layout-meta-item"
      data-yields={yields ? "" : undefined}
      data-nowrap={nowrap ? "" : undefined}
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1.5 data-nowrap:whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        // Gives way first on a tight status row; holds once the row wraps or the chip is compact.
        "data-yields:min-w-15 data-yields:shrink-[100] group-data-wrap/document-meta:data-yields:shrink-0 data-yields:has-data-compact:shrink-0",
        className,
      )}
      {...props}
    >
      <DocumentLayoutMetaDot />
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

/** The `·` that opens every fact; the clipped row hides the one that would start a line. */
function DocumentLayoutMetaDot() {
  return (
    <span
      aria-hidden
      data-slot="document-layout-meta-dot"
      className="w-1 shrink-0 text-center"
    >
      ·
    </span>
  );
}

/** Props accepted by `DocumentLayoutMetaGroup`. */
export interface DocumentLayoutMetaGroupProps extends React.ComponentPropsWithRef<"span"> {
  /**
   * `unit` — facts that stay together on a line (its own `·` first): the owner and the status
   * chip; only a row too narrow for even the chip's short form wraps inside it. `flow`
   * — facts that each keep their own `·` and flow with the row from `sm`. On a phone both take a
   * whole line of the status row.
   * @default "unit"
   */
  kind?: "unit" | "flow";
}

/**
 * `DocumentLayoutMetaGroup` — facts grouped on the status row: a `unit` kept together on a line
 * (the owner and the chip; it wraps inside only when even the chip's short form doesn't fit), or a
 * `flow` of flags. On a phone each group is a whole line, so the row is at least two lines tall
 * from the first paint (a row too narrow for even the short forms wraps further).
 *
 * @example
 * <DocumentLayoutMeta variant="status">
 *   <DocumentLayoutMetaGroup>
 *     <DocumentLayoutMetaField label="Owner">Sanjay</DocumentLayoutMetaField>
 *     <Badge>Verified</Badge>
 *   </DocumentLayoutMetaGroup>
 *   <DocumentLayoutMetaGroup kind="flow">
 *     <DocumentLayoutMetaItem>2 out of date</DocumentLayoutMetaItem>
 *   </DocumentLayoutMetaGroup>
 * </DocumentLayoutMeta>
 */
export function DocumentLayoutMetaGroup({
  kind = "unit",
  className,
  children,
  ...props
}: DocumentLayoutMetaGroupProps) {
  return (
    <span
      data-slot="document-layout-meta-group"
      data-kind={kind}
      className={cn(
        kind === "unit"
          ? "inline-flex max-w-full min-w-0 items-center gap-x-1.5 group-data-wrap/document-meta:flex-wrap max-sm:basis-full"
          : "contents max-sm:flex max-sm:min-w-0 max-sm:basis-full max-sm:items-center max-sm:gap-x-1.5 max-sm:group-data-wrap/document-meta:flex-wrap",
        className,
      )}
      {...props}
    >
      {kind === "unit" ? <DocumentLayoutMetaDot /> : null}
      {children}
    </span>
  );
}

/** Props accepted by `DocumentLayoutMetaField`. */
export interface DocumentLayoutMetaFieldProps extends React.ComponentPropsWithRef<"span"> {
  /** The field's name, before its value ("Owner"). */
  label: React.ReactNode;
}

/**
 * `DocumentLayoutMetaField` — "Owner Sanjay Desai": a label and its value, kept whole (up to 33
 * characters) — the chips beside it give way first.
 *
 * @example
 * <DocumentLayoutMetaField label="Owner">Sanjay Desai</DocumentLayoutMetaField>
 */
export function DocumentLayoutMetaField({
  label,
  className,
  children,
  ...props
}: DocumentLayoutMetaFieldProps) {
  return (
    <span
      data-slot="document-layout-meta-field"
      className={cn(
        "inline-flex max-w-[33ch] shrink-0 items-center gap-1",
        className,
      )}
      {...props}
    >
      <span className="shrink-0">{label}</span>
      {children}
    </span>
  );
}

/** Props accepted by `DocumentLayoutMetaWords`. */
export interface DocumentLayoutMetaWordsProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The chip's whole label ("Verified · Oct 14"). */
  label: string;
  /** Its short form, a prefix of `label` ("Verified"), shown alone on a tight status row. */
  short: string;
}

/**
 * `DocumentLayoutMetaWords` — a status chip's words: the short form, then the rest, which the
 * status row hides while it is tight (`data-compact`). Give the chip a `title` with the whole
 * label so its tooltip still says it all.
 *
 * @example
 * <Badge title="Verified · Oct 14"><DocumentLayoutMetaWords label="Verified · Oct 14" short="Verified" /></Badge>
 */
export function DocumentLayoutMetaWords({
  label,
  short,
  className,
  ...props
}: DocumentLayoutMetaWordsProps) {
  return (
    <span
      data-slot="document-layout-meta-words"
      className={cn("min-w-0 truncate", className)}
      {...props}
    >
      {short}
      {label.length > short.length && label.startsWith(short) ? (
        <span
          data-slot="document-layout-meta-words-rest"
          className="in-data-compact:hidden"
        >
          {label.slice(short.length)}
        </span>
      ) : null}
    </span>
  );
}

/** Props accepted by `DocumentLayoutMetaBadge`. */
export interface DocumentLayoutMetaBadgeProps extends React.ComponentProps<
  typeof Badge
> {
  /**
   * The chip's whole label; with `short`, its words give way to the short form on a tight status
   * row (and the chip's `title` defaults to it). Without, the chip shows its children and keeps
   * its size. @default undefined
   */
  label?: string;
  /** The short form, a prefix of `label` ("Verified"). @default undefined */
  short?: string;
}

/**
 * `DocumentLayoutMetaBadge` — a status chip on the status row: a `Badge` (its icon as children)
 * whose words (`label`, `short`) give way to their short form before the owner's name does, and
 * hold once the row wraps or the chip is compact.
 *
 * @example
 * <DocumentLayoutMetaBadge variant="success" label="Verified · Oct 14" short="Verified">
 *   <BadgeCheck data-icon="inline-start" aria-hidden />
 * </DocumentLayoutMetaBadge>
 */
export function DocumentLayoutMetaBadge({
  label,
  short,
  title,
  className,
  children,
  ...props
}: DocumentLayoutMetaBadgeProps) {
  const fitted = label !== undefined && short !== undefined;
  return (
    <Badge
      data-fitted={fitted ? "" : undefined}
      title={title ?? label}
      className={cn(
        fitted
          ? "max-w-full min-w-12 shrink-[100] group-data-wrap/document-meta:shrink-0 has-data-compact:shrink-0"
          : "shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      {fitted ? <DocumentLayoutMetaWords label={label} short={short} /> : null}
    </Badge>
  );
}

/**
 * `DocumentLayoutMetaButton` — a fact that opens something ("Used in 2 tasks"): a quiet ghost
 * button in the line's own ink and size.
 *
 * @example
 * <PopoverTrigger render={<DocumentLayoutMetaButton />}>Used in 2 tasks</PopoverTrigger>
 */
export function DocumentLayoutMetaButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="document-layout-meta-button"
      className={cn(
        "h-auto px-1 py-0.5 text-sm font-normal text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutMetaLink` — a fact's link (a source meeting's name): in the foreground ink at
 * medium weight, truncated, underlined on hover. `render` takes the router's link.
 *
 * @example
 * <DocumentLayoutMetaLink render={<Link href="/meetings/1" />}>Weekly sync</DocumentLayoutMetaLink>
 */
export function DocumentLayoutMetaLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "min-w-0 truncate font-medium text-foreground hover:underline",
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: "document-layout-meta-link" },
  });
}

/**
 * `DocumentLayoutMetaSkeleton` — the status row's placeholder while its chips stream in: one bar
 * in the row's reserved line.
 *
 * @example
 * <DocumentLayoutMeta variant="status">{settled ? chips : <DocumentLayoutMetaSkeleton />}</DocumentLayoutMeta>
 */
export function DocumentLayoutMetaSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      aria-hidden
      className={cn("ms-2.5 h-4 w-48", className)}
      {...props}
    />
  );
}
