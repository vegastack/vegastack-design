import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListVariants,
} from "./tabs";
import { DirectionProvider } from "./direction";

/** Upstream's whole variant set for `TabsList` — `default` is the grey pill track. */
const LIST_VARIANTS = ["default", "line"] as const;

const slot = (name: string) =>
  document.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;

/**
 * Index a collection and prove the element is there. The package runs with
 * `noUncheckedIndexedAccess`, so `list[i]` is `T | undefined`; this narrows it by ASSERTING the
 * element exists rather than by asserting it away, so a missing element fails the test it is in.
 */
function at<T extends Element>(list: ArrayLike<T>, index: number): T {
  const element = list[index];
  expect(element, `element at index ${index} must be present`).toBeDefined();
  return element as T;
}

function Subject(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="account" {...props}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
    </Tabs>
  );
}

test("renders, and every exported part carries its data-slot (Usage)", async () => {
  const screen = await render(<Subject />);
  expect(slot("tabs")).toBe(screen.container.firstElementChild);
  expect(slot("tabs-list")).not.toBeNull();
  expect(slot("tabs-trigger")).not.toBeNull();
  expect(slot("tabs-content")).not.toBeNull();
  await expect
    .element(screen.getByText("Make changes to your account here."))
    .toBeInTheDocument();
});

test("the four parts compose into a tablist with one panel per value (Composition)", async () => {
  const screen = await render(<Subject />);
  const list = screen.container.querySelector('[data-slot="tabs-list"]')!;
  expect(list.getAttribute("role")).toBe("tablist");
  const tabs = [...screen.container.querySelectorAll('[role="tab"]')];
  expect(tabs).toHaveLength(2);
  // Exactly one panel is rendered at a time, and it is the one the selected tab controls.
  const panels = [...screen.container.querySelectorAll('[role="tabpanel"]')];
  expect(panels).toHaveLength(1);
  expect(at(panels, 0).getAttribute("aria-labelledby")).toBe(at(tabs, 0).id);
});

test("activating a trigger swaps the panel (Usage)", async () => {
  const screen = await render(<Subject />);
  await userEvent.click(screen.getByRole("tab", { name: "Password" }));
  await expect
    .element(screen.getByText("Change your password here."))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="tabs-trigger"][data-active]')
      ?.textContent,
  ).toBe("Password");
});

test.each(LIST_VARIANTS)(
  'variant="%s" is recorded on the list as data-variant (Line)',
  async (variant) => {
    const screen = await render(
      <Tabs defaultValue="a">
        <TabsList variant={variant}>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const list = screen.container.querySelector('[data-slot="tabs-list"]')!;
    expect(list.getAttribute("data-variant")).toBe(variant);
    expect(list.className).toContain(
      variant === "line" ? "bg-transparent" : "bg-muted",
    );
  },
);

test("the list variant defaults to the pill track, not to line (Line)", async () => {
  const screen = await render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  expect(
    screen.container
      .querySelector('[data-slot="tabs-list"]')!
      .getAttribute("data-variant"),
  ).toBe("default");
  expect(tabsListVariants()).toContain("bg-muted");
});

test('orientation="vertical" is written onto the root and read by the list (Vertical)', async () => {
  const screen = await render(<Subject orientation="vertical" />);
  const root = screen.container.querySelector('[data-slot="tabs"]')!;
  expect(root.getAttribute("data-orientation")).toBe("vertical");
  // Upstream DESTRUCTURES `orientation` and writes `data-orientation` itself rather than
  // forwarding the prop, so Base UI's own parts still report `horizontal`. The vertical layout is
  // carried entirely by the `group-data-vertical/tabs:` variants that read the ROOT's attribute —
  // which is what this asserts, because it is what upstream actually ships.
  const list = screen.container.querySelector(
    '[data-slot="tabs-list"]',
  ) as HTMLElement;
  expect(list.getAttribute("data-orientation")).toBe("horizontal");
  expect(list.className).toContain("group-data-vertical/tabs:flex-col");
  expect(
    screen.container.querySelector('[data-slot="tabs-trigger"]')!.className,
  ).toContain("group-data-vertical/tabs:w-full");
});

test("the horizontal default is written onto the root too (Vertical)", async () => {
  const screen = await render(<Subject />);
  expect(
    screen.container
      .querySelector('[data-slot="tabs"]')!
      .getAttribute("data-orientation"),
  ).toBe("horizontal");
});

test("a disabled trigger cannot be activated (Disabled)", async () => {
  const screen = await render(
    <Tabs defaultValue="home">
      <TabsList>
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Disabled
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">Home panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>,
  );
  const disabled = at(screen.container.querySelectorAll('[role="tab"]'), 1);
  expect(
    disabled.hasAttribute("disabled") ||
      disabled.getAttribute("aria-disabled") === "true",
  ).toBe(true);
  await userEvent.click(disabled, { force: true });
  await expect.element(screen.getByText("Home panel")).toBeInTheDocument();
  expect(screen.container.textContent).not.toContain("Settings panel");
});

test("an icon child needs no wrapper and no size class (Icons)", async () => {
  const screen = await render(
    <Tabs defaultValue="preview">
      <TabsList>
        <TabsTrigger value="preview">
          <svg data-testid="icon" aria-hidden="true" />
          Preview
        </TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  const trigger = screen.container.querySelector('[role="tab"]')!;
  expect(trigger.querySelector("svg")).not.toBeNull();
  // The trigger, not the caller, sizes a bare svg child and takes it out of hit testing.
  expect(trigger.className).toContain("[&_svg]:pointer-events-none");
  expect(trigger.className).toContain("[&_svg:not([class*='size-'])]:size-4");
});

test("arrow keys move the selection along the list (Usage, keyboard)", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  const tabs = [...screen.container.querySelectorAll('[role="tab"]')];
  expect(document.activeElement).toBe(tabs[0]);
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(tabs[1]);
  // Base UI activates manually, not on focus: the arrow moves the roving stop, Enter commits it.
  expect(at(tabs, 1).getAttribute("aria-selected")).toBe("false");
  await userEvent.keyboard("{Enter}");
  await expect
    .element(screen.getByText("Change your password here."))
    .toBeInTheDocument();
});

test("RTL: the arrow keys follow the reading direction (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Subject />
      </div>
    </DirectionProvider>,
  );
  const tabs = [...screen.container.querySelectorAll('[role="tab"]')];
  await userEvent.tab();
  expect(document.activeElement).toBe(tabs[0]);
  // Under RTL the NEXT tab is to the LEFT, so ArrowLeft advances and ArrowRight goes back.
  await userEvent.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(tabs[1]);
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(tabs[0]);
});

test("the active indicator is positioned on logical edges, so it survives RTL (RTL)", async () => {
  const screen = await render(<Subject />);
  const trigger = screen.container.querySelector('[data-slot="tabs-trigger"]')!;
  expect(trigger.className).toContain("group-data-vertical/tabs:after:-end-1");
  expect(trigger.className).toContain(
    "group-data-horizontal/tabs:after:inset-x-0",
  );
});

test("FOC-1/FOC-6: no focus glow, and the panel keeps its outline", async () => {
  const screen = await render(<Subject />);
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("outline-none");
    expect(classes).not.toContain("outline-hidden");
  }
  // The panel is a tab stop (Base UI puts `tabindex="0"` on it for the APG reason), which is
  // exactly why FOC-6 refuses to suppress its outline.
  const panel = screen.container.querySelector(
    '[role="tabpanel"]',
  ) as HTMLElement;
  expect(panel.tabIndex).toBe(0);
});

test("FRM-4: a disabled trigger keeps its pointer events so a tooltip can explain it", async () => {
  const screen = await render(
    <Tabs defaultValue="home">
      <TabsList>
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Disabled
        </TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  const disabled = at(
    screen.container.querySelectorAll<HTMLElement>('[role="tab"]'),
    1,
  );
  // Class-level, because this lane compiles no Tailwind: what FRM-4 removed from upstream is the
  // pair of `pointer-events-none` variants, and their absence is the whole change.
  expect(disabled.className).not.toContain("disabled:pointer-events-none");
  expect(disabled.className).not.toContain("aria-disabled:pointer-events-none");
  expect(getComputedStyle(disabled).pointerEvents).not.toBe("none");
  // Both opacity halves stay, so the state is still visible.
  expect(disabled.className).toContain("disabled:opacity-50");
  expect(disabled.className).toContain("aria-disabled:opacity-50");
});

test("API-5: Tabs ships no loading prop — the panel, not the tab, owns a pending state", async () => {
  const screen = await render(<Subject />);
  for (const element of screen.container.querySelectorAll("*")) {
    expect(element.hasAttribute("data-loading")).toBe(false);
    expect(element.getAttribute("aria-busy")).toBeNull();
  }
  expect(Object.keys(Tabs)).not.toContain("loading");
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — vertical", async () => {
  const screen = await render(<Subject orientation="vertical" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — line variant", async () => {
  const screen = await render(
    <Tabs defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="analytics">Analytics panel</TabsContent>
    </Tabs>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Tabs defaultValue="home">
      <TabsList>
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Disabled
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">Home panel</TabsContent>
    </Tabs>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — RTL", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Subject />
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});
