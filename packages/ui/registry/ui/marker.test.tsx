import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Marker, MarkerContent, MarkerIcon } from "./marker";

test("renders content and exposes the marker slot", async () => {
  const screen = await render(
    <Marker>
      <MarkerContent>Merged</MarkerContent>
    </Marker>,
  );
  const content = screen.getByText("Merged");
  await expect.element(content).toBeInTheDocument();
  await expect.element(content).toHaveAttribute("data-slot", "marker-content");
  const root = content.element().closest('[data-slot="marker"]');
  expect(root).not.toBeNull();
  expect(root).toHaveAttribute("data-variant", "default");
});

test("applies the variant data attribute", async () => {
  const screen = await render(
    <Marker variant="separator">
      <MarkerContent>Today</MarkerContent>
    </Marker>,
  );
  const root = screen
    .getByText("Today")
    .element()
    .closest('[data-slot="marker"]');
  expect(root).toHaveAttribute("data-variant", "separator");
});

test("does not carry the motion-pop-in class by default", async () => {
  const screen = await render(
    <Marker>
      <MarkerContent>Merged</MarkerContent>
    </Marker>,
  );
  const root = screen.getByText("Merged").element().closest('[data-slot="marker"]');
  expect(root?.className).not.toContain("motion-pop-in");
});

test("animateIn applies the motion-pop-in arrival class", async () => {
  const screen = await render(
    <Marker animateIn>
      <MarkerContent>Merged</MarkerContent>
    </Marker>,
  );
  const root = screen.getByText("Merged").element().closest('[data-slot="marker"]');
  expect(root?.className).toContain("motion-pop-in");
});

test("renders as a link via the render prop", async () => {
  const screen = await render(
    <Marker render={<a href="#pr" />}>
      <MarkerContent>View the pull request</MarkerContent>
    </Marker>,
  );
  const link = screen.getByRole("link", { name: "View the pull request" });
  await expect.element(link).toHaveAttribute("href", "#pr");
  await expect.element(link).toHaveAttribute("data-slot", "marker");
});

test("MarkerIcon is decorative (aria-hidden)", async () => {
  const screen = await render(
    <Marker>
      <MarkerIcon>
        <svg data-testid="icon" />
      </MarkerIcon>
      <MarkerContent>Building</MarkerContent>
    </Marker>,
  );
  const icon = screen.container.querySelector('[data-slot="marker-icon"]');
  expect(icon).not.toBeNull();
  expect(icon).toHaveAttribute("aria-hidden", "true");
});

test("forwards ref to the rendered element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Marker ref={ref}>
      <MarkerContent>Ref</MarkerContent>
    </Marker>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("marker");
});

test("no a11y violations", async () => {
  const screen = await render(
    <Marker render={<a href="#" />}>
      <MarkerIcon>
        <svg />
      </MarkerIcon>
      <MarkerContent>View the pull request</MarkerContent>
    </Marker>,
  );
  await expectNoA11yViolations(screen.container);
});
