"use client";

import type { ReactNode } from "react";
import { SaveIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/tooltip` (dogfoods the registry).
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function tooltip(): ReactNode {
  return (
    <Wrapper className="min-h-40">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger
            aria-label="Add to library"
            render={<Button variant="outline" />}
          >
            Hover
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Wrapper>
  );
}

export function tooltipComposition(): ReactNode {
  return (
    <Wrapper className="min-h-40">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger
            aria-label="Content"
            render={<Button variant="outline" />}
          >
            Trigger
          </TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Wrapper>
  );
}

export function tooltipSide(): ReactNode {
  return (
    <Wrapper className="min-h-52 gap-8">
      <TooltipProvider>
        {(["left", "top", "bottom", "right"] as const).map((side) => (
          <Tooltip key={side} defaultOpen>
            <TooltipTrigger
              aria-label={`Add to library, ${side}`}
              render={<Button variant="outline" className="w-fit capitalize" />}
            >
              {side}
            </TooltipTrigger>
            <TooltipContent side={side}>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </Wrapper>
  );
}

export function tooltipWithKeyboardShortcut(): ReactNode {
  return (
    <Wrapper className="min-h-40">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Save Changes"
              />
            }
          >
            <SaveIcon />
          </TooltipTrigger>
          <TooltipContent>
            Save Changes <Kbd>S</Kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Wrapper>
  );
}

export function tooltipDisabledButton(): ReactNode {
  return (
    <Wrapper className="min-h-40">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger render={<span className="inline-block w-fit" />}>
            <Button variant="outline" disabled>
              Disabled
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This feature is currently unavailable</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Wrapper>
  );
}

export function tooltipRtl(): ReactNode {
  return (
    <Wrapper className="min-h-52 flex-col items-stretch gap-10">
      <TooltipProvider>
        {/* One popup open per direction. Four open at once overlapped their neighbours' pointer
            targets, which the geometry lane reads — correctly — as an obstructed control. */}
        <div className="flex flex-wrap justify-center gap-8" dir="ltr">
          {(["left", "top", "bottom", "right"] as const).map((side) => (
            <Tooltip key={side} defaultOpen={side === "top"}>
              <TooltipTrigger
                aria-label={`Add to library, ${side}`}
                render={<Button variant="outline" className="capitalize" />}
              >
                {side}
              </TooltipTrigger>
              <TooltipContent side={side}>Add to library</TooltipContent>
            </Tooltip>
          ))}
        </div>
        {/* Stacked, not in a row: an inline-start/inline-end popup opens sideways, straight over
            the neighbouring trigger's pointer target when the two sit side by side. */}
        <div className="flex flex-col items-center gap-10" dir="rtl">
          {(["inline-start", "inline-end"] as const).map((side) => (
            <Tooltip key={side} defaultOpen={side === "inline-end"}>
              <TooltipTrigger
                aria-label="إضافة إلى المكتبة"
                render={<Button variant="outline" />}
              >
                {side === "inline-start" ? "بداية السطر" : "نهاية السطر"}
              </TooltipTrigger>
              <TooltipContent side={side} dir="rtl">
                إضافة إلى المكتبة
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </Wrapper>
  );
}
