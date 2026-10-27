import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { FileText, Table2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { RecentStrip, type RecentStripItem } from "./recent-strip";

const ITEMS: RecentStripItem[] = Array.from({ length: 8 }, (_, i) => ({
  href: `/pages/${i}`,
  icon: i % 2 ? <Table2 /> : <FileText />,
  title: `Record ${i}`,
  meta: `Page · ${i + 1}h ago`,
}));

test("renders a named strip of links, capped at max", async () => {
  const screen = await render(<RecentStrip items={ITEMS} />);
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="recent-strip"]',
  )!;
  await expect
    .element(screen.getByRole("region", { name: "Recent" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("heading", { level: 2, name: "Recent" }))
    .toBeInTheDocument();
  const links = root.querySelectorAll('[data-slot="recent-strip-link"]');
  expect(links).toHaveLength(6);
  const first = screen.getByRole("link", { name: "Record 0" });
  await expect.element(first).toHaveAttribute("href", "/pages/0");
  await expect.element(first).toHaveAccessibleDescription("Page · 1h ago");
  // A clipped title stays readable on hover.
  await expect.element(first).toHaveAttribute("title", "Record 0");
  expect(
    root
      .querySelector('[data-slot="recent-strip-icon"]')!
      .getAttribute("aria-hidden"),
  ).toBe("true");
  expect(root.className).toContain("@container/recent-strip");
  await expectNoA11yViolations(root);
});

test("max and label are honoured; headingRender sets the level", async () => {
  const screen = await render(
    <RecentStrip
      items={ITEMS}
      max={3}
      label="Jump back in"
      headingRender={<h3 />}
    />,
  );
  await expect
    .element(screen.getByRole("heading", { level: 3, name: "Jump back in" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelectorAll('[data-slot="recent-strip-link"]'),
  ).toHaveLength(3);
});

test("is one Tab stop; arrows, Home and End rove between the cards", async () => {
  const screen = await render(<RecentStrip items={ITEMS.slice(0, 4)} />);
  const links = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="recent-strip-link"]',
    ),
  ];
  expect(links.map((l) => l.tabIndex)).toEqual([0, -1, -1, -1]);
  links[0]!.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(links[1]);
  await userEvent.keyboard("{End}");
  expect(document.activeElement).toBe(links[3]);
  await userEvent.keyboard("{Home}");
  expect(document.activeElement).toBe(links[0]);
  await userEvent.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(links[0]);
  // Up and Down are the page's: the strip leaves them alone.
  const event = new KeyboardEvent("keydown", {
    key: "ArrowDown",
    bubbles: true,
    cancelable: true,
  });
  links[0]!.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
});

test("linkRender renders each card through the host's link with its props", async () => {
  const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
  function RouterLink(props: React.ComponentProps<"a">) {
    return <a data-router="" {...props} />;
  }
  const screen = await render(
    <RecentStrip
      items={ITEMS.slice(0, 2)}
      linkRender={<RouterLink onClick={onClick} />}
    />,
  );
  const link = screen.container.querySelector<HTMLAnchorElement>(
    '[data-slot="recent-strip-link"]',
  )!;
  expect(link.hasAttribute("data-router")).toBe(true);
  expect(link.getAttribute("href")).toBe("/pages/0");
  link.click();
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("collapsible: the heading is a toggle that folds the strip and reports it", async () => {
  const onOpenChange = vi.fn();
  const screen = await render(
    <RecentStrip items={ITEMS} collapsible onOpenChange={onOpenChange} />,
  );
  const toggle = screen.getByRole("button", { name: "Recent" });
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  await expect
    .element(screen.getByRole("region", { name: "Recent" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
  expect(onOpenChange).toHaveBeenCalledWith(false);
  await expect
    .poll(
      () =>
        screen.container.querySelectorAll('[data-slot="recent-strip-link"]')
          .length,
    )
    .toBe(0);
  expect(
    screen.container
      .querySelector('[data-slot="recent-strip"]')!
      .getAttribute("data-state"),
  ).toBe("closed");
  await expectNoA11yViolations(screen.container);
});

test("collapsible honours a controlled closed state", async () => {
  const screen = await render(
    <RecentStrip items={ITEMS} collapsible open={false} />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Recent" }))
    .toHaveAttribute("aria-expanded", "false");
  expect(
    screen.container.querySelectorAll('[data-slot="recent-strip-link"]'),
  ).toHaveLength(0);
});

test("loading shows skeleton cards of the same shape under the heading", async () => {
  const screen = await render(<RecentStrip loading />);
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="recent-strip"]',
  )!;
  expect(root.getAttribute("aria-busy")).toBe("true");
  const skeleton = root.querySelector('[data-slot="recent-strip-skeleton"]')!;
  expect(skeleton.getAttribute("aria-hidden")).toBe("true");
  expect(skeleton.children).toHaveLength(6);
  await expectNoA11yViolations(root);
});

test("empty: renders nothing, or the emptyState under the heading", async () => {
  const none = await render(<RecentStrip items={[]} />);
  expect(none.container.querySelector('[data-slot="recent-strip"]')).toBeNull();
  await none.unmount();
  const screen = await render(
    <RecentStrip items={[]} emptyState="Nothing opened yet" />,
  );
  await expect
    .element(screen.getByText("Nothing opened yet"))
    .toHaveAttribute("data-slot", "recent-strip-empty");
  await expectNoA11yViolations(screen.container);
});

test("the mouse-only scroll buttons stay out of the tab order and the accessibility tree", async () => {
  const screen = await render(
    <div style={{ width: 320 }}>
      <RecentStrip items={ITEMS} />
    </div>,
  );
  for (const slot of ["recent-strip-scroll-start", "recent-strip-scroll-end"]) {
    const button = screen.container.querySelector<HTMLElement>(
      `[data-slot="${slot}"]`,
    )!;
    expect(button.getAttribute("aria-hidden")).toBe("true");
    expect(button.tabIndex).toBe(-1);
  }
});

test("forwards the ref to the section", async () => {
  const ref = React.createRef<HTMLElement>();
  await render(<RecentStrip ref={ref} items={ITEMS.slice(0, 1)} />);
  expect(ref.current?.getAttribute("data-slot")).toBe("recent-strip");
});
