import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { selectedChipVariants } from "@vegastack/design";
import { expectNoA11yViolations } from "../../test/a11y";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

function Basic({ variant }: { variant?: "line" | "pill" } = {}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant={variant}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity" count={3}>
          Activity
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="activity">Activity panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  );
}

test("renders the tabs and the first panel", async () => {
  const screen = await render(<Basic />);
  await expect
    .element(screen.getByRole("tab", { name: "Overview" }))
    .toBeInTheDocument();
  await expect.element(screen.getByText("Overview panel")).toBeInTheDocument();
});

test("the default tab is selected", async () => {
  const screen = await render(<Basic />);
  await expect
    .element(screen.getByRole("tab", { name: "Overview" }))
    .toHaveAttribute("data-active");
});

test("clicking a tab switches the panel and sets data-active", async () => {
  const screen = await render(<Basic />);
  const settings = screen.getByRole("tab", { name: "Settings" });
  await settings.click();
  await expect.element(settings).toHaveAttribute("data-active");
  await expect.element(screen.getByText("Settings panel")).toBeInTheDocument();
  // The previously active tab is no longer active.
  await expect
    .element(screen.getByRole("tab", { name: "Overview" }))
    .not.toHaveAttribute("data-active");
});

test("arrow-key keyboard navigation moves between tabs", async () => {
  const screen = await render(<Basic />);
  const overview = screen.getByRole("tab", { name: "Overview" });
  await overview.click();
  // Manual activation: arrow moves focus, Enter activates.
  await userEvent.keyboard("{ArrowRight}{Enter}");
  await expect
    .element(screen.getByRole("tab", { name: "Activity" }))
    .toHaveAttribute("data-active");
  await expect.element(screen.getByText("Activity panel")).toBeInTheDocument();
});

test("renders a trailing count badge on a trigger", async () => {
  const screen = await render(<Basic />);
  const count = screen.container.querySelector(
    '[data-slot="tabs-trigger-count"]',
  );
  expect(count).not.toBeNull();
  expect(count).toHaveTextContent("3");
});

test("list variant is reflected on data-variant (line default)", async () => {
  const screen = await render(<Basic />);
  const list = screen.container.querySelector('[data-slot="tabs-list"]');
  expect(list).toHaveAttribute("data-variant", "line");
});

test("pill variant sets data-variant and renders no moving indicator", async () => {
  const screen = await render(<Basic variant="pill" />);
  const list = screen.container.querySelector('[data-slot="tabs-list"]');
  expect(list).toHaveAttribute("data-variant", "pill");
  expect(
    screen.container.querySelector('[data-slot="tabs-indicator"]'),
  ).toBeNull();
});

test("line variant renders the moving indicator", async () => {
  const screen = await render(<Basic variant="line" />);
  expect(
    screen.container.querySelector('[data-slot="tabs-indicator"]'),
  ).not.toBeNull();
});

test("content panel leaves the focus ring to the global rule (B6-10)", async () => {
  const screen = await render(<Basic />);
  const panel = screen.container.querySelector('[data-slot="tabs-content"]');
  // The panel used to restate `focus-visible:outline-2 outline-offset-1 outline-ring`, which is
  // exactly the centralized `:focus-visible` rule — two copies that could only drift apart.
  expect(panel?.className).not.toContain("outline-ring");
  expect(panel?.className).not.toContain("focus-visible:outline");
});

test("vertical orientation is reflected on the root", async () => {
  const screen = await render(
    <Tabs defaultValue="a" orientation="vertical">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A panel</TabsContent>
      <TabsContent value="b">B panel</TabsContent>
    </Tabs>,
  );
  const root = screen.container.querySelector('[data-slot="tabs"]');
  expect(root).toHaveAttribute("data-orientation", "vertical");
});

test("disabled trigger does not activate on click", async () => {
  const screen = await render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b" disabled>
          B
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">A panel</TabsContent>
      <TabsContent value="b">B panel</TabsContent>
    </Tabs>,
  );
  const b = screen.getByRole("tab", { name: "B" });
  await expect.element(b).toHaveAttribute("data-disabled");
  await expect.element(screen.getByText("A panel")).toBeInTheDocument();
});

test("no a11y violations", async () => {
  const screen = await render(<Basic />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled tab", async () => {
  const screen = await render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b" disabled>
          B
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">A panel</TabsContent>
      <TabsContent value="b">B panel</TabsContent>
    </Tabs>,
  );
  await expectNoA11yViolations(screen.container);
});

test("horizontal list scrolls with a scroll-fade edge affordance (clipped tabs read as scrollable)", async () => {
  const screen = await render(<Basic />);
  const list = screen.container.querySelector(
    '[data-slot="tabs-list"]',
  ) as HTMLElement;
  expect(
    list.classList.contains(
      "group-data-[orientation=horizontal]/tabs:overflow-x-auto",
    ),
  ).toBe(true);
  expect(
    list.classList.contains(
      "group-data-[orientation=horizontal]/tabs:scroll-fade-x",
    ),
  ).toBe(true);
  expect(
    list.classList.contains(
      "group-data-[orientation=horizontal]/tabs:scrollbar-none",
    ),
  ).toBe(true);
  const trigger = screen.getByRole("tab", { name: "A" }).element();
  expect(trigger.classList.contains("focus-visible:-outline-offset-2")).toBe(
    true,
  );
});

test("forwards ref to the underlying tabs root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Tabs ref={ref} defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
    </Tabs>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("tabs");
});

test("chip variant: free-standing list, active trigger raises to a hairline chip", async () => {
  const screen = await render(
    <Tabs defaultValue="overview">
      <TabsList variant="chip">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity" count={4}>
          Activity
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">O</TabsContent>
      <TabsContent value="activity">A</TabsContent>
    </Tabs>,
  );
  const list = screen.getByRole("tablist");
  await expect.element(list).toHaveAttribute("data-variant", "chip");
  const active = screen.getByRole("tab", { name: /Overview/ });
  await expect.element(active).toHaveAttribute("data-active");
  // No underline indicator is rendered for chip lists.
  expect(document.querySelector('[data-slot="tabs-indicator"]')).toBeNull();
});

test("pill and chip tabs wear the SHARED selected-chip recipe; line does not (B6-02)", async () => {
  for (const variant of ["pill", "chip"] as const) {
    const screen = await render(
      <Tabs defaultValue="overview">
        <TabsList variant={variant}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">O</TabsContent>
      </Tabs>,
    );
    // `render` commits through Base UI's own layout effects, so the trigger is not in the DOM on
    // the tick the promise resolves — take the element only after an awaited assertion has
    // retried it into existence, never straight off the locator.
    const tabLocator = screen.getByRole("tab", { name: "Overview" });
    await expect.element(tabLocator).toBeInTheDocument();
    const tab = tabLocator.element();
    for (const rule of selectedChipVariants.active.split(" ")) {
      expect(tab.className).toContain(rule);
    }
    screen.unmount();
  }
  // `line` has no chip at all — its active state is the moving underline, so taking the chip fill
  // would paint a plate under the indicator.
  const line = await render(<Basic variant="line" />);
  const lineTabLocator = line.getByRole("tab", { name: "Overview" });
  await expect.element(lineTabLocator).toBeInTheDocument();
  const lineTab = lineTabLocator.element();
  expect(lineTab.className).not.toContain("data-[active]:bg-foreground");
});

test("the line tab's hover wash is held OFF the indicator rail (SP-02)", async () => {
  const horizontal = await render(<Basic variant="line" />);
  const hTabLocator = horizontal.getByRole("tab", { name: "Overview" });
  await expect.element(hTabLocator).toBeInTheDocument();
  const hTab = hTabLocator.element();
  const list = horizontal.getByRole("tablist").element();
  // The list draws the rule the underline rides; a hover fill that ends exactly on it reads as a
  // rendering bug rather than a state (design.md §Hover geometry).
  expect(list.className).toContain(
    "group-data-[orientation=horizontal]/tabs:border-b",
  );
  expect(hTab.className).toContain(
    "group-data-[orientation=horizontal]/tabs:group-data-[variant=line]/tabs-list:mb-1",
  );
  horizontal.unmount();

  // The vertical variant mirrors it onto the inline-start rail (logical, so RTL follows).
  const vertical = await render(
    <Tabs defaultValue="overview" orientation="vertical">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">O</TabsContent>
    </Tabs>,
  );
  const vTabLocator = vertical.getByRole("tab", { name: "Overview" });
  await expect.element(vTabLocator).toBeInTheDocument();
  const vTab = vTabLocator.element();
  const vList = vertical.getByRole("tablist").element();
  expect(vTab.className).toContain(
    "group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:ms-1",
  );
  expect(vList.className).toContain(
    "group-data-[orientation=vertical]/tabs:border-s",
  );
  // The MEASURED gap lives in the contract lane (`apps/docs/vrt/contracts.spec.ts`), which runs
  // against real compiled CSS — this suite imports none, so a pixel assertion here would only
  // prove that an unstyled element has no margin.
});
