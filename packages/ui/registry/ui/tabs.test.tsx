import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, onTestFinished, test } from "vitest";
// The compiled lane stylesheet as a STRING, mounted only by the route-list scroll test: the rest of
// this file is structural and gives its scroll boxes inline.
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListVariants,
  tabsTriggerVariants,
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

test('A11Y-20: orientation="vertical" reaches the primitive, so the list is vertical too (Vertical)', async () => {
  const screen = await render(<Subject orientation="vertical" />);
  const root = screen.container.querySelector('[data-slot="tabs"]')!;
  expect(root.getAttribute("data-orientation")).toBe("vertical");
  // Upstream DESTRUCTURES `orientation` and writes only `data-orientation` on the root, so Base
  // UI's own parts reported `horizontal` and the list announced and navigated as a row. A11Y-20
  // forwards the prop, so every part now agrees with the root.
  const list = screen.container.querySelector(
    '[data-slot="tabs-list"]',
  ) as HTMLElement;
  expect(list.getAttribute("data-orientation")).toBe("vertical");
  expect(list.getAttribute("aria-orientation")).toBe("vertical");
  for (const tab of screen.container.querySelectorAll('[role="tab"]'))
    expect(tab.getAttribute("data-orientation")).toBe("vertical");
  // The layout variants still read the root's attribute, exactly as upstream wrote them.
  expect(list.className).toContain("group-data-vertical/tabs:flex-col");
  expect(
    screen.container.querySelector('[data-slot="tabs-trigger"]')!.className,
  ).toContain("group-data-vertical/tabs:w-full");
});

test("vertical tabs announce and move vertically", async () => {
  const screen = await render(
    <Tabs orientation="vertical" defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  await expect
    .element(screen.getByRole("tablist"))
    .toHaveAttribute("aria-orientation", "vertical");
  await userEvent.click(screen.getByRole("tab", { name: "A" }));
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(screen.getByRole("tab", { name: "B" })).toHaveFocus();
});

test("A11Y-20: a vertical list ignores the horizontal arrows (Vertical, keyboard)", async () => {
  const screen = await render(<Subject orientation="vertical" />);
  await userEvent.tab();
  const tabs = [...screen.container.querySelectorAll('[role="tab"]')];
  expect(document.activeElement).toBe(tabs[0]);
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(tabs[0]);
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(tabs[1]);
  await userEvent.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(tabs[0]);
});

test("A11Y-20: the horizontal default is unchanged — no aria-orientation, and ArrowDown does not move (Vertical)", async () => {
  const screen = await render(<Subject />);
  const list = screen.getByRole("tablist").element();
  expect(list.getAttribute("aria-orientation")).toBeNull();
  expect(list.getAttribute("data-orientation")).toBe("horizontal");
  await userEvent.tab();
  const tabs = [...screen.container.querySelectorAll('[role="tab"]')];
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(tabs[0]);
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(tabs[1]);
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

const MANY = [
  "Overview",
  "Activity",
  "Members",
  "Billing",
  "Integrations",
  "Security",
  "Notifications",
  "Advanced",
] as const;

/**
 * Eight line tabs in a 200px box. This lane compiles no Tailwind, so the list's scroll box is
 * given inline — the declarations `overflow="scroll"` compiles to, `relative` included, which makes
 * the list the triggers' offset parent that Base UI's own keyboard scroll measures against — and
 * what is under test is the reveal logic, not the utilities.
 */
function Many(props: Omit<React.ComponentProps<typeof Tabs>, "children">) {
  return (
    <div style={{ width: 200 }}>
      <Tabs {...props}>
        <TabsList
          variant="line"
          style={{
            display: "flex",
            position: "relative",
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          {MANY.map((label) => (
            <TabsTrigger
              key={label}
              value={label.toLowerCase()}
              style={{ flex: "none", padding: "0 16px" }}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function inView(list: HTMLElement, name: string) {
  const tab = [...list.querySelectorAll('[role="tab"]')].find(
    (element) => element.textContent === name,
  )!;
  const box = list.getBoundingClientRect();
  const rect = tab.getBoundingClientRect();
  // 1px absorbs sub-pixel text widths: `scrollWidth` is an integer, so the last fraction of a
  // pixel of the final trigger can never be scrolled to.
  return rect.left >= box.left - 1 && rect.right <= box.right + 1;
}

test('LAY-14: a line list defaults to overflow="scroll"; the pill track stays visible', async () => {
  const screen = await render(
    <Tabs defaultValue="a">
      <TabsList variant="line">
        <TabsTrigger value="a">A</TabsTrigger>
      </TabsList>
      <TabsList>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsList variant="line" overflow="visible">
        <TabsTrigger value="c">C</TabsTrigger>
      </TabsList>
      <TabsList overflow="scroll">
        <TabsTrigger value="d">D</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  const lists = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="tabs-list"]',
    ),
  ];
  expect(lists.map((list) => list.getAttribute("data-overflow"))).toEqual([
    "scroll",
    "visible",
    "visible",
    "scroll",
  ]);
  for (const list of lists) {
    const scrolls = list.getAttribute("data-overflow") === "scroll";
    // The scroll box is horizontal-only, and it is the AttachmentGroup recipe: edge fades that
    // track the scroll position, no scrollbar, no scroll chaining into the page.
    for (const utility of [
      "relative",
      "not-data-vertical:overflow-x-auto",
      "not-data-vertical:scroll-fade-x",
      "not-data-vertical:scrollbar-none",
      "not-data-vertical:overscroll-x-contain",
      "not-data-vertical:max-w-full",
      "not-data-vertical:justify-start",
    ])
      expect(list.className.includes(utility), `${utility}`).toBe(scrolls);
  }
});

test("LAY-14: the active trigger is scrolled into view on mount", async () => {
  const screen = await render(<Many defaultValue="advanced" />);
  const list = screen.getByRole("tablist").element() as HTMLElement;
  expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
  await expect.poll(() => inView(list, "Advanced")).toBe(true);
  expect(list.scrollLeft).toBeGreaterThan(0);
  // Only the list moved: the page did not.
  expect(document.scrollingElement!.scrollLeft).toBe(0);
});

test("LAY-14: a controlled value from outside scrolls its trigger into view", async () => {
  function Controlled() {
    const [value, setValue] = React.useState("overview");
    return (
      <>
        <button type="button" onClick={() => setValue("advanced")}>
          Jump to the end
        </button>
        <button type="button" onClick={() => setValue("overview")}>
          Jump to the start
        </button>
        <Many value={value} onValueChange={setValue} />
      </>
    );
  }
  const screen = await render(<Controlled />);
  const list = screen.getByRole("tablist").element() as HTMLElement;
  expect(inView(list, "Advanced")).toBe(false);
  await userEvent.click(
    screen.getByRole("button", { name: "Jump to the end" }),
  );
  await expect.poll(() => inView(list, "Advanced")).toBe(true);
  await userEvent.click(
    screen.getByRole("button", { name: "Jump to the start" }),
  );
  await expect.poll(() => inView(list, "Overview")).toBe(true);
  expect(list.scrollLeft).toBe(0);
});

test("LAY-14: arrowing to an off-screen tab scrolls it into view", async () => {
  const screen = await render(<Many defaultValue="overview" />);
  const list = screen.getByRole("tablist").element() as HTMLElement;
  await userEvent.tab();
  // End jumps the roving stop to the last tab; the focus move is what brings it into view.
  await userEvent.keyboard("{End}");
  expect(document.activeElement?.textContent).toBe("Advanced");
  await expect.poll(() => inView(list, "Advanced")).toBe(true);
  await userEvent.keyboard("{Home}");
  await expect.poll(() => inView(list, "Overview")).toBe(true);
});

test("API-25: tabsTriggerVariants is the trigger's own class recipe", async () => {
  const screen = await render(<Subject />);
  const trigger = screen.container.querySelector<HTMLElement>(
    '[data-slot="tabs-trigger"]',
  )!;
  const recipe = tabsTriggerVariants();
  expect(typeof recipe).toBe("string");
  for (const utility of recipe.split(" "))
    expect(trigger.classList.contains(utility), utility).toBe(true);
  // The line indicator and the active ink live in the recipe, so a route nav drawn from it
  // looks like the tabs it sits beside.
  expect(recipe).toContain(
    "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
  );
  expect(recipe).toContain("data-active:text-foreground");
});

/** The route-tabs recipe from the docs page: a named nav of links, drawn from the two recipes. */
function RouteTabs({ current }: { current: string }) {
  const routes = ["Overview", "Activity", "Settings"];
  return (
    <nav
      aria-label="Project"
      data-orientation="horizontal"
      className="group/tabs"
    >
      <div
        data-orientation="horizontal"
        data-variant="line"
        className={tabsListVariants({ variant: "line", overflow: "scroll" })}
      >
        {routes.map((route) => (
          <a
            key={route}
            href={`#${route.toLowerCase()}`}
            aria-current={route === current ? "page" : undefined}
            data-active={route === current ? "" : undefined}
            className={tabsTriggerVariants()}
          >
            {route}
          </a>
        ))}
      </div>
    </nav>
  );
}

test("API-25: route tabs are links with aria-current and no tab roles", async () => {
  const screen = await render(<RouteTabs current="Activity" />);
  await expect
    .element(screen.getByRole("navigation", { name: "Project" }))
    .toBeInTheDocument();
  expect(screen.container.querySelector('[role="tablist"]')).toBeNull();
  expect(screen.container.querySelector('[role="tab"]')).toBeNull();
  await expect
    .element(screen.getByRole("link", { name: "Activity" }))
    .toHaveAttribute("aria-current", "page");
  for (const name of ["Overview", "Settings"])
    expect(
      screen.getByRole("link", { name }).element().hasAttribute("aria-current"),
    ).toBe(false);
});

test("LAY-14: a route list with no data-orientation still scrolls horizontally", async () => {
  // Route tabs are a plain `div` drawn from the recipe, with no Base UI list to write the
  // orientation; the scroll box must not wait for the consumer to set it.
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const routes = Array.from({ length: 12 }, (_, i) => `Section ${i + 1}`);
  const screen = await render(
    <div style={{ width: 240 }}>
      <nav aria-label="Sections" className="group/tabs">
        <div
          data-testid="route-list"
          data-variant="line"
          className={tabsListVariants({ variant: "line", overflow: "scroll" })}
        >
          {routes.map((route) => (
            <a key={route} href="#" className={tabsTriggerVariants()}>
              {route}
            </a>
          ))}
        </div>
      </nav>
    </div>,
  );
  const list = screen.getByTestId("route-list").element() as HTMLElement;
  expect(getComputedStyle(list).overflowX).toBe("auto");
  expect(list.clientWidth).toBeLessThanOrEqual(240);
  expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
  // A vertical list keeps upstream's layout: no scroll box.
  list.setAttribute("data-orientation", "vertical");
  expect(getComputedStyle(list).overflowX).toBe("visible");
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

test("no a11y violations — a scrolling line list with eight tabs", async () => {
  const screen = await render(<Many defaultValue="advanced" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — route tabs", async () => {
  const screen = await render(<RouteTabs current="Activity" />);
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
