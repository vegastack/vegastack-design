import * as React from "react";
import { UserIcon } from "lucide-react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/contrast.css";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar";

/** Upstream's three size tiers (docs § Sizes). */
const SIZES = ["default", "sm", "lg"] as const;

/**
 * A deterministic inline fixture — never a live third-party image service, and never a path that
 * depends on which server root this lane happens to run under.
 */
const SRC =
  "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2032%2032'%3E%3Crect%20width%3D'32'%20height%3D'32'%2F%3E%3C%2Fsvg%3E";

/** The canonical source as text, for the deviation assertions below. */
const SOURCE =
  Object.values(
    import.meta.glob<string>("./avatar.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
      // The repo's ambient `ImportMeta.glob` (declared in animated-icons.test.tsx) is narrower
      // than Vite's own signature; the assertion re-widens it without loosening the call.
    } as { eager: true }),
  )[0] ?? "";

test("renders the root carrying data-slot and its size", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  const fallback = screen.getByText("AL");
  await expect.element(fallback).toBeInTheDocument();
  const root = fallback.element().closest("[data-slot=avatar]");
  expect(root).not.toBeNull();
  expect(root?.getAttribute("data-size")).toBe("default");
});

test("every exported part renders with its own data-slot", async () => {
  const screen = await render(
    <AvatarGroup>
      <Avatar>
        <AvatarImage src={SRC} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>,
  );
  const container = screen.container;
  for (const slot of [
    "avatar-group",
    "avatar",
    "avatar-fallback",
    "avatar-badge",
    "avatar-group-count",
  ]) {
    expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
  }
});

test("Sizes: each size tier stamps its own data-size on the root", async () => {
  const seen = new Set<string>();
  for (const size of SIZES) {
    const screen = await render(
      <Avatar size={size}>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    const root = screen.container.querySelector("[data-slot=avatar]");
    const value = root?.getAttribute("data-size") ?? "";
    expect(value).toBe(size);
    seen.add(value);
  }
  expect(seen.size).toBe(SIZES.length);
});

test("Sizes: the root recipe carries a distinct class per tier", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  const root = screen.container.querySelector("[data-slot=avatar]");
  const classes = root?.className ?? "";
  // One recipe, three tiers: the default `size-8` plus the two data-size overrides.
  expect(classes).toContain("size-8");
  expect(classes).toContain("data-[size=sm]:size-6");
  expect(classes).toContain("data-[size=lg]:size-10");
});

test.each([
  ["sm", 6],
  ["default", 8],
  ["lg", 10],
] as const)(
  "approved fallback typography and diameter: %s",
  async (size, units) => {
    const screen = await render(
      <div>
        <span data-testid="text-floor" className="text-xs">
          Reference
        </span>
        <span
          data-testid="spacing-unit"
          className="inline-block size-1"
          aria-hidden="true"
        />
        <Avatar size={size}>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </div>,
    );
    const fallback = screen.getByText("AL");
    await expect.element(fallback).toBeVisible();
    const root = fallback.element().closest<HTMLElement>("[data-slot=avatar]");
    const reference = screen.getByTestId("text-floor").element();
    const spacing = screen
      .getByTestId("spacing-unit")
      .element()
      .getBoundingClientRect().width;
    expect(root).not.toBeNull();
    expect(spacing).toBeGreaterThan(0);
    expect(parseFloat(getComputedStyle(reference).fontSize)).toBeLessThan(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(getComputedStyle(fallback.element()).fontSize).toBe(
      getComputedStyle(reference).fontSize,
    );
    expect(root!.getBoundingClientRect().width).toBeCloseTo(spacing * units, 1);
    expect(root!.getBoundingClientRect().height).toBeCloseTo(
      spacing * units,
      1,
    );
  },
);

test("consumer fallback typography overrides remain effective", async () => {
  const screen = await render(
    <div>
      <span className="text-base" data-testid="override">
        Reference
      </span>
      <Avatar>
        <AvatarFallback className="text-base">AL</AvatarFallback>
      </Avatar>
    </div>,
  );
  expect(getComputedStyle(screen.getByText("AL").element()).fontSize).toBe(
    getComputedStyle(screen.getByTestId("override").element()).fontSize,
  );
});

test("fallback children inherit typography unless they explicitly override it", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback>
        <span data-testid="inherited">AL</span>
        <span data-testid="explicit" className="text-base">
          +3
        </span>
        <UserIcon className="size-4" aria-label="User" />
      </AvatarFallback>
    </Avatar>,
  );
  const fallback = screen.container.querySelector<HTMLElement>(
    "[data-slot=avatar-fallback]",
  );
  expect(fallback).not.toBeNull();
  expect(
    getComputedStyle(screen.getByTestId("inherited").element()).fontSize,
  ).toBe(getComputedStyle(fallback!).fontSize);
  expect(
    getComputedStyle(screen.getByTestId("explicit").element()).fontSize,
  ).toBe("16px");
  await expect
    .element(screen.getByRole("img", { name: "User" }))
    .toHaveClass("size-4");
});

test("Basic: the image renders as a native img with its alt", async () => {
  const screen = await render(
    <Avatar>
      <AvatarImage src={SRC} alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  const image = screen.getByRole("img", { name: "Ada Lovelace" });
  await expect.element(image).toHaveAttribute("src", SRC);
  await expect.element(image).toHaveAttribute("data-slot", "avatar-image");
});

test("Basic: the fallback paints when there is no image", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  await expect.element(screen.getByText("AL")).toBeInTheDocument();
  expect(screen.container.querySelector("img")).toBeNull();
});

test("failed image retains the text fallback", async () => {
  const screen = await render(
    <Avatar>
      <AvatarImage src="data:image/png;base64,AA==" alt="Ada" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  await expect.element(screen.getByText("AL")).toBeVisible();
});

test("loaded image hides the fallback without changing the default diameter", async () => {
  const screen = await render(
    <Avatar>
      <AvatarImage src={SRC} alt="Ada" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  const image = screen.getByRole("img", { name: "Ada" });
  await expect
    .poll(() => (image.element() as HTMLImageElement).naturalWidth)
    .toBeGreaterThan(0);
  await expect.element(screen.getByText("AL")).not.toBeInTheDocument();
  expect(
    image
      .element()
      .closest<HTMLElement>("[data-slot=avatar]")
      ?.getBoundingClientRect().width,
  ).toBe(32);
});

test("fallback delay is forwarded to Base UI", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback delay={50}>AL</AvatarFallback>
    </Avatar>,
  );
  await expect.element(screen.getByText("AL")).not.toBeInTheDocument();
  await expect.element(screen.getByText("AL")).toBeVisible();
});

test("Badge: the badge is a span inside the avatar and takes a custom fill", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
      <AvatarBadge className="bg-success" />
    </Avatar>,
  );
  const badge = screen.container.querySelector("[data-slot=avatar-badge]");
  expect(badge?.tagName).toBe("SPAN");
  expect(badge?.className).toContain("bg-success");
  // Positioned at the bottom END corner, so RTL mirrors it for free.
  expect(badge?.className).toContain("end-0");
  expect(badge?.className).toContain("bottom-0");
});

test("Badge with Icon: the sm tier hides the badge's icon", async () => {
  const screen = await render(
    <Avatar size="sm">
      <AvatarFallback>AL</AvatarFallback>
      <AvatarBadge>
        <svg aria-hidden="true" />
      </AvatarBadge>
    </Avatar>,
  );
  const badge = screen.container.querySelector("[data-slot=avatar-badge]");
  expect(badge?.className).toContain(
    "group-data-[size=sm]/avatar:[&>svg]:hidden",
  );
  expect(badge?.querySelector("svg")).not.toBeNull();
});

test("Avatar Group: the group overlaps its children and rings each one", async () => {
  const screen = await render(
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>LT</AvatarFallback>
      </Avatar>
    </AvatarGroup>,
  );
  const group = screen.container.querySelector("[data-slot=avatar-group]");
  expect(group?.className).toContain("-space-x-2");
  expect(group?.className).toContain("*:data-[slot=avatar]:ring-2");
  expect(group?.querySelectorAll("[data-slot=avatar]").length).toBe(2);
});

test("Avatar Group Count: the count tracks the group's avatar size", async () => {
  const screen = await render(
    <AvatarGroup>
      <Avatar size="lg">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>,
  );
  await expect.element(screen.getByText("+3")).toBeInTheDocument();
  const count = screen.container.querySelector(
    "[data-slot=avatar-group-count]",
  );
  expect(count?.className).toContain(
    "group-has-data-[size=lg]/avatar-group:size-10",
  );
  expect(count?.className).toContain(
    "group-has-data-[size=sm]/avatar-group:size-6",
  );
});

test("Avatar Group with Icon: an icon count carries its own text, and the icon is sized by the group", async () => {
  const screen = await render(
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>
        <svg aria-hidden="true" />
        <span className="sr-only">Add a teammate</span>
      </AvatarGroupCount>
    </AvatarGroup>,
  );
  await expect.element(screen.getByText("Add a teammate")).toBeInTheDocument();
  const count = screen.container.querySelector(
    "[data-slot=avatar-group-count]",
  );
  expect(count?.className).toContain("[&>svg]:size-4");
});

test("Composition: the group count sits outside the avatars it counts", async () => {
  const screen = await render(
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>,
  );
  const count = screen.container.querySelector(
    "[data-slot=avatar-group-count]",
  );
  expect(count?.closest("[data-slot=avatar]")).toBeNull();
  expect(count?.closest("[data-slot=avatar-group]")).not.toBeNull();
});

test("Dropdown: an avatar inside a button keeps the button as the control", async () => {
  const screen = await render(
    <button type="button" aria-label="Open account menu">
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    </button>,
  );
  const trigger = screen.getByRole("button", { name: "Open account menu" });
  await expect.element(trigger).toBeInTheDocument();
  expect(trigger.element().querySelector("[data-slot=avatar]")).not.toBeNull();
});

test("RTL: the badge's placement is logical, not left/right", async () => {
  const screen = await render(
    <div dir="rtl">
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
        <AvatarBadge />
      </Avatar>
    </div>,
  );
  const badge = screen.container.querySelector("[data-slot=avatar-badge]");
  expect(badge?.className).toContain("end-0");
  expect(badge?.className).not.toMatch(/(?:^|\s)right-0(?:\s|$)/);
  expect(badge?.className).not.toMatch(/(?:^|\s)left-0(?:\s|$)/);
});

test("DOC-2: the canonical source imports cn from the published package", async () => {
  expect(SOURCE).toContain('from "@vegastack/design"');
  expect(SOURCE).not.toContain('from "cn"');
});

test("no a11y violations — image avatar", async () => {
  const screen = await render(
    <Avatar>
      <AvatarImage src={SRC} alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — fallback only", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — badge", async () => {
  const screen = await render(
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
      <AvatarBadge className="bg-success" />
    </Avatar>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — group with a count", async () => {
  const screen = await render(
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>LT</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — every size tier", async () => {
  const screen = await render(
    <div>
      {SIZES.map((size) => (
        <Avatar key={size} size={size}>
          <AvatarFallback>{size}</AvatarFallback>
        </Avatar>
      ))}
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
