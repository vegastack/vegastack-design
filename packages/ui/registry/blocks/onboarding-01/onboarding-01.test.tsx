/**
 * `onboarding-01.test.tsx` — the block's browser contract: it renders, it shows its own content,
 * and the whole composed page is axe-clean. A block is a copy-once composition, so what is worth
 * pinning is that the composition still mounts and still passes the accessibility floor — the
 * behaviour of each part it composes is owned by that part's own suite.
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import Onboarding01Page from "./page";

test("onboarding-01 renders its composition", async () => {
  const screen = await render(<Onboarding01Page />);
  await expect
    .element(screen.getByText("Welcome to Acme").first())
    .toBeInTheDocument();
});

test("onboarding-01 is axe-clean", async () => {
  const screen = await render(<Onboarding01Page />);
  await expect
    .element(screen.getByText("Welcome to Acme").first())
    .toBeInTheDocument();
  // Unstyled: the fast browser suite mounts without the compiled token theme, so axe's contrast
  // maths would read unresolved custom properties (see test/a11y.ts).
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

/**
 * The two Label-in-Name properties the block INHERITED when `extras.md`'s "TO BLOCK" disposition
 * moved `onboarding-checklist` in here. They are opposites, which is exactly why they are easy to
 * get backwards on an edit, and the cross-cutting `accessible-name.browser.test.tsx` case went with
 * the component — so this suite is now the only thing asserting either.
 *
 * COLLAPSED: the pill has VISIBLE text (title + `n/N`). An `aria-label` would replace it, leaving
 * an accessible name that does not contain the visible label — WCAG 2.2 SC 2.5.3, and a speech-input
 * user saying what they see would miss. The action is appended as `sr-only` text instead.
 */
test("the collapsed pill's visible label is part of its accessible name", async () => {
  const screen = await render(<Onboarding01Page />);
  const collapse = screen.getByRole("button", { name: "Collapse checklist" });
  await expect.element(collapse).toBeInTheDocument();
  await collapse.click();

  const pill = screen.container.querySelector<HTMLElement>(
    '[data-slot="onboarding-checklist"][data-collapsed]',
  );
  expect(pill, "the collapsed pill is not rendered").not.toBeNull();
  expect(
    pill?.hasAttribute("aria-label"),
    "the collapsed pill takes an aria-label, which REPLACES its visible text (SC 2.5.3)",
  ).toBe(false);
  const name = pill?.textContent ?? "";
  expect(name).toContain("Getting started");
  expect(name).toContain("2/5");
  expect(name, "the expand action is not in the accessible name").toContain(
    "Expand checklist",
  );
  expect(pill?.getAttribute("aria-expanded")).toBe("false");
});

/**
 * EXPANDED: the collapse toggle is icon-only, so there `aria-label` IS the whole accessible name —
 * the opposite case, for the same reason.
 */
test("the expanded card's icon-only toggle is named by aria-label", async () => {
  const screen = await render(<Onboarding01Page />);
  const collapse = screen.getByRole("button", { name: "Collapse checklist" });
  await expect.element(collapse).toBeInTheDocument();
  const element = screen.container.querySelector<HTMLElement>(
    '[data-slot="onboarding-checklist-collapse"]',
  );
  expect(element?.getAttribute("aria-label")).toBe("Collapse checklist");
  expect(
    element?.textContent?.trim(),
    "the toggle has visible text, so aria-label is no longer the right mechanism",
  ).toBe("");
  expect(element?.getAttribute("aria-expanded")).toBe("true");
});
