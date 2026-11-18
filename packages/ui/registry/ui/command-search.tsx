// @vegastack command-search@0.117.0 sha256-GYwq+/BbZWeu+5oYZHmmzvLje3Btz3qFuFf+4HFpaZ4=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronDown } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDot } from "@/components/ui/notification-dot";
import { toggleVariants } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/* ---
`CommandSearch` is the app-wide search palette's frame, results first: one row of scope
chips that never wraps (what does not fit moves into `More ▾`, with "Include archived"),
a results area as tall as `min(60dvh, 520px)`, an in-flight state that dims the stale
answer and runs a thin bar under the input, and an optional preview pane at ≥ 1280px.

It composes `command` (cmdk) and owns no search. Pair it with `useAsyncSearch`, which
debounces, aborts and DROPS an answer that arrives after a newer request started — pass
its `loading` as `pending`. The empty query's start state is `CommandSearchSections`:
Recent · Create · Places, always in that order.
--- */

type CommandSearchState = {
  pending: boolean;
  preview: React.ReactNode;
  /** Opened over the bar's box (`placement="bar"`): the field takes the box's pill shape. */
  bar: boolean;
};

const CommandSearchContext = React.createContext<CommandSearchState>({
  pending: false,
  preview: null,
  bar: false,
});

/** Props accepted by `CommandSearch`. */
export interface CommandSearchProps extends Omit<
  React.ComponentProps<typeof Command>,
  "title"
> {
  /**
   * Controlled open state.
   * @default undefined
   */
  open?: boolean;
  /**
   * Fired when the palette asks to open or close.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The dialog's accessible title (visually hidden).
   * @default "Search"
   */
  title?: string;
  /**
   * The dialog's accessible description (visually hidden).
   * @default "Search or jump to…"
   */
  description?: string;
  /**
   * A search is in flight: the results still shown are stale, so they dim and are marked busy,
   * and a thin bar runs under the input.
   * @default false
   */
  pending?: boolean;
  /**
   * A preview of the highlighted result, in a pane beside the results from 1280px of viewport
   * (the palette widens to hold it). Hidden below that.
   * @default undefined
   */
  preview?: React.ReactNode;
  /**
   * cmdk's own filtering. Off by default: a search palette shows the host's answer as given.
   * @default false
   */
  shouldFilter?: boolean;
  /**
   * Classes for the dialog surface.
   * @default undefined
   */
  dialogClassName?: string;
  /**
   * Where the palette opens: the middle of the window (`center`), or in place of the global bar's
   * search-or-ask box (`bar`, LAY-26): its field lands exactly on the box (same left edge and
   * width; a box too narrow for results, like the icon-only one, gets a wider palette centred on
   * it), and the palette grows out of the box's shape. With no box on screen it opens at the
   * window's top centre.
   * @default 'center'
   */
  placement?: "center" | "bar";
  /**
   * With `placement="bar"`: the box the palette opens over.
   * @default the first visible `[data-slot="global-bar-search"]`
   */
  anchor?: React.RefObject<HTMLElement | null>;
}

/**
 * The field's inset from the palette's outer edge: its 1px border and the palette's 3px padding
 * (the input row adds none), so the 16px pill sits concentric in the 20px (`bubble`) corner.
 */
const BAR_INSET = 4;
/** The narrowest palette that still reads results (20rem); never wider than the window less its 16px gutters. */
const BAR_MIN_WIDTH = 320;
const BAR_GUTTER = 16;
/** The palette's field is 32px tall; a 28px box (the plain search) has it centred on it. */
const BAR_FIELD = 32;

/** Where the `bar` palette sits, from the box's rect: its surface's inline style. */
function barPlacement(box: HTMLElement): React.CSSProperties | null {
  const b = box.getBoundingClientRect();
  if (b.width === 0 || b.height === 0) return null;
  const vw = document.documentElement.clientWidth;
  const width = Math.min(
    Math.max(b.width + BAR_INSET * 2, BAR_MIN_WIDTH),
    vw - BAR_GUTTER * 2,
  );
  // Centred on the box (equal to the box's own edges, less the inset, when it is wide enough),
  // kept inside the window's gutters.
  const left = Math.min(
    Math.max(b.left + b.width / 2 - width / 2, BAR_GUTTER),
    vw - BAR_GUTTER - width,
  );
  const top = b.top + (b.height - BAR_FIELD) / 2 - BAR_INSET;
  const rtl = getComputedStyle(box).direction === "rtl";
  // The box's shape inside the palette: the palette opens from it and closes back into it.
  const clip = `inset(${b.top - top}px ${left + width - b.right}px calc(100% - ${
    b.bottom - top
  }px) ${b.left - left}px round ${b.height / 2}px)`;
  return {
    top,
    insetInlineStart: rtl ? vw - left - width : left,
    width,
    maxWidth: "none",
    translate: "none",
    ["--command-search-from" as string]: clip,
  };
}

/** Tracks the box's place while the palette is open, keeping the last one for the exit. */
function useBarPlacement(
  enabled: boolean,
  anchor: React.RefObject<HTMLElement | null> | undefined,
) {
  const [style, setStyle] = React.useState<React.CSSProperties | null>(null);
  React.useLayoutEffect(() => {
    if (!enabled) return;
    const find = () =>
      anchor?.current ??
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-slot="global-bar-search"]',
        ),
      ).find((el) => el.getClientRects().length > 0) ??
      null;
    const box = find();
    if (!box) return setStyle(null);
    const measure = () => setStyle(barPlacement(box));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enabled, anchor]);
  return style;
}

/**
 * `CommandSearch` — the search palette: a `CommandDialog` holding a `Command`, with the in-flight
 * (`pending`) and `preview` state its parts read. Compose `CommandSearchInput`,
 * `CommandSearchScopes`, `CommandSearchResults` (with `CommandSearchSections` for the empty query)
 * and `CommandFooter` inside it.
 *
 * @example
 * const search = useAsyncSearch(load, { enabled: open, deps: [scope, archived] });
 * <CommandSearch open={open} onOpenChange={setOpen} pending={search.loading}>
 *   <CommandSearchInput value={search.query} onValueChange={search.onSearchChange} />
 *   <CommandSearchScopes scopes={SCOPES} value={scope} onValueChange={setScope}
 *     includeArchived={archived} onIncludeArchivedChange={setArchived} />
 *   <CommandSearchResults>
 *     {search.query ? <Results items={search.items} /> : (
 *       <CommandSearchSections recent={recentItems} create={createItems} places={placeItems} />
 *     )}
 *   </CommandSearchResults>
 * </CommandSearch>
 */
export function CommandSearch({
  open,
  onOpenChange,
  title = "Search",
  description = "Search or jump to…",
  pending = false,
  preview,
  shouldFilter = false,
  dialogClassName,
  placement = "center",
  anchor,
  className,
  children,
  ...props
}: CommandSearchProps) {
  const bar = placement === "bar";
  const state = React.useMemo(
    () => ({ pending, preview: preview ?? null, bar }),
    [pending, preview, bar],
  );
  const anchored = useBarPlacement(bar && !!open, anchor);
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      style={anchored ?? undefined}
      className={cn(
        preview ? "data-[size=default]:xl:max-w-6xl" : undefined,
        // LAY-26 over the bar's box: the field is a pill (the box's own shape, its controls
        // capsules) 3px inside the palette's border (its padding; the input row adds none), so the 20px corners are concentric with it.
        bar &&
          "[&_[data-slot=command-search]]:p-0.75 [&_[data-slot=command-input-wrapper]]:p-0 [&_[data-slot=command-search-trailing]]:top-4",
        // Placed on the box (inline style), it grows out of the box's shape and closes back into it.
        bar &&
          anchored &&
          "[clip-path:inset(0_round_var(--radius-bubble))] [transition:clip-path_var(--duration-state)_var(--ease-enter),opacity_var(--duration-quick)_var(--ease-enter)] data-open:animate-none data-closed:animate-none data-starting-style:opacity-0 data-starting-style:[clip-path:var(--command-search-from)] data-ending-style:opacity-0 data-ending-style:[clip-path:var(--command-search-from)] data-ending-style:[transition:clip-path_var(--duration-state-exit)_var(--ease-exit),opacity_var(--duration-quick-exit)_var(--ease-exit)] motion-reduce:[transition:opacity_var(--duration-quick)_var(--ease-enter)]",
        // No box on screen: the window's top centre, 580px at most.
        bar &&
          !anchored &&
          "top-1 translate-y-0 data-[size=default]:sm:max-w-[min(36.25rem,calc(100%-2rem))] data-open:zoom-in-100 data-open:slide-in-from-top-1",
        dialogClassName,
      )}
    >
      <CommandSearchContext.Provider value={state}>
        <Command
          data-slot="command-search"
          data-pending={pending ? "" : undefined}
          shouldFilter={shouldFilter}
          className={className}
          {...props}
        >
          {children}
        </Command>
      </CommandSearchContext.Provider>
    </CommandDialog>
  );
}

/** Props accepted by `CommandSearchInput`. */
export interface CommandSearchInputProps extends React.ComponentProps<
  typeof CommandInput
> {
  /**
   * A control at the field's end, inside it: the "Ask {name}" chip of a search-or-ask box
   * (LAY-26). Keep it to one small button.
   * @default undefined
   */
  trailing?: React.ReactNode;
}

/**
 * `CommandSearchInput` — the palette's search field: `CommandInput` with a thin indeterminate bar
 * along its foot while `CommandSearch` is `pending`, and an optional `trailing` control inside the
 * field's end.
 *
 * @example
 * <CommandSearchInput placeholder="Search or jump to…" value={query} onValueChange={setQuery} />
 * <CommandSearchInput value={query} onValueChange={setQuery} trailing={<AskChip />} />
 */
export function CommandSearchInput({
  placeholder = "Search or jump to…",
  trailing,
  className,
  ...props
}: CommandSearchInputProps) {
  const { pending, bar } = React.useContext(CommandSearchContext);
  return (
    <div
      data-slot="command-search-input"
      data-pending={pending ? "" : undefined}
      className="relative"
    >
      <CommandInput
        shape={bar ? "pill" : undefined}
        placeholder={placeholder}
        className={cn(trailing ? "pe-32" : undefined, className)}
        {...props}
      />
      {trailing ? (
        <div
          data-slot="command-search-trailing"
          // Enter and Space press the control, not the highlighted result (cmdk listens above).
          onKeyDown={keepKeys}
          className="absolute end-2 top-[calc(0.25rem+1rem)] flex -translate-y-1/2 items-center"
        >
          {trailing}
        </div>
      ) : null}
      {pending ? (
        <div
          aria-hidden
          data-slot="command-search-progress"
          className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full"
        >
          <span className="absolute inset-y-0 w-1/3 rounded-full bg-primary motion-indeterminate" />
        </div>
      ) : null}
    </div>
  );
}

/** One search scope chip. */
export interface CommandSearchScope {
  /** The scope's value ("all", "pages"). */
  value: string;
  /** The chip's text. */
  label: string;
}

/** Props accepted by `CommandSearchScopes`. */
export interface CommandSearchScopesProps {
  /** The scopes, in chip order; the first is usually "All". */
  scopes: readonly CommandSearchScope[];
  /** The selected scope's value. */
  value: string;
  /** Fired with the scope picked from the chips or from More. */
  onValueChange: (value: string) => void;
  /**
   * At most this many chips before More, whatever the room. Omitted, as many as fit.
   * @default undefined
   */
  maxVisible?: number;
  /**
   * The overflow menu's trigger text (it shows the picked scope's name instead while that scope
   * sits in the menu).
   * @default "More"
   */
  moreLabel?: string;
  /**
   * Whether archived items are included. Shown in More only with `onIncludeArchivedChange`.
   * @default false
   */
  includeArchived?: boolean;
  /**
   * Fired by More's "Include archived" item; omit it and the item is not offered.
   * @default undefined
   */
  onIncludeArchivedChange?: (includeArchived: boolean) => void;
  /**
   * The archived item's text.
   * @default "Include archived"
   */
  includeArchivedLabel?: string;
  /**
   * The chip group's accessible name.
   * @default "Search in"
   */
  "aria-label"?: string;
  /**
   * Classes for the row.
   * @default undefined
   */
  className?: string;
}

/** Keeps the keys cmdk's root claims (Enter selects, arrows and Home/End move) on a control here. */
function keepKeys(event: React.KeyboardEvent) {
  if (
    event.key === "Enter" ||
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "ArrowUp" ||
    event.key === "ArrowDown"
  )
    event.stopPropagation();
}

const CHIP_CLASS = toggleVariants({ variant: "outline", size: "sm" });

/**
 * `CommandSearchScopes` — one row of scope chips that never wraps: the chips that fit (or
 * `maxVisible`) and a `More ▾` menu with the rest and, when offered, "Include archived". A scope
 * picked from More names the trigger and presses it. Re-measures as the palette resizes.
 *
 * @example
 * <CommandSearchScopes
 *   scopes={[{ value: "all", label: "All" }, { value: "pages", label: "Pages" }, …]}
 *   value={scope}
 *   onValueChange={setScope}
 *   includeArchived={archived}
 *   onIncludeArchivedChange={setArchived}
 * />
 */
export function CommandSearchScopes({
  scopes,
  value,
  onValueChange,
  maxVisible,
  moreLabel = "More",
  includeArchived = false,
  onIncludeArchivedChange,
  includeArchivedLabel = "Include archived",
  "aria-label": ariaLabel = "Search in",
  className,
}: CommandSearchScopesProps) {
  const cap = Math.min(maxVisible ?? scopes.length, scopes.length);
  const [fit, setFit] = React.useState(cap);
  const row = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLDivElement>(null);
  const archivable = onIncludeArchivedChange !== undefined;
  const key = scopes.map((s) => `${s.value}:${s.label}`).join("|");

  // How many chips fit beside More: every chip's natural width comes from an invisible copy of the
  // row, so a chip never has to render to be measured.
  React.useLayoutEffect(() => {
    const box = row.current;
    const ruler = measure.current;
    if (!box || !ruler) return;
    // The sum of an element's line boxes: its natural width even if it ever wraps.
    const widthOf = (el: Element | null) =>
      el
        ? Array.from(el.getClientRects()).reduce((sum, r) => sum + r.width, 0)
        : 0;
    const compute = () => {
      const chips = Array.from(
        ruler.querySelectorAll<HTMLElement>("[data-measure=chip]"),
      ).map(widthOf);
      const more = Math.max(
        0,
        ...Array.from(ruler.querySelectorAll("[data-measure=more]")).map(
          widthOf,
        ),
      );
      const style = getComputedStyle(box);
      const gap = Number.parseFloat(style.columnGap) || 0;
      const room =
        box.clientWidth -
        (Number.parseFloat(style.paddingInlineStart) || 0) -
        (Number.parseFloat(style.paddingInlineEnd) || 0);
      let next = 0;
      for (let k = Math.min(cap, chips.length); k >= 0; k--) {
        const used =
          chips.slice(0, k).reduce((sum, w) => sum + w, 0) +
          gap * Math.max(k - 1, 0);
        const needsMore = k < scopes.length || archivable;
        const total = used + (needsMore ? more + (k > 0 ? gap : 0) : 0);
        if (total <= room || k === 0) {
          next = k;
          break;
        }
      }
      // A row that measures nothing (not laid out yet) keeps the cap.
      setFit(room > 0 ? next : cap);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(box);
    observer.observe(ruler);
    return () => observer.disconnect();
  }, [cap, key, archivable, scopes.length]);

  const visible = scopes.slice(0, fit);
  const overflow = scopes.slice(fit);
  const inOverflow = overflow.find((s) => s.value === value);
  const showMore = overflow.length > 0 || archivable;
  const moreActive = inOverflow !== undefined;

  return (
    <div
      ref={row}
      data-slot="command-search-scopes"
      className={cn(
        "relative flex min-w-0 items-center gap-1.5 overflow-hidden px-1 pt-2 pb-1",
        className,
      )}
      onKeyDown={keepKeys}
    >
      {/* The ruler: every chip and the More trigger at their natural widths, never seen. */}
      <div
        ref={measure}
        aria-hidden
        inert
        data-slot="command-search-scopes-ruler"
        className="pointer-events-none invisible absolute start-0 top-0 flex gap-1.5 whitespace-nowrap"
      >
        {scopes.map((s) => (
          <span key={s.value} data-measure="chip" className={CHIP_CLASS}>
            {s.label}
          </span>
        ))}
        {/* More at its widest: every name it can show, each with the archived dot when offered —
            so what it measures never depends on which scope is picked or how many chips fit. */}
        {[moreLabel, ...scopes.map((s) => s.label)].map((label, i) => (
          <span key={`more-${i}`} data-measure="more" className={CHIP_CLASS}>
            {label}
            {archivable ? <NotificationDot /> : null}
            <ChevronDown aria-hidden data-icon="inline-end" />
          </span>
        ))}
      </div>
      {visible.length > 0 ? (
        <ToggleGroup
          size="sm"
          variant="outline"
          // The row's own gap (1.5), so one gap value fits every chip and More.
          spacing={1.5}
          deselectable={false}
          aria-label={ariaLabel}
          value={inOverflow ? [] : [value]}
          onValueChange={(next) => {
            if (next[0]) onValueChange(next[0]);
          }}
          className="shrink-0"
        >
          {visible.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value}>
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}
      {showMore ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            data-slot="command-search-more"
            data-state={moreActive ? "on" : undefined}
            className={cn(CHIP_CLASS, "shrink-0")}
          >
            {inOverflow ? inOverflow.label : moreLabel}
            {archivable && includeArchived ? (
              <>
                <NotificationDot data-slot="command-search-archived-dot" />
                <span className="sr-only"> ({includeArchivedLabel})</span>
              </>
            ) : null}
            <ChevronDown aria-hidden data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            data-slot="command-search-more-content"
            onKeyDown={(event) => event.stopPropagation()}
          >
            {overflow.length > 0 ? (
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={inOverflow ? value : ""}
                  onValueChange={(next) => onValueChange(String(next))}
                >
                  {overflow.map((s) => (
                    <DropdownMenuRadioItem key={s.value} value={s.value}>
                      {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            ) : null}
            {overflow.length > 0 && archivable ? (
              <DropdownMenuSeparator />
            ) : null}
            {archivable ? (
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem
                  checked={includeArchived}
                  onCheckedChange={(checked) =>
                    onIncludeArchivedChange?.(checked)
                  }
                >
                  {includeArchivedLabel}
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/** Props accepted by `CommandSearchResults`. */
export type CommandSearchResultsProps = React.ComponentProps<
  typeof CommandList
>;

/**
 * `CommandSearchResults` — the results: a `CommandList` up to `min(60dvh, 520px)` tall that dims
 * and is marked `aria-busy` while a newer search is in flight, with the palette's `preview` beside
 * it from 1280px.
 *
 * @example
 * <CommandSearchResults>
 *   <CommandGroup heading="Pages">…</CommandGroup>
 * </CommandSearchResults>
 */
export function CommandSearchResults({
  className,
  ...props
}: CommandSearchResultsProps) {
  const { pending, preview } = React.useContext(CommandSearchContext);
  return (
    <div data-slot="command-search-body" className="flex min-h-0 min-w-0">
      <CommandList
        data-stale={pending ? "" : undefined}
        aria-busy={pending ? true : undefined}
        className={cn(
          "max-h-[min(60dvh,32.5rem)] min-w-0 flex-1 transition-opacity duration-150 data-stale:opacity-60 data-[size=lg]:max-h-[min(60dvh,32.5rem)] data-[size=xl]:max-h-[min(60dvh,32.5rem)]",
          className,
        )}
        {...props}
      />
      {preview ? (
        <aside
          data-slot="command-search-preview"
          aria-label="Preview"
          className="relative hidden max-h-[min(60dvh,32.5rem)] w-80 shrink-0 overflow-y-auto border-s border-border p-3 xl:block"
        >
          {preview}
        </aside>
      ) : null}
    </div>
  );
}

/** Props accepted by `CommandSearchSections`. */
export interface CommandSearchSectionsProps {
  /**
   * Recently opened records and searches (`CommandItem`s). Empty or omitted: no section.
   * @default undefined
   */
  recent?: React.ReactNode;
  /**
   * Create actions — New page, New task (`CommandItem`s).
   * @default undefined
   */
  create?: React.ReactNode;
  /**
   * Places to jump to — Home, Tasks, Library (`CommandItem`s).
   * @default undefined
   */
  places?: React.ReactNode;
  /**
   * Section headings.
   * @default { recent: "Recent", create: "Create", places: "Places" }
   */
  labels?: { recent?: string; create?: string; places?: string };
}

/** True when a slot holds something to render (an empty array or fragment does not count). */
function filled(node: React.ReactNode): boolean {
  return React.Children.toArray(node).length > 0;
}

/**
 * `CommandSearchSections` — the palette's start state, before anything is typed: Recent, then
 * Create, then Places, always in that order, each a `CommandGroup` only when it has items.
 *
 * @example
 * <CommandSearchSections
 *   recent={recents.map((r) => <CommandItem key={r.id}>{r.title}</CommandItem>)}
 *   create={<CommandItem>New page</CommandItem>}
 *   places={<CommandItem>Home</CommandItem>}
 * />
 */
export function CommandSearchSections({
  recent,
  create,
  places,
  labels,
}: CommandSearchSectionsProps) {
  const sections = [
    ["recent", labels?.recent ?? "Recent", recent],
    ["create", labels?.create ?? "Create", create],
    ["places", labels?.places ?? "Places", places],
  ] as const;
  return (
    <>
      {sections.map(([key, heading, items]) =>
        filled(items) ? (
          <CommandGroup
            key={key}
            heading={heading}
            data-section={key}
            data-slot="command-search-section"
          >
            {items}
          </CommandGroup>
        ) : null,
      )}
    </>
  );
}
