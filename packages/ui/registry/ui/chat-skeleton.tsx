// @vegastack chat-skeleton@0.79.0 sha256-UjKWkawWcJ97JZDBGeRrjNQ+FvcJE1zkT/ByLOhV8XE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Props accepted by `ChatSkeleton`. */
export interface ChatSkeletonProps extends React.ComponentProps<"div"> {
  /** How many turns to sketch: a person's bubble, an author line and three lines of answer. @default 2 */
  turns?: number;
}

const ANSWER_WIDTHS = ["w-full", "w-11/12", "w-3/5"];

/**
 * A chat thread while it loads, in the shapes it will take — the person's bubble on the right, the
 * agent's author line, three lines of answer — never bare bars. It waits 150ms before fading in, so
 * a fast load never flashes it.
 *
 * @example
 * {loading ? <ChatSkeleton /> : <Thread />}
 */
function ChatSkeleton({ turns = 2, className, ...props }: ChatSkeletonProps) {
  return (
    <div
      data-slot="chat-skeleton"
      role="status"
      aria-label="Loading the chat"
      className={cn("flex min-w-0 motion-reveal flex-col gap-8", className)}
      {...props}
    >
      {Array.from({ length: turns }, (_, turn) => (
        <div key={turn} className="flex min-w-0 flex-col gap-3">
          <Skeleton
            className={cn(
              "h-9 self-end rounded-2xl",
              turn % 2 ? "w-1/3" : "w-1/2",
            )}
          />
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-col gap-2">
            {ANSWER_WIDTHS.map((width) => (
              <Skeleton key={width} className={cn("h-3", width)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Props accepted by `ScrollToLatest`. */
export interface ScrollToLatestProps {
  /** Shown when the reader is more than about 80px from the bottom. */
  visible: boolean;
  /** New words arrived below: a primary dot on the button. @default false */
  hasNew?: boolean;
  /** Scrolls to the latest message. */
  onClick: () => void;
  /** Extra classes on the button (its position belongs to the caller). @default undefined */
  className?: string;
}

/**
 * The round ↓ that takes the reader back to the latest message: 32px on the popover surface with a
 * small shadow, fading and rising 8px into place. A primary dot says new words arrived. It stays
 * mounted and parks out of reach while hidden.
 *
 * @example
 * <ScrollToLatest visible={awayFromBottom} hasNew={unread} onClick={scrollToEnd}
 *   className="absolute bottom-4 start-1/2 -translate-x-1/2" />
 */
function ScrollToLatest({
  visible,
  hasNew = false,
  onClick,
  className,
}: ScrollToLatestProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      data-slot="scroll-to-latest"
      data-active={visible}
      data-new={hasNew ? "" : undefined}
      aria-label={
        hasNew ? "Scroll to latest, new messages" : "Scroll to latest"
      }
      aria-hidden={!visible || undefined}
      tabIndex={visible ? undefined : -1}
      onClick={onClick}
      className={cn(
        "relative rounded-full border-chat-hairline bg-popover text-popover-foreground shadow-sm dark:bg-popover",
        "transition-[opacity,translate] duration-quick ease-enter data-[active=false]:pointer-events-none data-[active=false]:translate-y-2 data-[active=false]:opacity-0 data-[active=false]:duration-quick-exit data-[active=true]:translate-y-0 data-[active=true]:opacity-100",
        className,
      )}
    >
      <ArrowDown aria-hidden="true" strokeWidth={1.5} />
      {hasNew ? (
        <span
          aria-hidden="true"
          data-slot="scroll-to-latest-dot"
          className="absolute end-0.5 top-0.5 size-2 rounded-full bg-primary motion-pop-in"
        />
      ) : null}
    </Button>
  );
}

export { ChatSkeleton, ScrollToLatest };
