// @vegastack thumbnail@0.23.10 sha256-ogozCXyYsx44RZHtEOgOkRfD2iwzhiz3uJ/UDSs2BiE=

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
 */
export function Thumbnail({
  src,
  alt,
  fallback,
  size = "default",
  className,
  ...props
}: ThumbnailProps) {
  // The src that failed, so a new src gets its own attempt.
  const [failed, setFailed] = React.useState<string | null>(null);
  const showImage = !!src && failed !== src;
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
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(src)}
          className="size-full object-cover"
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
