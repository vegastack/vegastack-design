// @vegastack command@0.25.8 sha256-R4CEQ19hOJbqfM/dhttxTGGNcEj9pqzAvbphC+KUYC8=

"use client";

import * as React from "react";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { cn, mergeRefs } from "@vegastack/design";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { SearchIcon, CheckIcon } from "lucide-react";
import {
  SearchIcon as AnimatedSearchIcon,
  type SearchIconHandle,
} from "@/components/ui/icons/search";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { usePlatform } from "@/components/ui/use-platform";

import {
  ItemDescriptionContext,
  useItemDescriptionId,
} from "@/components/ui/item";
import { useAnnouncer } from "@/components/ui/use-announcer";

// VOI-1: the result count is built-in copy, so it is overridable (and localisable) as a label.
const defaultResultsLabel = (count: number) =>
  count === 1 ? "1 result" : `${count} results`;

/**
 * OVL-20: the footer actions (`CommandActions`) are force-mounted, and cmdk registers no
 * force-mounted item — so they are never filtered, ranked or counted, and `filtered.count` is the
 * result count as it stands. The registry only tells `CommandEmpty` that the list holds actions.
 */
type CommandActionsRegistry = { count: number; add: () => () => void };
const CommandRegistryContext = React.createContext<CommandActionsRegistry>({
  count: 0,
  add: () => () => {},
});
/** A highlight value no row carries (OVL-20). */
const NO_HIGHLIGHT = "\u0000command-none";
/** The keys that move cmdk's highlight. */
const NAVIGATION_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageDown",
  "PageUp",
]);
/** cmdk's vim bindings (Ctrl+N/J next, Ctrl+P/K previous) — the only Ctrl chords that navigate. */
const NAVIGATION_CTRL_KEYS = new Set(["n", "j", "p", "k"]);

/** The first enabled result — an option outside the footer — or null. */
function firstResult(root: HTMLElement | null): string | null {
  const rows = root?.querySelectorAll<HTMLElement>(
    '[cmdk-list-sizer] [cmdk-item]:not([aria-disabled="true"])',
  );
  const row = Array.from(rows ?? []).find(
    (el) => !el.closest('[data-slot="command-actions"]'),
  );
  return row?.getAttribute("data-value") ?? null;
}

/**
 * OVL-20, only while the list has footer actions (a palette without them behaves exactly as cmdk):
 * after every search (once cmdk has ranked, selected and the footer has moved back to the end) the highlight is the first result, or nothing — never a footer action, whether cmdk put it
 * there or it was already there from the arrow keys before the user typed. A highlight cmdk does
 * not move emits no change, so this reads the search itself rather than the value.
 */
function ActionHighlightGuard({
  rootRef,
  highlight,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  highlight: (value: string | null) => void;
}) {
  const search = useCommandState((state) => state.search);
  // Results arriving after the search (an async list) are a change too.
  const count = useCommandState((state) => state.filtered.count);
  const first = React.useRef(true);
  const lastSearch = React.useRef(search);
  React.useEffect(() => {
    const searched = lastSearch.current !== search;
    lastSearch.current = search;
    if (first.current) {
      first.current = false;
      if (!search) return;
    }
    const root = rootRef.current;
    const selected = root?.querySelector<HTMLElement>(
      '[cmdk-item][aria-selected="true"]',
    );
    const target = firstResult(root);
    const current = selected?.getAttribute("data-value") ?? null;
    // Results arriving on their own only fill an empty highlight; a row the arrow keys reached
    // (an action included) stays.
    if (!searched && selected) return;
    if (current !== target && (selected || target)) highlight(target);
  }, [search, count, rootRef, highlight]);
  return null;
}

function useResultCount() {
  return useCommandState((state) => state.filtered.count);
}

function CommandResultAnnouncer({
  resultsLabel,
}: {
  resultsLabel: (count: number) => string;
}) {
  const { announce, Announcer } = useAnnouncer();
  const search = useCommandState((state) => state.search);
  const count = useResultCount();

  React.useEffect(() => {
    if (!search) return;
    announce(resultsLabel(count));
  }, [announce, count, search, resultsLabel]);

  return <Announcer />;
}

function Command({
  className,
  children,
  resultsLabel = defaultResultsLabel,
  filter,
  shouldFilter,
  value: valueProp,
  defaultValue,
  onValueChange,
  ref,
  onKeyDownCapture,
  onPointerMoveCapture,
  onInputCapture,
  onPasteCapture,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & {
  resultsLabel?: (count: number) => string;
}) {
  // OVL-20: cmdk highlights the first option after every search, so a search that matches nothing
  // would leave a footer action under the cursor and Enter would run it ("Assign to me" after a
  // typo). An action is highlighted only by a navigation key or the pointer; any other attempt is
  // vetoed: cmdk is handed a value no row carries until the caller's (or our own) value moves on.
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(rootRef, ref),
    [ref],
  );
  const navigating = React.useRef(false);
  const [innerValue, setInnerValue] = React.useState(defaultValue ?? "");
  // What cmdk is told to highlight while it would otherwise sit on an action: a row's value, or
  // nothing.
  const [override, setOverride] = React.useState<string | null>(null);
  // The value cmdk is handed this render: an override must differ from it to reach cmdk.
  const effective = React.useRef("");
  effective.current = override ?? valueProp ?? innerValue;
  const pending = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    if (override !== NO_HIGHLIGHT || pending.current === null) return;
    const next = pending.current;
    pending.current = null;
    setOverride(next);
  }, [override]);
  const highlight = React.useCallback(
    (next: string | null) => {
      // Nothing to highlight: "" (cmdk then highlights the first row of results that arrive
      // later), or a value no row carries when "" is already what cmdk was handed — the guard
      // below re-highlights once results arrive.
      // A row that is already what cmdk was handed can't reach it again unchanged (cmdk only
      // re-reads its value prop when the prop changes): hand it nothing for one render, then
      // the row.
      if (next !== null && next === effective.current) {
        pending.current = next;
        setOverride(NO_HIGHLIGHT);
      } else
        setOverride(next ?? (effective.current === "" ? NO_HIGHLIGHT : ""));
      setInnerValue(next ?? "");
      onValueChange?.(next ?? "");
    },
    [onValueChange],
  );
  const handleValueChange = (next: string) => {
    const action =
      next !== "" &&
      rootRef.current?.querySelector(
        `[data-slot="command-actions"] [cmdk-item][data-value="${CSS.escape(next)}"]`,
      );
    if (action && !navigating.current)
      return highlight(firstResult(rootRef.current));
    setOverride(null);
    setInnerValue(next);
    onValueChange?.(next);
  };
  // A caller's controlled value moving on ends an override.
  React.useEffect(() => setOverride(null), [valueProp]);
  const [actions, setActions] = React.useState(0);
  const add = React.useCallback(() => {
    setActions((n) => n + 1);
    return () => setActions((n) => n - 1);
  }, []);
  const registry = React.useMemo<CommandActionsRegistry>(
    () => ({ count: actions, add }),
    [actions, add],
  );
  return (
    <CommandRegistryContext.Provider value={registry}>
      <CommandPrimitive
        data-slot="command"
        className={cn(
          "flex min-h-0 size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
          className,
        )}
        ref={setRootRef}
        value={override ?? valueProp ?? innerValue}
        onValueChange={handleValueChange}
        onKeyDownCapture={(event) => {
          navigating.current =
            NAVIGATION_KEYS.has(event.key) ||
            (event.ctrlKey &&
              !event.metaKey &&
              !event.altKey &&
              NAVIGATION_CTRL_KEYS.has(event.key.toLowerCase()));
          onKeyDownCapture?.(event);
        }}
        onPointerMoveCapture={(event) => {
          navigating.current = true;
          onPointerMoveCapture?.(event);
        }}
        onInputCapture={(event) => {
          navigating.current = false;
          onInputCapture?.(event);
        }}
        onPasteCapture={(event) => {
          navigating.current = false;
          onPasteCapture?.(event);
        }}
        shouldFilter={shouldFilter}
        filter={filter}
        {...props}
      >
        {children}
        {actions > 0 ? (
          <ActionHighlightGuard rootRef={rootRef} highlight={highlight} />
        ) : null}
        <CommandResultAnnouncer resultsLabel={resultsLabel} />
      </CommandPrimitive>
    </CommandRegistryContext.Provider>
  );
}

// OVL-16 (widened): the dialog's size reaches the list inside it, which grows taller with it.
// The default is the wide palette (820px), not the Dialog's small default.
type CommandDialogSize = "sm" | "default" | "lg" | "xl";
const CommandDialogSizeContext = React.createContext<
  CommandDialogSize | undefined
>(undefined);

function CommandDialog({
  title = "Command palette",
  description = "Search for a command…",
  children,
  className,
  showCloseButton = false,
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  size?: CommandDialogSize;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          // A flex column with no gap: the list ends flush above the footer, with no empty
          // grid row (and its gap) left under it.
          "flex max-h-[calc(100dvh-var(--spacing)*8)] flex-col gap-0 overflow-hidden rounded-xl! p-0 data-[size=default]:sm:max-w-[51.25rem]",
          className,
        )}
        showCloseButton={showCloseButton}
        size={size}
      >
        <CommandDialogSizeContext.Provider value={size}>
          {children}
        </CommandDialogSizeContext.Provider>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:ps-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            // A11Y-2: cmdk's input carries no height of its own, so it measures its line box —
            // 20px inside the 32px InputGroup, under the 24px target floor the geometry lane
            // probes with a real `elementFromPoint`. `min-h-6` is the same correction Batch 3
            // applied to `ComboboxChipsInput` and the calendar's month/year dropdown.
            "min-h-6 w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

/**
 * A row under the search field for type chips (a `ToggleGroup` with `wrap`) and any other
 * controls — a Select, a DropdownMenu. Children wrap onto further lines.
 */
function CommandFilters({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-filters"
      className={cn(
        "flex flex-wrap items-center gap-1.5 px-1 pt-2 pb-1",
        className,
      )}
      {...props}
    />
  );
}

/** The animated search glyph, replayed while the search is running. */
function CommandSearchingIcon() {
  const ref = React.useRef<SearchIconHandle>(null);
  React.useEffect(() => {
    ref.current?.startAnimation();
    const id = window.setInterval(() => ref.current?.startAnimation(), 1200);
    return () => window.clearInterval(id);
  }, []);
  return <AnimatedSearchIcon ref={ref} size={16} aria-hidden />;
}

function CommandList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const count = useResultCount();
  const size = React.useContext(CommandDialogSizeContext) ?? "default";
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(listRef, ref),
    [ref],
  );

  // A11Y-7 (a role only where the context licenses it): a list with no options is not a listbox.
  // cmdk hard-codes `role="listbox"` AFTER spreading props, so the role can only be taken off the
  // node — and while the filtered count is 0 the element owns nothing but the empty message, which
  // axe reports as a critical `aria-required-children` violation. No dependency array on purpose:
  // React never re-applies an attribute it believes is unchanged, so every render has to reassert
  // this.
  // OVL-20: a `CommandActions` footer keeps its options while the search matches nothing, so the
  // list stays a listbox for as long as it holds ANY option, not only a filtered result.
  React.useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) return;
    if (
      count === 0 &&
      !node.querySelector("[data-slot=command-actions] [cmdk-item]")
    )
      node.removeAttribute("role");
    else node.setAttribute("role", "listbox");
  });

  return (
    <CommandPrimitive.List
      data-slot="command-list"
      data-size={size}
      ref={setRef}
      className={cn(
        "no-scrollbar max-h-72 scroll-pt-1 scroll-pb-[calc(var(--command-actions-height)+var(--spacing))] [--command-actions-height:0px] overflow-x-hidden overflow-y-auto outline-none data-[size=lg]:max-h-[min(28rem,60dvh)] data-[size=xl]:max-h-[min(28rem,60dvh)]",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  // OVL-20: shown when no RESULT matches — footer actions are not results (see useResultCount);
  // cmdk's own Empty counts them, so with a footer it would never show.
  const count = useResultCount();
  const { count: actions } = React.useContext(CommandRegistryContext);
  if (count > 0) return null;
  return (
    <div
      data-slot="command-empty"
      cmdk-empty=""
      role="presentation"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    >
      {/* A11Y-3: cmdk hard-codes `role="presentation"` on the empty slot too, so the polite role
          goes on the message itself. It is only ever rendered while the list above it has had its
          `role="listbox"` removed (A11Y-7), so a status is never nested inside a listbox. */}
      {/* With footer actions the list stays a listbox, and a status may not sit in one: the
          message is plain text there, and the result announcer (A11Y-3) speaks the empty count. */}
      <span role={actions > 0 ? undefined : "status"}>{children}</span>
    </div>
  );
}

/**
 * API-18 — cmdk's loading slot. cmdk renders it as a `progressbar` whose visible text is
 * `aria-hidden`; with no `progress` value that bar has nothing to report, so a screen reader hears
 * nothing of it. Without `progress` this part turns it into a polite `status` whose text is the
 * announcement (A11Y-3); with `progress` (0–100) it stays cmdk's labelled `progressbar`, so the
 * value still reaches assistive technology. Render it OUTSIDE `CommandList` (above it) or while
 * the list has no results: a status inside a listbox with options is an
 * `aria-required-children` violation.
 */
function CommandLoading({
  className,
  children,
  label = "Searching…",
  progress,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  const determinate = progress !== undefined;
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(nodeRef, ref),
    [ref],
  );

  // cmdk writes its role and ARIA AFTER spreading props, so they can only be corrected on the
  // node. No dependency array, as in `CommandList`: every render has to reassert it.
  React.useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node || determinate) return;
    node.setAttribute("role", "status");
    for (const name of [
      "aria-valuenow",
      "aria-valuemin",
      "aria-valuemax",
      "aria-label",
    ]) {
      node.removeAttribute(name);
    }
    node.firstElementChild?.removeAttribute("aria-hidden");
  });

  return (
    <CommandPrimitive.Loading
      // The status rewrite is on the node, so switching between the two modes remounts it
      // rather than leaving one mode's ARIA on the other's element.
      key={determinate ? "progress" : "status"}
      data-slot="command-loading"
      ref={setRef}
      label={label}
      progress={progress}
      className={cn(
        "flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <CommandSearchingIcon />
          {label}
        </>
      )}
    </CommandPrimitive.Loading>
  );
}

type CommandHint = { keys: React.ReactNode; label: React.ReactNode };

/**
 * API-18 — a footer part (key hints, a result count, a link) that sits OUTSIDE the listbox, so
 * it is never announced as an option. With no children it shows the built-in key hints
 * (↵ Open · ⌘↵ New tab · Esc Close); pass `hints` to change them, or children to replace them.
 * It sits flush with the palette's bottom edge — no padding below it.
 */
function CommandFooter({
  className,
  children,
  hints,
  ...props
}: React.ComponentProps<"div"> & { hints?: readonly CommandHint[] }) {
  const { os } = usePlatform();
  const shown = hints ?? [
    { keys: "↵", label: "Open" },
    { keys: os === "mac" ? "⌘↵" : "Ctrl ↵", label: "New tab" },
    { keys: "Esc", label: "Close" },
  ];
  return (
    <div
      data-slot="command-footer"
      className={cn(
        "-mx-1 -mb-1 mt-1 flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ??
        shown.map((hint, i) => (
          <KbdGroup key={i}>
            <Kbd>{hint.keys}</Kbd>
            {hint.label}
          </KbdGroup>
        ))}
    </div>
  );
}

const CommandActionsContext = React.createContext(false);

/**
 * OVL-20 — the static actions of a searchable list ("Assign to me", "Unassign", "Clear", "No
 * space"), as a footer at the end of `CommandList`: a hairline above, sticky to the list's bottom
 * while the results scroll, and never filtered — its `CommandItem`s stay through any search,
 * including one that matches nothing. They are ordinary options, so the arrow keys reach them after
 * the last result; give each a leading icon. The list keeps them clear of a scrolled-to row through
 * its bottom scroll padding, which this part measures.
 */
function CommandActions({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(nodeRef, ref),
    [ref],
  );
  React.useLayoutEffect(() => {
    const node = nodeRef.current;
    const list = node?.closest<HTMLElement>("[cmdk-list]");
    if (!node || !list) return;
    const measure = () =>
      list.style.setProperty(
        "--command-actions-height",
        `${node.offsetHeight}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    // cmdk ranks a search's results by re-appending them, and an ungrouped result lands after
    // the footer: put the footer back at the end, so it stays last on screen and in arrow order.
    const parent = node.parentElement;
    const keepLast = () => {
      if (parent && parent.lastElementChild !== node) parent.appendChild(node);
    };
    const order = new MutationObserver(keepLast);
    if (parent) order.observe(parent, { childList: true });
    keepLast();
    return () => {
      observer.disconnect();
      order.disconnect();
      list.style.removeProperty("--command-actions-height");
    };
  }, []);
  return (
    <CommandActionsContext.Provider value>
      <CommandPrimitive.Group
        data-slot="command-actions"
        ref={setRef}
        forceMount
        className={cn(
          "sticky bottom-0 z-10 border-t border-border bg-popover p-1 text-foreground",
          className,
        )}
        {...props}
      />
    </CommandActionsContext.Provider>
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  forceMount,
  keywords,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  // API-19: a two-line row links its `ItemDescription` as the option's description.
  const description = useItemDescriptionId(props["aria-describedby"]);
  // OVL-20: an action in the footer is never a search result, so the filter never hides it.
  const inActions = React.useContext(CommandActionsContext);
  const { add } = React.useContext(CommandRegistryContext);
  React.useLayoutEffect(
    () => (inActions ? add() : undefined),
    [inActions, add],
  );

  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      forceMount={forceMount ?? (inActions || undefined)}
      keywords={keywords}
      aria-describedby={description.id || undefined}
      className={cn(
        "group/command-item relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground data-selected:**:[svg:not([data-icon-tone])]:text-foreground",
        className,
      )}
      {...props}
    >
      <ItemDescriptionContext.Provider value={description.register}>
        {children}
      </ItemDescriptionContext.Provider>
      <CheckIcon className="ms-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type { CommandHint };
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandLoading,
  CommandFooter,
  CommandActions,
  CommandFilters,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
