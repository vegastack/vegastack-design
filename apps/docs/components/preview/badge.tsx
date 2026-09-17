"use client";

import type { ReactNode } from "react";
import { ArrowUpRightIcon, BadgeCheckIcon, BookmarkIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/badge` (dogfoods the registry) → auto-scanned.
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export function badge(): ReactNode {
  return (
    <Wrapper>
      <Badge>Badge</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </Wrapper>
  );
}

/** Named `…Example` because `badgeVariants` is the CVA builder the component exports. */
export function badgeVariantsExample(): ReactNode {
  return (
    <Wrapper>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </Wrapper>
  );
}

export function badgeWithIcon(): ReactNode {
  return (
    <Wrapper>
      <Badge variant="secondary">
        <BadgeCheckIcon data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="outline">
        Bookmark
        <BookmarkIcon data-icon="inline-end" />
      </Badge>
    </Wrapper>
  );
}

export function badgeWithSpinner(): ReactNode {
  return (
    <Wrapper>
      <Badge variant="destructive">
        <Spinner data-icon="inline-start" />
        Deleting
      </Badge>
      <Badge variant="secondary">
        Generating
        <Spinner data-icon="inline-end" />
      </Badge>
    </Wrapper>
  );
}

export function badgeLink(): ReactNode {
  return (
    <Wrapper>
      <Badge render={<a href="#badge-link" />}>
        Open Link
        <ArrowUpRightIcon data-icon="inline-end" />
      </Badge>
    </Wrapper>
  );
}

/**
 * Ours: upstream customises with the raw Tailwind palette, which COL-20 forbids anywhere in this
 * repository. The same override written in semantic tokens retints per theme for free.
 */
export function badgeCustomColors(): ReactNode {
  return (
    <Wrapper>
      <Badge className="bg-success text-success-foreground">
        Solid success
      </Badge>
      <Badge className="bg-info text-info-foreground">Solid info</Badge>
      <Badge variant="outline" className="border-warning/40 text-warning-text">
        Outlined warning
      </Badge>
      <Badge variant="outline" className="rounded-sm">
        Square corners
      </Badge>
    </Wrapper>
  );
}

export function badgeRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        dir="ltr"
      >
        <Badge>Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="secondary">
          <BadgeCheckIcon data-icon="inline-start" />
          Verified
        </Badge>
        <Badge variant="outline">
          Bookmark
          <BookmarkIcon data-icon="inline-end" />
        </Badge>
      </div>
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        dir="rtl"
      >
        <Badge>شارة</Badge>
        <Badge variant="secondary">ثانوي</Badge>
        <Badge variant="destructive">مدمر</Badge>
        <Badge variant="secondary">
          <BadgeCheckIcon data-icon="inline-start" />
          متحقق
        </Badge>
        <Badge variant="outline">
          إشارة مرجعية
          <BookmarkIcon data-icon="inline-end" />
        </Badge>
      </div>
    </Wrapper>
  );
}
