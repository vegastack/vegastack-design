"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/pricing-section` (dogfoods the registry) → auto-scanned.
import { PlanCard, PricingSection } from "@/components/ui/pricing-section";
import { Button } from "@/components/ui/button";

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
          action={
            <Button finish="lit" className="w-full">
              Continue with Pro
            </Button>
          }
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
