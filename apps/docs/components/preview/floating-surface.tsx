"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/floating-surface` (dogfoods the registry).
import {
  floatingPopupVariants,
  menuItemVariants,
  menuLabelClassName,
  menuSeparatorClassName,
  menuShortcutClassName,
  PanelSearchFrame,
  PanelSearchInput,
} from "@/components/ui/floating-surface";
import { cn } from "@/lib/cn";

/**
 * The three surfaces and the row recipe, rendered statically. Every real overlay reaches them
 * through its own component (Popover, DropdownMenu, Command); this page shows what those
 * components are all painting.
 */
export function floatingSurface(): ReactNode {
  return (
    <Wrapper className="items-start">
      <div
        className={cn(
          floatingPopupVariants({ surface: "panel" }),
          "static max-w-full",
        )}
      >
        <p className="text-label text-foreground">Panel surface</p>
        <p className="text-base text-muted-foreground">
          The 16px popover tier — Popover and HoverCard.
        </p>
      </div>

      <div
        className={cn(
          floatingPopupVariants({ surface: "menu" }),
          "static max-h-none w-56 max-w-full",
        )}
      >
        <div className={menuLabelClassName}>Menu surface</div>
        <div className={menuItemVariants()}>
          Open
          <span className={menuShortcutClassName}>⌘O</span>
        </div>
        <div className={menuItemVariants()} data-highlighted="">
          Highlighted row
        </div>
        <div className={menuSeparatorClassName} />
        <div className={menuItemVariants({ tone: "destructive" })}>Delete</div>
      </div>

      <div
        className={cn(
          floatingPopupVariants({ surface: "menu" }),
          "static max-h-none w-56 max-w-full p-0",
        )}
      >
        <PanelSearchFrame>
          <PanelSearchInput aria-label="Search" placeholder="Search…" />
        </PanelSearchFrame>
        <div className="p-1">
          <div className={menuItemVariants()}>Result row</div>
        </div>
      </div>
    </Wrapper>
  );
}
