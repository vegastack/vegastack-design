import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

/** Upstream's two `EmptyMedia` variants. */
const MEDIA_VARIANTS = ["default", "icon"] as const;

/** Every exported part and the `data-slot` it stamps on its element. */
const SLOTS: {
  part: React.ComponentType<{
    children?: React.ReactNode;
    className?: string;
  }>;
  slot: string;
}[] = [
  { part: Empty, slot: "empty" },
  { part: EmptyHeader, slot: "empty-header" },
  { part: EmptyMedia, slot: "empty-icon" },
  { part: EmptyTitle, slot: "empty-title" },
  { part: EmptyDescription, slot: "empty-description" },
  { part: EmptyContent, slot: "empty-content" },
];

function bySlot(container: Element, slot: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  expect(element, `no element carrying data-slot="${slot}"`).not.toBeNull();
  return element as HTMLElement;
}

/** The full composition upstream documents, reused by several assertions. */
function Composition(props: React.ComponentProps<typeof Empty>) {
  return (
    <Empty {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You have not created any projects yet.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <button type="button">Create Project</button>
      </EmptyContent>
    </Empty>
  );
}

test("renders the root carrying data-slot", async () => {
  const screen = await render(<Empty>Nothing here</Empty>);
  const root = bySlot(screen.container, "empty");
  expect(root.tagName).toBe("DIV");
  expect(root.textContent).toBe("Nothing here");
});

test("every exported part renders and stamps its own data-slot", async () => {
  for (const { part: Part, slot } of SLOTS) {
    const screen = await render(<Part>content</Part>);
    expect(bySlot(screen.container, slot).getAttribute("data-slot")).toBe(slot);
  }
});

test("the documented composition nests header parts inside EmptyHeader (Composition)", async () => {
  const screen = await render(<Composition />);
  const header = bySlot(screen.container, "empty-header");
  expect(header.querySelector('[data-slot="empty-icon"]')).not.toBeNull();
  expect(header.querySelector('[data-slot="empty-title"]')).not.toBeNull();
  expect(
    header.querySelector('[data-slot="empty-description"]'),
  ).not.toBeNull();
  // EmptyContent is a SIBLING of the header, not a child of it.
  expect(header.querySelector('[data-slot="empty-content"]')).toBeNull();
  expect(
    bySlot(screen.container, "empty").querySelector(
      '[data-slot="empty-content"]',
    ),
  ).not.toBeNull();
});

test("every EmptyMedia variant produces its own class string and data-variant", async () => {
  const seen = new Set<string>();
  for (const variant of MEDIA_VARIANTS) {
    const screen = await render(<EmptyMedia variant={variant} />);
    const media = bySlot(screen.container, "empty-icon");
    expect(media.getAttribute("data-variant")).toBe(variant);
    seen.add(media.className);
  }
  expect(seen.size).toBe(MEDIA_VARIANTS.length);
});

test("the icon variant is the tinted chip; the default variant is not", async () => {
  const icon = await render(<EmptyMedia variant="icon" />);
  const iconClasses = bySlot(icon.container, "empty-icon").className.split(
    /\s+/,
  );
  expect(iconClasses).toContain("size-8");
  expect(iconClasses).toContain("bg-muted");

  const plain = await render(<EmptyMedia />);
  const plainClasses = bySlot(plain.container, "empty-icon").className.split(
    /\s+/,
  );
  expect(plainClasses).toContain("bg-transparent");
  expect(plainClasses).not.toContain("size-8");
});

test("EmptyMedia defaults to the default variant when none is passed", async () => {
  const screen = await render(<EmptyMedia />);
  expect(
    bySlot(screen.container, "empty-icon").getAttribute("data-variant"),
  ).toBe("default");
});

test("the root carries the dashed outline in its recipe, unset until `border` is added (Outline)", async () => {
  const bare = await render(<Empty />);
  const bareClasses = bySlot(bare.container, "empty").className.split(/\s+/);
  expect(bareClasses).toContain("border-dashed");
  expect(bareClasses).not.toContain("border");

  const outlined = await render(<Empty className="border border-dashed" />);
  const outlinedClasses = bySlot(outlined.container, "empty").className.split(
    /\s+/,
  );
  expect(outlinedClasses).toContain("border");
  expect(outlinedClasses).toContain("border-dashed");
});

test("a caller's background utility is merged onto the root (Background)", async () => {
  const screen = await render(<Empty className="bg-muted/30" />);
  expect(bySlot(screen.container, "empty").className.split(/\s+/)).toContain(
    "bg-muted/30",
  );
});

test("EmptyMedia hosts arbitrary media, not just an icon (Avatar, Avatar Group)", async () => {
  const screen = await render(
    <EmptyMedia>
      <img src="/preview/avatar-1.svg" alt="Ada Lovelace" />
      <img src="/preview/avatar-2.svg" alt="Grace Hopper" />
    </EmptyMedia>,
  );
  const media = bySlot(screen.container, "empty-icon");
  expect(media.querySelectorAll("img")).toHaveLength(2);
  expect(media.getAttribute("data-variant")).toBe("default");
});

test("EmptyContent hosts interactive controls and styles links in the description (InputGroup)", async () => {
  const screen = await render(
    <EmptyContent>
      <input aria-label="Search pages" placeholder="Try searching..." />
      <EmptyDescription>
        Need help? <a href="#support">Contact support</a>
      </EmptyDescription>
    </EmptyContent>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Search pages" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("link", { name: "Contact support" }))
    .toBeInTheDocument();
  expect(bySlot(screen.container, "empty-description").className).toContain(
    "[&>a]:underline",
  );
});

test("the root passes `dir` straight through to its element (RTL)", async () => {
  const screen = await render(<Composition dir="rtl" />);
  expect(bySlot(screen.container, "empty").getAttribute("dir")).toBe("rtl");
});

test("FOC-6: no part's recipe carries a focus glow, even though there is no patch", async () => {
  for (const { part: Part, slot } of SLOTS) {
    const screen = await render(<Part />);
    const classes = bySlot(screen.container, slot).className;
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("focus-visible:border-ring");
    expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  }
  for (const variant of MEDIA_VARIANTS) {
    const screen = await render(<EmptyMedia variant={variant} />);
    const classes = bySlot(screen.container, "empty-icon").className;
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
  }
});

test("no a11y violations — the documented composition", async () => {
  const screen = await render(<Composition />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — media-less, with a search field", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyTitle>404 - Not Found</EmptyTitle>
        <EmptyDescription>That page does not exist.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <input aria-label="Search pages" placeholder="Try searching..." />
      </EmptyContent>
    </Empty>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — an avatar group as the media", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <img src="/preview/avatar-1.svg" alt="Ada Lovelace" />
        </EmptyMedia>
        <EmptyTitle>No Team Members</EmptyTitle>
        <EmptyDescription>Invite your team to collaborate.</EmptyDescription>
      </EmptyHeader>
    </Empty>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — right to left", async () => {
  const screen = await render(<Composition dir="rtl" />);
  await expectNoA11yViolations(screen.container);
});

test("API-22: EmptyTitle renders as an h2", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyTitle render={<h2 />}>No projects yet</EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  await expect
    .element(screen.getByRole("heading", { level: 2, name: "No projects yet" }))
    .toHaveAttribute("data-slot", "empty-title");
});

test("API-22: the heading keeps the title's class list, merged with the caller's", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Plain</EmptyTitle>
        <EmptyTitle render={<h3 />} className="extra">
          Heading
        </EmptyTitle>
      </EmptyHeader>
    </Empty>,
  );
  const [plain, heading] = Array.from(
    screen.container.querySelectorAll('[data-slot="empty-title"]'),
  ) as HTMLElement[];
  expect(plain!.tagName).toBe("DIV");
  expect(heading!.tagName).toBe("H3");
  expect(heading!.className).toBe(`${plain!.className} extra`);
});

test("no a11y violations — a heading title", async () => {
  const screen = await render(
    <Empty>
      <EmptyHeader>
        <EmptyTitle render={<h2 />}>No projects yet</EmptyTitle>
        <EmptyDescription>Create one to get started.</EmptyDescription>
      </EmptyHeader>
    </Empty>,
  );
  await expectNoA11yViolations(screen.container);
});
