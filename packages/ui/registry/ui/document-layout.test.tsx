import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  DocumentLayout,
  DocumentLayoutBody,
  DocumentLayoutContents,
  DocumentLayoutFoot,
  DocumentLayoutHeader,
  DocumentLayoutMargin,
  DocumentLayoutSkeleton,
} from "./document-layout";

function Page(props: React.ComponentProps<typeof DocumentLayout>) {
  return (
    <DocumentLayout {...props}>
      <DocumentLayoutHeader>
        <h1>Pricing v2</h1>
        <p>Updated 3m ago</p>
      </DocumentLayoutHeader>
      <DocumentLayoutContents>
        <a href="#intro">Intro</a>
      </DocumentLayoutContents>
      <DocumentLayoutBody>
        <p>Body text.</p>
      </DocumentLayoutBody>
      <DocumentLayoutFoot>
        <h2>Pages inside</h2>
      </DocumentLayoutFoot>
      <DocumentLayoutMargin>
        <p>A thread</p>
      </DocumentLayoutMargin>
    </DocumentLayout>
  );
}

test("DocumentLayout renders its parts on one grid and reflects margin and measure", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <Page ref={ref} margin measure="wide" className="extra" />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    "[data-slot=document-layout]",
  )!;
  expect(ref.current).toBe(root);
  expect(root.className).toContain("extra");
  const grid = root.querySelector<HTMLElement>(
    "[data-slot=document-layout-grid]",
  )!;
  for (const el of [root, grid]) {
    expect(el.hasAttribute("data-margin")).toBe(true);
    expect(el.dataset.measure).toBe("wide");
  }
  for (const slot of [
    "document-layout-header",
    "document-layout-contents",
    "document-layout-contents-inner",
    "document-layout-body",
    "document-layout-foot",
    "document-layout-margin",
  ])
    expect(grid.querySelector(`[data-slot=${slot}]`), slot).not.toBeNull();
  // The tiers, measure and columns are CSS: the grid carries the custom properties.
  expect(grid.className).toContain("[--document-measure:47ch]");
  expect(grid.className).toContain(
    "@min-[64rem]/document-layout:[--document-layout-tier:xl]",
  );
});

test("DocumentLayout without margin writes no flag; measure defaults to document", async () => {
  const screen = await render(<Page />);
  const grid = screen.container.querySelector<HTMLElement>(
    "[data-slot=document-layout-grid]",
  )!;
  expect(grid.hasAttribute("data-margin")).toBe(false);
  expect(grid.dataset.measure).toBe("document");
});

test("DocumentLayout's columns are two labelled landmarks", async () => {
  const screen = await render(<Page margin />);
  const contents = screen.container.querySelector(
    "aside[data-slot=document-layout-contents]",
  );
  const margin = screen.container.querySelector(
    "aside[data-slot=document-layout-margin]",
  );
  expect(contents?.getAttribute("aria-label")).toBe("Contents");
  expect(margin?.getAttribute("aria-label")).toBe("Comments");
  await expectNoA11yViolations(screen.container);
});

test("DocumentLayoutSkeleton sketches paragraphs of 3, 2 and 3 lines as one named status", async () => {
  const screen = await render(<DocumentLayoutSkeleton lines={10} margin />);
  const status = screen.getByRole("status", { name: "Loading page" });
  await expect.element(status).toHaveAttribute("aria-busy", "true");
  const paragraphs = [
    ...screen.container.querySelectorAll(
      "[data-slot=document-layout-body] > div",
    ),
  ].map(
    (p) =>
      p.querySelectorAll("[data-slot=document-layout-skeleton-line]").length,
  );
  expect(paragraphs).toEqual([3, 2, 3, 2]);
  expect(
    screen.container
      .querySelector("[data-slot=document-layout-grid]")
      ?.hasAttribute("data-margin"),
  ).toBe(true);
  await expectNoA11yViolations(screen.container);
});
