import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "./responsive-dialog";

afterEach(async () => {
  await page.viewport(414, 896);
});

function Example() {
  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<Button />}>
        Members
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Members · Product</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>14 people</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <input aria-label="Find a member" />
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose render={<Button variant="secondary" />}>
            Close list
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

test("from 768px it is a Dialog of the requested size; Escape closes it", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Members" }).click();
  await expect
    .element(screen.getByRole("dialog", { name: "Members · Product" }))
    .toBeVisible();
  expect(
    document.querySelector('[data-slot="dialog-content"][data-size="md"]'),
  ).not.toBeNull();
  expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await userEvent.keyboard("{Escape}");
  await expect
    .element(screen.getByRole("dialog", { name: "Members · Product" }))
    .not.toBeInTheDocument();
});

test("below 768px it is a bottom sheet with a handle, and Close closes it", async () => {
  await page.viewport(390, 844);
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Members" }).click();
  await expect
    .element(screen.getByRole("dialog", { name: "Members · Product" }))
    .toBeVisible();
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="sheet-content"][data-side="bottom"]'),
    ).not.toBeNull(),
  );
  expect(
    document.querySelector('[data-slot="responsive-dialog-handle"]'),
  ).not.toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await screen.getByRole("button", { name: "Close list" }).click();
  await expect
    .element(screen.getByRole("dialog", { name: "Members · Product" }))
    .not.toBeInTheDocument();
});
