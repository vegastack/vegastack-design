import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPager,
  PaginationPrevious,
} from "./pagination";

function Pager() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=3">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

test("renders a labelled navigation landmark", async () => {
  const screen = await render(<Pager />);
  await expect
    .element(screen.getByRole("navigation", { name: "pagination" }))
    .toBeInTheDocument();
});

test("renders the numbered page links", async () => {
  const screen = await render(<Pager />);
  await expect
    .element(screen.getByRole("link", { name: "1" }))
    .toHaveAttribute("href", "?page=1");
  await expect
    .element(screen.getByRole("link", { name: "2" }))
    .toHaveAttribute("href", "?page=2");
  await expect
    .element(screen.getByRole("link", { name: "3" }))
    .toHaveAttribute("href", "?page=3");
});

test("renders previous/next controls with accessible labels", async () => {
  const screen = await render(<Pager />);
  await expect
    .element(screen.getByRole("link", { name: "Go to previous page" }))
    .toHaveAttribute("href", "?page=1");
  await expect
    .element(screen.getByRole("link", { name: "Go to next page" }))
    .toHaveAttribute("href", "?page=3");
});

test('active page sets aria-current="page" and data-active', async () => {
  const screen = await render(<Pager />);
  const active = screen.getByRole("link", { name: "2" });
  await expect.element(active).toHaveAttribute("aria-current", "page");
  await expect.element(active).toHaveAttribute("data-active", "");
  await expect.element(active).toHaveAttribute("data-slot", "pagination-link");
});

test("inactive links omit aria-current", async () => {
  const screen = await render(<Pager />);
  const inactive = screen.getByRole("link", { name: "1" });
  await expect.element(inactive).not.toHaveAttribute("aria-current");
});

test("ellipsis renders a decorative collapse indicator", async () => {
  const screen = await render(<PaginationEllipsis />);
  const el = screen.container.querySelector(
    '[data-slot="pagination-ellipsis"]',
  )!;
  expect(el.getAttribute("aria-hidden")).toBe("true");
  expect(el.getAttribute("role")).toBe("presentation");
  expect(el.textContent).toBe("");
});

test("link render prop swaps the element (routing)", async () => {
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink render={<a data-router="" href="/x" />}>
            1
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  const link = screen.getByRole("link", { name: "1" });
  await expect.element(link).toHaveAttribute("href", "/x");
  await expect.element(link).toHaveAttribute("data-router", "");
  await expect.element(link).toHaveAttribute("data-slot", "pagination-link");
});

test("size variant is reflected on data-size", async () => {
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="?page=1" size="lg">
            1
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  await expect
    .element(screen.getByRole("link", { name: "1" }))
    .toHaveAttribute("data-size", "lg");
});

test("no a11y violations", async () => {
  const screen = await render(<Pager />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled prev/next at bounds", async () => {
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" aria-disabled="true" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=2" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  await expectNoA11yViolations(screen.container);
});

test("Pagination forwards ref to the root nav element", async () => {
  const ref = React.createRef<HTMLElement>();
  await render(<Pagination ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.tagName).toBe("NAV");
  expect(ref.current?.dataset.slot).toBe("pagination");
});

test("aria-disabled links leave the tab order and swallow clicks", async () => {
  // `href` is required for the anchor to expose an accessible "link" role at all (an <a> with no
  // `href` has no implicit role) — the built-in `preventDefault` below keeps it from navigating.
  const onClick = vi.fn();
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="?page=1"
            aria-disabled="true"
            onClick={onClick}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  const link = screen.getByRole("link", { name: "Go to previous page" });
  await expect.element(link).toHaveAttribute("tabindex", "-1");

  // Native click: the built-in handler calls preventDefault and never invokes
  // the consumer's onClick.
  (link.element() as HTMLElement).click();
  expect(onClick).not.toHaveBeenCalled();
});

test("enabled links keep their natural tab order and fire onClick", async () => {
  // The consumer's onClick prevents default so the real anchor doesn't navigate the test page away.
  const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
  const screen = await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="?page=1" onClick={onClick}>
            1
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  const link = screen.getByRole("link", { name: "1" });
  await expect.element(link).not.toHaveAttribute("tabindex");
  (link.element() as HTMLElement).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test("PaginationLink forwards ref to the composed anchor element", async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  await render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink ref={ref} href="?page=1">
            1
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  expect(ref.current?.dataset.slot).toBe("pagination-link");
});

test("page links use tabular numerals (numeric width stability across page numbers)", async () => {
  const screen = await render(<Pager />);
  const link = screen.container.querySelector(
    '[data-slot="pagination-link"]',
  ) as HTMLElement;
  expect(link.classList.contains("tabular-nums")).toBe(true);
});

test("PaginationPager: label, context, bounds-disabled steps, onIndexChange", async () => {
  const onIndexChange = vi.fn();
  const screen = await render(
    <PaginationPager
      index={1}
      total={10}
      context="in All Companies"
      onIndexChange={onIndexChange}
    />,
  );
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("1 of 10 in All Companies");
  const prev = screen.getByRole("button", { name: "Previous item" });
  await expect.element(prev).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Next item" }));
  expect(onIndexChange).toHaveBeenCalledWith(2);
});
