// @vegastack chat-card@0.83.0 sha256-Sjt+4cp6DaYSoEBn47cHej+MLgNokqRQ4Jv3kLoJjoE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatusGlyph, type ChatStatus } from "@/components/ui/status-glyph";
import { TextSpinner } from "@/components/ui/text-spinner";

/** Props accepted by `ChatCard`. */
export interface ChatCardProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
  /** A ref to the card's element. @default undefined */
  ref?: React.Ref<HTMLElement>;
  /** The header's title, 14px semibold. @default undefined */
  title?: React.ReactNode;
  /** Quiet words after the title ("4 steps", "Waiting for you"). @default undefined */
  meta?: React.ReactNode;
  /** Something at the header's far end: a menu, a count, a close. @default undefined */
  aside?: React.ReactNode;
  /** The card's actions, in a row under the body. @default undefined */
  actions?: React.ReactNode;
  /** One muted line under everything ("Only you can see this"). @default undefined */
  footnote?: React.ReactNode;
  /** `section` for a card with a title, `div` inside a list. @default "section" */
  as?: "section" | "div";
}

/**
 * The one card surface in agent UI (COL-25), for something a person acts on or opens — a waiting
 * request, question or plan, the task list, a file preview. Everything else in a chat is a flat
 * line. A faint fill one step off the page and a hairline, the same in light and dark, a 12px
 * corner, 16px padding (12px under 640px), no shadow.
 *
 * @example
 * <ChatCard title="Send this email?" meta="Gmail · sm@vegastack.com" actions={<Button>Allow once</Button>}>
 *   Weekly summary to the sales team.
 * </ChatCard>
 */
function ChatCard({
  title,
  meta,
  aside,
  actions,
  footnote,
  as: Element = "section",
  className,
  children,
  ref,
  ...props
}: ChatCardProps) {
  const header = title != null || meta != null || aside != null;
  return (
    <Element
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="chat-card"
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-chat-card border border-chat-hairline bg-chat-card p-4 text-sm max-sm:p-3",
        className,
      )}
      {...props}
    >
      {header ? (
        <div
          data-slot="chat-card-header"
          className="flex min-w-0 items-baseline gap-2"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {title != null ? (
              <span
                data-slot="chat-card-title"
                className="min-w-0 font-semibold text-foreground"
              >
                {title}
              </span>
            ) : null}
            {meta != null ? (
              <span
                data-slot="chat-card-meta"
                className="min-w-0 text-xs text-muted-foreground tabular-nums"
              >
                {meta}
              </span>
            ) : null}
          </div>
          {aside != null ? (
            <div
              data-slot="chat-card-aside"
              className="flex shrink-0 items-center gap-1 self-center"
            >
              {aside}
            </div>
          ) : null}
        </div>
      ) : null}
      {children != null ? (
        <div data-slot="chat-card-body" className="min-w-0">
          {children}
        </div>
      ) : null}
      {actions != null ? (
        <div
          data-slot="chat-card-actions"
          className="flex min-w-0 flex-wrap items-center gap-2"
        >
          {actions}
        </div>
      ) : null}
      {footnote != null ? (
        <p
          data-slot="chat-card-footnote"
          className="min-w-0 text-xs text-muted-foreground"
        >
          {footnote}
        </p>
      ) : null}
    </Element>
  );
}

/** How long something took, the chat's way: `<1s`, `41s`, `1m 20s`, `2h 5m`. */
function formatChatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const rest = seconds % 60;
    return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Props accepted by `ChatRow`. */
export interface ChatRowProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The muted verb before the subject ("Searched", "Opened"). @default undefined */
  verb?: React.ReactNode;
  /** What the row is about, in the body ink; it truncates first. */
  subject: React.ReactNode;
  /** Quiet words right after the subject ("3 results"). @default undefined */
  meta?: React.ReactNode;
  /** A state glyph in the row's gutter. @default undefined */
  status?: ChatStatus;
  /** How long it took, right after `meta` (never floated to the far edge). @default undefined */
  durationMs?: number;
  /** Makes the row a button that opens what it names. @default undefined */
  onOpen?: () => void;
  /** Makes the row a link to what it names. @default undefined */
  href?: string;
}

// Rows hang: the text starts on the column (the prose), the hover fill reaches 8px into the gutter.
const ROW =
  "-mx-2 flex min-h-7 min-w-0 items-center gap-2 rounded-md px-2 text-start text-sm";

/**
 * One line of work in a chat: an optional state glyph, a muted verb, the subject in the body ink,
 * then quiet meta and the duration right after it. 28px tall; a row that opens something takes the
 * hover layer.
 *
 * @example
 * <ChatRow status="done" verb="Searched" subject="Indian lighting makers" meta="8 results" durationMs={4200} />
 *
 * @example
 * <ChatRow verb="Opened" subject="regentlighting.com" href="https://regentlighting.com" />
 */
function ChatRow({
  verb,
  subject,
  meta,
  status,
  durationMs,
  onOpen,
  href,
  className,
  ...props
}: ChatRowProps) {
  const content = (
    <>
      {status ? <StatusGlyph status={status} /> : null}
      {verb != null ? (
        <span
          data-slot="chat-row-verb"
          className="shrink-0 text-muted-foreground"
        >
          {verb}
        </span>
      ) : null}
      {/* Whitespace between the parts, so an accessible name reads "Opened Quote sheet"; flex
          drops it from the layout. */}{" "}
      <span
        data-slot="chat-row-subject"
        className="min-w-0 truncate text-foreground"
      >
        {subject}
      </span>{" "}
      {meta != null || durationMs != null ? (
        <span
          data-slot="chat-row-meta"
          className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground tabular-nums"
        >
          {meta}{" "}
          {durationMs != null ? (
            <span data-slot="chat-row-duration">
              {formatChatDuration(durationMs)}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );
  if (href) {
    return (
      <div
        data-slot="chat-row"
        data-status={status}
        className={cn("min-w-0", className)}
        {...props}
      >
        <a
          href={href}
          className={cn(ROW, "state-layer no-underline")}
          data-slot="chat-row-link"
        >
          {content}
        </a>
      </div>
    );
  }
  if (onOpen) {
    return (
      <div
        data-slot="chat-row"
        data-status={status}
        className={cn("min-w-0", className)}
        {...props}
      >
        <Button
          variant="ghost"
          onClick={onOpen}
          className={cn(
            ROW,
            "h-auto w-[calc(100%+1rem)] justify-start border-0 font-normal whitespace-normal",
          )}
          data-slot="chat-row-button"
        >
          {content}
        </Button>
      </div>
    );
  }
  return (
    <div
      data-slot="chat-row"
      data-status={status}
      className={cn(ROW, className)}
      {...props}
    >
      {content}
    </div>
  );
}

/** Props accepted by `ChatGroup`. */
export interface ChatGroupProps {
  /** The fold's one-line summary ("Worked for 41s · searched 3 times, opened 4 sites"). */
  summary: React.ReactNode;
  /** While the work is live, the summary leads with the braille `TextSpinner`. @default false */
  live?: boolean;
  /** Controlled open state. @default undefined */
  open?: boolean;
  /** Uncontrolled initial open state. @default false */
  defaultOpen?: boolean;
  /** Called when the fold opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** A 1px hairline down the gutter beside the rows. @default true */
  guide?: boolean;
  /** Extra classes on the group's root. @default undefined */
  className?: string;
  /** The rows inside the fold. */
  children: React.ReactNode;
}

/**
 * A fold of work: one quiet summary line and a chevron that turns, then the rows behind a hairline
 * guide. It opens and closes on the chat motion (MOT-14, through `Collapsible`). While `live`, the
 * summary carries the turn's one moving thing, the braille spinner.
 *
 * @example
 * <ChatGroup summary="Worked for 41s · searched 3 times, opened 4 sites">
 *   <ChatRow verb="Searched" subject="Indian lighting makers" />
 * </ChatGroup>
 */
function ChatGroup({
  summary,
  live = false,
  open,
  defaultOpen = false,
  onOpenChange,
  guide = true,
  className,
  children,
}: ChatGroupProps) {
  return (
    <Collapsible
      data-slot="chat-group"
      data-live={live ? "" : undefined}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => onOpenChange?.(next)}
      className={cn(
        // The open panel clips, so it reaches into both gutters to keep the rows' hanging fills.
        "flex min-w-0 flex-col [&>[data-slot=chat-group-content]]:-mx-2 [&>[data-slot=chat-group-content]]:w-[calc(100%+1rem)]",
        className,
      )}
    >
      <CollapsibleTrigger
        data-slot="chat-group-trigger"
        className="group/chat-group state-layer -mx-2 flex min-h-7 w-fit max-w-[calc(100%+1rem)] min-w-0 items-center gap-2 rounded-md px-2 text-start text-sm text-muted-foreground"
      >
        {live ? <TextSpinner label="" /> : null}
        <span data-slot="chat-group-summary" className="min-w-0 truncate">
          {summary}
        </span>
        <ChevronRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-3.5 shrink-0 transition-transform duration-state ease-enter group-data-panel-open/chat-group:rotate-90 rtl:rotate-180 rtl:group-data-panel-open/chat-group:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        data-slot="chat-group-content"
        className={cn(
          "flex flex-col gap-1 px-2 pt-1",
          guide && "ms-3 border-s border-chat-hairline ps-4",
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export { ChatCard, ChatRow, ChatGroup, formatChatDuration };
