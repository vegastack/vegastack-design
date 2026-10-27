// @vegastack record-peek@0.25.89 sha256-wUYge9VeD6MZWQPRC8f9EzgIYNnANL0vRH4+oK9K3oI=

"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Maximize2, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { useDirection } from "@/components/ui/direction";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatShortcut,
  isEditableTarget,
  usePlatform,
} from "@/components/ui/use-platform";

/* ------------------------------------------------------------------------------------------------
 * RecordPeek — the one way a record opens beside the list it came from: a non-modal panel at the
 * window's end edge that leaves the list usable, resizable by its start edge, with a header that
 * walks the list (↑/↓ and J/K, "n of N"), opens the record's full page (⌘↵ / Ctrl+↵) and closes
 * (Esc, focus back to the row it was opened from). Below the `tablet` tier (40rem) it is the whole
 * screen. It knows no record kinds: the app passes the label, the position, the full-page link and
 * the body.
 * ----------------------------------------------------------------------------------------------*/

const STEP = 32;

/** Where the open record sits in the list it was opened from. */
export interface RecordPeekPosition {
  /** Zero-based index of the open record in the list's visible order. */
  index: number;
  /** How many records the list holds. */
  total: number;
}

/** Props accepted by `RecordPeek`. */
export interface RecordPeekProps extends Omit<
  React.ComponentProps<typeof DrawerContent>,
  "children" | "title"
> {
  /** Whether the peek is open. */
  open: boolean;
  /** Called when the peek asks to close (Esc, the close button) — and with `true` never. */
  onOpenChange: (open: boolean) => void;
  /**
   * The record's kind as a noun ("Task", "Row") — the panel's accessible name, and the noun in
   * the previous/next labels.
   */
  label: string;
  /**
   * The record body: `RecordPeekBody` holding a `RecordHeader` and the record's sections.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * The open record's place in its list; shows "3 of 41" and disables previous/next at the ends.
   * @default undefined
   */
  position?: RecordPeekPosition;
  /**
   * Walk to the previous record (button, ↑, K). Omit when there is none.
   * @default undefined
   */
  onPrevious?: () => void;
  /**
   * Walk to the next record (button, ↓, J). Omit when there is none.
   * @default undefined
   */
  onNext?: () => void;
  /**
   * The record's full page. Rendered as a link (pass `fullLink` for a router link); ⌘↵ / Ctrl+↵
   * follows it.
   * @default undefined
   */
  fullHref?: string;
  /**
   * A router link to render the open-full button as (`<Link href="/tasks/42" />`); its `href`
   * wins over `fullHref` for the button, and ⌘↵ clicks it.
   * @default undefined
   */
  fullLink?: React.ReactElement;
  /**
   * Opens the full page instead of a link (a client navigation the app owns).
   * @default undefined
   */
  onOpenFull?: () => void;
  /** @default "Open full page" */
  fullLabel?: string;
  /**
   * The header's end slot before open-full and close: the record's ⋯ menu, a Share button.
   * @default undefined
   */
  actions?: React.ReactNode;
  /** @default "Close" */
  closeLabel?: string;
  /**
   * "n of N" text for the position, for another language.
   * @default (index, total) => `${index + 1} of ${total}`
   */
  formatPosition?: (index: number, total: number) => string;
  /**
   * The panel width in px (controlled). Pair with `onWidthChange`.
   * @default undefined
   */
  width?: number;
  /**
   * The starting width when uncontrolled, in px.
   * @default 640
   */
  defaultWidth?: number;
  /**
   * Called as the separator moves the width (pointer, or ← → / Home / End on it).
   * @default undefined
   */
  onWidthChange?: (width: number) => void;
  /**
   * The narrowest the separator goes, in px.
   * @default 480
   */
  minWidth?: number;
  /**
   * The widest the separator goes, as a share of the window.
   * @default 0.9
   */
  maxShare?: number;
  /**
   * Remembers an uncontrolled width in `localStorage` under this key, per browser.
   * @default undefined
   */
  storageKey?: string;
  /**
   * Bind ↑/↓, J/K and ⌘↵ / Ctrl+↵ on the document while open — never while typing, while a
   * menu, list box, popover or another dialog is open, and ↑/↓ never from a control that uses
   * them (a grid, a tab list, a select trigger).
   * @default true
   */
  keyboard?: boolean;
  /**
   * Where focus goes when the peek closes: the row it was opened from. A function is read at
   * close time — keep the row (or its id) from when the peek opened, since the open record's id
   * is usually cleared by then.
   * @default undefined
   */
  returnFocus?: HTMLElement | null | (() => HTMLElement | null);
}

function clampWidth(width: number, min: number, maxShare: number): number {
  if (typeof window === "undefined") return Math.max(min, width);
  // The window's cap wins over the minimum when the window is too narrow for both.
  const cap = window.innerWidth * maxShare;
  return Math.round(Math.max(Math.min(min, cap), Math.min(width, cap)));
}

function readStoredWidth(key: string | undefined): number | undefined {
  if (!key) return undefined;
  try {
    const n = Number(window.localStorage.getItem(key));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  } catch {
    return undefined;
  }
}

function storeWidth(key: string | undefined, width: number) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, String(width));
  } catch {
    // Storage blocked (private window): the width just isn't remembered.
  }
}

/** A popup that owns the arrow keys or Enter while it is open. */
const KEY_OWNERS =
  "[role='menu'], [role='listbox'], [data-slot='popover-content'], [role='alertdialog']";

/** Elements that take every key themselves: a combobox, an open listbox or menu. */
const KEY_TAKERS =
  "[role='combobox'], [role='menu'], [role='listbox'], [role='alertdialog'], [data-slot='popover-content']";

/** Controls whose own keyboard model uses ↑/↓. */
const ARROW_OWNERS =
  "[role='grid'], [role='treegrid'], [role='tree'], [role='tablist'], [role='radiogroup'], [role='slider'], [role='spinbutton'], [aria-haspopup='listbox'], [aria-haspopup='menu'], [aria-haspopup='true']";

/**
 * `RecordPeek` — a record opened beside its list. Non-modal (the list stays usable, a click on
 * another row switches the record), at the window's end edge, resizable by a separator on its
 * start edge (480px up to 90% of the window, remembered with `storageKey`), and the whole screen
 * below the `tablet` tier. The header walks the list — ↑/↓ and J/K, "n of N" from `position`,
 * the buttons disabled at the ends — opens the full page with ⌘↵ / Ctrl+↵, holds the record's
 * `actions`, and closes with Esc, returning focus to `returnFocus` (the row it came from). Put the
 * record in `RecordPeekBody`; keep the body mounted while walking so only its data changes.
 *
 * Lists mark the open row with `activeRowId` (`DataList`, `DataGrid`, `Board`) or
 * `useRecordPeekRow`, which sets `data-peek-active` and scrolls the row into view.
 *
 * @example
 * <RecordPeek
 *   open={peek != null}
 *   onOpenChange={(open) => !open && closePeek()}
 *   label="Task"
 *   position={{ index, total: order.length }}
 *   onPrevious={index > 0 ? () => openPeek(order[index - 1]) : undefined}
 *   onNext={index < order.length - 1 ? () => openPeek(order[index + 1]) : undefined}
 *   fullLink={<Link href={`/tasks/${peek}`} />}
 *   actions={<TaskMenu id={peek} />}
 *   storageKey="peek-width"
 *   returnFocus={() => originRow.current} // set when the row opened the peek
 * >
 *   <RecordPeekBody>
 *     <RecordHeader title={task.title} keyBadge={task.ref} />
 *     <TaskSections task={task} />
 *   </RecordPeekBody>
 * </RecordPeek>
 */
export function RecordPeek({
  open,
  onOpenChange,
  label,
  children,
  position,
  onPrevious,
  onNext,
  fullHref,
  fullLink,
  onOpenFull,
  fullLabel = "Open full page",
  actions,
  closeLabel = "Close",
  formatPosition = (index, total) => `${index + 1} of ${total}`,
  width: widthProp,
  defaultWidth = 640,
  onWidthChange,
  minWidth = 480,
  maxShare = 0.9,
  storageKey,
  keyboard = true,
  returnFocus,
  className,
  style,
  ref,
  ...props
}: RecordPeekProps) {
  const { os } = usePlatform();
  const direction = useDirection();
  const rtl = direction === "rtl";
  const [innerWidth, setInnerWidth] = React.useState(defaultWidth);
  React.useEffect(() => {
    const stored = readStoredWidth(storageKey);
    if (stored !== undefined)
      setInnerWidth(clampWidth(stored, minWidth, maxShare));
  }, [storageKey, minWidth, maxShare]);
  // The width the panel can have in this window: the window may have narrowed since the width
  // was chosen, so the drag origin and `aria-valuenow` read what is drawn, not what was asked.
  const [viewport, setViewport] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const read = () => setViewport(window.innerWidth);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [open]);
  const asked = widthProp ?? innerWidth;
  const cap = viewport === null ? null : viewport * maxShare;
  const floor = cap === null ? minWidth : Math.round(Math.min(minWidth, cap));
  const width =
    cap === null ? asked : Math.round(Math.max(floor, Math.min(asked, cap)));
  const setWidth = React.useCallback(
    (next: number, persist: boolean) => {
      const clamped = clampWidth(next, minWidth, maxShare);
      if (widthProp === undefined) setInnerWidth(clamped);
      onWidthChange?.(clamped);
      if (persist) storeWidth(storageKey, clamped);
    },
    [widthProp, minWidth, maxShare, onWidthChange, storageKey],
  );

  const atStart = position ? position.index <= 0 : false;
  const atEnd = position ? position.index >= position.total - 1 : false;
  const canPrevious = onPrevious !== undefined && !atStart;
  const canNext = onNext !== undefined && !atEnd;

  const fullRef = React.useRef<HTMLElement | null>(null);
  const hasFull =
    fullHref !== undefined ||
    fullLink !== undefined ||
    onOpenFull !== undefined;

  // The newest handlers, so the document listener is bound once per open.
  const latest = React.useRef({
    canPrevious,
    canNext,
    onPrevious,
    onNext,
    onOpenFull,
    hasFull,
  });
  latest.current = {
    canPrevious,
    canNext,
    onPrevious,
    onNext,
    onOpenFull,
    hasFull,
  };

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const setPanelRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(panelRef, ref as React.Ref<HTMLDivElement>),
    [ref],
  );

  React.useEffect(() => {
    if (!open || !keyboard) return;
    const onKey = (event: KeyboardEvent) => {
      // Bubbling, so a control inside the page or the peek handles its own keys first and claims
      // them with `preventDefault` — a list's own J/K cursor, a composer's ⌘↵ send.
      if (event.defaultPrevented || event.isComposing) return;
      const now = latest.current;
      const first = event.composedPath?.()[0] ?? event.target;
      const target = first instanceof Element ? first : null;
      // A field, a combobox, an open popup or another dialog owns its keys.
      if (isEditableTarget(event)) return;
      if (target?.closest(KEY_TAKERS)) return;
      if (document.querySelector(KEY_OWNERS)) return;
      const dialog = target?.closest("[role='dialog']");
      if (dialog && !dialog.contains(panelRef.current)) return;
      if (document.querySelector("[role='dialog'][aria-modal='true']")) return;
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key === "Enter"
      ) {
        if (!now.hasFull) return;
        event.preventDefault();
        if (now.onOpenFull) now.onOpenFull();
        else fullRef.current?.click();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
        return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const arrow = key === "ArrowDown" || key === "ArrowUp";
      // A control that moves with the arrows keeps them (a grid, a tab list, a slider); J and K
      // still walk from there.
      if (arrow && target?.closest(ARROW_OWNERS)) return;
      const by =
        key === "ArrowDown" || key === "j"
          ? 1
          : key === "ArrowUp" || key === "k"
            ? -1
            : 0;
      if (by === 0) return;
      event.preventDefault();
      if (by > 0 && now.canNext) now.onNext?.();
      if (by < 0 && now.canPrevious) now.onPrevious?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, keyboard]);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = width;
    // The panel sits at the end edge: dragging towards the start widens it.
    let next = startWidth;
    const onMove = (move: PointerEvent) => {
      const delta = rtl ? move.clientX - startX : startX - move.clientX;
      next = startWidth + delta;
      setWidth(next, false);
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      setWidth(next, true);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  };

  const onSeparatorKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const wider = rtl ? "ArrowRight" : "ArrowLeft";
    const narrower = rtl ? "ArrowLeft" : "ArrowRight";
    if (event.key === wider) setWidth(width + STEP, true);
    else if (event.key === narrower) setWidth(width - STEP, true);
    else if (event.key === "Home") setWidth(floor, true);
    else if (event.key === "End") setWidth(Number.POSITIVE_INFINITY, true);
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  const fullShortcut = formatShortcut(["mod", "enter"], os);
  const maxWidth =
    viewport === null ? undefined : Math.round(viewport * maxShare);
  const finalFocus = React.useCallback(() => {
    const row = typeof returnFocus === "function" ? returnFocus() : returnFocus;
    return row ?? true;
  }, [returnFocus]);

  const fullButtonProps = {
    variant: "ghost" as const,
    size: "icon-sm" as const,
    "aria-label": fullLabel,
    "aria-keyshortcuts": "Meta+Enter Control+Enter",
    "data-slot": "record-peek-open-full",
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
      // The panel sits at the end edge: the right in a left-to-right page, the left in RTL (the
      // drawer's swipe directions are physical; its edge classes are logical, so RTL is restated).
      swipeDirection={rtl ? "left" : "right"}
      modal={false}
      disablePointerDismissal
    >
      <DrawerContent
        ref={setPanelRef}
        data-slot="record-peek"
        initialFocus={false}
        finalFocus={returnFocus === undefined ? undefined : finalFocus}
        style={
          {
            ...style,
            "--record-peek-width": `${width}px`,
            "--record-peek-max": `${maxShare * 100}vw`,
          } as React.CSSProperties
        }
        className={cn(
          rtl &&
            "data-[swipe-direction=left]:start-auto data-[swipe-direction=left]:end-0",
          // The drawer's own side widths are keyed on the swipe axis; restate on the same keys.
          "data-[swipe-axis=x]:[--drawer-content-width:min(var(--record-peek-width),var(--record-peek-max),calc(100vw-1rem))] data-[swipe-axis=x]:sm:[--drawer-content-width:min(var(--record-peek-width),var(--record-peek-max),calc(100vw-1rem))]",
          // Phone (below the tablet tier, 40rem): the whole screen, edge to edge.
          "data-[swipe-axis=x]:max-sm:[--drawer-content-width:100vw] max-sm:[--drawer-inset:0px] max-sm:rounded-none max-sm:border-0 max-sm:pt-[env(safe-area-inset-top)] max-sm:pb-[env(safe-area-inset-bottom)]",
          className,
        )}
        {...props}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize the ${label.toLowerCase()} panel`}
          aria-valuenow={width}
          aria-valuemin={floor}
          aria-valuemax={maxWidth}
          tabIndex={0}
          data-slot="record-peek-resize"
          onPointerDown={startResize}
          onKeyDown={onSeparatorKey}
          className="absolute inset-y-3 start-0 z-20 w-1 cursor-col-resize rounded-full transition-colors hover:bg-border focus-visible:bg-border max-sm:hidden"
        />
        <div
          data-slot="record-peek-header"
          className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-2"
        >
          <DrawerTitle className="sr-only">{label}</DrawerTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Previous ${label.toLowerCase()}`}
            aria-keyshortcuts="ArrowUp K"
            disabled={!canPrevious}
            onClick={onPrevious}
            data-slot="record-peek-previous"
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Next ${label.toLowerCase()}`}
            aria-keyshortcuts="ArrowDown J"
            disabled={!canNext}
            onClick={onNext}
            data-slot="record-peek-next"
          >
            <ArrowDown />
          </Button>
          {position && position.total > 1 && position.index >= 0 ? (
            <span
              data-slot="record-peek-position"
              className="shrink-0 px-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
            >
              {formatPosition(position.index, position.total)}
            </span>
          ) : null}
          <div
            data-slot="record-peek-actions"
            className="ms-auto flex min-w-0 items-center gap-1"
          >
            {actions}
            {hasFull ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    onOpenFull !== undefined ||
                    (fullLink === undefined && fullHref === undefined) ? (
                      <Button
                        {...fullButtonProps}
                        ref={fullRef as React.Ref<HTMLButtonElement>}
                        onClick={onOpenFull}
                      />
                    ) : (
                      // Navigation stays a real link wearing the button's classes (a link through
                      // `Button` would get `role="button"`): the router's own link, or a plain one.
                      React.cloneElement(fullLink ?? <a href={fullHref} />, {
                        ref: fullRef,
                        "aria-label": fullLabel,
                        "aria-keyshortcuts": "Meta+Enter Control+Enter",
                        "data-slot": "record-peek-open-full",
                        className: buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        }),
                      } as React.HTMLAttributes<HTMLElement> & {
                        ref: React.Ref<HTMLElement>;
                      })
                    )
                  }
                >
                  <Maximize2 />
                </TooltipTrigger>
                <TooltipContent>
                  {fullLabel}
                  <Kbd>{fullShortcut}</Kbd>
                </TooltipContent>
              </Tooltip>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={closeLabel}
              aria-keyshortcuts="Escape"
              onClick={() => onOpenChange(false)}
              data-slot="record-peek-close"
            >
              <X />
            </Button>
          </div>
        </div>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

/** Props accepted by `RecordPeekBody`. */
export type RecordPeekBodyProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordPeekBody` — the peek's scrolling body, below the header: the record's header and
 * sections, padded like a record page's main column. Keep it mounted while walking the list.
 *
 * @example
 * <RecordPeekBody><RecordHeader title="Plan Q4" /></RecordPeekBody>
 */
export function RecordPeekBody({ className, ...props }: RecordPeekBodyProps) {
  return (
    <div
      data-slot="record-peek-body"
      className={cn(
        "@container/record-peek flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4 select-text sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
