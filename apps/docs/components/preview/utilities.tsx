import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";

/* ----------------------------------------------------------------------------
 * shimmer
 * --------------------------------------------------------------------------*/

export function shimmer(): ReactNode {
  return (
    <Wrapper>
      <p className="shimmer text-muted-foreground">Generating response…</p>
    </Wrapper>
  );
}

export function shimmerWithMarker(): ReactNode {
  return (
    <Wrapper>
      <Marker className="w-64">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">Reading 4 files…</MarkerContent>
      </Marker>
    </Wrapper>
  );
}

export function shimmerColor(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-base text-muted-foreground">
        <p className="shimmer shimmer-color-primary">Highlight: primary ink</p>
        <p className="shimmer shimmer-color-info">Highlight: info blue</p>
        <p className="shimmer shimmer-color-info/60">Highlight: info / 60%</p>
      </div>
    </Wrapper>
  );
}

export function shimmerDuration(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-base text-muted-foreground">
        <p className="shimmer">Default (2s)</p>
        <p className="shimmer shimmer-duration-1000">Faster (1s)</p>
      </div>
    </Wrapper>
  );
}

export function shimmerSpread(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-base text-muted-foreground">
        <p className="shimmer shimmer-spread-4">Narrow highlight band</p>
        <p className="shimmer shimmer-spread-24">Wide highlight band</p>
      </div>
    </Wrapper>
  );
}

export function shimmerAngle(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-base text-muted-foreground">
        <p className="shimmer">Default tilt (20°)</p>
        <p className="shimmer shimmer-angle-45">Steeper tilt (45°)</p>
      </div>
    </Wrapper>
  );
}

export function shimmerReverse(): ReactNode {
  return (
    <Wrapper>
      <p className="shimmer shimmer-reverse text-muted-foreground">
        Reversed sweep direction
      </p>
    </Wrapper>
  );
}

export function shimmerOnce(): ReactNode {
  return (
    <Wrapper>
      <p className="shimmer shimmer-once shimmer-duration-1100 text-foreground">
        Response generated.
      </p>
    </Wrapper>
  );
}

export function shimmerRtl(): ReactNode {
  return (
    <Wrapper>
      <p dir="rtl" className="shimmer text-muted-foreground">
        جارٍ إنشاء الرد…
      </p>
    </Wrapper>
  );
}

/* ----------------------------------------------------------------------------
 * scroll-fade
 * --------------------------------------------------------------------------*/

export function scrollFade(): ReactNode {
  return (
    <Wrapper>
      <div className="scroll-fade h-48 w-64 overflow-y-auto rounded-lg border border-border">
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="rounded-md bg-muted px-3 py-2 text-base text-muted-foreground"
            >
              Row {i + 1}
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

export function scrollFadeHorizontal(): ReactNode {
  return (
    <Wrapper>
      <div className="scroll-fade-x flex w-72 gap-2 overflow-x-auto rounded-lg border border-border p-3">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className="flex size-20 shrink-0 items-center justify-center rounded-md bg-muted text-base text-muted-foreground"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function scrollFadeEdge(): ReactNode {
  return (
    <Wrapper>
      <div className="flex gap-6">
        {(["scroll-fade-t", "scroll-fade-b"] as const).map((edge) => (
          <div key={edge} className="flex flex-col items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {edge}
            </span>
            <div
              className={`${edge} h-44 w-40 overflow-y-auto rounded-lg border border-border`}
            >
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-muted px-3 py-2 text-base text-muted-foreground"
                  >
                    Row {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function scrollFadeSize(): ReactNode {
  return (
    <Wrapper>
      <div className="flex gap-6">
        {(["scroll-fade-4", "scroll-fade-24"] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {size}
            </span>
            <div
              className={`scroll-fade ${size} h-44 w-40 overflow-y-auto rounded-lg border border-border`}
            >
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-muted px-3 py-2 text-base text-muted-foreground"
                  >
                    Row {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
