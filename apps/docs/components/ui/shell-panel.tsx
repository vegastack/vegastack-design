// @vegastack shell-panel@0.96.0 sha256-K5AooLLN4CamTLGZK+XoI9xASV9eTA8Ugww4J71eImg=

"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, Check, PanelRight, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatShortcut,
  isEditableTarget,
  usePlatform,
} from "@/components/ui/use-platform";
import {
  createPanelTabs,
  DEFAULT_TAB_AUTO_CLOSE,
  panelTabsReducer,
  TAB_AUTO_CLOSE_MS,
  type PanelTabRef,
  type PanelTabsState,
  type TabAutoClose,
} from "@/lib/panel-tabs";
// Where the panel sits — `Shell` writes it on `[data-slot=shell]` as `data-panel-mode`.
import type { ShellPanelMode } from "@/lib/shell-layout";

/* ------------------------------------------------------------------------------------------------
 * ShellPanel — the shell's one right-hand panel: a tab row in a 48px head and the open record
 * below it. `Shell` owns where it sits (beside the page, over it, or the whole screen on a phone)
 * and writes that on its root as `data-panel-mode`; this file owns what is inside. The tab rules
 * live in `@/lib/panel-tabs` (a pure reducer); these parts render them.
 * ----------------------------------------------------------------------------------------------*/

/** What a tab's right-click menu can ask for. */
export type ShellPanelTabAction =
  | "keep"
  | "pin"
  | "unpin"
  | "close"
  | "closeOthers"
  | "closeRight"
  | "closeAll"
  | "openAsPage"
  | "openInNewWindow"
  | "copyLink";

/** One tab as the overflow menu and the empty state list it. */
export interface ShellPanelTabItem {
  /** The tab's key. */
  value: string;
  /** The record's title. */
  title: string;
  /** The record kind's icon. @default undefined */
  icon?: React.ReactNode;
  /** A preview tab, shown in italics. @default false */
  preview?: boolean;
}

const RESIZE_STEP = 32;
const FALLBACK_MIN = 360;
const FALLBACK_MAX = 720;

/** A popup that owns Escape while it is open (R5: popovers close first). */
/** What Tab can reach inside the phone panel. */
const TABBABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1']), [contenteditable='true']";

const ESC_OWNERS =
  "[role='menu'], [role='listbox'], [data-slot='popover-content'], [role='alertdialog'], [role='dialog'][aria-modal='true']";

interface PanelContextValue {
  mode: ShellPanelMode;
  rootRef: React.RefObject<HTMLElement | null>;
  /** Where focus came from when the current tab was opened from outside the panel. */
  returnTo: React.RefObject<HTMLElement | null>;
  /** Ties each tab to its tabpanel by id. */
  idPrefix: string;
}

const PanelContext = React.createContext<PanelContextValue | null>(null);

function usePanelContext(): PanelContextValue {
  const ctx = React.useContext(PanelContext);
  const fallback = React.useRef<HTMLElement | null>(null);
  const fallbackReturn = React.useRef<HTMLElement | null>(null);
  return (
    ctx ?? {
      mode: "dock",
      rootRef: fallback,
      returnTo: fallbackReturn,
      idPrefix: "shell-panel",
    }
  );
}

function readMode(el: Element | null): ShellPanelMode | null {
  const m = el?.getAttribute("data-panel-mode");
  return m === "closed" || m === "dock" || m === "overlay" || m === "full"
    ? m
    : null;
}

/** The `Shell` root around `node`, or the panel's parent when it stands alone. */
function shellOf(node: HTMLElement | null): HTMLElement | null {
  return (
    (node?.closest("[data-slot='shell']") as HTMLElement | null) ??
    node?.parentElement ??
    null
  );
}

function remToPx(value: string, fallback: number): number {
  const v = value.trim();
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  if (v.endsWith("rem"))
    return (
      n *
      (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
        16)
    );
  return n;
}

/**
 * Focus where the panel was opened from; when that element is gone, the page's main region
 * (contract §5 #31: focus return when the opener is gone).
 */
function focusBack(back: HTMLElement | null, root: HTMLElement | null) {
  if (back?.isConnected && !root?.contains(back)) {
    back.focus({ preventScroll: true });
    return;
  }
  const main = document.querySelector<HTMLElement>(
    "[data-slot='shell-content'], main",
  );
  if (!main) return;
  if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  main.focus({ preventScroll: true });
}

/** Props accepted by `ShellPanel`. */
export interface ShellPanelProps extends React.ComponentPropsWithRef<"aside"> {
  /**
   * The panel's accessible name.
   * @default "Panel"
   */
  label?: string;
  /**
   * Where the panel sits. Read from `Shell` (`data-panel-mode` on `[data-slot=shell]`) when
   * omitted; pass it only when the panel is used outside `Shell`.
   * @default undefined
   */
  mode?: ShellPanelMode;
  /**
   * Asks to close the panel: Escape while it slides over the page or fills the screen (never
   * while it sits beside the page, R5), after any open popover has taken its own Escape.
   * @default undefined
   */
  onRequestClose?: () => void;
  /**
   * The panel's width in px — the number the app also gives `Shell` as `panelWidth`.
   * @default undefined
   */
  width?: number;
  /**
   * Called with the new width when a resize ends (pointer up, or each ← → Home End step on the
   * separator). Mid-drag the width moves through the `--shell-panel-current-width` variable only,
   * so nothing re-renders per pointer move. Omit to hide the separator.
   * @default undefined
   */
  onWidthChange?: (width: number) => void;
}

/**
 * `ShellPanel` — the shell's right-hand panel: put a `ShellPanelHeader` (with `ShellPanelTabs`)
 * and a `ShellPanelBody` in it. It fills the box `Shell` gives it and follows `Shell`'s mode:
 * beside the page (`dock`), over it (`overlay`) or the whole screen on a phone (`full`). Escape
 * closes it only when it covers the page. A separator on its start edge resizes it between
 * `--shell-panel-width-min` and `--shell-panel-width-max` (360–720px) by pointer, touch or keys.
 *
 * @example
 * <ShellPanel width={width} onWidthChange={setWidth} onRequestClose={() => setOpen(false)}>
 *   <ShellPanelHeader>
 *     <ShellPanelTabs value={tabs.state.activeKey} onValueChange={tabs.activate} onClose={tabs.close}>
 *       {tabs.state.tabs.map((t) => <ShellPanelTab key={t.key} value={t.key} title={titleOf(t.key)} preview={t.preview} />)}
 *     </ShellPanelTabs>
 *     <ShellPanelClose onClick={() => setOpen(false)} />
 *   </ShellPanelHeader>
 *   <ShellPanelBody>{tabs.state.tabs.map((t) => <ShellPanelView key={t.key} value={t.key}>{viewOf(t.key)}</ShellPanelView>)}</ShellPanelBody>
 * </ShellPanel>
 */
export function ShellPanel({
  label = "Panel",
  mode: modeProp,
  onRequestClose,
  width,
  onWidthChange,
  className,
  children,
  ref,
  ...props
}: ShellPanelProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);
  const idPrefix = `shell-panel${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [observed, setObserved] = React.useState<ShellPanelMode | null>(null);
  const mode = modeProp ?? observed ?? "dock";

  const setRoot = React.useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) (ref as React.RefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );

  // Follow Shell's mode: one observer on its root, a render only when the mode changes.
  React.useEffect(() => {
    if (modeProp !== undefined) return;
    const shell = rootRef.current?.closest("[data-slot='shell']");
    if (!shell) return;
    const read = () => setObserved(readMode(shell));
    read();
    const mo = new MutationObserver(read);
    mo.observe(shell, {
      attributes: true,
      attributeFilter: ["data-panel-mode"],
    });
    return () => mo.disconnect();
  }, [modeProp]);

  // When the panel closes with focus inside, focus goes back to where it came from.
  const prevMode = React.useRef(mode);
  React.useEffect(() => {
    const was = prevMode.current;
    prevMode.current = mode;
    if (mode !== "closed" || was === "closed") return;
    const root = rootRef.current;
    if (root && root.contains(document.activeElement))
      focusBack(returnTo.current, root);
  }, [mode]);

  // A phone's full-screen panel is modal (#31): the rest of the shell goes inert under it and
  // focus moves in. Beside or over the page it stays non-modal, with nothing made inert.
  React.useEffect(() => {
    if (mode !== "full") return;
    const root = rootRef.current;
    const shell = root?.closest<HTMLElement>("[data-slot='shell']");
    if (!root || !shell) return;
    const made: HTMLElement[] = [];
    for (const child of Array.from(shell.children)) {
      if (!(child instanceof HTMLElement) || child.contains(root)) continue;
      if (child.inert) continue;
      child.inert = true;
      made.push(child);
    }
    if (!root.contains(document.activeElement)) {
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body) returnTo.current = active;
      root.focus({ preventScroll: true });
    }
    // Tab and ⇧Tab wrap inside the panel; anything outside the shell is out of reach too.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(TABBABLE),
      ).filter(
        (el) =>
          el.tabIndex >= 0 &&
          !el.closest("[inert], [hidden]") &&
          el.getClientRects().length > 0,
      );
      if (focusables.length === 0) {
        event.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const at = document.activeElement;
      // A popover, menu or dialog portaled above the panel keeps its own Tab order.
      const owner = at instanceof Element ? at.closest(ESC_OWNERS) : null;
      if (owner && owner !== root) return;
      if (
        event.shiftKey &&
        (at === first || at === root || !root.contains(at))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (at === last || !root.contains(at))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      for (const el of made) el.inert = false;
    };
  }, [mode]);

  // R5: Escape closes a panel over the page, never one beside it; popovers take it first.
  const latestClose = React.useRef(onRequestClose);
  latestClose.current = onRequestClose;
  React.useEffect(() => {
    if (mode !== "overlay" && mode !== "full") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing)
        return;
      if (!latestClose.current) return;
      // Another Escape owner (a menu, a popover, a modal) — not this panel's own phone dialog.
      const root = rootRef.current;
      for (const owner of Array.from(document.querySelectorAll(ESC_OWNERS)))
        if (owner !== root) return;
      // A field keeps its own Escape (a composer clears, an editor leaves a mode).
      if (isEditableTarget(event)) return;
      event.preventDefault();
      latestClose.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode]);

  const ctx = React.useMemo<PanelContextValue>(
    () => ({ mode, rootRef, returnTo, idPrefix }),
    [mode, idPrefix],
  );

  return (
    <PanelContext.Provider value={ctx}>
      <aside
        ref={setRoot}
        aria-label={label}
        role={mode === "full" ? "dialog" : undefined}
        aria-modal={mode === "full" ? true : undefined}
        tabIndex={-1}
        data-slot="shell-panel"
        data-mode={mode}
        inert={mode === "closed" ? true : undefined}
        className={cn(
          "relative flex h-full min-h-0 w-full flex-col bg-background text-foreground outline-none",
          mode === "full" &&
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          className,
        )}
        {...props}
      >
        {onWidthChange && mode !== "full" && mode !== "closed" ? (
          <ShellPanelResize
            label={label}
            width={width}
            onWidthChange={onWidthChange}
          />
        ) : null}
        {children}
      </aside>
    </PanelContext.Provider>
  );
}

function ShellPanelResize({
  label,
  width,
  onWidthChange,
}: {
  label: string;
  width: number | undefined;
  onWidthChange: (width: number) => void;
}) {
  const handleRef = React.useRef<HTMLDivElement | null>(null);
  const [bounds, setBounds] = React.useState({
    min: FALLBACK_MIN,
    max: FALLBACK_MAX,
  });
  const rtl = () =>
    handleRef.current
      ? getComputedStyle(handleRef.current).direction === "rtl"
      : false;

  const readBounds = React.useCallback(() => {
    const shell = shellOf(handleRef.current?.parentElement ?? null);
    if (!shell) return bounds;
    const cs = getComputedStyle(shell);
    const min = remToPx(
      cs.getPropertyValue("--shell-panel-width-min"),
      FALLBACK_MIN,
    );
    const max = remToPx(
      cs.getPropertyValue("--shell-panel-width-max"),
      FALLBACK_MAX,
    );
    let cap = Math.max(min, max);
    // Docked beside the page, the page keeps its minimum (contract §5 #2): the panel may grow
    // only by the room the page has above `data-page-min` (less its 1px hairline).
    const area = shell
      .querySelector("[data-slot='shell-main-area']")
      ?.getBoundingClientRect().width;
    const pageMin = Number(shell.getAttribute("data-page-min"));
    const panelNow =
      handleRef.current?.parentElement?.getBoundingClientRect().width;
    if (
      shell.getAttribute("data-panel-mode") === "dock" &&
      area !== undefined &&
      Number.isFinite(pageMin) &&
      pageMin > 0 &&
      panelNow !== undefined
    )
      cap = Math.max(min, Math.min(cap, panelNow + area - 1 - pageMin));
    return { min, max: cap };
  }, [bounds]);

  React.useEffect(() => {
    setBounds(readBounds());
    // Read once on mount: the tokens are static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = () => {
    const panel = handleRef.current?.parentElement;
    return panel?.getBoundingClientRect().width ?? width ?? FALLBACK_MIN;
  };
  const clamp = (n: number, b = bounds) =>
    Math.round(Math.min(b.max, Math.max(b.min, n)));

  // The drag in progress, if any: one idempotent end, run on release, lost capture or unmount.
  const endDrag = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => endDrag.current?.(), []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    endDrag.current?.();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const b = readBounds();
    setBounds(b);
    const shell = shellOf(handle.parentElement);
    const startX = event.clientX;
    const startWidth = current();
    const flip = rtl();
    let next = startWidth;
    let frame = 0;
    const write = () => {
      frame = 0;
      shell?.style.setProperty("--shell-panel-current-width", `${next}px`);
    };
    const onMove = (move: PointerEvent) => {
      const delta = flip ? move.clientX - startX : startX - move.clientX;
      next = clamp(startWidth + delta, b);
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
      if (next !== startWidth) onWidthChange(next);
    };
    endDrag.current = onUp;
    handle.setAttribute("data-resizing", "");
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
    handle.addEventListener("lostpointercapture", onUp);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const flip = rtl();
    const wider = flip ? "ArrowRight" : "ArrowLeft";
    const narrower = flip ? "ArrowLeft" : "ArrowRight";
    const now = width ?? current();
    const b = readBounds();
    setBounds(b);
    let next: number;
    if (event.key === wider) next = now + RESIZE_STEP;
    else if (event.key === narrower) next = now - RESIZE_STEP;
    else if (event.key === "Home") next = b.min;
    else if (event.key === "End") next = b.max;
    else return;
    event.preventDefault();
    event.stopPropagation();
    next = clamp(next, b);
    shellOf(event.currentTarget.parentElement)?.style.setProperty(
      "--shell-panel-current-width",
      `${next}px`,
    );
    onWidthChange(next);
  };

  return (
    <div
      ref={handleRef}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize the ${label.toLowerCase()}`}
      aria-valuenow={width === undefined ? undefined : Math.round(width)}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      tabIndex={0}
      data-slot="shell-panel-resize"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      // The page's room changes with the window: the range a screen reader hears is re-read on focus.
      onFocus={() => setBounds(readBounds())}
      className={cn(
        // A 4px seam on the edge, inside a 24px hit area (WCAG 2.5.8) that stays within the panel.
        "absolute inset-y-0 start-0 z-10 w-6 cursor-col-resize touch-none [-webkit-app-region:no-drag]",
        "after:absolute after:inset-y-0 after:start-0 after:w-1 after:rounded-full after:transition-colors after:content-['']",
        "hover:after:bg-border focus-visible:after:bg-border data-resizing:after:bg-border",
      )}
    />
  );
}

/** Props accepted by `ShellPanelHeader`. */
export type ShellPanelHeaderProps = React.ComponentPropsWithRef<"div">;

/**
 * `ShellPanelHeader` — the panel's 48px head row (`--shell-topbar-height`, the top bar's height):
 * the tab row, then the panel's own buttons. A window drag region in the desktop app; its
 * controls are not. On Windows, `Shell` adds the caption-button inset to its end.
 *
 * @example
 * <ShellPanelHeader><ShellPanelTabs …/><ShellPanelOverflow …/><ShellPanelClose …/></ShellPanelHeader>
 */
export function ShellPanelHeader({
  className,
  ...props
}: ShellPanelHeaderProps) {
  return (
    <div
      data-slot="shell-panel-head"
      className={cn(
        "flex h-(--shell-topbar-height) shrink-0 items-center gap-1 border-b border-border px-2",
        "[-webkit-app-region:drag] *:[-webkit-app-region:no-drag]",
        className,
      )}
      {...props}
    />
  );
}

interface TabsContextValue {
  value: string | null;
  focusValue: string | null;
  setFocusValue: (value: string | null) => void;
  onValueChange: (value: string) => void;
  onClose: (value: string) => void;
  onReorder?: (value: string, index: number) => void;
  onAction?: (value: string, action: ShellPanelTabAction) => void;
  canOpenInNewWindow: boolean;
  closeShortcut: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  idPrefix: string;
  dragKey: React.RefObject<string | null>;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error(`${part} must be inside ShellPanelTabs.`);
  return ctx;
}

const tabId = (prefix: string, value: string) =>
  `${prefix}-tab-${encodeURIComponent(value)}`;
const viewId = (prefix: string, value: string) =>
  `${prefix}-view-${encodeURIComponent(value)}`;

/** Props accepted by `ShellPanelTabs`. */
export interface ShellPanelTabsProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onChange"
> {
  /** The current tab's key, or `null` with no tab open. */
  value: string | null;
  /** Called when a tab is chosen: a click, or Enter / Space on a focused tab. */
  onValueChange: (value: string) => void;
  /** Called when a tab asks to close: its ×, a middle click, Delete, or its menu. */
  onClose: (value: string) => void;
  /**
   * Called when a tab is dragged, or moved with ⌥⇧← / ⌥⇧→, to `index`. Omit to keep the order.
   * @default undefined
   */
  onReorder?: (value: string, index: number) => void;
  /**
   * The tab menu's actions (right-click, ⇧F10 or the menu key on a tab), and "keep" on a double
   * click. Dragging a tab out of the panel asks for "openAsPage". Omit for no menu.
   * @default undefined
   */
  onAction?: (value: string, action: ShellPanelTabAction) => void;
  /**
   * Show "Open in new window" in the menu (the desktop app).
   * @default false
   */
  canOpenInNewWindow?: boolean;
  /**
   * The close shortcut the menu shows: ⌥W in a browser, ⌘W in the desktop app.
   * @default formatShortcut(["alt", "W"], os)
   */
  closeShortcut?: string;
  /**
   * The tab row's accessible name.
   * @default "Open tabs"
   */
  label?: string;
}

/**
 * `ShellPanelTabs` — the panel's tab row (`role="tablist"`): one `ShellPanelTab` per open record,
 * pinned ones first as icons, a preview tab in italics. It scrolls sideways when the tabs outgrow
 * it and keeps the current tab in view. Keyboard: ← → Home End move between tabs, Enter or Space
 * opens one, Delete closes it, ⌥⇧← ⌥⇧→ move it, ⇧F10 opens its menu. On a phone (`full` mode)
 * only the current tab shows — phones push records instead of tabbing them (R6).
 *
 * @example
 * <ShellPanelTabs value={active} onValueChange={activate} onClose={close} onReorder={reorder} onAction={act}>
 *   <ShellPanelTab value="task:42" title="Review Q3 pricing" icon={<SquareCheck />} />
 * </ShellPanelTabs>
 */
export function ShellPanelTabs({
  value,
  onValueChange,
  onClose,
  onReorder,
  onAction,
  canOpenInNewWindow = false,
  closeShortcut,
  label = "Open tabs",
  className,
  children,
  ref,
  ...props
}: ShellPanelTabsProps) {
  const { os } = usePlatform();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const dragKey = React.useRef<string | null>(null);
  const [focusValue, setFocusValue] = React.useState<string | null>(null);
  const { rootRef, returnTo, idPrefix } = usePanelContext();

  const setList = React.useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  // A tab chosen from outside the panel (a row, a link, a notification): remember where focus
  // was, so closing the panel brings it back.
  const prevValue = React.useRef(value);
  React.useLayoutEffect(() => {
    if (prevValue.current === value) return;
    prevValue.current = value;
    const active = document.activeElement as HTMLElement | null;
    const root = rootRef.current;
    if (active && active !== document.body && !root?.contains(active))
      returnTo.current = active;
  }, [value, rootRef, returnTo]);

  // Keep the current tab in view as tabs come and go.
  React.useEffect(() => {
    if (value === null) return;
    const el = document.getElementById(tabId(idPrefix, value));
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value, idPrefix]);

  const close = React.useCallback(
    (key: string) => {
      const list = listRef.current;
      const hadFocus = !!list?.contains(document.activeElement);
      const tabs = list
        ? Array.from(list.querySelectorAll<HTMLElement>("[role='tab']"))
        : [];
      const at = tabs.findIndex((t) => t.dataset.value === key);
      onClose(key);
      if (!hadFocus) return;
      // Focus the neighbour that will remain; with none left, go back where we came from.
      const neighbour = tabs[at + 1] ?? tabs[at - 1];
      requestAnimationFrame(() => {
        const next = neighbour?.isConnected
          ? neighbour
          : list?.querySelector<HTMLElement>("[role='tab'][tabindex='0']");
        if (next) next.focus({ preventScroll: true });
        else focusBack(returnTo.current, rootRef.current);
      });
    },
    [onClose, returnTo, rootRef],
  );

  const ctx: TabsContextValue = {
    value,
    focusValue,
    setFocusValue,
    onValueChange,
    onClose: close,
    onReorder,
    onAction,
    canOpenInNewWindow,
    closeShortcut: closeShortcut ?? formatShortcut(["alt", "W"], os),
    listRef,
    idPrefix,
    dragKey,
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.getAttribute("role") !== "tab") return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[role='tab']"),
    ).filter((t) => t.offsetParent !== null || t === target);
    const at = tabs.indexOf(target);
    const key = target.dataset.value!;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (
      event.altKey &&
      event.shiftKey &&
      (event.key === fwd || event.key === back)
    ) {
      if (!onReorder) return;
      event.preventDefault();
      const all = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>("[role='tab']"),
      );
      const idx = all.indexOf(target);
      onReorder(key, idx + (event.key === fwd ? 1 : -1));
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
      return;
    }
    // The tab menu from the keyboard (#31): ⇧F10 or the menu key, on every platform.
    if (
      (event.shiftKey && event.key === "F10") ||
      event.key === "ContextMenu"
    ) {
      event.preventDefault();
      const r = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: r.left + 8,
          clientY: r.bottom,
        }),
      );
      return;
    }
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    let next: HTMLElement | undefined;
    if (event.key === fwd) next = tabs[(at + 1) % tabs.length];
    else if (event.key === back)
      next = tabs[(at - 1 + tabs.length) % tabs.length];
    else if (event.key === "Home") next = tabs[0];
    else if (event.key === "End") next = tabs[tabs.length - 1];
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      ctx.onValueChange(key);
      return;
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      close(key);
      return;
    } else return;
    event.preventDefault();
    if (next) {
      setFocusValue(next.dataset.value ?? null);
      next.focus();
      next.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={setList}
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        data-slot="shell-panel-tabs"
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setFocusValue(null);
        }}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain scrollbar-none",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/** Props accepted by `ShellPanelTab`. */
export interface ShellPanelTabProps extends Omit<
  React.ComponentPropsWithRef<"button">,
  "title" | "value"
> {
  /** The tab's key — the same key the reducer and the URL use. */
  value: string;
  /** The record's title; truncates, and shows in full on hover. */
  title: string;
  /**
   * The record kind's icon; a pinned tab shows only this.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * A preview tab: its title is italic until it is kept (L18).
   * @default false
   */
  preview?: boolean;
  /**
   * Pinned: an icon-only tab at the start, with no × (close it from its menu).
   * @default false
   */
  pinned?: boolean;
  /**
   * The record changed since the tab was last seen: a dot until it is (R4).
   * @default false
   */
  changed?: boolean;
  /**
   * The record's own page — dragged out of the window as a link, and what "Copy link" copies.
   * @default undefined
   */
  href?: string;
}

/**
 * `ShellPanelTab` — one tab: icon, title, a change dot and ×. A click opens it, a double click
 * keeps a preview tab, a middle click closes it, a right click opens its menu, and it drags to
 * reorder (or out of the panel to open as a page). The × is a pointer convenience; the keyboard
 * closes with Delete and the menu.
 *
 * @example
 * <ShellPanelTab value="page:q3" title="Q3 pricing notes" icon={<FileText />} preview />
 */
export function ShellPanelTab({
  value,
  title,
  icon,
  preview = false,
  pinned = false,
  changed = false,
  href,
  className,
  ref,
  ...props
}: ShellPanelTabProps) {
  const ctx = useTabsContext("ShellPanelTab");
  const { rootRef } = usePanelContext();
  const selected = ctx.value === value;
  const focusable =
    ctx.focusValue !== null ? ctx.focusValue === value : selected;
  const [dropEdge, setDropEdge] = React.useState<"start" | "end" | null>(null);

  const indexOf = (el: HTMLElement) =>
    Array.from(
      ctx.listRef.current?.querySelectorAll<HTMLElement>("[role='tab']") ?? [],
    ).indexOf(el);

  const tab = (
    <button
      ref={ref}
      type="button"
      id={tabId(ctx.idPrefix, value)}
      role="tab"
      aria-selected={selected}
      aria-controls={viewId(ctx.idPrefix, value)}
      aria-keyshortcuts="Delete"
      tabIndex={
        focusable || (ctx.value === null && ctx.focusValue === null) ? 0 : -1
      }
      title={title}
      data-slot="shell-panel-tab"
      data-value={value}
      data-state={selected ? "active" : "inactive"}
      data-preview={preview || undefined}
      data-pinned={pinned || undefined}
      data-changed={changed || undefined}
      data-drop-edge={dropEdge ?? undefined}
      draggable={!!ctx.onReorder || !!ctx.onAction}
      onFocus={() => ctx.setFocusValue(value)}
      onClick={() => ctx.onValueChange(value)}
      onDoubleClick={() => {
        if (preview) ctx.onAction?.(value, "keep");
      }}
      onMouseDown={(event) => {
        // No autoscroll cursor on a middle press; the close happens on auxclick.
        if (event.button === 1) event.preventDefault();
      }}
      onAuxClick={(event) => {
        if (event.button !== 1) return;
        event.preventDefault();
        ctx.onClose(value);
      }}
      onDragStart={(event) => {
        ctx.dragKey.current = value;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-vegastack-panel-tab", value);
        if (href) {
          const url = new URL(href, window.location.href).toString();
          event.dataTransfer.setData("text/uri-list", url);
          event.dataTransfer.setData("text/plain", url);
        }
      }}
      onDragOver={(event) => {
        const from = ctx.dragKey.current;
        if (!from || from === value || !ctx.onReorder) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        const r = event.currentTarget.getBoundingClientRect();
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const before = event.clientX < r.left + r.width / 2;
        setDropEdge(before !== rtl ? "start" : "end");
      }}
      onDragLeave={() => setDropEdge(null)}
      onDrop={(event) => {
        const from = ctx.dragKey.current;
        const edge = dropEdge;
        setDropEdge(null);
        if (!from || from === value || !ctx.onReorder) return;
        event.preventDefault();
        const tabs = Array.from(
          ctx.listRef.current?.querySelectorAll<HTMLElement>("[role='tab']") ??
            [],
        );
        const fromIdx = tabs.findIndex((t) => t.dataset.value === from);
        let to = indexOf(event.currentTarget) + (edge === "end" ? 1 : 0);
        if (fromIdx < to) to -= 1;
        ctx.onReorder(from, to);
      }}
      onDragEnd={(event) => {
        ctx.dragKey.current = null;
        setDropEdge(null);
        // R4: a tab dropped outside the panel opens as a page.
        if (event.dataTransfer.dropEffect !== "none") return;
        const panel = rootRef.current ?? ctx.listRef.current;
        const r = panel?.getBoundingClientRect();
        const { clientX: x, clientY: y } = event;
        if (!r || (x === 0 && y === 0)) return;
        const outside = x < r.left || x > r.right || y < r.top || y > r.bottom;
        // R4: a new window where the desktop app can open one, else the page.
        if (outside)
          ctx.onAction?.(
            value,
            ctx.canOpenInNewWindow ? "openInNewWindow" : "openAsPage",
          );
      }}
      className={cn(
        "group/tab relative flex h-8 max-w-44 min-w-18 shrink basis-auto cursor-pointer items-center gap-1.5 rounded-item ps-2.5 pe-1 text-sm text-muted-foreground transition-colors duration-100 outline-none select-none motion-enter-up",
        "state-layer hover:text-foreground",
        "aria-selected:bg-state-selected aria-selected:font-medium aria-selected:text-foreground",
        // Tabs give way before the row scrolls; a pinned tab is a fixed 32px icon.
        "data-pinned:max-w-8 data-pinned:min-w-8 data-pinned:shrink-0 data-pinned:justify-center data-pinned:px-0",
        // Drop seam: the info-blue line every reorder surface uses.
        "data-[drop-edge=start]:before:absolute data-[drop-edge=start]:before:inset-y-1 data-[drop-edge=start]:before:-start-0.5 data-[drop-edge=start]:before:w-0.5 data-[drop-edge=start]:before:bg-info data-[drop-edge=start]:before:content-['']",
        "data-[drop-edge=end]:before:absolute data-[drop-edge=end]:before:inset-y-1 data-[drop-edge=end]:before:-end-0.5 data-[drop-edge=end]:before:w-0.5 data-[drop-edge=end]:before:bg-info data-[drop-edge=end]:before:content-['']",
        // A phone pushes records instead of tabbing them: only the current one shows (R6).
        "group-data-[panel-mode=full]/shell:not-data-[state=active]:hidden group-data-[panel-mode=full]/shell:max-w-none group-data-[panel-mode=full]/shell:flex-1 group-data-[panel-mode=full]/shell:aria-selected:bg-transparent group-data-[panel-mode=full]/shell:font-semibold",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden
          data-slot="shell-panel-tab-icon"
          className="flex shrink-0 [&_svg]:size-3.5"
        >
          {icon}
        </span>
      ) : null}
      <span
        data-slot="shell-panel-tab-title"
        className={cn(
          "min-w-0 flex-1 truncate text-start",
          preview && "italic",
          pinned && "sr-only",
        )}
      >
        {title}
      </span>
      {preview ? <span className="sr-only">, preview</span> : null}
      {pinned ? <span className="sr-only">, pinned</span> : null}
      {changed ? (
        <>
          <span
            aria-hidden
            data-slot="shell-panel-tab-dot"
            className={cn(
              "size-1.5 shrink-0 rounded-full bg-info",
              pinned && "absolute end-1 top-1",
            )}
          />
          <span className="sr-only">, changed</span>
        </>
      ) : null}
      {pinned ? null : (
        <span
          aria-hidden
          data-slot="shell-panel-tab-close"
          onClick={(event) => {
            event.stopPropagation();
            ctx.onClose(value);
          }}
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            "relative flex size-5 shrink-0 items-center justify-center rounded-icon text-muted-foreground opacity-0 transition-opacity duration-100 state-layer hover:text-foreground [&_svg]:size-3",
            "group-hover/tab:opacity-100 group-data-[state=active]/tab:opacity-100",
            // A 24px hit area around the 20px glyph.
            "before:absolute before:-inset-0.5 before:content-['']",
            // Touch has no hover: the × always shows there.
            "pointer-coarse:opacity-100",
            "group-data-[panel-mode=full]/shell:hidden",
          )}
        >
          <X />
        </span>
      )}
    </button>
  );

  if (!ctx.onAction) return tab;
  return (
    <ContextMenu>
      <ContextMenuTrigger render={tab} />
      <ShellPanelTabMenu
        value={value}
        preview={preview}
        pinned={pinned}
        hasLink={!!href}
      />
    </ContextMenu>
  );
}

/** Props accepted by `ShellPanelTabMenu`. */
export interface ShellPanelTabMenuProps {
  /** The tab the menu acts on. */
  value: string;
  /** Show "Keep open". @default false */
  preview?: boolean;
  /** Show "Unpin" instead of "Pin". @default false */
  pinned?: boolean;
  /** Show "Copy link". @default true */
  hasLink?: boolean;
}

/**
 * `ShellPanelTabMenu` — a tab's menu (R3): Keep open, Pin, Close, Close others, Close tabs to the
 * right, Close all, Open as page, Open in new window (desktop app), Copy link. `ShellPanelTab`
 * renders it inside its own `ContextMenu` when `ShellPanelTabs` has `onAction`; every item calls
 * `onAction(value, action)`.
 *
 * @example
 * <ContextMenu><ContextMenuTrigger render={<div />} /><ShellPanelTabMenu value="task:1" preview /></ContextMenu>
 */
export function ShellPanelTabMenu({
  value,
  preview = false,
  pinned = false,
  hasLink = true,
}: ShellPanelTabMenuProps) {
  const ctx = useTabsContext("ShellPanelTabMenu");
  const act = (action: ShellPanelTabAction) => () =>
    action === "close" ? ctx.onClose(value) : ctx.onAction?.(value, action);
  // The menu's alternative to dragging (#31): touch and keyboard users move tabs here.
  const move = (by: -1 | 1) => () => {
    const tabs = Array.from(
      ctx.listRef.current?.querySelectorAll<HTMLElement>("[role='tab']") ?? [],
    );
    const at = tabs.findIndex((t) => t.dataset.value === value);
    if (at >= 0) ctx.onReorder?.(value, at + by);
  };
  return (
    <ContextMenuContent data-slot="shell-panel-tab-menu" className="min-w-56">
      {preview ? (
        <ContextMenuItem onClick={act("keep")}>Keep open</ContextMenuItem>
      ) : null}
      <ContextMenuItem onClick={act(pinned ? "unpin" : "pin")}>
        {pinned ? "Unpin" : "Pin"}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={act("close")}>
        Close
        <ContextMenuShortcut>{ctx.closeShortcut}</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={act("closeOthers")}>
        Close others
      </ContextMenuItem>
      <ContextMenuItem onClick={act("closeRight")}>
        Close tabs to the right
      </ContextMenuItem>
      <ContextMenuItem onClick={act("closeAll")}>Close all</ContextMenuItem>
      {ctx.onReorder ? (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={move(-1)}>Move left</ContextMenuItem>
          <ContextMenuItem onClick={move(1)}>Move right</ContextMenuItem>
        </>
      ) : null}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={act("openAsPage")}>
        Open as page
      </ContextMenuItem>
      {ctx.canOpenInNewWindow ? (
        <ContextMenuItem onClick={act("openInNewWindow")}>
          Open in new window
        </ContextMenuItem>
      ) : null}
      {hasLink ? (
        <ContextMenuItem onClick={act("copyLink")}>Copy link</ContextMenuItem>
      ) : null}
    </ContextMenuContent>
  );
}

/** Props accepted by `ShellPanelOverflow`. */
export interface ShellPanelOverflowProps {
  /** Every open tab, in order. */
  tabs: readonly ShellPanelTabItem[];
  /** Recently closed tabs, newest first. @default [] */
  closed?: readonly ShellPanelTabItem[];
  /** The current tab's key. */
  value: string | null;
  /** Go to an open tab. */
  onSelect: (value: string) => void;
  /** Reopen a closed tab. */
  onReopen: (value: string) => void;
  /**
   * The reopen shortcut shown on the newest closed tab: ⌥⇧T in a browser, ⌘⇧T in the desktop app.
   * @default formatShortcut(["alt", "shift", "T"], os)
   */
  reopenShortcut?: string;
  /**
   * A quiet line under the lists — the auto-close setting and where to change it.
   * @default undefined
   */
  footer?: React.ReactNode;
  /** How many closed tabs to list. @default 5 */
  closedLimit?: number;
}

/**
 * `ShellPanelOverflow` — the ▾ at the end of the tab row: every open tab with search, then
 * Recently closed (R3). Choosing an open tab goes to it; choosing a closed one reopens it.
 *
 * @example
 * <ShellPanelOverflow tabs={items} closed={closedItems} value={active} onSelect={activate} onReopen={reopen} footer="Tabs unseen for 1 day close" />
 */
export function ShellPanelOverflow({
  tabs,
  closed = [],
  value,
  onSelect,
  onReopen,
  reopenShortcut,
  footer,
  closedLimit = 5,
}: ShellPanelOverflowProps) {
  const { os } = usePlatform();
  const [open, setOpen] = React.useState(false);
  const shortcut = reopenShortcut ?? formatShortcut(["alt", "shift", "T"], os);
  const recent = closed.slice(0, closedLimit);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="All tabs"
            data-slot="shell-panel-overflow"
            // A phone pushes records instead of tabbing them (R6): no tab list to open.
            className="group-data-[panel-mode=full]/shell:hidden"
          />
        }
      >
        <ChevronDown />
      </PopoverTrigger>
      <PopoverContent align="end" size="md" className="p-0">
        <Command>
          <CommandInput placeholder="Search tabs" />
          <CommandList>
            <CommandEmpty>No tabs match</CommandEmpty>
            {tabs.length > 0 ? (
              <CommandGroup heading={`Open · ${tabs.length}`}>
                {tabs.map((t) => (
                  <CommandItem
                    key={t.value}
                    value={`open ${t.value}`}
                    keywords={[t.title]}
                    onSelect={() => {
                      setOpen(false);
                      onSelect(t.value);
                    }}
                  >
                    {t.icon}
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        t.preview && "italic",
                      )}
                    >
                      {t.title}
                    </span>
                    {t.value === value ? (
                      <Check
                        aria-label="Current tab"
                        className="text-primary"
                      />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {recent.length > 0 ? (
              <CommandGroup heading="Recently closed">
                {recent.map((t, i) => (
                  <CommandItem
                    key={t.value}
                    value={`closed ${t.value}`}
                    keywords={[t.title]}
                    className="text-muted-foreground"
                    onSelect={() => {
                      setOpen(false);
                      onReopen(t.value);
                    }}
                  >
                    {t.icon}
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    {i === 0 ? (
                      <CommandShortcut>{shortcut}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
          {footer ? (
            <div
              data-slot="shell-panel-overflow-footer"
              className="border-t border-border px-3 py-2 text-xs text-muted-foreground"
            >
              {footer}
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Props accepted by `ShellPanelClose`. */
export interface ShellPanelCloseProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children"
> {
  /** @default "Close panel" */
  label?: string;
}

/**
 * `ShellPanelClose` — the head's close button: × beside or over the page, ‹ Back on a phone,
 * where the panel is a pushed screen.
 *
 * @example
 * <ShellPanelClose onClick={() => setPanelOpen(false)} />
 */
export function ShellPanelClose({
  label = "Close panel",
  className,
  ...props
}: ShellPanelCloseProps) {
  const { mode } = usePanelContext();
  const full = mode === "full";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={full ? "Back" : label}
      data-slot="shell-panel-close"
      className={cn(full && "order-first", className)}
      {...props}
    >
      {full ? <ChevronLeft /> : <X />}
    </Button>
  );
}

/** Props accepted by `ShellPanelBody`. */
export type ShellPanelBodyProps = React.ComponentPropsWithRef<"div">;

/**
 * `ShellPanelBody` — holds one `ShellPanelView` per open tab, below the head.
 *
 * @example
 * <ShellPanelBody>{tabs.map((t) => <ShellPanelView key={t.key} value={t.key}>…</ShellPanelView>)}</ShellPanelBody>
 */
export function ShellPanelBody({ className, ...props }: ShellPanelBodyProps) {
  return (
    <div
      data-slot="shell-panel-body"
      className={cn("relative flex min-h-0 flex-1 flex-col", className)}
      {...props}
    />
  );
}

/** Props accepted by `ShellPanelView`. */
export interface ShellPanelViewProps extends React.ComponentPropsWithRef<"div"> {
  /** The tab this view belongs to. */
  value: string;
  /** The tab's current key, from `ShellPanelTabs`'s `value`. */
  activeValue: string | null;
  /**
   * Shown while the view's code or data streams in.
   * @default <ShellPanelSkeleton />
   */
  fallback?: React.ReactNode;
  /**
   * A number that changes each time this view should take focus: pass
   * `state.focus?.key === value ? state.focus.seq : undefined` from `usePanelTabs`, which sets it
   * only for a kept tab opened in the foreground. Preview and background opens never move focus.
   * @default undefined
   */
  focusRequest?: number;
}

/**
 * `ShellPanelView` — one tab's body (`role="tabpanel"`). It mounts when its tab is first shown and
 * then stays alive while hidden (React `<Activity mode="hidden">`), so switching back keeps
 * scroll, drafts and loaded data; hidden views render at low priority and run no effects. Its
 * children may be lazy or suspend: `fallback` (a skeleton shaped like a record header) shows
 * meanwhile. Unmount a view by closing its tab.
 *
 * @example
 * <ShellPanelView value={t.key} activeValue={active} focusRequest={state.focus?.key === t.key ? state.focus.seq : undefined}>
 *   <TaskPanelView id={idOf(t.key)} />
 * </ShellPanelView>
 */
export function ShellPanelView({
  value,
  activeValue,
  fallback,
  focusRequest,
  className,
  children,
  ref,
  ...props
}: ShellPanelViewProps) {
  const visible = activeValue === value;
  const [mounted, setMounted] = React.useState(visible);
  if (visible && !mounted) setMounted(true);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const { rootRef, idPrefix: prefix } = usePanelContext();

  React.useEffect(() => {
    if (!visible || focusRequest === undefined) return;
    innerRef.current?.focus({ preventScroll: true });
    // Only a new request moves focus — never a re-render or a switch back to this tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  if (!mounted) return null;
  const Activity = (
    React as unknown as {
      Activity?: React.ComponentType<{
        mode: "visible" | "hidden";
        children: React.ReactNode;
      }>;
    }
  ).Activity;
  const body = (
    <div
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
      }}
      id={viewId(prefix, value)}
      role="tabpanel"
      aria-labelledby={tabId(prefix, value)}
      tabIndex={-1}
      hidden={Activity ? undefined : !visible}
      data-slot="shell-panel-view"
      data-value={value}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain outline-none select-text",
        className,
      )}
      {...props}
    >
      <React.Suspense fallback={fallback ?? <ShellPanelSkeleton />}>
        {children}
      </React.Suspense>
    </div>
  );
  return Activity ? (
    <Activity mode={visible ? "visible" : "hidden"}>{body}</Activity>
  ) : (
    body
  );
}

/** Props accepted by `ShellPanelSkeleton`. */
export type ShellPanelSkeletonProps = React.ComponentPropsWithRef<"div">;

/**
 * `ShellPanelSkeleton` — the loading shape of a record in the panel: breadcrumb, a two-line
 * title, a property row and a few lines, padded like the record it stands in for.
 *
 * @example
 * <React.Suspense fallback={<ShellPanelSkeleton />}><TaskView /></React.Suspense>
 */
export function ShellPanelSkeleton({
  className,
  ...props
}: ShellPanelSkeletonProps) {
  return (
    <div
      data-slot="shell-panel-skeleton"
      aria-busy="true"
      aria-label="Loading"
      role="status"
      className={cn("flex flex-col gap-4 px-4 pt-4 pb-6", className)}
      {...props}
    >
      <Skeleton className="h-3.5 w-1/3" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-2/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-chip" />
        <Skeleton className="h-6 w-24 rounded-chip" />
        <Skeleton className="h-6 w-16 rounded-chip" />
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  );
}

/** Props accepted by `ShellPanelEmpty`. */
export interface ShellPanelEmptyProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "title"
> {
  /** @default "Nothing open" */
  title?: React.ReactNode;
  /** @default "Click a task, page or meeting to open it here." */
  description?: React.ReactNode;
  /** Recently closed tabs to offer, newest first. @default [] */
  recent?: readonly ShellPanelTabItem[];
  /** Reopen one of `recent`. @default undefined */
  onReopen?: (value: string) => void;
}

/**
 * `ShellPanelEmpty` — the panel with no tab open: "Nothing open", a line on how to open
 * something, and Recently closed to bring one back (L21: the empty panel never shows the
 * assistant).
 *
 * @example
 * <ShellPanelEmpty recent={closedItems.slice(0, 5)} onReopen={reopen} />
 */
export function ShellPanelEmpty({
  title = "Nothing open",
  description = "Click a task, page or meeting to open it here.",
  recent = [],
  onReopen,
  className,
  ...props
}: ShellPanelEmptyProps) {
  return (
    <div
      data-slot="shell-panel-empty"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-8",
        className,
      )}
      {...props}
    >
      <Empty className="flex-none border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PanelRight />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
      {recent.length > 0 && onReopen ? (
        <section aria-label="Recently closed" className="flex flex-col gap-1">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">
            Recently closed
          </h3>
          <ul className="flex flex-col">
            {recent.map((t) => (
              <li key={t.value}>
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={() => onReopen(t.value)}
                >
                  {t.icon}
                  <span className="min-w-0 truncate">{t.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** Options for `usePanelTabs`. */
export interface UsePanelTabsOptions {
  /**
   * The starting state: `deserializePanelTabs` of the saved tabs, then a `restore` of
   * `decodePanelParam` when the URL has `?panel=` (the URL wins, contract §5 #7).
   * @default createPanelTabs()
   */
  initial?: PanelTabsState | (() => PanelTabsState);
  /**
   * The person's auto-close choice (L20). Checked every minute and when the window returns.
   * @default "1d"
   */
  autoClose?: TabAutoClose;
  /**
   * The cap closed `key` to make room: show "Closed <title> · Undo" (Undo calls `undo()`).
   * @default undefined
   */
  onEvicted?: (key: string) => void;
  /**
   * Every open tab holds a draft or an upload, so the cap was exceeded: suggest tidying up.
   * @default undefined
   */
  onOverCap?: () => void;
}

/**
 * `usePanelTabs` — `panelTabsReducer` bound to React: the clock filled in, auto-close running,
 * and the cap's toasts raised through `onEvicted` / `onOverCap`. Each method dispatches one
 * reducer action; `act` runs a tab-menu action the reducer owns.
 *
 * @example
 * const tabs = usePanelTabs({ initial: () => deserializePanelTabs(saved), onEvicted: toastUndo });
 * tabs.open({ kind: "record", type: "task", id, scope: "live" }, { preview: true });
 */
export function usePanelTabs({
  initial,
  autoClose = DEFAULT_TAB_AUTO_CLOSE,
  onEvicted,
  onOverCap,
}: UsePanelTabsOptions = {}) {
  const [state, dispatch] = React.useReducer(
    panelTabsReducer,
    initial,
    (init): PanelTabsState =>
      typeof init === "function" ? init() : (init ?? createPanelTabs()),
  );

  React.useEffect(() => {
    const maxAgeMs = TAB_AUTO_CLOSE_MS[autoClose];
    if (maxAgeMs === null) return;
    const tick = () => dispatch({ type: "expire", now: Date.now(), maxAgeMs });
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [autoClose]);

  const handlers = React.useRef({ onEvicted, onOverCap });
  handlers.current = { onEvicted, onOverCap };
  const eventSeq = React.useRef(state.event?.seq ?? 0);
  React.useEffect(() => {
    const event = state.event;
    if (!event || event.seq === eventSeq.current) return;
    eventSeq.current = event.seq;
    if (event.type === "evicted") handlers.current.onEvicted?.(event.key);
    else handlers.current.onOverCap?.();
  }, [state.event]);

  const actions = React.useMemo(
    () => ({
      dispatch,
      open: (
        ref: PanelTabRef,
        opts: { preview?: boolean; background?: boolean } = {},
      ) => dispatch({ type: "open", ref, now: Date.now(), ...opts }),
      activate: (key: string) =>
        dispatch({ type: "activate", key, now: Date.now() }),
      navigate: (key: string, ref: PanelTabRef) =>
        dispatch({ type: "navigate", key, ref, now: Date.now() }),
      back: (key: string) => dispatch({ type: "back", key, now: Date.now() }),
      rekey: (key: string, ref: PanelTabRef) =>
        dispatch({ type: "rekey", key, ref, now: Date.now() }),
      close: (key: string) => dispatch({ type: "close", key, now: Date.now() }),
      reopen: (key?: string) =>
        dispatch({ type: "reopen", key, now: Date.now() }),
      undo: () => dispatch({ type: "undo", now: Date.now() }),
      restore: (value: {
        tabs: readonly { ref: PanelTabRef; preview: boolean }[];
        activeKey: string | null;
        keepUnlisted?: boolean;
      }) => dispatch({ type: "restore", now: Date.now(), ...value }),
      reorder: (key: string, index: number) =>
        dispatch({ type: "reorder", key, index }),
      markChanged: (key: string) => dispatch({ type: "markChanged", key }),
      protect: (key: string, value: boolean) =>
        dispatch({ type: "protect", key, protected: value }),
      act: (key: string, action: ShellPanelTabAction): boolean => {
        switch (action) {
          case "keep":
          case "pin":
          case "unpin":
            dispatch({ type: action, key });
            return true;
          case "close":
          case "closeOthers":
          case "closeRight":
            dispatch({ type: action, key, now: Date.now() });
            return true;
          case "closeAll":
            dispatch({ type: "closeAll", now: Date.now() });
            return true;
          default:
            return false;
        }
      },
    }),
    [],
  );
  return { state, ...actions };
}
