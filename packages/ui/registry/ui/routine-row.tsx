// @vegastack routine-row@0.136.7 sha256-x+zlfAD21Gt/dBnSp+vcJcpp7CnD3iYfixqYTKqaNRY=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Ellipsis, Pause, Play, SkipForward } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusGlyph, type ChatStatus } from "@/components/ui/status-glyph";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * RoutineRow — one routine in a list: its name (the row's link) and schedule, the next runs, who
 * owns it and where its result goes, how the last run went, and its actions. "Run now" is the
 * row's one outline button; Skip next and Pause or Resume sit in its ⋯. A paused routine mutes,
 * says so and offers Resume.
 * ----------------------------------------------------------------------------------------------*/

/** How a routine's last run went. */
export type RoutineLastRunStatus = "done" | "failed" | "skipped" | "no_reply";

/** Props accepted by `RoutineRow`. */
export interface RoutineRowProps {
  /** The routine's name; the row's link. */
  name: string;
  /** Where the row goes. */
  href: string;
  /**
   * The link element to render instead of `<a>` (a router `Link`); it receives `href`,
   * `className` and children. @default undefined
   */
  linkRender?: React.ReactElement<Record<string, unknown>>;
  /** When it runs, in words: "Weekdays at 9:00". */
  schedule: string;
  /** The next runs, formatted; up to three show. */
  nextRuns: string[];
  /** Who owns it: "Anu". */
  owner: string;
  /** Where its result goes: "#ops", "Email to Anu". @default undefined */
  destination?: string;
  /** How the last run went, its cost and when. @default undefined */
  lastRun?: { status: RoutineLastRunStatus; cost?: string; at: string };
  /** `paused` mutes the row and offers Resume. */
  state: "active" | "paused";
  /** Run it now. @default undefined */
  onRunNow?: () => void;
  /** Skip the next run. @default undefined */
  onSkipNext?: () => void;
  /** Pause it. @default undefined */
  onPause?: () => void;
  /** Resume it. @default undefined */
  onResume?: () => void;
  /** Classes for the root. @default undefined */
  className?: string;
}

const LAST_RUN: Record<
  RoutineLastRunStatus,
  { glyph: ChatStatus; words: string }
> = {
  done: { glyph: "done", words: "Ran" },
  failed: { glyph: "needs-you", words: "Failed" },
  skipped: { glyph: "skipped", words: "Skipped" },
  no_reply: { glyph: "pending", words: "No reply" },
};

/** The row's ⋯: Skip next and Pause or Resume; one item is its own quiet icon button. */
function RoutineMore({
  name,
  items,
}: {
  name: string;
  items: { label: string; icon: React.ReactNode; run: () => void }[];
}) {
  if (items.length === 0) return null;
  if (items.length === 1) {
    const only = items[0]!;
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`${only.label}: ${name}`}
              onClick={only.run}
              className="relative z-10 text-muted-foreground"
            />
          }
        >
          {only.icon}
        </TooltipTrigger>
        <TooltipContent>{only.label}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`More for ${name}`}
            className="relative z-10 text-muted-foreground"
          />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.run}>
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * `RoutineRow` — one routine: name and schedule, the next runs, owner and destination, the last
 * run, Run now and a ⋯ with Skip next and Pause or Resume.
 *
 * @example
 * <RoutineRow
 *   name="Monday supplier check"
 *   href="/agents/assistant/routines/r1"
 *   schedule="Mondays at 9:00"
 *   nextRuns={["Mon 24 Nov, 9:00", "Mon 1 Dec, 9:00"]}
 *   owner="Anu"
 *   destination="#ops"
 *   lastRun={{ status: "done", cost: "₹1.20", at: "Mon 17 Nov" }}
 *   state="active"
 *   onRunNow={runNow}
 *   onSkipNext={skipNext}
 *   onPause={pause}
 * />
 */
export function RoutineRow({
  name,
  href,
  linkRender,
  schedule,
  nextRuns,
  owner,
  destination,
  lastRun,
  state,
  onRunNow,
  onSkipNext,
  onPause,
  onResume,
  className,
}: RoutineRowProps) {
  const paused = state === "paused";
  const items: { label: string; icon: React.ReactNode; run: () => void }[] = [];
  if (onSkipNext && !paused)
    items.push({
      label: "Skip next run",
      icon: <SkipForward aria-hidden />,
      run: onSkipNext,
    });
  if (paused && onResume)
    items.push({ label: "Resume", icon: <Play aria-hidden />, run: onResume });
  if (!paused && onPause)
    items.push({ label: "Pause", icon: <Pause aria-hidden />, run: onPause });
  const linkProps = {
    href,
    "data-slot": "routine-row-link",
    className:
      "min-w-0 truncate py-0.5 font-medium text-foreground no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
    children: name,
  };
  const next = nextRuns.slice(0, 3);
  const last = lastRun ? LAST_RUN[lastRun.status] : null;
  return (
    <div
      data-slot="routine-row"
      data-state={state}
      className={cn(
        "relative flex min-w-0 items-start gap-3 rounded-item px-2 py-2 state-layer has-[[data-slot=routine-row-link]:focus-visible]:layer-focus",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {linkRender ? (
            React.cloneElement(linkRender, linkProps)
          ) : (
            <a {...linkProps} />
          )}
          {paused ? (
            <Badge variant="secondary" data-slot="routine-row-paused">
              Paused
            </Badge>
          ) : null}
        </div>
        <p
          data-slot="routine-row-meta"
          className="line-clamp-2 min-w-0 text-xs text-muted-foreground"
        >
          {[
            schedule,
            !paused && next.length ? `Next ${next.join(", ")}` : null,
            owner,
            destination ? `to ${destination}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {lastRun && last ? (
          <p
            data-slot="routine-row-last"
            data-status={lastRun.status}
            className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
          >
            <StatusGlyph status={last.glyph} label={null} />
            <span className="min-w-0 truncate">
              {[`${last.words} ${lastRun.at}`, lastRun.cost]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-center">
        {onRunNow && !paused ? (
          <Button
            size="sm"
            variant="outline"
            className="relative z-10"
            onClick={onRunNow}
          >
            Run now
          </Button>
        ) : null}
        <RoutineMore name={name} items={items} />
      </div>
    </div>
  );
}
