// @vegastack access-chip@0.23.115 sha256-hfdR0Wg/rXyge7Rtvw72SoQji1v6ZHONKRS4feR4YvE=

"use client";

import * as React from "react";
import { GlobeIcon, LockIcon, UserLock } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SpaceAvatar, type Space } from "@/components/ui/space-avatar";

/* ------------------------------------------------------------------------------------------------
 * AccessChip — how far one record reaches, as ONE control in its header: the space's tile and name
 * (everyone in that space), a lock and "Only invited", or a person-with-lock and "My space"; a small
 * globe when it is also published to the web. It is a real button — it opens Share — with the full
 * sentence in a tooltip, so it replaces a row of bare, unfocusable access glyphs.
 * ----------------------------------------------------------------------------------------------*/

/** Who can open the record. */
export type AccessChipAccess =
  | {
      /** Everyone in `space` can open it. */
      kind: "space";
      /** The record's space. */
      space: Space;
    }
  | {
      /** Only the people it was shared with. */
      kind: "invited";
    }
  | {
      /** It lives in the viewer's own My space. */
      kind: "personal";
    };

/** Every string `AccessChip` renders. */
export interface AccessChipLabels {
  invited: string;
  personal: string;
  published: string;
  /** The tooltip sentence; also the accessible description. */
  sentence: (access: AccessChipAccess, published: boolean) => string;
}

const defaultLabels: AccessChipLabels = {
  invited: "Only invited",
  personal: "My space",
  published: "Published",
  sentence: (access, published) => {
    const who =
      access.kind === "space"
        ? `Everyone in ${access.space.name} can open it`
        : access.kind === "invited"
          ? "Only people invited can open it"
          : "In My space: only you and the people you share with can open it";
    return published
      ? `${who}. Anyone with the public link can view it.`
      : `${who}.`;
  },
};

/** Props for `AccessChip`. */
export interface AccessChipProps extends Omit<
  React.ComponentPropsWithRef<typeof Button>,
  "children" | "variant" | "size"
> {
  /** Who can open the record. */
  access: AccessChipAccess;
  /** A public link is live; a small globe joins the chip. @default false */
  published?: boolean;
  /** Only the glyph (and the globe), for a narrow header; the name moves into the accessible label. @default false */
  iconOnly?: boolean;
  /** Override any rendered string. @default {} */
  labels?: Partial<AccessChipLabels>;
}

/**
 * `AccessChip` — the record's reach as one focusable chip; `onClick` opens Share.
 *
 * @example
 * <AccessChip access={{ kind: "space", space }} published={!!publicLink} onClick={share.show} />
 * <AccessChip access={{ kind: "personal" }} iconOnly onClick={share.show} />
 */
export function AccessChip({
  access,
  published = false,
  iconOnly = false,
  labels: labelsProp,
  className,
  ...props
}: AccessChipProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const name =
    access.kind === "space"
      ? access.space.name
      : access.kind === "invited"
        ? labels.invited
        : labels.personal;
  const sentence = labels.sentence(access, published);
  const glyph =
    access.kind === "space" ? (
      <SpaceAvatar space={access.space} size="2xs" showLock={false} />
    ) : access.kind === "invited" ? (
      <LockIcon aria-hidden data-slot="access-chip-icon" />
    ) : (
      <UserLock aria-hidden data-slot="access-chip-icon" />
    );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={iconOnly ? "icon-sm" : "sm"}
            data-slot="access-chip"
            data-access={access.kind}
            data-published={published ? "" : undefined}
            aria-label={`${name}${published ? `, ${labels.published}` : ""}`}
            aria-description={sentence}
            className={cn(
              "max-w-60 min-w-0 gap-1.5 rounded-md text-sm font-normal text-foreground",
              !iconOnly && "px-2",
              iconOnly && "relative",
              className,
            )}
            {...props}
          />
        }
      >
        {glyph}
        {iconOnly ? null : <span className="min-w-0 truncate">{name}</span>}
        {published ? (
          <GlobeIcon
            aria-hidden
            data-slot="access-chip-published"
            className={cn(
              "size-3 text-muted-foreground",
              iconOnly &&
                "absolute end-0.5 bottom-0.5 rounded-full bg-background",
            )}
          />
        ) : null}
      </TooltipTrigger>
      <TooltipContent>{sentence}</TooltipContent>
    </Tooltip>
  );
}
