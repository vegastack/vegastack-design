"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/separator` (dogfoods the registry) → auto-scanned.
import { Separator } from "@/components/ui/separator";

export function separator(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xs">
        <div className="space-y-1">
          <h4 className="text-base font-medium leading-none text-foreground">
            VegaStack UI
          </h4>
          <p className="text-base text-muted-foreground">
            An open-source design system.
          </p>
        </div>
        <Separator className="my-4" />
        <div className="flex h-5 items-center gap-3 text-base text-muted-foreground">
          <span>Docs</span>
          <Separator decorative={false} orientation="vertical" />
          <span>Components</span>
          <Separator decorative={false} orientation="vertical" />
          <span>Tokens</span>
        </div>
      </div>
    </Wrapper>
  );
}

export function separatorVertical(): ReactNode {
  return (
    <Wrapper>
      <div className="flex h-(--size-md) items-center gap-4 text-base text-foreground">
        <span>Profile</span>
        <Separator decorative={false} orientation="vertical" />
        <span>Billing</span>
        <Separator decorative={false} orientation="vertical" />
        <span>Settings</span>
      </div>
    </Wrapper>
  );
}
