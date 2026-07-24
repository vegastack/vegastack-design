import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

// This suite compiles no Tailwind (fast unit tests, no build step) — the component's own
// `h-full`/`w-full`/etc. classes lay out as plain blocks with no real dimensions. Percentage-based
// panel sizing needs a REAL pixel-measured container to compute correct min/max/step constraints,
// so every top-level group below gets its geometry via inline `style`, not a Tailwind className
// (same convention as message-scroller.test.tsx's scrollable-viewport tests).
const GROUP_STYLE = { height: 240, width: 480 } as const;

function HorizontalLayout(props: {
  onLayoutChanged?: (layout: unknown, meta: unknown) => void;
}) {
  return (
    <ResizablePanelGroup
      style={GROUP_STYLE}
      onLayoutChanged={props.onLayoutChanged}
    >
      <ResizablePanel id="left" defaultSize="50" minSize="20" maxSize="80">
        Left
      </ResizablePanel>
      <ResizableHandle aria-label="Resize left and right panels" />
      <ResizablePanel id="right" defaultSize="50">
        Right
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function VerticalLayout() {
  return (
    <ResizablePanelGroup orientation="vertical" style={GROUP_STYLE}>
      <ResizablePanel id="top" defaultSize="50" minSize="20" maxSize="80">
        Top
      </ResizablePanel>
      <ResizableHandle aria-label="Resize top and bottom panels" />
      <ResizablePanel id="bottom" defaultSize="50">
        Bottom
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

test("renders the group/panel/handle structure with their data-slots", async () => {
  const screen = await render(<HorizontalLayout />);
  expect(
    screen.container.querySelector('[data-slot="resizable-panel-group"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelectorAll('[data-slot="resizable-panel"]').length,
  ).toBe(2);
  expect(
    screen.container.querySelector('[data-slot="resizable-handle"]'),
  ).not.toBeNull();
});

test("renders a horizontal group with a vertical separator bar and correct ARIA", async () => {
  const screen = await render(<HorizontalLayout />);
  const handle = screen.getByRole("separator", {
    name: "Resize left and right panels",
  });
  await expect.element(handle).toHaveAttribute("aria-orientation", "vertical");
  await expect.element(handle).toHaveAttribute("aria-valuenow", "50");
  await expect.element(handle).toHaveAttribute("aria-valuemin");
  await expect.element(handle).toHaveAttribute("aria-valuemax");
  await expect.element(handle).toHaveAttribute("tabindex", "0");
});

test("renders a vertical group with a horizontal separator bar", async () => {
  const screen = await render(<VerticalLayout />);
  const handle = screen.getByRole("separator", {
    name: "Resize top and bottom panels",
  });
  await expect
    .element(handle)
    .toHaveAttribute("aria-orientation", "horizontal");
  await expect.element(handle).toHaveAttribute("aria-valuenow", "50");
});

test("ArrowRight grows the left panel and shrinks the right one (horizontal group)", async () => {
  const onLayoutChanged = vi.fn();
  const screen = await render(
    <HorizontalLayout onLayoutChanged={onLayoutChanged} />,
  );
  const handle = screen.getByRole("separator", {
    name: "Resize left and right panels",
  });
  handle.element().focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => Number(handle.element().getAttribute("aria-valuenow")))
    .toBeGreaterThan(50);
  expect(onLayoutChanged).toHaveBeenCalled();
  const [layout, meta] = onLayoutChanged.mock.calls.at(-1)!;
  expect((layout as Record<string, number>).left).toBeGreaterThan(50);
  expect((meta as { isUserInteraction: boolean }).isUserInteraction).toBe(true);
});

test("ArrowLeft shrinks the left panel (horizontal group)", async () => {
  const screen = await render(<HorizontalLayout />);
  const handle = screen.getByRole("separator", {
    name: "Resize left and right panels",
  });
  handle.element().focus();
  await userEvent.keyboard("{ArrowLeft}");
  await expect
    .poll(() => Number(handle.element().getAttribute("aria-valuenow")))
    .toBeLessThan(50);
});

test("Home jumps the left panel to its minimum size", async () => {
  const screen = await render(<HorizontalLayout />);
  const handle = screen.getByRole("separator", {
    name: "Resize left and right panels",
  });
  handle.element().focus();
  await userEvent.keyboard("{Home}");
  await expect
    .poll(() => Number(handle.element().getAttribute("aria-valuenow")))
    .toBe(20);
});

test("End jumps the left panel to its maximum size", async () => {
  const screen = await render(<HorizontalLayout />);
  const handle = screen.getByRole("separator", {
    name: "Resize left and right panels",
  });
  handle.element().focus();
  await userEvent.keyboard("{End}");
  await expect
    .poll(() => Number(handle.element().getAttribute("aria-valuenow")))
    .toBe(80);
});

test("ArrowDown resizes a vertical group's separator", async () => {
  const screen = await render(<VerticalLayout />);
  const handle = screen.getByRole("separator", {
    name: "Resize top and bottom panels",
  });
  handle.element().focus();
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .poll(() => Number(handle.element().getAttribute("aria-valuenow")))
    .toBeGreaterThan(50);
});

test("withHandle renders a visible grip glyph", async () => {
  const screen = await render(
    <ResizablePanelGroup style={GROUP_STYLE}>
      <ResizablePanel id="a">A</ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize" />
      <ResizablePanel id="b">B</ResizablePanel>
    </ResizablePanelGroup>,
  );
  const handle = screen.container.querySelector(
    '[data-slot="resizable-handle"]',
  )!;
  expect(handle.querySelector("svg")).not.toBeNull();
});

test("without withHandle, no grip glyph is rendered", async () => {
  const screen = await render(<HorizontalLayout />);
  const handle = screen.container.querySelector(
    '[data-slot="resizable-handle"]',
  )!;
  expect(handle.querySelector("svg")).toBeNull();
});

test("ResizableHandle's own disabled prop sets aria-disabled and removes it from the tab order", async () => {
  const screen = await render(
    <ResizablePanelGroup style={GROUP_STYLE}>
      <ResizablePanel id="left" defaultSize="50">
        Left
      </ResizablePanel>
      <ResizableHandle aria-label="Resize" disabled />
      <ResizablePanel id="right" defaultSize="50">
        Right
      </ResizablePanel>
    </ResizablePanelGroup>,
  );
  const handle = screen.getByRole("separator", { name: "Resize" });
  await expect.element(handle).toHaveAttribute("aria-disabled", "true");
  await expect.element(handle).not.toHaveAttribute("tabindex");
});

test("a disabled group blocks keyboard resize even though the handle stays focusable", async () => {
  // The `disabled` prop on `ResizablePanelGroup` blocks the resize engine (pointer + keyboard)
  // at the layout-constraint level; it does not, by itself, mark each handle `aria-disabled` —
  // that is `ResizableHandle`'s own `disabled` prop (see the previous test). Assert the actual
  // functional guarantee instead: value is unaffected by keyboard input.
  const screen = await render(
    <ResizablePanelGroup disabled style={GROUP_STYLE}>
      <ResizablePanel id="left" defaultSize="50">
        Left
      </ResizablePanel>
      <ResizableHandle aria-label="Resize" />
      <ResizablePanel id="right" defaultSize="50">
        Right
      </ResizablePanel>
    </ResizablePanelGroup>,
  );
  const handle = screen.getByRole("separator", { name: "Resize" });
  handle.element().focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(handle).toHaveAttribute("aria-valuenow", "50");
});

test("a collapsible panel collapses via its imperative panelRef", async () => {
  const panelRef = React.createRef<ResizablePrimitivePanelHandle>();

  const screen = await render(
    <ResizablePanelGroup style={GROUP_STYLE}>
      <ResizablePanel
        id="sidebar"
        panelRef={panelRef}
        defaultSize="30"
        minSize="20"
        collapsible
        collapsedSize="0"
      >
        Sidebar
      </ResizablePanel>
      <ResizableHandle aria-label="Resize" />
      <ResizablePanel id="content">Content</ResizablePanel>
    </ResizablePanelGroup>,
  );

  expect(
    screen.container.querySelector('[data-slot="resizable-panel"]'),
  ).not.toBeNull();
  expect(panelRef.current?.isCollapsed()).toBe(false);
  panelRef.current?.collapse();
  await expect.poll(() => panelRef.current?.isCollapsed()).toBe(true);
  panelRef.current?.expand();
  await expect.poll(() => panelRef.current?.isCollapsed()).toBe(false);
});

test("nested groups both render and resize independently", async () => {
  const screen = await render(
    <ResizablePanelGroup style={GROUP_STYLE}>
      <ResizablePanel id="outer-left" defaultSize="40">
        Outer left
      </ResizablePanel>
      <ResizableHandle aria-label="Resize outer" />
      <ResizablePanel id="outer-right" defaultSize="60">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel id="inner-top" defaultSize="50">
            Inner top
          </ResizablePanel>
          <ResizableHandle aria-label="Resize inner" />
          <ResizablePanel id="inner-bottom" defaultSize="50">
            Inner bottom
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>,
  );

  expect(
    screen.container.querySelectorAll('[data-slot="resizable-panel-group"]')
      .length,
  ).toBe(2);
  const outerHandle = screen.getByRole("separator", { name: "Resize outer" });
  const innerHandle = screen.getByRole("separator", { name: "Resize inner" });
  await expect
    .element(outerHandle)
    .toHaveAttribute("aria-orientation", "vertical");
  await expect
    .element(innerHandle)
    .toHaveAttribute("aria-orientation", "horizontal");

  innerHandle.element().focus();
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .poll(() => Number(innerHandle.element().getAttribute("aria-valuenow")))
    .toBeGreaterThan(50);
  // The outer group's own value is untouched by the inner group's resize.
  await expect.element(outerHandle).toHaveAttribute("aria-valuenow", "40");
});

test("no a11y violations — horizontal group", async () => {
  const screen = await render(<HorizontalLayout />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — vertical group", async () => {
  const screen = await render(<VerticalLayout />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — withHandle grip", async () => {
  const screen = await render(
    <ResizablePanelGroup style={GROUP_STYLE}>
      <ResizablePanel id="a">A</ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize" />
      <ResizablePanel id="b">B</ResizablePanel>
    </ResizablePanelGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the group's root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <ResizablePanelGroup ref={ref} style={GROUP_STYLE}>
      <ResizablePanel id="a">A</ResizablePanel>
      <ResizableHandle aria-label="Resize" />
      <ResizablePanel id="b">B</ResizablePanel>
    </ResizablePanelGroup>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("resizable-panel-group");
});

test("the 1px separator exposes a real 24px pointer target", async () => {
  const style = document.createElement("style");
  style.textContent = `
    [data-slot="resizable-handle"] {
      position: fixed;
      inset: auto;
      top: 100px;
      left: 160px;
      width: 1px;
      height: 48px;
      z-index: 2147483647;
    }
    [data-slot="resizable-handle"]::after {
      content: "";
      position: absolute;
      inset-block: 0;
      inset-inline-start: 50%;
      width: 24px;
      transform: translateX(-50%);
    }
  `;
  document.head.append(style);

  try {
    const screen = await render(
      <ResizablePanelGroup style={GROUP_STYLE}>
        <ResizablePanel id="left">Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel id="right">Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.container.querySelector<HTMLElement>(
      '[data-slot="resizable-handle"]',
    );
    expect(handle).not.toBeNull();
    if (!handle) throw new Error("ResizableHandle did not render");
    const rect = handle.getBoundingClientRect();
    expect(document.elementFromPoint(rect.left - 11, rect.top + 10)).toBe(
      handle,
    );
    expect(document.elementFromPoint(rect.left - 13, rect.top + 10)).not.toBe(
      handle,
    );
  } finally {
    style.remove();
  }
});

// Minimal local shape of the primitive's imperative Panel handle — avoids importing the
// primitive directly here to keep this test focused on the wrapper's public surface.
type ResizablePrimitivePanelHandle = {
  collapse: () => void;
  expand: () => void;
  isCollapsed: () => boolean;
  getSize: () => { asPercentage: number; inPixels: number };
  resize: (size: number | string) => void;
};
