import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Breadcrumb,
  BreadcrumbCollapsed,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbTrail,
} from "./breadcrumb";

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Billing</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

test("renders a labelled navigation landmark", async () => {
  const screen = await render(<Trail />);
  await expect
    .element(screen.getByRole("navigation", { name: "breadcrumb" }))
    .toBeInTheDocument();
});

test("renders the trail links", async () => {
  const screen = await render(<Trail />);
  await expect
    .element(screen.getByRole("link", { name: "Home" }))
    .toHaveAttribute("href", "/");
  await expect
    .element(screen.getByRole("link", { name: "Settings" }))
    .toHaveAttribute("href", "/settings");
});

test('current page sets aria-current="page"', async () => {
  const screen = await render(<Trail />);
  const page = screen.getByText("Billing");
  await expect.element(page).toHaveAttribute("aria-current", "page");
  await expect.element(page).toHaveAttribute("data-slot", "breadcrumb-page");
});

test("separators are decorative (aria-hidden)", async () => {
  const screen = await render(<Trail />);
  const list = screen.container.querySelector('[data-slot="breadcrumb-list"]')!;
  const separators = list.querySelectorAll(
    '[data-slot="breadcrumb-separator"]',
  );
  expect(separators.length).toBe(2);
  separators.forEach((sep) => {
    expect(sep.getAttribute("aria-hidden")).toBe("true");
    expect(sep.getAttribute("role")).toBe("presentation");
  });
});

test("link render prop swaps the element (routing)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a data-router="" href="/x" />}>
            Docs
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const link = screen.getByRole("link", { name: "Docs" });
  await expect.element(link).toHaveAttribute("href", "/x");
  await expect.element(link).toHaveAttribute("data-router", "");
  await expect.element(link).toHaveAttribute("data-slot", "breadcrumb-link");
  await expect.element(link).toHaveClass("min-h-(--size-xs)");
  await expect.element(link).toHaveClass("min-w-(--size-xs)");
  await expect.element(link).toHaveClass("justify-center");
});

test("ellipsis renders a decorative collapse indicator", async () => {
  const screen = await render(<BreadcrumbEllipsis />);
  const el = screen.container.querySelector(
    '[data-slot="breadcrumb-ellipsis"]',
  )!;
  expect(el.getAttribute("aria-hidden")).toBe("true");
  expect(el.getAttribute("role")).toBe("presentation");
  expect(el.textContent).toBe("");
});

test("no a11y violations", async () => {
  const screen = await render(<Trail />);
  await expectNoA11yViolations(screen.container);
});

test("Breadcrumb forwards ref to the root nav element", async () => {
  const ref = React.createRef<HTMLElement>();
  await render(<Breadcrumb ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.tagName).toBe("NAV");
  expect(ref.current?.dataset.slot).toBe("breadcrumb");
});

test("BreadcrumbLink forwards ref to the composed anchor element", async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  await render(
    <BreadcrumbLink ref={ref} href="/">
      Home
    </BreadcrumbLink>,
  );
  expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  expect(ref.current?.dataset.slot).toBe("breadcrumb-link");
});

// --- BreadcrumbCollapsed: real links behind a labelled menu trigger ------------

test("BreadcrumbCollapsed exposes a labelled menu trigger, closed by default", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbCollapsed items={[{ label: "Workspace", href: "/w" }]} />
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const trigger = screen.getByRole("button", {
    name: "Show hidden breadcrumbs",
  });
  await expect.element(trigger).toBeInTheDocument();
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "breadcrumb-collapsed-trigger");
  // Closed: the menu (and its links) are not in the DOM at all.
  expect(document.querySelector('[role="menu"]')).toBeNull();
});

test("BreadcrumbCollapsed accepts a custom accessible name", async () => {
  const screen = await render(
    <BreadcrumbCollapsed
      label="Show middle segments"
      items={[{ label: "X", href: "/x" }]}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Show middle segments" }))
    .toBeInTheDocument();
});

test("BreadcrumbCollapsed reveals hidden segments as real links (href, or a render-composed element) on click", async () => {
  const screen = await render(
    <BreadcrumbCollapsed
      items={[
        { label: "Workspace", href: "/w" },
        { label: "Projects", render: <a data-router="" href="/w/p" /> },
      ]}
    />,
  );
  await screen.getByRole("button", { name: "Show hidden breadcrumbs" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();

  const workspace = page.getByRole("menuitem", { name: "Workspace" });
  await expect.element(workspace).toHaveAttribute("href", "/w");
  const projects = page.getByRole("menuitem", { name: "Projects" });
  await expect.element(projects).toHaveAttribute("href", "/w/p");
  await expect.element(projects).toHaveAttribute("data-router", "");
});

test("BreadcrumbCollapsed: no a11y violations (menu open)", async () => {
  const screen = await render(
    <BreadcrumbCollapsed
      items={[
        { label: "Workspace", href: "/w" },
        { label: "Projects", href: "/w/p" },
      ]}
    />,
  );
  await screen.getByRole("button", { name: "Show hidden breadcrumbs" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});

// --- BreadcrumbTrail: the static, SSR-safe maxItems collapse -------------------

const LONG_TRAIL = [
  { label: "Home", href: "/" },
  { label: "Workspace", href: "/w" },
  { label: "Projects", href: "/w/p" },
  { label: "Settings", href: "/w/p/settings" },
  { label: "Billing" },
];

test("BreadcrumbTrail renders every item flat when under maxItems", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbTrail items={LONG_TRAIL} maxItems={10} />
    </Breadcrumb>,
  );
  await expect
    .element(screen.getByRole("link", { name: "Home" }))
    .toHaveAttribute("href", "/");
  await expect
    .element(screen.getByRole("link", { name: "Workspace" }))
    .toHaveAttribute("href", "/w");
  const current = screen.getByText("Billing");
  await expect.element(current).toHaveAttribute("aria-current", "page");
  expect(
    screen.container.querySelector(
      '[data-slot="breadcrumb-collapsed-trigger"]',
    ),
  ).toBeNull();
});

test("BreadcrumbTrail without maxItems never collapses (flex-wrap fallback)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbTrail items={LONG_TRAIL} />
    </Breadcrumb>,
  );
  await expect
    .element(screen.getByRole("link", { name: "Settings" }))
    .toHaveAttribute("href", "/w/p/settings");
  expect(
    screen.container.querySelector(
      '[data-slot="breadcrumb-collapsed-trigger"]',
    ),
  ).toBeNull();
});

test("BreadcrumbTrail collapses the middle beyond maxItems, keeping first + last visible", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbTrail items={LONG_TRAIL} maxItems={3} />
    </Breadcrumb>,
  );

  // First item and the current page stay in the flat list (itemsAfterCollapse defaults to 1).
  await expect
    .element(screen.getByRole("link", { name: "Home" }))
    .toHaveAttribute("href", "/");
  const current = screen.getByText("Billing");
  await expect.element(current).toHaveAttribute("aria-current", "page");

  // The three middle segments are collapsed — not rendered as flat links.
  expect(document.querySelector('a[href="/w"]')).toBeNull();
  expect(document.querySelector('a[href="/w/p"]')).toBeNull();
  expect(document.querySelector('a[href="/w/p/settings"]')).toBeNull();

  const trigger = screen.getByRole("button", {
    name: "Show hidden breadcrumbs",
  });
  await expect.element(trigger).toBeInTheDocument();
  await trigger.click();

  await expect
    .element(page.getByRole("menuitem", { name: "Workspace" }))
    .toHaveAttribute("href", "/w");
  await expect
    .element(page.getByRole("menuitem", { name: "Projects" }))
    .toHaveAttribute("href", "/w/p");
  await expect
    .element(page.getByRole("menuitem", { name: "Settings" }))
    .toHaveAttribute("href", "/w/p/settings");
});

test("BreadcrumbTrail's itemsAfterCollapse keeps more than one trailing item visible", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbTrail items={LONG_TRAIL} maxItems={3} itemsAfterCollapse={2} />
    </Breadcrumb>,
  );

  // "Settings" now stays in the flat list alongside the current page.
  await expect
    .element(screen.getByRole("link", { name: "Settings" }))
    .toHaveAttribute("href", "/w/p/settings");
  const current = screen.getByText("Billing");
  await expect.element(current).toHaveAttribute("aria-current", "page");
  expect(document.querySelector('a[href="/w"]')).toBeNull();

  await screen.getByRole("button", { name: "Show hidden breadcrumbs" }).click();
  await expect
    .element(page.getByRole("menuitem", { name: "Workspace" }))
    .toHaveAttribute("href", "/w");
  await expect
    .element(page.getByRole("menuitem", { name: "Projects" }))
    .toHaveAttribute("href", "/w/p");
});

test("BreadcrumbTrail accepts a custom collapsedLabel", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbTrail
        items={LONG_TRAIL}
        maxItems={3}
        collapsedLabel="Show middle segments"
      />
    </Breadcrumb>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Show middle segments" }))
    .toBeInTheDocument();
});

test("BreadcrumbTrail: no a11y violations (collapsed, closed and open)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbTrail items={LONG_TRAIL} maxItems={3} />
    </Breadcrumb>,
  );
  await expectNoA11yViolations(screen.container);

  await screen.getByRole("button", { name: "Show hidden breadcrumbs" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
