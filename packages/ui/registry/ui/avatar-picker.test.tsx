import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AvatarPicker } from "./avatar-picker";

test("no photo: Upload photo, no Remove, initials on the hue", async () => {
  const screen = await render(
    <AvatarPicker
      person={{ name: "Asha Rao", hue: "blue" }}
      onSelect={() => {}}
      onRemove={() => {}}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Upload photo" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="avatar-picker-remove"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="avatar-fallback"]')
      ?.textContent,
  ).toBe("AR");
  await expectNoA11yViolations(screen.container);
});

test("a photo: Change photo and Remove; busy disables both", async () => {
  let removed = false;
  const screen = await render(
    <AvatarPicker
      person={{
        name: "Asha Rao",
        image: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      }}
      busy
      onSelect={() => {}}
      onRemove={() => {
        removed = true;
      }}
    />,
  );
  const change = screen.getByRole("button", { name: "Change photo" });
  await expect.element(change).toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Remove" }))
    .toBeDisabled();
  expect(
    screen.container
      .querySelector('[data-slot="avatar-picker-trigger"]')
      ?.getAttribute("aria-busy"),
  ).toBe("true");
  expect(removed).toBe(false);
  await expectNoA11yViolations(screen.container);
});

test("an error shows on the message line and describes the upload button", async () => {
  const screen = await render(
    <AvatarPicker
      person={{ name: "Yuki Tan" }}
      error="We couldn't read photo.png. Try another image."
      onSelect={() => {}}
    />,
  );
  const line = screen.container.querySelector(
    '[data-slot="avatar-picker-message"]',
  );
  expect(line?.textContent).toBe(
    "We couldn't read photo.png. Try another image.",
  );
  // The one polite region announces it too.
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("We couldn't read photo.png. Try another image.");
  await expect
    .element(screen.getByRole("button", { name: "Upload photo" }))
    .toHaveAccessibleDescription(
      "We couldn't read photo.png. Try another image.",
    );
});
