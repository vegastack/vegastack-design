import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AnnouncementBanner } from "./announcement-banner";

test("renders the inverse page-top strip with role=status and an action slot", async () => {
  const screen = await render(
    <AnnouncementBanner action={<a href="#sync">Sync with Google</a>}>
      Workflows are live.
    </AnnouncementBanner>,
  );
  const banner = screen.getByRole("status");
  expect((banner.element() as HTMLElement).className).toContain(
    "bg-foreground",
  );
  await expect
    .element(screen.getByRole("link", { name: "Sync with Google" }))
    .toBeInTheDocument();
});

test("self-dismisses without onDismiss; controlled dismissal calls back", async () => {
  const screen = await render(
    <AnnouncementBanner dismissable>Old news.</AnnouncementBanner>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Dismiss announcement" }),
  );
  expect(
    document.querySelector('[data-slot="announcement-banner"]'),
  ).toBeNull();

  const onDismiss = vi.fn();
  const screen2 = await render(
    <AnnouncementBanner dismissable onDismiss={onDismiss}>
      Controlled.
    </AnnouncementBanner>,
  );
  await userEvent.click(
    screen2.getByRole("button", { name: "Dismiss announcement" }),
  );
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test("has no accessibility violations", async () => {
  const screen = await render(
    <AnnouncementBanner dismissable action={<a href="#more">Read more</a>}>
      Announcing something.
    </AnnouncementBanner>,
  );
  await expectNoA11yViolations(screen.container);
  const action = screen.getByRole("link", { name: "Read more" });
  const actionSlot = action
    .element()
    .closest('[data-slot="announcement-banner-action"]');
  expect(actionSlot?.className).toContain("[&_a]:min-h-(--size-xs)");
  expect(actionSlot?.className).toContain("[&_a]:min-w-(--size-xs)");
  expect(actionSlot?.className).toContain("[&_button]:min-w-(--size-xs)");
});

test("wraps long announcements instead of clipping their text at narrow widths", async () => {
  const copy =
    "A detailed product update that remains readable when the announcement is rendered at 320 pixels";
  const screen = await render(<AnnouncementBanner>{copy}</AnnouncementBanner>);
  const message = screen.getByText(copy);
  await expect.element(message).toHaveClass("wrap-break-word");
  await expect.element(message).not.toHaveClass("truncate");
});
