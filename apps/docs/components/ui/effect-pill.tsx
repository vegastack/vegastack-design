// @vegastack effect-pill@0.77.0 sha256-yxnsIYaS/vtNrxrp/7w8p/VE/Uy+J3xWA5mKGTRt1uo=

import type * as React from "react";
import {
  CreditCard,
  Eye,
  Pencil,
  PencilLine,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@vegastack/design";

import { Badge, type BadgeVariant } from "@/components/ui/badge";

/* ------------------------------------------------------------------------------------------------
 * EffectPill — what one step of an agent's plan does to the world, in one word: read · draft ·
 * change · send · remove · spend. The hue rises with the reach: reading and drafting are quiet,
 * a change is informational, sending and spending warn, removing is destructive. The word always
 * carries the meaning; the colour only repeats it.
 * ----------------------------------------------------------------------------------------------*/

/** What a step does: only looks, writes a draft, changes records, sends outside, deletes, spends money. */
export type PlanEffect =
  "read" | "draft" | "change" | "send" | "remove" | "spend";

/** Every effect, least reach first. */
export const PLAN_EFFECTS: readonly PlanEffect[] = [
  "read",
  "draft",
  "change",
  "send",
  "remove",
  "spend",
];

const EFFECT_WORDS: Record<PlanEffect, string> = {
  read: "read",
  draft: "draft",
  change: "change",
  send: "send",
  remove: "remove",
  spend: "spend",
};

const EFFECT_ICONS: Record<PlanEffect, typeof Eye> = {
  read: Eye,
  draft: PencilLine,
  change: Pencil,
  send: Send,
  remove: Trash2,
  spend: CreditCard,
};

const EFFECT_VARIANT: Record<PlanEffect, BadgeVariant> = {
  read: "outline",
  draft: "outline",
  change: "info",
  send: "warning",
  remove: "destructive",
  spend: "warning",
};

/** Props accepted by `EffectPill`. */
export interface EffectPillProps extends Omit<
  React.ComponentProps<typeof Badge>,
  "children" | "variant"
> {
  /** What the step does. */
  effect: PlanEffect;
  /** The word shown (and, icon only, the accessible name). @default the effect: "read", "send"… */
  label?: string;
  /** Only the icon, for a narrow column; the word stays for screen readers. @default false */
  iconOnly?: boolean;
}

/**
 * `EffectPill` — one step's effect as a small pill: an icon and a word, hued by reach. `iconOnly`
 * keeps the icon for a phone-width column and leaves the word to screen readers.
 *
 * @example
 * <EffectPill effect="send" />
 * <EffectPill effect="remove" iconOnly />
 */
export function EffectPill({
  effect,
  label,
  iconOnly = false,
  className,
  ...props
}: EffectPillProps) {
  const Icon = EFFECT_ICONS[effect];
  const words = label ?? EFFECT_WORDS[effect];
  return (
    <Badge
      variant={EFFECT_VARIANT[effect]}
      data-slot="effect-pill"
      data-effect={effect}
      data-icon-only={iconOnly ? "" : undefined}
      className={cn(
        effect === "read" || effect === "draft"
          ? "text-muted-foreground"
          : undefined,
        iconOnly && "size-5 px-0",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden data-icon={iconOnly ? undefined : "inline-start"} />
      <span className={iconOnly ? "sr-only" : undefined}>{words}</span>
    </Badge>
  );
}
