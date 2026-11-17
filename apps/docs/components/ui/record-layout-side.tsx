// @vegastack record-layout@0.101.0 sha256-XMCFNu2JqfVJZP9DFBxhHisBMmYjGHyK3bTDAQs/xp4=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { PeekResizeHandle, PeekSheet } from "@/components/ui/peek";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { isEditableTarget } from "@/components/ui/use-platform";

/* ------------------------------------------------------------------------------------------------
 * RecordLayoutSide — a record page's reference panels (layout v2, D7–D8): a strip of icon buttons
 * on the page's right edge, each opening one panel beside the main column (Details, Transcript,
 * Files, Links, Versions, Comment threads, Activity, Ask). One panel at a time; it resizes; the app
 * controls which one is open (`panel`) so it can apply a per-type default and remember the choice.
 *
 * Where it sits follows the record layout's own width, not the window's: from 1200px it docks
 * beside the main column; below that it floats over it. On a phone (under 640px) the strip becomes
 * a row of buttons under the record's header (`RecordLayoutStripSlot` marks the spot) and each
 * opens its panel as the peek's bottom sheet. The open motion plays only for a person's click.
 * ----------------------------------------------------------------------------------------------*/

/** The narrowest the side panel can be, in px. */
export const RECORD_PANEL_MIN_WIDTH = 320;
/** The side panel's width when the app has none saved, in px. */
export const RECORD_PANEL_DEFAULT_WIDTH = 380;
/** The widest the side panel can be, as a share of the record layout. */
export const RECORD_PANEL_MAX_RATIO = 0.6;

const PHONE_QUERY = "(max-width: 639px)";
const ESC_OWNERS =
  "[role='menu'], [data-open] [role='listbox'], [role='listbox'][data-open], [data-slot='popover-content'], [role='alertdialog'], [role='dialog'][aria-modal='true']";

interface SideContextValue {
  panel: string | null;
  /** Opens a panel (or closes it with `null`); `person` marks a click, which plays the motion. */
  setPanel: (value: string | null, person: boolean) => void;
  /** The panel a person just opened: it alone plays the open motion, once. */
  motionFor: string | null;
  clearMotion: () => void;
  phone: boolean;
  /**
   * The panel open as a sheet on a phone. A sheet opens only on a tap and never changes the
   * remembered `panel`, so a type's default never pops a sheet over a phone's page on load.
   */
  sheet: string | null;
  setSheet: (value: string | null) => void;
  width: number;
  onWidthChange?: (width: number) => void;
  idPrefix: string;
}

const SideContext = React.createContext<SideContextValue | null>(null);

function useSide(part: string): SideContextValue {
  const ctx = React.useContext(SideContext);
  if (!ctx) throw new Error(`${part} must be used inside <RecordLayoutSide>.`);
  return ctx;
}

const panelId = (prefix: string, value: string) =>
  `${prefix}-panel-${value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

/** Props for `RecordLayoutSide`. */
export interface RecordLayoutSideProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "defaultValue"
> {
  /** The open panel's value, or `null` when none is open (controlled). @default undefined */
  panel?: string | null;
  /**
   * The panel open on first render when `panel` is not controlled — the record type's default
   * (products: Properties; meetings with a recording: Transcript; tasks: none).
   * @default null
   */
  defaultPanel?: string | null;
  /** Called when a person opens, switches or closes a panel; the app remembers it per type. @default undefined */
  onPanelChange?: (panel: string | null) => void;
  /** The panel's width in px — the app saves it and passes it back. @default 380 */
  panelWidth?: number;
  /** Called with the new width when a resize ends. Omit to hide the resize handle. @default undefined */
  onPanelWidthChange?: (width: number) => void;
}

/**
 * `RecordLayoutSide` — the reference panels of a record page. Put it after `RecordLayoutMain`
 * inside `RecordLayout`, with one `RecordLayoutStrip` (its `RecordLayoutStripItem`s) and one
 * `RecordLayoutPanel` per item. Never on a list page.
 *
 * @example
 * <RecordLayout>
 *   <RecordLayoutMain>…</RecordLayoutMain>
 *   <RecordLayoutSide panel={panel} onPanelChange={setPanel} panelWidth={w} onPanelWidthChange={setW}>
 *     <RecordLayoutPanel value="details" title="Details">…</RecordLayoutPanel>
 *     <RecordLayoutStrip>
 *       <RecordLayoutStripItem value="details" label="Details" icon={<Info />} />
 *     </RecordLayoutStrip>
 *   </RecordLayoutSide>
 * </RecordLayout>
 */
export function RecordLayoutSide({
  panel: panelProp,
  defaultPanel = null,
  onPanelChange,
  panelWidth,
  onPanelWidthChange,
  className,
  children,
  ...props
}: RecordLayoutSideProps) {
  const phone = useMediaQuery(PHONE_QUERY);
  const [own, setOwn] = React.useState<string | null>(defaultPanel);
  const panel = panelProp !== undefined ? panelProp : own;
  const [motionFor, setMotionFor] = React.useState<string | null>(null);
  const clearMotion = React.useCallback(() => setMotionFor(null), []);
  const [sheet, setSheet] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!phone) setSheet(null);
  }, [phone]);
  const idPrefix = `record-side${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const latest = React.useRef(onPanelChange);
  latest.current = onPanelChange;

  const setPanel = React.useCallback(
    (value: string | null, person: boolean) => {
      setMotionFor(person ? value : null);
      setOwn(value);
      latest.current?.(value);
    },
    [],
  );

  const ctx = React.useMemo<SideContextValue>(
    () => ({
      panel,
      setPanel,
      motionFor,
      clearMotion,
      phone,
      sheet,
      setSheet,
      width: panelWidth ?? RECORD_PANEL_DEFAULT_WIDTH,
      onWidthChange: onPanelWidthChange,
      idPrefix,
    }),
    [
      panel,
      setPanel,
      motionFor,
      clearMotion,
      phone,
      sheet,
      panelWidth,
      onPanelWidthChange,
      idPrefix,
    ],
  );

  return (
    <SideContext.Provider value={ctx}>
      <div
        data-slot="record-layout-side"
        data-panel={panel ?? undefined}
        className={cn(
          "flex shrink-0 self-stretch",
          // On a phone the strip row (when no slot takes it) runs full width above the main column.
          "max-sm:order-first max-sm:self-auto",
          className,
        )}
        {...props}
      >
        <div
          data-slot="record-layout-side-inner"
          className="sticky top-0 flex h-full max-h-dvh max-sm:static max-sm:h-auto max-sm:max-h-none max-sm:w-full"
        >
          {children}
        </div>
      </div>
    </SideContext.Provider>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Strip
 * ----------------------------------------------------------------------------------------------*/

/** Native container props for `RecordLayoutStripSlot`. */
export type RecordLayoutStripSlotProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordLayoutStripSlot` — marks where the phone's row of panel buttons goes: under the record's
 * header, inside `RecordLayoutMain`. Empty (and taking no room) on wider screens.
 *
 * @example
 * <RecordLayoutMain><RecordHeader … /><RecordLayoutStripSlot />…</RecordLayoutMain>
 */
export function RecordLayoutStripSlot({
  className,
  ...props
}: RecordLayoutStripSlotProps) {
  return (
    <div
      data-slot="record-layout-strip-slot"
      className={cn("empty:hidden", className)}
      {...props}
    />
  );
}

/** Native container props for `RecordLayoutStrip`. */
export type RecordLayoutStripProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordLayoutStrip` — the column of icon buttons on the page's right edge; on a phone, a row of
 * labelled buttons under the record's header.
 *
 * @example
 * <RecordLayoutStrip><RecordLayoutStripItem value="files" label="Files" icon={<Paperclip />} count={3} /></RecordLayoutStrip>
 */
export function RecordLayoutStrip({
  className,
  children,
  ...props
}: RecordLayoutStripProps) {
  const { phone } = useSide("RecordLayoutStrip");
  const anchorRef = React.useRef<HTMLSpanElement | null>(null);
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);

  // On a phone the row moves into the record's `RecordLayoutStripSlot`, if it has one.
  React.useEffect(() => {
    if (!phone) {
      setSlot(null);
      return;
    }
    const root = anchorRef.current?.closest("[data-slot='record-layout']");
    setSlot(
      root?.querySelector<HTMLElement>(
        "[data-slot='record-layout-strip-slot']",
      ) ?? null,
    );
  }, [phone]);

  const strip = (
    <div
      role="group"
      aria-label="Record panels"
      data-slot="record-layout-strip"
      data-orientation={phone ? "horizontal" : "vertical"}
      className={cn(
        phone
          ? "flex w-full min-w-0 items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none]"
          : "flex w-11 shrink-0 flex-col items-center gap-1 border-s py-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );

  return (
    <>
      <span ref={anchorRef} hidden data-slot="record-layout-strip-anchor" />
      {phone && slot ? createPortal(strip, slot) : strip}
    </>
  );
}

/** Props for `RecordLayoutStripItem`. */
export interface RecordLayoutStripItemProps extends Omit<
  React.ComponentPropsWithRef<typeof Button>,
  "value" | "children"
> {
  /** The panel it opens: a `RecordLayoutPanel`'s `value`. */
  value: string;
  /** The panel's name: the tooltip, the accessible name, and the phone button's text. */
  label: string;
  /** The panel's icon. */
  icon: React.ReactNode;
  /** A count shown with the icon (files, links, comment threads). Hidden at 0. @default undefined */
  count?: number;
}

/**
 * `RecordLayoutStripItem` — one panel's button: an icon with a tooltip (and a count) on the strip,
 * a labelled button on a phone. It opens its panel, and closes it when it is already open.
 *
 * @example
 * <RecordLayoutStripItem value="transcript" label="Transcript" icon={<FileText />} />
 */
export function RecordLayoutStripItem({
  value,
  label,
  icon,
  count,
  onClick,
  className,
  ...props
}: RecordLayoutStripItemProps) {
  const { panel, setPanel, phone, sheet, setSheet, idPrefix } = useSide(
    "RecordLayoutStripItem",
  );
  const active = (phone ? sheet : panel) === value;
  const name = count ? `${label}, ${count}` : label;
  const shared = {
    "aria-expanded": active,
    "aria-controls": active ? panelId(idPrefix, value) : undefined,
    "data-active": active ? "" : undefined,
    "data-value": value,
    "data-side": idPrefix,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event as never);
      if (event.defaultPrevented) return;
      if (phone) setSheet(active ? null : value);
      else setPanel(active ? null : value, true);
    },
  };

  if (phone)
    return (
      <Button
        variant="outline"
        size="sm"
        data-slot="record-layout-strip-item"
        className={cn("shrink-0", className)}
        {...shared}
        {...props}
      >
        {icon}
        <span>{label}</span>
        {count ? (
          <span className="text-muted-foreground tabular-nums">{count}</span>
        ) : null}
      </Button>
    );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={name}
            data-slot="record-layout-strip-item"
            className={cn("relative", className)}
            {...shared}
            {...props}
          />
        }
      >
        {icon}
        {count ? (
          <span
            aria-hidden
            data-slot="record-layout-strip-count"
            className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-chip bg-muted px-1 text-xs leading-none text-muted-foreground tabular-nums"
          >
            {count}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Panel
 * ----------------------------------------------------------------------------------------------*/

/** Props for `RecordLayoutPanel`. */
export interface RecordLayoutPanelProps extends Omit<
  React.ComponentPropsWithRef<"aside">,
  "title"
> {
  /** Which strip item opens it. */
  value: string;
  /** The panel's title in its header, e.g. "Transcript". */
  title: React.ReactNode;
  /** Controls after the title (a filter, a follow toggle), before the close button. @default undefined */
  actions?: React.ReactNode;
}

/**
 * `RecordLayoutPanel` — one reference panel: a header (title, actions, close) over its scrolling
 * body. It renders only while it is the open one: beside the main column from 1200px, over it
 * below that, and as a bottom sheet on a phone. Escape closes it while it floats over the page.
 *
 * @example
 * <RecordLayoutPanel value="details" title="Details"><PropertyList>…</PropertyList></RecordLayoutPanel>
 */
export function RecordLayoutPanel({
  value,
  title,
  actions,
  className,
  children,
  style,
  ref,
  onTransitionEnd,
  ...props
}: RecordLayoutPanelProps) {
  const {
    panel,
    setPanel,
    motionFor,
    clearMotion,
    phone,
    sheet,
    setSheet,
    width,
    onWidthChange,
    idPrefix,
  } = useSide("RecordLayoutPanel");
  const open = (phone ? sheet : panel) === value;
  const id = panelId(idPrefix, value);
  const titleId = `${id}-title`;
  const rootRef = React.useRef<HTMLElement | null>(null);
  const refs = React.useMemo(
    () => mergeRefs<HTMLElement>(rootRef, ref as React.Ref<HTMLElement>),
    [ref],
  );

  // A close from inside the panel hands focus back to its own strip button (this record's, not
  // another one on the page).
  const close = () => {
    const root = rootRef.current;
    const active = document.activeElement;
    const inside =
      !!root && (root.contains(active) || active === document.body);
    if (phone) setSheet(null);
    else setPanel(null, true);
    if (!inside) return;
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          `[data-slot='record-layout-strip-item'][data-side='${idPrefix}'][data-value='${CSS.escape(value)}']`,
        )
        ?.focus({ preventScroll: true }),
    );
  };
  const latestClose = React.useRef(close);
  latestClose.current = close;

  // Over the page (below 1200px) Escape closes it; docked beside the page it stays (R5). Only
  // this record answers: focus in its layout, or nowhere.
  React.useEffect(() => {
    if (!open || phone) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing)
        return;
      const root = rootRef.current;
      if (!root || getComputedStyle(root).position !== "absolute") return;
      const active = document.activeElement;
      const layout = root.closest("[data-slot='record-layout']");
      if (active && active !== document.body && !layout?.contains(active))
        return;
      if (document.querySelector(ESC_OWNERS)) return;
      if (isEditableTarget(event)) return;
      event.preventDefault();
      latestClose.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, phone]);

  const header = (
    <div
      data-slot="record-layout-panel-header"
      className="flex h-12 shrink-0 items-center gap-1 border-b ps-4 pe-2"
    >
      <h2
        id={titleId}
        className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground"
      >
        {title}
      </h2>
      {actions}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close panel"
        data-slot="record-layout-panel-close"
        onClick={close}
      >
        <X />
      </Button>
    </div>
  );
  const body = (
    <div
      data-slot="record-layout-panel-body"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
    >
      {children}
    </div>
  );

  if (phone)
    return (
      <PeekSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        labelledBy={titleId}
      >
        <div
          ref={refs as React.Ref<HTMLDivElement>}
          id={id}
          data-slot="record-layout-panel"
          data-surface="sheet"
          className={cn("flex min-h-0 flex-1 flex-col", className)}
          style={style}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          {header}
          {body}
        </div>
      </PeekSheet>
    );

  if (!open) return null;
  return (
    <aside
      ref={refs}
      id={id}
      aria-labelledby={titleId}
      data-slot="record-layout-panel"
      data-surface="side"
      data-motion={motionFor === value ? "enter" : undefined}
      onTransitionEnd={(event) => {
        onTransitionEnd?.(event);
        // The open has played: later width changes (a resize) and re-renders stay still.
        if (event.target === event.currentTarget) clearMotion();
      }}
      style={
        {
          "--record-panel-width": `${width}px`,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "relative flex h-full w-(--record-panel-width) min-w-0 shrink-0 flex-col border-s bg-background text-foreground",
        // Below 1200px of record width it floats over the main column, beside the strip.
        "@max-[75rem]/record-layout:absolute @max-[75rem]/record-layout:inset-y-0 @max-[75rem]/record-layout:end-full @max-[75rem]/record-layout:z-20 @max-[75rem]/record-layout:max-w-[calc(100cqw-2.75rem)] @max-[75rem]/record-layout:shadow-xl",
        // A person's open: docked, the panel grows from nothing so the content beside it slides to
        // stay centred; floating, it slides in from the strip.
        "data-[motion=enter]:transition-[width,translate,opacity] data-[motion=enter]:duration-panel data-[motion=enter]:ease-enter data-[motion=enter]:starting:opacity-0",
        "@min-[75rem]/record-layout:data-[motion=enter]:starting:w-0 @max-[75rem]/record-layout:data-[motion=enter]:starting:translate-x-4 rtl:@max-[75rem]/record-layout:data-[motion=enter]:starting:-translate-x-4",
        className,
      )}
      {...props}
    >
      {onWidthChange ? (
        <PeekResizeHandle
          width={width}
          onWidthChange={onWidthChange}
          min={RECORD_PANEL_MIN_WIDTH}
          maxRatio={RECORD_PANEL_MAX_RATIO}
          property="--record-panel-width"
          area={() => rootRef.current?.closest("[data-slot='record-layout']")}
          label={typeof title === "string" ? title.toLowerCase() : "panel"}
        />
      ) : null}
      {/* Clipped inside, so the panel can grow from nothing while the handle straddles its edge. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {header}
        {body}
      </div>
    </aside>
  );
}
