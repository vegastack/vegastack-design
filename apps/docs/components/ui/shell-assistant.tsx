// @vegastack shell-assistant@0.135.0 sha256-AOtdOD30xUDiXfdUwjGjz7/SxYmWrZDL/6EgMiHrmJg=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";

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
 * bottom sheet instead. Outside a shell it fills its container. It is the frame only: the chat
 * inside draws its own header, thread and composer. A labelled region of the frame (name it with
 * `aria-label`, or `aria-labelledby` pointing at the chat's heading): the page stays usable beside
 * it, Escape closes it and focus returns to what opened it (the global bar's Ask, or ⌘J's origin).
 *
 * @example
 * ```tsx
 * <Shell assistant={
 *   <AssistantCard id="assistant-card" aria-label="William chat" open={open} onOpenChange={setOpen}>
 *     <Chat onClose={() => setOpen(false)} />
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
    <section
      ref={setRef}
      id={id}
      // A region of the frame beside the page, not a dialog over it.
      role="region"
      tabIndex={-1}
      data-slot="assistant-card"
      data-open={open ? "" : undefined}
      inert={!open}
      className={cn(
        "relative flex size-full min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-card border border-border bg-card text-card-foreground outline-none print:hidden",
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
  );
}

export { AssistantCard };
