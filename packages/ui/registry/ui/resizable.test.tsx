import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

const slot = (name: string, root: ParentNode = document) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const slots = (name: string, root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

/**
 * The nth match, with its presence asserted rather than assumed. The package runs with
 * `noUncheckedIndexedAccess`, so an index into a NodeList is `HTMLElement | undefined`; silently
 * asserting through that would turn a missing element into a confusing geometry failure instead of
 * the plain "there is no nth panel" this reports.
 */
const nth = (name: string, index: number, root: ParentNode = document) => {
  const found = slots(name, root)[index];
  expect(found, `no "${name}" at index ${index}`).toBeDefined();
  return found as HTMLElement;
};

/*
 * The group fills its parent at 100%/100%, and this lane compiles no Tailwind, so every fixture
 * gets a real box from an inline style on that parent. Without it the engine measures zero and no
 * layout assertion below would mean anything.
 */
function Box({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <div style={{ width: 400, height: 240 }} {...props}>
      {children}
    </div>
  );
}

function Subject({
  handleProps,
  ...groupProps
}: {
  handleProps?: React.ComponentProps<typeof ResizableHandle>;
} & React.ComponentProps<typeof ResizablePanelGroup>) {
  return (
    <Box>
      <ResizablePanelGroup orientation="horizontal" {...groupProps}>
        <ResizablePanel defaultSize="50%">One</ResizablePanel>
        <ResizableHandle aria-label="Resize panels" {...handleProps} />
        <ResizablePanel defaultSize="50%">Two</ResizablePanel>
      </ResizablePanelGroup>
    </Box>
  );
}

test("renders every exported part with its data-slot (Usage)", async () => {
  const screen = await render(<Subject />);
  expect(slot("resizable-panel-group", screen.container)).not.toBeNull();
  expect(slots("resizable-panel", screen.container)).toHaveLength(2);
  expect(slots("resizable-handle", screen.container)).toHaveLength(1);
});

test("the handle is an ARIA window splitter (Usage)", async () => {
  const screen = await render(<Subject />);
  const handle = slot("resizable-handle", screen.container) as HTMLElement;
  expect(handle.getAttribute("role")).toBe("separator");
  expect(handle.getAttribute("tabindex")).toBe("0");
  expect(handle.getAttribute("aria-controls")).toBeTruthy();
  expect(handle.getAttribute("aria-valuenow")).toBeTruthy();
  expect(handle.getAttribute("aria-valuemin")).toBeTruthy();
  expect(handle.getAttribute("aria-valuemax")).toBeTruthy();
  // `aria-controls` names a real panel in the same group.
  const controlled = document.getElementById(
    handle.getAttribute("aria-controls") as string,
  );
  expect(controlled?.getAttribute("data-slot")).toBe("resizable-panel");
});

test("About: the engine lays the panels out and the arrow keys resize them", async () => {
  const screen = await render(<Subject />);
  const handle = slot("resizable-handle", screen.container) as HTMLElement;
  const first = nth("resizable-panel", 0, screen.container);
  const before = first.getBoundingClientRect().width;
  expect(before).toBeGreaterThan(0);
  const valueBefore = Number(handle.getAttribute("aria-valuenow"));
  handle.focus();
  expect(document.activeElement).toBe(handle);
  await userEvent.keyboard("{ArrowRight}");
  // The keyboard path is the engine's, and it is the reason the focus affordance matters.
  await expect
    .poll(() => Number(handle.getAttribute("aria-valuenow")))
    .toBeGreaterThan(valueBefore);
  await expect
    .poll(() => first.getBoundingClientRect().width)
    .toBeGreaterThan(before);
});

test("About: Home and End jump the split to its bounds", async () => {
  const screen = await render(<Subject />);
  const handle = slot("resizable-handle", screen.container) as HTMLElement;
  handle.focus();
  await userEvent.keyboard("{End}");
  const atEnd = Number(handle.getAttribute("aria-valuenow"));
  await userEvent.keyboard("{Home}");
  await expect
    .poll(() => Number(handle.getAttribute("aria-valuenow")))
    .toBeLessThan(atEnd);
});

test("Composition: a handle sits between the two panels it resizes", async () => {
  const screen = await render(<Subject />);
  const group = slot("resizable-panel-group", screen.container) as HTMLElement;
  const kinds = [...group.children].map((child) =>
    child.getAttribute("data-slot"),
  );
  expect(kinds).toEqual([
    "resizable-panel",
    "resizable-handle",
    "resizable-panel",
  ]);
});

test("Vertical: orientation stacks the panels and turns the handle (Vertical)", async () => {
  const screen = await render(<Subject orientation="vertical" />);
  const group = slot("resizable-panel-group", screen.container) as HTMLElement;
  expect(getComputedStyle(group).flexDirection).toBe("column");
  const handle = slot("resizable-handle", screen.container) as HTMLElement;
  // The handle's own `aria-[orientation=horizontal]:` classes key off this attribute, so a vertical
  // group is what makes the bar span the full width.
  expect(handle.getAttribute("aria-orientation")).toBe("horizontal");
  expect(
    nth("resizable-panel", 1, screen.container).getBoundingClientRect().top,
  ).toBeGreaterThan(
    nth("resizable-panel", 0, screen.container).getBoundingClientRect().top,
  );
});

test("Vertical: groups nest, and the inner group keeps its own axis", async () => {
  const screen = await render(
    <Box>
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize="30%">Header</ResizablePanel>
        <ResizableHandle aria-label="Resize rows" />
        <ResizablePanel defaultSize="70%">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize="40%">List</ResizablePanel>
            <ResizableHandle aria-label="Resize columns" />
            <ResizablePanel defaultSize="60%">Detail</ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Box>,
  );
  expect(slots("resizable-panel-group", screen.container)).toHaveLength(2);
  expect(
    getComputedStyle(nth("resizable-panel-group", 0, screen.container))
      .flexDirection,
  ).toBe("column");
  expect(
    getComputedStyle(nth("resizable-panel-group", 1, screen.container))
      .flexDirection,
  ).toBe("row");
  const orientations = slots("resizable-handle", screen.container).map((h) =>
    h.getAttribute("aria-orientation"),
  );
  expect(orientations).toEqual(["horizontal", "vertical"]);
});

test("Handle: `withHandle` renders the grip, and it is the only difference (Handle)", async () => {
  const bare = await render(<Subject />);
  const plain = slot("resizable-handle", bare.container) as HTMLElement;
  expect(plain.querySelector("div")).toBeNull();

  const gripped = await render(<Subject handleProps={{ withHandle: true }} />);
  const withGrip = slot("resizable-handle", gripped.container) as HTMLElement;
  const grip = withGrip.querySelector("div");
  expect(grip).not.toBeNull();
  // The grip is decoration: the bar itself is still the separator and still the tab stop.
  expect(withGrip.getAttribute("role")).toBe("separator");
  expect(withGrip.getAttribute("tabindex")).toBe("0");
  expect(plain.className).toBe(withGrip.className);
});

test("disabled: the handle leaves the tab order and reports aria-disabled", async () => {
  const screen = await render(<Subject handleProps={{ disabled: true }} />);
  const handle = slot("resizable-handle", screen.container) as HTMLElement;
  expect(handle.getAttribute("aria-disabled")).toBe("true");
  expect(handle.hasAttribute("tabindex")).toBe(false);
  expect(handle.getAttribute("data-separator")).toBe("disabled");
});

test("RTL: the handle's offsets are mirrored with rtl: variants (RTL)", async () => {
  const screen = await render(
    <Box dir="rtl">
      <ResizablePanelGroup orientation="horizontal" dir="rtl">
        <ResizablePanel defaultSize="50%">واحد</ResizablePanel>
        <ResizableHandle aria-label="تغيير الحجم" />
        <ResizablePanel defaultSize="50%">اثنان</ResizablePanel>
      </ResizablePanelGroup>
    </Box>,
  );
  const handle = slot("resizable-handle", screen.container) as HTMLElement;
  expect(getComputedStyle(handle).direction).toBe("rtl");
  expect(handle.className).toContain("rtl:after:translate-x-1/2");
  expect(handle.className).toContain("after:start-1/2");
  // Under rtl the first panel is the RIGHTMOST one — the flex row reverses with the direction.
  expect(
    nth("resizable-panel", 0, screen.container).getBoundingClientRect().left,
  ).toBeGreaterThan(
    nth("resizable-panel", 1, screen.container).getBoundingClientRect().left,
  );
});

test("FOC-1/FOC-6: the handle carries no focus glow and suppresses no outline", async () => {
  const screen = await render(<Subject handleProps={{ withHandle: true }} />);
  const handle = slot("resizable-handle", screen.container) as HTMLElement;
  // The handle is keyboard-operable (the arrow keys resize it), so upstream's
  // `focus-visible:outline-hidden` would have hidden the one affordance it needs.
  expect(handle.className).not.toContain("focus-visible:ring-");
  expect(handle.className).not.toMatch(/(?:^|\s)outline-hidden(?:\s|$)/);
  expect(handle.className).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/(?:^|\s)outline-hidden(?:\s|$)/);
  }
});

test("no a11y violations — horizontal, at rest", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — vertical", async () => {
  const screen = await render(<Subject orientation="vertical" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a focused handle with a visible grip", async () => {
  const screen = await render(<Subject handleProps={{ withHandle: true }} />);
  (slot("resizable-handle", screen.container) as HTMLElement).focus();
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Subject handleProps={{ disabled: true }} />);
  await expectNoA11yViolations(screen.container);
});
