import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Inbox } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyIllustration,
  EmptyValue,
} from "./empty";

test("renders title and description content", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>
          Create your first project to get started.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>,
  );
  await expect.element(screen.getByText("No projects yet")).toBeInTheDocument();
  await expect
    .element(screen.getByText("Create your first project to get started."))
    .toBeInTheDocument();
});

test("title renders as a heading", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Nothing here</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  await expect
    .element(screen.getByRole("heading", { name: "Nothing here" }))
    .toBeInTheDocument();
});

test("applies the icon intent data attribute", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyMedia intent="destructive">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>Failed to load</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  const icon = screen.container.querySelector('[data-slot="empty-media"]');
  expect(icon).not.toBeNull();
  expect(icon).toHaveAttribute("data-intent", "destructive");
});

test("bordered adds the dashed-border data attribute", async () => {
  const screen = await render(
    <Empty bordered>
      <EmptyHeader>
        <EmptyTitle>Drop files here</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  const root = screen.container.querySelector('[data-slot="empty"]');
  expect(root).toHaveAttribute("data-bordered", "");
});

test('surface="card" carries a border so it stays self-contained on card-colored canvases', async () => {
  const screen = await render(
    <Empty surface="card">
      <EmptyHeader>
        <EmptyTitle>No results</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  const root = screen.container.querySelector(
    '[data-slot="empty"]',
  ) as HTMLElement;
  // `bg-card` alone is invisible when the canvas is itself card-colored — the
  // docs promise "a self-contained block on any background" (borders-only canon).
  expect(root.className).toContain("bg-card");
  expect(root.className).toContain("border-border");
});

test("renders action controls", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No members</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <button type="button">Invite</button>
      </EmptyContent>
    </Empty>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Invite" }))
    .toBeInTheDocument();
});

test("icon chip is decorative (aria-hidden)", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>Empty</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  const icon = screen.container.querySelector('[data-slot="empty-media"]');
  expect(icon).toHaveAttribute("aria-hidden");
});

test("no a11y violations", async () => {
  const screen = await render(
    <Empty bordered>
      <EmptyHeader>
        <EmptyMedia>
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filters.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <button type="button">Clear filters</button>
      </EmptyContent>
    </Empty>,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards refs to each part root element", async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLDivElement>();
  const titleRef = React.createRef<HTMLHeadingElement>();
  const descRef = React.createRef<HTMLParagraphElement>();
  const actionsRef = React.createRef<HTMLDivElement>();

  await render(
    <Empty ref={rootRef}>
      <EmptyHeader>
        <EmptyMedia ref={iconRef}>
          <Inbox />
        </EmptyMedia>
        <EmptyTitle ref={titleRef}>Empty</EmptyTitle>
        <EmptyDescription ref={descRef}>Nothing here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent ref={actionsRef}>
        <button type="button">Act</button>
      </EmptyContent>
    </Empty>,
  );

  expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
  expect(rootRef.current?.dataset.slot).toBe("empty");
  expect(iconRef.current).toBeInstanceOf(HTMLDivElement);
  expect(iconRef.current?.dataset.slot).toBe("empty-media");
  expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
  expect(titleRef.current?.dataset.slot).toBe("empty-title");
  expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
  expect(descRef.current?.dataset.slot).toBe("empty-description");
  expect(actionsRef.current).toBeInstanceOf(HTMLDivElement);
  expect(actionsRef.current?.dataset.slot).toBe("empty-content");
});

test("EmptyIllustration renders the named monoline drawing, decorative", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <EmptyIllustration name="clipboard" />
        </EmptyMedia>
        <EmptyTitle>No tasks yet</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  const svg = document.querySelector(
    '[data-slot="empty-illustration"]',
  ) as SVGElement;
  expect(svg).not.toBeNull();
  expect(svg.getAttribute("data-name")).toBe("clipboard");
  expect(svg.getAttribute("aria-hidden")).toBe("true");
  expect(svg.getAttribute("stroke")).toBe("currentColor");
  await expect.element(screen.getByText("No tasks yet")).toBeInTheDocument();
});

test("EmptyValue renders a contrast-safe muted default and accepts custom copy", async () => {
  const screen = await render(
    <div>
      <EmptyValue />
      <EmptyValue>Not added to any lists</EmptyValue>
    </div>,
  );
  await expect.element(screen.getByText("No value")).toBeInTheDocument();
  const custom = screen.getByText("Not added to any lists");
  expect((custom.element() as HTMLElement).className).toContain(
    "text-muted-foreground",
  );
});

test("blocked/error tier: error illustration inherits destructive text color from the media slot", async () => {
  await render(
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default" className="text-destructive-text">
          <EmptyIllustration name="error" />
        </EmptyMedia>
        <EmptyTitle>No mailboxes configured</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  const media = document.querySelector(
    '[data-slot="empty-media"]',
  ) as HTMLElement;
  expect(media.className).toContain("text-destructive-text");
});
