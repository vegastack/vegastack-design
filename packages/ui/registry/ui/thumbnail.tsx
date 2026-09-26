// @vegastack thumbnail@0.23.43 sha256-9u6gzryvPEytwiwy/5/8OIEK4vOkI9Jbkdjotz1dwoI=

"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@vegastack/design";

/** Props accepted by `Thumbnail`. */
export interface ThumbnailProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  /**
   * The image URL. Empty, missing or failing to load shows `fallback` instead.
   * @default undefined
   */
  src?: string | null;
  /**
   * The image's text alternative. Pass `""` when the name sits right next to it (a list row, a
   * card title), so the image is decorative.
   */
  alt: string;
  /**
   * What shows when there is no image, or it fails to load — the app's brand mark, an icon.
   * @default <ImageIcon />
   */
  fallback?: React.ReactNode;
  /**
   * Candidate sources for the browser to pick from (`"a.webp 480w, b.webp 1280w"`), with `sizes`.
   * @default undefined
   */
  srcSet?: string;
  /**
   * Which `srcSet` width the thumbnail renders at.
   * @default undefined
   */
  sizes?: string;
  /**
   * A tiny preview of the image as a data URL (a 16px blur): a blurred cover under the image
   * until it has loaded.
   * @default undefined
   */
  placeholder?: string;
  /**
   * `sm` is 32px (a list row), `default` is 48px (a card).
   * @default "default"
   */
  size?: "sm" | "default";
}

/**
 * `Thumbnail` — a small, rounded, cover-fit image with a fallback for records that have none
 * (or whose image fails to load). 32px in a list row, 48px in a card.
 *
 * @example
 * <Thumbnail src={family.imageUrl} alt="" fallback={<BrandMark />} size="sm" />
 *
 * @example
 * <Thumbnail src={file.url480} srcSet={file.srcset} sizes="48px" placeholder={file.blur} alt="" />
 */
export function Thumbnail({
  src,
  alt,
  fallback,
  srcSet,
  sizes,
  placeholder,
  size = "default",
  className,
  ...props
}: ThumbnailProps) {
  // The src that failed, so a new src gets its own attempt.
  const [failed, setFailed] = React.useState<string | null>(null);
  const showImage = !!src && failed !== src;
  // The src that has loaded, so the blur preview stays only until its own image is in. An image
  // already decoded before hydration fires no `load`, so the element is read once on mount too.
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const imgRef = React.useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete && img.naturalWidth > 0 && src) setLoaded(src);
    },
    [src],
  );
  return (
    <span
      data-slot="thumbnail"
      data-size={size}
      data-fallback={showImage ? undefined : ""}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground",
        size === "sm"
          ? "size-8 [&_svg:not([class*='size-'])]:size-4"
          : "size-12 [&_svg:not([class*='size-'])]:size-6",
        className,
      )}
      {...props}
    >
      {showImage && placeholder && loaded !== src ? (
        <span
          aria-hidden="true"
          data-slot="thumbnail-placeholder"
          style={{ backgroundImage: `url("${placeholder}")` }}
          className="absolute inset-0 scale-110 bg-cover bg-center blur-sm"
        />
      ) : null}
      {showImage ? (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
          className="relative size-full object-cover"
        />
      ) : (
        <span
          data-slot="thumbnail-fallback"
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className="flex size-full items-center justify-center"
        >
          {fallback ?? <ImageIcon aria-hidden />}
        </span>
      )}
    </span>
  );
}
