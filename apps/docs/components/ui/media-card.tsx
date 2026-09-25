// @vegastack media-card@0.23.11 sha256-YTmAEpg2RUwZmvEx+eNLuddJCtWrpPFxw1Sk1yPEjWk=

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
   * A badge after the meta — a status, or a warning pill (`<Badge variant="warning">`).
   * @default undefined
   */
  badge?: React.ReactNode;
  /**
   * A last meta item after the badge — usually a `RelativeTime` ("2h ago").
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
    className:
      "block min-h-6 min-w-0 truncate text-sm leading-6 font-medium text-inherit no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] hover:no-underline focus-visible:no-underline",
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
 * `MediaCard` — a record as a card: an image, the title, a meta line, a badge and a ⋯ menu. The
 * whole card is one link (no underline). `DataList`'s grid view renders one per row.
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
      className="min-w-0 truncate text-sm font-medium"
    >
      {title}
    </span>
  );
  const metaLine =
    meta != null || badge != null || timestamp != null ? (
      <div
        data-slot="media-card-meta"
        className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
      >
        {meta != null ? (
          <span className="min-w-0 truncate tabular-nums">{meta}</span>
        ) : null}
        {badge != null ? (
          <span className="flex shrink-0 items-center">{badge}</span>
        ) : null}
        {timestamp != null ? (
          <span className="shrink-0 tabular-nums">{timestamp}</span>
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
        <Thumbnail
          src={image}
          alt=""
          fallback={fallback}
          className={cn(
            lg && "aspect-video h-auto w-full rounded-none [&_svg]:size-8",
          )}
        />
      ) : null}
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          lg && surface && "p-3",
          lg && !surface && "pt-3",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {heading}
          {metaLine}
        </div>
        {actions != null ? (
          <div
            data-slot="media-card-actions"
            className="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/media-card:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
