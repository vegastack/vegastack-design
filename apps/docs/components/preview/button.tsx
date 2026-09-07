"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/button` (dogfoods the registry) → auto-scanned.
import {
  Button,
  type ButtonAppearance,
  type ButtonTone,
} from "@/components/ui/button";
import { MarketingSurface } from "@/components/ui/marketing-surface";

export function button(): ReactNode {
  return (
    <Wrapper>
      <Button>Save changes</Button>
    </Wrapper>
  );
}

/** The five tones, in the order the matrix reads them. */
const TONES: readonly ButtonTone[] = [
  "neutral",
  "destructive",
  "success",
  "warning",
  "info",
];

/**
 * The full `variant × tone` matrix. `solid × destructive` is deliberately absent — a destructive
 * action is never a solid red button, and the type makes that cell unreachable.
 */
export function buttonMatrix(): ReactNode {
  const rows = ["solid", "soft", "outline", "ghost", "link"] as const;
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      {rows.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {TONES.map((tone) =>
            variant === "solid" && tone === "destructive" ? (
              <span
                key={tone}
                className="text-sm text-muted-foreground-faint"
              >
                (no solid destructive)
              </span>
            ) : (
              <Button
                key={tone}
                {...({ variant, tone } as ButtonAppearance)}
              >
                {tone}
              </Button>
            ),
          )}
        </div>
      ))}
    </Wrapper>
  );
}

export function buttonVariants(): ReactNode {
  return (
    <Wrapper>
      <Button variant="solid">Solid</Button>
      <Button variant="soft">Soft</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </Wrapper>
  );
}

export function buttonTones(): ReactNode {
  return (
    <Wrapper>
      <Button variant="soft">Neutral</Button>
      <Button variant="soft" tone="destructive">
        Destructive
      </Button>
      <Button variant="soft" tone="success">
        Success
      </Button>
      <Button variant="soft" tone="warning">
        Warning
      </Button>
      <Button variant="soft" tone="info">
        Info
      </Button>
    </Wrapper>
  );
}

export function buttonSizes(): ReactNode {
  return (
    <Wrapper>
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Wrapper>
  );
}

export function buttonStates(): ReactNode {
  return (
    <Wrapper>
      <Button>
        <Plus />
        With icon
      </Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
      <Button variant="soft" tone="destructive">
        <Trash2 />
        Delete
      </Button>
    </Wrapper>
  );
}

export function buttonCta(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <Button variant="cta">
          Get started
          <ChevronRight />
        </Button>
      </MarketingSurface>
    </Wrapper>
  );
}
