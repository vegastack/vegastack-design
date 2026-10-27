import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  DocumentLayout,
  DocumentLayoutAside,
  DocumentLayoutBlock,
  DocumentLayoutBlockAction,
  DocumentLayoutBlockFooter,
  DocumentLayoutBlockHeader,
  DocumentLayoutBlockNote,
  DocumentLayoutBlockRow,
  DocumentLayoutBlockRowMain,
  DocumentLayoutBlockRowRef,
  DocumentLayoutBlockRows,
  DocumentLayoutBlockTable,
  DocumentLayoutBlockTableBody,
  DocumentLayoutBlockTableCell,
  DocumentLayoutBlockTableColumn,
  DocumentLayoutBlockTableHead,
  DocumentLayoutBlockTableRow,
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
  // The section names itself by its title's id, whatever else the title is given.
  const section = screen.getByRole("region").element();
  const title = section.querySelector("h2")!;
  expect(section.getAttribute("aria-labelledby")).toBe(title.id);
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

test("a live block's table names its columns and rows, its name column first", async () => {
  const long = "A very long request name that never fits its column at all";
  const screen = await render(
    <div>
      <DocumentLayoutBlock>
        <DocumentLayoutBlockHeader>
          <DocumentLayoutBlockTitle>
            Sample requests · SR
          </DocumentLayoutBlockTitle>
        </DocumentLayoutBlockHeader>
        <DocumentLayoutBlockTable columns={3} aria-label="Sample requests">
          <DocumentLayoutBlockTableHead>
            <DocumentLayoutBlockTableRow>
              <DocumentLayoutBlockTableColumn primary>
                Name
              </DocumentLayoutBlockTableColumn>
              <DocumentLayoutBlockTableColumn>
                Status
              </DocumentLayoutBlockTableColumn>
              <DocumentLayoutBlockTableColumn>
                Qty
              </DocumentLayoutBlockTableColumn>
            </DocumentLayoutBlockTableRow>
          </DocumentLayoutBlockTableHead>
          <DocumentLayoutBlockTableBody>
            <DocumentLayoutBlockTableRow>
              <DocumentLayoutBlockTableCell primary>
                <span className="truncate">{long}</span>
              </DocumentLayoutBlockTableCell>
              <DocumentLayoutBlockTableCell>Open</DocumentLayoutBlockTableCell>
              <DocumentLayoutBlockTableCell>12</DocumentLayoutBlockTableCell>
            </DocumentLayoutBlockTableRow>
            <DocumentLayoutBlockTableRow>
              <DocumentLayoutBlockTableCell primary>
                Lux survey
              </DocumentLayoutBlockTableCell>
              <DocumentLayoutBlockTableCell>Sent</DocumentLayoutBlockTableCell>
              <DocumentLayoutBlockTableCell>3</DocumentLayoutBlockTableCell>
            </DocumentLayoutBlockTableRow>
          </DocumentLayoutBlockTableBody>
        </DocumentLayoutBlockTable>
      </DocumentLayoutBlock>
    </div>,
  );
  const table = screen.getByRole("table", { name: "Sample requests" });
  await expect.element(table).toHaveAttribute("aria-colcount", "3");
  await expect
    .element(screen.getByRole("columnheader", { name: "Status" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("rowheader", { name: "Lux survey" }))
    .toBeInTheDocument();
  // The columns are the table's own: the name column first, then one per value.
  const table_ = table.element() as HTMLElement;
  expect(table_.style.gridTemplateColumns).toBe(
    "minmax(10rem, 2fr) minmax(7rem, 1fr) minmax(7rem, 1fr)",
  );
  expect(screen.container.querySelectorAll('[role="row"]')).toHaveLength(3);
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

function Discussion({
  aside,
  onClose,
}: {
  aside: "discussion" | "outline" | null | undefined;
  onClose?: () => void;
}) {
  return (
    <DocumentLayout aside={aside} margin>
      <DocumentLayoutBody>
        <p>Body text.</p>
      </DocumentLayoutBody>
      {/* The margin is display:none while the discussion is open; this unstyled harness shows
          every part, so it takes a name of its own here. */}
      <DocumentLayoutMargin aria-label="Threads beside the text">
        <p>A thread</p>
      </DocumentLayoutMargin>
      <DocumentLayoutAside
        count={3}
        onClose={onClose}
        tabs={[
          {
            value: "open",
            label: "Open",
            count: 3,
            content: <p>Open threads</p>,
          },
          {
            value: "resolved",
            label: "Resolved",
            content: <p>Resolved threads</p>,
          },
          { value: "page", label: "Page", content: <p>The page thread</p> },
        ]}
      />
      <DocumentLayoutAside kind="outline">
        <p>Pricing · Seats · Terms</p>
      </DocumentLayoutAside>
    </DocumentLayout>
  );
}

test("aside: unset writes no flag (the layout as before); null keeps the track closed; a kind names the open one", async () => {
  const screen = await render(<Discussion aside={undefined} />);
  const grid = () =>
    screen.container.querySelector<HTMLElement>(
      "[data-slot=document-layout-grid]",
    )!;
  expect(grid().hasAttribute("data-aside")).toBe(false);
  await screen.rerender(<Discussion aside={null} />);
  expect(grid().dataset.aside).toBe("none");
  await screen.rerender(<Discussion aside="discussion" />);
  expect(grid().dataset.aside).toBe("discussion");
  expect(
    screen.container
      .querySelector("[data-slot=document-layout]")
      ?.getAttribute("data-aside"),
  ).toBe("discussion");
  // The track is CSS: kept for any aside in the document measure, only an open one in wide.
  expect(grid().className).toContain(
    "data-aside:not-data-[measure=wide]:@min-[64rem]/document-layout:[--document-layout-margin:20rem]",
  );
});

test("the discussion aside: a named region with its count, tabs with counts, a close button", async () => {
  const onClose = vi.fn();
  const screen = await render(
    <Discussion aside="discussion" onClose={onClose} />,
  );
  const aside = screen.container.querySelector<HTMLElement>(
    "aside[data-slot=document-layout-aside][data-kind=discussion]",
  )!;
  expect(aside.getAttribute("aria-label")).toBe("Comments");
  expect(
    aside.querySelector("[data-slot=document-layout-aside-count]")?.textContent,
  ).toBe("3");
  await expect
    .element(screen.getByRole("tab", { name: "Open 3" }))
    .toHaveAttribute("aria-selected", "true");
  await expect.element(screen.getByText("Open threads")).toBeInTheDocument();
  await screen.getByRole("tab", { name: "Resolved" }).click();
  await expect
    .element(screen.getByText("Resolved threads"))
    .toBeInTheDocument();
  await screen.getByRole("button", { name: "Close" }).click();
  expect(onClose).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("the aside's tabs can be controlled; without tabs it shows its children; the outline is its own region", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <DocumentLayout aside="outline">
      <DocumentLayoutBody>
        <p>Body text.</p>
      </DocumentLayoutBody>
      <DocumentLayoutAside
        title="Discussion"
        value="page"
        onValueChange={onValueChange}
        tabs={[
          { value: "open", label: "Open", content: <p>Open threads</p> },
          { value: "page", label: "Page", content: <p>The page thread</p> },
        ]}
      />
      <DocumentLayoutAside kind="outline">
        <p>Pricing · Seats · Terms</p>
      </DocumentLayoutAside>
    </DocumentLayout>,
  );
  await expect
    .element(screen.getByRole("tab", { name: "Page" }))
    .toHaveAttribute("aria-selected", "true");
  await screen.getByRole("tab", { name: "Open" }).click();
  expect(onValueChange).toHaveBeenCalledWith("open");
  // Controlled: the host has not moved it.
  await expect
    .element(screen.getByRole("tab", { name: "Page" }))
    .toHaveAttribute("aria-selected", "true");
  const outline = screen.container.querySelector<HTMLElement>(
    "aside[data-kind=outline]",
  )!;
  expect(outline.getAttribute("aria-label")).toBe("On this page");
  expect(outline.textContent).toContain("Pricing · Seats · Terms");
  expect(outline.querySelector("[role=tablist]")).toBeNull();
  await expectNoA11yViolations(screen.container);
});
