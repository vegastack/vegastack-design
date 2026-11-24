// @vegastack record-layout@0.123.3 sha256-s500GJnI137X3aFA3HFgJYLIKWjVgxjxnrdb7S/sJsM=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRight, PanelRight, Plus, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Kbd } from "@/components/ui/kbd";
import { PeekSheet } from "@/components/ui/peek";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/components/ui/use-media-query";
import {
  formatShortcut,
  isEditableTarget,
  usePlatform,
} from "@/components/ui/use-platform";

/* ------------------------------------------------------------------------------------------------
 * RecordPanel — a record page's one side panel (record side panel R1–R5): 320px, flush to the
 * page's right edge with one full-height divider, its sections stacked (Details, Related, Files…),
 * each folding on its own. No strip of icons: the page bar's ▥ (`RecordPanelToggle`, ⌘.) shows and
 * hides it.
 *
 * Where it sits follows the record layout's own width, not the window's:
 *
 *   record width     panel                                             open on load
 *   ≥ dockAt         docks beside the main column                     `open` (the app's choice)
 *   below it         opens over the page, edge to edge, on ▥ (Esc)     closed
 *   < 640px window   a bottom sheet the "Details" button opens         closed
 *
 * `dockAt` is the record width, in rem, from which it docks — per page type, so the main column
 * never shrinks below its measure: 69 (prose, the default), 74, 75 (a document) or 95 (a document
 * with its comment margin). The server draws it, so nothing jumps on hydration.
 *
 * `RecordPanelProvider` holds the state the toggle, the phone button and the panel share; the app
 * owns the remembered choice (`open`, `onOpenChange`) and each section's fold (`sections`,
 * `onSectionOpenChange`), so it can keep them per person and per record type; `useRecordPanel`
 * lets the page reveal a section from elsewhere (a menu's "Versions"). A docked panel that
 * is open on load is drawn by the server: nothing moves when the page hydrates.
 * ----------------------------------------------------------------------------------------------*/

const PHONE_QUERY = "(max-width: 639px)";
/**
 * The record widths, in rem, from which the panel may dock (`dockAt`): the page's measure, its
 * gutters and the 320px panel side by side. 69 — a 720px reading column (task, meeting, chat);
 * 74 — a wider record (customer, project, product, folder, file); 75 — a document (page, row,
 * skill); 95 — a document with its comment margin.
 */
export type RecordPanelDock = 69 | 74 | 75 | 95;
/** The default `dockAt`: a 720px reading column (a 1440px window with the sidebar open docks). */
const DOCK_REM: RecordPanelDock = 69;

/**
 * Each threshold's container queries, written out whole because Tailwind reads class names, not
 * variables: docked and open from `dockAt`, floating over the page below it, and the open motion
 * of each. Chosen by the panel's `data-dock`.
 */
const DOCK_CLASSES: Record<RecordPanelDock, string> = {
  69: "@min-[69rem]/record-layout:data-open:flex @max-[69rem]/record-layout:absolute @max-[69rem]/record-layout:inset-y-0 @max-[69rem]/record-layout:end-0 @max-[69rem]/record-layout:z-20 @max-[69rem]/record-layout:max-w-full @max-[69rem]/record-layout:shadow-xl @max-[69rem]/record-layout:data-overlay:flex @min-[69rem]/record-layout:data-[motion=enter]:starting:w-0 @max-[69rem]/record-layout:data-[motion=enter]:starting:translate-x-4 rtl:@max-[69rem]/record-layout:data-[motion=enter]:starting:-translate-x-4",
  74: "@min-[74rem]/record-layout:data-open:flex @max-[74rem]/record-layout:absolute @max-[74rem]/record-layout:inset-y-0 @max-[74rem]/record-layout:end-0 @max-[74rem]/record-layout:z-20 @max-[74rem]/record-layout:max-w-full @max-[74rem]/record-layout:shadow-xl @max-[74rem]/record-layout:data-overlay:flex @min-[74rem]/record-layout:data-[motion=enter]:starting:w-0 @max-[74rem]/record-layout:data-[motion=enter]:starting:translate-x-4 rtl:@max-[74rem]/record-layout:data-[motion=enter]:starting:-translate-x-4",
  75: "@min-[75rem]/record-layout:data-open:flex @max-[75rem]/record-layout:absolute @max-[75rem]/record-layout:inset-y-0 @max-[75rem]/record-layout:end-0 @max-[75rem]/record-layout:z-20 @max-[75rem]/record-layout:max-w-full @max-[75rem]/record-layout:shadow-xl @max-[75rem]/record-layout:data-overlay:flex @min-[75rem]/record-layout:data-[motion=enter]:starting:w-0 @max-[75rem]/record-layout:data-[motion=enter]:starting:translate-x-4 rtl:@max-[75rem]/record-layout:data-[motion=enter]:starting:-translate-x-4",
  95: "@min-[95rem]/record-layout:data-open:flex @max-[95rem]/record-layout:absolute @max-[95rem]/record-layout:inset-y-0 @max-[95rem]/record-layout:end-0 @max-[95rem]/record-layout:z-20 @max-[95rem]/record-layout:max-w-full @max-[95rem]/record-layout:shadow-xl @max-[95rem]/record-layout:data-overlay:flex @min-[95rem]/record-layout:data-[motion=enter]:starting:w-0 @max-[95rem]/record-layout:data-[motion=enter]:starting:translate-x-4 rtl:@max-[95rem]/record-layout:data-[motion=enter]:starting:-translate-x-4",
};
/** Popups a panel row may open, which a press in never counts as outside the panel. */
const POPUPS =
  "[role='menu'], [role='listbox'], [role='dialog'], [role='alertdialog'], [data-slot='popover-content'], [data-slot='tooltip-content'], [data-base-ui-portal]";
const ESC_OWNERS =
  "[role='menu'], [data-open] [role='listbox'], [role='listbox'][data-open], [data-slot='popover-content'], [role='alertdialog'], [role='dialog'][aria-modal='true']";

type Mode = "docked" | "overlay" | "sheet";

interface PanelContextValue {
  /** The panel element's id (the toggle's `aria-controls`). */
  id: string;
  label: string;
  /** The record width, in rem, from which the panel docks. */
  dockAt: RecordPanelDock;
  /** The remembered choice: whether the panel is open where it docks. */
  open: boolean;
  /** Whether this record is wide enough to dock: `null` until measured. */
  docked: boolean | null;
  setDocked: (docked: boolean | null) => void;
  /** The panel floating over a narrower record (never remembered). */
  overlay: boolean;
  /** The phone's sheet (never remembered). */
  sheet: boolean;
  setSheet: (open: boolean) => void;
  mode: Mode;
  /** Whether the panel shows now, in whichever mode. */
  shown: boolean;
  /** A person's open plays the motion once; a load never does. */
  motion: boolean;
  clearMotion: () => void;
  toggle: () => void;
  /** Hides the panel; focus goes back to ▥ when it was in the panel (unless `restoreFocus` is false). */
  dismiss: (restoreFocus?: boolean) => void;
  /** Each section's fold, by its `value`. */
  sections: Readonly<Record<string, boolean>>;
  setSection: (value: string, open: boolean) => void;
  /** Shows the panel and opens `value`'s section, scrolled into view. */
  reveal: (value: string) => void;
}

const PanelContext = React.createContext<PanelContextValue | null>(null);

function usePanel(part: string): PanelContextValue {
  const ctx = React.useContext(PanelContext);
  if (!ctx)
    throw new Error(`${part} must be used inside <RecordPanelProvider>.`);
  return ctx;
}

const toggleSelector = (id: string) =>
  `[data-slot='record-panel-toggle'][data-panel='${id}']`;

/** Props for `RecordPanelProvider`. */
export interface RecordPanelProviderProps {
  /** Whether the panel is open where it docks (controlled): the person's remembered choice. @default undefined */
  open?: boolean;
  /** The docked panel's state on first render when `open` is not controlled. @default true */
  defaultOpen?: boolean;
  /** Called when a person shows or hides the docked panel; the app remembers it. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** The panel's name: its landmark, the sheet's title and the phone button's text. @default "Details" */
  label?: string;
  /** Whether ⌘. (Ctrl+. elsewhere) shows and hides the panel. @default true */
  shortcut?: boolean;
  /**
   * The record width, in rem, from which the panel docks beside the main column — per page type,
   * so the main column keeps its measure: `69` a reading column (task, meeting, chat), `74` a wider
   * record (customer, project, product, folder, file), `75` a document (page, row, skill), `95` a
   * document with its comment margin. Narrower, ▥ floats it over the page.
   * @default 69
   */
  dockAt?: RecordPanelDock;
  /**
   * Each section's fold, by its `value` (controlled): `true` open, `false` folded; a section not
   * in it takes its `defaultOpen`. The app keeps it per record type. @default undefined
   */
  sections?: Readonly<Record<string, boolean>>;
  /** Called when a person folds or opens a section. @default undefined */
  onSectionOpenChange?: (value: string, open: boolean) => void;
  /** The record page: its `RecordLayout` and the page bar's `RecordPanelToggle`. @default undefined */
  children?: React.ReactNode;
}

/**
 * `RecordPanelProvider` — the state one record page's panel, its ▥ toggle and its phone button
 * share. Wrap the page's `RecordLayout` and the page bar's `RecordPanelToggle` in it (the toggle
 * may portal into the bar: context follows it).
 *
 * @example
 * <RecordPanelProvider dockAt={74} open onOpenChange={setOpen} sections={folds} onSectionOpenChange={fold}>
 *   <PageBarSlot><RecordPanelToggle /></PageBarSlot>
 *   <RecordLayout>…<RecordPanel>…</RecordPanel></RecordLayout>
 * </RecordPanelProvider>
 */
export function RecordPanelProvider({
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  label = "Details",
  shortcut = true,
  dockAt = DOCK_REM,
  sections: sectionsProp,
  onSectionOpenChange,
  children,
}: RecordPanelProviderProps) {
  const phone = useMediaQuery(PHONE_QUERY);
  const [own, setOwn] = React.useState(defaultOpen);
  const open = openProp ?? own;
  const [docked, setDocked] = React.useState<boolean | null>(null);
  const [overlay, setOverlay] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);
  const [motion, setMotion] = React.useState(false);
  const clearMotion = React.useCallback(() => setMotion(false), []);
  const id = `record-panel${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const latest = React.useRef(onOpenChange);
  latest.current = onOpenChange;
  const [ownSections, setOwnSections] = React.useState<Record<string, boolean>>(
    {},
  );
  const sections = sectionsProp ?? ownSections;
  const latestFold = React.useRef(onSectionOpenChange);
  latestFold.current = onSectionOpenChange;
  const setSection = React.useCallback((value: string, next: boolean) => {
    setOwnSections((s) => ({ ...s, [value]: next }));
    latestFold.current?.(value, next);
  }, []);

  const mode: Mode = phone ? "sheet" : docked === false ? "overlay" : "docked";
  const shown = mode === "sheet" ? sheet : mode === "overlay" ? overlay : open;

  // A floating panel and a sheet belong to their mode: leaving it (the record grows wide enough to
  // dock, the window leaves a phone's width) drops them, so neither comes back on its own later.
  // Whether the last focus was in the panel: a panel CSS hides drops its focus to the body before
  // the mode change below runs.
  const focusedIn = React.useRef(false);
  React.useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      focusedIn.current = !!document
        .getElementById(id)
        ?.contains(event.target as Node);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [id]);

  // Focus inside a panel a mode change hides goes back to ▥ (or the page's Details button).
  React.useEffect(() => {
    const panel = document.getElementById(id);
    const active = document.activeElement;
    const inside =
      !!panel &&
      (panel.contains(active) ||
        ((active === document.body || active === null) && focusedIn.current));
    if (mode !== "overlay") setOverlay(false);
    if (mode !== "sheet") setSheet(false);
    if (!inside) return;
    requestAnimationFrame(() => {
      const still = document.getElementById(id);
      if (
        still &&
        still.contains(document.activeElement) &&
        still.checkVisibility()
      )
        return;
      document
        .querySelector<HTMLElement>(
          `${toggleSelector(id)}, [data-slot='record-panel-trigger'][data-panel='${id}']`,
        )
        ?.focus({ preventScroll: true });
    });
    // Only a change of mode: the panel's id is fixed for the provider's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /**
   * Hides the panel in its mode. `restoreFocus`: when focus was in the panel, it goes back to ▥
   * (a click elsewhere on the page keeps the focus it gave).
   */
  const dismiss = React.useCallback(
    (restoreFocus = true) => {
      const panel = document.getElementById(id);
      const active = document.activeElement;
      const inside =
        !!panel && (panel.contains(active) || active === document.body);
      if (mode === "sheet") setSheet(false);
      else if (mode === "overlay") setOverlay(false);
      else {
        setOwn(false);
        latest.current?.(false);
      }
      if (!restoreFocus || !inside || mode === "sheet") return;
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(toggleSelector(id))
          ?.focus({ preventScroll: true }),
      );
    },
    [id, mode],
  );

  const toggle = React.useCallback(() => {
    if (shown) {
      dismiss();
      return;
    }
    if (mode === "sheet") {
      setSheet(true);
      return;
    }
    setMotion(true);
    if (mode === "overlay") {
      setOverlay(true);
      return;
    }
    setOwn(true);
    latest.current?.(true);
  }, [mode, shown, dismiss]);

  // A reveal asked before the record is measured (a `#comment-` link on load) waits for its mode:
  // a docked open on a record that turns out to float would show nothing.
  const pendingReveal = React.useRef<string | null>(null);
  const reveal = React.useCallback(
    (value: string) => {
      if (mode !== "sheet" && docked === null) {
        pendingReveal.current = value;
        return;
      }
      setSection(value, true);
      if (mode === "sheet") setSheet(true);
      else if (mode === "overlay") {
        setMotion(true);
        setOverlay(true);
      } else if (!open) {
        setMotion(true);
        setOwn(true);
        latest.current?.(true);
      }
      // Once it is drawn (a sheet mounts its content as it opens), bring the section into view.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document
            .querySelector(
              `#${CSS.escape(id)} [data-slot='record-panel-section'][data-value='${CSS.escape(value)}']`,
            )
            ?.scrollIntoView({ block: "nearest" }),
        ),
      );
    },
    [id, mode, docked, open, setSection],
  );
  React.useEffect(() => {
    if ((docked === null && mode !== "sheet") || !pendingReveal.current) return;
    const value = pendingReveal.current;
    pendingReveal.current = null;
    reveal(value);
  }, [docked, mode, reveal]);

  // ⌘. (Ctrl+. elsewhere) shows and hides it, from anywhere on the page, text fields included:
  // the chord types nothing.
  const latestToggle = React.useRef(toggle);
  latestToggle.current = toggle;
  React.useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if (event.key !== "." || event.altKey || event.shiftKey) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      latestToggle.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const value = React.useMemo<PanelContextValue>(
    () => ({
      id,
      label,
      dockAt,
      open,
      docked,
      setDocked,
      overlay,
      sheet,
      setSheet,
      mode,
      shown,
      motion,
      clearMotion,
      toggle,
      dismiss,
      sections,
      setSection,
      reveal,
    }),
    [
      id,
      label,
      dockAt,
      open,
      docked,
      overlay,
      sheet,
      mode,
      shown,
      motion,
      clearMotion,
      toggle,
      dismiss,
      sections,
      setSection,
      reveal,
    ],
  );
  return (
    <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
  );
}

/** What `useRecordPanel` gives a page. */
export interface RecordPanelControls {
  /** Whether the panel shows now (docked, floating or as the phone's sheet). */
  shown: boolean;
  /** Shows or hides it, as ▥ does. */
  toggle: () => void;
  /** Shows it and opens `value`'s section, scrolled into view: a menu's "Versions", a link's target. */
  reveal: (value: string) => void;
}

/**
 * `useRecordPanel` — the panel's controls for the page around it, inside `RecordPanelProvider`.
 * Null outside one (a record shown in a peek has no side panel).
 *
 * @example
 * const panel = useRecordPanel();
 * <DropdownMenuItem onClick={() => panel?.reveal("versions")}>Versions</DropdownMenuItem>
 */
export function useRecordPanel(): RecordPanelControls | null {
  const ctx = React.useContext(PanelContext);
  return React.useMemo(
    () =>
      ctx ? { shown: ctx.shown, toggle: ctx.toggle, reveal: ctx.reveal } : null,
    [ctx],
  );
}

/* ------------------------------------------------------------------------------------------------
 * Toggle and phone button
 * ----------------------------------------------------------------------------------------------*/

/** Props for `RecordPanelToggle` — a ghost `Button`'s, less what it fixes. */
export type RecordPanelToggleProps = Omit<
  React.ComponentPropsWithRef<typeof Button>,
  "children" | "variant" | "size"
>;

/**
 * `RecordPanelToggle` — ▥, the page bar's last control: shows and hides the side panel (⌘.).
 * A 28px ghost icon button, filled while the panel shows. Hidden on a phone, where the
 * `RecordPanelTrigger` in the page opens the sheet.
 *
 * @example
 * <ShellTopBarPanel><RecordPanelToggle /></ShellTopBarPanel>
 */
export function RecordPanelToggle({
  className,
  onClick,
  ...props
}: RecordPanelToggleProps) {
  const ctx = usePanel("RecordPanelToggle");
  const { os } = usePlatform();
  const name = `${ctx.shown ? "Hide" : "Show"} ${ctx.label.toLowerCase()}`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={name}
            aria-expanded={ctx.shown}
            aria-controls={ctx.shown ? ctx.id : undefined}
            data-slot="record-panel-toggle"
            data-panel={ctx.id}
            className={cn("max-sm:hidden", className)}
            onClick={(event) => {
              onClick?.(event);
              if (!event.defaultPrevented) ctx.toggle();
            }}
            {...props}
          />
        }
      >
        <PanelRight />
      </TooltipTrigger>
      <TooltipContent>
        {name}
        <Kbd aria-hidden="true">{formatShortcut(["mod", "."], os)}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

/** Props for `RecordPanelTrigger` — an outline `Button`'s, less what it fixes. */
export type RecordPanelTriggerProps = Omit<
  React.ComponentPropsWithRef<typeof Button>,
  "variant" | "size"
>;

/**
 * `RecordPanelTrigger` — the phone's "Details" button: put it in the main column under the
 * record's header. It opens the panel's sections as a bottom sheet, and takes no room from 640px.
 *
 * @example
 * <RecordLayoutMain><PageHeader … /><RecordPanelTrigger />…</RecordLayoutMain>
 */
export function RecordPanelTrigger({
  className,
  children,
  onClick,
  ...props
}: RecordPanelTriggerProps) {
  const ctx = usePanel("RecordPanelTrigger");
  return (
    <Button
      variant="outline"
      size="sm"
      aria-haspopup="dialog"
      aria-expanded={ctx.mode === "sheet" && ctx.sheet}
      data-slot="record-panel-trigger"
      data-panel={ctx.id}
      className={cn("self-start sm:hidden", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) ctx.setSheet(true);
      }}
      {...props}
    >
      <PanelRight />
      {children ?? ctx.label}
    </Button>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Panel
 * ----------------------------------------------------------------------------------------------*/

/** Props for `RecordPanel`. */
/** Native `aside` props for `RecordPanel`, less its `id` (the provider's, which ▥ points at). */
export type RecordPanelProps = Omit<React.ComponentPropsWithRef<"aside">, "id">;

/**
 * `RecordPanel` — the side panel itself, after `RecordLayoutMain` inside `RecordLayout`: an
 * `aside` of stacked `RecordPanelSection`s on the page's own ground, behind a hairline. It docks from the
 * provider's `dockAt` of record width (69rem, 1104px, by default), floats over the page below that (Escape or a click on the page closes it, and focus
 * returns to ▥), and is a bottom sheet on a phone. Never on a list page: rows open in `Peek`.
 *
 * @example
 * <RecordPanel>
 *   <RecordPanelSection value="details" title="Details">…</RecordPanelSection>
 *   <RecordPanelSection value="files" title="Files" count={2}>…</RecordPanelSection>
 * </RecordPanel>
 */
export function RecordPanel({
  ref: refProp,
  className,
  children,
  onTransitionEnd,
  ...props
}: RecordPanelProps) {
  const ctx = usePanel("RecordPanel");
  const ref = React.useRef<HTMLElement | null>(null);
  const refs = React.useMemo(
    () => mergeRefs<HTMLElement>(ref, refProp as React.Ref<HTMLElement>),
    [refProp],
  );
  const titleId = `${ctx.id}-title`;
  const { setDocked, mode, overlay, dismiss, dockAt } = ctx;
  const sheet = mode === "sheet";

  // Whether this record docks: its layout's own width, as the panel's container query reads it.
  React.useEffect(() => {
    const layout = ref.current?.closest("[data-slot='record-layout']");
    if (!layout) return;
    const observer = new ResizeObserver(([entry]) => {
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setDocked((entry?.contentRect.width ?? 0) >= dockAt * rem);
    });
    observer.observe(layout);
    return () => {
      observer.disconnect();
      setDocked(null);
    };
  }, [setDocked, sheet, dockAt]);

  // Floating over the page: it takes focus when it opens, and Escape or a click on the page
  // closes it (never a click in a menu or dialog it opened).
  const latestDismiss = React.useRef(dismiss);
  latestDismiss.current = dismiss;
  React.useEffect(() => {
    if (mode !== "overlay" || !overlay) return;
    const panel = ref.current;
    panel?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing)
        return;
      if (document.querySelector(ESC_OWNERS)) return;
      if (isEditableTarget(event)) return;
      const active = document.activeElement;
      const layout = panel?.closest("[data-slot='record-layout']");
      if (active && active !== document.body && !layout?.contains(active))
        return;
      event.preventDefault();
      latestDismiss.current();
    };
    // A press anywhere outside it closes it: not in it, not on its ▥, and not in a popup (a menu,
    // a picker, a dialog) one of its rows opened. The press keeps the focus it gives.
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || panel?.contains(target)) return;
      if (target.closest("[data-slot='record-panel-toggle']")) return;
      if (target.closest(POPUPS)) return;
      latestDismiss.current(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [mode, overlay]);

  const body = children;

  if (mode === "sheet")
    return (
      <PeekSheet
        // The page's own ground, as where it docks (COL-26), not the popover lift of a menu.
        className="bg-background [--drawer-bleed-background:var(--background)]"
        open={ctx.sheet}
        onOpenChange={(next) => {
          if (!next) ctx.setSheet(false);
        }}
        labelledBy={titleId}
      >
        <div
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
          ref={refs as React.Ref<HTMLDivElement>}
          id={ctx.id}
          data-slot="record-panel"
          data-surface="sheet"
          className={cn("flex min-h-0 flex-1 flex-col", className)}
        >
          <div className="flex h-12 shrink-0 items-center gap-1 border-b ps-4 pe-2">
            <h2
              id={titleId}
              className="min-w-0 flex-1 truncate text-sm font-semibold"
            >
              {ctx.label}
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Close ${ctx.label.toLowerCase()}`}
              onClick={() => ctx.setSheet(false)}
            >
              <X />
            </Button>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {body}
          </div>
        </div>
      </PeekSheet>
    );

  // Drawn while it can show: open where it docks (the server draws it, so nothing moves on
  // hydration), or floating. A remembered open on a record too narrow to dock stays empty.
  const rendered = ctx.overlay || (ctx.open && ctx.docked !== false);
  return (
    <aside
      {...props}
      ref={refs}
      id={ctx.id}
      aria-label={ctx.label}
      tabIndex={-1}
      data-slot="record-panel"
      data-surface={mode === "overlay" ? "overlay" : "docked"}
      data-dock={ctx.dockAt}
      data-open={ctx.open ? "" : undefined}
      data-overlay={ctx.overlay ? "" : undefined}
      data-motion={ctx.motion && ctx.shown ? "enter" : undefined}
      onTransitionEnd={(event) => {
        onTransitionEnd?.(event);
        if (event.target === event.currentTarget) ctx.clearMotion();
      }}
      className={cn(
        "relative hidden min-h-0 w-80 shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-s bg-background text-foreground outline-none",
        // From `dockAt` of record width it docks: in the flow, as tall as the record, while open.
        // Narrower, ▥ floats it over the page, edge to edge under the bar, with a shadow.
        // A person's open: docked, it grows from nothing so the work beside it slides to stay
        // centred; floating, it slides in from the edge. Never on load; reduced motion: none.
        "data-[motion=enter]:transition-[width,translate,opacity] data-[motion=enter]:duration-panel data-[motion=enter]:ease-enter data-[motion=enter]:starting:opacity-0",
        DOCK_CLASSES[ctx.dockAt],
        className,
      )}
    >
      {rendered ? body : null}
    </aside>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Sections
 * ----------------------------------------------------------------------------------------------*/

/** Props for `RecordPanelSection`. */
export interface RecordPanelSectionProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title"
> {
  /** The section's key: its fold is remembered under it ("details", "files"). */
  value: string;
  /** Its title, e.g. "Files". */
  title: React.ReactNode;
  /** A muted count after the title (files, attendees, comments). @default undefined */
  count?: number;
  /** One action at the header's end, shown on hover or focus: a `RecordPanelAction`. @default undefined */
  action?: React.ReactNode;
  /** Whether it starts open when no fold is remembered for it. @default true */
  defaultOpen?: boolean;
}

/**
 * `RecordPanelSection` — one stacked section: a 40px header (title, muted count, then the fold
 * chevron — "Files 4 ⌄" — and an optional action on hover) over its rows, 16px in from the panel's edges, with a hairline
 * under it. Its rows are a `PropertyList variant="panel"` (key and value) or a `RecordPanelList`.
 *
 * @example
 * <RecordPanelSection value="files" title="Files" count={1} action={<RecordPanelAction label="Add file" onClick={add} />}>
 *   <RecordPanelList><RecordPanelItem detail="1.2 MB">Strada-90W.pdf</RecordPanelItem></RecordPanelList>
 * </RecordPanelSection>
 */
export function RecordPanelSection({
  value,
  title,
  count,
  action,
  defaultOpen = true,
  className,
  children,
  ...props
}: RecordPanelSectionProps) {
  const panel = React.useContext(PanelContext);
  const [own, setOwn] = React.useState(defaultOpen);
  const open = panel ? (panel.sections[value] ?? defaultOpen) : own;
  const headingId = React.useId();
  return (
    <Collapsible
      open={open}
      onOpenChange={(next) =>
        panel ? panel.setSection(value, next) : setOwn(next)
      }
      render={
        <section
          data-slot="record-panel-section"
          data-value={value}
          aria-labelledby={headingId}
          className={cn(
            "group/record-panel-section flex min-w-0 shrink-0 flex-col border-b",
            className,
          )}
          {...props}
        />
      }
    >
      <div
        data-slot="record-panel-section-header"
        className="flex h-10 min-w-0 items-center gap-1 px-2"
      >
        <h3 className="flex min-w-0 flex-1 text-sm font-semibold">
          <CollapsibleTrigger
            data-slot="record-panel-section-trigger"
            className="group/fold state-layer flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-item px-2 text-start outline-none"
          >
            <span id={headingId} className="min-w-0 truncate">
              {title}
            </span>
            {count !== undefined ? (
              <>
                {/* A real space, so the name reads "Files 2", not "Files2". */}{" "}
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {count}
                </span>
              </>
            ) : null}
            {/* After the name and count ("Files 4 ⌄"): pointing on while folded, down while open. */}
            <ChevronRight
              aria-hidden
              data-slot="record-panel-section-chevron"
              className="size-3 shrink-0 text-muted-foreground transition-transform duration-state group-data-panel-open/fold:rotate-90 rtl:rotate-180 rtl:group-data-panel-open/fold:rotate-90"
            />
          </CollapsibleTrigger>
        </h3>
        {action ? (
          <div
            data-slot="record-panel-section-action"
            className="flex shrink-0 items-center opacity-0 transition-opacity duration-state group-focus-within/record-panel-section:opacity-100 group-hover/record-panel-section:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100"
          >
            {action}
          </div>
        ) : null}
      </div>
      <CollapsibleContent
        data-slot="record-panel-section-content"
        className="flex min-w-0 flex-col gap-0.5 px-4 pb-3"
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Props for `RecordPanelAction`. */
export interface RecordPanelActionProps extends Omit<
  React.ComponentPropsWithRef<typeof Button>,
  "children" | "variant" | "size"
> {
  /** The tooltip and the accessible name, e.g. "Add file". */
  label: string;
  /** The icon. @default <Plus /> */
  icon?: React.ReactNode;
}

/**
 * `RecordPanelAction` — a section header's one action: a 24px ghost icon button with a tooltip,
 * shown while the section is hovered or focused (always on touch). Pass `render={<a href="…" />}`
 * with `nativeButton={false}` for a link.
 *
 * @example
 * <RecordPanelAction label="Add file" onClick={add} />
 */
export function RecordPanelAction({
  label,
  icon = <Plus />,
  ...props
}: RecordPanelActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            data-slot="record-panel-action"
            {...props}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Rows
 * ----------------------------------------------------------------------------------------------*/

/** Native list props for `RecordPanelList`. */
export type RecordPanelListProps = React.ComponentPropsWithRef<"ul">;

/**
 * `RecordPanelList` — a section's list of records (files, contacts, related tasks): rows whose
 * hover runs 8px past the text on both sides, with the item radius.
 *
 * @example
 * <RecordPanelList><RecordPanelItem detail="Blocks">#131 Product master export</RecordPanelItem></RecordPanelList>
 */
export function RecordPanelList({ className, ...props }: RecordPanelListProps) {
  return (
    <ul
      role="list"
      data-slot="record-panel-list"
      className={cn("-mx-2 flex min-w-0 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

/** Props for `RecordPanelItem`. */
export interface RecordPanelItemProps extends Omit<
  useRender.ComponentProps<"div">,
  "children"
> {
  /** A leading 16px icon or 20px avatar. @default undefined */
  icon?: React.ReactNode;
  /** The muted trailing detail: a size, a relation, a role, a time. @default undefined */
  detail?: React.ReactNode;
  /**
   * One trailing action (a 24px ghost icon button: ×, ⋯) shown on hover, on focus within the row
   * or while its menu is open, always on touch. It takes the detail's place rather than a column
   * of its own: at rest the row's end is the detail, on hover the action. It sits beside the row's
   * link or button, never inside it. @default undefined
   */
  action?: React.ReactNode;
  /** The row's text; it truncates. @default undefined */
  children?: React.ReactNode;
}

/**
 * `RecordPanelItem` — one row of a `RecordPanelList`: an optional icon, the text (truncating) and
 * a muted trailing detail, at least 30px tall. Pass `render` (a link or a button) for a row that
 * opens something: it then takes the hover and pressed layers.
 *
 * @example
 * <RecordPanelItem render={<a href="/files/1" />} icon={<FileText />} detail="420 KB">Rate contract.pdf</RecordPanelItem>
 * <RecordPanelItem icon={<PersonAvatar person={me} size="xs" />} detail="Created" action={<Button variant="ghost" size="icon-xs" aria-label="Stop watching"><X /></Button>}>You</RecordPanelItem>
 */
export function RecordPanelItem({
  icon,
  detail,
  action,
  className,
  children,
  render,
  ...props
}: RecordPanelItemProps) {
  const hasAction = action !== undefined && action !== null && action !== false;
  const row = useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "flex min-h-7.5 min-w-0 items-center gap-2 rounded-item px-2 text-sm text-foreground no-underline outline-none [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
          render !== undefined && "state-layer cursor-pointer",
          // While the action shows, the row's end makes room for it (the detail steps aside).
          hasAction && shownAction("pe-8"),
          className,
        ),
        children: (
          <>
            {icon}
            <span className="min-w-0 flex-1 truncate">{children}</span>
            {detail !== undefined && detail !== null ? (
              <span
                data-slot="record-panel-item-detail"
                className={cn(
                  "max-w-1/2 min-w-0 shrink-0 truncate text-xs text-muted-foreground tabular-nums",
                  hasAction && HIDDEN_DETAIL,
                )}
              >
                {detail}
              </span>
            ) : null}
          </>
        ),
      },
      props,
    ),
    state: { slot: "record-panel-item" },
  });
  return (
    <li
      data-slot="record-panel-list-item"
      className={cn("min-w-0", hasAction && "group/record-panel-item relative")}
    >
      {row}
      {hasAction ? (
        <span
          data-slot="record-panel-item-action"
          className={cn(
            "absolute inset-y-0 end-1 flex items-center opacity-0 transition-opacity duration-state",
            shownAction("opacity-100"),
          )}
        >
          {action}
        </span>
      ) : null}
    </li>
  );
}

/**
 * The states a row shows its action in: hovered, focus inside it, its menu open, or a touch
 * screen (no hover to reveal it). Tailwind needs each class written out whole.
 */
function shownAction(shown: "pe-8" | "opacity-100") {
  return shown === "pe-8"
    ? "group-hover/record-panel-item:pe-8 group-focus-within/record-panel-item:pe-8 group-has-aria-expanded/record-panel-item:pe-8 pointer-coarse:pe-8"
    : "group-hover/record-panel-item:opacity-100 group-focus-within/record-panel-item:opacity-100 group-has-aria-expanded/record-panel-item:opacity-100 pointer-coarse:opacity-100";
}

/** The detail gives the action its place, but stays on touch, where the action always shows. */
const HIDDEN_DETAIL =
  "pointer-fine:group-hover/record-panel-item:hidden pointer-fine:group-focus-within/record-panel-item:hidden pointer-fine:group-has-aria-expanded/record-panel-item:hidden";

/** Native paragraph props for `RecordPanelEmpty`. */
export type RecordPanelEmptyProps = React.ComponentPropsWithRef<"p">;

/** `RecordPanelEmpty` — a section's one-line empty state. @example <RecordPanelEmpty>No files yet</RecordPanelEmpty> */
export function RecordPanelEmpty({
  className,
  ...props
}: RecordPanelEmptyProps) {
  return (
    <p
      data-slot="record-panel-empty"
      className={cn("py-1.5 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
