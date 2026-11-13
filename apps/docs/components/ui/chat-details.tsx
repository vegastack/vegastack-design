// @vegastack chat-details@0.81.0 sha256-SKVmKPmU1USRXnYp069VDbzOHY/H9UP5qlbTbUvKIUs=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------------------------------------
 * The chat details panel beside the thread (≥ 1280px; a sheet on a phone): quiet sections — Context,
 * Outputs, Subagents and background work, Connectors — each a small title with its count and rows
 * of an icon, a name and muted meta. A Subagent opened from the thread shows its steps here, under a
 * back link. Long sections end in "Show more". The app composes the sections and their rows.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ChatDetails`. */
export interface ChatDetailsProps extends React.ComponentProps<"aside"> {
  /** The panel's accessible name. @default "Chat details" */
  label?: string;
}

/**
 * The details panel's column: sections stacked with room between them, scrolling on its own.
 *
 * @example
 * <ChatDetails>
 *   <ChatDetailsSection title="Outputs" count={2}>
 *     <ChatDetailsRow icon={<FileText />} title="Comparison.pdf" meta="2 min ago" onOpen={open} />
 *   </ChatDetailsSection>
 * </ChatDetails>
 */
function ChatDetails({
  label = "Chat details",
  className,
  children,
  ...props
}: ChatDetailsProps) {
  return (
    <aside
      data-slot="chat-details"
      aria-label={label}
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col gap-6 overflow-y-auto p-4 text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

/** Props accepted by `ChatDetailsSection`. */
export interface ChatDetailsSectionProps {
  /** The section's name: "Outputs". */
  title: React.ReactNode;
  /** A quiet count or state after the name ("4", "2 to reconnect"). @default undefined */
  count?: React.ReactNode;
  /** Something at the header's far end (a button). @default undefined */
  action?: React.ReactNode;
  /** Rows shown before "Show more". @default 5 */
  limit?: number;
  /** What an empty section says. @default undefined */
  empty?: React.ReactNode;
  /** Extra classes on the section. @default undefined */
  className?: string;
  /** The rows. @default undefined */
  children?: React.ReactNode;
}

/**
 * One section of the details panel: a small title and count, its rows, and "Show more" past `limit`.
 *
 * @example
 * <ChatDetailsSection title="Connectors" count="2 to reconnect">{rows}</ChatDetailsSection>
 */
function ChatDetailsSection({
  title,
  count,
  action,
  limit = 5,
  empty,
  className,
  children,
}: ChatDetailsSectionProps) {
  const [all, setAll] = React.useState(false);
  const rows = React.Children.toArray(children);
  const shown = all ? rows : rows.slice(0, limit);
  const id = React.useId();
  return (
    <section
      data-slot="chat-details-section"
      aria-labelledby={id}
      className={cn("flex min-w-0 flex-col gap-1", className)}
    >
      <div className="flex min-h-7 min-w-0 items-center gap-2 px-2">
        <h3
          id={id}
          className="min-w-0 truncate text-xs font-medium text-foreground"
        >
          {title}
        </h3>
        {count != null ? (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {count}
          </span>
        ) : null}
        {action != null ? (
          <div className="ms-auto shrink-0">{action}</div>
        ) : null}
      </div>
      {rows.length ? (
        <div className="flex min-w-0 flex-col">{shown}</div>
      ) : empty != null ? (
        <p className="px-2 text-xs text-muted-foreground">{empty}</p>
      ) : null}
      {rows.length > limit ? (
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={all}
          onClick={() => setAll((value) => !value)}
          className="w-fit border-0 font-normal text-muted-foreground"
        >
          {all ? "Show less" : `Show ${rows.length - limit} more`}
        </Button>
      ) : null}
    </section>
  );
}

/** Props accepted by `ChatDetailsRow`. */
export interface ChatDetailsRowProps {
  /** A 16px icon: the file type, the connector's mark. @default undefined */
  icon?: React.ReactNode;
  /** What the row names. */
  title: React.ReactNode;
  /** Quiet words after it ("2m 10s", "reconnect"). @default undefined */
  meta?: React.ReactNode;
  /** Something at the far end (a stop button). @default undefined */
  aside?: React.ReactNode;
  /** Opens what the row names; the row becomes a button. @default undefined */
  onOpen?: () => void;
  /** Links to what the row names. @default undefined */
  href?: string;
  /** Extra classes on the row. @default undefined */
  className?: string;
}

const ROW =
  "flex min-h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-start text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

/**
 * One row of a details section: icon, name, quiet meta, and an optional control at the end.
 *
 * @example
 * <ChatDetailsRow icon={<Timer />} title="Commit and ci:local" meta="23s" aside={<StopButton />} />
 */
function ChatDetailsRow({
  icon,
  title,
  meta,
  aside,
  onOpen,
  href,
  className,
}: ChatDetailsRowProps) {
  const content = (
    <>
      {icon}
      <span className="min-w-0 flex-1 truncate text-foreground">{title}</span>
      {meta != null ? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {meta}
        </span>
      ) : null}
    </>
  );
  const main = href ? (
    <a href={href} className={cn(ROW, "state-layer no-underline")}>
      {content}
    </a>
  ) : onOpen ? (
    <Button
      variant="ghost"
      onClick={onOpen}
      className={cn(ROW, "h-auto border-0 font-normal")}
    >
      {content}
    </Button>
  ) : (
    <div className={ROW}>{content}</div>
  );
  return (
    <div
      data-slot="chat-details-row"
      className={cn("flex min-w-0 items-center gap-1", className)}
    >
      <div className="min-w-0 flex-1">{main}</div>
      {aside != null ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

/** Props accepted by `ChatDetailsBack`. */
export interface ChatDetailsBackProps {
  /** Where back goes: "Chat details". */
  label: React.ReactNode;
  /** What the view shows now: a Subagent's title. */
  title: React.ReactNode;
  /** Quiet words under the title ("5 steps · 0:52"). @default undefined */
  meta?: React.ReactNode;
  /** Goes back. */
  onBack: () => void;
}

/**
 * The header of a nested view in the panel — a Subagent's steps — with a back link.
 *
 * @example
 * <ChatDetailsBack label="Chat details" title="Hublit and Halonix" meta="3 steps · 0:41" onBack={back} />
 */
function ChatDetailsBack({ label, title, meta, onBack }: ChatDetailsBackProps) {
  return (
    <div data-slot="chat-details-back" className="flex min-w-0 flex-col gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={onBack}
        className="w-fit border-0 font-normal text-muted-foreground"
      >
        <ChevronLeft
          aria-hidden="true"
          strokeWidth={1.5}
          className="rtl:rotate-180"
        />
        {label}
      </Button>
      <div className="flex min-w-0 items-baseline gap-2 px-2">
        <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">
          {title}
        </h3>
        {meta != null ? (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {meta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export { ChatDetails, ChatDetailsSection, ChatDetailsRow, ChatDetailsBack };
