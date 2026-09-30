import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { MediaCard } from "./media-card";

test("the whole card is one link named by its title, with no underline", async () => {
  const screen = await render(
    <MediaCard
      href="/families/1"
      title="Indoor Luminaires"
      meta="8 products · 3 sub-families"
      fallback={<span />}
    />,
  );
  const link = screen.getByRole("link", { name: "Indoor Luminaires" });
  await expect.element(link).toHaveAttribute("href", "/families/1");
  expect(link.element().className).toContain("no-underline");
  expect(link.element().className).toContain("after:inset-0");
  await expectNoA11yViolations(screen.container);
});

test("lg puts the image on top; no image and no fallback means no image area", async () => {
  const screen = await render(
    <>
      <MediaCard size="lg" title="With" image={null} fallback={<span />} />
      <MediaCard title="Without" />
    </>,
  );
  const cards = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="media-card"]',
  );
  expect(cards[0]!.dataset.size).toBe("lg");
  expect(cards[0]!.querySelector('[data-slot="thumbnail"]')).not.toBeNull();
  expect(cards[1]!.querySelector('[data-slot="thumbnail"]')).toBeNull();
});

test("imageBadge sits over the image's bottom end, on the scrim, and never takes the click", async () => {
  const screen = await render(
    <div style={{ width: 280 }}>
      <MediaCard
        size="lg"
        href="/files/1"
        title="Site walk-through.mp4"
        image={null}
        fallback={<span />}
        imageBadge="▶ 1:24"
      />
      <MediaCard title="No image" imageBadge="1:24" />
    </div>,
  );
  const badges = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="media-card-image-badge"]',
  );
  // A card without an image area has nowhere to put it.
  expect(badges).toHaveLength(1);
  const badge = badges[0]!;
  expect(badge.textContent).toBe("▶ 1:24");
  expect(badge.className).toContain("bg-scrim/60");
  expect(getComputedStyle(badge).pointerEvents).toBe("none");
  const media = badge
    .closest<HTMLElement>('[data-slot="media-card-media"]')!
    .getBoundingClientRect();
  const box = badge.getBoundingClientRect();
  expect(Math.round(media.bottom - box.bottom)).toBe(8);
  expect(Math.round(media.right - box.right)).toBe(8);
  // A click on the badge lands on the card's stretched link.
  expect(
    document
      .elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      ?.closest("[data-slot=media-card-link]"),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});
