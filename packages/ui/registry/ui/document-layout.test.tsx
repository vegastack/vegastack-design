import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  DocumentLayout,
  DocumentLayoutBlock,
  DocumentLayoutBlockAction,
  DocumentLayoutBlockFooter,
  DocumentLayoutBlockHeader,
  DocumentLayoutBlockNote,
  DocumentLayoutBlockRow,
  DocumentLayoutBlockRowMain,
  DocumentLayoutBlockRowRef,
  DocumentLayoutBlockRows,
  DocumentLayoutBlockTitle,
  DocumentLayoutPageItem,
  DocumentLayoutPageLink,
  DocumentLayoutPageList,
  DocumentLayoutSection,
  DocumentLayoutSectionButton,
  DocumentLayoutSectionHeader,
  DocumentLayoutSectionTitle,
  DocumentLayoutBody,
  DocumentLayoutContents,
  DocumentLayoutFoot,
  DocumentLayoutHeader,
  DocumentLayoutMargin,
  DocumentLayoutDecisionBar,
  DocumentLayoutDecisionBarActions,
  DocumentLayoutDecisionBarText,
  DocumentLayoutFindBar,
  DocumentLayoutFloatingButton,
  DocumentLayoutIcon,
  DocumentLayoutJumpCue,
  DocumentLayoutMeta,
  DocumentLayoutMetaBadge,
  DocumentLayoutMetaButton,
  DocumentLayoutMetaField,
  DocumentLayoutMetaGroup,
  DocumentLayoutMetaItem,
  DocumentLayoutNote,
  DocumentLayoutSkeleton,
  DocumentLayoutStarter,
  DocumentLayoutStarters,
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

test("the find bar steps with Enter and Shift+Enter, closes with Escape, and paints only valid highlight names", async () => {
  const onNext = vi.fn();
  const onPrevious = vi.fn();
  const onClose = vi.fn();
  const screen = await render(
    <DocumentLayoutFindBar
      value="seat"
      onValueChange={() => {}}
      status="1 of 3"
      hasMatches
      onNext={onNext}
      onPrevious={onPrevious}
      onClose={onClose}
      highlights={{ all: "doc-find", current: "doc-find-now" }}
    />,
  );
  const field = screen.getByRole("searchbox", { name: "Find in page" });
  await userEvent.click(field);
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
  await userEvent.keyboard("{Escape}");
  expect(onNext).toHaveBeenCalledTimes(1);
  expect(onPrevious).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(document.head.innerHTML + document.body.innerHTML).toContain(
    "::highlight(doc-find-now)",
  );
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <DocumentLayoutFindBar
      value=""
      onValueChange={() => {}}
      hasMatches={false}
      onNext={onNext}
      onPrevious={onPrevious}
      onClose={onClose}
      highlights={{ all: "x}body{color:red", current: "y" }}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Next match" }))
    .toBeDisabled();
  expect(document.documentElement.innerHTML).not.toContain("x}body");
  // No matches: Enter steps nowhere, and the (empty) status region is already mounted.
  await userEvent.click(
    screen.getByRole("searchbox", { name: "Find in page" }),
  );
  await userEvent.keyboard("{Enter}");
  expect(onNext).toHaveBeenCalledTimes(1);
  expect(
    screen.container.querySelector("[data-slot=document-layout-find-status]"),
  ).not.toBeNull();
});

test("page tools: the jump cue, starters, a note and the floating action render as named, real controls", async () => {
  const onJump = vi.fn();
  const screen = await render(
    <>
      <DocumentLayoutJumpCue onClick={onJump}>
        2 new comments
      </DocumentLayoutJumpCue>
      <DocumentLayoutStarters
        label="Start from:"
        aria-label="Start from a template"
      >
        <DocumentLayoutStarter>Spec</DocumentLayoutStarter>
        <DocumentLayoutStarter more>More templates…</DocumentLayoutStarter>
      </DocumentLayoutStarters>
      <DocumentLayoutNote>Asha can't see this page yet</DocumentLayoutNote>
      <DocumentLayoutFloatingButton>Edit</DocumentLayoutFloatingButton>
    </>,
  );
  await screen.getByRole("button", { name: "2 new comments" }).click();
  expect(onJump).toHaveBeenCalled();
  await expect
    .element(screen.getByRole("group", { name: "Start from a template" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Edit" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("the decision bar is a named region with its text and answers", async () => {
  const screen = await render(
    <DocumentLayoutDecisionBar aria-label="Your review">
      <DocumentLayoutDecisionBarText>
        Asha asked you to review this page
      </DocumentLayoutDecisionBarText>
      <DocumentLayoutDecisionBarActions>
        <button type="button">Approve</button>
      </DocumentLayoutDecisionBarActions>
    </DocumentLayoutDecisionBar>,
  );
  await expect
    .element(screen.getByRole("region", { name: "Your review" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("a foot section is named by its title; its pages are a list of links with icon, excerpt and meta", async () => {
  const screen = await render(
    <DocumentLayoutSection>
      <DocumentLayoutSectionHeader>
        <DocumentLayoutSectionTitle count="2">
          Pages inside
        </DocumentLayoutSectionTitle>
      </DocumentLayoutSectionHeader>
      <DocumentLayoutPageList>
        <DocumentLayoutPageItem>
          <DocumentLayoutPageLink
            icon="📐"
            title="Install notes"
            excerpt="Mounting heights"
            meta="2h ago"
            render={<a href="#install" />}
          />
        </DocumentLayoutPageItem>
        <DocumentLayoutPageItem>
          <DocumentLayoutPageLink
            title="Renewals"
            render={<a href="#renewals" />}
          />
        </DocumentLayoutPageItem>
      </DocumentLayoutPageList>
      <DocumentLayoutSectionButton>Show more pages</DocumentLayoutSectionButton>
    </DocumentLayoutSection>,
  );
  await expect
    .element(screen.getByRole("region", { name: "Pages inside · 2" }))
    .toBeInTheDocument();
  expect(screen.getByRole("listitem").elements()).toHaveLength(2);
  const link = screen.getByRole("link", { name: /Install notes/ }).element();
  expect(link.getAttribute("href")).toBe("#install");
  expect(link.textContent).toContain("Mounting heights");
  expect(link.textContent).toContain("2h ago");
  // A page without its own icon shows the page icon (hidden), never an empty slot.
  const plain = screen.getByRole("link", { name: "Renewals" }).element();
  expect(plain.querySelector("svg[aria-hidden]")).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("a live block holds rows as a list, a note and a footer action, and is not editable text", async () => {
  const screen = await render(
    <DocumentLayoutBlock>
      <DocumentLayoutBlockHeader>
        <DocumentLayoutBlockTitle>Open tasks</DocumentLayoutBlockTitle>
      </DocumentLayoutBlockHeader>
      <DocumentLayoutBlockRows aria-label="Tasks">
        <DocumentLayoutBlockRow>
          <DocumentLayoutBlockRowMain>
            <DocumentLayoutBlockRowRef>T-12</DocumentLayoutBlockRowRef>
            Order fixtures
          </DocumentLayoutBlockRowMain>
        </DocumentLayoutBlockRow>
      </DocumentLayoutBlockRows>
      <DocumentLayoutBlockNote>
        Couldn&apos;t load tasks.
        <DocumentLayoutBlockAction>Try again</DocumentLayoutBlockAction>
      </DocumentLayoutBlockNote>
      <DocumentLayoutBlockFooter>
        <DocumentLayoutBlockAction>Open in Tasks</DocumentLayoutBlockAction>
      </DocumentLayoutBlockFooter>
    </DocumentLayoutBlock>,
  );
  const block = screen.container.querySelector(
    '[data-slot="document-layout-block"]',
  )!;
  expect(block.getAttribute("contenteditable")).toBe("false");
  await expect
    .element(screen.getByRole("list", { name: "Tasks" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Try again" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});
