// @vegastack suggestion-menu@0.25.66 sha256-Q5sRsTK79yo2BtP8fGeXx6BbzVSVwoxBPFdmBBghPGg=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn, mergeRefs } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * SuggestionMenu — the caret-anchored list an editor opens while you type a trigger (`@`, `/`,
 * `{{`), and the ONE copy of it.
 *
 * TextEdit's slash and mention menus and TemplateEditor's placeholder picker used to carry three
 * private copies of the same thing: a surface, rows, a viewport flip, a portal, a scroll-into-view
 * and an active index. They drifted — different row padding, radius and highlight — so this file
 * owns all of it, and its rows read exactly like `ComboboxItem`'s (the people picker's look):
 * `SUGGESTION_MENU_ROW` is `ComboboxItem`'s class string with the check-indicator gutter removed,
 * keyed to `data-highlighted` the same way, and `suggestion-menu.test.tsx` holds the two together.
 *
 * Why not Base UI's Combobox: focus (and the caret) must stay in the editor while the list is
 * open, and the anchor is a caret rect, not an element. So the editor keeps focus and owns the
 * keys (`suggestionMenuKeyDown`); this menu renders the listbox the editor points at with
 * `aria-activedescendant` (`suggestionMenuOptionId`).
 *
 * Off the components nav, like `panel-search`: an internal shared part, documented in the
 * components guide and on the pages of the editors that open it.
 * ----------------------------------------------------------------------------------------------*/

/**
 * One row of a `SuggestionMenu`.
 *
 * @example
 * const option: SuggestionMenuOption = { key: "power", label: "Power", description: "W" };
 */
export interface SuggestionMenuOption {
  /** Stable React key, unique within the menu. */
  key: string;
  /** The row's text; truncates to one line. */
  label: React.ReactNode;
  /**
   * Leading glyph. A bare icon takes the row's muted ink (and the highlight's ink); an icon
   * carrying `data-icon-tone` keeps its own colour, as in `ComboboxItem`.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Muted trailing text — a unit, an email, a folder. Truncates before the label does.
   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * A keyboard hint at the end of the row, in `DropdownMenuShortcut`'s look.
   * @default undefined
   */
  shortcut?: React.ReactNode;
  /**
   * The heading of the group this row belongs to. Consecutive rows with the same `group` render
   * under one heading; pass the rows already in group order.
   * @default undefined
   */
  group?: string;
  /**
   * Shown but not choosable: muted, `aria-disabled`, and a click or <kbd>Enter</kbd> does nothing
   * (say why in `description`).
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for `SuggestionMenu`.
 *
 * @example
 * <SuggestionMenu id={listId} aria-label="Insert placeholder" anchor={rect} options={options}
 *   activeIndex={index} onActiveIndexChange={setIndex} onSelect={pick} />
 */
export interface SuggestionMenuProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "id" | "onSelect" | "children" | "aria-label"
> {
  /** The listbox's id — the editor's `aria-controls`, and the stem of every option id. */
  id: string;
  /** Accessible name of the listbox ("Insert block", "Mention"). */
  "aria-label": string;
  /** The caret's viewport rect; the menu sits below it, or above when below is short. */
  anchor: DOMRect | null;
  /** The rows, in menu order (the order the arrow keys walk). */
  options: readonly SuggestionMenuOption[];
  /** The one active row, moved by the arrow keys and by pointer movement. */
  activeIndex: number;
  /** Pointer movement over a row makes it active. */
  onActiveIndexChange: (index: number) => void;
  /** A click on a row picks it. */
  onSelect: (index: number) => void;
  /**
   * Shown instead of the rows (an error), and announced politely. With no rows and no status,
   * the menu shows (and announces) `emptyMessage` — or, while `loading`, placeholder rows, and
   * announces `loadingMessage`.
   * @default undefined
   */
  status?: string;
  /**
   * What the placeholder rows announce while a search with nothing to show yet runs.
   * @default "Searching…"
   */
  loadingMessage?: string;
  /**
   * What an empty list says.
   * @default "No results"
   */
  emptyMessage?: string;
  /**
   * A search is running: the rows on show are about to change (`aria-busy` on the listbox), and
   * the menu holds its height until they do, so it never shrinks and regrows under the caret.
   * With no rows yet it shows placeholder rows in the rows' own geometry (a grouped list's
   * heading, icon, label and description) — as tall as the menu grows when it opens, as tall as
   * it already is after that — so an answer lands in the box they hold.
   * @default false
   */
  loading?: boolean;
  /**
   * Px the menu keeps clear at the viewport's top and bottom, beyond its 8px edge gap — a sticky
   * app header's height (`{ top: 56 }`) or a bottom bar's.
   * @default undefined
   */
  floatingSafeArea?: { top?: number; bottom?: number };
}

/** The popup surface: the combobox popup's chrome (border, radius, shadow, padding). */
const SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md overflow-y-auto overscroll-contain scroll-py-1 no-scrollbar";

/**
 * `ComboboxItem`'s row, verbatim apart from `pe-8` → `pe-1.5`: a suggestion row has no check
 * indicator to leave room for. Keyed to `data-highlighted`, as Base UI keys `ComboboxItem`.
 *
 * @example
 * <div role="option" data-highlighted="" className={SUGGESTION_MENU_ROW}>Power</div>
 */
export const SUGGESTION_MENU_ROW =
  "relative flex w-full items-center gap-2 rounded-md py-1 pe-1.5 ps-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:[&:not([data-icon-tone],[data-icon-tone]_*)]:text-accent-foreground data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground data-highlighted:**:[svg:not([data-icon-tone])]:text-accent-foreground";

/** `ComboboxLabel`'s group heading. */
const GROUP_LABEL = "px-2 py-1.5 text-xs text-muted-foreground";
/** `ComboboxStatus`'s visible row. */
const STATUS = "px-2 py-1.5 text-sm text-muted-foreground";

/** A placeholder row's label and description widths, varied so the list reads as text. */
const SKELETON_ROWS: readonly [string, string][] = [
  ["w-28", "w-14"],
  ["w-36", "w-10"],
  ["w-24", "w-16"],
  ["w-32", "w-12"],
  ["w-20", "w-14"],
];

/**
 * The rows a first search stands in for: two groups of five, each a heading and rows with the
 * row's geometry (a 20px icon, the label, the muted description). The surface clips them at its
 * height, so the list opens as tall as its answer usually is.
 */
function SuggestionMenuSkeleton() {
  return (
    <div aria-hidden data-slot="suggestion-menu-skeleton">
      {[0, 1].map((group) => (
        <div key={group}>
          <div className={GROUP_LABEL}>
            <Skeleton className="h-4 w-16 rounded-sm" />
          </div>
          {SKELETON_ROWS.map(([label, description], at) => (
            <div key={at} className={SUGGESTION_MENU_ROW}>
              <Skeleton className="size-5 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1">
                <Skeleton className={cn("h-3.5 max-w-full", label)} />
              </div>
              <Skeleton className={cn("h-3 shrink-0", description)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Tallest the list grows (`ComboboxList`'s 18rem), and the least it shrinks to near an edge. */
const MAX_HEIGHT = 288;
const MIN_HEIGHT = 120;
/** Gap from the caret, and from the viewport's edges. */
const CARET_GAP = 4;
const VIEWPORT_GAP = 8;

/**
 * The DOM id of option `index` in the listbox `listId` — what the editor's
 * `aria-activedescendant` points at.
 *
 * @example
 * attributes["aria-activedescendant"] = suggestionMenuOptionId(listId, index);
 */
export function suggestionMenuOptionId(listId: string, index: number) {
  return `${listId}-option-${index}`;
}

/**
 * What `suggestionMenuKeyDown` drives.
 *
 * @example
 * const target: SuggestionMenuKeyTarget = { count, activeIndex, onActiveIndexChange, onSelect, onClose };
 */
export interface SuggestionMenuKeyTarget {
  /** How many rows the menu shows. */
  count: number;
  /** The active row. */
  activeIndex: number;
  /** Move the active row. */
  onActiveIndexChange: (index: number) => void;
  /** Pick the row at `index`. */
  onSelect: (index: number) => void;
  /** Close the menu (Escape). */
  onClose: () => void;
  /**
   * While the list is empty, still claim ↑ ↓ and Enter (a search is in flight: the caret must not
   * move away, and Enter must not break the line).
   * @default false
   */
  holdWhenEmpty?: boolean;
}

/**
 * The menu's keys, for the editor that keeps focus: ↑/↓ move the active row (wrapping), Enter and
 * Tab pick it, Escape closes the menu without reaching the host (a dialog stays open). Returns
 * whether the key was handled — a Tiptap suggestion's `onKeyDown` returns it as is.
 *
 * @example
 * onKeyDown: ({ event }) => suggestionMenuKeyDown(event, { count, activeIndex, onActiveIndexChange, onSelect, onClose })
 */
export function suggestionMenuKeyDown(
  event: KeyboardEvent,
  {
    count,
    activeIndex,
    onActiveIndexChange,
    onSelect,
    onClose,
    holdWhenEmpty = false,
  }: SuggestionMenuKeyTarget,
): boolean {
  if (event.key === "Escape") {
    event.stopPropagation();
    onClose();
    return true;
  }
  const arrow = event.key === "ArrowDown" || event.key === "ArrowUp";
  if (!count) return holdWhenEmpty && (arrow || event.key === "Enter");
  if (arrow) {
    const step = event.key === "ArrowDown" ? 1 : -1;
    onActiveIndexChange((activeIndex + step + count) % count);
    return true;
  }
  if (event.key === "Enter" || event.key === "Tab") {
    onSelect(Math.min(activeIndex, count - 1));
    return true;
  }
  return false;
}

/**
 * Below the caret unless it would not fit and above has more room; slid to stay on screen, clear
 * of the safe area at the viewport's top and bottom.
 */
function place(
  node: HTMLElement,
  anchor: DOMRect,
  safeTop: number,
  safeBottom: number,
) {
  const below = anchor.bottom + CARET_GAP;
  const roomBelow = window.innerHeight - below - VIEWPORT_GAP - safeBottom;
  const roomAbove = anchor.top - CARET_GAP - VIEWPORT_GAP - safeTop;
  const flip = roomBelow < MAX_HEIGHT && roomAbove > roomBelow;
  const left = Math.max(
    VIEWPORT_GAP,
    Math.min(anchor.left, window.innerWidth - node.offsetWidth - VIEWPORT_GAP),
  );
  node.style.left = `${left}px`;
  node.style.maxHeight = `${Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, flip ? roomAbove : roomBelow))}px`;
  node.style.top = flip ? "" : `${below}px`;
  node.style.bottom = flip
    ? `${window.innerHeight - anchor.top + CARET_GAP}px`
    : "";
  node.dataset.side = flip ? "top" : "bottom";
}

/**
 * `SuggestionMenu` — the list an editor opens at the caret while you type a trigger. It renders
 * into `<body>` (with the theme scope restored), never takes focus, and keeps the caret where it
 * is on click. Rows look exactly like `ComboboxItem`'s; the active row (`activeIndex`) follows the
 * editor's arrow keys and the pointer's movement — movement, not enter, so a keyboard scroll that
 * slides rows under a resting pointer never steals it. With no rows it shows `status` or
 * `emptyMessage` in place of an empty listbox, and announces a text message politely.
 *
 * @example
 * <SuggestionMenu
 *   id={listId}
 *   aria-label="Insert placeholder"
 *   anchor={caretRect}
 *   options={tokens.map((token) => ({ key: token.id, label: token.label, description: token.hint }))}
 *   activeIndex={index}
 *   onActiveIndexChange={setIndex}
 *   onSelect={(at) => insert(tokens[at])}
 * />
 */
export function SuggestionMenu({
  id,
  "aria-label": ariaLabel,
  anchor,
  options,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  status,
  emptyMessage = "No results",
  loadingMessage = "Searching…",
  loading = false,
  floatingSafeArea,
  className,
  style,
  ref,
  ...props
}: SuggestionMenuProps) {
  const themeScope = useInternalThemeScope();
  const { announce, Announcer } = useAnnouncer();
  const localRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(() => mergeRefs(localRef, ref), [ref]);

  const showRows = options.length > 0 && status == null;
  const placeholder = !showRows && status == null && loading;
  const message = showRows
    ? null
    : placeholder
      ? loadingMessage
      : (status ?? emptyMessage);
  const open = anchor !== null;
  // The surface's height after the last render: held while a search is in flight.
  const heldHeight = React.useRef(0);

  // The message is announced through a region mounted (empty) with the menu, outside the busy
  // listbox — a status that mounts already filled, or changes under `aria-busy`, may go unspoken.
  React.useEffect(() => {
    if (open && message) announce(message);
  }, [open, message, announce]);

  React.useLayoutEffect(() => {
    const node = localRef.current;
    if (!node || !anchor) {
      heldHeight.current = 0;
      return;
    }
    place(
      node,
      anchor,
      floatingSafeArea?.top ?? 0,
      floatingSafeArea?.bottom ?? 0,
    );
    // Rows about to be replaced never let the surface shrink, and placeholder rows after the
    // first answer never let it grow: the answer lands in the same box.
    const held =
      loading && heldHeight.current
        ? `${Math.min(heldHeight.current, parseFloat(node.style.maxHeight) || MAX_HEIGHT)}px`
        : "";
    node.style.minHeight = held;
    node.style.height = placeholder ? held : "";
    heldHeight.current = node.offsetHeight;
  });

  // The active row scrolls into view inside the list only — never the page.
  React.useLayoutEffect(() => {
    const list = localRef.current;
    const row = list?.querySelector<HTMLElement>("[data-highlighted]");
    if (!list || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top - 4;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight + 4;
  }, [activeIndex, showRows]);

  if (!anchor || typeof document === "undefined") return null;

  // Rows in menu order, split into runs that share a heading.
  const runs: { group?: string; start: number }[] = [];
  options.forEach((option, index) => {
    const last = runs[runs.length - 1];
    if (!last || options[last.start]!.group !== option.group)
      runs.push({ group: option.group, start: index });
  });

  const row = (option: SuggestionMenuOption, index: number) => {
    const active = index === activeIndex;
    return (
      <div
        key={option.key}
        id={suggestionMenuOptionId(id, index)}
        role="option"
        aria-selected={active}
        aria-disabled={option.disabled || undefined}
        data-slot="suggestion-menu-option"
        data-highlighted={active ? "" : undefined}
        data-disabled={option.disabled ? "" : undefined}
        onMouseMove={() => {
          if (!active) onActiveIndexChange(index);
        }}
        onClick={() => {
          if (!option.disabled) onSelect(index);
        }}
        className={cn(
          SUGGESTION_MENU_ROW,
          option.disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {option.icon}
        <span
          data-slot="suggestion-menu-label"
          className="min-w-0 flex-1 truncate"
        >
          {option.label}
        </span>
        {option.description != null ? (
          <span
            data-slot="suggestion-menu-description"
            className="max-w-[45%] shrink-0 truncate text-xs text-muted-foreground"
          >
            {option.description}
          </span>
        ) : null}
        {option.shortcut != null ? (
          <span
            data-slot="suggestion-menu-shortcut"
            className="ms-auto text-xs tracking-widest text-muted-foreground"
          >
            {option.shortcut}
          </span>
        ) : null}
      </div>
    );
  };

  return createPortal(
    <div
      data-slot="suggestion-menu-layer"
      className={cn("contents", themeScope)}
    >
      <div
        ref={setRef}
        id={id}
        data-slot="suggestion-menu"
        // A list with no options is not a listbox (A11Y-7): the message is a status instead.
        role={showRows ? "listbox" : undefined}
        aria-label={showRows ? ariaLabel : undefined}
        aria-busy={(loading && (showRows || placeholder)) || undefined}
        data-loading={placeholder ? "" : undefined}
        style={{ position: "fixed", ...style }}
        // Keep focus (and the caret) in the editor.
        onMouseDown={(event) => event.preventDefault()}
        className={cn(SURFACE, "w-64 data-loading:overflow-hidden", className)}
        {...props}
      >
        {showRows ? (
          runs.map((run, at) => {
            const end = runs[at + 1]?.start ?? options.length;
            const rows = options
              .slice(run.start, end)
              .map((option, offset) => row(option, run.start + offset));
            if (run.group === undefined)
              return (
                <React.Fragment key={`run-${run.start}`}>{rows}</React.Fragment>
              );
            const labelId = `${id}-group-${run.start}`;
            return (
              <div
                key={`run-${run.start}`}
                role="group"
                aria-labelledby={labelId}
                data-slot="suggestion-menu-group"
              >
                <div
                  id={labelId}
                  data-slot="suggestion-menu-group-label"
                  className={GROUP_LABEL}
                >
                  {run.group}
                </div>
                {rows}
              </div>
            );
          })
        ) : placeholder ? (
          <SuggestionMenuSkeleton />
        ) : (
          <div data-slot="suggestion-menu-status" className={STATUS}>
            {message}
          </div>
        )}
      </div>
      <Announcer />
    </div>,
    document.body,
  );
}
