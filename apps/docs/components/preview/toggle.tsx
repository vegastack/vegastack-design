"use client";

import type { ReactNode } from "react";
import {
  BellIcon,
  BellRingIcon,
  BoldIcon,
  BookmarkIcon,
  ItalicIcon,
  StarIcon,
} from "lucide-react";
import { useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/toggle` (dogfoods the registry) → auto-scanned.
import { Toggle } from "@/components/ui/toggle";

export function toggle(): ReactNode {
  return (
    <Wrapper>
      <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
        <BookmarkIcon className="group-aria-pressed/toggle:fill-foreground" />
        Bookmark
      </Toggle>
    </Wrapper>
  );
}

export function toggleOutline(): ReactNode {
  return (
    <Wrapper>
      <Toggle variant="outline" aria-label="Toggle italic">
        <ItalicIcon />
        Italic
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle bold">
        <BoldIcon />
        Bold
      </Toggle>
    </Wrapper>
  );
}

export function toggleWithText(): ReactNode {
  return (
    <Wrapper>
      <Toggle aria-label="Toggle italic">
        <ItalicIcon />
        Italic
      </Toggle>
    </Wrapper>
  );
}

export function toggleSize(): ReactNode {
  return (
    <Wrapper>
      <Toggle variant="outline" aria-label="Toggle small" size="sm">
        Small
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle default" size="default">
        Default
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle large" size="lg">
        Large
      </Toggle>
    </Wrapper>
  );
}

export function toggleDisabled(): ReactNode {
  return (
    <Wrapper>
      <Toggle aria-label="Toggle disabled" disabled>
        Disabled
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle disabled outline" disabled>
        Disabled
      </Toggle>
    </Wrapper>
  );
}

export function toggleRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        dir="ltr"
      >
        <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
          <BookmarkIcon className="group-aria-pressed/toggle:fill-foreground" />
          Bookmark
        </Toggle>
        <Toggle aria-label="Toggle italic" size="sm" variant="outline">
          <ItalicIcon />
          Italic
        </Toggle>
      </div>
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        dir="rtl"
      >
        <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
          <BookmarkIcon className="group-aria-pressed/toggle:fill-foreground" />
          إشارة مرجعية
        </Toggle>
        <Toggle aria-label="Toggle italic" size="sm" variant="outline">
          <ItalicIcon />
          مائل
        </Toggle>
      </div>
    </Wrapper>
  );
}

/** Ours: the `loading` prop (API-5) and the stable-width label underneath it (A11Y-12). */
export function toggleLoading(): ReactNode {
  return (
    <Wrapper>
      <Toggle loading aria-label="Toggle bookmark">
        <BookmarkIcon />
        Bookmark
      </Toggle>
      <Toggle variant="outline" loading aria-label="Toggle italic">
        Italic
      </Toggle>
    </Wrapper>
  );
}

/** `variant="bare"`: a page bar's star and bell — pressed changes the icon, never the fill. */
export function toggleBare(): ReactNode {
  return <BarToggles />;
}

function BarToggles(): ReactNode {
  const [starred, setStarred] = useState(true);
  const [watching, setWatching] = useState(false);
  return (
    <Wrapper>
      <Toggle
        variant="bare"
        size="sm"
        aria-label="Watch"
        pressed={watching}
        onPressedChange={setWatching}
      >
        {watching ? (
          <BellRingIcon className="fill-foreground text-foreground" />
        ) : (
          <BellIcon />
        )}
      </Toggle>
      <Toggle
        variant="bare"
        size="sm"
        aria-label="Star"
        pressed={starred}
        onPressedChange={setStarred}
      >
        <StarIcon
          className={starred ? "fill-warning text-warning" : undefined}
        />
      </Toggle>
    </Wrapper>
  );
}
