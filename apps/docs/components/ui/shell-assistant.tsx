// @vegastack shell-assistant@0.112.0 sha256-6pbDk6jHRn6KYz9PmCkcHTlEbDboOAYdmAisEHZwUNo=

"use client";

import * as React from "react";
import {
  Maximize2Icon,
  Minimize2Icon,
  PanelRightIcon,
  PictureInPicture2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ToolGroup, ToolGroupItem } from "@/components/ui/tool-group";

const AssistantCardTitle = React.createContext<{ titleId: string } | null>(
  null,
);

/** Props for `AssistantCard`, the floating chat surface. */
export interface AssistantCardProps extends React.ComponentProps<"section"> {
  /**
   * Whether the card is open. Nothing renders before it first opens; after that it stays mounted
   * while closed (inert and hidden), so a draft survives.
   */
  open: boolean;
  /** Called with `false` when the person presses Escape inside the card. */
  onOpenChange: (open: boolean) => void;
  /**
   * What takes focus when the card opens.
   * @default the first text field, else the card
   */
  initialFocus?: React.RefObject<HTMLElement | null>;
  /**
   * What takes focus back when the card closes.
   * @default whatever had focus before it opened
   */
  finalFocus?: React.RefObject<HTMLElement | null>;
  /**
   * Where the chat sits (LAY-26). `float`: the compact card over the page's corner. `dock`: a
   * second card beside the page, the split view (render the card as `Shell`'s `assistant`; under
   * 40rem of shell it floats). `popout`: a window of its own over the app that the person drags by
   * its header and resizes from its corner. The same element moves between them, so the chat in
   * it never remounts.
   * @default 'float'
   */
  place?: AssistantPlace;
}

/** Where the assistant's chat sits: floating, docked beside the page, or popped out. */
export type AssistantPlace = "float" | "dock" | "popout";

/** Focuses `node` if it can take focus now; whether it did. */
function tryFocus(node: HTMLElement | null | undefined): boolean {
  if (!node?.isConnected) return false;
  node.focus({ preventScroll: true });
  return document.activeElement === node;
}

/** Focus into the card: `first`, else its first visible text field, else the card itself. */
function focusInto(card: HTMLElement, first?: HTMLElement | null) {
  if (tryFocus(first)) return;
  const fields = card.querySelectorAll<HTMLElement>(
    'textarea:not(:disabled), input:not(:disabled):is(:not([type]), [type=text], [type=search], [type=email], [type=url], [type=tel], [type=password]), [contenteditable="true"], [contenteditable=""]',
  );
  for (const field of fields) {
    if (field.checkVisibility?.() === false) continue;
    if (tryFocus(field)) return;
  }
  card.focus({ preventScroll: true });
}

/** Keeps a popped-out card's top-left corner inside the window. */
function clampToWindow(
  x: number,
  y: number,
  card: HTMLElement,
): { x: number; y: number } {
  const maxX = Math.max(0, window.innerWidth - card.offsetWidth);
  const maxY = Math.max(0, window.innerHeight - card.offsetHeight);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

/**
 * The compact assistant chat (about 380 × 520), anchored to the page area's bottom-end corner and
 * growing out of it (L21). Compose `AssistantCardHeader`, an optional `AssistantCardContext`,
 * `AssistantCardBody` and `AssistantCardComposer`. Non-modal: the page stays usable behind it,
 * Escape closes it and focus returns to what opened it (the global bar's Ask, or ⌘J's origin). The parts also compose inside a phone's bottom
 * sheet, without this surface.
 *
 * @example
 * ```tsx
 * <AssistantCard id="assistant-card" open={open} onOpenChange={setOpen}>
 *   <AssistantCardHeader title="William" onClose={() => setOpen(false)}
 *     onOpenFull={openFull} />
 *   <AssistantCardContext onRemove={clearContext}>#3 Review Q3 pricing</AssistantCardContext>
 *   <AssistantCardBody>{messages}</AssistantCardBody>
 *   <AssistantCardComposer><ChatComposer … /></AssistantCardComposer>
 * </AssistantCard>
 * ```
 */
function AssistantCard({
  open,
  onOpenChange,
  initialFocus,
  finalFocus,
  place = "float",
  className,
  onKeyDown,
  onPointerDown,
  style,
  children,
  ref,
  id,
  ...props
}: AssistantCardProps) {
  // A popped-out card's top-left corner; null until it is first placed (then it opens centred).
  const [at, setAt] = React.useState<{ x: number; y: number } | null>(null);
  const titleId = React.useId();
  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const cardRef = React.useRef<HTMLElement | null>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);
  const lastOutside = React.useRef<HTMLElement | null>(null);
  const setRef = React.useMemo(
    () => mergeRefs<HTMLElement>(cardRef, ref),
    [ref],
  );

  // What had focus outside the card most recently: the opener, recorded before anything inside
  // the card (an autofocusing composer) can take focus on the first open.
  React.useEffect(() => {
    const note = (node: EventTarget | null) => {
      if (
        node instanceof HTMLElement &&
        node !== document.body &&
        // Not the card's own fields: an autofocusing one fires before the card's ref is set.
        !node.closest('[data-slot="assistant-card"]')
      )
        lastOutside.current = node;
    };
    note(document.activeElement);
    const onFocusIn = (event: FocusEvent) => note(event.target);
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);
  // Nothing renders until the card first opens, so the chat it holds costs nothing until asked
  // for (L22); once opened it stays mounted while closed, so a draft survives.
  const [opened, setOpened] = React.useState(open);
  if (open && !opened) setOpened(true);
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    const card = cardRef.current;
    if (!card || wasOpen.current === open) return;
    wasOpen.current = open;
    const opener = () =>
      id
        ? document.querySelector<HTMLElement>(
            `[aria-controls~="${CSS.escape(id)}"]`,
          )
        : null;
    if (open) {
      returnTo.current = lastOutside.current;
      // Something inside already took focus (an autofocusing composer): leave it there.
      if (card.contains(document.activeElement)) return;
      focusInto(card, initialFocus?.current);
      return;
    }
    const active = document.activeElement;
    if (active && active !== document.body && !card.contains(active)) return;
    // The first of these that can still take focus: a removed opener falls through.
    if (!tryFocus(finalFocus?.current) && !tryFocus(returnTo.current))
      tryFocus(opener());
  }, [open, initialFocus, finalFocus, id]);

  // Moving the card to another place removes the button that moved it: focus stays in the card
  // (its first text field, else the card) rather than falling to the page.
  const lastPlace = React.useRef(place);
  React.useEffect(() => {
    if (lastPlace.current === place) return;
    lastPlace.current = place;
    const card = cardRef.current;
    if (place !== "popout") {
      setAt(null);
      // A native resize while popped out leaves its size inline: the other places size themselves.
      card?.style.removeProperty("width");
      card?.style.removeProperty("height");
    }
    const active = document.activeElement;
    if (!card || !open || (active && active !== document.body)) return;
    focusInto(card);
  }, [place, open]);

  // A popped-out card stays inside the window as the window resizes.
  React.useEffect(() => {
    if (place !== "popout") return;
    const onResize = () =>
      setAt((prev) =>
        prev && cardRef.current
          ? clampToWindow(prev.x, prev.y, cardRef.current)
          : prev,
      );
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [place]);

  // The card's own keys and drag listen on the window, after the page's handlers, for events from
  // inside the card: what it holds may be portalled in from another React tree (a chat moved
  // between places), whose events never reach this element's React handlers. A handler inside
  // that already took the key (a menu's Escape, a composer's "stop") wins: `defaultPrevented`.
  const placeRef = React.useRef(place);
  placeRef.current = place;
  React.useEffect(() => {
    const inside = (event: Event): HTMLElement | null => {
      const card = cardRef.current;
      return card && card.contains(event.target as Node) ? card : null;
    };
    const onKey = (event: KeyboardEvent) => {
      const card = inside(event);
      if (!card || event.defaultPrevented) return;
      // Popped out, Alt + an arrow key moves the card (Shift: further) from anywhere in it but a
      // text field, where it moves the caret by a word: the keyboard's way to place it (2.1.1).
      if (
        placeRef.current === "popout" &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.startsWith("Arrow") &&
        !(event.target as Element).closest?.(
          'input, textarea, [contenteditable="true"], [contenteditable=""]',
        )
      ) {
        event.preventDefault();
        const box = card.getBoundingClientRect();
        const step = event.shiftKey ? 64 : 16;
        const dx =
          event.key === "ArrowLeft"
            ? -step
            : event.key === "ArrowRight"
              ? step
              : 0;
        const dy =
          event.key === "ArrowUp"
            ? -step
            : event.key === "ArrowDown"
              ? step
              : 0;
        setAt(clampToWindow(box.left + dx, box.top + dy, card));
        return;
      }
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChangeRef.current(false);
    };
    /** Drags a popped-out card by its header (not by the header's buttons). */
    const onDown = (event: PointerEvent) => {
      const card = inside(event);
      const target = event.target as Element;
      if (
        !card ||
        placeRef.current !== "popout" ||
        event.defaultPrevented ||
        event.button !== 0 ||
        !target.closest?.('[data-slot="assistant-card-header"]') ||
        target.closest?.(
          'button, a, input, textarea, select, [role="button"], [role="menuitem"]',
        )
      )
        return;
      event.preventDefault();
      const box = card.getBoundingClientRect();
      const dx = event.clientX - box.left;
      const dy = event.clientY - box.top;
      const move = (e: PointerEvent) =>
        setAt(clampToWindow(e.clientX - dx, e.clientY - dy, card));
      const end = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  if (!opened) return null;
  const docked = place === "dock";
  const popped = place === "popout";
  return (
    <AssistantCardTitle.Provider value={{ titleId }}>
      <section
        ref={setRef}
        id={id}
        // Docked, it is a region of the frame beside the page; floating or popped out, a
        // non-modal dialog over it.
        role={docked ? "region" : "dialog"}
        aria-modal={docked ? undefined : false}
        aria-labelledby={titleId}
        tabIndex={-1}
        data-slot="assistant-card"
        data-place={place}
        aria-keyshortcuts={
          popped
            ? "Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
            : undefined
        }
        data-open={open ? "" : undefined}
        inert={!open}
        style={
          popped && at
            ? { ...style, left: at.x, top: at.y, right: "auto", bottom: "auto" }
            : style
        }
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        // z-30, the side peek's layer: it comes after the page (and a peek in it) in the frame, so
        // a card opened while a record is peeked sits on top of it, under the column and scrims.
        className={cn(
          "absolute end-4 bottom-4 z-30 flex h-130 print:hidden max-h-[calc(100%-2rem)] w-95 max-w-[calc(100%-2rem)] origin-bottom-right flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-overlay border border-border bg-popover text-popover-foreground shadow-lg outline-none rtl:origin-bottom-left",
          "transition-[scale,translate,opacity,visibility]",
          open
            ? "visible translate-y-0 scale-100 opacity-100 duration-state ease-enter starting:translate-y-2 starting:scale-95 starting:opacity-0"
            : "invisible translate-y-2 scale-95 opacity-0 duration-state-exit ease-exit",
          className,
          // Popped out: a window of its own over the app (z-40, the slide-over's layer, under
          // menus and dialogs), centred until the person drags it, resizable from its corner.
          popped &&
            "fixed start-[max(0.5rem,calc(50%-13.125rem))] top-[max(0.5rem,calc(50%-17.5rem))] end-auto bottom-auto z-40 h-140 max-h-[calc(100dvh-1rem)] min-h-[min(20rem,calc(100dvh-1rem))] w-105 max-w-[calc(100vw-1rem)] min-w-[min(20rem,calc(100vw-1rem))] resize overflow-hidden shadow-2xl starting:scale-100 [&_[data-slot=assistant-card-header]]:cursor-grab [&_[data-slot=assistant-card-header]]:select-none",
          // Docked: the shell places it as a card beside the page (from 40rem); it only fades in.
          docked && "starting:translate-y-0 starting:scale-100",
        )}
        {...props}
      >
        {children}
      </section>
    </AssistantCardTitle.Provider>
  );
}

/** Props for `AssistantCardHeader`. */
export interface AssistantCardHeaderProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  /** The assistant's name; it labels the card. */
  title: React.ReactNode;
  /**
   * The assistant's mark before the name.
   * @default <SparklesIcon />
   */
  icon?: React.ReactNode;
  /**
   * Opens the chat as a full page. Omit to hide the action (no Agents module).
   * @default undefined
   */
  onOpenFull?: () => void;
  /** Closes the card. */
  onClose: () => void;
  /** @default "Open full chat" */
  openFullLabel?: string;
  /** @default "Close" */
  closeLabel?: string;
  /**
   * The chat's own tools — New chat, Chats — as `ToolGroupItem`s, placed before Open full chat
   * and Close.
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * Where the card sits now. With `onPlaceChange`, the header offers the other places (LAY-26):
   * floating, "Dock beside the page" and "Pop out"; docked, "Float as a card" and "Pop out";
   * popped out, "Dock beside the page" and "Back into the app" (floating).
   * @default undefined
   */
  place?: AssistantPlace;
  /** Moves the card to another place. Omit to offer no places. @default undefined */
  onPlaceChange?: (place: AssistantPlace) => void;
  /**
   * Which places to offer (a phone, or a host without a popped-out window, offers fewer).
   * @default ["float", "dock", "popout"]
   */
  places?: readonly AssistantPlace[];
}

const PLACE_TOOL: Record<
  AssistantPlace,
  { label: (from: AssistantPlace) => string; icon: React.ReactNode }
> = {
  dock: { label: () => "Dock beside the page", icon: <PanelRightIcon /> },
  float: {
    label: (from) =>
      from === "popout" ? "Back into the app" : "Float as a card",
    icon: <Minimize2Icon />,
  },
  popout: { label: () => "Pop out", icon: <PictureInPicture2Icon /> },
};

/**
 * The card's 48px header: the assistant's mark and name, then the chat's tools, the other places
 * the card can move to, Open full chat and Close as one tool group.
 *
 * @example
 * ```tsx
 * <AssistantCardHeader
 *   title="William"
 *   actions={<ToolGroupItem label="New chat" onClick={newChat}><SquarePenIcon /></ToolGroupItem>}
 *   onClose={close}
 *   onOpenFull={toFull}
 * />
 * ```
 */
function AssistantCardHeader({
  title,
  icon,
  onOpenFull,
  onClose,
  openFullLabel = "Open full chat",
  closeLabel = "Close",
  actions,
  place,
  onPlaceChange,
  places = ["float", "dock", "popout"],
  className,
  ...props
}: AssistantCardHeaderProps) {
  const ctx = React.useContext(AssistantCardTitle);
  // The places it isn't in, in one order: dock, then pop out, then back to floating.
  const moves =
    place && onPlaceChange
      ? (["dock", "popout", "float"] as const).filter(
          (p) => p !== place && places.includes(p),
        )
      : [];
  return (
    <div
      data-slot="assistant-card-header"
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 ps-4 pe-2",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex shrink-0 text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
      >
        {icon ?? <SparklesIcon />}
      </span>
      <h2
        id={ctx?.titleId}
        className="min-w-0 flex-1 truncate text-sm font-semibold"
      >
        {title}
      </h2>
      <ToolGroup aria-label="Chat actions">
        {actions}
        {moves.map((p) => (
          <ToolGroupItem
            key={p}
            label={PLACE_TOOL[p].label(place!)}
            onClick={() => onPlaceChange?.(p)}
          >
            {PLACE_TOOL[p].icon}
          </ToolGroupItem>
        ))}
        {onOpenFull ? (
          <ToolGroupItem label={openFullLabel} onClick={onOpenFull}>
            <Maximize2Icon />
          </ToolGroupItem>
        ) : null}
        <ToolGroupItem label={closeLabel} onClick={onClose}>
          <XIcon />
        </ToolGroupItem>
      </ToolGroup>
    </div>
  );
}

/** Props for `AssistantCardContext`, the removable "Talking about" chip. */
export interface AssistantCardContextProps extends React.ComponentProps<"div"> {
  /**
   * What the chat is about, before the record's name.
   * @default "Talking about"
   */
  prefix?: string;
  /**
   * The record's icon.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Drops the context, so the chat is about nothing in particular. Omit for a fixed context.
   * @default undefined
   */
  onRemove?: () => void;
  /** @default "Remove context" */
  removeLabel?: string;
}

/**
 * What the assistant is looking at — "Talking about #3 Review Q3 pricing" — as a removable chip
 * under the header.
 *
 * @example
 * ```tsx
 * <AssistantCardContext onRemove={clearContext}>#3 Review Q3 pricing</AssistantCardContext>
 * ```
 */
function AssistantCardContext({
  prefix = "Talking about",
  icon,
  onRemove,
  removeLabel = "Remove context",
  className,
  children,
  ...props
}: AssistantCardContextProps) {
  return (
    <div
      data-slot="assistant-card-context"
      className={cn("flex min-w-0 shrink-0 px-4 pb-1", className)}
      {...props}
    >
      <Chip
        onRemove={onRemove}
        removeLabel={removeLabel}
        className="max-w-full min-w-0"
      >
        {icon}
        <span className="min-w-0 truncate">
          <span className="text-muted-foreground">{prefix} </span>
          {children}
        </span>
      </Chip>
    </div>
  );
}

/**
 * The conversation. It takes the card's remaining height and scrolls on its own.
 *
 * @example
 * ```tsx
 * <AssistantCardBody>{messages}</AssistantCardBody>
 * ```
 */
function AssistantCardBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="assistant-card-body"
      className={cn(
        // Below its minimum the card scrolls as a whole, so a short page area never clips the composer.
        "flex min-h-24 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-2 text-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The slot for the host's composer at the card's foot.
 *
 * @example
 * ```tsx
 * <AssistantCardComposer><ChatComposer … /></AssistantCardComposer>
 * ```
 */
function AssistantCardComposer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="assistant-card-composer"
      className={cn("shrink-0 px-2.5 pt-2 pb-2.5", className)}
      {...props}
    />
  );
}

export {
  AssistantCard,
  AssistantCardHeader,
  AssistantCardContext,
  AssistantCardBody,
  AssistantCardComposer,
};
