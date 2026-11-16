// @vegastack shell-assistant@0.94.0 sha256-19zT6XZ9AS0F+xtt+xzkA8/yGY+Pb/rFcEmDEFyxNDs=

"use client";

import * as React from "react";
import {
  Maximize2Icon,
  PanelRightIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ToolGroup, ToolGroupItem } from "@/components/ui/tool-group";

/** How far (px) a scroll must travel before the pill reacts, so a trackpad's jitter never flickers it. */
const TUCK_SLOP = 2;
/** Near the top of the page the pill always shows. */
const TUCK_FLOOR = 60;

/** Props for `AssistantPill`: a `Button` minus its variant, size and children. */
export interface AssistantPillProps extends Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size" | "children"
> {
  /** The assistant's name in this workspace; the pill reads "Ask {name}". */
  name: string;
  /**
   * The assistant's mark.
   * @default <SparklesIcon />
   */
  icon?: React.ReactNode;
  /**
   * The shortcut hint after the name, shown on a fine pointer only. Pass `null` for none, and set
   * `aria-keyshortcuts` to match.
   * @default "⌘J"
   */
  shortcut?: React.ReactNode;
  /**
   * The element whose scrolling tucks the pill away (scrolling down) and brings it back (scrolling
   * up).
   * @default window
   */
  scrollTarget?: React.RefObject<HTMLElement | null>;
  /**
   * The card is open: the pill steps aside for it and reports `aria-expanded`.
   * @default false
   */
  expanded?: boolean;
}

/**
 * The floating "Ask {name}" pill at the bottom-end corner of the page area (L21). It tucks away
 * while the page scrolls down and returns on scroll up, on hover of its corner and on keyboard
 * focus. Place it in the page area's positioned container (`relative`), never over a side panel —
 * or in the shell's floating area (`data-slot="shell-floating-area"`), where it stacks in flow;
 * opening the card is the host's (`onClick`, and ⌘J). Not for phones, where the tab bar holds
 * the bottom edge.
 *
 * @example
 * ```tsx
 * <AssistantPill
 *   name="William"
 *   expanded={open}
 *   aria-controls="assistant-card"
 *   aria-keyshortcuts="Meta+J"
 *   scrollTarget={mainRef}
 *   onClick={() => setOpen(true)}
 * />
 * ```
 */
function AssistantPill({
  name,
  icon,
  shortcut = "⌘J",
  scrollTarget,
  expanded = false,
  className,
  onFocus,
  onBlur,
  ...props
}: AssistantPillProps) {
  const [tucked, setTucked] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    // Scroll events don't bubble, but they reach the document in its capture phase, so the pill
    // follows whichever element `scrollTarget` points at now, even one attached after mount.
    const readFrom = (node: EventTarget | null) => {
      if (scrollTarget) {
        return node === scrollTarget.current && node instanceof HTMLElement
          ? node.scrollTop
          : null;
      }
      return node === document ? window.scrollY : null;
    };
    const start = scrollTarget
      ? (scrollTarget.current?.scrollTop ?? 0)
      : window.scrollY;
    let anchor = start;
    let last = start;
    let seen: EventTarget | null = scrollTarget
      ? (scrollTarget.current ?? null)
      : document;
    const onScroll = (event: Event) => {
      const y = readFrom(event.target);
      if (y === null) return;
      // A scroller attached (or swapped) after mount starts its own history.
      if (event.target !== seen) {
        seen = event.target;
        anchor = last = y;
        if (y <= TUCK_FLOOR) setTucked(false);
        return;
      }
      // Measure from where the current run of movement began, so slow scrolling adds up.
      if (Math.sign(y - last) !== Math.sign(last - anchor) && last !== anchor)
        anchor = last;
      last = y;
      if (y <= TUCK_FLOOR) {
        setTucked(false);
        anchor = y;
      } else if (y - anchor > TUCK_SLOP) {
        setTucked(true);
        anchor = y;
      } else if (anchor - y > TUCK_SLOP) {
        setTucked(false);
        anchor = y;
      }
    };
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () =>
      document.removeEventListener("scroll", onScroll, { capture: true });
  }, [scrollTarget]);

  // A pill that holds keyboard focus never hides under it.
  const shown = (!tucked || focused) && !expanded;
  return (
    <div
      data-slot="assistant-pill-zone"
      data-tucked={tucked ? "" : undefined}
      // A tucked pill is out of reach, so its corner brings it back on hover.
      onPointerEnter={() => setTucked(false)}
      className={cn(
        // Alone it holds the corner; inside the shell's floating area it is one stacked item.
        "absolute end-4 bottom-4 z-10 flex in-data-[slot=shell-floating-area]:static print:hidden",
        expanded && "pointer-events-none",
        className,
      )}
    >
      <Button
        variant="outline"
        size="lg"
        data-slot="assistant-pill"
        data-active={shown}
        aria-expanded={expanded}
        inert={expanded}
        onFocus={(event) => {
          setFocused(true);
          setTucked(false);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className="gap-2 ps-3 pe-3.5 shadow-md data-[active=false]:translate-y-2.5 data-[active=false]:motion-dock-out data-[active=true]:translate-y-0 data-[active=true]:motion-dock-in"
        {...props}
      >
        <span
          aria-hidden
          className="flex shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          {icon ?? <SparklesIcon />}
        </span>
        <span>Ask {name}</span>
        {shortcut != null ? (
          <span
            aria-hidden
            data-slot="assistant-pill-shortcut"
            className="text-xs font-normal text-muted-foreground pointer-coarse:hidden"
          >
            {shortcut}
          </span>
        ) : null}
      </Button>
    </div>
  );
}

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
}

/**
 * The compact assistant chat (about 380 × 520), anchored to the page area's bottom-end corner and
 * growing out of it (L21). Compose `AssistantCardHeader`, an optional `AssistantCardContext`,
 * `AssistantCardBody` and `AssistantCardComposer`. Non-modal: the page stays usable behind it,
 * Escape closes it and focus returns to the pill. The parts also compose inside a phone's bottom
 * sheet, without this surface.
 *
 * @example
 * ```tsx
 * <AssistantCard id="assistant-card" open={open} onOpenChange={setOpen}>
 *   <AssistantCardHeader title="William" onClose={() => setOpen(false)}
 *     onMoveToPanel={moveToPanel} onOpenFull={openFull} />
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
  className,
  onKeyDown,
  children,
  ref,
  id,
  ...props
}: AssistantCardProps) {
  const titleId = React.useId();
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
    const tryFocus = (node: HTMLElement | null | undefined) => {
      if (!node?.isConnected) return false;
      node.focus({ preventScroll: true });
      return document.activeElement === node;
    };
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
      if (tryFocus(initialFocus?.current)) return;
      const fields = card.querySelectorAll<HTMLElement>(
        'textarea:not(:disabled), input:not(:disabled):is(:not([type]), [type=text], [type=search], [type=email], [type=url], [type=tel], [type=password]), [contenteditable="true"], [contenteditable=""]',
      );
      for (const field of fields) {
        if (field.checkVisibility?.() === false) continue;
        if (tryFocus(field)) return;
      }
      card.focus({ preventScroll: true });
      return;
    }
    const active = document.activeElement;
    if (active && active !== document.body && !card.contains(active)) return;
    // The first of these that can still take focus: a removed opener falls through.
    if (!tryFocus(finalFocus?.current) && !tryFocus(returnTo.current))
      tryFocus(opener());
  }, [open, initialFocus, finalFocus, id]);

  if (!opened) return null;
  return (
    <AssistantCardTitle.Provider value={{ titleId }}>
      <section
        ref={setRef}
        id={id}
        role="dialog"
        aria-modal={false}
        aria-labelledby={titleId}
        tabIndex={-1}
        data-slot="assistant-card"
        data-open={open ? "" : undefined}
        inert={!open}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.key !== "Escape" ||
            event.defaultPrevented ||
            // A menu portalled out of the card handles its own Escape.
            !cardRef.current?.contains(event.target as Node)
          )
            return;
          event.preventDefault();
          onOpenChange(false);
        }}
        className={cn(
          "absolute end-4 bottom-4 z-10 flex h-130 print:hidden max-h-[calc(100%-2rem)] w-95 max-w-[calc(100%-2rem)] origin-bottom-right flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-overlay border border-border bg-popover text-popover-foreground shadow-lg outline-none rtl:origin-bottom-left",
          "transition-[scale,translate,opacity,visibility]",
          open
            ? "visible translate-y-0 scale-100 opacity-100 duration-state ease-enter starting:translate-y-2 starting:scale-95 starting:opacity-0"
            : "invisible translate-y-2 scale-95 opacity-0 duration-state-exit ease-exit",
          className,
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
   * Turns the chat into a panel tab. Omit to hide the action.
   * @default undefined
   */
  onMoveToPanel?: () => void;
  /**
   * Opens the chat as a full page. Omit to hide the action (no Agents module).
   * @default undefined
   */
  onOpenFull?: () => void;
  /** Closes the card. */
  onClose: () => void;
  /** @default "Move to panel" */
  moveToPanelLabel?: string;
  /** @default "Open full chat" */
  openFullLabel?: string;
  /** @default "Close" */
  closeLabel?: string;
  /**
   * The chat's own tools — New chat, Chats — as `ToolGroupItem`s, placed before Move to panel,
   * Open full chat and Close.
   * @default undefined
   */
  actions?: React.ReactNode;
}

/**
 * The card's 48px header: the assistant's mark and name, then Move to panel, Open full chat and
 * Close as one tool group.
 *
 * @example
 * ```tsx
 * <AssistantCardHeader
 *   title="William"
 *   actions={<ToolGroupItem label="New chat" onClick={newChat}><SquarePenIcon /></ToolGroupItem>}
 *   onClose={close}
 *   onMoveToPanel={toPanel}
 *   onOpenFull={toFull}
 * />
 * ```
 */
function AssistantCardHeader({
  title,
  icon,
  onMoveToPanel,
  onOpenFull,
  onClose,
  moveToPanelLabel = "Move to panel",
  openFullLabel = "Open full chat",
  closeLabel = "Close",
  actions,
  className,
  ...props
}: AssistantCardHeaderProps) {
  const ctx = React.useContext(AssistantCardTitle);
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
        {onMoveToPanel ? (
          <ToolGroupItem label={moveToPanelLabel} onClick={onMoveToPanel}>
            <PanelRightIcon />
          </ToolGroupItem>
        ) : null}
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
  AssistantPill,
  AssistantCard,
  AssistantCardHeader,
  AssistantCardContext,
  AssistantCardBody,
  AssistantCardComposer,
};
