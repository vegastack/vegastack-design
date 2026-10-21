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
  DocumentLayoutIcon,
  DocumentLayoutMeta,
  DocumentLayoutMetaBadge,
  DocumentLayoutMetaButton,
  DocumentLayoutMetaField,
  DocumentLayoutMetaGroup,
  DocumentLayoutMetaItem,
  DocumentLayoutSkeleton,
  DocumentLayoutTitle,
  DocumentLayoutTitleGroup,
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
  expect(grid.className).toContain(
    "@min-[90rem]/document-layout:[--document-layout-tier:xl]",
  );
  expect(grid.className).toContain(
    "@min-[120rem]/document-layout:[--document-layout-tier:2xl]",
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

test("the title group holds an icon over a level-one title; reveal marks an icon shown on hover", async () => {
  const screen = await render(
    <DocumentLayoutTitleGroup>
      <DocumentLayoutIcon reveal>
        <button type="button">Add icon</button>
      </DocumentLayoutIcon>
      <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
    </DocumentLayoutTitleGroup>,
  );
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Pricing v2" }))
    .toBeInTheDocument();
  const icon = screen.container.querySelector<HTMLElement>(
    "[data-slot=document-layout-icon]",
  )!;
  expect(icon.hasAttribute("data-reveal")).toBe(true);
  expect(icon.className).toContain("data-reveal:opacity-0");
  await expectNoA11yViolations(screen.container);
});

test("meta lines: every fact opens with a hidden dot; a fitted chip carries its whole label as its title", async () => {
  const screen = await render(
    <>
      <DocumentLayoutMeta>
        <DocumentLayoutMetaItem>Updated 3m ago</DocumentLayoutMetaItem>
        <DocumentLayoutMetaItem>
          <DocumentLayoutMetaButton>Used in 2 tasks</DocumentLayoutMetaButton>
        </DocumentLayoutMetaItem>
      </DocumentLayoutMeta>
      <DocumentLayoutMeta variant="status">
        <DocumentLayoutMetaGroup>
          <DocumentLayoutMetaField label="Owner">
            Sanjay
          </DocumentLayoutMetaField>
          <DocumentLayoutMetaBadge label="Verified · Oct 14" short="Verified" />
        </DocumentLayoutMetaGroup>
      </DocumentLayoutMeta>
    </>,
  );
  const dots = screen.container.querySelectorAll(
    "[data-slot=document-layout-meta-dot]",
  );
  expect(dots).toHaveLength(3);
  for (const dot of dots) expect(dot.getAttribute("aria-hidden")).toBe("true");
  const badge = screen.container.querySelector("[data-slot=badge]")!;
  expect(badge.getAttribute("title")).toBe("Verified · Oct 14");
  expect(badge.textContent).toBe("Verified · Oct 14");
  await expectNoA11yViolations(screen.container);
});
