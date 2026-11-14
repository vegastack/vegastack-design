// @vegastack chat-composer@0.81.0 sha256-eYNXICMzGwLBSobE6t5q3kjaltosbBEV9xSXSEl4MLw=

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
 *   │ ✳ Talking to William ▾ · Chief of staff        [Plan]│  ChatComposerHeader (optional)
 *   ├──────────────────────────────────────────────────────┤
 *   │ [q3.pdf ×] [photo]                                   │  ChatComposerAttachments
 *   │ Ask William anything…                                │  ChatComposerInput
 *   │ (+) (@)                     Haiku 5.5 Medium ▾  (↑)  │  ChatComposerActions
 *   ╰──────────────────────────────────────────────────────╯
 *
 * One radius: the card is `rounded-3xl` (2.2 × --radius, 22px). Everything inside is concentric
 * with it: the header and the actions row sit 6px in with fully round 32px controls (22 − 1 − 6 ≈
 * 16), the attachments 10px in with `rounded-lg` tiles (22 − 1 − 10 ≈ 10). A `ChatComposerNotice`
 * runs edge to edge on the top edge. Steers wait above the card, a failed send says so under it.
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
  /** The card's parts: `ChatComposerNotice`, `ChatComposerHeader`, `ChatComposerAttachments`, `ChatComposerInput`, `ChatComposerActions`. @default undefined */
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
}

/**
 * `ChatComposer` — the root: a card (one 22px radius, one hairline that darkens a little while the
 * text has focus) that owns the turn. Enter sends and Shift+Enter breaks the line, except on a
 * phone, where return breaks the line and Send sends. Send morphs in place — a braille spinner while
 * the message goes (`state="sending"`), Stop while the agent works (`running`), Stop held while it
 * winds down (`stopping`). Typing carries on meanwhile; with `queues`, Enter sends it as a steer,
 * which the host shows in `steers` above the card. Files dropped or pasted on the card go to
 * `onFiles`.
 *
 * @example
 * <ChatComposer state={state} onSubmit={send} onStop={stop} attachments={files} onFiles={upload}>
 *   <ChatComposerHeader>
 *     <ChatComposerHeaderTrigger media={<Sparkle />} description="Chief of staff">
 *       Talking to William
 *     </ChatComposerHeaderTrigger>
 *     <ComposerChip pressed={plan} onPressedChange={setPlan}>Plan</ComposerChip>
 *   </ChatComposerHeader>
 *   <ChatComposerAttachments />
 *   <ChatComposerInput placeholder="Ask William anything…" mentions={mentions} />
 *   <ChatComposerActions>
 *     <ChatComposerActionsStart>
 *       <ChatComposerAddButton onClick={pickFiles} />
 *       <ChatComposerMentionButton />
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
    replace("", true);
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
          data-slot="chat-composer-box"
          data-disabled={disabled ? "" : undefined}
          data-dragging={dragging ? "" : undefined}
          className={cn(
            // One radius; the hairline darkens a little while the text has focus (FOC-14's
            // text-entry cue). Nothing on it ever turns red: a failed send says so under it.
            "relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-chat-hairline bg-background transition-[border-color] duration-quick ease-standard has-[[contenteditable=true]:focus]:border-ring/50",
            disabled && "bg-muted/40",
          )}
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
              className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-3xl border-2 border-dashed border-primary bg-background/90 text-sm font-medium text-primary"
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
   * `info` is neutral; `warning` draws ⚠ in the warning ink; `progress` leads with the braille
   * loader ("⠹ Reconnecting"), the one moving thing. The card never turns red. @default "info"
   */
  tone?: "info" | "warning" | "progress";
  /** Replaces the tone's lead. @default ⓘ, ⚠ or the braille loader by tone */
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
  progress: <TextSpinner label="" />,
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
 * Header — the context strip
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ChatComposerHeader`. */
export type ChatComposerHeaderProps = React.ComponentPropsWithRef<"div">;

/**
 * `ChatComposerHeader` — the context strip on the card's top, a hairline under it: who or what the
 * message goes to (`ChatComposerHeaderTrigger`, which takes the strip's width), then anything that
 * belongs at its end, such as the Plan `ComposerChip`. Optional: a quick ask may have none.
 *
 * @example
 * <ChatComposerHeader>
 *   <ChatComposerHeaderTrigger media={<Avatar … />} description="Chief of staff">Talking to William</ChatComposerHeaderTrigger>
 *   <ComposerChip pressed={plan} onPressedChange={setPlan}>Plan</ComposerChip>
 * </ChatComposerHeader>
 */
export function ChatComposerHeader({
  className,
  ...props
}: ChatComposerHeaderProps) {
  return (
    <div
      data-slot="chat-composer-header"
      className={cn(
        "flex min-w-0 items-center gap-1 border-b border-chat-hairline p-1.5 *:not-data-[slot=chat-composer-header-trigger]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ChatComposerHeaderTrigger`. */
export interface ChatComposerHeaderTriggerProps extends Omit<
  React.ComponentProps<typeof Button>,
  "size" | "variant"
> {
  /** What it reads: "Talking to William". */
  children: React.ReactNode;
  /** Leads the words: an `Avatar` (size 20) or an icon. @default undefined */
  media?: React.ReactNode;
  /** Muted words after the chevron, the first to give way on a narrow card: a role, "Chief of staff". @default undefined */
  description?: React.ReactNode;
  /** Draw the ▾ that says it opens a list. Off for a strip that only names its target. @default true */
  chevron?: boolean;
}

/**
 * `ChatComposerHeaderTrigger` — the context strip's one control: media, the words, ▾ and a muted
 * description, as one round ghost button that fills the strip. It spreads every prop onto its
 * button, so a menu can render it (`<ChatMenu trigger={<ChatComposerHeaderTrigger …/>}>`).
 *
 * @example
 * <ChatMenu trigger={<ChatComposerHeaderTrigger media={<Sparkle />} description="Chief of staff">Talking to William</ChatComposerHeaderTrigger>}>
 *   {agents}
 * </ChatMenu>
 */
export function ChatComposerHeaderTrigger({
  children,
  media,
  description,
  chevron = true,
  className,
  ...props
}: ChatComposerHeaderTriggerProps) {
  return (
    <Button
      variant="ghost"
      data-slot="chat-composer-header-trigger"
      className={cn(
        "h-8 min-w-0 flex-1 justify-start gap-1.5 rounded-full ps-2 pe-3 text-sm font-normal",
        className,
      )}
      {...props}
    >
      {media ? (
        <span
          aria-hidden
          data-slot="chat-composer-header-media"
          className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full [&_svg:not([class*='size-'])]:size-4"
        >
          {media}
        </span>
      ) : null}
      <span className="min-w-0 shrink truncate font-medium text-foreground">
        {children}
        {description ? <span className="sr-only">,</span> : null}
      </span>
      {chevron ? (
        <ChevronDown aria-hidden className="size-3.5 shrink-0" />
      ) : null}
      {description ? (
        <span
          data-slot="chat-composer-header-description"
          className="min-w-0 shrink-2 truncate text-muted-foreground"
        >
          <span aria-hidden>· </span>
          {description}
        </span>
      ) : null}
    </Button>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Attachments
 * ----------------------------------------------------------------------------------------------*/

/** A long name keeps its start and its extension: "quarterly-pri…-2026.pdf". */
export function middleEllipsis(name: string, max = 28): string {
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
        backgroundImage: `conic-gradient(var(--color-foreground) ${percent}%, var(--color-border) 0)`,
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
      className="size-6 rounded-full text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3"
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
        className="group/attachment relative size-14 shrink-0 overflow-hidden rounded-lg border border-chat-hairline bg-chat-card"
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
                className="rounded-full"
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
      className="flex h-8 max-w-64 shrink-0 items-center gap-1.5 rounded-lg border border-chat-hairline bg-chat-card ps-2 pe-1 text-xs"
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
          className="size-6 rounded-full text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3"
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
        "flex min-w-0 items-center gap-1.5 overflow-x-auto px-2.5 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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

/** Props accepted by `ChatComposerInput`. */
export interface ChatComposerInputProps {
  /** Shown while the box is empty: "Ask William anything…", "Type to steer, or wait…". @default undefined */
  placeholder?: string;
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
    <div data-slot="chat-composer-input" className="min-w-0">
      <TextEdit
        key={composer.draft.generation}
        handleRef={composer.box}
        format="markdown"
        // The card draws the frame and its focus cue; the editor is only the text.
        variant="document"
        defaultValue={composer.draft.value}
        placeholder={placeholder}
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
        minHeight={`${Math.max(1, minRows)}lh`}
        maxHeight={`${Math.max(minRows, maxRows)}lh`}
        className={cn("px-3.5 pt-2.5 pb-0.5 text-sm", className)}
      />
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
      className={cn("flex min-w-0 items-center gap-1 p-1.5", className)}
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
      className={cn("flex shrink-0 items-center gap-1", className)}
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
      className={cn("ms-auto flex min-w-0 items-center gap-1", className)}
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
        "shrink-0 rounded-full text-muted-foreground hover:text-foreground",
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
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-full",
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
 * ↑ Send (a quiet outline while there is nothing to send), a braille spinner while the message goes,
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
          className="ms-auto size-6 rounded-full text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </li>
  );
}
