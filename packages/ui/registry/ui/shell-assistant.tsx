// @vegastack shell-assistant@0.123.2 sha256-/0Spsh978ci/Ps1EfJGFJ1GQNsw6uY2CaFsiSvPNT/Q=

"use client";

import * as React from "react";
import { Maximize2Icon, SparklesIcon, XIcon } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ToolGroup, ToolGroupItem } from "@/components/ui/tool-group";

const AssistantCardTitle = React.createContext<{ titleId: string } | null>(
  null,
);

/** Props for `AssistantCard`, the chat docked beside the page. */
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

/**
 * The assistant's chat docked beside the page, the split view (LAY-26): render it as `Shell`'s
 * `assistant` and, from 40rem, the shell gives it 400px (at most 45% of the shell) and the page
 * card's inset and corner. Under 40rem the shell shows no card: a phone puts the parts in a
 * bottom sheet instead. Outside a shell it fills its container. Compose `AssistantCardHeader`, an
 * optional `AssistantCardContext`, `AssistantCardBody` and `AssistantCardComposer`. A labelled
 * region of the frame: the page stays usable beside it, Escape closes it and focus returns to what
 * opened it (the global bar's Ask, or ⌘J's origin).
 *
 * @example
 * ```tsx
 * <Shell assistant={
 *   <AssistantCard id="assistant-card" open={open} onOpenChange={setOpen}>
 *     <AssistantCardHeader title="William" onClose={() => setOpen(false)}
 *       onOpenFull={openFull} />
 *     <AssistantCardContext onRemove={clearContext}>#3 Review Q3 pricing</AssistantCardContext>
 *     <AssistantCardBody>{messages}</AssistantCardBody>
 *     <AssistantCardComposer><ChatComposer … /></AssistantCardComposer>
 *   </AssistantCard>
 * } …>
 * ```
 */
function AssistantCard({
  open,
  onOpenChange,
  initialFocus,
  finalFocus,
  className,
  children,
  ref,
  id,
  ...props
}: AssistantCardProps) {
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

  // Escape listens on the window, after the page's handlers, for events from inside the card:
  // what it holds may be portalled in from another React tree (a chat moved between the card and its full page),
  // whose events never reach this element's React handlers. A handler inside that already took
  // the key (a menu's Escape, a composer's "stop") wins: `defaultPrevented`.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const card = cardRef.current;
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        !card?.contains(event.target as Node)
      )
        return;
      event.preventDefault();
      onOpenChangeRef.current(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!opened) return null;
  return (
    <AssistantCardTitle.Provider value={{ titleId }}>
      <section
        ref={setRef}
        id={id}
        // A region of the frame beside the page, not a dialog over it.
        role="region"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-slot="assistant-card"
        data-open={open ? "" : undefined}
        inert={!open}
        className={cn(
          "flex size-full min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-card border border-border bg-card text-card-foreground outline-none print:hidden",
          // It only fades in: the shell places it, beside the page.
          "transition-[opacity,visibility]",
          open
            ? "visible opacity-100 duration-state ease-enter starting:opacity-0"
            : "invisible opacity-0 duration-state-exit ease-exit",
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
}

/**
 * The card's 48px header: the assistant's mark and name, then the chat's tools, Open full chat
 * and Close as one tool group.
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
  className,
  ...props
}: AssistantCardHeaderProps) {
  const ctx = React.useContext(AssistantCardTitle);
  return (
    <div
      data-slot="assistant-card-header"
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 ps-4 pe-2 capsule-scope",
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
        // Below its minimum the card scrolls as a whole, so a short card never clips the composer.
        "relative flex min-h-24 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-2 text-sm",
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
