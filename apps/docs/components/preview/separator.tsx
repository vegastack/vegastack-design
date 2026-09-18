"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/separator` (dogfoods the registry) → auto-scanned.
import { Separator } from "@/components/ui/separator";

export function separator(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1.5">
          <div className="leading-none font-medium">VegaStack Design</div>
          <div className="text-muted-foreground">
            The foundation for your design system
          </div>
        </div>
        <Separator />
        <div>
          A set of components you can copy into your project, customize, extend
          and build on.
        </div>
      </div>
    </Wrapper>
  );
}

export function separatorVertical(): ReactNode {
  return (
    <Wrapper>
      <div className="flex h-5 items-center gap-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </Wrapper>
  );
}

export function separatorMenu(): ReactNode {
  return (
    <Wrapper>
      <div className="flex items-center gap-2 text-sm md:gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Settings</span>
          <span className="text-xs text-muted-foreground">
            Manage preferences
          </span>
        </div>
        <Separator orientation="vertical" />
        <div className="flex flex-col gap-1">
          <span className="font-medium">Account</span>
          <span className="text-xs text-muted-foreground">
            Profile and security
          </span>
        </div>
        <Separator orientation="vertical" className="hidden md:block" />
        <div className="hidden flex-col gap-1 md:flex">
          <span className="font-medium">Help</span>
          <span className="text-xs text-muted-foreground">
            Support and docs
          </span>
        </div>
      </div>
    </Wrapper>
  );
}

export function separatorList(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2 text-sm">
        <dl className="flex items-center justify-between">
          <dt>Item 1</dt>
          <dd className="text-muted-foreground">Value 1</dd>
        </dl>
        <Separator />
        <dl className="flex items-center justify-between">
          <dt>Item 2</dt>
          <dd className="text-muted-foreground">Value 2</dd>
        </dl>
        <Separator />
        <dl className="flex items-center justify-between">
          <dt>Item 3</dt>
          <dd className="text-muted-foreground">Value 3</dd>
        </dl>
      </div>
    </Wrapper>
  );
}

export function separatorRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <div
        className="mx-auto flex w-full max-w-sm flex-col gap-4 text-sm"
        dir="ltr"
      >
        <div className="leading-none font-medium">VegaStack Design</div>
        <Separator />
        <div className="text-muted-foreground">
          The foundation for your design system
        </div>
      </div>
      <div
        className="mx-auto flex w-full max-w-sm flex-col gap-4 text-sm"
        dir="rtl"
      >
        <div className="leading-none font-medium">فيغاستاك ديزاين</div>
        <Separator />
        <div className="text-muted-foreground">
          الأساس لنظام التصميم الخاص بك
        </div>
      </div>
    </Wrapper>
  );
}
