import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { DotIcon } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import { Button } from "./button";
import { DirectionProvider } from "./direction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const slot = (name: string) =>
  document.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;

/** The trail every structural test reads, in upstream's own shape. */
function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="#home" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="#components" />}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

test("renders the labelled nav and its ordered list (Usage)", async () => {
  const screen = await render(<Trail />);
  const nav = screen.container.querySelector("nav") as HTMLElement;
  expect(nav.getAttribute("aria-label")).toBe("breadcrumb");
  expect(nav.getAttribute("data-slot")).toBe("breadcrumb");
  const list = screen.container.querySelector("ol") as HTMLElement;
  expect(list.getAttribute("data-slot")).toBe("breadcrumb-list");
  expect(list.parentElement).toBe(nav);
});

test("every exported part renders and carries its data-slot (Usage)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="#home" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  for (const name of [
    "breadcrumb",
    "breadcrumb-list",
    "breadcrumb-item",
    "breadcrumb-link",
    "breadcrumb-page",
    "breadcrumb-separator",
    "breadcrumb-ellipsis",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${name}"]`),
      `missing data-slot="${name}"`,
    ).not.toBeNull();
  }
});

test("the list is an ol of li, so the trail reads in order (Composition)", async () => {
  const screen = await render(<Trail />);
  const list = screen.container.querySelector("ol") as HTMLElement;
  // Three items and two separators, all direct `li` children of the list — separators are
  // siblings of the items, not nested inside them.
  const children = [...list.children] as HTMLElement[];
  expect(children.map((child) => child.tagName)).toEqual([
    "LI",
    "LI",
    "LI",
    "LI",
    "LI",
  ]);
  expect(children.map((child) => child.getAttribute("data-slot"))).toEqual([
    "breadcrumb-item",
    "breadcrumb-separator",
    "breadcrumb-item",
    "breadcrumb-separator",
    "breadcrumb-item",
  ]);
});

test("href goes straight on BreadcrumbLink, which renders an anchor (Basic)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const link = screen.container.querySelector(
    '[data-slot="breadcrumb-link"]',
  ) as HTMLAnchorElement;
  expect(link.tagName).toBe("A");
  expect(link.getAttribute("href")).toBe("#home");
  // The current page is NOT a link: it is a span with `aria-current`.
  const page = slot("breadcrumb-page") as HTMLElement;
  expect(page.tagName).toBe("SPAN");
  expect(page.getAttribute("aria-current")).toBe("page");
  expect(page.getAttribute("aria-disabled")).toBe("true");
});

test("the default separator is a chevron that follows the reading direction (Custom separator)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const separator = screen.container.querySelector(
    '[data-slot="breadcrumb-separator"]',
  ) as HTMLElement;
  expect(separator.querySelector("svg")).not.toBeNull();
  // Mirrored by the cascade, not by hand.
  expect(separator.querySelector("svg")?.getAttribute("class")).toContain(
    "rtl:rotate-180",
  );
});

test("children replace the default separator rather than joining it (Custom separator)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon data-testid="dot" />
        </BreadcrumbSeparator>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const separator = screen.container.querySelector(
    '[data-slot="breadcrumb-separator"]',
  ) as HTMLElement;
  expect(separator.querySelector('[data-testid="dot"]')).not.toBeNull();
  // Exactly one icon: the custom child REPLACES the chevron.
  expect(separator.querySelectorAll("svg")).toHaveLength(1);
  // And it is still decoration.
  expect(separator.getAttribute("role")).toBe("presentation");
  expect(separator.getAttribute("aria-hidden")).toBe("true");
});

test("a segment can be a dropdown trigger that opens a menu (Dropdown)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="#home" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<button className="flex items-center gap-1" />}
            >
              Components
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Themes</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const trigger = screen.getByRole("button", { name: "Components" });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(trigger);
  await expect
    .element(screen.getByRole("menuitem", { name: "Documentation" }))
    .toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
});

test("the ellipsis stands in for hidden segments and names itself (Collapsed)", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="#home" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const ellipsis = screen.container.querySelector(
    '[data-slot="breadcrumb-ellipsis"]',
  ) as HTMLElement;
  expect(ellipsis.querySelector("svg")).not.toBeNull();
  expect(ellipsis.querySelector(".sr-only")?.textContent).toBe("More");
});

/**
 * A11Y-2, recorded in `breadcrumb.patch` as AUDITED WITH NO HUNK. Upstream's ellipsis is decoration
 * (`role="presentation" aria-hidden`), so there is no control on it to grow to 24px; upstream's own
 * Collapsed example makes the CONTROL a `Button size="icon-sm"` wrapping the ellipsis. This test
 * pins both halves of that claim, so a future upstream that turns the ellipsis itself into the
 * control fails here instead of shipping a 20px target.
 */
test("A11Y-2: the ellipsis is decoration, and the control around it is the button", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <BreadcrumbEllipsis />
              <span className="sr-only">Toggle menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const ellipsis = screen.container.querySelector(
    '[data-slot="breadcrumb-ellipsis"]',
  ) as HTMLElement;
  // Half one: the ellipsis is NOT the control.
  expect(ellipsis.getAttribute("role")).toBe("presentation");
  expect(ellipsis.getAttribute("aria-hidden")).toBe("true");
  expect(ellipsis.tagName).toBe("SPAN");
  expect(ellipsis.hasAttribute("tabindex")).toBe(false);
  expect(ellipsis.closest("button, a, [role='button']")).not.toBe(ellipsis);

  // Half two: the control is the Button around it, and it carries the accessible name.
  const trigger = screen.getByRole("button", { name: "Toggle menu" });
  const element = trigger.element() as HTMLElement;
  expect(element.tagName).toBe("BUTTON");
  expect(element.contains(ellipsis)).toBe(true);
  // `size="icon-sm"` is the 28px square upstream's own example uses; it is the control that has to
  // clear the floor, and it does so with a real box rather than an invisible hit area.
  expect(element.className).toContain("size-7");
});

test("render composes an arbitrary link element (Link component)", async () => {
  function RouterLink({
    href,
    children,
    ...props
  }: React.ComponentProps<"a"> & { href: string }) {
    return (
      <a href={href} data-router-link="" {...props}>
        {children}
      </a>
    );
  }
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<RouterLink href="#link-component" />}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  const link = screen.container.querySelector(
    '[data-slot="breadcrumb-link"]',
  ) as HTMLAnchorElement;
  // The rendered element is the CUSTOM one, and it keeps the breadcrumb's own slot and styling.
  expect(link.hasAttribute("data-router-link")).toBe(true);
  expect(link.getAttribute("href")).toBe("#link-component");
  expect(link.className).toContain("hover:text-foreground");
  expect(link.textContent).toBe("Home");
});

test("RTL: the trail reads right to left and the menu aligns to end (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Breadcrumb dir="rtl">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<a href="#home" />}>
                الرئيسية
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<button />}>
                  المكونات
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" dir="rtl">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>التوثيق</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>مسار التنقل</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </DirectionProvider>,
  );
  const list = screen.container.querySelector("ol") as HTMLElement;
  // The trail inherits the direction, so the browser lays the items out right to left. (This lane
  // compiles no Tailwind, so the assertion is the resolved direction rather than the geometry the
  // `flex` class would produce; `geometry.browser.test.tsx` measures the compiled layout.)
  expect(getComputedStyle(list).direction).toBe("rtl");
  // The default separator is mirrored by the cascade, not re-rendered.
  const separator = list.querySelector(
    '[data-slot="breadcrumb-separator"] svg',
  ) as SVGElement;
  expect(separator.getAttribute("class")).toContain("rtl:rotate-180");
  // And the menu still opens from inside the RTL trail.
  await userEvent.click(screen.getByRole("button", { name: "المكونات" }));
  await expect
    .element(screen.getByRole("menuitem", { name: "التوثيق" }))
    .toBeInTheDocument();
});

/**
 * `breadcrumb.patch` declares NO STYLING HUNK. That claim is only durable if something observes it,
 * so this pins the two things a future upstream pull could reintroduce: the focus-ring glow
 * (FOC-1/FOC-6) and an `outline-none` that would erase the global focus outline.
 */
test("no focus glow and no outline suppression anywhere in the trail", async () => {
  const screen = await render(<Trail />);
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\//);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/\boutline-none\b|\boutline-hidden\b/);
  }
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Trail />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — collapsed, with the ellipsis inside its trigger", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="#home" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <BreadcrumbEllipsis />
              <span className="sr-only">Toggle menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a segment's menu open", async () => {
  const screen = await render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="#home" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<button />}>
              Components
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Themes</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Components" }));
  await expect
    .element(screen.getByRole("menuitem", { name: "Themes" }))
    .toBeInTheDocument();
  // The menu portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — RTL", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Breadcrumb dir="rtl">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<a href="#home" />}>
                الرئيسية
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>مسار التنقل</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});
