// @vegastack shell@0.111.0 sha256-PV/6DpM9FlH0341U+ddFjwO/xI3D1Xz0luzpMYRXWiA=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronDown, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isEditableTarget } from "@/components/ui/use-platform";
import { layoutTierOf, type LayoutTier } from "@/lib/page-layout";
import {
  SHELL_COOKIES,
  SHELL_SIZES,
  clampColumnWidth,
  shellCookie,
} from "@/lib/shell-layout";

/* ---
The shell's client islands. The frame itself is server markup laid out in CSS (`shell.tsx`); what
is here only adds behaviour on top of a layout that is already right:

- `ShellController` mirrors the CSS outcome into `data-tier` and `data-column` on the shell for scripts (`useShellLayout`), keeps the cookies, and owns ⌘\, F6, Escape, the
  hover-peek of a folded column and the tablet slide-over (L14).
- `ShellColumnResize`, `ShellSkipLink`, `ShellColumnToggle`, `ShellColumnSwitch` and
  `ShellBottomBar` are the interactive leaves.

Nothing here re-renders React per pointer move: drags and scrolls write attributes and CSS
variables on the shell element directly.
--- */

const LAYOUT_EVENT = "vegastack:shell-layout";
const COLUMN_EVENT = "vegastack:shell-column";
const PEEK_DELAY_MS = 220;
const PEEK_LEAVE_MS = 180;
/** The phone column sheet's top, in px, where a drag always moves the sheet (grabber + title row). */
const SHEET_HEAD = 64;
/** How far, in px, the phone column sheet is dragged down before it closes on release. */
const SHEET_CLOSE_DISTANCE = 96;
/** How far, in px, a touch on the phone column sheet moves before it counts as a drag or a scroll. */
const SHEET_SLOP = 8;

/** What the column is doing: in the flow, folded, floating over the page, or absent. */
export type ShellColumnState = "shown" | "folded" | "over" | "none";

/** The layout the shell is showing, as `useShellLayout` reports it. */
export interface ShellLayoutState {
  tier: LayoutTier;
  column: ShellColumnState;
}

type ColumnAction = "toggle" | "open" | "close";

function shellOf(from?: Element | null): HTMLElement | null {
  const own = from?.closest<HTMLElement>('[data-slot="shell"]');
  return own ?? document.querySelector<HTMLElement>('[data-slot="shell"]');
}

/**
 * Opens, closes or toggles the column of the shell `from` sits in (the first shell otherwise),
 * the way ▤ and ⌘\ do: on a laptop it keeps or folds the column; where the column cannot take
 * room (a tablet, a phone) it slides it over the page.
 *
 * @example
 * <Button onClick={(e) => toggleShellColumn(e.currentTarget)}>Spaces</Button>
 */
export function toggleShellColumn(
  from?: Element | null,
  action: ColumnAction = "toggle",
) {
  shellOf(from)?.dispatchEvent(
    new CustomEvent<ColumnAction>(COLUMN_EVENT, { detail: action }),
  );
}

function readLayout(root: HTMLElement): ShellLayoutState | null {
  const tier = root.dataset.tier as LayoutTier | undefined;
  if (!tier) return null;
  return {
    tier,
    column: (root.dataset.column ?? "none") as ShellColumnState,
  };
}

/**
 * The shell's current layout — tier and column — for code that must act on it. `null` before the
 * shell has measured.
 *
 * @example
 * const layout = useShellLayout();
 * if (layout?.tier === "phone") openAsSheet();
 */
export function useShellLayout(): ShellLayoutState | null {
  const cache = React.useRef<{ key: string; value: ShellLayoutState | null }>({
    key: "",
    value: null,
  });
  return React.useSyncExternalStore(
    (notify) => {
      document.addEventListener(LAYOUT_EVENT, notify);
      return () => document.removeEventListener(LAYOUT_EVENT, notify);
    },
    () => {
      const root = document.querySelector<HTMLElement>('[data-slot="shell"]');
      const value = root ? readLayout(root) : null;
      const key = value ? `${value.tier}|${value.column}` : "";
      if (key !== cache.current.key) cache.current = { key, value };
      return cache.current.value;
    },
    () => null,
  );
}

function cssPx(value: string, fallback: number): number {
  const v = value.trim();
  if (v.endsWith("px")) return parseFloat(v);
  if (v.endsWith("rem"))
    return (
      parseFloat(v) *
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
  return fallback;
}

function writeCookie(name: string, open: boolean, width: number) {
  document.cookie = shellCookie(name, open, width);
}

function visible(el: Element): boolean {
  const box = el as HTMLElement;
  if (typeof box.checkVisibility === "function")
    return box.checkVisibility({ visibilityProperty: true });
  return box.offsetParent !== null;
}

/**
 * The shell's behaviour, mounted by `Shell` itself. It renders nothing visible.
 *
 * @example
 * <ShellController /> // rendered by Shell itself
 */
export function ShellController() {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    const html = document.documentElement;
    const mainArea = root.querySelector<HTMLElement>(
      '[data-slot="shell-main-area"]',
    );
    const columnArea = root.querySelector<HTMLElement>(
      '[data-slot="shell-column-area"]',
    );
    const content = root.querySelector<HTMLElement>(
      '[data-slot="shell-content"]',
    );
    if (!mainArea) return;
    // Where focus goes when the column it was in goes away: ▤, else the page landmark.
    const fallback = () => visibleToggle() ?? content ?? root;

    let restoreFocus: HTMLElement | null = null;
    let peekTimer = 0;
    // The phone sheet's drag (below): the gesture in progress, and putting the sheet back.
    let drag: {
      x: number;
      y: number;
      t: number;
      dy: number;
      head: boolean;
      dragging: boolean;
    } | null = null;
    const endDrag = () => {
      drag = null;
      if (!columnArea) return;
      columnArea.style.removeProperty("transition");
      columnArea.style.removeProperty("translate");
    };

    const railArea = root.querySelector<HTMLElement>(
      '[data-slot="shell-rail-area"]',
    );
    // On a phone the column is a sheet: everything behind it is inert while it is up.
    const behindSheet = () =>
      [
        mainArea,
        railArea,
        root.querySelector<HTMLElement>('[data-slot="shell-bottombar"]'),
      ].filter((el): el is HTMLElement => el !== null);
    const setSheet = (modal: boolean) => {
      for (const el of behindSheet()) el.toggleAttribute("inert", modal);
      if (!columnArea) return;
      if (modal) {
        columnArea.setAttribute("role", "dialog");
        columnArea.setAttribute("aria-modal", "true");
        const label = columnArea
          .querySelector('[data-slot="shell-column"]')
          ?.getAttribute("aria-label");
        if (label) columnArea.setAttribute("aria-label", label);
      } else {
        columnArea.removeAttribute("role");
        columnArea.removeAttribute("aria-modal");
        columnArea.removeAttribute("aria-label");
      }
    };

    const visibleToggle = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>('[data-slot="shell-column-toggle"]'),
      ).find(visible);

    const setFloat = (open: boolean, source?: "peek" | "user") => {
      if (open === (root.dataset.colFloat === "open")) return;
      if (open) {
        root.dataset.colFloat = "open";
        root.dataset.colFloatSource = source ?? "user";
        if (source === "user") {
          restoreFocus = document.activeElement as HTMLElement | null;
          requestAnimationFrame(() =>
            columnArea?.focus({ preventScroll: true }),
          );
        }
      } else {
        endDrag();
        delete root.dataset.colFloat;
        delete root.dataset.colFloatSource;
        setSheet(false);
        if (columnArea?.contains(document.activeElement)) {
          const back =
            restoreFocus && restoreFocus.isConnected && visible(restoreFocus)
              ? restoreFocus
              : fallback();
          back.focus({ preventScroll: true });
        }
        restoreFocus = null;
      }
      sync();
    };

    const sync = () => {
      const style = getComputedStyle(mainArea);
      const tier = layoutTierOf(root.clientWidth);
      // What the flow says, independent of a column floating over the page.
      const flow = (style.getPropertyValue("--shell-layout-column").trim() ||
        "none") as ShellColumnState;
      const floating = root.dataset.colFloat === "open";
      if (floating && flow === "shown") {
        setFloat(false);
        return;
      }
      // The sheet is modal only while it floats on a phone; a breakpoint change re-decides.
      const modal = floating && tier === "phone";
      if (modal !== (columnArea?.getAttribute("aria-modal") === "true"))
        setSheet(modal);
      const column: ShellColumnState = !root.hasAttribute("data-has-column")
        ? "none"
        : floating
          ? "over"
          : flow;
      // A column the layout just folded must not keep focus out of sight.
      if (
        column !== "shown" &&
        column !== "over" &&
        columnArea?.contains(document.activeElement)
      )
        fallback().focus({ preventScroll: true });

      const changed =
        root.dataset.tier !== tier || root.dataset.column !== column;
      root.dataset.tier = tier;
      root.dataset.column = column;
      if (changed)
        document.dispatchEvent(new CustomEvent(LAYOUT_EVENT, { detail: root }));
    };

    const columnWidth = () =>
      cssPx(
        getComputedStyle(root).getPropertyValue("--shell-column-current-width"),
        SHELL_SIZES.column,
      );

    const setPref = (open: boolean) => {
      html.setAttribute("data-shell-col", open ? "open" : "closed");
      writeCookie(SHELL_COOKIES.column, open, columnWidth());
      sync();
    };

    const onColumn = (event: Event) => {
      const action = (event as CustomEvent<ColumnAction>).detail ?? "toggle";
      if (!root.hasAttribute("data-has-column")) return;
      sync();
      const column = root.dataset.column as ShellColumnState;
      const floating = root.dataset.colFloat === "open";
      const prefOpen =
        (html.getAttribute("data-shell-col") ?? root.dataset.col) === "open";
      const flowTier =
        root.dataset.tier === "laptop" || root.dataset.tier === "wide";
      if (!flowTier || (prefOpen && column !== "shown")) {
        const next = action === "toggle" ? !floating : action === "open";
        setFloat(next, "user");
        return;
      }
      const next = action === "toggle" ? column !== "shown" : action === "open";
      setPref(next);
    };

    const regions = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>("[data-shell-region]"),
      ).filter(visible);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "F6") {
        const list = regions();
        if (!list.length) return;
        const at = list.findIndex((r) => r.contains(document.activeElement));
        const step = event.shiftKey ? -1 : 1;
        const next =
          at === -1
            ? list[event.shiftKey ? list.length - 1 : 0]
            : list[(at + step + list.length) % list.length];
        event.preventDefault();
        next?.focus({ preventScroll: true });
        return;
      }
      if (event.key === "Escape" && root.dataset.colFloat === "open") {
        event.preventDefault();
        setFloat(false);
        return;
      }
      if (
        event.code === "Backslash" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        !isEditableTarget(event)
      ) {
        event.preventDefault();
        onColumn(
          new CustomEvent<ColumnAction>(COLUMN_EVENT, { detail: "toggle" }),
        );
      }
    };

    // Hover-peek: resting on the current module's rail item opens a folded column over the page.
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target as Element;
      if (
        root.dataset.colFloat === "open" &&
        root.dataset.colFloatSource === "peek"
      ) {
        if (
          columnArea?.contains(target) ||
          target.closest('[data-slot="rail-item"][data-active]')
        )
          window.clearTimeout(peekTimer);
        else {
          window.clearTimeout(peekTimer);
          peekTimer = window.setTimeout(() => setFloat(false), PEEK_LEAVE_MS);
        }
        return;
      }
      const item = target.closest('[data-slot="rail-item"][data-active]');
      window.clearTimeout(peekTimer);
      if (!item || root.dataset.column !== "folded") return;
      peekTimer = window.setTimeout(() => {
        // Still resting there, and still folded, when the delay ends.
        if (item.matches(":hover") && root.dataset.column === "folded")
          setFloat(true, "peek");
      }, PEEK_DELAY_MS);
    };
    const onPointerLeave = (event?: PointerEvent) => {
      const to = event?.relatedTarget as Element | null | undefined;
      if (to?.closest?.('[data-slot="rail-item"][data-active]')) return;
      window.clearTimeout(peekTimer);
      if (root.dataset.colFloatSource === "peek") setFloat(false);
    };
    const onRailLeave = (event: PointerEvent) => {
      if (columnArea?.contains(event.relatedTarget as Node | null)) return;
      onPointerLeave(event);
    };

    // Outside a floating column, a press closes it; picking something inside it closes it too.
    const onPointerDown = (event: PointerEvent) => {
      if (root.dataset.colFloat !== "open") return;
      const target = event.target as Element;
      if (columnArea?.contains(target)) return;
      if (
        target.closest(
          '[data-slot="shell-column-toggle"], [data-slot="shell-column-switch"]',
        )
      )
        return;
      setFloat(false);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (root.dataset.colFloat !== "open") return;
      if (
        columnArea?.contains(target) &&
        // Picking a place (a link, or a nav-tree row that is not a parent folding open).
        target.closest(
          'a[href], [data-slot="nav-tree-item"]:not([aria-expanded])',
        )
      )
        setFloat(false);
    };

    // Tablet edge swipe: a rightward swipe starting on the rail's edge slides the column in.
    let swipe: { x: number; y: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (
        !touch ||
        root.dataset.tier !== "tablet" ||
        !root.hasAttribute("data-has-column")
      )
        return;
      const railEnd = root
        .querySelector('[data-slot="shell-rail-area"]')
        ?.getBoundingClientRect();
      if (!railEnd) return;
      const edge = document.dir === "rtl" ? railEnd.left : railEnd.right;
      swipe =
        Math.abs(touch.clientX - edge) < 24
          ? { x: touch.clientX, y: touch.clientY }
          : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!swipe || !touch) return;
      const dx = (touch.clientX - swipe.x) * (document.dir === "rtl" ? -1 : 1);
      if (Math.abs(touch.clientY - swipe.y) > 32) swipe = null;
      else if (dx > 48) {
        swipe = null;
        setFloat(true, "user");
      }
    };

    // The phone sheet follows a downward drag and closes past a threshold. A drag from its top
    // (the grabber and the title row), or a pull down while its list is at the top, moves the
    // sheet and never reaches the page behind: no page scroll, no Safari pull-to-refresh. An
    // upward or sideways swipe on the list, a second finger or a cancelled touch leave it alone.
    const sheetUp = () =>
      root.dataset.colFloat === "open" && root.dataset.tier === "phone";
    const onSheetTouchStart = (event: TouchEvent) => {
      endDrag();
      const touch = event.touches[0];
      if (!touch || !columnArea || event.touches.length > 1 || !sheetUp())
        return;
      const head =
        touch.clientY - columnArea.getBoundingClientRect().top < SHEET_HEAD;
      const list = columnArea.querySelector<HTMLElement>(
        '[data-slot="shell-column"]',
      );
      if (head || !list || list.scrollTop <= 0)
        drag = {
          x: touch.clientX,
          y: touch.clientY,
          t: event.timeStamp,
          dy: 0,
          head,
          dragging: false,
        };
    };
    const onSheetTouchMove = (event: TouchEvent) => {
      if (!drag || !columnArea) return;
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1 || !event.cancelable) {
        endDrag();
        return;
      }
      const dx = touch.clientX - drag.x;
      const dy = touch.clientY - drag.y;
      if (!drag.dragging) {
        if (Math.abs(dx) < SHEET_SLOP && Math.abs(dy) < SHEET_SLOP) {
          // On the grabber, even the first pixels stay with the sheet.
          if (drag.head) event.preventDefault();
          return;
        }
        // Sideways, or up on the list: the list's own scroll takes it.
        if (Math.abs(dx) > Math.abs(dy) || (dy < 0 && !drag.head)) {
          drag = null;
          return;
        }
        drag.dragging = true;
      }
      event.preventDefault();
      drag.dy = Math.max(0, dy);
      columnArea.style.transition = "none";
      columnArea.style.translate = `0 ${drag.dy}px`;
    };
    const onSheetTouchEnd = (event: TouchEvent) => {
      const done = drag;
      endDrag();
      if (!done?.dragging) return;
      const speed = done.dy / Math.max(1, event.timeStamp - done.t);
      if (done.dy > SHEET_CLOSE_DISTANCE || (done.dy > 24 && speed > 0.5))
        setFloat(false);
    };

    const resize = new ResizeObserver(() => sync());
    resize.observe(root);
    const mutations = new MutationObserver(() => sync());
    mutations.observe(root, {
      attributes: true,
      attributeFilter: ["data-col", "style"],
    });
    mutations.observe(html, {
      attributes: true,
      attributeFilter: ["data-shell-col", "style"],
    });
    root.addEventListener(COLUMN_EVENT, onColumn);
    window.addEventListener("keydown", onKeyDown);
    root.addEventListener("pointerover", onPointerOver);
    columnArea?.addEventListener("pointerleave", onPointerLeave);
    railArea?.addEventListener("pointerleave", onRailLeave);
    document.addEventListener("pointerdown", onPointerDown, true);
    root.addEventListener("click", onClick);
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });
    columnArea?.addEventListener("touchstart", onSheetTouchStart, {
      passive: true,
    });
    columnArea?.addEventListener("touchmove", onSheetTouchMove, {
      passive: false,
    });
    columnArea?.addEventListener("touchend", onSheetTouchEnd);
    columnArea?.addEventListener("touchcancel", endDrag);
    sync();

    return () => {
      resize.disconnect();
      mutations.disconnect();
      root.removeEventListener(COLUMN_EVENT, onColumn);
      window.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("pointerover", onPointerOver);
      columnArea?.removeEventListener("pointerleave", onPointerLeave);
      railArea?.removeEventListener("pointerleave", onRailLeave);
      setSheet(false);
      document.removeEventListener("pointerdown", onPointerDown, true);
      root.removeEventListener("click", onClick);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      columnArea?.removeEventListener("touchstart", onSheetTouchStart);
      columnArea?.removeEventListener("touchmove", onSheetTouchMove);
      columnArea?.removeEventListener("touchend", onSheetTouchEnd);
      columnArea?.removeEventListener("touchcancel", endDrag);
      window.clearTimeout(peekTimer);
    };
  }, []);

  return <span ref={ref} data-slot="shell-controller" hidden />;
}

/**
 * The column's resize edge: drag it, or focus it and use ←/→ (Home/End for the ends);
 * double-click resets it. It keeps the page at its minimum width, and the width lives in the
 * `vs_shell_col` cookie, per device.
 *
 * @example
 * <ShellColumnResize /> // rendered by Shell inside the column
 */
export function ShellColumnResize() {
  const ref = React.useRef<HTMLDivElement>(null);
  // What a screen reader hears; set when a resize settles, never per pointer move.
  const [value, setValue] = React.useState<{ now: number; max: number }>({
    now: SHELL_SIZES.column,
    max: SHELL_SIZES.columnMax,
  });

  const apply = (width: number, persist: boolean) => {
    const handle = ref.current;
    const root = handle?.closest<HTMLElement>('[data-slot="shell"]');
    if (!handle || !root) return;
    root.style.setProperty("--shell-column-current-width", `${width}px`);
    if (persist) {
      setValue({ now: width, max: limits().max });
      const open =
        (document.documentElement.getAttribute("data-shell-col") ??
          root.dataset.col) === "open";
      writeCookie(SHELL_COOKIES.column, open, width);
    }
  };

  const limits = () => {
    const root = ref.current?.closest<HTMLElement>('[data-slot="shell"]');
    const main = root?.querySelector<HTMLElement>(
      '[data-slot="shell-main-area"]',
    );
    const now = cssPx(
      root
        ? getComputedStyle(root).getPropertyValue(
            "--shell-column-current-width",
          )
        : "",
      SHELL_SIZES.column,
    );
    // The page area's width less its hairline is the page (SHELL_SIZES.divider).
    const page =
      (main?.getBoundingClientRect().width ?? Infinity) - SHELL_SIZES.divider;
    const max = Math.max(
      SHELL_SIZES.columnMin,
      Math.min(
        SHELL_SIZES.columnMax,
        Math.round(now + page - SHELL_SIZES.pageMin),
      ),
    );
    return { now: Math.round(now), max };
  };

  React.useEffect(() => {
    setValue(limits());
    // `limits` reads the DOM; it has no React inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const start = event.clientX;
    const { now, max } = limits();
    const sign = getComputedStyle(handle).direction === "rtl" ? -1 : 1;
    let frame = 0;
    let width = now;
    document.documentElement.style.cursor = "col-resize";
    const move = (e: PointerEvent) => {
      width = Math.min(max, clampColumnWidth(now + (e.clientX - start) * sign));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply(width, false));
    };
    const up = () => {
      cancelAnimationFrame(frame);
      apply(width, true);
      document.documentElement.style.cursor = "";
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { now, max } = limits();
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const grow = rtl ? "ArrowLeft" : "ArrowRight";
    const shrink = rtl ? "ArrowRight" : "ArrowLeft";
    let next: number | undefined;
    if (event.key === grow) next = now + 16;
    else if (event.key === shrink) next = now - 16;
    else if (event.key === "Home") next = SHELL_SIZES.columnMin;
    else if (event.key === "End") next = max;
    if (next === undefined) return;
    event.preventDefault();
    apply(Math.min(max, clampColumnWidth(next)), true);
  };

  return (
    <div
      ref={ref}
      data-slot="shell-resize"
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize the column"
      aria-valuemin={SHELL_SIZES.columnMin}
      aria-valuemax={value.max}
      aria-valuenow={value.now}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onFocus={() => setValue(limits())}
      onDoubleClick={() =>
        apply(Math.min(limits().max, SHELL_SIZES.column), true)
      }
      className="absolute inset-y-0 -end-1 z-10 w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-transparent after:transition-colors after:duration-instant hover:after:bg-border focus-visible:after:bg-ring @max-[40rem]/shell:hidden"
    />
  );
}

/**
 * The skip link: the first stop for a keyboard, it moves focus to the page (`ShellMain`).
 *
 * @example
 * <ShellSkipLink /> // rendered by Shell itself
 */
export function ShellSkipLink() {
  return (
    <a
      href="#shell-main"
      data-slot="shell-skip"
      onClick={(event) => {
        event.preventDefault();
        event.currentTarget
          .closest('[data-slot="shell"]')
          ?.querySelector<HTMLElement>('[data-slot="shell-content"]')
          ?.focus();
      }}
      className="sr-only rounded-control bg-background px-3 py-1.5 text-sm font-medium shadow-md focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50"
    >
      Skip to content
    </a>
  );
}

/** Props accepted by `ShellColumnToggle`. */
export type ShellColumnToggleProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "variant" | "size"
>;

/**
 * `ShellColumnToggle` — ▤: shows or hides the module's column (⌘\), and hides itself on a screen
 * with no column. It lives in the global bar's leading slot; on a laptop it keeps or folds the
 * column, where the column cannot take room (a tablet) it slides the column over the page.
 *
 * @example
 * <GlobalBarLeading><ShellColumnToggle /></GlobalBarLeading>
 */
export function ShellColumnToggle({
  className,
  onClick,
  ...props
}: ShellColumnToggleProps) {
  return (
    <Button
      data-slot="shell-column-toggle"
      variant="ghost"
      size="icon-sm"
      aria-label="Show or hide the column"
      aria-keyshortcuts="Meta+Backslash"
      // A screen with no column (Home, Search, Trash) has nothing to show or hide.
      className={cn(
        "in-[[data-slot=shell]:not([data-has-column])]:hidden",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleShellColumn(event.currentTarget);
      }}
      {...props}
    >
      <PanelLeft aria-hidden="true" />
    </Button>
  );
}

/** Props accepted by `ShellColumnSwitch`. */
export interface ShellColumnSwitchProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "variant" | "size" | "ref"
> {
  /** What the button does, read out after the page's heading. @default 'Switch view' */
  label?: string;
}

/**
 * `ShellColumnSwitch` — on a phone, the page title opens the module's column as a sheet (L13):
 * the ▤ of wider screens has no room there. `ShellTopBarTitle` renders it after its `<h1>`, and
 * the shell shows it only on a phone with a column; its hit area covers the heading, so a tap
 * anywhere on the title opens the sheet. Picking something in the sheet closes it.
 *
 * @example
 * <ShellTopBarTitle switchLabel="Switch Tasks view">My tasks</ShellTopBarTitle>
 */
export function ShellColumnSwitch({
  label = "Switch view",
  className,
  onClick,
  ...props
}: ShellColumnSwitchProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const root = shellOf(ref.current);
    if (!root) return;
    const read = () => setOpen(root.dataset.colFloat === "open");
    read();
    const mutations = new MutationObserver(read);
    mutations.observe(root, {
      attributes: true,
      attributeFilter: ["data-col-float"],
    });
    return () => mutations.disconnect();
  }, []);
  return (
    <Button
      ref={ref}
      data-slot="shell-column-switch"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      // `static`: the hit area (`after`) spans the heading, so a tap on the title opens the sheet.
      className={cn(
        "static hidden text-muted-foreground after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-[''] pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2.5 [&_svg]:transition-transform [&_svg]:duration-quick aria-expanded:[&_svg]:rotate-180",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented)
          toggleShellColumn(event.currentTarget, "toggle");
      }}
      {...props}
    >
      <ChevronDown aria-hidden="true" />
    </Button>
  );
}

/** Props accepted by `ShellBottomBar`. */
export interface ShellBottomBarProps extends React.ComponentProps<"nav"> {
  /** The landmark's name. @default 'Main' */
  label?: string;
}

/**
 * `ShellBottomBar` — the phone tab bar (L13): Home, Agents, Tasks, Inbox, More. It sits above the
 * home indicator, steps aside while you scroll down (as Safari's and Chrome's own bars compact,
 * so two bars never stack) and comes back when you scroll up, and hides while the keyboard is
 * open and while a record is open full screen. Put `viewport-fit=cover` and
 * `interactive-widget=resizes-content` in the viewport meta, and a `theme-color` that matches
 * the background.
 *
 * @example
 * <ShellBottomBar>
 *   <ShellBottomBarItem icon={<Home />} label="Home" render={<Link href="/" />} active />
 * </ShellBottomBar>
 */
export function ShellBottomBar({
  label = "Main",
  className,
  ...props
}: ShellBottomBarProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const bar = ref.current;
    const root = bar?.closest<HTMLElement>('[data-slot="shell"]');
    if (!bar || !root) return;
    const content = root.querySelector<HTMLElement>(
      '[data-slot="shell-content"]',
    );
    let lastY = 0;
    let scrolledAway = false;
    let keyboard = false;
    const paint = () => {
      bar.toggleAttribute("data-hidden", scrolledAway || keyboard);
    };
    const onScroll = (event: Event) => {
      const y =
        event.currentTarget === window
          ? window.scrollY
          : (event.currentTarget as HTMLElement).scrollTop;
      if (y > lastY + 4 && y > 40) scrolledAway = true;
      else if (y < lastY - 4 || y < 10) scrolledAway = false;
      lastY = y;
      paint();
    };
    // The keyboard is up when text entry has focus and the visible height has dropped well below
    // the tallest it has been at this width. Comparing with innerHeight alone misses
    // `interactive-widget=resizes-content`, where both shrink together.
    const viewport = window.visualViewport;
    let tallest = 0;
    let atWidth = 0;
    const onViewport = () => {
      const height = viewport?.height ?? window.innerHeight;
      const width = viewport?.width ?? window.innerWidth;
      if (Math.abs(width - atWidth) > 1) {
        atWidth = width;
        tallest = height;
      }
      const typing =
        document.activeElement instanceof HTMLElement &&
        (document.activeElement.matches("input, textarea, select") ||
          document.activeElement.isContentEditable);
      if (!typing) tallest = Math.max(tallest, height);
      keyboard = typing && tallest - height > 150;
      paint();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    content?.addEventListener("scroll", onScroll, { passive: true });
    viewport?.addEventListener("resize", onViewport);
    window.addEventListener("resize", onViewport);
    document.addEventListener("focusin", onViewport);
    document.addEventListener("focusout", onViewport);
    onViewport();
    return () => {
      window.removeEventListener("scroll", onScroll);
      content?.removeEventListener("scroll", onScroll);
      viewport?.removeEventListener("resize", onViewport);
      window.removeEventListener("resize", onViewport);
      document.removeEventListener("focusin", onViewport);
      document.removeEventListener("focusout", onViewport);
    };
  }, []);

  return (
    <nav
      ref={ref}
      data-slot="shell-bottombar"
      aria-label={label}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-[calc(var(--shell-bottombar-height)+env(safe-area-inset-bottom))] items-start justify-around border-t border-border bg-background/92 px-1.5 pt-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-layout ease-standard data-hidden:translate-y-full in-data-[fill=parent]:absolute",
        className,
      )}
      {...props}
    />
  );
}
