// @vegastack chat-user-bubble@0.79.0 sha256-DK+r9F9WQYuM4f0d8CpEknXzPbCy7hkk4CsJxjJsdGk=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { FileText, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatChip } from "@/components/ui/chat-chip";
import { CopyButton } from "@/components/ui/copy-button";
import { MarkdownView } from "@/components/ui/markdown-view";

/** A file the person attached: the AI SDK's `file` part, structurally. */
export interface UserBubbleFile {
  url: string;
  mediaType: string;
  filename?: string;
}

/** Props accepted by `UserBubble`. */
export interface UserBubbleProps {
  /** What the person wrote, as Markdown (the composer's stored form). */
  text: string;
  /** Files attached to the message: images as thumbnails above the bubble, others as chips. @default undefined */
  files?: readonly UserBubbleFile[];
  /** Opens an attached file. @default undefined */
  onOpenFile?: (file: UserBubbleFile) => void;
  /** Lines shown before the message fades into "Show more". @default 9 */
  maxLines?: number;
  /** Edit the message (the source goes back into the composer). Shown on hover. @default undefined */
  onEdit?: () => void;
  /** When it was sent, already formatted ("14:02"). Shown on hover. @default undefined */
  time?: React.ReactNode;
  /** Where a mention links to; passed to the Markdown view. @default undefined */
  mentionHref?: React.ComponentProps<typeof MarkdownView>["mentionHref"];
  /** Extra classes on the root. @default undefined */
  className?: string;
}

/**
 * The person's own message, on the right: their Markdown rendered (bold, italic, code, lists, links,
 * mentions as chips), images as thumbnails above it. A long message is clipped at about nine lines,
 * the last 48px fading into the bubble's colour, with "Show more" (it opens on the chat's state
 * motion and becomes "Show less"). Copy and Edit keep the source and show on hover. Agent replies
 * are never clipped — this is for the person's messages only.
 *
 * @example
 * <UserBubble text={message.text} files={files} time="14:02" onEdit={edit} />
 */
function UserBubble({
  text,
  files,
  onOpenFile,
  maxLines = 9,
  onEdit,
  time,
  mentionHref,
  className,
}: UserBubbleProps) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [fullHeight, setFullHeight] = React.useState<number | null>(null);
  const bodyId = React.useId();

  React.useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => {
      const inner = body.firstElementChild as HTMLElement | null;
      const full = inner?.scrollHeight ?? body.scrollHeight;
      const lineHeight = parseFloat(getComputedStyle(body).lineHeight) || 20;
      setFullHeight(full);
      setOverflows(full > lineHeight * maxLines + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (body.firstElementChild) observer.observe(body.firstElementChild);
    return () => observer.disconnect();
  }, [text, maxLines]);

  const images = files?.filter((f) => f.mediaType.startsWith("image/")) ?? [];
  const others = files?.filter((f) => !f.mediaType.startsWith("image/")) ?? [];
  const clipped = overflows && !open;

  return (
    <div
      data-slot="user-bubble"
      className={cn(
        "group/user-bubble flex min-w-0 flex-col items-end gap-1.5",
        className,
      )}
    >
      {images.length ? (
        <div
          data-slot="user-bubble-images"
          className="flex max-w-full flex-wrap justify-end gap-1.5"
        >
          {images.map((file) => (
            <Button
              key={file.url}
              variant="ghost"
              onClick={() => onOpenFile?.(file)}
              aria-label={`Open ${file.filename ?? "image"}`}
              className="size-14 overflow-hidden rounded-lg border border-chat-hairline p-0"
            >
              <img
                src={file.url}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </Button>
          ))}
        </div>
      ) : null}
      {others.length ? (
        <div className="flex max-w-full flex-wrap justify-end gap-1.5">
          {others.map((file) => (
            <ChatChip
              key={file.url}
              icon={<FileText aria-hidden="true" strokeWidth={1.5} />}
              label={file.filename ?? file.mediaType}
              onClick={onOpenFile ? () => onOpenFile(file) : undefined}
            />
          ))}
        </div>
      ) : null}
      {text.trim() ? (
        <div
          data-slot="user-bubble-content"
          className="relative max-w-[85%] min-w-0 rounded-2xl bg-muted px-3.5 py-2 text-sm text-foreground max-sm:max-w-[90%]"
        >
          <div className="relative min-w-0">
            <div
              ref={bodyRef}
              id={bodyId}
              data-slot="user-bubble-body"
              data-clipped={clipped ? "" : undefined}
              // A link or mention below the fold opens the message before it takes focus's place.
              onFocus={clipped ? () => setOpen(true) : undefined}
              style={
                {
                  "--vs-bubble-lines": maxLines,
                  maxHeight:
                    open && fullHeight != null ? fullHeight : undefined,
                } as React.CSSProperties
              }
              className={cn(
                "min-w-0 overflow-hidden leading-6 transition-[max-height] duration-state ease-enter wrap-break-word",
                !open && "max-h-[calc(var(--vs-bubble-lines)*1lh)]",
              )}
            >
              <MarkdownView
                untrusted
                typeScale="compact"
                mentionHref={mentionHref}
              >
                {text}
              </MarkdownView>
            </div>
            {clipped ? (
              <div
                aria-hidden="true"
                data-slot="user-bubble-fade"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-muted to-transparent"
              />
            ) : null}
          </div>
          {overflows ? (
            <Button
              variant="link"
              size="xs"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => setOpen((value) => !value)}
              className="mt-1 h-7 px-0 text-muted-foreground hover:text-foreground"
              data-slot="user-bubble-more"
            >
              {open ? "Show less" : "Show more"}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div
        data-slot="user-bubble-actions"
        className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity duration-instant group-hover/user-bubble:opacity-100 group-focus-within/user-bubble:opacity-100 pointer-coarse:opacity-100"
      >
        {time != null ? (
          <span className="px-1 tabular-nums">{time}</span>
        ) : null}
        {text.trim() ? (
          <CopyButton
            value={text}
            variant="ghost"
            size="icon-xs"
            copyLabel="Copy message"
          />
        ) : null}
        {onEdit ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Edit message"
            onClick={onEdit}
          >
            <Pencil aria-hidden="true" strokeWidth={1.5} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { UserBubble };
