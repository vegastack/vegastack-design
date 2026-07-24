"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/tooltip` (dogfoods the registry) → auto-scanned.
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipKbd,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// The Tooltip.Provider already lives in the docs <Provider> (mirrors
// VegaStackProvider), so these demos render Root → Trigger → Content directly.

export function tooltip(): ReactNode {
  return (
    <Wrapper>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
        <TooltipContent>Add to your library</TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}

export function tooltipSides(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Top</Button>} />
        <TooltipContent side="top">On top</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Right</Button>} />
        <TooltipContent side="right">On the right</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Bottom</Button>} />
        <TooltipContent side="bottom">On the bottom</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Left</Button>} />
        <TooltipContent side="left">On the left</TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}

export function tooltipKbd(): ReactNode {
  return (
    <Wrapper>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Search</Button>} />
        <TooltipContent>
          Search
          <TooltipKbd keys={["⌘", "K"]} />
        </TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}

export function tooltipArrow(): ReactNode {
  return (
    <Wrapper>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline">With arrow</Button>}
        />
        <TooltipContent arrow>Pointing at the trigger</TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}

export function tooltipAlign(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Start</Button>} />
        <TooltipContent side="bottom" align="start">
          Aligned to the start edge
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Center</Button>} />
        <TooltipContent side="bottom" align="center">
          Centered on the trigger
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">End</Button>} />
        <TooltipContent side="bottom" align="end">
          Aligned to the end edge
        </TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}

export function tooltipOffset(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline">Default (6px)</Button>}
        />
        <TooltipContent side="top">Default gap</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline">Fixed offset</Button>}
        />
        <TooltipContent side="top" sideOffset={16}>
          16px away
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline">Offset function</Button>}
        />
        <TooltipContent
          side="top"
          sideOffset={({ side }) => (side === "top" ? 24 : 6)}
        >
          Resolved per side
        </TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}

export function tooltipDelay(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline">Shared delay</Button>}
        />
        <TooltipContent>Uses the provider delay</TooltipContent>
      </Tooltip>
      <Tooltip delay={0}>
        <TooltipTrigger
          render={<Button variant="outline">Instant (delay 0)</Button>}
        />
        <TooltipContent>Opens immediately</TooltipContent>
      </Tooltip>
      <Tooltip delay={800}>
        <TooltipTrigger
          render={<Button variant="outline">Slow (delay 800)</Button>}
        />
        <TooltipContent>Waits 800ms</TooltipContent>
      </Tooltip>
    </Wrapper>
  );
}
