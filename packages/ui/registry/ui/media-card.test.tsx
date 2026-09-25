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
