import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { Table2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  BlockHeader,
  BlockHeaderButton,
  BlockHeaderOpen,
} from "./block-header";
import { Button } from "./button";
import { DropdownMenuItem } from "./dropdown-menu";

test("renders icon, title, controls, the ⋯ menu and Open", async () => {
  const onRemove = vi.fn();
  const screen = await render(
    <BlockHeader
      icon={<Table2 />}
      title="QA fixtures"
      menu={
        <DropdownMenuItem onClick={onRemove}>Remove block</DropdownMenuItem>
      }
      open={<BlockHeaderOpen href="/tables/qa" />}
    >
      <BlockHeaderButton>Grid</BlockHeaderButton>
      <BlockHeaderButton>Filter (1)</BlockHeaderButton>
    </BlockHeader>,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="block-header"]',
  )!;
  expect(root.getAttribute("data-state")).toBe("ready");
  await expect.element(screen.getByText("QA fixtures")).toBeInTheDocument();
  expect(
    root
      .querySelector('[data-slot="block-header-icon"]')!
      .getAttribute("aria-hidden"),
  ).toBe("true");
  await expect
    .element(screen.getByRole("button", { name: "Grid" }))
    .toHaveAttribute("data-slot", "block-header-button");
  await expect
    .element(screen.getByRole("button", { name: "Filter (1)" }))
    .toBeInTheDocument();
  const open = screen.getByRole("link", { name: "Open" });
  await expect.element(open).toHaveAttribute("href", "/tables/qa");
  await expect.element(open).toHaveAttribute("data-slot", "block-header-open");
  await expectNoA11yViolations(root);

  const menu = screen.getByRole("button", { name: "Block actions" });
  await userEvent.click(menu);
  const item = screen.getByRole("menuitem", { name: "Remove block" });
  await expect.element(item).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
  await userEvent.click(item);
  expect(onRemove).toHaveBeenCalledTimes(1);
});

test("empty state: the picker takes the title's place and the controls hide", async () => {
  const screen = await render(
    <BlockHeader
      icon={<Table2 />}
      title="Ignored"
      picker={<Button variant="outline">Pick a table…</Button>}
      menuLabel="Table block actions"
      menu={<DropdownMenuItem>Remove block</DropdownMenuItem>}
    >
      <BlockHeaderButton>Grid</BlockHeaderButton>
    </BlockHeader>,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="block-header"]',
  )!;
  expect(root.getAttribute("data-state")).toBe("empty");
  await expect
    .element(screen.getByRole("button", { name: "Pick a table…" }))
    .toBeInTheDocument();
  expect(root.querySelector('[data-slot="block-header-title"]')).toBeNull();
  expect(root.querySelector('[data-slot="block-header-controls"]')).toBeNull();
  await expect
    .element(screen.getByRole("button", { name: "Table block actions" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(root);
});

test("without a menu or Open there is no actions group; Open takes a custom label", async () => {
  const screen = await render(
    <>
      <BlockHeader title="Tasks · My open" data-testid="bare" />
      <BlockHeader
        title="Tasks"
        open={
          <BlockHeaderOpen
            label="Open in Tasks"
            render={<a href="/tasks" className="router-link" />}
          />
        }
      />
    </>,
  );
  const bare = screen.container.querySelector<HTMLElement>(
    '[data-testid="bare"]',
  )!;
  expect(bare.querySelector('[data-slot="block-header-actions"]')).toBeNull();
  const open = screen.getByRole("link", { name: "Open in Tasks" });
  await expect.element(open).toHaveAttribute("href", "/tasks");
  // The router link keeps its own classes beside the button look.
  expect(open.element().className).toContain("router-link");
});

test("forwards a ref to the root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<BlockHeader ref={ref} title="QA" />);
  expect(ref.current?.getAttribute("data-slot")).toBe("block-header");
});

test("Open merges with its router link: the caller's href wins and both click handlers run", async () => {
  const fromTemplate = vi.fn((event: React.MouseEvent) =>
    event.preventDefault(),
  );
  const fromCaller = vi.fn();
  const ref = React.createRef<HTMLAnchorElement>();
  const screen = await render(
    <BlockHeader
      title="Tasks"
      open={
        <BlockHeaderOpen
          ref={ref}
          href="/new-table"
          onClick={fromCaller}
          render={<a href="/old-table" onClick={fromTemplate} />}
        />
      }
    />,
  );
  const open = screen.getByRole("link", { name: "Open" });
  await expect.element(open).toHaveAttribute("href", "/new-table");
  (open.element() as HTMLElement).click();
  expect(fromTemplate).toHaveBeenCalledTimes(1);
  expect(fromCaller).toHaveBeenCalledTimes(1);
  expect(ref.current?.getAttribute("data-slot")).toBe("block-header-open");
});
