// @vegastack chat-chip@0.81.0 sha256-he65RYzb9NnRbO1KnBATpru8+HUjsdw24+cgN4pmHY0=

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Props accepted by `ChatChip`. */
export interface ChatChipProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "children" | "onClick"
> {
  /** A leading 14px icon (or a `TextSpinner` while the work is live). @default undefined */
  icon?: React.ReactNode;
  /** What the chip counts or names ("7 background commands done, 3 running"). */
  label: React.ReactNode;
  /** Quiet words after the label ("2m"). @default undefined */
  meta?: React.ReactNode;
  /** Makes the chip a button, with a trailing chevron. @default undefined */
  onClick?: () => void;
  /** Makes the chip a link, with a trailing chevron. @default undefined */
  href?: string;
  /**
   * `attention` lifts the label to the body ink and medium weight for work that needs a look (one
   * failed, partly done); it never adds a status fill (COL-25).
   * @default "default"
   */
  tone?: "default" | "attention";
}

const CHIP =
  "inline-flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-chat-hairline bg-chat-card px-2.5 text-xs text-muted-foreground tabular-nums [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:shrink-0";

/**
 * A compact pill for background work and counts — "7 background commands done, 3 running ›" — on the
 * chat card surface. Live or partly failed work is a chip; settled work becomes a muted line.
 *
 * @example
 * <ChatChip icon={<TextSpinner label="" />} label="3 Subagents running" onClick={openPanel} />
 *
 * @example
 * <ChatChip tone="attention" label="11 commands done, 1 failed" href="#work" />
 */
function ChatChip({
  icon,
  label,
  meta,
  onClick,
  href,
  tone = "default",
  className,
  ...props
}: ChatChipProps) {
  const interactive = Boolean(onClick || href);
  const content = (
    <>
      {icon}
      <span
        data-slot="chat-chip-label"
        className={cn(
          "min-w-0 truncate",
          tone === "attention" && "font-medium text-foreground",
        )}
      >
        {label}
      </span>{" "}
      {meta != null ? (
        <span data-slot="chat-chip-meta" className="shrink-0">
          {meta}
        </span>
      ) : null}
      {interactive ? (
        <ChevronRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="rtl:rotate-180"
        />
      ) : null}
    </>
  );
  const shared = {
    "data-slot": "chat-chip",
    "data-tone": tone,
  } as const;
  if (href) {
    return (
      <a
        {...props}
        {...shared}
        href={href}
        className={cn(CHIP, "state-layer no-underline", className)}
      >
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <Button
        {...(props as React.ComponentProps<typeof Button>)}
        {...shared}
        variant="ghost"
        onClick={onClick}
        className={cn(
          CHIP,
          "font-normal hover:text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
          className,
        )}
      >
        {content}
      </Button>
    );
  }
  return (
    <span {...props} {...shared} className={cn(CHIP, className)}>
      {content}
    </span>
  );
}

export { ChatChip };
