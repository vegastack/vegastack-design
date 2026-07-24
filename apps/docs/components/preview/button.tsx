"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/button` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { MarketingSurface } from "@/components/ui/marketing-surface";

export function button(): ReactNode {
  return (
    <Wrapper>
      <Button>Save changes</Button>
    </Wrapper>
  );
}

export function buttonVariants(): ReactNode {
  return (
    <Wrapper>
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="info">Info</Button>
      <Button variant="glass">Glass</Button>
      <Button variant="destructive-outline">Destructive outline</Button>
      <Button variant="success-outline">Success outline</Button>
      <Button variant="warning-outline">Warning outline</Button>
      <Button variant="info-outline">Info outline</Button>
    </Wrapper>
  );
}

export function buttonSizes(): ReactNode {
  return (
    <Wrapper>
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon-xs" aria-label="Add">
        <Plus />
      </Button>
      <Button size="icon-sm" aria-label="Add">
        <Plus />
      </Button>
      <Button size="icon" aria-label="Add">
        <Plus />
      </Button>
      <Button size="icon-lg" aria-label="Add">
        <Plus />
      </Button>
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
      <Button variant="destructive">
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

export function buttonMatrix(): ReactNode {
  const variants = ["default", "outline", "destructive"] as const;
  const sizes = ["xs", "default", "lg"] as const;
  const sizeLabels: Record<(typeof sizes)[number], string> = {
    xs: "Extra small",
    default: "Default",
    lg: "Large",
  };
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {sizes.map((size) => (
            <Button key={size} variant={variant} size={size}>
              {sizeLabels[size]}
            </Button>
          ))}
        </div>
      ))}
    </Wrapper>
  );
}

export function buttonFinish(): ReactNode {
  // Wave 2 `lit` finish: the `--shadow-lit` top-light + warm ambient on the PRIMARY
  // action only — every other variant stays flat (passing finish="lit" there is a no-op).
  return (
    <Wrapper className="items-center gap-3">
      <Button>Flat (default)</Button>
      <Button finish="lit">Lit primary</Button>
      <Button variant="outline" finish="lit">
        Outline stays flat
      </Button>
    </Wrapper>
  );
}
