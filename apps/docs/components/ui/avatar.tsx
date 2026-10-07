// @vegastack avatar@0.24.5 sha256-E0EPf6oELFK5Bc6nGyCFVTYTScURhzfiMSjsURiPlS0=

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
        "absolute end-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
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
