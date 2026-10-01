import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Building2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/contrast.css";
import { SpaceAvatar, SpaceOption } from "./space-avatar";

const tile = (c: Element) =>
  c.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;

test("an open space is its first initial on its hue, on a rounded square", async () => {
  const screen = await render(
    <SpaceAvatar space={{ name: "general", hue: "blue", access: "open" }} />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="space-avatar"]',
  )!;
  expect(root.dataset.access).toBe("open");
  expect(root.getAttribute("aria-hidden")).toBe("true");
  expect(tile(root).textContent).toBe("G");
  expect(tile(root).dataset.hue).toBe("blue");
  expect(tile(root).className).toContain("rounded-md");
  expect(root.querySelector('[data-slot="space-avatar-lock"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("an icon replaces the initial; a private space wears a corner lock", async () => {
  const screen = await render(
    <SpaceAvatar
      size="lg"
      space={{
        name: "Sales",
        hue: "green",
        access: "private",
        icon: <Building2 />,
      }}
    />,
  );
  const root = screen.container.querySelector('[data-slot="space-avatar"]')!;
  expect(tile(root).textContent).toBe("");
  expect(tile(root).querySelector("svg.lucide-building-2")).not.toBeNull();
  expect(
    root.querySelector('[data-slot="space-avatar-lock"] svg.lucide-lock'),
  ).not.toBeNull();
});

test("a personal space is the lock itself on the muted tile", async () => {
  const screen = await render(
    <SpaceAvatar
      aria-label="Private"
      space={{ name: "Private", hue: "pink", access: "personal" }}
    />,
  );
  const root = screen.getByRole("img", { name: "Private" }).element();
  expect(tile(root).dataset.hue).toBeUndefined();
  expect(tile(root).querySelector("svg.lucide-lock")).not.toBeNull();
  expect(root.querySelector('[data-slot="space-avatar-lock"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("the four sizes are 20, 24, 32 and 40px", async () => {
  const screen = await render(
    <div className="flex gap-2">
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
        <SpaceAvatar
          key={size}
          size={size}
          space={{ name: "S", access: "open" }}
        />
      ))}
    </div>,
  );
  const widths = Array.from(
    screen.container.querySelectorAll('[data-slot="avatar"]'),
  ).map((el) => el.getBoundingClientRect().width);
  expect(widths).toEqual([20, 24, 32, 40]);
});

test("SpaceOption stacks the name over a muted line, with a badge", async () => {
  const screen = await render(
    <SpaceOption
      name="Sales"
      secondary="Private · 8 members"
      badge="Joined"
      avatar={<SpaceAvatar space={{ name: "Sales", access: "private" }} />}
    />,
  );
  await expect.element(screen.getByText("Private · 8 members")).toBeVisible();
  await expect
    .element(screen.getByText("Joined"))
    .toHaveAttribute("data-slot", "space-option-badge");
  await expectNoA11yViolations(screen.container);
});
