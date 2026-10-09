// @vegastack access-chip@0.25.7 sha256-/awkET4NIbCTwsPvMH8iGBX8+5wwxZPm/xyX0d8vXw4=

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
import {
  spaceHintLabel,
  type Space,
  type SpaceHint,
} from "@/components/ui/space-picker";
import { IconGlyph } from "@/components/ui/icon-glyph";

/* ------------------------------------------------------------------------------------------------
 * AccessChip — how far one record reaches, as ONE control in its header: the space's tile and name
 * (everyone in that space), a lock and "Only invited", a person-with-lock and "My space", or — for a
 * space the viewer cannot see — "Priya's My space" or "Private space"; a small globe when it is
 * also published to the web. It is a real button — it opens Share — with the full sentence in a
 * tooltip, so it replaces a row of bare, unfocusable access glyphs.
 * ----------------------------------------------------------------------------------------------*/

/** Who can open the record. */
export type AccessChipAccess =
  /** Everyone in `space` can open it. */
  | { kind: "space"; space: Space }
  /** Only the people it was shared with. */
  | { kind: "invited" }
  /** It lives in the viewer's own My space. */
  | { kind: "personal" }
  /** It lives in a space the viewer cannot see; `hint` says which kind, never which one. */
  | { kind: "hidden"; hint: SpaceHint };

/** The chip's name and its tooltip sentence for one reach. */
function describe(access: AccessChipAccess): { name: string; who: string } {
  switch (access.kind) {
    case "space":
      return {
        name: access.space.name,
        who: `Everyone in ${access.space.name} can open it`,
      };
    case "invited":
      return { name: "Only invited", who: "Only people invited can open it" };
    case "personal":
      return {
        name: "My space",
        who: "In My space: only you and the people you share with can open it",
      };
    case "hidden":
      return {
        name: spaceHintLabel(access.hint),
        who:
          access.hint.kind === "personal"
            ? `In ${access.hint.ownerName}'s My space: they and the people they share with can open it`
            : "Members of a private space can open it",
      };
  }
}

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
}

/**
 * `AccessChip` — the record's reach as one focusable chip; `onClick` opens Share.
 *
 * @example
 * <AccessChip access={{ kind: "space", space }} published={!!publicLink} onClick={share.show} />
 * <AccessChip access={{ kind: "hidden", hint: { kind: "private" } }} iconOnly onClick={share.show} />
 */
export function AccessChip({
  access,
  published = false,
  iconOnly = false,
  className,
  ...props
}: AccessChipProps) {
  const { name, who } = describe(access);
  const sentence = published
    ? `${who}. Anyone with the public link can view it.`
    : `${who}.`;
  const glyph =
    access.kind === "space" ? (
      <IconGlyph
        fallback={
          access.space.icon ??
          Array.from(access.space.name.trim())[0]?.toUpperCase()
        }
        hue={access.space.hue}
      />
    ) : access.kind === "hidden" ? (
      <IconGlyph
        fallback={access.hint.kind === "personal" ? <UserLock /> : <LockIcon />}
        aria-hidden
        data-slot="access-chip-icon"
      />
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
            aria-label={published ? `${name}, Published` : name}
            aria-description={sentence}
            className={cn(
              "max-w-60 min-w-0 gap-1.5 rounded-md text-sm font-normal text-foreground",
              iconOnly ? "relative" : "px-2",
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
