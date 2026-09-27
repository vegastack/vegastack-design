import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { AvatarPicker } from "./avatar-picker";

const PHOTO = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

test("inline it is only the circle: a named dialog trigger with the initials", async () => {
  const screen = await render(
    <AvatarPicker
      person={{ name: "Asha Rao", hue: "blue" }}
      onUpload={async () => {}}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Upload photo" });
  await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
  expect(
    screen.container.querySelector('[data-slot="avatar-fallback"]')
      ?.textContent,
  ).toBe("AR");
  expect(
    screen.container
      .querySelector('[data-slot="avatar-picker"]')
      ?.getAttribute("data-size"),
  ).toBe("sm");
  await expectNoA11yViolations(screen.container);
});

test("the dialog: Update disabled until a file is staged; Remove only with a photo", async () => {
  const screen = await render(
    <AvatarPicker
      person={{ name: "Asha Rao", image: PHOTO }}
      maxSize={10 * 1024 * 1024}
      onUpload={async () => {}}
      onRemove={async () => {}}
    />,
  );
  await screen.getByRole("button", { name: "Change photo" }).click();
  const dialog = screen.getByRole("dialog", { name: "Profile photo" });
  await expect.element(dialog).toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Update" }))
    .toBeDisabled();
  await expect
    .element(dialog.getByRole("button", { name: "Remove" }))
    .toBeEnabled();
  await expect
    .element(dialog.getByText("JPEG, PNG or WebP · up to 10 MB"))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
  // Esc closes it (nothing staged, nothing pending) and focus returns to the circle.
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
  await expect
    .element(screen.getByRole("button", { name: "Change photo" }))
    .toHaveFocus();
});

test("Remove calls onRemove and closes; a rejection keeps it open with the message", async () => {
  let calls = 0;
  const screen = await render(
    <AvatarPicker
      person={{ name: "Asha Rao", image: PHOTO }}
      onUpload={async () => {}}
      onRemove={async () => {
        calls += 1;
        if (calls === 1) throw new Error("Couldn't remove your photo.");
      }}
    />,
  );
  await screen.getByRole("button", { name: "Change photo" }).click();
  const dialog = screen.getByRole("dialog");
  // A DOM click: the unstyled test page lets Base UI's inert backdrop cover the popup.
  (
    dialog.getByRole("button", { name: "Remove" }).element() as HTMLElement
  ).click();
  await expect
    .poll(
      () =>
        document.querySelector('[data-slot="avatar-picker-message"]')
          ?.textContent,
    )
    .toBe("Couldn't remove your photo.");
  // The same words, once, in the live region.
  await expect
    .element(dialog.getByRole("status"))
    .toHaveTextContent("Couldn't remove your photo.");
  (
    dialog.getByRole("button", { name: "Remove" }).element() as HTMLElement
  ).click();
  await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
  expect(calls).toBe(2);
});

test("the pending call's button shows the spinner; the other button and the circle wait", async () => {
  let finish: () => void = () => {};
  const screen = await render(
    <AvatarPicker
      person={{ name: "Asha Rao", image: PHOTO }}
      onUpload={async () => {}}
      onRemove={() =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
      }
    />,
  );
  await screen.getByRole("button", { name: "Change photo" }).click();
  const dialog = screen.getByRole("dialog");
  (
    dialog.getByRole("button", { name: "Remove" }).element() as HTMLElement
  ).click();
  await expect
    .element(dialog.getByRole("button", { name: "Remove" }))
    .toHaveAttribute("aria-busy", "true");
  await expect
    .element(dialog.getByRole("button", { name: "Update" }))
    .toBeDisabled();
  await expect
    .element(dialog.getByRole("button", { name: "Change photo" }))
    .toBeDisabled();
  expect(
    document.querySelector(
      '[data-slot="avatar-picker-circle"] [data-slot="spinner"]',
    ),
  ).toBeNull();
  finish();
  await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
});
