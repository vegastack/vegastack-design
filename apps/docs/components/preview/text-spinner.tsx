"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/text-spinner` (dogfoods the registry) → auto-scanned.
import { TextSpinner } from "@/components/ui/text-spinner";

export function textSpinner(): ReactNode {
  return (
    <Wrapper>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <TextSpinner label="" />
        Searching the web · 12s
      </p>
    </Wrapper>
  );
}

export function textSpinnerVariants(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-2">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <TextSpinner label="" /> Reading 4 sites · 41s
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <TextSpinner variant="dots" label="" /> Thinking
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <TextSpinner variant="dots" label="" /> Reconnecting
      </p>
    </Wrapper>
  );
}
