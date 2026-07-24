"use client";

import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/image` (dogfoods the registry) → auto-scanned.
import { Image } from "@/components/ui/image";

// Deterministic local fixture (no network dependency — VRT-safe): a 400×260 abstract
// landscape served from apps/docs/public. Shared with the playground (image-playground.tsx).
const SAMPLE = "/preview/landscape.svg";
// A same-origin path that 404s — makes the error fallback fire deterministically and fast.
const BROKEN = "/missing.png";

export function image(): ReactNode {
  return (
    <Wrapper>
      <div className="w-48">
        <Image
          src={SAMPLE}
          alt="A scenic landscape"
          aspectRatio="video"
          rounded="lg"
        />
      </div>
    </Wrapper>
  );
}

/**
 * The three rendered states, side by side:
 * - **Loaded** — the image decodes and fades in over the `bg-muted` frame.
 * - **Placeholder** — no `src`, so the bare `bg-muted` frame holds the reserved space.
 * - **Error fallback** — a 404ing src swaps to the neutral `fallback` slot (never a broken-image icon).
 */
export function imageAspectRatios(): ReactNode {
  return (
    <Wrapper>
      <div className="w-40">
        <Image
          src={SAMPLE}
          alt="Loaded image"
          aspectRatio="square"
          rounded="md"
        />
      </div>
      <div className="w-40">
        <Image alt="" aspectRatio="square" rounded="md" fallback={null} />
      </div>
      <div className="w-40">
        <Image
          src={BROKEN}
          alt="Failed to load"
          aspectRatio="square"
          rounded="md"
          fallback={<ImageOff aria-hidden />}
        />
      </div>
    </Wrapper>
  );
}

/**
 * The full `rounded` scale, `none` → `full`, applied to the same square tile.
 * `full` clips the image to a circle — the avatar-style media frame.
 */
export function imageRounded(): ReactNode {
  const radii = ["none", "sm", "md", "lg", "full"] as const;
  return (
    <Wrapper>
      {radii.map((rounded) => (
        <div key={rounded} className="flex flex-col items-center gap-2">
          <div className="w-24">
            <Image
              src={SAMPLE}
              alt={`Rounded ${rounded}`}
              aspectRatio="square"
              rounded={rounded}
            />
          </div>
          <span className="font-mono text-sm text-muted-foreground">
            {rounded}
          </span>
        </div>
      ))}
    </Wrapper>
  );
}

/**
 * `aspectRatio="auto"` (the default): no enforced ratio, so the image's own
 * intrinsic dimensions drive the box height. Constrain only the width and the
 * frame follows the source's natural proportions.
 */
export function imageAuto(): ReactNode {
  return (
    <Wrapper>
      <div className="w-56">
        {/* The fixture's intrinsic size is 400×260, so `auto` renders at that ratio. */}
        <Image
          src={SAMPLE}
          alt="A landscape at its intrinsic ratio"
          aspectRatio="auto"
          rounded="md"
        />
      </div>
    </Wrapper>
  );
}
