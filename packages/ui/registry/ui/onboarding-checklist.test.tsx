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
  // sr-only text. Vitest 5 matches names exactly, so this asserts the WHOLE name — the
  // substring assertion this replaced is what hid issue 103 for months.
  const pill = screen.getByRole("button", {
    // The parts are flex siblings with no whitespace between them; the `sr-only` commas
    // (issue 103) are what keep the name from concatenating flush.
    name: "Getting started, 1/3, Expand checklist",
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
  // The WHOLE name, never a substring — an exact match is the only assertion that can
  // observe the parts running together (issue 103).
  const pill = screen
    .getByRole("button", { name: "Getting started, 1/2, Expand checklist" })
    .element() as HTMLElement;
  expect(pill).not.toHaveAttribute("aria-label");
  // …and the VISIBLE strings are still verbatim substrings of it, which is what SC 2.5.3
  // requires: a speech-input user saying what they see still activates the control.
  expect(pill.textContent).toContain("Getting started");
  expect(pill.textContent).toContain("1/2");
});

test("the collapsed pill's separators are spoken, not laid out (issue 103)", async () => {
  const screen = await render(
    <OnboardingChecklist done={1} total={2} defaultCollapsed>
      <OnboardingChecklistItem>Step</OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  const pill = screen
    .getByRole("button", { name: "Getting started, 1/2, Expand checklist" })
    .element() as HTMLElement;
  // The separators are the ONLY thing carrying the punctuation: every one of them is
  // `sr-only` (absolutely positioned, so out of flow and taking no space in the `gap`-spaced
  // row), and no visible node in the pill contains a comma. This is what makes the fix a
  // NAME change rather than a layout change — the composition that satisfies SC 2.5.3 is
  // untouched, and no whitespace hack was reintroduced.
  const srOnly = Array.from(pill.querySelectorAll(".sr-only"));
  expect(srOnly.map((n) => n.textContent)).toEqual([
    ", ",
    ", Expand checklist",
  ]);
  const visible = Array.from(pill.childNodes)
    .filter(
      (n) => !(n instanceof HTMLElement && n.classList.contains("sr-only")),
    )
    .map((n) => n.textContent)
    .join("");
  expect(visible).not.toContain(",");
});
