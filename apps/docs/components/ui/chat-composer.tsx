// @vegastack chat-composer@0.133.0 sha256-wqjsXsIgEj/8LRDBT9Dc9FcSSzgbvKT9KlV1+1aiSiw=

"use client";

import * as React from "react";
import {
  ArrowUp,
  AtSign,
  ChevronDown,
  CornerDownRight,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Info,
  Plus,
  RotateCw,
  Square,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { ChatMenu } from "@/components/ui/chat-menu";
import {
  TextEdit,
  type TextEditHandle,
  type TextEditProps,
} from "@/components/ui/text-edit";
import { TextSpinner } from "@/components/ui/text-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ChatComposer — the box a person talks to an agent in, as a compound. The root is the card and
 * owns the turn: the text, the send, Stop, the files, the drop. Its parts lay the card out, top to
 * bottom:
 *
 *   ╭──────────────────────────────────────────────────────╮
 *   │ [q3.pdf ×] [photo]                                   │  ChatComposerAttachments
 *   │ Ask William anything…                                │  ChatComposerInput
 *   │ (+) (✳ William ▾) [Plan]        Haiku 5.5 Medium ▾ (↑)│  ChatComposerActions
 *   ╰──────────────────────────────────────────────────────╯
 *
 *   ╭──────────────────────────────────────────────────────╮
 *   │ (✳)  Reply to William…                            (↑)│  the same card at rest (`rest`)
 *   ╰──────────────────────────────────────────────────────╯
 *
 * One radius: the card is `rounded-overlay` (24px, the grown composer). Everything inside is
 * concentric with it: the actions row sits 7px in (1px border + 6px padding), so 24 − 7 leaves a full
 * circle on its 32px controls (`capsule-scope`: pills and circles), the attachments 10px in with
 * `rounded-tile` thumbnails and pill (`rounded-chip`) file chips. A `ChatComposerNotice` runs edge
 * to edge on the top edge. Steers wait above the card, a failed send says so under it.
 *
 * At rest (`rest`, nothing in the card focused, nothing to keep in view) the same card is one 48px
 * line: 1px border + 7px + a 32px control + 7px + 1px, so the 24px corner makes a capsule and the
 * circles inside sit 8px in, concentric (24 − 8 = 16). Only `ChatComposerAgent` (as its avatar) and
 * `ChatComposerSubmit` stay; the text shows one line. Focus, a click or a key opens it again.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Where the turn stands. `sending` — the message is on its way (Send shows a spinner; the host
 * keeps it at most ~300ms). `running` — the agent works: Send is Stop. `stopping` — Stop was
 * pressed and the agent is winding down: Stop is held.
 */
export type ComposerState = "idle" | "sending" | "running" | "stopping";

/** A file going with the message: an image shows as a thumbnail, anything else as a chip. */
export interface ComposerAttachment {
  /** A stable id; `onRemoveAttachment` and `onRetryAttachment` receive it. */
  id: string;
  /** The file's name, shown with a middle ellipsis when long. */
  name: string;
  /** Its media type ("image/png", "application/pdf"); picks the icon. */
  mediaType: string;
  /** A preview URL; an image with one shows as a 56px thumbnail. @default undefined */
  thumbUrl?: string;
  /** Upload progress 0–1 while it uploads; `undefined` once it's ready. @default undefined */
  progress?: number;
  /** Why it failed to upload, in a few words. @default undefined */
  error?: string;
}

/** A message typed while the agent works, waiting to be read at its next step. */
export interface ComposerSteer {
  /** A stable id; `onCancelSteer` receives it. */
  id: string;
  /** The words, as typed. */
  text: string;
  /** `queued` — waiting for the next step (it can be taken back); `read` — the agent has it. */
  state: "queued" | "read";
}

/** Reach into the box from outside: a starter prompt filling it, an add menu's Mention item. */
export interface ChatComposerHandle {
  /** Put the caret in the box, at the end of the text. */
  focus: () => void;
  /**
   * Replace the text: a starter prompt, a message brought back to edit, a draft that arrived after
   * the box mounted. Focuses the box unless `focus` is false.
   */
  setValue: (value: string, options?: { focus?: boolean }) => void;
  /** Open the `@` list at the caret, as typing `@` would. */
  openMentionMenu: () => void;
}

/** The composer's words. */
export interface ChatComposerLabels {
  /** The text box's name. @default "Message" */
  message?: string;
  /** @default "Send" */
  send?: string;
  /** Send while the message goes. @default "Sending" */
  sending?: string;
  /** @default "Stop" */
  stop?: string;
  /** Stop once pressed, while the agent winds down. @default "Stopping" */
  stopping?: string;
  /** `ChatComposerAddButton`'s name. @default "Add" */
  add?: string;
  /** `ChatComposerMentionButton`'s name. @default "Mention" */
  mention?: string;
  /** Over the card while files are dragged on it. @default "Drop to add to chat" */
  drop?: string;
  /** Under the card when a send fails, unless `error` says more. @default "Couldn't send. Try again." */
  sendFailed?: string;
  /** The steers list's name. @default "Waiting to be read" */
  steers?: string;
  /** A queued steer's state. @default "read after this step" */
  steerQueued?: string;
  /** A steer the agent has read. @default "read" */
  steerRead?: string;
  /** Takes a queued steer back. @default "Take back" */
  cancelSteer?: string;
  /** Takes an attachment off. @default (name) => `Remove ${name}` */
  removeAttachment?: (name: string) => string;
  /** Uploads a failed attachment again. @default (name) => `Try ${name} again` */
  retryAttachment?: (name: string) => string;
}

/* ------------------------------------------------------------------------------------------------
 * The root's context: what every part reads.
 * ----------------------------------------------------------------------------------------------*/

interface ComposerContextValue {
  state: ComposerState;
  /** The card rests at one line now. */
  resting: boolean;
  disabled: boolean;
  labels: ChatComposerLabels | undefined;
  body: string;
  draft: { generation: number; value: string | undefined };
  box: React.RefObject<TextEditHandle | null>;
  onEditorChange: (value: string) => void;
  submit: (text: string) => Promise<void>;
  canSend: boolean;
  sending: boolean;
  pending: boolean;
  working: boolean;
  empty: boolean;
  queues: boolean;
  stop: (() => void) | undefined;
  errorId: string | undefined;
  attachments: readonly ComposerAttachment[] | undefined;
  onRemoveAttachment: ((id: string) => void) | undefined;
  onRetryAttachment: ((id: string) => void) | undefined;
}

const ComposerContext = React.createContext<ComposerContextValue | null>(null);

function useComposer(part: string): ComposerContextValue {
  const context = React.useContext(ComposerContext);
  if (!context) throw new Error(`${part} must be used inside <ChatComposer>.`);
  return context;
}

/**
 * The text as it sends. The editor writes a space it must keep as `&#32;`, so a plain `trim` would
 * leave a box of spaces something to send.
 */
const sendable = (markdown: string): string =>
  markdown.replace(/^(?:\s|&#32;)+|(?:\s|&#32;)+$/g, "");

/** A double click on Send must not land on the Stop that takes its place. */
const STOP_GUARD_MS = 400;

/** The dragged items are something this box takes. */
function takesDrag(
  event: React.DragEvent,
  files: boolean,
  types: readonly string[] | undefined,
): boolean {
  const dragged = Array.from(event.dataTransfer?.types ?? []);
  return (
    (files && dragged.includes("Files")) ||
    !!types?.some((type) => dragged.includes(type))
  );
}

/**
 * Something in the card that keeps it open at rest: a menu opened from one of its controls (focus
 * is in the menu's portal, its trigger says it is open), a notice, files or chips, or the host's
 * own `data-composer-hold` (a mode that is on).
 */
const HOLDS_OPEN =
  '[aria-expanded="true"],[data-slot="chat-composer-notice"],[data-slot="chat-composer-attachments"],[data-composer-hold]';

/**
 * The same holds, read from the parts as given (before anything renders), through every level of
 * plain children: a `ChatComposerNotice`, a `ChatComposerAttachments` with chips in it, or an element
 * whose `data-composer-hold` is set. Your own component that renders a notice is opaque here: pass
 * `holdOpen` with it, or a server-rendered card starts at rest until it hydrates.
 */
function holdsOpen(node: React.ReactNode): boolean {
  return React.Children.toArray(node).some((child) => {
    if (!React.isValidElement(child)) return false;
    const props = child.props as {
      children?: React.ReactNode;
      "data-composer-hold"?: unknown;
    };
    const hold = props["data-composer-hold"];
    if (child.type === ChatComposerNotice) return true;
    if (hold !== undefined && hold !== null && hold !== false) return true;
    if (child.type === ChatComposerAttachments)
      return React.Children.toArray(props.children).length > 0;
    return props.children != null && holdsOpen(props.children);
  });
}

/** How long the card takes to grow or rest (`--duration-layout`, `--motion-ease-emphasized`). */
const REST_MOTION =
  "height var(--duration-layout, 280ms) var(--motion-ease-emphasized, ease)";

/** A press on the card's own chrome (not a control, not the text) puts the caret in the text. */
const CHROME_SLOTS = new Set([
  "chat-composer-box",
  "chat-composer-input",
  "text-edit",
  "chat-composer-actions",
  "chat-composer-actions-start",
  "chat-composer-actions-end",
]);

/* ------------------------------------------------------------------------------------------------
 * Root
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ChatComposer`, the root: the card, and the turn it owns. */
export interface ChatComposerProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onSubmit" | "defaultValue"
> {
  /** The card's parts: `ChatComposerNotice`, `ChatComposerAttachments`, `ChatComposerInput`, `ChatComposerActions`. @default undefined */
  children?: React.ReactNode;
  /**
   * Send the message, as Markdown. The box clears at once, so the person can start the next one. A
   * rejection, or resolving `false` (a question first: "Send without the skill?"), puts the text
   * back, ahead of anything typed since. Without it, Send stays off. What a model or a bubble reads
   * is `markdownAsTyped(value)` (`markdown-as-typed`).
   * @default undefined
   */
  onSubmit?: (value: string) => void | boolean | Promise<unknown>;
  /** Stop the agent. Without it, there is no Stop while it runs. @default undefined */
  onStop?: () => void;
  /** Where the turn stands. @default "idle" */
  state?: ComposerState;
  /**
   * The next message still sends while `running` (a steer, or a message held until the answer
   * ends): Enter sends it, and with text in the box a small Send stands beside Stop.
   * @default false
   */
  queues?: boolean;
  /** Turn the whole card off: the text and every control in it. @default false */
  disabled?: boolean;
  /** Hold Send only: something isn't ready (offline, a file uploading). Say why in a `ChatComposerNotice`. @default false */
  submitDisabled?: boolean;
  /** Files going with the message; `ChatComposerAttachments` draws them. They count as something to send. @default undefined */
  attachments?: readonly ComposerAttachment[];
  /** × on an attachment; Backspace in the empty box takes the last one off. @default undefined */
  onRemoveAttachment?: (id: string) => void;
  /** ↻ on a failed attachment. @default undefined */
  onRetryAttachment?: (id: string) => void;
  /** Files pasted or dropped on the card. Without it, they go nowhere. @default undefined */
  onFiles?: (files: File[]) => void;
  /** `dataTransfer` types the card takes besides files: a record row dragged in. @default undefined */
  dropTypes?: readonly string[];
  /** One of `dropTypes` was dropped. @default undefined */
  onDropData?: (data: DataTransfer) => void;
  /** ↑ in the empty box: bring back the last message to edit. @default undefined */
  onEditLast?: () => void;
  /** Steers waiting above the card. @default undefined */
  steers?: readonly ComposerSteer[];
  /** × on a queued steer. @default undefined */
  onCancelSteer?: (id: string) => void;
  /** The message that failed to send, under the card; `onSubmit`'s rejection shows otherwise. @default undefined */
  error?: React.ReactNode;
  /** The starting text, as Markdown: a restored draft. @default undefined */
  defaultValue?: string;
  /** Every change of the text, as Markdown, and `""` once it sent. @default undefined */
  onValueChange?: (value: string) => void;
  /** Focus the text when it mounts. @default false */
  autoFocus?: boolean;
  /** Reach into the box. @default undefined */
  handleRef?: React.Ref<ChatComposerHandle>;
  /** The composer's words. @default undefined */
  labels?: ChatComposerLabels;
  /**
   * The card may rest at one 48px line while nothing in it has focus and it holds nothing to keep
   * in view (files, a notice, steers, an error, an open menu, `holdOpen`): the agent's avatar, the
   * first line of the text (a draft leads with a dot) and Send or Stop. Focus, a click on it or a
   * key that the host sends to the box opens it. Leave it off where the box is the point of the
   * screen (a new chat, Home) or autofocuses. @default false
   */
  rest?: boolean;
  /** Keep a resting card open for the host's own reason. @default false */
  holdOpen?: boolean;
}

/**
 * `ChatComposer` — the root: a card (one `rounded-overlay` radius, one hairline that darkens a little
 * while the text has focus) that owns the turn. Enter sends and Shift+Enter breaks the line, except on a
 * phone, where return breaks the line and Send sends. Send morphs in place — the bolt spinner while
 * the message goes (`state="sending"`), Stop while the agent works (`running`), Stop held while it
 * winds down (`stopping`). Typing carries on meanwhile; with `queues`, Enter sends it as a steer,
 * which the host shows in `steers` above the card. Files dropped or pasted on the card go to
 * `onFiles`.
 *
 * @example
 * <ChatComposer rest state={state} onSubmit={send} onStop={stop} attachments={files} onFiles={upload}>
 *   <ChatComposerAttachments />
 *   <ChatComposerInput placeholder="Ask a follow-up…" restPlaceholder="Reply to William…" mentions={mentions} />
 *   <ChatComposerActions>
 *     <ChatComposerActionsStart>
 *       <ChatComposerAddButton menu={add} />
 *       <ChatComposerAgent media={<Sparkle />} description="Chief of staff">William</ChatComposerAgent>
 *     </ChatComposerActionsStart>
 *     <ChatComposerActionsEnd>
 *       <ModelEffortMenu {...model} />
 *       <ChatComposerSubmit />
 *     </ChatComposerActionsEnd>
 *   </ChatComposerActions>
 * </ChatComposer>
 */
export function ChatComposer({
  children,
  onSubmit,
  onStop,
  state = "idle",
  queues = false,
  disabled = false,
  submitDisabled = false,
  attachments,
  onRemoveAttachment,
  onRetryAttachment,
  onFiles,
  dropTypes,
  onDropData,
  onEditLast,
  steers,
  onCancelSteer,
  error: errorProp,
  defaultValue,
  onValueChange,
  autoFocus = false,
  handleRef,
  labels,
  rest = false,
  holdOpen = false,
  className,
  ...props
}: ChatComposerProps) {
  const [body, setBody] = React.useState(defaultValue ?? "");
  const [pending, setPending] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  // The editor takes its text on mount, so a new text is a new generation of it.
  const [draft, setDraft] = React.useState({
    generation: 0,
    value: defaultValue,
    focus: autoFocus,
  });
  const box = React.useRef<TextEditHandle>(null);
  const card = React.useRef<HTMLDivElement>(null);
  const sentAt = React.useRef(0);
  const errorId = React.useId();

  const hasAttachments = !!attachments?.length;
  const working = state === "running" || state === "stopping";
  const sending = state === "sending" || (pending && !working);
  const error =
    errorProp ??
    (failed ? (labels?.sendFailed ?? "Couldn't send. Try again.") : null);
  const empty = !sendable(body) && !hasAttachments;
  // One send at a time, a steer included; while it works only `running` takes one, never
  // `stopping`, so nothing races the stop.
  const canSend =
    !!onSubmit &&
    !disabled &&
    !submitDisabled &&
    !sending &&
    !pending &&
    (!working || (queues && state === "running")) &&
    !empty;

  const replace = React.useCallback(
    (value: string, focus: boolean) => {
      setBody(value);
      setFailed(false);
      setDraft((current) => ({
        generation: current.generation + 1,
        value,
        focus,
      }));
      onValueChange?.(value);
    },
    [onValueChange],
  );

  React.useImperativeHandle(
    handleRef,
    () => ({
      focus: () => box.current?.focus("end"),
      setValue: (value, options) => replace(value, options?.focus ?? true),
      openMentionMenu: () => box.current?.openMentionMenu(),
    }),
    [replace],
  );

  // A new generation of the editor wants the caret back.
  React.useEffect(() => {
    if (draft.focus) box.current?.focus("end");
  }, [draft]);

  const latest = React.useRef(body);
  React.useEffect(() => {
    latest.current = body;
  }, [body]);

  const submit = async (text: string) => {
    if (!canSend) return;
    const value = sendable(text);
    // Nothing typed may be lost, so what failed goes back ahead of what came after it.
    const putBack = () => {
      const since = latest.current;
      replace(since.trim() ? `${value}\n\n${since}` : value, true);
    };
    if (!working) sentAt.current = Date.now();
    // Sent from the resting line (its Send), the card stays at rest; otherwise the caret stays.
    replace("", !resting);
    latest.current = "";
    setPending(true);
    try {
      if ((await onSubmit?.(value)) === false) putBack();
    } catch {
      putBack();
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  const onEditorChange = (value: string) => {
    if (value === body) return;
    setBody(value);
    setFailed(false);
    onValueChange?.(value);
  };

  // At rest: nothing in the card has focus and nothing in it is to be kept in view. Nothing is
  // focused as it mounts, and what keeps it open is read from its parts as given, so the first
  // frame (the server's too) already has the right shape.
  const mayRest =
    rest &&
    !holdOpen &&
    !error &&
    !steers?.length &&
    !hasAttachments &&
    state !== "sending" &&
    !holdsOpen(children);
  const [resting, setResting] = React.useState(mayRest);
  const wasResting = React.useRef(resting);
  React.useEffect(() => {
    wasResting.current = resting;
  }, [resting]);
  const evaluate = React.useCallback(() => {
    const el = card.current;
    if (!el) return;
    const active = el.ownerDocument.activeElement;
    // A click on what the resting line keeps (Send, Stop, the agent) does its job without opening
    // the card under the pointer; the text, or a key that moves focus in, opens it. An open card
    // stays open while any of its controls has focus.
    const reached =
      !!active &&
      el.contains(active) &&
      !(
        wasResting.current &&
        active.closest("[data-rest-keep]") &&
        !active.matches(":focus-visible")
      );
    setResting(mayRest && !reached && !el.querySelector(HOLDS_OPEN));
  }, [mayRest]);
  React.useLayoutEffect(evaluate, [evaluate, body]);
  React.useEffect(() => {
    const el = card.current;
    if (!rest || !el) return;
    // A menu opening or closing, a notice or a chip coming or going.
    const observer = new MutationObserver(evaluate);
    observer.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-expanded", "data-composer-hold"],
    });
    return () => observer.disconnect();
  }, [rest, evaluate]);
  // Growing and resting move the card's height, not the page under it in one jump: the card
  // eases from the height it had (or has, mid-move) to its new natural height.
  const height = React.useRef(0);
  const moving = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    const el = card.current;
    if (!rest || !el || typeof ResizeObserver === "undefined") return;
    height.current = el.offsetHeight;
    const observer = new ResizeObserver(() => {
      if (!moving.current) height.current = el.offsetHeight;
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      moving.current?.();
    };
  }, [rest]);
  const firstRest = React.useRef(true);
  React.useLayoutEffect(() => {
    const el = card.current;
    if (firstRest.current || !el) {
      firstRest.current = false;
      return;
    }
    // Mid-move, start from where it is now; the old move's styles go before measuring the new end.
    const from = moving.current
      ? el.getBoundingClientRect().height
      : height.current;
    moving.current?.();
    const to = el.offsetHeight;
    if (
      !from ||
      Math.abs(from - to) < 1 ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    el.style.height = `${from}px`;
    void el.offsetHeight;
    el.style.transition = REST_MOTION;
    el.style.height = `${to}px`;
    const stop = () => {
      window.clearTimeout(timer);
      el.removeEventListener("transitionend", onEnd);
      el.style.height = "";
      el.style.transition = "";
      moving.current = null;
      height.current = el.offsetHeight;
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === el && event.propertyName === "height") stop();
    };
    const timer = window.setTimeout(stop, 400);
    el.addEventListener("transitionend", onEnd);
    moving.current = stop;
  }, [resting]);
  const restKind = resting ? (sendable(body) ? "draft" : "empty") : undefined;

  // Enter and leave fire for every child the drag crosses, so count them.
  const drags = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);
  const takesFiles = !!onFiles && !disabled;
  const canDrop = takesFiles || (!!dropTypes?.length && !disabled);
  React.useEffect(() => {
    if (canDrop) return;
    drags.current = 0;
    setDragging(false);
  }, [canDrop]);

  const context: ComposerContextValue = {
    state,
    resting,
    disabled,
    labels,
    body,
    draft,
    box,
    onEditorChange,
    submit,
    canSend,
    sending,
    pending,
    working,
    empty,
    queues,
    stop:
      working && onStop
        ? () => {
            if (Date.now() - sentAt.current > STOP_GUARD_MS) onStop();
          }
        : undefined,
    errorId: error ? errorId : undefined,
    attachments,
    onRemoveAttachment,
    onRetryAttachment,
  };

  return (
    <ComposerContext.Provider value={context}>
      <div
        data-slot="chat-composer"
        data-state={state}
        className={cn("flex min-w-0 flex-col gap-1", className)}
        {...props}
      >
        {steers?.length ? (
          <ul
            data-slot="chat-composer-steers"
            aria-label={labels?.steers ?? "Waiting to be read"}
            className="flex min-w-0 flex-col"
          >
            {steers.map((steer) => (
              <SteerRow
                key={steer.id}
                steer={steer}
                onCancel={onCancelSteer}
                disabled={disabled}
                labels={labels}
              />
            ))}
          </ul>
        ) : null}
        <div
          ref={card}
          data-slot="chat-composer-box"
          data-rest={restKind}
          // A bordered field group around text entry: its border is the text's focus cue, and
          // base.css hangs the forced-colours focus outline on it (FOC-3/FOC-14).
          data-field-group=""
          data-disabled={disabled ? "" : undefined}
          data-dragging={dragging ? "" : undefined}
          className={cn(
            // One radius; the hairline darkens a little while the text has focus (FOC-14's
            // text-entry cue). Nothing on it ever turns red: a failed send says so under it.
            "group/composer relative flex min-w-0 flex-col overflow-hidden rounded-overlay capsule-scope border border-chat-hairline bg-background transition-[border-color] duration-quick ease-standard has-[[contenteditable=true]:focus]:border-input-focus",
            // At rest: one row, 7px in, so its 32px controls make it 48px tall.
            "data-rest:flex-row data-rest:items-center data-rest:p-[7px]",
            disabled && "bg-muted/40",
          )}
          onFocus={rest ? evaluate : undefined}
          onBlur={
            rest
              ? () => {
                  // Focus moves on after blur: look once it has landed.
                  requestAnimationFrame(evaluate);
                }
              : undefined
          }
          onMouseDown={(event) => {
            const slot = (event.target as HTMLElement).dataset?.slot;
            if (disabled || !slot || !CHROME_SLOTS.has(slot)) return;
            event.preventDefault();
            box.current?.focus("end");
          }}
          onKeyDownCapture={(event) => {
            const inBox = (event.target as HTMLElement).closest(
              "[role=textbox]",
            );
            const plain =
              !event.shiftKey &&
              !event.altKey &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.nativeEvent.isComposing;
            if (
              event.key === "Backspace" &&
              !disabled &&
              onRemoveAttachment &&
              hasAttachments &&
              !sendable(body) &&
              inBox &&
              plain
            ) {
              event.preventDefault();
              event.stopPropagation();
              onRemoveAttachment(attachments![attachments!.length - 1]!.id);
              return;
            }
            if (
              event.key !== "ArrowUp" ||
              !onEditLast ||
              !inBox ||
              sendable(body) ||
              hasAttachments ||
              !plain
            )
              return;
            event.preventDefault();
            event.stopPropagation();
            onEditLast();
          }}
          onPasteCapture={
            takesFiles
              ? (event) => {
                  const files = Array.from(event.clipboardData?.files ?? []);
                  // A spreadsheet's cells paste as text with a picture of them: the text is meant.
                  if (
                    !files.length ||
                    event.clipboardData.getData("text/plain")
                  )
                    return;
                  event.preventDefault();
                  event.stopPropagation();
                  onFiles?.(files);
                }
              : undefined
          }
          onDragEnterCapture={
            canDrop
              ? (event) => {
                  if (!takesDrag(event, takesFiles, dropTypes)) return;
                  drags.current += 1;
                  setDragging(true);
                }
              : undefined
          }
          onDragOverCapture={
            canDrop
              ? (event) => {
                  if (takesDrag(event, takesFiles, dropTypes))
                    event.preventDefault();
                }
              : undefined
          }
          onDragLeaveCapture={
            canDrop
              ? (event) => {
                  if (!takesDrag(event, takesFiles, dropTypes)) return;
                  drags.current = Math.max(0, drags.current - 1);
                  if (drags.current === 0) setDragging(false);
                }
              : undefined
          }
          onDropCapture={
            canDrop
              ? (event) => {
                  if (!takesDrag(event, takesFiles, dropTypes)) return;
                  drags.current = 0;
                  setDragging(false);
                  event.preventDefault();
                  event.stopPropagation();
                  const files = Array.from(event.dataTransfer?.files ?? []);
                  if (takesFiles && files.length) onFiles?.(files);
                  else onDropData?.(event.dataTransfer);
                }
              : undefined
          }
        >
          {children}
          {dragging ? (
            <div
              aria-hidden
              data-slot="chat-composer-drop"
              className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[inherit] border-2 border-dashed border-primary bg-background/90 text-sm font-medium text-primary"
            >
              {labels?.drop ?? "Drop to add to chat"}
            </div>
          ) : null}
        </div>
        {error ? (
          <p
            id={errorId}
            role="alert"
            data-slot="chat-composer-error"
            className="px-3.5 text-xs text-destructive-text"
          >
            {error}
          </p>
        ) : null}
      </div>
    </ComposerContext.Provider>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Notice
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ChatComposerNotice`. */
export interface ChatComposerNoticeProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** What the person should know: "Reconnecting — your agent kept working". */
  children: React.ReactNode;
  /**
   * `info` is neutral; `warning` draws ⚠ in the warning ink; `progress` leads with the bolt
   * spinner's Pulse (Reconnecting, Stopping: waiting, not working), the one moving thing. The card
   * never turns red. @default "info"
   */
  tone?: "info" | "warning" | "progress";
  /** Replaces the tone's lead. @default ⓘ, ⚠ or the pulsing bolt by tone */
  icon?: React.ReactNode;
  /** One small action at the end: a `Button size="xs" variant="ghost"` such as Reload. @default undefined */
  action?: React.ReactNode;
  /** Adds ✕: the person closes the notice. @default undefined */
  onDismiss?: () => void;
  /** ✕'s name. @default "Dismiss" */
  dismissLabel?: string;
  /**
   * The notice appeared because of something the person just did (a send was held, the network
   * dropped): announce it politely. A notice present when the chat opens stays silent.
   * @default false
   */
  live?: boolean;
}

const NOTICE_LEAD = {
  info: <Info aria-hidden className="text-muted-foreground" />,
  warning: <TriangleAlert aria-hidden className="text-warning-text" />,
  progress: <TextSpinner variant="waiting" label="" />,
} as const;

/**
 * `ChatComposerNotice` — a line on the card's top edge, edge to edge with a hairline under it: a
 * lead, the words, an optional action and an optional ✕. Put it first in the card: reconnecting,
 * offline, a held send, a limit.
 *
 * @example
 * <ChatComposer submitDisabled={!online}>
 *   {!online ? <ChatComposerNotice tone="warning" live>You're offline. Your message waits here.</ChatComposerNotice> : null}
 *   <ChatComposerInput />
 * </ChatComposer>
 */
export function ChatComposerNotice({
  tone = "info",
  icon,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  live = false,
  className,
  children,
  ...props
}: ChatComposerNoticeProps) {
  return (
    <div
      data-slot="chat-composer-notice"
      data-tone={tone}
      role={live ? "status" : undefined}
      className={cn(
        "flex min-h-9 min-w-0 animate-in items-center gap-2 border-b border-chat-hairline py-1 ps-3.5 pe-3.5 text-xs text-muted-foreground duration-quick ease-enter fade-in-0 has-[button]:pe-1.5",
        className,
      )}
      {...props}
    >
      <span className="inline-flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-3.5">
        {icon ?? NOTICE_LEAD[tone]}
      </span>
      <span className="min-w-0 flex-1 leading-5">{children}</span>
      {action || onDismiss ? (
        <span className="inline-flex shrink-0 items-center gap-1">
          {action}
          {onDismiss ? (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={dismissLabel}
              onClick={onDismiss}
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Agent — who the message goes to
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ChatComposerAgent`. */
export interface ChatComposerAgentProps extends Omit<
  React.ComponentProps<typeof Button>,
  "size" | "variant" | "children"
> {
  /** The agent's name: "William". Long names truncate; the full name stays in its label and on hover. */
  children: string;
  /** Leads the name: an `Avatar` (size 20) or an icon. At rest it is all that shows. */
  media: React.ReactNode;
  /** Its role, read after the name and shown on hover: "Chief of staff". @default undefined */
  description?: string;
  /** Draw the ▾ that says it opens a list. Off when it only names the agent. @default true */
  chevron?: boolean;
}

/**
 * `ChatComposerAgent` — who the message goes to, first in `ChatComposerActionsStart` after +: the
 * agent's avatar, its name and ▾, as one round ghost button. A long name truncates (the whole name
 * stays in its accessible name and its hover title). At rest the card keeps only its avatar, a 32px
 * circle. It spreads every prop onto its button, so a picker can render it
 * (`<PopoverTrigger render={<ChatComposerAgent …/>} />`).
 *
 * @example
 * <ChatComposerActionsStart>
 *   <ChatComposerAddButton menu={add} />
 *   <ChatMenu trigger={<ChatComposerAgent media={<Avatar … />} description="Chief of staff">William</ChatComposerAgent>}>
 *     {agents}
 *   </ChatMenu>
 * </ChatComposerActionsStart>
 */
export function ChatComposerAgent({
  children,
  media,
  description,
  chevron = true,
  disabled,
  className,
  "aria-label": ariaLabel,
  ...props
}: ChatComposerAgentProps) {
  const composer = useComposer("ChatComposerAgent");
  const label =
    ariaLabel ??
    `Talking to ${children}${description ? `, ${description}` : ""}`;
  return (
    <Button
      variant="ghost"
      aria-label={label}
      title={label}
      data-slot="chat-composer-agent"
      data-rest-keep=""
      disabled={disabled || composer.disabled}
      className={cn(
        "h-8 min-w-0 shrink justify-start gap-1.5 ps-1.5 pe-2.5 text-xs font-medium text-foreground",
        // At rest: the avatar alone, a circle the size of Send.
        "group-data-rest/composer:size-8 group-data-rest/composer:justify-center group-data-rest/composer:p-0",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        data-slot="chat-composer-agent-media"
        className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full [&_svg:not([class*='size-'])]:size-4"
      >
        {media}
      </span>
      <span className="max-w-40 min-w-6 truncate group-data-rest/composer:hidden">
        {children}
      </span>
      {chevron ? (
        <ChevronDown
          aria-hidden
          className="-ms-0.5 size-3.5 shrink-0 text-muted-foreground group-data-rest/composer:hidden"
        />
      ) : null}
    </Button>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Attachments
 * ----------------------------------------------------------------------------------------------*/

/** A long name keeps its start and its extension: "quarterly-pri…-2026.pdf". */
function middleEllipsis(name: string, max = 28): string {
  if (name.length <= max) return name;
  const tail = Math.min(10, Math.floor(max / 2) - 1);
  return `${name.slice(0, max - tail - 1)}…${name.slice(-tail)}`;
}

/** A file's type icon, as an element (never a component made during render). */
function fileIcon(mediaType: string): React.ReactNode {
  const props = { "aria-hidden": true, className: "size-3.5" } as const;
  if (mediaType.startsWith("image/")) return <FileImage {...props} />;
  if (
    mediaType.includes("sheet") ||
    mediaType.includes("excel") ||
    mediaType === "text/csv"
  )
    return <FileSpreadsheet {...props} />;
  if (
    mediaType.startsWith("text/") ||
    mediaType.includes("pdf") ||
    mediaType.includes("word") ||
    mediaType.includes("document")
  )
    return <FileText {...props} />;
  return <File {...props} />;
}

/** Upload progress as a still ring (0–1), the conic ring `upload-panel` draws. */
function ProgressRing({ value }: { value: number }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <span
      aria-hidden
      data-slot="chat-composer-attachment-progress"
      className="block size-3.5 shrink-0 rounded-full [mask-image:radial-gradient(farthest-side,transparent_calc(100%-var(--spacing)*0.5),black_calc(100%-var(--spacing)*0.25))]"
      style={{
        backgroundImage: `conic-gradient(var(--foreground) ${percent}%, var(--border) 0)`,
      }}
    />
  );
}

function AttachmentItem({
  attachment,
  onRemove,
  onRetry,
  disabled,
  labels,
}: {
  attachment: ComposerAttachment;
  disabled: boolean;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  labels?: ChatComposerLabels;
}) {
  const { id, name, mediaType, thumbUrl, progress, error } = attachment;
  const uploading = progress !== undefined && !error;
  const removeLabel = labels?.removeAttachment?.(name) ?? `Remove ${name}`;
  const retryLabel = labels?.retryAttachment?.(name) ?? `Try ${name} again`;
  const state = error ? "error" : uploading ? "uploading" : "ready";
  const percent = uploading ? Math.round(progress * 100) : null;
  const remove = onRemove ? (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label={removeLabel}
      data-slot="chat-composer-attachment-remove"
      disabled={disabled}
      onClick={() => onRemove(id)}
      className="size-6 rounded-capsule text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3"
    >
      <X aria-hidden />
    </Button>
  ) : null;

  if (mediaType.startsWith("image/") && thumbUrl) {
    return (
      <li
        data-slot="chat-composer-attachment"
        data-kind="image"
        data-state={state}
        title={error ? `${name} — ${error}` : name}
        className="group/attachment relative size-14 shrink-0 overflow-hidden rounded-tile border border-chat-hairline bg-chat-card"
      >
        <img
          src={thumbUrl}
          alt={name}
          className={cn(
            "size-full object-cover",
            (uploading || error) && "opacity-50",
          )}
        />
        {uploading ? (
          <span className="absolute inset-0 grid place-items-center">
            <ProgressRing value={progress} />
          </span>
        ) : null}
        {error ? (
          <span className="absolute inset-0 grid place-items-center">
            {onRetry ? (
              <Button
                size="icon-xs"
                variant="secondary"
                aria-label={retryLabel}
                disabled={disabled}
                onClick={() => onRetry(id)}
                className="rounded-capsule"
              >
                <RotateCw aria-hidden />
              </Button>
            ) : (
              <TriangleAlert aria-hidden className="size-4 text-warning-text" />
            )}
          </span>
        ) : null}
        {remove ? (
          <span className="absolute end-0.5 top-0.5 rounded-full bg-background opacity-0 transition-opacity duration-instant group-focus-within/attachment:opacity-100 group-hover/attachment:opacity-100 pointer-coarse:opacity-100">
            {remove}
          </span>
        ) : null}
        <span className="sr-only">
          {percent !== null ? `${percent}%` : error ? error : ""}
        </span>
      </li>
    );
  }

  return (
    <li
      data-slot="chat-composer-attachment"
      data-kind="file"
      data-state={state}
      title={error ? `${name} — ${error}` : name}
      className="flex h-8 max-w-64 shrink-0 items-center gap-1.5 rounded-chip border border-chat-hairline bg-chat-card ps-2 pe-1 text-xs"
    >
      <span className="inline-flex size-3.5 shrink-0 items-center justify-center text-muted-foreground">
        {uploading ? (
          <ProgressRing value={progress} />
        ) : error ? (
          <TriangleAlert aria-hidden className="size-3.5 text-warning-text" />
        ) : (
          fileIcon(mediaType)
        )}
      </span>
      <span className="min-w-0 truncate whitespace-nowrap">
        {middleEllipsis(name)}
      </span>
      {percent !== null ? (
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {percent}%
        </span>
      ) : null}
      {error ? (
        <span className="shrink-0 text-muted-foreground">{error}</span>
      ) : null}
      {error && onRetry ? (
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={retryLabel}
          disabled={disabled}
          onClick={() => onRetry(id)}
          className="size-6 rounded-capsule text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3"
        >
          <RotateCw aria-hidden />
        </Button>
      ) : null}
      {remove}
    </li>
  );
}

/** Props accepted by `ChatComposerAttachments`. */
export interface ChatComposerAttachmentsProps extends Omit<
  React.ComponentPropsWithRef<"ul">,
  "children"
> {
  /**
   * Other things that travel with the message, after the files: the page's chip, a skill for this
   * turn. @default undefined
   */
  children?: React.ReactNode;
}

/**
 * `ChatComposerAttachments` — one row above the text: the root's `attachments` (an image with a
 * `thumbUrl` as a 56px thumbnail, anything else as a chip with a middle-ellipsis name, progress as
 * a still ring, a failure with ↻), then its children. It scrolls sideways and fades at the edge it
 * can scroll toward; with nothing in it, it renders nothing.
 *
 * @example
 * <ChatComposer attachments={files} onRemoveAttachment={remove}>
 *   <ChatComposerAttachments><ComposerChip readOnly>SR-12</ComposerChip></ChatComposerAttachments>
 *   <ChatComposerInput />
 * </ChatComposer>
 */
export function ChatComposerAttachments({
  children,
  className,
  ref: refProp,
  ...props
}: ChatComposerAttachmentsProps) {
  const {
    attachments,
    onRemoveAttachment,
    onRetryAttachment,
    disabled,
    labels,
  } = useComposer("ChatComposerAttachments");
  const row = React.useRef<HTMLUListElement | null>(null);
  const [edges, setEdges] = React.useState({ start: false, end: false });
  const measure = React.useCallback(() => {
    const el = row.current;
    if (!el) return;
    const start = Math.abs(el.scrollLeft) > 1;
    const end = el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft) > 1;
    setEdges((was) =>
      was.start === start && was.end === end ? was : { start, end },
    );
  }, []);
  const shown = !!attachments?.length || !!children;
  React.useLayoutEffect(() => {
    measure();
    const el = row.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, attachments, children, shown]);
  const setRef = React.useMemo(
    () => mergeRefs<HTMLUListElement>(row, refProp),
    [refProp],
  );
  if (!shown) return null;
  return (
    <ul
      ref={setRef}
      data-slot="chat-composer-attachments"
      data-fade-start={edges.start ? "" : undefined}
      data-fade-end={edges.end ? "" : undefined}
      onScroll={measure}
      className={cn(
        "relative flex min-w-0 items-center gap-1.5 overflow-x-auto px-2.5 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        edges.end &&
          !edges.start &&
          "[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] rtl:[mask-image:linear-gradient(to_left,black_calc(100%-2rem),transparent)]",
        edges.start &&
          !edges.end &&
          "[mask-image:linear-gradient(to_left,black_calc(100%-2rem),transparent)] rtl:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]",
        edges.start &&
          edges.end &&
          "[mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]",
        className,
      )}
      {...props}
    >
      {attachments?.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemoveAttachment}
          onRetry={onRetryAttachment}
          disabled={disabled}
          labels={labels}
        />
      ))}
      {children ? (
        <li
          data-slot="chat-composer-chips"
          className="flex shrink-0 items-center gap-1.5"
        >
          {children}
        </li>
      ) : null}
    </ul>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Input
 * ----------------------------------------------------------------------------------------------*/

/** Markdown's escapable punctuation: `\\*` is a literal `*`. */
const ESCAPED = /\\([!-/:-@[-`{-~])/gu;

/**
 * A draft's first line as plain words, for the resting line: the first line with text. Inside a
 * code fence (``` or ~~~) the line shows as written; elsewhere its block marks (heading, quote,
 * list, task) go, links and mentions show their words, and emphasis marks and code ticks go while
 * escaped punctuation stays.
 */
function firstLine(markdown: string): string {
  let fenced = false;
  for (const raw of sendable(markdown).split("\n")) {
    if (/^\s*(?:`{3,}|~{3,})/u.test(raw)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) {
      const code = raw.trim();
      if (code) return code;
      continue;
    }
    // Escapes become placeholders first, so stripping marks never touches a literal one.
    const kept: string[] = [];
    const line = raw
      .replace(ESCAPED, (_, ch: string) => `\u0000${kept.push(ch) - 1}\u0000`)
      .replace(/&#32;/gu, " ")
      .replace(
        /^\s*(?:#{1,6}\s+|>\s?|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/u,
        "",
      )
      .replace(/!?\[([^\]]*)\]\([^)]*\)/gu, "$1")
      .replace(/`([^`]*)`/gu, "$1")
      .replace(/(\*\*|__|~~)(?=\S)(.+?)(?<=\S)\1/gu, "$2")
      .replace(
        /(^|[^\p{L}\p{N}])([*_])(?=\S)(.+?)(?<=\S)\2(?![\p{L}\p{N}])/gu,
        "$1$3",
      )
      .replace(/\u0000(\d+)\u0000/gu, (_, n: string) => kept[Number(n)] ?? "")
      .trim();
    if (line) return line;
  }
  return "";
}

/** Props accepted by `ChatComposerInput`. */
export interface ChatComposerInputProps {
  /** Shown while the box is empty: "Ask William anything…", "Type to steer, or wait…". @default undefined */
  placeholder?: string;
  /** Shown instead while the card rests: "Reply to William…". @default placeholder */
  restPlaceholder?: string;
  /** Lines tall at rest. @default 2 */
  minRows?: number;
  /** Lines it grows to before it scrolls inside. @default 8 */
  maxRows?: number;
  /** `@` mentions (see `TextEdit`'s `mentions`): typing `@` opens the list its `search` fills. @default undefined */
  mentions?: TextEditProps["mentions"];
  /** Where a mention chip links (see `TextEdit`'s `mentionHref`). @default undefined */
  mentionHref?: TextEditProps["mentionHref"];
  /** A person mention's avatar URL (see `TextEdit`'s `mentionImage`). @default undefined */
  mentionImage?: TextEditProps["mentionImage"];
  /** How a mention chip shows its target's state (see `TextEdit`'s `mentionStatus`). @default undefined */
  mentionStatus?: TextEditProps["mentionStatus"];
  /** Extra classes on the text's container. @default undefined */
  className?: string;
}

/**
 * `ChatComposerInput` — the text: Markdown, `@` mentions as the same chips a comment has, two
 * lines at rest, growing line by line to `maxRows`, then scrolling inside. Enter sends, Shift+Enter
 * breaks the line, ⌘/Ctrl+Enter sends from anywhere, Esc leaves the box with the text kept. Named
 * by `labels.message` and described by the error under the card.
 *
 * @example
 * <ChatComposerInput placeholder="Ask William anything…" maxRows={10} mentions={mentions} />
 */
export function ChatComposerInput({
  placeholder,
  restPlaceholder,
  minRows = 2,
  maxRows = 8,
  mentions,
  mentionHref,
  mentionImage,
  mentionStatus,
  className,
}: ChatComposerInputProps) {
  const composer = useComposer("ChatComposerInput");
  return (
    <div
      data-slot="chat-composer-input"
      className={cn(
        "min-w-0",
        // At rest: one line on the controls' centre line; a draft shows its first line, with a dot.
        "group-data-rest/composer:flex group-data-rest/composer:flex-1 group-data-rest/composer:items-center group-data-rest/composer:[--chat-composer-max-h:1.5rem] group-data-rest/composer:[--chat-composer-min-h:1.5rem]",
      )}
    >
      <span
        aria-hidden
        data-slot="chat-composer-draft-dot"
        className="hidden size-1.5 shrink-0 rounded-full bg-info group-data-[rest=draft]/composer:ms-2 group-data-[rest=draft]/composer:block"
      />
      {/* A resting draft shows its first line as plain words over the text (which stays the one
          textbox, unseen, so a click lands in it): a list, a quote or a code block keeps its
          words on the line. */}
      <div className="relative min-w-0 group-data-rest/composer:flex-1">
        <TextEdit
          key={composer.draft.generation}
          handleRef={composer.box}
          format="markdown"
          // The card draws the frame and its focus cue; the editor is only the text.
          variant="document"
          framed
          defaultValue={composer.draft.value}
          placeholder={
            composer.resting ? (restPlaceholder ?? placeholder) : placeholder
          }
          aria-label={composer.labels?.message ?? "Message"}
          aria-describedby={composer.errorId}
          onValueChange={composer.onEditorChange}
          onSubmit={(value) => void composer.submit(value)}
          submitOnEnter
          escapeBehavior="blur"
          slashCommands={[]}
          slashHint={false}
          dragHandles={false}
          inset="none"
          saving={composer.sending}
          disabled={composer.disabled}
          mentions={mentions}
          mentionHref={mentionHref}
          mentionImage={mentionImage}
          mentionStatus={mentionStatus}
          // `lh` follows the text's own line height, a phone's larger type included.
          // A resting card sets both to one line through these variables.
          minHeight={`var(--chat-composer-min-h, ${Math.max(1, minRows)}lh)`}
          maxHeight={`var(--chat-composer-max-h, ${Math.max(minRows, maxRows)}lh)`}
          className={cn(
            "px-3.5 pt-2.5 pb-0.5 text-sm",
            // At rest: 4px + the 24px field (a 20px line, 2px above and below) + 4px matches the 32px
            // controls, so the text sits on their centre line; one line, ellipsis.
            // A resting draft keeps the text as the one textbox, unseen; its rich parts' own
            // controls (a code block's Copy) leave the Tab order and the pointer while it rests.
            "group-data-rest/composer:px-[7px] group-data-rest/composer:py-1 group-data-rest/composer:[&_[role=textbox]]:h-6 group-data-rest/composer:[&_[role=textbox]]:overflow-hidden group-data-rest/composer:[&_[role=textbox]]:py-0.5 group-data-rest/composer:[&_[data-slot=text-edit-content]]:overflow-hidden group-data-rest/composer:[&_[role=textbox]_button]:hidden group-data-[rest=draft]/composer:opacity-0",
            className,
          )}
        />
        <span
          aria-hidden
          data-slot="chat-composer-draft-preview"
          // Presses fall through to the text under it, which takes the caret and opens the card.
          className="pointer-events-none absolute inset-0 hidden items-center px-[7px] text-sm text-foreground group-data-[rest=draft]/composer:flex"
        >
          <span className="min-w-0 truncate">
            {composer.resting ? firstLine(composer.body) : null}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Actions row
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ChatComposerActions`. */
export type ChatComposerActionsProps = React.ComponentPropsWithRef<"div">;

/**
 * `ChatComposerActions` — the row under the text, 6px in from the card's edge: a
 * `ChatComposerActionsStart` (+, @) and a `ChatComposerActionsEnd` (the model, then Send).
 *
 * @example
 * <ChatComposerActions>
 *   <ChatComposerActionsStart><ChatComposerAddButton /></ChatComposerActionsStart>
 *   <ChatComposerActionsEnd><ChatComposerSubmit /></ChatComposerActionsEnd>
 * </ChatComposerActions>
 */
export function ChatComposerActions({
  className,
  ...props
}: ChatComposerActionsProps) {
  return (
    <div
      data-slot="chat-composer-actions"
      className={cn(
        "flex min-w-0 items-center gap-1 p-1.5",
        // At rest its two groups join the text's row: the start before it, the end after it.
        "group-data-rest/composer:contents",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ChatComposerActionsStart`. */
export type ChatComposerActionsStartProps = React.ComponentPropsWithRef<"div">;

/**
 * `ChatComposerActionsStart` — the row's leading controls: round icon buttons, all one size.
 *
 * @example
 * <ChatComposerActionsStart>
 *   <ChatComposerAddButton onClick={pick} />
 *   <ChatComposerMentionButton />
 * </ChatComposerActionsStart>
 */
export function ChatComposerActionsStart({
  className,
  ...props
}: ChatComposerActionsStartProps) {
  return (
    <div
      data-slot="chat-composer-actions-start"
      className={cn(
        // On a narrow card the model gives way first: this group shrinks a quarter as fast.
        "flex min-w-0 shrink-[0.25] items-center gap-1",
        // At rest: only what it keeps (the agent's avatar), before the text; nothing kept, nothing.
        "group-data-rest/composer:-order-1 group-data-rest/composer:shrink-0 group-data-rest/composer:*:not-data-rest-keep:hidden group-data-rest/composer:not-has-data-rest-keep:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ChatComposerActionsEnd`. */
export type ChatComposerActionsEndProps = React.ComponentPropsWithRef<"div">;

/**
 * `ChatComposerActionsEnd` — the row's trailing controls, at its end: a `ModelEffortMenu` (and a
 * `ContextRing`), then `ChatComposerSubmit`. The model gives way first on a narrow card.
 *
 * @example
 * <ChatComposerActionsEnd>
 *   <ModelEffortMenu {...model} />
 *   <ChatComposerSubmit />
 * </ChatComposerActionsEnd>
 */
export function ChatComposerActionsEnd({
  className,
  ...props
}: ChatComposerActionsEndProps) {
  return (
    <div
      data-slot="chat-composer-actions-end"
      className={cn(
        "ms-auto flex min-w-0 items-center gap-1",
        // At rest: Send or Stop only.
        "group-data-rest/composer:*:not-data-rest-keep:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ChatComposerIconButton`. */
export interface ChatComposerIconButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "size" | "variant"
> {
  /** The button's name: icon-only controls always carry one. */
  "aria-label": string;
  /** Shows on hover and focus. Leave it off when a menu renders the button. @default undefined */
  tooltip?: React.ReactNode;
}

/**
 * `ChatComposerIconButton` — a round 32px ghost button for the actions row, the size Send is, so
 * the row's controls share one hit area. Turned off with the card.
 *
 * @example
 * <ChatComposerIconButton aria-label="Dictate" tooltip="Dictate"><Mic /></ChatComposerIconButton>
 */
export function ChatComposerIconButton({
  tooltip,
  disabled,
  className,
  ...props
}: ChatComposerIconButtonProps) {
  const composer = useComposer("ChatComposerIconButton");
  const button = (
    <Button
      variant="ghost"
      size="icon"
      data-slot="chat-composer-icon-button"
      disabled={disabled || composer.disabled}
      className={cn(
        "shrink-0 text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** Props accepted by `ChatComposerAddButton`. */
export interface ChatComposerAddButtonProps extends Omit<
  ChatComposerIconButtonProps,
  "aria-label" | "children" | "tooltip"
> {
  /**
   * The + menu's items (`ChatMenuItem`, `ChatMenuSeparator`): Upload files, From Library. Without
   * it, + is a button: give it `onClick` to open the host's file picker. @default undefined
   */
  menu?: React.ReactNode;
  /** The button's name. @default labels.add ?? "Add" */
  "aria-label"?: string;
}

/**
 * `ChatComposerAddButton` — + in the actions row: opens `menu` above it, or calls `onClick`.
 *
 * @example
 * <ChatComposerAddButton menu={<ChatMenuItem onSelect={upload}>Upload files</ChatMenuItem>} />
 */
export function ChatComposerAddButton({
  menu,
  "aria-label": ariaLabel,
  ...props
}: ChatComposerAddButtonProps) {
  const { labels } = useComposer("ChatComposerAddButton");
  const label = ariaLabel ?? labels?.add ?? "Add";
  if (menu) {
    return (
      <ChatMenu
        side="top"
        align="start"
        trigger={
          <ChatComposerIconButton
            aria-label={label}
            data-slot="chat-composer-add"
            {...props}
          >
            <Plus aria-hidden />
          </ChatComposerIconButton>
        }
      >
        {menu}
      </ChatMenu>
    );
  }
  return (
    <ChatComposerIconButton
      aria-label={label}
      tooltip={label}
      data-slot="chat-composer-add"
      {...props}
    >
      <Plus aria-hidden />
    </ChatComposerIconButton>
  );
}

/** Props accepted by `ChatComposerMentionButton`. */
export interface ChatComposerMentionButtonProps extends Omit<
  ChatComposerIconButtonProps,
  "aria-label" | "children" | "tooltip"
> {
  /** The button's name. @default labels.mention ?? "Mention" */
  "aria-label"?: string;
}

/**
 * `ChatComposerMentionButton` — @ in the actions row: opens the input's `@` list at the caret, as
 * typing `@` would, then calls `onClick`. Needs `mentions` on `ChatComposerInput`.
 *
 * @example
 * <ChatComposerMentionButton />
 */
export function ChatComposerMentionButton({
  "aria-label": ariaLabel,
  onClick,
  ...props
}: ChatComposerMentionButtonProps) {
  const { labels, box } = useComposer("ChatComposerMentionButton");
  const label = ariaLabel ?? labels?.mention ?? "Mention";
  return (
    <ChatComposerIconButton
      aria-label={label}
      tooltip={label}
      data-slot="chat-composer-mention"
      onClick={(event) => {
        box.current?.openMentionMenu();
        onClick?.(event);
      }}
      {...props}
    >
      <AtSign aria-hidden />
    </ChatComposerIconButton>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Submit — Send, Sending, Stop
 * ----------------------------------------------------------------------------------------------*/

/** The three faces of the one action button, stacked so they crossfade in place. */
type Face = "send" | "sending" | "stop";

function ActionButton({
  face,
  label,
  disabled,
  primary,
  onClick,
  slot,
}: {
  face: Face;
  label: string;
  disabled: boolean;
  primary: boolean;
  onClick: () => void;
  slot: string;
}) {
  const layer = (shown: boolean) =>
    cn(
      "absolute inset-0 grid place-items-center transition-[opacity,scale]",
      shown
        ? "scale-100 opacity-100 duration-state ease-enter"
        : "scale-90 opacity-0 duration-state-exit ease-exit",
    );
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon"
            variant={primary ? "default" : "outline"}
            aria-label={label}
            aria-busy={face === "sending" || undefined}
            data-slot={slot}
            data-face={face}
            data-rest-keep=""
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "relative shrink-0 overflow-hidden",
              // An empty box's Send is a quiet outline, not a faded primary.
              !primary &&
                "border-chat-hairline text-muted-foreground data-disabled:opacity-100",
            )}
          />
        }
      >
        <span aria-hidden className={layer(face === "send")}>
          <ArrowUp />
        </span>
        <span aria-hidden className={layer(face === "sending")}>
          <TextSpinner
            label=""
            className={cn(
              primary ? "text-primary-foreground" : "text-muted-foreground",
            )}
          />
        </span>
        <span aria-hidden className={layer(face === "stop")}>
          <Square className="size-3 fill-current" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * `ChatComposerSubmit` — the one round action at the end of the row, the size of the icon buttons:
 * ↑ Send (a quiet outline while there is nothing to send), the bolt spinner while the message goes,
 * ■ Stop while the agent works (with the root's `onStop`), held while it winds down. Its name
 * follows its face. A double click on Send never lands on the Stop that replaces it. With `queues`
 * and text in the box while it works, a Send stands beside Stop, for a phone with no Enter.
 *
 * @example
 * <ChatComposerActionsEnd><ChatComposerSubmit /></ChatComposerActionsEnd>
 */
export function ChatComposerSubmit() {
  const composer = useComposer("ChatComposerSubmit");
  const { labels, state, sending, pending, canSend, stop, queues, empty } =
    composer;
  const stopLabel =
    state === "stopping"
      ? (labels?.stopping ?? "Stopping")
      : (labels?.stop ?? "Stop");
  const sendLabel = sending
    ? (labels?.sending ?? "Sending")
    : (labels?.send ?? "Send");
  const send = () => void composer.submit(composer.body);
  if (!stop) {
    return (
      <ActionButton
        slot="chat-composer-send"
        face={sending ? "sending" : "send"}
        label={sendLabel}
        primary={canSend || sending}
        disabled={!canSend}
        onClick={send}
      />
    );
  }
  // While it works, a held message still needs a button on a phone: Send stands beside Stop.
  const steerSend = queues && (!empty || pending);
  return (
    <>
      {steerSend ? (
        <ActionButton
          slot="chat-composer-send"
          face={pending ? "sending" : "send"}
          label={sendLabel}
          primary={canSend}
          disabled={!canSend}
          onClick={send}
        />
      ) : null}
      <ActionButton
        slot="chat-composer-stop"
        face="stop"
        label={stopLabel}
        primary
        disabled={state === "stopping"}
        onClick={stop}
      />
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Steers (drawn by the root, above the card)
 * ----------------------------------------------------------------------------------------------*/

function SteerRow({
  steer,
  onCancel,
  disabled,
  labels,
}: {
  steer: ComposerSteer;
  disabled: boolean;
  onCancel?: (id: string) => void;
  labels?: ChatComposerLabels;
}) {
  const queued = steer.state === "queued";
  return (
    <li
      data-slot="chat-composer-steer"
      data-state={steer.state}
      className="flex min-h-7 min-w-0 animate-in items-center gap-1.5 ps-3.5 pe-1 text-xs text-muted-foreground duration-layout ease-enter fade-in-0 slide-in-from-bottom-1"
    >
      <CornerDownRight
        aria-hidden
        className="size-3.5 shrink-0 rtl:-scale-x-100"
      />
      <span className="min-w-0 truncate text-foreground">“{steer.text}”</span>
      <span aria-hidden className="shrink-0">
        ·
      </span>
      <span className="shrink-0">
        {queued
          ? (labels?.steerQueued ?? "read after this step")
          : (labels?.steerRead ?? "read")}
      </span>
      {queued && onCancel ? (
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`${labels?.cancelSteer ?? "Take back"}: ${steer.text}`}
          disabled={disabled}
          onClick={() => onCancel(steer.id)}
          className="ms-auto size-6 text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </li>
  );
}
