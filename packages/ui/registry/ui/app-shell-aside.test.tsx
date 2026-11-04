import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  AppShellAside,
  AppShellAsideHeader,
  useAppShellAsideCookie,
} from "./app-shell";
import "../../test/geometry.css";

function Aside({
  open = true,
  onOpenChange = () => {},
  ...props
}: Partial<React.ComponentProps<typeof AppShellAside>>) {
  return (
    <AppShellAside
      open={open}
      onOpenChange={onOpenChange}
      label="Assistant chat"
      {...props}
    >
      <AppShellAsideHeader>Assistant</AppShellAsideHeader>
      <Counter />
    </AppShellAside>
  );
}

/** Holds state, so a remount shows. */
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Inside {count}
    </button>
  );
}

const asideOf = (root: ParentNode) =>
  root.querySelector<HTMLElement>("[data-slot=app-shell-aside]")!;

test("the aside is a landmark named by its label, and closed it is out of reach but mounted", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Aside />);
  await expect
    .element(page.getByRole("complementary", { name: "Assistant chat" }))
    .toBeVisible();
  const aside = asideOf(screen.container);
  expect(aside.dataset.state).toBe("open");
  await expectNoA11yViolations(screen.container);
  await screen.rerender(<Aside open={false} />);
  expect(aside.dataset.state).toBe("closed");
  expect(aside.hasAttribute("inert")).toBe(true);
  expect(screen.container.querySelector("button")).not.toBeNull();
});

test("the aside docks from 1280px and lies over the content below it", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Aside />);
  const aside = asideOf(screen.container);
  expect(getComputedStyle(aside).position).toBe("sticky");
  expect(aside.getBoundingClientRect().width).toBe(400);
  await page.viewport(1100, 900);
  await vi.waitFor(() =>
    expect(getComputedStyle(aside).position).toBe("fixed"),
  );
  await page.viewport(1440, 900);
});

test("on a phone the aside is a modal dialog, and the rest of the shell is out of reach", async () => {
  await page.viewport(390, 844);
  try {
    const screen = await render(
      <div>
        <button type="button">Page</button>
        <Aside />
      </div>,
    );
    const dialog = page.getByRole("dialog", { name: "Assistant chat" });
    await expect.element(dialog).toBeVisible();
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    await vi.waitFor(() =>
      expect(dialog.element().getBoundingClientRect().height).toBe(844),
    );
    expect(screen.container.querySelector("button")!.inert).toBe(true);
    await expectNoA11yViolations(screen.container);
    await screen.rerender(
      <div>
        <button type="button">Page</button>
        <Aside open={false} />
      </div>,
    );
    await vi.waitFor(() =>
      expect(screen.container.querySelector("button")!.inert).toBe(false),
    );
  } finally {
    await page.viewport(1440, 900);
  }
});

test("closing and crossing to the phone never remounts the children", async () => {
  await page.viewport(1440, 900);
  try {
    const screen = await render(<Aside />);
    await page.getByRole("button", { name: "Inside 0" }).click();
    await page.viewport(390, 844);
    await expect
      .element(page.getByRole("button", { name: "Inside 1" }))
      .toBeInTheDocument();
    await screen.rerender(<Aside open={false} />);
    await screen.rerender(<Aside />);
    await expect
      .element(page.getByRole("button", { name: "Inside 1" }))
      .toBeInTheDocument();
  } finally {
    await page.viewport(1440, 900);
  }
});

test("a closed docked panel takes no width and its content keeps its own", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Aside mode="dock" />);
  const panel = screen.container.querySelector<HTMLElement>(
    "[data-slot=app-shell-aside-panel]",
  )!;
  expect(panel.getBoundingClientRect().width).toBeGreaterThanOrEqual(399);
  const open = panel.getBoundingClientRect().width;
  await screen.rerender(<Aside mode="dock" open={false} />);
  await vi.waitFor(() =>
    expect(asideOf(screen.container).getBoundingClientRect().width).toBe(0),
  );
  expect(panel.getBoundingClientRect().width).toBe(open);
});

test("Escape inside asks to close; Escape from outside the panel does not", async () => {
  await page.viewport(1440, 900);
  const onOpenChange = vi.fn();
  const screen = await render(<Aside onOpenChange={onOpenChange} />);
  (
    screen.container.querySelector(
      "[data-slot=app-shell-aside-panel] button",
    ) as HTMLElement
  ).focus();
  await userEvent.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
  onOpenChange.mockClear();
  const outside = document.createElement("button");
  document.body.append(outside);
  outside.focus();
  await userEvent.keyboard("{Escape}");
  expect(onOpenChange).not.toHaveBeenCalled();
  outside.remove();
});

test("while open the aside tells the shell its inset", async () => {
  await page.viewport(1440, 900);
  const shell = (open: boolean) => (
    <div data-slot="app-shell">
      <Aside open={open} width={500} />
    </div>
  );
  const screen = await render(shell(true));
  const root = screen.container.querySelector<HTMLElement>(
    "[data-slot=app-shell]",
  )!;
  await vi.waitFor(() =>
    expect(root.style.getPropertyValue("--app-shell-aside-inset")).toBe(
      "500px",
    ),
  );
  await screen.rerender(shell(false));
  await vi.waitFor(() =>
    expect(root.style.getPropertyValue("--app-shell-aside-inset")).toBe("0px"),
  );
});

test("the cookie hook keeps both values in one cookie", async () => {
  await page.viewport(1440, 900);
  document.cookie = "aside_test=; path=/; max-age=0";
  function Host() {
    const aside = useAppShellAsideCookie("aside_test");
    return (
      <>
        <button type="button" onClick={() => aside.onOpenChange(!aside.open)}>
          Toggle
        </button>
        <button type="button" onClick={() => aside.onWidthCommitted(480)}>
          Wider
        </button>
        <span data-testid="state">
          {String(aside.open)} {aside.width ?? "none"}
        </span>
      </>
    );
  }
  await render(<Host />);
  await page.getByRole("button", { name: "Toggle" }).click();
  await page.getByRole("button", { name: "Wider" }).click();
  await expect.element(page.getByTestId("state")).toHaveTextContent("true 480");
  expect(document.cookie).toContain("aside_test=1.480");
  document.cookie = "aside_test=; path=/; max-age=0";
});

test("the handle resizes by key within its bounds, and a double click resets", async () => {
  await page.viewport(1440, 900);
  const onWidthChange = vi.fn();
  const onWidthCommitted = vi.fn();
  await render(
    <Aside onWidthChange={onWidthChange} onWidthCommitted={onWidthCommitted} />,
  );
  const handle = page.getByRole("separator", { name: "Resize panel" });
  await expect.element(handle).toHaveAttribute("aria-valuenow", "400");
  (handle.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(handle).toHaveAttribute("aria-valuenow", "416");
  expect(onWidthCommitted).toHaveBeenLastCalledWith(416);
  await userEvent.keyboard("{End}");
  await expect.element(handle).toHaveAttribute("aria-valuenow", "640");
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(handle).toHaveAttribute("aria-valuenow", "640");
  await userEvent.keyboard("{Home}");
  await expect.element(handle).toHaveAttribute("aria-valuenow", "360");
  await handle.dblClick();
  await expect.element(handle).toHaveAttribute("aria-valuenow", "400");
});

test("a controlled width is clamped and a drag reports through onWidthChange", async () => {
  await page.viewport(1440, 900);
  const onWidthChange = vi.fn();
  const onWidthCommitted = vi.fn();
  const screen = await render(
    <Aside
      width={9000}
      onWidthChange={onWidthChange}
      onWidthCommitted={onWidthCommitted}
    />,
  );
  const handle = screen.container.querySelector<HTMLElement>(
    "[data-slot=app-shell-aside-resize]",
  )!;
  expect(handle.getAttribute("aria-valuenow")).toBe("640");
  handle.setPointerCapture = () => {};
  const fire = (type: string, clientX: number) =>
    handle.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX,
        button: 0,
        pointerId: 1,
      }),
    );
  fire("pointerdown", 800);
  fire("pointerup", 800);
  expect(onWidthCommitted).not.toHaveBeenCalled();
  fire("pointerdown", 800);
  fire("pointermove", 820);
  await vi.waitFor(() =>
    expect(handle.getAttribute("aria-valuenow")).toBe("620"),
  );
  fire("pointerup", 820);
  await vi.waitFor(() =>
    expect(onWidthCommitted).toHaveBeenCalledExactlyOnceWith(620),
  );
  expect(onWidthChange).toHaveBeenCalledWith(620);
});
