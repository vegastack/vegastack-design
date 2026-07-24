import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { PlanCard, PricingSection } from "./pricing-section";
import { Button } from "./button";

test("renders plan cards with mono price and check features", async () => {
  const screen = await render(
    <PricingSection>
      <PlanCard
        name="Free"
        price="$0"
        priceNote="Per user/month"
        features={["3 seats"]}
        action={
          <Button variant="outline" className="w-full">
            Start for free
          </Button>
        }
      />
      <PlanCard
        name="Pro"
        price="$79"
        description="For growing teams."
        features={["Call intelligence", "Advanced reporting"]}
        action={<Button className="w-full">Continue with Pro</Button>}
        highlighted
      />
    </PricingSection>,
  );
  const price = screen.getByText("$79");
  expect((price.element() as HTMLElement).className).toContain("font-mono");
  const highlightedCard = document.querySelector(
    '[data-slot="plan-card"][data-highlighted]',
  ) as HTMLElement;
  expect(highlightedCard).not.toBeNull();
  await expect.element(screen.getByText("Popular")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Continue with Pro" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations", async () => {
  const screen = await render(
    <PricingSection>
      <PlanCard name="Free" price="$0" features={["3 seats"]} />
    </PricingSection>,
  );
  await expectNoA11yViolations(screen.container);
});
