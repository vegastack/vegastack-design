// @vegastack tool-group@0.100.0 sha256-xnnArW9ZVv+kNO3NvxAMXhp1ecUE8jj65grqtJbojS4=

"use client";

import * as React from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * A run of icon tools — Watch, Star, Comments, More — in a page's top bar or a card's header. Every
 * tool is the 28px ghost `icon-sm` button, two pixels apart, so the same four tools look and space
 * the same on every page (ICO-9).
 *
 * @example
 * ```tsx
 * <ToolGroup aria-label="Page tools">
 *   <ToolGroupItem label="Watch"><BellIcon /></ToolGroupItem>
 *   <ToolGroupItem label="Comments" count={9}><MessageSquareIcon /></ToolGroupItem>
 *   <DropdownMenu>
 *     <DropdownMenuTrigger render={<ToolGroupMore />} />
 *     <DropdownMenuContent align="end">…</DropdownMenuContent>
 *   </DropdownMenu>
 * </ToolGroup>
 * ```
 */
function ToolGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="tool-group"
      className={cn("flex shrink-0 items-center gap-0.5", className)}
      {...props}
    />
  );
}

/** Props for `ToolGroupItem`: a `Button` minus its variant and size, plus a label and a count. */
export interface ToolGroupItemProps extends Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
> {
  /** The tool's name: its accessible name and its tooltip. */
  label: string;
  /**
   * A count beside the icon (open comments). The tool widens to fit it instead of floating a badge
   * over the icon; zero or less shows none. Counts past 99 read "99+".
   * @default undefined
   */
  count?: number;
  /**
   * Where the tooltip opens.
   * @default "bottom"
   */
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
}

/**
 * One tool: a ghost `icon-sm` button named by `label`, which its tooltip shows. Put an icon inside.
 * Pass `aria-pressed` for a tool that toggles (Watch, Star).
 *
 * @example
 * ```tsx
 * <ToolGroupItem label="Star" aria-pressed={starred} onClick={toggleStar}>
 *   <StarIcon />
 * </ToolGroupItem>
 * ```
 */
function ToolGroupItem({
  label,
  count,
  tooltipSide = "bottom",
  className,
  children,
  ...props
}: ToolGroupItemProps) {
  const shown =
    count !== undefined && count > 0
      ? count > 99
        ? "99+"
        : String(count)
      : null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={shown ? "sm" : "icon-sm"}
            data-slot="tool-group-item"
            aria-label={shown ? `${label}, ${shown}` : label}
            className={cn(
              "aria-pressed:bg-state-selected aria-pressed:text-foreground aria-pressed:**:[svg:not([data-icon-tone])]:text-foreground",
              shown && "gap-1 px-1.5 [&_svg:not([class*='size-'])]:size-4",
              className,
            )}
            {...props}
          />
        }
      >
        {children}
        {shown ? (
          <span
            aria-hidden
            data-slot="tool-group-count"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {shown}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Props for `ToolGroupMore`: a `ToolGroupItem` whose label defaults to "More". */
export type ToolGroupMoreProps = Omit<
  ToolGroupItemProps,
  "label" | "children"
> & {
  /**
   * The tool's name.
   * @default "More"
   */
  label?: string;
};

/**
 * The one "more" tool: `MoreHorizontal` (⋯), never a vertical ellipsis (ICO-9). Render it as a
 * menu's trigger.
 *
 * @example
 * ```tsx
 * <DropdownMenuTrigger render={<ToolGroupMore />} />
 * ```
 */
function ToolGroupMore({ label = "More", ...props }: ToolGroupMoreProps) {
  return (
    <ToolGroupItem label={label} {...props}>
      <MoreHorizontalIcon />
    </ToolGroupItem>
  );
}

export { ToolGroup, ToolGroupItem, ToolGroupMore };
