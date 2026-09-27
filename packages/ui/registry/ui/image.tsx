// @vegastack image@0.23.59 sha256-woyubpxI7ImexKkUSfYirNh+zitYns/sropUtoZ7IFE=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeRefs } from "@vegastack/design";

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
  /**
   * A tiny preview of the image as a data URL (a 16px blur, under 1 KB). It fills the frame as a
   * blurred cover until the image has loaded, then fades out under it — in place of the pulsing
   * skeleton. `srcSet` and `sizes` pass straight to the `<img>`.
   * @default undefined
   */
  placeholder?: string;
  /**
   * Native lazy-loading hint. Defaults to `lazy` so an off-screen image costs
   * nothing until it scrolls near the viewport (audit B4-08 — `MarkdownView`
   * already did this for its images). For an above-the-fold image, pass
   * `priority` instead, which also raises the fetch priority.
   * @default 'lazy'
   */
  loading?: "lazy" | "eager";
  /**
   * An above-the-fold image — a detail page's hero, the first row of a grid, anything visible
   * without scrolling. Loads `eager` with `fetchPriority="high"`, so the browser fetches it from
   * the HTML ahead of other images instead of deferring it and delaying LCP. Leave it off below
   * the fold.
   * @default false
   */
  priority?: boolean;
  /**
   * Native decoding hint. `async` keeps decode off the main thread so a large
   * image cannot block the frame it lands in.
   * @default 'async'
   */
  decoding?: "async" | "sync" | "auto";
}

/** No subscription: `useSyncExternalStore` here only tells a hydrating render from a client one. */
function subscribeNothing() {
  return () => {};
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
 *
 * @example
 * // an above-the-fold hero: fetched eagerly at high priority
 * <Image src={hero.url} alt={product.name} aspectRatio="square" priority />
 *
 * @example
 * // a stored image: the 480w variant, a srcset, and its blur preview until it loads
 * <Image src={file.url480} srcSet={file.srcset} sizes="(min-width: 768px) 50vw, 100vw" placeholder={file.blur} alt="" />
 */
export function Image({
  className,
  src,
  alt,
  aspectRatio = "auto",
  rounded = "md",
  fallback,
  placeholder,
  loading,
  priority = false,
  decoding = "async",
  fetchPriority,
  onLoad,
  onError,
  ref,
  ...props
}: ImageProps) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const setImgRef = React.useMemo(() => mergeRefs(imgRef, ref), [ref]);
  // The fade-in is only for an image mounted on the client, where the first paint is ours. An
  // image in the server HTML is never hidden: the browser paints it as soon as it decodes —
  // before hydration, and at once when cached — and hiding it until hydration is a flash.
  const hydrated = React.useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const [fade] = React.useState(hydrated);

  // Reset load state whenever the source changes, reading the element's own state before paint:
  // a cached image (or one whose `load`/`error` fired before hydration) resolves at once, with no
  // fade and no skeleton.
  React.useLayoutEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setStatus("loaded");
    else if (img && img.complete && img.currentSrc) setStatus("error");
    else setStatus("loading");
  }, [src]);

  const showFallback = status === "error";

  return (
    <span
      data-slot="image"
      data-aspect-ratio={aspectRatio}
      data-state={status}
      className={cn(imageVariants({ aspectRatio, rounded }), className)}
    >
      {/* The blurred preview sits UNDER the image (the image is `relative`, so it paints above
          this absolute layer) and fades out as the image fades in, so there is no flash of the
          bare frame between them. `scale-110` pushes the blur's soft edge outside the clip. */}
      {placeholder && src && !showFallback ? (
        <span
          aria-hidden="true"
          data-slot="image-placeholder"
          style={{ backgroundImage: `url("${placeholder}")` }}
          className={cn(
            "absolute inset-0 scale-110 bg-cover bg-center blur-lg transition-opacity duration-fast ease-standard",
            status === "loaded" ? "opacity-0" : "opacity-100",
          )}
        />
      ) : null}

      {src && !showFallback ? (
        <img
          ref={setImgRef}
          data-slot="image-img"
          src={src}
          alt={alt}
          loading={loading ?? (priority ? "eager" : "lazy")}
          fetchPriority={fetchPriority ?? (priority ? "high" : undefined)}
          decoding={decoding}
          {...props}
          // The caller's handlers run too; the frame's own state always resolves.
          onLoad={(event) => {
            setStatus("loaded");
            onLoad?.(event);
          }}
          onError={(event) => {
            setStatus("error");
            onError?.(event);
          }}
          className={cn(
            "relative size-full object-cover",
            fade && "transition-opacity duration-fast ease-standard",
            fade && status !== "loaded" && "opacity-0",
          )}
        />
      ) : null}

      {/* Skeleton placeholder — pulses under the image until it has decoded.
          It spells `Skeleton`'s recipe (`animate-pulse bg-muted`) rather than composing
          `Skeleton` itself, and the reason is the root element: `Image`'s frame is a `<span>`
          so a framed image stays phrasing content and is legal inside a paragraph or a label,
          while `skeleton.tsx` renders a hard-coded `<div>`. A `<div>` inside a `<span>` is
          re-parented by the HTML parser, so the server markup and the client tree would
          disagree and hydration would break. The radius is deliberately absent too — the frame
          is `overflow-hidden`, so the placeholder is clipped to the frame's own corner. */}
      {status === "loading" && !placeholder ? (
        <span
          aria-hidden="true"
          data-slot="image-skeleton"
          className="absolute inset-0 animate-pulse bg-muted"
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
          className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground [&_svg]:size-1/3"
        >
          {fallback}
        </span>
      ) : null}
    </span>
  );
}
