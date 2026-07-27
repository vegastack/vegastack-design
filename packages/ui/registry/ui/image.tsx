// @vegastack image@0.4.1 sha256-gmcVpbPQ+YOxkKdOFIBXVdKM7GymyXWWRMI41wKD9kA=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * Image variants — `aspectRatio` reserves space (so the layout never shifts as the image decodes)
 * and `rounded` controls the corner radius. Every value is a semantic token / scale utility
 * (`aspect-square`, `aspect-video`, `bg-muted`, `rounded-*`) — no hardcoded sizes or palettes. The
 * root is always `overflow-hidden` with a `bg-muted` surface, so an in-flight or failed image never
 * flashes transparent.
 * ----------------------------------------------------------------------------------------------*/

export const imageVariants = cva("relative block overflow-hidden bg-muted", {
  variants: {
    aspectRatio: {
      /** 1:1 — square thumbnails, gallery tiles, product shots. */
      square: "aspect-square",
      /** 16:9 — video frames, hero/cover banners. */
      video: "aspect-video",
      /** No enforced ratio — the image's intrinsic size drives the box. */
      auto: "",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    },
  },
  defaultVariants: { aspectRatio: "auto", rounded: "md" },
});

/** Props accepted by `Image`. */
export interface ImageProps
  extends
    Omit<React.ComponentPropsWithRef<"img">, "src" | "alt">,
    VariantProps<typeof imageVariants> {
  /**
   * Image source. Pass a fully-resolved, public URL — this component is purely
   * presentational and does NOT resolve storage keys. R2 (or any CDN) key → URL
   * resolution stays app-side; resolve before passing `src`.

   * @default undefined
   */
  src?: string;
  /**
   * Accessible alt text describing the image. Required for meaningful images;
   * pass an empty string (`alt=""`) for purely decorative images so screen
   * readers skip them.
   */
  alt: string;
  /**
   * Aspect ratio of the framed box — reserves space so the layout doesn't shift
   * as the image decodes.
   * - `square`: 1:1.
   * - `video`: 16:9.
   * - `auto`: intrinsic size (no enforced ratio, default).
   * @default 'auto'
   */
  aspectRatio?: "square" | "video" | "auto";
  /**
   * Corner radius of the frame (and the image clipped inside it).
   * @default 'md'
   */
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  /**
   * Content shown when the image fails to load (broken URL, network error) or
   * when no `src` is provided — e.g. an icon, initials, or a label. When omitted,
   * the bare `bg-muted` frame shows.

   * @default undefined
   */
  fallback?: React.ReactNode;
}

/**
 * `Image` — a presentational, framed image with a loading skeleton and an error
 * fallback. It reserves space via `aspectRatio` (no layout shift), shows a
 * `bg-muted` placeholder until the image loads, and swaps to `fallback` on error
 * — so there is never a broken-image icon.
 *
 * **Presentational only (G7 split).** It takes a resolved `src` and does NOT
 * fetch data, resolve storage keys, or talk to Cloudflare/R2. Resolve R2/CDN
 * keys to public URLs in the app (and pick the optimized variant / `srcSet`)
 * before passing them in.
 *
 * @example
 * <Image src="https://cdn.example.com/cover.webp" alt="Cover" aspectRatio="video" />
 *
 * @example
 * // square thumbnail with an initials fallback on error
 * <Image src={url} alt="Ada Lovelace" aspectRatio="square" fallback="AL" />
 */
export function Image({
  className,
  src,
  alt,
  aspectRatio = "auto",
  rounded = "md",
  fallback,
  ref,
  ...props
}: ImageProps) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const setImgRef = React.useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Reset load state whenever the source changes. Sync from the element so an already-cached
  // image (whose `load` may have fired before this passive effect) isn't stuck behind the skeleton.
  React.useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    const img = imgRef.current;
    setStatus(
      img && img.complete && img.naturalWidth > 0 ? "loaded" : "loading",
    );
  }, [src]);

  const showFallback = status === "error";

  return (
    <span
      data-slot="image"
      data-aspect-ratio={aspectRatio}
      data-state={status}
      className={cn(imageVariants({ aspectRatio, rounded }), className)}
    >
      {src && !showFallback ? (
        <img
          ref={setImgRef}
          data-slot="image-img"
          src={src}
          alt={alt}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "size-full object-cover transition-opacity duration-fast ease-standard",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
          {...props}
        />
      ) : null}

      {/* Skeleton placeholder — pulses under the image until it has decoded. */}
      {status === "loading" ? (
        <span
          aria-hidden="true"
          data-slot="image-skeleton"
          className="absolute inset-0 animate-pulse bg-muted motion-reduce:animate-none"
        />
      ) : null}

      {/* Error / empty fallback — shown when the image fails or no src is given. */}
      {showFallback ? (
        <span
          data-slot="image-fallback"
          // The broken/missing image still needs its accessible name (register P2-28):
          // expose the alt on the fallback unless the image is decorative (alt="").
          {...(alt
            ? { role: "img", "aria-label": alt }
            : { "aria-hidden": true })}
          className="absolute inset-0 flex items-center justify-center text-base font-medium text-muted-foreground [&_svg]:size-1/3"
        >
          {fallback}
        </span>
      ) : null}
    </span>
  );
}
