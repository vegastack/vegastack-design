import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AnnouncementBanner } from "./announcement-banner";

test("renders the inverse page-top strip with NO live role and an action slot", async () => {
  const screen = await render(
    <AnnouncementBanner action={<a href="#sync">Sync with Google</a>}>
      Workflows are live.
    </AnnouncementBanner>,
  );
  const banner = screen.container.querySelector(
    '[data-slot="announcement-banner"]',
  ) as HTMLElement;
  // D23: a band present at load is chrome, not an announcement.
  expect(banner).not.toHaveAttribute("role");
  expect(banner).not.toHaveAttribute("aria-live");
  expect(banner.className).toContain("bg-foreground");
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

test("live opts the banner into a polite status region", async () => {
  const screen = await render(
    <AnnouncementBanner live>A workflow just finished.</AnnouncementBanner>,
  );
  const banner = screen.container.querySelector(
    '[data-slot="announcement-banner"]',
  );
  expect(banner).toHaveAttribute("role", "status");
  expect(banner).toHaveAttribute("aria-live", "polite");
  expect(banner).toHaveAttribute("data-live", "");
});

/* ------------------------------------------------------------------------------------------------
 * Coverage added for B7-10 — four tests did not reach the quiet form, the dismiss target floor, or
 * the reason the strip exists (the inverse flip against the page).
 * ----------------------------------------------------------------------------------------------*/

test("the quiet form renders message-only — no action, no dismiss", async () => {
  const screen = await render(
    <AnnouncementBanner>Scheduled maintenance on Sunday.</AnnouncementBanner>,
  );
  await expect
    .element(screen.getByText("Scheduled maintenance on Sunday."))
    .toBeInTheDocument();
  expect(screen.container.querySelector("button")).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="announcement-banner-action"]'),
  ).toBeNull();
});

test("the dismiss control is an IconButton, so it inherits the 24px geometry", async () => {
  const screen = await render(
    <AnnouncementBanner dismissable>Old news.</AnnouncementBanner>,
  );
  const dismiss = screen
    .getByRole("button", { name: "Dismiss announcement" })
    .element() as HTMLElement;
  // The point of B7-06: the control is not a hand-rolled <button> with its own hit-area hack, so
  // the target floor is IconButton's contract rather than this file's. Measured geometry lives in
  // the contract lane — this env has no compiled sheet, so every rect here would be 0.
  expect(dismiss.dataset.slot).toBe("announcement-banner-dismiss");
  expect(dismiss.className).toContain("(--size-xs)");
});

test("the strip flips foreground and background against the page", async () => {
  const screen = await render(
    <AnnouncementBanner>Inverse band.</AnnouncementBanner>,
  );
  const banner = screen.container.querySelector(
    '[data-slot="announcement-banner"]',
  ) as HTMLElement;
  // The whole point of this component: the band is the page's ink and the copy is the page's
  // ground. Asserted as the token pair, because the browser-unit env carries no compiled sheet.
  expect(banner.className).toContain("bg-foreground");
  expect(banner.className).toContain("text-background");
});

test("no a11y violations — the live form", async () => {
  const screen = await render(
    <AnnouncementBanner live dismissable>
      A workflow just finished.
    </AnnouncementBanner>,
  );
  await expectNoA11yViolations(screen.container);
});
