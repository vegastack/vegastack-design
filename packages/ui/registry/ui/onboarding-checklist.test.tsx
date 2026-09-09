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
  await expect
    .element(screen.getByText("1 of 3 steps completed"))
    .toBeInTheDocument();
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toHaveAttribute("aria-valuenow", "33");
  // B7-04: the bar IS `ProgressIndicator segments` — there is exactly ONE role="progressbar"
  // in the tree, and it belongs to the primitive rather than a second hand-rolled copy.
  expect(screen.container.querySelectorAll('[role="progressbar"]').length).toBe(
    1,
  );
  expect(bar.element()).toHaveAttribute("data-slot", "progress-indicator");
  expect(bar.element()).toHaveAttribute("data-shape", "segments");
  expect(bar.element()).toHaveAttribute("data-segments-fill", "");
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
  // WCAG 2.2 SC 2.5.3 (Label in Name): the collapsed pill has no aria-label, so its
  // accessible name is the VISIBLE title and progress with `expandLabel` appended as
  // sr-only text. Vitest 5 matches names exactly, so this now asserts that contract.
  const pill = screen.getByRole("button", {
    // No separator text nodes between the parts, so the name concatenates flush.
    name: "Getting started1/3Expand checklist",
  });
  await expect.element(pill).toMatchTextContent("1/3");
  await expectNoA11yViolations(screen.container);
  await userEvent.click(pill);
  await expect
    .element(screen.getByText("1 of 3 steps completed"))
    .toBeInTheDocument();
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

/* ------------------------------------------------------------------------------------------------
 * Coverage added for B7-10 — four tests left the progress maths, the controlled collapse and the
 * done-row contract unasserted.
 * ----------------------------------------------------------------------------------------------*/

// Each case renders on its own, because `getByRole` here resolves against the PAGE: two
// `render()` calls in one test leave both roots mounted and the query matches both progress bars.
test("progress clamps ABOVE the total — a complete checklist reads 100", async () => {
  const screen = await render(
    <OnboardingChecklist done={9} total={3}>
      <OnboardingChecklistItem>Only step</OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  await expect
    .element(screen.getByRole("progressbar"))
    .toHaveAttribute("aria-valuenow", "100");
  await expect.element(screen.getByText("3 of 3")).toBeInTheDocument();
});

test("progress clamps BELOW zero — a negative count reads 0", async () => {
  const screen = await render(
    <OnboardingChecklist done={-4} total={3}>
      <OnboardingChecklistItem>Only step</OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  await expect
    .element(screen.getByRole("progressbar"))
    .toHaveAttribute("aria-valuenow", "0");
  await expect.element(screen.getByText("0 of 3")).toBeInTheDocument();
});

test("controlled collapse defers to the host and never self-toggles", async () => {
  const onCollapsedChange = vi.fn();
  const screen = await render(
    <OnboardingChecklist
      done={1}
      total={2}
      collapsed={false}
      onCollapsedChange={onCollapsedChange}
    >
      <OnboardingChecklistItem>Step</OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Collapse checklist" }),
  );
  expect(onCollapsedChange).toHaveBeenCalledWith(true);
  // The host did not change `collapsed`, so the card must still be expanded.
  await expect
    .element(screen.getByRole("button", { name: "Collapse checklist" }))
    .toBeInTheDocument();
});

test("a done row is inert and does not call the host handler", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <OnboardingChecklist done={1} total={1}>
      <OnboardingChecklistItem done onClick={onClick}>
        Sync email account
      </OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  const row = screen.container.querySelector(
    '[data-slot="onboarding-checklist-item"]',
  ) as HTMLButtonElement;
  expect(row.disabled).toBe(true);
  expect(row.className).toContain("data-done:line-through");
  expect(onClick).not.toHaveBeenCalled();
});

test("the collapsed pill keeps its visible label inside its accessible name", async () => {
  // WCAG 2.2 SC 2.5.3 (Label in Name): an aria-label here would REPLACE the visible
  // "Getting started 1/2" text, breaking speech input.
  const screen = await render(
    <OnboardingChecklist done={1} total={2} defaultCollapsed>
      <OnboardingChecklistItem>Step</OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  const pill = screen
    .getByRole("button", { name: /Expand checklist/ })
    .element() as HTMLElement;
  expect(pill).not.toHaveAttribute("aria-label");
  expect(pill.textContent).toContain("Getting started");
  expect(pill.textContent).toContain("1/2");
});
