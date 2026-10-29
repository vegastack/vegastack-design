// @vegastack block-toolbar@0.25.98 sha256-sthm29A1DqTkTGLq3Mz/zvzHKZ37W5McI7QAJQas844=

"use client";

import * as React from "react";
import { Ellipsis } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * BlockToolbar — the ONE place a block's own controls sit: its top-right corner, 28px icon buttons,
 * at most four of them and a ⋯ for the rest (UXP-08). A code block's copy and wrap, an image's
 * replace, caption, alt text and open, a diagram's expand and actions all use it, so every block
 * with chrome reads the same: same corner, same size, same order of importance.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Props for `BlockToolbar`.
 *
 * @example
 * <BlockToolbar aria-label="Image actions" reveal="hover">…</BlockToolbar>
 */
export interface BlockToolbarProps extends React.ComponentPropsWithRef<"div"> {
  /** What the controls are for ("Code block actions"): the group's accessible name. */
  "aria-label": string;
  /**
   * When it shows: always, or while the block (an ancestor with the `group/block` class) is
   * hovered or holds focus — and always on a coarse pointer, which has no hover.
   * @default "always"
   */
  reveal?: "always" | "hover";
  /**
   * Where it sits: `corner` floats over the block's top-right corner (absolute — the block is
   * `relative`); `inline` sits in a row the block already has (a header).
   * @default "corner"
   */
  placement?: "corner" | "inline";
}

/**
 * `BlockToolbar` — a block's controls in its top-right corner: `BlockToolbarButton`s (28px, at most
 * four) and a `BlockToolbarMenu` (⋯) for the rest. Never printed.
 *
 * @example
 * <figure className="group/block relative">
 *   <BlockToolbar aria-label="Code block actions">
 *     <BlockToolbarButton label="Copy code" onClick={copy}><Copy /></BlockToolbarButton>
 *   </BlockToolbar>
 *   …
 * </figure>
 */
export function BlockToolbar({
  reveal = "always",
  placement = "corner",
  className,
  ...props
}: BlockToolbarProps) {
  return (
    <div
      role="group"
      data-slot="block-toolbar"
      data-reveal={reveal}
      data-placement={placement}
      className={cn(
        "z-10 flex items-center gap-0.5 print:hidden",
        placement === "corner" && "absolute end-1.5 top-1.5",
        reveal === "hover" &&
          "opacity-0 transition-opacity duration-150 group-hover/block:opacity-100 group-focus-within/block:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Props for `BlockToolbarButton`: a `Button`'s, plus its name.
 *
 * @example
 * <BlockToolbarButton label="Open" onClick={open}><Maximize2 /></BlockToolbarButton>
 */
export interface BlockToolbarButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "size" | "variant"
> {
  /** The button's accessible name and tooltip. */
  label: string;
}

/**
 * `BlockToolbarButton` — one 28px ghost icon button in a `BlockToolbar`, named by `label` (also its
 * tooltip). A press never takes focus from an editor the block sits in.
 *
 * @example
 * <BlockToolbarButton label="Download" render={<a href={src} download />} nativeButton={false}>
 *   <Download />
 * </BlockToolbarButton>
 */
export function BlockToolbarButton({
  label,
  className,
  onMouseDown,
  ...props
}: BlockToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            data-slot="block-toolbar-button"
            onMouseDown={(event) => {
              onMouseDown?.(event);
              if (!event.defaultPrevented) event.preventDefault();
            }}
            className={cn("text-muted-foreground", className)}
            {...props}
          />
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Props for `BlockToolbarMenu`.
 *
 * @example
 * <BlockToolbarMenu label="More image actions"><DropdownMenuItem>Copy link</DropdownMenuItem></BlockToolbarMenu>
 */
export interface BlockToolbarMenuProps {
  /** The ⋯ button's accessible name ("More image actions"). */
  label: string;
  /** The menu's items: `DropdownMenuItem`s. */
  children: React.ReactNode;
  /**
   * Called when the menu opens or closes.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * `BlockToolbarMenu` — the ⋯ at the end of a `BlockToolbar`: whatever does not fit in its four
 * buttons, as a dropdown menu.
 *
 * @example
 * <BlockToolbarMenu label="More code actions">
 *   <DropdownMenuItem onClick={download}><Download />Download</DropdownMenuItem>
 * </BlockToolbarMenu>
 */
export function BlockToolbarMenu({
  label,
  children,
  onOpenChange,
}: BlockToolbarMenuProps) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            data-slot="block-toolbar-menu"
            onMouseDown={(event) => event.preventDefault()}
            className="text-muted-foreground"
          />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
