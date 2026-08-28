// @vegastack pricing-section@0.5.0 sha256-srj6+mXSGIraDxzRZhtRvnP6J2F4OZIo6OwkG41DrmA=

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@vegastack/design";
// `Badge` marks the highlighted plan; shadcn rewrites this alias on `add`, and vitest/tsconfig
// map `@/components/ui/*` → `registry/ui/*`.
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------------------------------------
 * PricingSection / PlanCard — the marketing pricing family (Wave 4, from the pricing-page
 * teardown): hairline plan cards with a mono price display (an IMPROVEMENT over the reference —
 * numerals are mono per the system's numbers rule), check feature lists, in-card CTA slot, and
 * an info-family highlight treatment + "Popular" badge for the promoted plan. Server-safe;
 * billing toggles compose from `Segmented` at the call site.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `PricingSection`. */
export type PricingSectionProps = React.ComponentPropsWithRef<"div">;

/**
 * `PricingSection` — a responsive card row that fits as many 16rem-minimum cards as its own
 * available width allows. This follows the section's rendered width rather than the viewport, so
 * it also reflows correctly inside sidebars, split panes, and docs preview frames.
 * @example <PricingSection><PlanCard name="Free" price="$0" /></PricingSection>
 */
export function PricingSection({ className, ...props }: PricingSectionProps) {
  return (
    <div
      data-slot="pricing-section"
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(min(100%,var(--container-3xs)),1fr))] gap-4",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `PlanCard`. */
export interface PlanCardProps extends React.ComponentPropsWithRef<"div"> {
  /** Plan name ("Free", "Pro"). */
  name: React.ReactNode;
  /** The price display — mono numerals ("$79", "Custom"). */
  price: React.ReactNode;
  /** Muted line under the price ("Per user/month, billed annually"). @default undefined */
  priceNote?: React.ReactNode;
  /** Short positioning line ("For growing teams…"). @default undefined */
  description?: React.ReactNode;
  /** Feature strings rendered as a check list. @default undefined */
  features?: React.ReactNode[];
  /** The plan's CTA (a full-width Button). @default undefined */
  action?: React.ReactNode;
  /**
   * Promote this plan: info-family border + the "Popular" badge.
   * @default false
   */
  highlighted?: boolean;
  /** Copy for the highlight badge. @default 'Popular' */
  highlightLabel?: React.ReactNode;
}

/**
 * `PlanCard` — one plan.
 *
 * @example
 * <PlanCard
 *   name="Pro"
 *   price="$79"
 *   priceNote="Per user/month, billed annually"
 *   description="For growing teams to scale revenue."
 *   features={['Call intelligence', 'Permission controls', 'Advanced reporting']}
 *   action={<Button className="w-full">Continue with Pro</Button>}
 *   highlighted
 * />
 */
export function PlanCard({
  className,
  name,
  price,
  priceNote,
  description,
  features,
  action,
  highlighted = false,
  highlightLabel = "Popular",
  ref,
  ...props
}: PlanCardProps) {
  return (
    <div
      ref={ref}
      data-slot="plan-card"
      data-highlighted={highlighted ? "" : undefined}
      className={cn(
        "relative flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground",
        highlighted && "border-info/(--alpha-outline-border)",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-label">{name}</h3>
        {highlighted ? (
          <Badge intent="info" bordered>
            {highlightLabel}
          </Badge>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div
          data-slot="plan-card-price"
          className="font-mono text-3xl tabular-nums"
        >
          {price}
        </div>
        {priceNote ? (
          <p className="text-sm text-muted-foreground">{priceNote}</p>
        ) : null}
      </div>
      {description ? (
        <p className="text-base text-muted-foreground">{description}</p>
      ) : null}
      {features?.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-base">
              <Check
                aria-hidden
                className="mt-1 size-(--icon-inline) shrink-0 text-success-text"
              />
              <span className="min-w-0">{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {action ? (
        <div data-slot="plan-card-action" className="mt-auto pt-2">
          {action}
        </div>
      ) : null}
    </div>
  );
}
