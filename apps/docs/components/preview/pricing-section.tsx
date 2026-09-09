"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/pricing-section` (dogfoods the registry) → auto-scanned.
import { useState } from "react";
import { PlanCard, PricingSection } from "@/components/ui/pricing-section";
import { Button } from "@/components/ui/button";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";

export function pricingSection(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      {/* No viewport grid override (`lg:grid-cols-*`): that would force a fixed column count from
          the browser viewport and stay 3-up inside a narrow preview frame. PricingSection's own
          `auto-fit` track follows the section's ACTUAL width, so it collapses to one column on a
          small screen and fans back out when there's room. */}
      <PricingSection className="w-full">
        <PlanCard
          name="Free"
          price="$0"
          priceNote="Per user/month, billed annually"
          description="For individuals exploring the product."
          features={[
            "Real-time syncing",
            "Automatic enrichment",
            "Up to 3 seats",
          ]}
          action={
            <Button variant="outline" className="w-full">
              Start for free
            </Button>
          }
        />
        <PlanCard
          name="Pro"
          price="$79"
          priceNote="Per user/month, billed annually"
          description="For growing teams to scale revenue."
          features={[
            "Call intelligence",
            "Permission controls",
            "Advanced reporting",
          ]}
          action={<Button className="w-full">Continue with Pro</Button>}
          highlighted
        />
        <PlanCard
          name="Enterprise"
          price="Custom"
          priceNote="Billed annually"
          description="For large orgs needing control."
          features={[
            "Unlimited objects",
            "Unlimited teams",
            "Security & admin controls",
          ]}
          action={
            <Button variant="outline" className="w-full">
              Talk to sales
            </Button>
          }
        />
      </PricingSection>
    </Wrapper>
  );
}

/**
 * The billing-cycle toggle above the grid — the composition the docs page recommends but had
 * no preview for. `Segmented` owns the cycle; `PricingSection` is presentational, so the price
 * and note are just derived state at the call site. The promoted plan keeps its `surface-3`
 * rung and alpha-`primary` hairline through the switch.
 */
export function pricingSectionBillingCycle(): ReactNode {
  const [cycle, setCycle] = useState("annual");
  const annual = cycle === "annual";
  const note = annual ? "Per user/month, billed annually" : "Per user/month";
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <div className="flex justify-center">
        <Segmented
          value={cycle}
          onValueChange={setCycle}
          aria-label="Billing cycle"
        >
          <SegmentedItem value="monthly">Monthly</SegmentedItem>
          <SegmentedItem value="annual">Annual</SegmentedItem>
        </Segmented>
      </div>
      <PricingSection className="w-full">
        <PlanCard
          name="Starter"
          price={annual ? "$12" : "$15"}
          priceNote={note}
          description="For individuals exploring the product."
          features={["Real-time syncing", "Up to 3 seats"]}
          action={
            <Button variant="outline" className="w-full">
              Start for free
            </Button>
          }
        />
        <PlanCard
          name="Pro"
          price={annual ? "$79" : "$99"}
          priceNote={note}
          description="For growing teams to scale revenue."
          features={["Call intelligence", "Advanced reporting"]}
          action={<Button className="w-full">Continue with Pro</Button>}
          highlighted
        />
      </PricingSection>
    </Wrapper>
  );
}
