// @vegastack chat-composer@0.78.1 sha256-p81K8n2d1IQbFWvkciAzzARWYjM0biR1BAAkorY+dEA=

"use client";

import * as React from "react";
import {
  ArrowUp,
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
import { cn } from "@vegastack/design";

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
 * ChatComposer — the box a person talks to an agent in. Two lines at rest, one hairline, and only
 * two controls inside: + (attach and bring in) and Send. Send morphs in place: a braille spinner
 * while the message goes, then Stop while the agent works. What the person typed while it works
 * queues as a steer above the box; a notice sits on the box's top edge; the quiet line under the
 * box (`meta`, a `ComposerMeta`) holds Plan, the model and effort, and the chat memory ring.
 * `TextEdit` is the text, so a mention is the same chip a comment has.
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

/** Reach into the box from outside: a starter prompt filling it, the + menu's Mention item. */
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
  /** The box's name. @default "Message" */
  message?: string;
  /** @default "Send" */
  send?: string;
  /** Send while the message goes. @default "Sending" */
  sending?: string;
  /** @default "Stop" */
  stop?: string;
  /** Stop once pressed, while the agent winds down. @default "Stopping" */
  stopping?: string;
  /** The + button. @default "Add" */
  add?: string;
  /** @default "Drop to add to chat" */
  drop?: string;
  /** Under the box when a send fails, unless `error` says more. @default "Couldn't send. Try again." */
  sendFailed?: string;
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

/** Props accepted by `ChatComposer`. */
export interface ChatComposerProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onSubmit" | "defaultValue" | "children"
> {
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
  /** Shown while the box is empty: "Ask William anything…", "Type to steer, or wait…". @default undefined */
  placeholder?: string;
  /** Turn the whole box off. @default false */
  disabled?: boolean;
  /** Hold Send only: something isn't ready. Say why in `notice`. @default false */
  submitDisabled?: boolean;
  /** Files going with the message, in one row above the text. @default undefined */
  attachments?: readonly ComposerAttachment[];
  /** × on an attachment; Backspace in the empty box takes the last one off. @default undefined */
  onRemoveAttachment?: (id: string) => void;
  /** ↻ on a failed attachment. @default undefined */
  onRetryAttachment?: (id: string) => void;
  /**
   * Other things that travel with the message, in the same row after the files: the page's chip, a
   * skill for this turn. @default undefined
   */
  chips?: React.ReactNode;
  /**
   * The + menu's items (`ChatMenuItem`, `ChatMenuSeparator`): Upload files, From Library, Mention a
   * page or task. Without it, + calls `onAttach`; without either, there is no +.
   * @default undefined
   */
  addMenu?: React.ReactNode;
  /** + when there is no `addMenu`: open the host's file picker. @default undefined */
  onAttach?: () => void;
  /** Files pasted or dropped on the box. Without it, they go nowhere. @default undefined */
  onFiles?: (files: File[]) => void;
  /** `dataTransfer` types the box takes besides files: a record row dragged in. @default undefined */
  dropTypes?: readonly string[];
  /** One of `dropTypes` was dropped. @default undefined */
  onDropData?: (data: DataTransfer) => void;
  /** ↑ in the empty box: bring back the last message to edit. @default undefined */
  onEditLast?: () => void;
  /** Steers waiting above the box. @default undefined */
  steers?: readonly ComposerSteer[];
  /** × on a queued steer. @default undefined */
  onCancelSteer?: (id: string) => void;
  /** A notice on the box's top edge (a `ChatComposerNotice`): reconnecting, a held send, a limit. @default undefined */
  notice?: React.ReactNode;
  /** The quiet line under the box: a `ComposerMeta`. @default undefined */
  meta?: React.ReactNode;
  /** The message that failed to send, under the box; `onSubmit`'s rejection shows otherwise. @default undefined */
  error?: React.ReactNode;
  /** The starting text, as Markdown: a restored draft. @default undefined */
  defaultValue?: string;
  /** Every change of the text, as Markdown, and `""` once it sent. @default undefined */
  onValueChange?: (value: string) => void;
  /** Focus the box when it mounts. @default false */
  autoFocus?: boolean;
  /**
   * How tall the text may grow before it scrolls, as a share of the window's height. The box grows
   * upward from two lines.
   * @default 0.35
   */
  maxHeightRatio?: number;
  /** `@` mentions (see `TextEdit`'s `mentions`). @default undefined */
  mentions?: TextEditProps["mentions"];
  /** Where a mention chip links (see `TextEdit`'s `mentionHref`). @default undefined */
  mentionHref?: TextEditProps["mentionHref"];
  /** A person mention's avatar URL (see `TextEdit`'s `mentionImage`). @default undefined */
  mentionImage?: TextEditProps["mentionImage"];
  /** How a mention chip shows its target's state (see `TextEdit`'s `mentionStatus`). @default undefined */
  mentionStatus?: TextEditProps["mentionStatus"];
  /** Reach into the box. @default undefined */
  handleRef?: React.Ref<ChatComposerHandle>;
  /** The composer's words. @default undefined */
  labels?: ChatComposerLabels;
}

/** Props accepted by `ChatComposerNotice`. */
export interface ChatComposerNoticeProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** What the person should know: "Reconnecting — your agent kept working". */
  children: React.ReactNode;
  /**
   * `info` is neutral; `warning` draws ⚠ in the warning ink; `progress` leads with the braille
   * loader ("⠹ Reconnecting"), the one moving thing. The box never turns red. @default "info"
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
   * The notice appeared because of something the person just did (a send was held): announce it
   * politely. A notice present when the chat opens stays silent. @default false
   */
  live?: boolean;
}

const NOTICE_LEAD = {
  info: <Info aria-hidden className="text-muted-foreground" />,
  warning: <TriangleAlert aria-hidden className="text-warning-text" />,
  progress: <TextSpinner label="" />,
} as const;

/**
 * `ChatComposerNotice` — a line on `ChatComposer`'s top edge (its `notice` prop), inside the box's
 * hairline with a hairline under it: a lead, the words, an optional action and an optional ✕.
 *
 * @example
 * <ChatComposer
 *   notice={
 *     <ChatComposerNotice
 *       tone="progress"
 *       action={<Button size="xs" variant="ghost" onClick={reload}>Reload</Button>}
 *     >
 *       Reconnecting — your agent kept working
 *     </ChatComposerNotice>
 *   }
 * />
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
        "flex min-h-9 min-w-0 animate-in items-center gap-2 border-b border-chat-hairline py-1 ps-4 pe-4 text-xs text-muted-foreground duration-quick ease-enter fade-in-0 has-[button]:pe-1.5",
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

/** One row that scrolls sideways, fading at the edge it can scroll toward. */
function AttachmentRow({ children }: { children: React.ReactNode }) {
  const row = React.useRef<HTMLUListElement>(null);
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
  React.useLayoutEffect(() => {
    measure();
    const el = row.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, children]);
  return (
    <ul
      ref={row}
      data-slot="chat-composer-attachments"
      data-fade-start={edges.start ? "" : undefined}
      data-fade-end={edges.end ? "" : undefined}
      onScroll={measure}
      className={cn(
        "-mx-1 flex min-w-0 items-center gap-1.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        edges.end &&
          !edges.start &&
          "[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] rtl:[mask-image:linear-gradient(to_left,black_calc(100%-2rem),transparent)]",
        edges.start &&
          !edges.end &&
          "[mask-image:linear-gradient(to_left,black_calc(100%-2rem),transparent)] rtl:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]",
        edges.start &&
          edges.end &&
          "[mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]",
      )}
    >
      {children}
    </ul>
  );
}

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
      className="flex min-h-7 min-w-0 animate-in items-center gap-1.5 ps-4 pe-1 text-xs text-muted-foreground duration-layout ease-enter fade-in-0 slide-in-from-bottom-1"
    >
      <CornerDownRight aria-hidden className="size-3.5 shrink-0" />
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
            data-slot={slot}
            data-face={face}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "relative overflow-hidden rounded-full",
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
 * `ChatComposer` — the box a person talks to an agent in: a row of files and chips above the text,
 * the text with `@` mentions, + at the start and Send at the end. Send morphs in place — a braille
 * spinner while the message goes (`state="sending"`), Stop while the agent works (`running`), Stop
 * held while it winds down (`stopping`). Typing carries on meanwhile; with `queues`, Enter sends it
 * as a steer, which the host shows in `steers` above the box. Enter sends and Shift+Enter breaks
 * the line, except on a phone, where return breaks the line and the button sends. The box grows
 * upward to `maxHeightRatio` of the window, then scrolls.
 *
 * @example
 * <ChatComposer
 *   placeholder="Ask William anything…"
 *   state={state}
 *   onSubmit={send}
 *   onStop={stop}
 *   addMenu={<ChatMenuItem onSelect={upload}>Upload files</ChatMenuItem>}
 *   meta={<ComposerMeta privacy="Private · AI can make mistakes" />}
 * />
 */
export function ChatComposer({
  onSubmit,
  onStop,
  state = "idle",
  queues = false,
  placeholder,
  disabled = false,
  submitDisabled = false,
  attachments,
  onRemoveAttachment,
  onRetryAttachment,
  chips,
  addMenu,
  onAttach,
  onFiles,
  dropTypes,
  onDropData,
  onEditLast,
  steers,
  onCancelSteer,
  notice,
  meta,
  error: errorProp,
  defaultValue,
  onValueChange,
  autoFocus = false,
  maxHeightRatio = 0.35,
  mentions,
  mentionHref,
  mentionImage,
  mentionStatus,
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

  const stopLabel =
    state === "stopping"
      ? (labels?.stopping ?? "Stopping")
      : (labels?.stop ?? "Stop");
  const sendLabel = sending
    ? (labels?.sending ?? "Sending")
    : (labels?.send ?? "Send");
  const showStop = working && !!onStop;
  // While it works, a held message still needs a button on a phone: Send stands beside Stop.
  const steerSend = showStop && queues && (!empty || pending);
  const main: React.ReactNode = showStop ? (
    <ActionButton
      slot="chat-composer-stop"
      face="stop"
      label={stopLabel}
      primary
      disabled={state === "stopping"}
      onClick={() => {
        if (Date.now() - sentAt.current > STOP_GUARD_MS) onStop?.();
      }}
    />
  ) : (
    <ActionButton
      slot="chat-composer-send"
      face={sending ? "sending" : "send"}
      label={sendLabel}
      primary={canSend || sending}
      disabled={!canSend}
      onClick={() => void submit(body)}
    />
  );

  const addLabel = labels?.add ?? "Add";
  const plusButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={addLabel}
      data-slot="chat-composer-add"
      disabled={disabled}
      className="rounded-full text-muted-foreground hover:text-foreground"
    >
      <Plus aria-hidden />
    </Button>
  );
  const plus = addMenu ? (
    <ChatMenu trigger={plusButton} side="top" align="start">
      {addMenu}
    </ChatMenu>
  ) : onAttach ? (
    <Tooltip>
      <TooltipTrigger
        render={React.cloneElement(plusButton, { onClick: onAttach })}
      />
      <TooltipContent>{addLabel}</TooltipContent>
    </Tooltip>
  ) : null;

  const above =
    hasAttachments || chips ? (
      <AttachmentRow>
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
        {chips ? (
          <li
            data-slot="chat-composer-chips"
            className="flex shrink-0 items-center gap-1.5"
          >
            {chips}
          </li>
        ) : null}
      </AttachmentRow>
    ) : undefined;

  return (
    <div
      data-slot="chat-composer"
      data-state={state}
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    >
      {steers?.length ? (
        <ul
          data-slot="chat-composer-steers"
          aria-label="Waiting to be read"
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
        data-dragging={dragging ? "" : undefined}
        className="relative min-w-0"
        onKeyDownCapture={(event) => {
          const inBox = (event.target as HTMLElement).closest("[role=textbox]");
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
                if (!files.length || event.clipboardData.getData("text/plain"))
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
        <TextEdit
          key={draft.generation}
          handleRef={box}
          format="markdown"
          variant="boxed"
          defaultValue={draft.value}
          placeholder={placeholder}
          aria-label={labels?.message ?? "Message"}
          aria-describedby={error ? errorId : undefined}
          onValueChange={(value) => {
            if (value === body) return;
            setBody(value);
            setFailed(false);
            onValueChange?.(value);
          }}
          onSubmit={(value) => void submit(value)}
          submitOnEnter
          escapeBehavior="blur"
          slashCommands={[]}
          slashHint={false}
          dragHandles={false}
          inset="none"
          saving={sending}
          disabled={disabled}
          mentions={mentions}
          mentionHref={mentionHref}
          mentionImage={mentionImage}
          mentionStatus={mentionStatus}
          minHeight="3rem"
          maxHeight={`${Math.round(maxHeightRatio * 100)}dvh`}
          // The box draws the frame; the editor inside is its padding and its text.
          // TextEdit is the frame: one hairline that darkens a little while the text has focus
          // (FOC-14's text-entry cue). Nothing on it ever turns red: a failed send says so in
          // words under it.
          className="overflow-hidden rounded-2xl border-chat-hairline bg-background px-4 pt-3.5 pb-2.5 dark:bg-background"
          header={
            notice || above ? (
              <>
                {notice ? (
                  // The notice runs edge to edge on the box's top edge, a hairline under it.
                  <div
                    data-slot="chat-composer-notice-slot"
                    className="-mx-4 -mt-3.5 mb-2.5"
                  >
                    {notice}
                  </div>
                ) : null}
                {above}
              </>
            ) : undefined
          }
        >
          <div
            data-slot="chat-composer-toolbar"
            className="-ms-2 -me-1.5 flex items-center gap-1 pt-1"
          >
            {plus}
            <div
              data-slot="chat-composer-actions"
              className="ms-auto flex shrink-0 items-center gap-1.5"
            >
              {steerSend ? (
                <ActionButton
                  slot="chat-composer-send"
                  face={pending ? "sending" : "send"}
                  label={sendLabel}
                  primary={canSend}
                  disabled={!canSend}
                  onClick={() => void submit(body)}
                />
              ) : null}
              {main}
            </div>
          </div>
        </TextEdit>
        {dragging ? (
          <div
            aria-hidden
            data-slot="chat-composer-drop"
            className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-background/80 text-sm font-medium text-primary"
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
          className="px-1 text-xs text-destructive-text"
        >
          {error}
        </p>
      ) : null}
      {meta}
    </div>
  );
}
