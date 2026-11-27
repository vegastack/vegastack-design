// @vegastack avatar@0.136.7 sha256-vIF7d588V9cs+v1P2z2d2IeCD2bTupImAJp11IYRVyk=

"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cn } from "@vegastack/design";

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className,
      )}
      {...props}
    />
  );
}

type AvatarHue =
  | "blue"
  | "cyan"
  | "green"
  | "lime"
  | "yellow"
  | "orange"
  | "red"
  | "pink"
  | "magenta"
  | "purple";

const AVATAR_HUE_CLASSES: Record<AvatarHue, string> = {
  blue: "bg-tag-blue-subtle text-tag-blue-text",
  cyan: "bg-tag-cyan-subtle text-tag-cyan-text",
  green: "bg-tag-green-subtle text-tag-green-text",
  lime: "bg-tag-lime-subtle text-tag-lime-text",
  yellow: "bg-tag-yellow-subtle text-tag-yellow-text",
  orange: "bg-tag-orange-subtle text-tag-orange-text",
  red: "bg-tag-red-subtle text-tag-red-text",
  pink: "bg-tag-pink-subtle text-tag-pink-text",
  magenta: "bg-tag-magenta-subtle text-tag-magenta-text",
  purple: "bg-tag-purple-subtle text-tag-purple-text",
};

function AvatarFallback({
  className,
  hue,
  ...props
}: AvatarPrimitive.Fallback.Props & {
  hue?: AvatarHue;
}) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      data-hue={hue}
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-xs text-muted-foreground",
        hue && AVATAR_HUE_CLASSES[hue],
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute end-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-ink text-ink-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      {...props}
    />
  );
}

/** A group's children with fragments opened, so `max` counts the avatars inside them. */
function flattenFragments(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) =>
    React.isValidElement<{ children?: React.ReactNode }>(child) &&
    child.type === React.Fragment
      ? flattenFragments(child.props.children).map((inner) =>
          React.isValidElement(inner)
            ? React.cloneElement(inner, {
                key: JSON.stringify([child.key, inner.key]),
              })
            : inner,
        )
      : [child],
  );
}

function AvatarGroup({
  className,
  max,
  total,
  moreLabel = (count: number) => `${count} more`,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * The most avatars to show. Past it, the stack shows the first `max` and closes with an
   * `AvatarGroupCount` reading "+N" for the rest (API-44). Omit it to render every child.
   */
  max?: number;
  /**
   * How many people the stack stands for, when that is more than the avatars passed in (a list
   * the server only counted). Defaults to the number of `Avatar` children.
   */
  total?: number;
  /**
   * The count chip's accessible text for N hidden people.
   * @default (count) => `${count} more`
   */
  moreLabel?: (count: number) => string;
}) {
  const items = flattenFragments(children);
  const limit = max === undefined ? items.length : Math.max(0, Math.floor(max));
  const shown = items.slice(0, limit);
  const hidden = Math.max(0, (total ?? items.length) - shown.length);
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:data-here:ring-ink",
        className,
      )}
      {...props}
    >
      {max === undefined && total === undefined ? children : shown}
      {(max !== undefined || total !== undefined) && hidden > 0 ? (
        <AvatarGroupCount
          data-overflow=""
          className="group-has-data-[size=sm]/avatar-group:text-xs"
        >
          <span aria-hidden>+{hidden}</span>
          <span className="sr-only">{moreLabel(hidden)}</span>
        </AvatarGroupCount>
      ) : null}
    </div>
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
  type AvatarHue,
};
