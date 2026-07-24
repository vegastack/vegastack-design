import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Avatar, AvatarGroup } from "./avatar";

// A real, decodable 1×1 transparent PNG — Base UI's Avatar.Image only commits the
// <img> to the DOM once the image actually loads, so the test src must be loadable.
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// Firefox can reuse the completed Image object for an identical data URI while
// Base UI is transitioning its preload state, so later tests may never observe
// a fresh load event. A fragment keeps the decoded bytes identical while giving
// every image-state test an independent URL/cache identity.
function pngFixture(id: string): string {
  return `${PNG_1X1}#${id}`;
}

test("renders the fallback when no src is provided", async () => {
  const screen = await render(<Avatar fallback="AL" />);
  const fallback = screen.getByText("AL");
  await expect.element(fallback).toBeInTheDocument();
  await expect
    .element(fallback)
    .toHaveAttribute("data-slot", "avatar-fallback");
  // No <img> is rendered when src is absent.
  expect(screen.container.querySelector("img")).toBeNull();
});

test("renders an image with alt text when the image loads", async () => {
  const src = pngFixture("named");
  const screen = await render(
    <Avatar src={src} alt="Ada Lovelace" fallback="AL" />,
  );
  // Base UI commits the <img> only after it loads; the loadable data URI guarantees it.
  const img = screen.getByRole("img", { name: "Ada Lovelace" });
  await expect.element(img).toHaveAttribute("src", src);
  await expect.element(img).toHaveAttribute("data-slot", "avatar-image");
});

test('allows an explicitly decorative image with alt=""', async () => {
  const screen = await render(
    <Avatar src={pngFixture("decorative")} alt="" fallback="AL" />,
  );
  await vi.waitFor(() => {
    const img = screen.container.querySelector('img[data-slot="avatar-image"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("");
  });
});

test("applies the size data attribute", async () => {
  const screen = await render(<Avatar size="lg" fallback="AL" />);
  const root = screen.getByText("AL").element().closest('[data-slot="avatar"]');
  expect(root).not.toBeNull();
  expect(root).toHaveAttribute("data-size", "lg");
});

test("AvatarGroup renders its children and exposes its slot", async () => {
  const screen = await render(
    <AvatarGroup>
      <Avatar fallback="AL" />
      <Avatar fallback="LT" />
      <Avatar fallback="+3" />
    </AvatarGroup>,
  );
  await expect.element(screen.getByText("AL")).toBeInTheDocument();
  await expect.element(screen.getByText("+3")).toBeInTheDocument();
  const group = screen.container.querySelector('[data-slot="avatar-group"]');
  expect(group).not.toBeNull();
});

test("forwards ref to the underlying avatar root element", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(<Avatar ref={ref} fallback="AL" />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("avatar");
});

test("AvatarGroup forwards ref to the underlying root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <AvatarGroup ref={ref}>
      <Avatar fallback="AL" />
    </AvatarGroup>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("avatar-group");
});

test("no a11y violations (image avatar with alt text)", async () => {
  const screen = await render(
    <Avatar src={pngFixture("a11y")} alt="Ada Lovelace" fallback="AL" />,
  );
  // Ensure the image has committed before auditing so axe sees the real img + alt.
  await expect
    .element(screen.getByRole("img", { name: "Ada Lovelace" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});
