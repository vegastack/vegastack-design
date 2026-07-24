"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Check, Sparkles, Star } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/badge` (dogfoods the registry) → auto-scanned.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function badge(): ReactNode {
  return (
    <Wrapper>
      <Badge intent="success" dot>
        Active
      </Badge>
    </Wrapper>
  );
}

export function badgeVariants(): ReactNode {
  return (
    <Wrapper>
      <Badge variant="subtle" intent="info">
        Subtle
      </Badge>
      <Badge variant="solid" intent="info">
        Solid
      </Badge>
      <Badge variant="minimal" intent="info" dot>
        Minimal
      </Badge>
    </Wrapper>
  );
}

export function badgeColors(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge intent="default">Default</Badge>
        <Badge intent="info">Info</Badge>
        <Badge intent="success">Success</Badge>
        <Badge intent="warning">Warning</Badge>
        <Badge intent="destructive">Destructive</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="solid" intent="default">
          Default
        </Badge>
        <Badge variant="solid" intent="info">
          Info
        </Badge>
        <Badge variant="solid" intent="success">
          Success
        </Badge>
        <Badge variant="solid" intent="warning">
          Warning
        </Badge>
        <Badge variant="solid" intent="destructive">
          Destructive
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="minimal" intent="default">
          Default
        </Badge>
        <Badge variant="minimal" intent="info">
          Info
        </Badge>
        <Badge variant="minimal" intent="success">
          Success
        </Badge>
        <Badge variant="minimal" intent="warning">
          Warning
        </Badge>
        <Badge variant="minimal" intent="destructive">
          Destructive
        </Badge>
      </div>
    </Wrapper>
  );
}

export function badgeSolidDot(): ReactNode {
  return (
    <Wrapper>
      <Badge variant="solid" intent="success" dot>
        Active
      </Badge>
      <Badge variant="solid" intent="warning" dot>
        Pending
      </Badge>
      <Badge variant="solid" intent="destructive" dot>
        Failed
      </Badge>
      <Badge variant="solid" intent="info" dot>
        Beta
      </Badge>
    </Wrapper>
  );
}

export function badgeSizes(): ReactNode {
  return (
    <Wrapper>
      <Badge size="sm" intent="info">
        Small
      </Badge>
      <Badge size="default" intent="info">
        Default
      </Badge>
      <Badge size="lg" intent="info">
        Large
      </Badge>
    </Wrapper>
  );
}

export function badgeAnimateIn(): ReactNode {
  const [verified, setVerified] = useState(false);
  return (
    <Wrapper className="flex-col gap-4">
      <div className="flex h-6 items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        {verified ? (
          <Badge key="verified" variant="solid" intent="success" animateIn>
            <Check />
            Verified
          </Badge>
        ) : (
          <Badge variant="subtle" intent="default">
            Pending
          </Badge>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setVerified((v) => !v)}
      >
        {verified ? "Reset" : "Verify"}
      </Button>
    </Wrapper>
  );
}

export function badgeStates(): ReactNode {
  return (
    <Wrapper>
      <Badge intent="success" dot>
        With dot
      </Badge>
      <Badge intent="info">
        <Sparkles />
        With icon
      </Badge>
      <Badge intent="warning" loading>
        Loading
      </Badge>
      <Badge variant="solid" intent="success">
        <Check />
        Verified
      </Badge>
      <Badge variant="minimal" intent="info">
        <Star />
        Minimal
      </Badge>
    </Wrapper>
  );
}

export function badgeTagChips(): ReactNode {
  // Wave 2: `bordered` subtle chips (tint + matching-hue hairline — the crisp tag read)
  // and the `outline` hairline tag. Compose `+N` overflow as a neutral outline badge.
  return (
    <Wrapper className="flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge intent="info" bordered>
          Syncing
        </Badge>
        <Badge intent="success" bordered>
          Active
        </Badge>
        <Badge intent="warning" bordered>
          Degraded
        </Badge>
        <Badge intent="destructive" bordered>
          Failed
        </Badge>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline">B2B</Badge>
        <Badge variant="outline">SaaS</Badge>
        <Badge variant="outline" intent="info">
          Enterprise
        </Badge>
        <Badge variant="outline">+3</Badge>
      </div>
    </Wrapper>
  );
}
