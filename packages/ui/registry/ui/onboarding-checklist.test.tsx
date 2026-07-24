import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { Mail, BarChart3 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  OnboardingChecklist,
  OnboardingChecklistItem,
} from "./onboarding-checklist";

function Example(
  props: Partial<React.ComponentProps<typeof OnboardingChecklist>> = {},
) {
  return (
    <OnboardingChecklist title="Getting started" done={1} total={3} {...props}>
      <OnboardingChecklistItem icon={<Mail aria-hidden />} done>
        Sync email account
      </OnboardingChecklistItem>
      <OnboardingChecklistItem icon={<BarChart3 aria-hidden />}>
        Create a report
      </OnboardingChecklistItem>
      <OnboardingChecklistItem icon={<BarChart3 aria-hidden />}>
        Create a workflow
      </OnboardingChecklistItem>
    </OnboardingChecklist>
  );
}

test("renders progress copy, segmented bar, and step rows", async () => {
  const screen = await render(<Example />);
  await expect.element(screen.getByText("steps completed")).toBeInTheDocument();
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toHaveAttribute("aria-valuenow", "33");
  const doneItem = document.querySelector(
    '[data-slot="onboarding-checklist-item"][data-done]',
  ) as HTMLButtonElement;
  expect(doneItem).not.toBeNull();
  expect(doneItem.disabled).toBe(true);
});

test("collapses to the progress pill and expands back", async () => {
  const screen = await render(<Example />);
  await userEvent.click(
    screen.getByRole("button", { name: "Collapse checklist" }),
  );
  const pill = screen.getByRole("button", { name: "Expand checklist" });
  await expect.element(pill).toHaveTextContent("1/3");
  await expectNoA11yViolations(screen.container);
  await userEvent.click(pill);
  await expect.element(screen.getByText("steps completed")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("step activation fires the host handler", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <OnboardingChecklist done={0} total={1}>
      <OnboardingChecklistItem onClick={onClick}>
        Create a report
      </OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Create a report" }),
  );
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("has no accessibility violations", async () => {
  const screen = await render(<Example />);
  await expectNoA11yViolations(screen.container);
});
