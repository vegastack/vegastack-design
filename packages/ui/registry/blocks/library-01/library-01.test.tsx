/**
 * `library-01.test.tsx` — the block's browser contract: it mounts with one `h1` (the open folder),
 * the tree pane and the folder's contents; a file row opens the viewer; "Move…" opens the Move
 * dialog with a folders-only tree; and the page is axe-clean. Each part's own behaviour is proven
 * in its own suite.
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { Library } from "./components/library";
import Library01Page from "./page";

test("library-01 mounts the tree beside the open folder, with one h1", async () => {
  const screen = await render(<Library01Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Nova pendant" }))
    .toBeInTheDocument();
  expect(document.querySelectorAll("h1")).toHaveLength(1);
  await expect
    .element(screen.getByRole("navigation", { name: "Library" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("nova-spec-sheet.pdf").first())
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("Uploading 3 files"))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("a file row opens the viewer", async () => {
  const screen = await render(
    <div style={{ height: 720, width: 1100 }}>
      <Library />
    </div>,
  );
  await screen
    .getByRole("button", { name: "nova-spec-sheet.pdf" })
    .first()
    .click();
  await expect
    .element(screen.getByRole("dialog", { name: "nova-spec-sheet.pdf" }))
    .toBeVisible();
});

test("an empty folder points at Upload", async () => {
  const screen = await render(<Library defaultFolder="halo" uploads={[]} />);
  await expect
    .element(screen.getByText("This folder is empty"))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("Move… opens the Move dialog with a folders-only tree", async () => {
  const screen = await render(
    <div style={{ height: 720, width: 1100 }}>
      <Library />
    </div>,
  );
  await screen.getByRole("button", { name: "More for Launch notes" }).click();
  await screen.getByRole("menuitem", { name: "Move…" }).click();
  const dialog = screen.getByRole("dialog", { name: "Move Launch notes" });
  await expect.element(dialog).toBeVisible();
  const picker = dialog.getByRole("navigation", { name: "Folders" });
  await expect.element(picker.getByText("Product specs")).toBeVisible();
  expect(picker.element().textContent).not.toContain("Team handbook");
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
