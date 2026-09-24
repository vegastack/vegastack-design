/**
 * `settings-01.test.tsx` — the block's browser contract: it renders, it shows its own content,
 * and the whole composed page is axe-clean. A block is a copy-once composition, so what is worth
 * pinning is that the composition still mounts and still passes the accessibility floor — the
 * behaviour of each part it composes is owned by that part's own suite. This lane is unstyled, so
 * every axe call skips `color-contrast`; the compiled contrast pass (at rest, dirty, confirming, both
 * themes) is `test/contrast.browser.test.tsx`.
 */

import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import Settings01Page from "./page";

test("settings-01 renders its composition", async () => {
  const screen = await render(<Settings01Page />);
  await expect
    .element(screen.getByText("Save changes").first())
    .toBeInTheDocument();
});

test("settings-01 is axe-clean", async () => {
  const screen = await render(<Settings01Page />);
  await expect
    .element(screen.getByText("Save changes").first())
    .toBeInTheDocument();
  // Unstyled: the fast browser suite mounts without the compiled token theme, so axe's contrast
  // maths would read unresolved custom properties (see test/a11y.ts).
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("the save bar appears only after a change, and Discard restores", async () => {
  const screen = await render(<Settings01Page />);
  expect(
    screen.container.querySelector(
      '[data-slot="action-bar"][data-active="true"]',
    ),
  ).toBeNull();
  await userEvent.fill(
    screen.getByRole("textbox", { name: "Workspace name" }),
    "Acme Robotics",
  );
  await expect
    .element(screen.getByText("Unsaved changes").first())
    .toBeVisible();
  expect(
    screen.container.querySelector(
      '[data-slot="action-bar"][data-active="true"]',
    ),
  ).not.toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Discard" }));
  await expect
    .element(screen.getByRole("textbox", { name: "Workspace name" }))
    .toHaveValue("Acme");
  expect(
    screen.container.querySelector(
      '[data-slot="action-bar"][data-active="true"]',
    ),
  ).toBeNull();
});

test("one h1, from PageHeader", async () => {
  const screen = await render(<Settings01Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Settings" }))
    .toBeInTheDocument();
  expect(screen.container.querySelectorAll("h1")).toHaveLength(1);
  expect(
    screen.container.querySelector('[data-slot="page-header"]'),
  ).not.toBeNull();
});

test("Delete workspace asks for confirmation with the same verb", async () => {
  const screen = await render(<Settings01Page />);
  await userEvent.click(
    screen.getByRole("button", { name: "Delete workspace" }),
  );
  const dialog = screen.getByRole("alertdialog");
  await expect.element(dialog).toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Delete workspace" }))
    .toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Cancel" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
