"use client";

import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/avatar` (dogfoods the registry) → auto-scanned.
import { Avatar, AvatarGroup } from "@/components/ui/avatar";

// Local fixtures (abstract portrait marks) — demos and VRT must never depend on a live
// third-party image service (same determinism rule as preview/image.tsx's fixture).
const ADA = "/preview/avatar-1.svg";
const LINUS = "/preview/avatar-2.svg";
const GRACE = "/preview/avatar-3.svg";

// Image avatar alongside the neutral initials fallback (no src → bg-accent + initials).
export function avatar(): ReactNode {
  return (
    <Wrapper>
      <Avatar src={ADA} alt="Ada Lovelace" fallback="AL" />
      <Avatar fallback="LT" />
    </Wrapper>
  );
}

// The full size scale — 24 / 28 / 32 (default) / 40 / 48.
export function avatarSizes(): ReactNode {
  return (
    <Wrapper>
      <Avatar size="xs" src={ADA} alt="Ada Lovelace" fallback="AL" />
      <Avatar size="sm" src={ADA} alt="Ada Lovelace" fallback="AL" />
      <Avatar size="default" src={ADA} alt="Ada Lovelace" fallback="AL" />
      <Avatar size="lg" src={ADA} alt="Ada Lovelace" fallback="AL" />
      <Avatar size="xl" src={ADA} alt="Ada Lovelace" fallback="AL" />
    </Wrapper>
  );
}

// Overlapping stack with a trailing +N overflow fallback.
export function avatarGroup(): ReactNode {
  return (
    <Wrapper>
      <AvatarGroup>
        <Avatar src={ADA} alt="Ada Lovelace" fallback="AL" />
        <Avatar src={LINUS} alt="Linus Torvalds" fallback="LT" />
        <Avatar src={GRACE} alt="Grace Hopper" fallback="GH" />
        <Avatar fallback="+5" />
      </AvatarGroup>
    </Wrapper>
  );
}

// The `spacing` axis side by side — overlap density tightens from loose → tight.
export function avatarGroupSpacing(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-2">
        <AvatarGroup spacing="tight">
          <Avatar src={ADA} alt="Ada Lovelace" fallback="AL" />
          <Avatar src={LINUS} alt="Linus Torvalds" fallback="LT" />
          <Avatar src={GRACE} alt="Grace Hopper" fallback="GH" />
          <Avatar fallback="+5" />
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">tight</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AvatarGroup spacing="default">
          <Avatar src={ADA} alt="Ada Lovelace" fallback="AL" />
          <Avatar src={LINUS} alt="Linus Torvalds" fallback="LT" />
          <Avatar src={GRACE} alt="Grace Hopper" fallback="GH" />
          <Avatar fallback="+5" />
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AvatarGroup spacing="loose">
          <Avatar src={ADA} alt="Ada Lovelace" fallback="AL" />
          <Avatar src={LINUS} alt="Linus Torvalds" fallback="LT" />
          <Avatar src={GRACE} alt="Grace Hopper" fallback="GH" />
          <Avatar fallback="+5" />
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">loose</span>
      </div>
    </Wrapper>
  );
}

// Image-error path: a broken `src` decodes to nothing, so the `fallback` initials
// paint instead — never a broken-image icon. Contrast with the no-src initials.
export function avatarFallback(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-2">
        <Avatar fallback="AL" />
        <span className="text-sm text-muted-foreground">no src</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar
          src="https://broken.example.com/missing.png"
          alt="Ada Lovelace"
          fallback="AL"
        />
        <span className="text-sm text-muted-foreground">broken src</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar fallback={<UserRound aria-hidden />} />
        <span className="text-sm text-muted-foreground">icon fallback</span>
      </div>
    </Wrapper>
  );
}

// `fallbackDelay` waits before swapping in the fallback to avoid a flash for
// fast-loading images. Here a broken src + a 600ms delay shows the bare
// `bg-accent` circle briefly before the "AL" initials appear.
export function avatarFallbackDelay(): ReactNode {
  return (
    <Wrapper>
      <Avatar
        src="https://broken.example.com/missing.png"
        alt="Ada Lovelace"
        fallback="AL"
        fallbackDelay={600}
      />
    </Wrapper>
  );
}
