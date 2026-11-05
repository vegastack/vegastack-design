// @vegastack chat-composer@0.43.0 sha256-ueCL4sf5+PVMp8fviRyjzObpynKcvaE21RsYyRmmxdw=

"use client";

import * as React from "react";
import { ArrowUp, AtSign, Paperclip, Square } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import {
  TextEdit,
  type TextEditHandle,
  type TextEditProps,
} from "@/components/ui/text-edit";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ChatComposer — the box a person talks to an agent in. `TextEdit` is the text, so a mention is the
 * same chip a comment has; what this adds is what a chat does differently from a comment: Enter
 * sends, the send button turns into Stop while the agent answers, typing carries on meanwhile, and
 * chips above the text say what travels with the message.
 * ----------------------------------------------------------------------------------------------*/

/** Where the turn stands. */
export type ChatComposerStatus = "idle" | "sending" | "streaming";

/** Reach into the box from outside: a starter prompt filling it, a panel opening. */
export interface ChatComposerHandle {
  /** Put the caret in the box, at the end of the text. */
  focus: () => void;
  /**
   * Replace the text: a starter prompt, a message brought back to edit, a draft that arrived after
   * the box mounted. Focuses the box unless `focus` is false.
   */
  setValue: (value: string, options?: { focus?: boolean }) => void;
}

/** The composer's words. */
export interface ChatComposerLabels {
  /** The box's name. @default "Message" */
  message?: string;
  /** @default "Send" */
  send?: string;
  /** @default "Stop" */
  stop?: string;
  /** @default "Add files" */
  attach?: string;
  /** @default "Mention" */
  mention?: string;
  /** @default "Drop to add to chat" */
  drop?: string;
  /** Under the box when a send fails, unless `error` says more. @default "Couldn't send. Try again." */
  sendFailed?: string;
}

/** Props accepted by `ChatComposer`. */
export interface ChatComposerProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onSubmit" | "defaultValue" | "children"
> {
  /**
   * Send the message, as Markdown. The box clears at once, so the person can start the next one;
   * Send stays busy while a promise is pending, so it may resolve when the send is accepted, not
   * when the answer ends. A rejection, or resolving `false` (a question first: "Send without the
   * skill?"), puts the text back, ahead of anything typed since. Without it, Send stays off.
   * @default undefined
   */
  onSubmit?: (value: string) => void | boolean | Promise<unknown>;
  /** Stop the answer. Without it, there is no Stop while streaming. @default undefined */
  onStop?: () => void;
  /**
   * `sending` — the message is on its way. `streaming` — the agent is answering: the send button
   * becomes Stop and the person can keep typing their next message.
   * @default "idle"
   */
  status?: ChatComposerStatus;
  /**
   * Enter still sends while `streaming`, for a host that holds the message until the answer ends.
   * The button stays Stop. @default false
   */
  queues?: boolean;
  /** Shown while the box is empty. @default undefined */
  placeholder?: string;
  /** Turn the whole box off. @default false */
  disabled?: boolean;
  /**
   * Hold Send only: something isn't ready (a file still uploading). The reason goes in
   * `submitDisabledReason`. @default false
   */
  submitDisabled?: boolean;
  /** Why Send is held, in a line under the box: "datasheet.pdf is still uploading". @default undefined */
  submitDisabledReason?: string;
  /** There is something to send besides the text, so an empty box may send. @default false */
  hasAttachments?: boolean;
  /** What travels with the message, above the text: the page's chip, attached files. @default undefined */
  chips?: React.ReactNode;
  /** The 📎 button: open the host's uploads picker. Without it, there is no button. @default undefined */
  onAttach?: () => void;
  /** Files pasted or dropped on the box. Without it, they go nowhere. @default undefined */
  onFiles?: (files: File[]) => void;
  /** `dataTransfer` types the box takes besides files: a record row dragged in. @default undefined */
  dropTypes?: readonly string[];
  /** One of `dropTypes` was dropped. @default undefined */
  onDropData?: (data: DataTransfer) => void;
  /** ↑ in the empty box: bring back the last message to edit. @default undefined */
  onEditLast?: () => void;
  /** The line under the box: who can see this chat. @default undefined */
  hint?: React.ReactNode;
  /** The message that failed to send, under the box; `onSubmit`'s rejection shows otherwise. @default undefined */
  error?: React.ReactNode;
  /** The starting text, as Markdown: a restored draft. @default undefined */
  defaultValue?: string;
  /** Every change of the text, as Markdown, and `""` once it sent. @default undefined */
  onValueChange?: (value: string) => void;
  /** Focus the box when it mounts. @default false */
  autoFocus?: boolean;
  /** `@` mentions (see `TextEdit`'s `mentions`); also adds the @ button. @default undefined */
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

function ToolButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="rounded-full text-muted-foreground hover:text-foreground"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * `ChatComposer` — the box a person talks to an agent in: chips for what travels with the message,
 * the text with `@` mentions, 📎 and @ at the start of its toolbar, and Send at the end, which turns
 * into Stop while the agent answers. Enter sends and Shift+Enter breaks the line, except on a phone,
 * where return breaks the line and the button sends. It grows to about eight lines, then scrolls.
 *
 * @example
 * <ChatComposer
 *   placeholder="Ask anything, or @ an agent…"
 *   status={status}
 *   onSubmit={send}
 *   onStop={stop}
 *   hint="Only you can see this chat"
 * />
 */
export function ChatComposer({
  onSubmit,
  onStop,
  status = "idle",
  queues = false,
  placeholder,
  disabled = false,
  submitDisabled = false,
  submitDisabledReason,
  hasAttachments = false,
  chips,
  onAttach,
  onFiles,
  dropTypes,
  onDropData,
  onEditLast,
  hint,
  error: errorProp,
  defaultValue,
  onValueChange,
  autoFocus = false,
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
  const heldId = React.useId();
  const hintId = React.useId();

  const sending = status === "sending" || pending;
  const streaming = status === "streaming";
  const error =
    errorProp ??
    (failed ? (labels?.sendFailed ?? "Couldn't send. Try again.") : null);
  const empty = !sendable(body) && !hasAttachments;
  const canSend =
    !!onSubmit &&
    !disabled &&
    !submitDisabled &&
    !sending &&
    (!streaming || queues) &&
    !empty;
  const held = submitDisabled ? submitDisabledReason : undefined;

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
    sentAt.current = Date.now();
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

  const sendLabel = labels?.send ?? "Send";
  const idleSend = !canSend && !sending;
  const action =
    streaming && onStop ? (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              aria-label={labels?.stop ?? "Stop"}
              data-slot="chat-composer-stop"
              onClick={() => {
                if (Date.now() - sentAt.current > STOP_GUARD_MS) onStop();
              }}
              className="rounded-full"
            />
          }
        >
          <Square aria-hidden className="fill-current" />
        </TooltipTrigger>
        <TooltipContent>{labels?.stop ?? "Stop"}</TooltipContent>
      </Tooltip>
    ) : (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              variant={idleSend ? "secondary" : "default"}
              aria-label={sendLabel}
              data-slot="chat-composer-send"
              loading={sending}
              disabled={!canSend}
              onClick={() => void submit(body)}
              className="rounded-full data-disabled:not-data-loading:text-muted-foreground data-disabled:not-data-loading:opacity-100"
            />
          }
        >
          <ArrowUp aria-hidden />
        </TooltipTrigger>
        <TooltipContent>{sendLabel}</TooltipContent>
      </Tooltip>
    );

  return (
    <div
      data-slot="chat-composer"
      data-status={status}
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
      {...props}
    >
      <div
        data-slot="chat-composer-box"
        data-dragging={dragging ? "" : undefined}
        className="relative min-w-0"
        onKeyDownCapture={(event) => {
          if (
            event.key !== "ArrowUp" ||
            !onEditLast ||
            !(event.target as HTMLElement).closest("[role=textbox]") ||
            sendable(body) ||
            hasAttachments ||
            event.shiftKey ||
            event.altKey ||
            event.metaKey ||
            event.ctrlKey
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
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : null, held ? heldId : null, hint ? hintId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
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
          minHeight="1.5rem"
          maxHeight="10rem"
          className="dark:bg-transparent"
          header={
            chips ? (
              <div
                data-slot="chat-composer-chips"
                className="flex min-w-0 flex-wrap gap-1 pb-1.5"
              >
                {chips}
              </div>
            ) : undefined
          }
        >
          <div
            data-slot="chat-composer-toolbar"
            className="flex items-center gap-1 pt-1.5"
          >
            {onAttach ? (
              <ToolButton
                label={labels?.attach ?? "Add files"}
                disabled={disabled}
                onClick={onAttach}
              >
                <Paperclip aria-hidden />
              </ToolButton>
            ) : null}
            {mentions ? (
              <ToolButton
                label={labels?.mention ?? "Mention"}
                disabled={disabled}
                onClick={() => box.current?.openMentionMenu()}
              >
                <AtSign aria-hidden />
              </ToolButton>
            ) : null}
            <span className="ms-auto inline-flex">{action}</span>
          </div>
        </TextEdit>
        {dragging ? (
          <div
            aria-hidden
            data-slot="chat-composer-drop"
            className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-background/80 text-sm font-medium text-primary"
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
          className="text-xs text-destructive-text"
        >
          {error}
        </p>
      ) : null}
      {held ? (
        <p
          id={heldId}
          data-slot="chat-composer-held"
          className="text-xs text-muted-foreground"
        >
          {held}
        </p>
      ) : null}
      {hint ? (
        <p
          id={hintId}
          data-slot="chat-composer-hint"
          className="text-xs text-muted-foreground"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
