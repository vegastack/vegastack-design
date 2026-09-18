import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import { DirectionProvider } from "./direction";

/** Upstream's `PaginationDemo`, which is also the Usage example. */
function Pager(props: React.ComponentProps<typeof Pagination>) {
  return (
    <Pagination {...props}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

test("renders the pagination landmark and its list (Usage)", async () => {
  const screen = await render(<Pager />);
  const nav = screen.container.querySelector("nav") as HTMLElement;
  expect(nav.getAttribute("role")).toBe("navigation");
  expect(nav.getAttribute("aria-label")).toBe("pagination");
  expect(nav.getAttribute("data-slot")).toBe("pagination");
  const list = screen.container.querySelector("ul") as HTMLElement;
  expect(list.getAttribute("data-slot")).toBe("pagination-content");
  expect(list.parentElement).toBe(nav);
});

test("every exported part renders and carries its data-slot (Usage)", async () => {
  const screen = await render(<Pager />);
  for (const name of [
    "pagination",
    "pagination-content",
    "pagination-item",
    "pagination-link",
    "pagination-ellipsis",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${name}"]`),
      `missing data-slot="${name}"`,
    ).not.toBeNull();
  }
  // Previous and Next are `PaginationLink`s, distinguished by their accessible names.
  await expect
    .element(screen.getByRole("button", { name: "Go to previous page" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Go to next page" }))
    .toBeInTheDocument();
});

test("the list is a ul of li, one per control (Composition)", async () => {
  const screen = await render(<Pager />);
  const list = screen.container.querySelector("ul") as HTMLElement;
  const children = [...list.children] as HTMLElement[];
  expect(children).toHaveLength(6);
  for (const child of children) {
    expect(child.tagName).toBe("LI");
    expect(child.getAttribute("data-slot")).toBe("pagination-item");
  }
});

test("PaginationLink builds its own anchor and takes anchor props (Composition)", async () => {
  const clicks: string[] = [];
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#page-4"
            onClick={(event) => {
              event.preventDefault();
              clicks.push("4");
            }}
          >
            4
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  const link = screen.container.querySelector(
    '[data-slot="pagination-link"]',
  ) as HTMLAnchorElement;
  expect(link.tagName).toBe("A");
  expect(link.getAttribute("href")).toBe("#page-4");
  // `nativeButton={false}`: the anchor IS the button, not a button wrapping one.
  expect(link.querySelector("button")).toBeNull();
  expect(link.closest("button")).toBeNull();
  await userEvent.click(link);
  expect(clicks).toEqual(["4"]);
});

test("isActive marks the current page in ARIA and in the variant (Simple)", async () => {
  const screen = await render(
    <Pagination>
      <PaginationContent>
        {[1, 2, 3].map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href="#" isActive={page === 2}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>,
  );
  const links = [
    ...screen.container.querySelectorAll('[data-slot="pagination-link"]'),
  ] as HTMLElement[];
  expect(links.map((link) => link.getAttribute("aria-current"))).toEqual([
    null,
    "page",
    null,
  ]);
  expect(links.map((link) => link.getAttribute("data-active"))).toEqual([
    "false",
    "true",
    "false",
  ]);
  // Not colour alone: the active link also swaps to the bordered `outline` recipe.
  expect(links).toHaveLength(3);
  expect(links[1]!.className).toContain("border-border");
  expect(links[0]!.className).not.toContain("border-border");
});

test("size is forwarded to the Button recipe, defaulting to the 32px square (Simple)", async () => {
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" size="lg">
            2
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  const links = [
    ...screen.container.querySelectorAll('[data-slot="pagination-link"]'),
  ] as HTMLElement[];
  expect(links).toHaveLength(2);
  expect(links[0]!.className).toContain("size-8");
  expect(links[1]!.className).toContain("h-9");
});

test("previous and next keep their names when the label is hidden (Icons Only)", async () => {
  const screen = await render(
    <Pagination className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  const previous = screen
    .getByRole("button", { name: "Go to previous page" })
    .element() as HTMLElement;
  const next = screen
    .getByRole("button", { name: "Go to next page" })
    .element() as HTMLElement;
  // The visible word is behind a breakpoint; the aria-label is not. That is why the icons-only
  // form at narrow widths still has two named controls.
  for (const [control, word] of [
    [previous, "Previous"],
    [next, "Next"],
  ] as const) {
    const label = [...control.querySelectorAll("span")].find(
      (span) => span.textContent === word,
    ) as HTMLElement;
    expect(label.className).toContain("hidden");
    expect(label.className).toContain("sm:block");
  }
  // Both are `size="default"` — a real 32px-tall control, so A11Y-2 needs no hit area.
  expect(previous.className).toContain("h-8");
  expect(next.className).toContain("h-8");
});

test("the text prop replaces the built-in labels (RTL, Changelog)", async () => {
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" text="السابق" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" text="التالي" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  expect(screen.container.textContent).toContain("السابق");
  expect(screen.container.textContent).toContain("التالي");
  expect(screen.container.textContent).not.toContain("Previous");
  // The accessible name is NOT the visible text: it stays the English aria-label the component
  // sets, which is why a localised bar must also localise `aria-label` if it wants both.
  await expect
    .element(screen.getByRole("button", { name: "Go to previous page" }))
    .toBeInTheDocument();
});

test("a numbered link forwards onClick, which is how a Next.js link is wired (Next.js)", async () => {
  const navigated: string[] = [];
  function RouterPager() {
    const [page, setPage] = React.useState(1);
    return (
      <>
        <Pagination>
          <PaginationContent>
            {[1, 2, 3].map((value) => (
              <PaginationItem key={value}>
                <PaginationLink
                  href={`#page-${value}`}
                  isActive={value === page}
                  onClick={(event) => {
                    // What `next/link` would do for you: intercept and route.
                    event.preventDefault();
                    navigated.push(`#page-${value}`);
                    setPage(value);
                  }}
                >
                  {value}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </>
    );
  }
  const screen = await render(<RouterPager />);
  await userEvent.click(screen.getByRole("button", { name: "3" }));
  expect(navigated).toEqual(["#page-3"]);
  await expect
    .element(screen.getByRole("button", { name: "3" }))
    .toHaveAttribute("aria-current", "page");
});

test("RTL: the bar reads right to left and the chevrons follow it (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Pager dir="rtl" />
      </div>
    </DirectionProvider>,
  );
  const list = screen.container.querySelector("ul") as HTMLElement;
  // This lane compiles no Tailwind, so the assertion is the resolved direction rather than the
  // geometry `flex` would produce; `geometry.browser.test.tsx` measures the compiled layout.
  expect(getComputedStyle(list).direction).toBe("rtl");
  // Mirrored by the cascade, not by a second icon.
  for (const name of ["Go to previous page", "Go to next page"]) {
    const control = screen
      .getByRole("button", { name })
      .element() as HTMLElement;
    const icon = control.querySelector("svg") as SVGElement;
    expect(icon.getAttribute("class")).toContain("rtl:rotate-180");
  }
});

test("the ellipsis is aria-hidden decoration, not a control (Usage)", async () => {
  const screen = await render(<Pager />);
  const ellipsis = screen.container.querySelector(
    '[data-slot="pagination-ellipsis"]',
  ) as HTMLElement;
  expect(ellipsis.tagName).toBe("SPAN");
  expect(ellipsis.getAttribute("aria-hidden")).toBe("true");
  expect(ellipsis.hasAttribute("tabindex")).toBe(false);
  expect(ellipsis.closest("a")).toBeNull();
  expect(ellipsis.querySelector(".sr-only")?.textContent).toBe("More pages");
});

/**
 * A11Y-2, recorded in `pagination.patch` as AUDITED WITH NO HUNK: every control is a `Button` at
 * `size="icon"` or `size="default"`, both of which are 32px boxes, so nothing here needs an
 * invisible hit area. This pins the claim rather than restating it in prose.
 */
test("A11Y-2: every control is a 32px Button box and the ellipsis is not a control", async () => {
  const screen = await render(<Pager />);
  const controls = [
    ...screen.container.querySelectorAll('[data-slot="pagination-link"]'),
  ] as HTMLElement[];
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    // `size-8` for a page number, `h-8` for the previous/next pair — both 32px tall.
    expect(control.className).toMatch(/\bsize-8\b|\bh-8\b/);
  }
  const focusable = [
    ...screen.container.querySelectorAll("a, button, [tabindex]"),
  ] as HTMLElement[];
  const ellipsis = screen.container.querySelector(
    '[data-slot="pagination-ellipsis"]',
  ) as HTMLElement;
  expect(focusable).not.toContain(ellipsis);
});

/**
 * `pagination.patch` declares NO STYLING HUNK: the focus, cursor and disabled behaviour come from
 * `Button` (FOC-1, FOC-5, FOC-6, FRM-4). That inheritance is only durable if something observes it,
 * so this pins the two things a future upstream pull could reintroduce locally.
 */
test("no focus glow and no outline suppression anywhere in the bar", async () => {
  const screen = await render(<Pager />);
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\//);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/\boutline-none\b|\boutline-hidden\b/);
  }
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Pager />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — simple, numbers only", async () => {
  const screen = await render(
    <Pagination>
      <PaginationContent>
        {[1, 2, 3, 4, 5].map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href="#" isActive={page === 2}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — icons only", async () => {
  const screen = await render(
    <Pagination className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — RTL", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Pagination dir="rtl">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" text="السابق" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                ٢
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" text="التالي" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});
