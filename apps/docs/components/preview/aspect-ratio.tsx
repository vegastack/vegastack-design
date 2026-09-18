"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/aspect-ratio` (dogfoods the registry) → auto-scanned.
import { AspectRatio } from "@/components/ui/aspect-ratio";

/**
 * A deterministic local fixture (apps/docs/public/preview/landscape.svg) stands in for upstream's
 * remote avatar URL — same-origin, no network dependency, identical on every run.
 */
const PHOTO = "/preview/landscape.svg";

/** The child is absolutely positioned: `AspectRatio` is the `relative` box that reserves the space. */
const FILL = "absolute inset-0 size-full rounded-lg object-cover";

export function aspectRatio(): ReactNode {
  return (
    <Wrapper>
      <AspectRatio
        ratio={16 / 9}
        className="w-full max-w-sm rounded-lg bg-muted"
      >
        <img src={PHOTO} alt="A scenic landscape" className={FILL} />
      </AspectRatio>
    </Wrapper>
  );
}

export function aspectRatioSquare(): ReactNode {
  return (
    <Wrapper>
      <AspectRatio
        ratio={1 / 1}
        className="w-full max-w-48 rounded-lg bg-muted"
      >
        <img src={PHOTO} alt="A scenic landscape" className={FILL} />
      </AspectRatio>
    </Wrapper>
  );
}

export function aspectRatioPortrait(): ReactNode {
  return (
    <Wrapper>
      <AspectRatio
        ratio={9 / 16}
        className="w-full max-w-40 rounded-lg bg-muted"
      >
        <img src={PHOTO} alt="A scenic landscape" className={FILL} />
      </AspectRatio>
    </Wrapper>
  );
}

export function aspectRatioRtl(): ReactNode {
  return (
    <Wrapper className="items-start gap-8">
      <figure className="w-full max-w-64" dir="ltr">
        <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
          <img src={PHOTO} alt="A scenic landscape" className={FILL} />
        </AspectRatio>
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          Beautiful landscape
        </figcaption>
      </figure>
      <figure className="w-full max-w-64" dir="rtl">
        <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
          <img src={PHOTO} alt="منظر طبيعي جميل" className={FILL} />
        </AspectRatio>
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          منظر طبيعي جميل
        </figcaption>
      </figure>
    </Wrapper>
  );
}
