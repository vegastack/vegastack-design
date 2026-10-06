// @vegastack media-card@0.24.1 sha256-LrO8qF7YnA0zcGACzjPTdoJDd51hpuRJXA+COE8VENk=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn } from "@vegastack/design";
import { Thumbnail } from "@/components/ui/thumbnail";

/** Props accepted by `MediaCard`. */
export interface MediaCardProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  /** The record's name — the card's link text. */
  title: React.ReactNode;
  /**
   * One muted meta line under the title ("8 products · 3 sub-families").
   * @default undefined
   */
  meta?: React.ReactNode;
  /**
   * A badge beside the title — a status, or a warning pill (`<Badge variant="warning">`). It sits
   * where `DataList`'s list view puts it, after the title on the same line; a long title
   * truncates before it, and the badge never shrinks.
   * @default undefined
   */
  badge?: React.ReactNode;
  /**
   * A last meta item after the meta — usually a `RelativeTime` ("2h ago").
   * @default undefined
   */
  timestamp?: React.ReactNode;
  /**
   * The ⋯ slot on the right — a `RowActionsMenu`. It shows on hover and on focus, and always on
   * a touch screen; it sits above the card's link, so it never follows it.
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * The image URL. Missing or failing to load shows `fallback`. A card with neither `image` nor
   * `fallback` has no image area at all.
   * @default undefined
   */
  image?: string | null;
  /**
   * A tiny blurred preview of `image` as a data URL, covering the image area until it loads.
   * @default undefined
   */
  imagePlaceholder?: string;
  /**
   * Candidate sources for `image` (`"a.webp 480w, b.webp 1280w"`), with `imageSizes`.
   * @default undefined
   */
  imageSrcSet?: string;
  /**
   * Which `imageSrcSet` width the image renders at.
   * @default undefined
   */
  imageSizes?: string;
  /**
   * A small chip over the image's bottom end — a video's "▶ 1:24", a recording's "2:10". It sits
   * on a dark scrim with light ink, so it reads over any picture, and takes no pointer events, so
   * a click on it still opens the card. Shown only when the card has an image area; made for
   * `size="lg"`.
   * @default undefined
   */
  imageBadge?: React.ReactNode;
  /**
   * What shows when there is no image — the app's brand mark.
   * @default <ImageIcon />
   */
  fallback?: React.ReactNode;
  /**
   * Make the whole card a link. The title is the link, stretched over the card.
   * @default undefined
   */
  href?: string;
  /**
   * The element the link renders — a router link such as `<Link href="" />`. The card's `href`
   * wins over the template's.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * `default` puts a 48px thumbnail on the left; `lg` puts a 16:9 image on top.
   * @default "default"
   */
  size?: "default" | "lg";
  /**
   * Draw the card's own border, padding and hover. Off when a host (a Board card) owns the
   * surface.
   * @default true
   */
  surface?: boolean;
}

/**
 * The weight of a record's title, shared by `MediaCard` (the grid view) and `DataList`'s first
 * column (the list view), so a record's name reads the same in both.
 */
export const RECORD_TITLE_CLASS = "font-medium";

function CardLink({
  href,
  render,
  children,
}: {
  href: string;
  render?: React.ReactElement;
  children: React.ReactNode;
}) {
  const props = {
    href,
    "data-slot": "media-card-link",
    // `min-w-6`: beside a badge the title truncates, but the link keeps a 24px pointer target.
    className: cn(
      RECORD_TITLE_CLASS,
      "block min-h-6 min-w-6 truncate text-sm leading-6 text-inherit no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] hover:no-underline focus-visible:no-underline",
    ),
    children,
  };
  if (render)
    return React.cloneElement(
      render,
      mergeProps(render.props as object, props) as object,
    );
  return <a {...props} />;
}

/**
 * `MediaCard` — a record as a card: an image, the title with its badge, a meta line and a ⋯
 * menu. The whole card is one link (no underline). `DataList`'s grid view renders one per row.
 *
 * @example
 * <MediaCard
 *   href={`/families/${f.id}`}
 *   linkRender={<Link href="" />}
 *   image={f.imageUrl}
 *   fallback={<BrandMark />}
 *   title={f.name}
 *   meta="8 products · 3 sub-families"
 *   badge={<Badge variant="warning"><TriangleAlert />3 missing specs</Badge>}
 *   timestamp={<RelativeTime date={f.updatedAt} format="suffix" />}
 *   imageBadge={<><PlayIcon aria-hidden />1:24</>}
 *   actions={<RowActionsMenu label={f.name} actions={actions} />}
 * />
 */
export function MediaCard({
  title,
  meta,
  badge,
  timestamp,
  actions,
  image,
  imagePlaceholder,
  imageSrcSet,
  imageSizes,
  imageBadge,
  fallback,
  href,
  linkRender,
  size = "default",
  surface = true,
  className,
  ...props
}: MediaCardProps) {
  const lg = size === "lg";
  const hasMedia = image !== undefined || fallback !== undefined;
  const heading = href ? (
    <CardLink href={href} render={linkRender}>
      {title}
    </CardLink>
  ) : (
    <span
      data-slot="media-card-title"
      className={cn("min-w-0 truncate text-sm", RECORD_TITLE_CLASS)}
    >
      {title}
    </span>
  );
  const titleLine =
    badge != null ? (
      <div
        data-slot="media-card-heading"
        className="flex min-w-0 items-center gap-2"
      >
        {heading}
        <span
          data-slot="media-card-badge"
          className="flex shrink-0 items-center"
        >
          {badge}
        </span>
      </div>
    ) : (
      heading
    );
  const thumbnail = hasMedia ? (
    <Thumbnail
      src={image}
      srcSet={imageSrcSet}
      sizes={imageSizes}
      placeholder={imagePlaceholder}
      alt=""
      fallback={fallback}
      className={cn(
        lg && "aspect-video h-auto w-full rounded-none [&_svg]:size-8",
      )}
    />
  ) : null;
  const metaLine =
    meta != null || timestamp != null ? (
      <div
        data-slot="media-card-meta"
        className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
      >
        {meta != null ? (
          <span className="min-w-0 truncate tabular-nums">{meta}</span>
        ) : null}
        {timestamp != null ? (
          <span className="shrink-0">{timestamp}</span>
        ) : null}
      </div>
    ) : null;
  return (
    <div
      data-slot="media-card"
      data-size={size}
      className={cn(
        "group/media-card relative flex min-w-0 text-card-foreground",
        surface &&
          "rounded-lg border border-border bg-card transition-colors hover:bg-accent/50 has-[[data-slot=media-card-link]:focus-visible]:bg-accent/50",
        lg ? "flex-col overflow-hidden" : "items-center gap-3",
        surface && !lg && (hasMedia ? "p-2 pe-3" : "px-3 py-2.5"),
        className,
      )}
      {...props}
    >
      {hasMedia ? (
        imageBadge != null ? (
          <div
            data-slot="media-card-media"
            className={cn("relative flex shrink-0", lg && "w-full")}
          >
            {thumbnail}
            <span
              data-slot="media-card-image-badge"
              // `scrim/60`, not the tile scrim's `/40`: small text on `/40` over a light frame
              // measures under 3:1.
              className="pointer-events-none absolute end-2 bottom-2 flex items-center gap-1 rounded-sm bg-scrim/60 px-1.5 py-0.5 text-xs font-medium text-scrim-foreground tabular-nums [&_svg]:size-3"
            >
              {imageBadge}
            </span>
          </div>
        ) : (
          thumbnail
        )
      ) : null}
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          lg && surface && "p-3",
          lg && !surface && "pt-3",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {titleLine}
          {metaLine}
        </div>
        {actions != null ? (
          <div
            data-slot="media-card-actions"
            // Top-aligned: the ⋯ centres on the title's first line, never on the whole text block.
            className="relative z-10 -mt-1.5 shrink-0 self-start opacity-0 transition-opacity group-hover/media-card:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
