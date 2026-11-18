// @vegastack record-layout@0.114.0 sha256-16D3kguouBqRLjw1nxkZ45N0+TqFZM0EcYV4Yud/n5A=

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
 *   ≥ 68rem (1088)   docks beside the main column                     the person's remembered choice
 *   40–68rem         opens over the page, edge to edge, on ▥ (Esc)     closed
 *   < 640px window   a bottom sheet the "Details" button opens         closed
 *
 * `RecordPanelProvider` holds the state the toggle, the phone button and the panel share; the app
 * owns the remembered choice (`open`, `onOpenChange`) and each section's fold (`sections`,
 * `onSectionOpenChange`), so it can keep them per person and per record type; `useRecordPanel`
 * lets the page reveal a section from elsewhere (a menu's "Versions"). A docked panel that
 * is open on load is drawn by the server: nothing moves when the page hydrates.
 * ----------------------------------------------------------------------------------------------*/

const PHONE_QUERY = "(max-width: 639px)";
/** The record width, in rem, from which the panel docks beside the page. */
/**
 * The record width, in rem, from which the panel docks: the 720px reading column, its gutters and the
 * 320px panel side by side (a 1440px window with the column open docks; a 1024px tablet floats).
 */
const DOCK_REM = 68;
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
 * <RecordPanelProvider open={open} onOpenChange={remember} sections={folds} onSectionOpenChange={fold}>
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
 * `aside` of stacked `RecordPanelSection`s on the `panel` surface. It docks from 1088px (68rem) of record
 * width, floats over the page below that (Escape or a click on the page closes it, and focus
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
  const { setDocked, mode, overlay, dismiss } = ctx;
  const sheet = mode === "sheet";

  // Whether this record docks: its layout's own width, as the panel's container query reads it.
  React.useEffect(() => {
    const layout = ref.current?.closest("[data-slot='record-layout']");
    if (!layout) return;
    const observer = new ResizeObserver(([entry]) => {
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setDocked((entry?.contentRect.width ?? 0) >= DOCK_REM * rem);
    });
    observer.observe(layout);
    return () => {
      observer.disconnect();
      setDocked(null);
    };
  }, [setDocked, sheet]);

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
        // A side surface, as where it docks (LAY-26: the page is the extreme, side surfaces one
        // notch in), not the popover lift of a menu.
        className="bg-panel [--drawer-bleed-background:var(--panel)]"
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
      data-open={ctx.open ? "" : undefined}
      data-overlay={ctx.overlay ? "" : undefined}
      data-motion={ctx.motion && ctx.shown ? "enter" : undefined}
      onTransitionEnd={(event) => {
        onTransitionEnd?.(event);
        if (event.target === event.currentTarget) ctx.clearMotion();
      }}
      className={cn(
        "hidden min-h-0 w-80 shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-s bg-panel text-foreground outline-none",
        // From 68rem (1088px) of record width it docks: in the flow, as tall as the record, while open.
        "@min-[68rem]/record-layout:data-open:flex",
        // Narrower, ▥ floats it over the page, edge to edge under the bar, with a shadow.
        "@max-[68rem]/record-layout:absolute @max-[68rem]/record-layout:inset-y-0 @max-[68rem]/record-layout:end-0 @max-[68rem]/record-layout:z-20 @max-[68rem]/record-layout:max-w-full @max-[68rem]/record-layout:shadow-xl @max-[68rem]/record-layout:data-overlay:flex",
        // A person's open: docked, it grows from nothing so the work beside it slides to stay
        // centred; floating, it slides in from the edge. Never on load; reduced motion: none.
        "data-[motion=enter]:transition-[width,translate,opacity] data-[motion=enter]:duration-panel data-[motion=enter]:ease-enter data-[motion=enter]:starting:opacity-0",
        "@min-[68rem]/record-layout:data-[motion=enter]:starting:w-0 @max-[68rem]/record-layout:data-[motion=enter]:starting:translate-x-4 rtl:@max-[68rem]/record-layout:data-[motion=enter]:starting:-translate-x-4",
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
 * `RecordPanelSection` — one stacked section: a 40px header (fold chevron, title, muted count and
 * an optional action on hover) over its rows, 16px in from the panel's edges, with a hairline
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
            <ChevronRight
              aria-hidden
              className="size-3 shrink-0 text-muted-foreground transition-transform duration-state group-data-panel-open/fold:rotate-90 rtl:rotate-180 rtl:group-data-panel-open/fold:rotate-90"
            />
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
          </CollapsibleTrigger>
        </h3>
        {action ? (
          <div
            data-slot="record-panel-section-action"
            className="flex shrink-0 items-center opacity-0 transition-opacity duration-state group-focus-within/record-panel-section:opacity-100 group-hover/record-panel-section:opacity-100 pointer-coarse:opacity-100"
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
 */
export function RecordPanelItem({
  icon,
  detail,
  className,
  children,
  render,
  ...props
}: RecordPanelItemProps) {
  const row = useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "flex min-h-7.5 min-w-0 items-center gap-2 rounded-item px-2 text-sm text-foreground no-underline outline-none [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
          render !== undefined && "state-layer cursor-pointer",
          className,
        ),
        children: (
          <>
            {icon}
            <span className="min-w-0 flex-1 truncate">{children}</span>
            {detail !== undefined && detail !== null ? (
              <span
                data-slot="record-panel-item-detail"
                className="max-w-1/2 min-w-0 shrink-0 truncate text-xs text-muted-foreground tabular-nums"
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
    <li data-slot="record-panel-list-item" className="min-w-0">
      {row}
    </li>
  );
}

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
