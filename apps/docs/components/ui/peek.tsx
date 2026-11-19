// @vegastack peek@0.123.2 sha256-6bUtYhBCn8mRCEvvwsaKjGy4jif0Jr8IQnN+lCnTs0U=

"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Maximize2, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { isEditableTarget } from "@/components/ui/use-platform";

/* ------------------------------------------------------------------------------------------------
 * Peek — look at a record without leaving its list (layout v2, D5). On a wide screen it is a sheet
 * over the page area's right side; the rail, the column and the global bar stay uncovered because
 * it sits inside the page area (`absolute`, anchored to the nearest positioned box). It is a
 * NON-MODAL dialog (WAI-ARIA APG, dialog pattern, non-modal variant): the list behind stays live,
 * so a click on another row swaps the record and the list keeps its scroll. Focus moves into the
 * peek when a person opens it (without scrolling anything), Tab is not trapped, F6 moves between
 * the peek and the row that opened it, and Escape closes it and returns focus to that row.
 *
 * On a phone it is a bottom sheet (`PeekSheet`, upstream's Base UI drawer) with two snap points,
 * ≈55 % and ≈92 % of the screen: drag up to expand, drag down to close; a tap inside never closes
 * it. That sheet is modal, as a phone sheet must be: focus stays inside until it closes.
 * ----------------------------------------------------------------------------------------------*/

/** The narrowest a side peek can be, in px. */
export const PEEK_MIN_WIDTH = 420;
/** The widest a side peek can be, as a share of the page area. */
export const PEEK_MAX_RATIO = 0.7;
/** The side peek's width when the app has none saved, in px. */
export const PEEK_DEFAULT_WIDTH = 560;
/** The phone sheet's snap points: about half the screen, then nearly all of it. */
export const PEEK_SNAP_POINTS = [0.55, 0.92] as const;

const RESIZE_STEP = 32;
const PHONE_QUERY = "(max-width: 639px)";
/** A popup that owns Escape while it is open: menus and popovers close before the peek. */
const ESC_OWNERS =
  "[role='menu'], [data-open] [role='listbox'], [role='listbox'][data-open], [data-slot='popover-content'], [role='alertdialog'], [role='dialog'][aria-modal='true']";

interface PeekContextValue {
  /** Which surface the peek is drawn as. */
  surface: "side" | "sheet";
  titleId: string;
  close: () => void;
  /** `PeekTitle` registers itself, so the dialog is named by the record's own title. */
  setHasTitle: (has: boolean) => void;
}

const PeekContext = React.createContext<PeekContextValue | null>(null);

function usePeek(part: string): PeekContextValue {
  const ctx = React.useContext(PeekContext);
  if (!ctx) throw new Error(`${part} must be used inside <Peek>.`);
  return ctx;
}

/* ------------------------------------------------------------------------------------------------
 * Resize handle (shared with RecordLayout's side panel)
 * ----------------------------------------------------------------------------------------------*/

/** Props for `PeekResizeHandle`. */
export interface PeekResizeHandleProps {
  /** The box's current width in px (the app's saved width). */
  width: number;
  /**
   * Called with the new width when a resize ends (pointer up, or each ← → Home End step). Mid-drag
   * only the box's inline width moves, so nothing re-renders per pointer move.
   */
  onWidthChange: (width: number) => void;
  /** The narrowest width, in px. @default 420 */
  min?: number;
  /** The widest width as a share of the box's containing block. @default 0.7 */
  maxRatio?: number;
  /** What is being resized, for the separator's name, e.g. "peek". @default "panel" */
  label?: string;
  /** The edge the handle sits on: the start edge for a box anchored to the end. @default "start" */
  edge?: "start" | "end";
  /**
   * The element whose width `maxRatio` is taken of. Defaults to the box's containing block (the
   * page area, for a peek); pass the layout for a box that sits inside a narrower wrapper.
   * @default undefined
   */
  area?: () => Element | null | undefined;
  /**
   * The inline style property written mid-drag: `width`, or the custom property the box reads its
   * width from (so the app's next width is never shadowed by a stale inline one).
   * @default "width"
   */
  property?: string;
  /** Extra classes for the handle. @default undefined */
  className?: string;
}

/**
 * `PeekResizeHandle` — a vertical separator on a box's edge that resizes it by pointer, touch or
 * keys (← → by 32 px, Home, End), between `min` and `maxRatio` of the containing block. Put it as
 * the first child of a `relative` box whose inline width is the `width` prop.
 *
 * @example
 * <aside className="relative" style={{ width }}>
 *   <PeekResizeHandle width={width} onWidthChange={setWidth} label="details" />
 * </aside>
 */
export function PeekResizeHandle({
  width,
  onWidthChange,
  min = PEEK_MIN_WIDTH,
  maxRatio = PEEK_MAX_RATIO,
  label = "panel",
  edge = "start",
  property = "width",
  area: areaOf,
  className,
}: PeekResizeHandleProps) {
  const handleRef = React.useRef<HTMLDivElement | null>(null);
  const [max, setMax] = React.useState<number | undefined>(undefined);
  const endDrag = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => endDrag.current?.(), []);

  const bounds = React.useCallback(() => {
    const box = handleRef.current?.parentElement;
    const target = areaOf ? areaOf() : box?.offsetParent;
    const area =
      target instanceof HTMLElement ? target.clientWidth : window.innerWidth;
    const cap = Math.floor(area * maxRatio);
    // A page area too narrow for the minimum keeps the box at the minimum (CSS clamps it to 100%).
    return { min, max: Math.max(min, cap) };
  }, [min, maxRatio, areaOf]);

  const clamp = (n: number, b: { min: number; max: number }) =>
    Math.round(Math.min(b.max, Math.max(b.min, n)));
  // Dragging toward the page grows a box anchored to the far edge; RTL mirrors it.
  const growSign = () => {
    const rtl = handleRef.current
      ? getComputedStyle(handleRef.current).direction === "rtl"
      : false;
    return (edge === "start") !== rtl ? -1 : 1;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    endDrag.current?.();
    const handle = event.currentTarget;
    const box = handle.parentElement;
    if (!box) return;
    handle.setPointerCapture(event.pointerId);
    const b = bounds();
    setMax(b.max);
    const startX = event.clientX;
    const startWidth = box.getBoundingClientRect().width;
    const sign = growSign();
    let next = startWidth;
    let frame = 0;
    const write = () => {
      frame = 0;
      box.style.setProperty(property, `${next}px`);
    };
    const onMove = (move: PointerEvent) => {
      next = clamp(startWidth + sign * (move.clientX - startX), b);
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onUp = () => {
      if (endDrag.current !== onUp) return;
      endDrag.current = null;
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      handle.removeEventListener("lostpointercapture", onUp);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      handle.removeAttribute("data-resizing");
      if (!handle.isConnected) return;
      write();
      if (Math.round(next) !== Math.round(startWidth)) onWidthChange(next);
    };
    endDrag.current = onUp;
    handle.setAttribute("data-resizing", "");
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
    handle.addEventListener("lostpointercapture", onUp);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const b = bounds();
    setMax(b.max);
    const sign = growSign();
    const wider = sign < 0 ? "ArrowLeft" : "ArrowRight";
    const narrower = sign < 0 ? "ArrowRight" : "ArrowLeft";
    let next: number;
    if (event.key === wider) next = width + RESIZE_STEP;
    else if (event.key === narrower) next = width - RESIZE_STEP;
    else if (event.key === "Home") next = b.min;
    else if (event.key === "End") next = b.max;
    else return;
    event.preventDefault();
    event.stopPropagation();
    next = clamp(next, b);
    const box = event.currentTarget.parentElement;
    if (box) box.style.setProperty(property, `${next}px`);
    if (next !== width) onWidthChange(next);
  };

  return (
    <div
      ref={handleRef}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize the ${label}`}
      aria-valuenow={Math.round(width)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-slot="peek-resize-handle"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      // The page area's width changes with the window: the range is re-read on focus.
      onFocus={() => setMax(bounds().max)}
      className={cn(
        // A 4px seam on the edge, centred in a 24px hit area (WCAG 2.5.8) that straddles it, so the
        // first control in the box keeps its own target.
        "absolute inset-y-0 z-10 w-6 cursor-col-resize touch-none outline-none [-webkit-app-region:no-drag]",
        "after:absolute after:inset-y-0 after:w-1 after:rounded-full after:transition-colors after:content-['']",
        "hover:after:bg-border focus-visible:after:bg-border data-resizing:after:bg-border",
        edge === "start" ? "-start-3 after:start-2.5" : "-end-3 after:end-2.5",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * PeekSheet — the phone bottom sheet (shared with RecordLayout's phone panels)
 * ----------------------------------------------------------------------------------------------*/

/** A snap point: a share of the screen's height (0–1), or a px / rem length. */
export type PeekSnapPoint = number | string;

/** Where focus goes when a phone sheet closes (Base UI's drawer `finalFocus`). */
export type PeekFinalFocus = React.ComponentProps<
  typeof DrawerContent
>["finalFocus"];

/** Props for `PeekSheet`. */
export interface PeekSheetProps {
  /** Whether the sheet is open. */
  open: boolean;
  /** Called when a person closes it: dragging it down, the scrim, Escape or a close button. */
  onOpenChange: (open: boolean) => void;
  /** The sheet's accessible name when it has no `DrawerTitle`/`PeekTitle` inside. @default undefined */
  label?: string;
  /** The id of the element that names the sheet (a `PeekTitle` sets it for you). @default undefined */
  labelledBy?: string;
  /** Where it rests. @default [0.55, 0.92] */
  snapPoints?: readonly PeekSnapPoint[];
  /** The snap point it rests on, controlled. Omit to start on the first one. @default undefined */
  snapPoint?: PeekSnapPoint | null;
  /** Called when a drag moves it to another snap point. @default undefined */
  onSnapPointChange?: (snapPoint: PeekSnapPoint | null) => void;
  /**
   * Where focus goes when the sheet closes: an element (a ref), `true` for Base UI's default (back
   * to what had focus before, which can be a search field and so raise a phone's keyboard),
   * `false` to leave it, or a function given how it closed. `Peek` passes the row that opened it,
   * or nothing.
   * @default true
   */
  finalFocus?: PeekFinalFocus;
  /** The sheet's content: a header and a body. @default undefined */
  children?: React.ReactNode;
  /** Extra classes for the sheet's popup. @default undefined */
  className?: string;
}

/**
 * `PeekSheet` — a bottom sheet that rests at about half the screen and drags up to nearly all of
 * it, or down to close. A tap or a scroll inside never closes it; only a downward drag past the
 * first snap point, the scrim, Escape or a close button does. Built on the system's `Drawer`
 * (Base UI's drawer, edge to edge with its swipe handle).
 *
 * @example
 * <PeekSheet open={open} onOpenChange={setOpen} label="Details">
 *   <div className="p-4">…</div>
 * </PeekSheet>
 */
export function PeekSheet({
  open,
  onOpenChange,
  label,
  labelledBy,
  snapPoints = PEEK_SNAP_POINTS,
  snapPoint,
  onSnapPointChange,
  finalFocus,
  children,
  className,
}: PeekSheetProps) {
  // Keyed by value, so a fresh array literal on each parent render is the same points.
  const pointsKey = snapPoints.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const points = React.useMemo(() => [...snapPoints], [pointsKey]);
  const [restingPoint, setRestingPoint] = React.useState<PeekSnapPoint | null>(
    points[0] ?? null,
  );
  // Each opening starts on the first snap point unless the app controls it: reset on the
  // closed-to-open change only, never on a re-render while it is open.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setRestingPoint(points[0] ?? null);
  }
  const controlled = snapPoint !== undefined;
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      flush
      showSwipeHandle
      snapPoints={points}
      snapPoint={controlled ? snapPoint : restingPoint}
      onSnapPointChange={(next) => {
        if (!controlled) setRestingPoint(next);
        onSnapPointChange?.(next);
      }}
    >
      <DrawerContent
        data-slot="peek-sheet"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        finalFocus={finalFocus}
        className={cn(
          // The full screen's height, so each snap point is that share of the screen and the
          // visible part below is exactly the screen less the snap offset.
          "text-base data-[swipe-axis=y]:[--drawer-content-max-height:100dvh]",
          // Base UI registers its offset as non-inheriting, so it is read here, on the popup.
          "[--peek-sheet-visible:calc(100dvh-var(--drawer-snap-point-offset,0px))]",
          className,
        )}
      >
        {/* The popup is the screen's height and slides down to its snap point; this box is only
            the part on screen (less the swipe handle), so the body's scroll ends where the sheet
            does at every snap point. */}
        <div
          data-slot="peek-sheet-viewport"
          className="flex max-h-[calc(var(--peek-sheet-visible,100dvh)-0.75rem)] min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]"
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Peek
 * ----------------------------------------------------------------------------------------------*/

/** Props for `Peek`. */
export interface PeekProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "onChange"
> {
  /** Whether the peek is open. */
  open: boolean;
  /** Called with `false` when a person closes it (✕, Escape, or dragging the phone sheet down). */
  onOpenChange: (open: boolean) => void;
  /**
   * The side peek's width in px — the app saves it (shell prefs) and passes it back.
   * @default 560
   */
  width?: number;
  /**
   * Called with the new width when a resize ends. Omit to hide the resize handle.
   * @default undefined
   */
  onWidthChange?: (width: number) => void;
  /**
   * Which surface: `auto` is the side sheet on a wide screen and the bottom sheet under 640px.
   * @default "auto"
   */
  layout?: "auto" | "side" | "sheet";
  /**
   * The peek's accessible name when no `PeekTitle` is rendered (while the record loads).
   * @default "Peek"
   */
  label?: string;
  /**
   * Move focus into the peek when a person opens it. Turn it off when the list keeps focus on
   * purpose (a keyboard walk that only previews).
   * @default true
   */
  focusOnOpen?: boolean;
  /** The phone sheet's snap points. @default [0.55, 0.92] */
  snapPoints?: readonly PeekSnapPoint[];
  /** The phone sheet's snap point, controlled. @default undefined */
  snapPoint?: PeekSnapPoint | null;
  /** Called when the phone sheet moves to another snap point. @default undefined */
  onSnapPointChange?: (snapPoint: PeekSnapPoint | null) => void;
  /**
   * Where focus goes when the phone sheet closes. By default the row that opened the peek, and
   * otherwise nowhere — never back into a text field, which would raise the keyboard.
   * @default undefined
   */
  finalFocus?: PeekFinalFocus;
}

function focusBack(back: HTMLElement | null) {
  if (back?.isConnected) back.focus({ preventScroll: true });
}

/**
 * `Peek` — a record over the right side of the page area, one at a time, without leaving the list.
 * Put a `PeekHeader` (↑ ↓, the path, the actions) and a `PeekBody` whose first line is the
 * record's `PeekTitle` inside it. Render it inside the page area (a positioned box) so the rail and
 * column stay uncovered. Under 640px it becomes the phone bottom sheet.
 *
 * @example
 * <Peek open={!!id} onOpenChange={(o) => !o && setId(null)} width={w} onWidthChange={setW}>
 *   <PeekHeader>
 *     <PeekNav onPrevious={prev} onNext={next} />
 *     <PeekPath>Tasks › Website › #42</PeekPath>
 *     <PeekActions><PeekOpen href="/tasks/42" /><PeekClose /></PeekActions>
 *   </PeekHeader>
 *   <PeekBody><PeekTitle>Fix the login page</PeekTitle>…</PeekBody>
 * </Peek>
 */
export function Peek({
  open,
  onOpenChange,
  width,
  onWidthChange,
  layout = "auto",
  label = "Peek",
  focusOnOpen = true,
  snapPoints,
  snapPoint,
  onSnapPointChange,
  finalFocus,
  className,
  style,
  children,
  ref,
  ...props
}: PeekProps) {
  const phone = useMediaQuery(PHONE_QUERY);
  const surface: "side" | "sheet" =
    layout === "auto" ? (phone ? "sheet" : "side") : layout;
  const titleId = `peek-title${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const rootRef = React.useRef<HTMLElement | null>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);
  const [hasTitle, setHasTitle] = React.useState(false);

  const latestChange = React.useRef(onOpenChange);
  latestChange.current = onOpenChange;
  const close = React.useCallback(() => {
    const root = rootRef.current;
    const inside =
      !!root &&
      (root.contains(document.activeElement) ||
        document.activeElement === document.body);
    latestChange.current(false);
    if (inside) focusBack(returnTo.current);
  }, []);

  // The open motion plays only when a person opens it after the page has drawn (a cue reacts to a
  // live change, never to the first render): a peek restored on load appears at rest.
  // Known at render, so the section is inserted with its `@starting-style` classes: a peek open
  // on the first render is "restored" and stays at rest until it has closed once.
  const [restored, setRestored] = React.useState(open);
  if (!open && restored) setRestored(false);
  const motion = open && !restored;
  // Where focus was when it opened — read in a layout effect, before the phone sheet's own focus
  // management moves it inside, and on the first render too (a peek mounted already open).
  const captured = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!open) {
      captured.current = false;
      return;
    }
    if (captured.current) return;
    captured.current = true;
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      !rootRef.current?.contains(active) &&
      !active.closest("[data-slot='peek-sheet']")
    )
      returnTo.current = active;
  }, [open]);
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    const was = wasOpen.current;
    wasOpen.current = open;
    if (open && !was && focusOnOpen && surface === "side")
      rootRef.current?.focus({ preventScroll: true });
  }, [open, focusOnOpen, surface]);

  // Escape closes the side peek from the peek or the list; a menu or popover takes it first, and a
  // field keeps its own (a composer clears, an editor leaves a mode). F6 moves between the peek and
  // the row that opened it.
  React.useEffect(() => {
    if (!open || surface !== "side") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const root = rootRef.current;
      if (!root) return;
      // Only this peek's own page area answers: focus in the peek, in its page area, or nowhere.
      const active = document.activeElement;
      const area = root.offsetParent ?? root.parentElement;
      const owned =
        !active ||
        active === document.body ||
        root.contains(active) ||
        !!area?.contains(active);
      if (!owned) return;
      if (event.key === "F6") {
        const inside = root.contains(document.activeElement);
        if (inside && returnTo.current?.isConnected) {
          event.preventDefault();
          returnTo.current.focus({ preventScroll: true });
        } else if (!inside) {
          event.preventDefault();
          const active = document.activeElement;
          if (active instanceof HTMLElement && active !== document.body)
            returnTo.current = active;
          root.focus({ preventScroll: true });
        }
        return;
      }
      if (event.key !== "Escape") return;
      if (document.querySelector(ESC_OWNERS)) return;
      if (isEditableTarget(event)) return;
      event.preventDefault();
      close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, surface, close]);

  // `PeekTitle` registers itself so the dialog is named by the record's own title.
  const ctx = React.useMemo<PeekContextValue>(
    () => ({ surface, titleId, close, setHasTitle }),
    [surface, titleId, close],
  );

  const setRoot = React.useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) (ref as React.RefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );

  // The phone sheet hands focus back to the row that opened it, or leaves it: Base UI's default
  // returns it to whatever had focus before, which can be the page's search field, and focusing a
  // field on a phone raises the keyboard.
  const sheetFinalFocus = React.useCallback(() => {
    const back = returnTo.current;
    if (!back?.isConnected) return false;
    if (back.matches("input, textarea, select") || back.isContentEditable)
      return false;
    // A box that only takes focus from code or a tap (iOS Safari focuses the nearest
    // `tabindex="-1"` ancestor, such as the page's <main>) is not a place to return to: Base UI
    // would focus its first tabbable descendant instead, often the list's search field.
    if (back.tabIndex < 0) return false;
    return back;
  }, []);

  if (surface === "sheet") {
    return (
      <PeekContext.Provider value={ctx}>
        <PeekSheet
          open={open}
          onOpenChange={(next) => {
            if (!next) latestChange.current(false);
          }}
          label={label}
          labelledBy={hasTitle ? titleId : undefined}
          snapPoints={snapPoints}
          snapPoint={snapPoint}
          onSnapPointChange={onSnapPointChange}
          finalFocus={finalFocus ?? sheetFinalFocus}
          className={className}
        >
          <div
            ref={setRoot as React.Ref<HTMLDivElement>}
            data-slot="peek"
            data-surface="sheet"
            className="flex min-h-0 flex-1 flex-col"
            style={style}
            {...(props as React.HTMLAttributes<HTMLDivElement>)}
          >
            {children}
          </div>
        </PeekSheet>
      </PeekContext.Provider>
    );
  }

  if (!open) return null;
  const current = width ?? PEEK_DEFAULT_WIDTH;
  return (
    <PeekContext.Provider value={ctx}>
      <section
        ref={setRoot}
        role="dialog"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-label={hasTitle ? undefined : label}
        tabIndex={-1}
        data-slot="peek"
        data-surface="side"
        data-motion={motion ? "enter" : undefined}
        style={
          {
            width: current,
            "--peek-min-width": `${PEEK_MIN_WIDTH}px`,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "absolute inset-y-0 end-0 z-30 flex max-w-[70%] min-w-[min(var(--peek-min-width),100%)] flex-col border-s bg-background text-foreground shadow-xl outline-none",
          "data-[motion=enter]:transition-[translate,opacity] data-[motion=enter]:duration-panel data-[motion=enter]:ease-enter data-[motion=enter]:starting:translate-x-6 data-[motion=enter]:starting:opacity-0 rtl:data-[motion=enter]:starting:-translate-x-6",
          className,
        )}
        {...props}
      >
        {onWidthChange ? (
          <PeekResizeHandle
            width={current}
            onWidthChange={onWidthChange}
            label="peek"
          />
        ) : null}
        {children}
      </section>
    </PeekContext.Provider>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Header parts
 * ----------------------------------------------------------------------------------------------*/

/** Native container props for `PeekHeader`. */
export type PeekHeaderProps = React.ComponentPropsWithRef<"div">;

/**
 * `PeekHeader` — the peek's 48px head: `PeekNav` (↑ ↓), `PeekPath` and `PeekActions`, in that
 * order. The record's title is not here: it is the first line of `PeekBody`.
 *
 * @example
 * <PeekHeader><PeekNav onPrevious={prev} onNext={next} /><PeekPath>…</PeekPath><PeekActions>…</PeekActions></PeekHeader>
 */
export function PeekHeader({ className, ...props }: PeekHeaderProps) {
  return (
    <div
      data-slot="peek-header"
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b ps-3 pe-2",
        className,
      )}
      {...props}
    />
  );
}

/** Props for `PeekNav`. */
export interface PeekNavProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** Opens the previous row of the list. Omit or pass `undefined` at the top. @default undefined */
  onPrevious?: () => void;
  /** Opens the next row of the list. Omit or pass `undefined` at the bottom. @default undefined */
  onNext?: () => void;
  /** The previous button's name. @default "Previous" */
  previousLabel?: string;
  /** The next button's name. @default "Next" */
  nextLabel?: string;
}

/**
 * `PeekNav` — ↑ ↓ as one joined pair: the previous and next row of the list, in the list's
 * current order and filters. A missing handler disables its half (still focusable, so the pair
 * keeps its place in the Tab order).
 *
 * @example
 * <PeekNav onPrevious={index > 0 ? () => open(index - 1) : undefined} onNext={() => open(index + 1)} />
 */
export function PeekNav({
  onPrevious,
  onNext,
  previousLabel = "Previous",
  nextLabel = "Next",
  className,
  ...props
}: PeekNavProps) {
  return (
    <ButtonGroup
      aria-label="Move through the list"
      data-slot="peek-nav"
      className={cn("shrink-0", className)}
      {...props}
    >
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={previousLabel}
        disabled={!onPrevious}
        focusableWhenDisabled
        onClick={onPrevious}
      >
        <ChevronUp />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={nextLabel}
        disabled={!onNext}
        focusableWhenDisabled
        onClick={onNext}
      >
        <ChevronDown />
      </Button>
    </ButtonGroup>
  );
}

/** Native container props for `PeekPath`. */
export type PeekPathProps = React.ComponentPropsWithRef<"div">;

/**
 * `PeekPath` — where the record lives (Module › Space › #id): a `Breadcrumb`, or plain text. It
 * takes the header's free width and truncates.
 *
 * @example
 * <PeekPath><Breadcrumb>…</Breadcrumb></PeekPath>
 */
export function PeekPath({ className, ...props }: PeekPathProps) {
  return (
    <div
      data-slot="peek-path"
      className={cn(
        "flex min-w-0 flex-1 items-center overflow-hidden text-sm whitespace-nowrap text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Native container props for `PeekActions`. */
export type PeekActionsProps = React.ComponentPropsWithRef<"div">;

/**
 * `PeekActions` — the header's trailing icon buttons: `PeekOpen` (⤢), the app's ☆ and ⋯, then
 * `PeekClose` (✕) last.
 *
 * @example
 * <PeekActions><PeekOpen href={href} /><Button size="icon-sm" variant="ghost" aria-label="Favourite"><Star /></Button><PeekClose /></PeekActions>
 */
export function PeekActions({ className, ...props }: PeekActionsProps) {
  return (
    <div
      data-slot="peek-actions"
      className={cn(
        "ms-auto flex shrink-0 items-center gap-1",
        // The top bar's one type size (`ShellTopBar`): a record's Share, Watch and ☆ read 14px with
        // 16px icons here too, beside ⤢ and ✕, whichever button size the app passes.
        "[&_:is(button,a,[role=button])]:text-sm [&_:is(button,a,[role=button])_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/** Props for `PeekAction`. */
export interface PeekActionProps extends React.ComponentPropsWithRef<
  typeof Button
> {
  /** The button's name, also shown as its tooltip. */
  label: string;
}

/**
 * `PeekAction` — one icon button in the header with its name as a tooltip (☆, ⋯, or the app's own).
 *
 * @example
 * <PeekAction label="Favourite" onClick={toggle}><Star /></PeekAction>
 */
export function PeekAction({ label, children, ...props }: PeekActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            data-slot="peek-action"
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Props for `PeekOpen`. */
export interface PeekOpenProps extends Omit<PeekActionProps, "label"> {
  /** The record's page, for a link (⌘-click and middle-click open a new tab). @default undefined */
  href?: string;
  /** The button's name. @default "Open page" */
  label?: string;
}

/**
 * `PeekOpen` — ⤢: opens the record's full page. With `href` it is a real link, so ⌘-click and
 * middle-click open a new tab; pass `render` for the app's router link.
 *
 * @example
 * <PeekOpen href="/tasks/42" />
 */
export function PeekOpen({
  href,
  label = "Open page",
  render,
  ...props
}: PeekOpenProps) {
  return (
    <PeekAction
      label={label}
      nativeButton={!(href || render)}
      render={render ?? (href ? <a href={href} /> : undefined)}
      data-slot="peek-open"
      {...props}
    >
      <Maximize2 />
    </PeekAction>
  );
}

/** Props for `PeekClose`. */
export interface PeekCloseProps extends Omit<PeekActionProps, "label"> {
  /** The button's name. @default "Close" */
  label?: string;
}

/**
 * `PeekClose` — ✕: closes the peek and returns focus to the row that opened it.
 *
 * @example
 * <PeekClose />
 */
export function PeekClose({
  label = "Close",
  onClick,
  ...props
}: PeekCloseProps) {
  const { close } = usePeek("PeekClose");
  return (
    <PeekAction
      label={label}
      data-slot="peek-close"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) close();
      }}
      {...props}
    >
      <X />
    </PeekAction>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Body and title
 * ----------------------------------------------------------------------------------------------*/

/** Native container props for `PeekBody`. */
export type PeekBodyProps = React.ComponentPropsWithRef<"div">;

/**
 * `PeekBody` — the record: its scroll area, padded. Its first line is the `PeekTitle`.
 *
 * @example
 * <PeekBody><PeekTitle>Fix the login page</PeekTitle><p>…</p></PeekBody>
 */
export function PeekBody({ className, ...props }: PeekBodyProps) {
  return (
    <div
      data-slot="peek-body"
      className={cn(
        "relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-5",
        className,
      )}
      {...props}
    />
  );
}

/** Native heading props for `PeekTitle` (its `id` is the peek's own, for its name). */
export type PeekTitleProps = Omit<React.ComponentPropsWithRef<"h2">, "id">;

/**
 * `PeekTitle` — the record's own title, the peek's heading and its accessible name.
 *
 * @example
 * <PeekTitle>Fix the login page</PeekTitle>
 */
export function PeekTitle({ className, ...props }: PeekTitleProps) {
  const { setHasTitle, titleId } = usePeek("PeekTitle");
  React.useEffect(() => {
    setHasTitle(true);
    return () => setHasTitle(false);
  }, [setHasTitle]);
  return (
    <h2
      id={titleId}
      data-slot="peek-title"
      className={cn(
        "text-xl font-semibold text-foreground wrap-break-word",
        className,
      )}
      {...props}
    />
  );
}
