"use client";

"use client";

import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/collapsible` (dogfoods the registry) → auto-scanned.
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export function collapsible(): ReactNode {
  return (
    <Wrapper>
      <Collapsible
        defaultOpen
        className="w-full max-w-sm gap-2 rounded-lg border border-border p-3"
      >
        <CollapsibleTrigger className="w-full">
          What is included in the Pro plan?
          <ChevronDown />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="pt-2">
            Unlimited projects, priority support, advanced analytics, and SSO.
            Billed annually with a 14-day free trial.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </Wrapper>
  );
}

export function collapsibleStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Collapsible className="w-full max-w-sm gap-2 rounded-lg border border-border p-3">
        <CollapsibleTrigger className="w-full">
          Closed by default
          <ChevronDown />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="pt-2">
            Click the trigger to reveal this region with an animated height.
          </p>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible
        defaultOpen
        className="w-full max-w-sm gap-2 rounded-lg border border-border p-3"
      >
        <CollapsibleTrigger className="w-full">
          Open by default
          <ChevronDown />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="pt-2">
            This region starts expanded and collapses on click.
          </p>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible
        disabled
        className="w-full max-w-sm gap-2 rounded-lg border border-border p-3"
      >
        <CollapsibleTrigger className="w-full">
          Disabled
          <ChevronDown />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="pt-2">A disabled region cannot be toggled.</p>
        </CollapsibleContent>
      </Collapsible>
    </Wrapper>
  );
}

export function collapsibleControlled(): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <p className="text-base text-muted-foreground">
        State owned by the parent:{" "}
        <span className="font-mono text-foreground">{String(open)}</span>
      </p>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="w-full max-w-sm gap-2 rounded-lg border border-border p-3"
      >
        <CollapsibleTrigger className="w-full">
          What is included in the Pro plan?
          <ChevronDown />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="pt-2">
            Unlimited projects, priority support, advanced analytics, and SSO.
            The open state is driven by <span className="font-mono">open</span>{" "}
            and reported through <span className="font-mono">onOpenChange</span>
            .
          </p>
        </CollapsibleContent>
      </Collapsible>
    </Wrapper>
  );
}

export function collapsibleKeepMounted(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Collapsible className="w-full max-w-sm gap-2 rounded-lg border border-border p-3">
        <CollapsibleTrigger className="w-full">
          Release notes (find-in-page works while collapsed)
          <ChevronDown />
        </CollapsibleTrigger>
        <CollapsibleContent keepMounted hiddenUntilFound>
          <p className="pt-2">
            With <span className="font-mono">keepMounted</span> and{" "}
            <span className="font-mono">hiddenUntilFound</span>, this panel
            stays in the DOM while closed, so the browser&rsquo;s find-in-page
            (and crawlers) can reach it and auto-expand the region.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </Wrapper>
  );
}
