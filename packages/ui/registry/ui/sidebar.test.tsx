/*
 * COMPILED CSS, ON PURPOSE.
 *
 * Almost every component test in this repository runs unstyled — a fast structural lane where
 * `w-5` and `after:-inset-2` are inert. Sidebar cannot: the patch implements A11Y-2 by deleting
 * upstream's `md:after:hidden`, so the claim it has to answer for is "the invisible
 * `after:absolute after:-inset-2` hit area is live, and carries a 20px glyph past 24px, at every
 * width". That is CSS, and it is the kind a class-string assertion can only paraphrase. So this
 * file imports the same stylesheet the geometry lane compiles (real Tailwind + the real token
 * theme) and measures the hit target with `document.elementFromPoint`, at a narrow viewport and at
 * a wide one.
 *
 * Two consequences worth knowing before editing this file:
 *   1. `Sidebar`'s desktop panel is `hidden md:block`, so a test about the desktop panel MUST set
 *      a viewport >= 768px first. `useIsMobile` is a real `matchMedia` subscription, so the
 *      viewport — not a mock — decides which branch mounts.
 *   2. axe's `color-contrast` rule is LIVE here (it is vacuous in the unstyled lanes), so an
 *      a11y assertion in this file is a real rendered-colour assertion too.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { Home, Inbox, Plus, Settings2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";

/** Wide enough for `md:` (the desktop panel) and `sm:` (the rail). */
const WIDE = [1280, 900] as const;
/** Below `md`, so `useIsMobile()` is true and `Sidebar` mounts its Sheet branch. */
const NARROW = [390, 844] as const;

const slot = (root: ParentNode, name: string) =>
  root.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;

const allSlots = (root: ParentNode, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

beforeAll(async () => {
  await page.viewport(...WIDE);

  // COMPILED-CSS SENTINEL, the same fact the geometry lane proves in its own `beforeAll`: with no
  // stylesheet, `w-5` is inert, every box collapses to its intrinsic text size and the hit-target
  // probe below passes or fails for reasons that have nothing to do with the component. A file
  // whose central claim is a measurement must never report green over unstyled DOM.
  const sentinel = document.createElement("div");
  sentinel.className = "w-5 h-5";
  document.body.append(sentinel);
  try {
    const style = getComputedStyle(sentinel);
    expect(
      { width: style.width, height: style.height },
      "test/geometry.css did not compile: `w-5 h-5` must resolve to 20px. Every measurement in " +
        "this file is meaningless without it.",
    ).toEqual({ width: "20px", height: "20px" });
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar")
        .trim(),
      "the @vegastack token theme is not on this page (--sidebar is unset).",
    ).not.toBe("");
  } finally {
    sentinel.remove();
  }
});

beforeEach(() => {
  document.cookie = "sidebar_state=; path=/; max-age=0";
});

afterEach(async () => {
  document.documentElement.removeAttribute("dir");
  await page.viewport(...WIDE);
});

/* ── fixtures ───────────────────────────────────────────────────────────────────────────────── */

/** The full shell, as upstream's Usage section composes it. */
function Shell(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <SidebarProvider>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarInput placeholder="Search" aria-label="Search" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus />
              <span className="sr-only">Add project</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction>
                    <Plus />
                    <span className="sr-only">Add to Home</span>
                  </SidebarMenuAction>
                  <SidebarMenuBadge>24</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#inbox" />}>
                    <Inbox />
                    <span>Inbox</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton render={<a href="#unread" />}>
                        <span>Unread</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings2 />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        {/* `px-4` is upstream's own header composition, and it is load-bearing: flush against the
            inset's inline-start edge the trigger's centred 24px square overlaps `SidebarRail`,
            whose 16px strip straddles the panel boundary. Two crossing targets, exactly as the
            geometry lane records for `resizableNested`. */}
        <header className="flex h-12 items-center gap-2 px-4">
          <SidebarTrigger />
        </header>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** A non-collapsible panel: the one branch that mounts identically at every viewport width. */
function StaticPanel({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="none">
        <SidebarContent>{children}</SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

/* ── the effective-target probe ─────────────────────────────────────────────────────────────── */

/**
 * The 24px effective pointer target of one control, measured the way
 * `packages/ui/test/geometry.browser.test.tsx` measures it: the union of the border box and any
 * absolutely positioned `::before`/`::after` hit area for the SIZE, and five
 * `document.elementFromPoint` probes inside the centred 24px square for OBSTRUCTION.
 *
 * ONE DELIBERATE DIFFERENCE from that lane's copy: a pseudo-element whose computed `display` is
 * `none` is skipped. The lane runs only at 320px, where a `md:` variant never applies, so it never
 * had to express the case — and that is precisely why upstream's `md:after:hidden` was invisible
 * to this repository until this file measured at 1280px and found both action controls at 20×20.
 * The skip is what made the probe tell the truth then, and it is what keeps it honest now: with
 * the hunk applied it must report the hit area, and if `md:after:hidden` ever returns on an
 * upstream pull it must stop.
 */
function effectiveTarget(element: HTMLElement) {
  element.scrollIntoView({ block: "center", inline: "center" });
  const rect = element.getBoundingClientRect();
  let { left, top, right, bottom } = rect;
  for (const pseudo of ["::before", "::after"]) {
    const style = getComputedStyle(element, pseudo);
    if (style.content === "none" || style.position !== "absolute") continue;
    if (style.display === "none" || style.visibility === "hidden") continue;
    const parse = (value: string) =>
      value.endsWith("px") ? Number.parseFloat(value) : Number.NaN;
    const [t, r, b, l] = [style.top, style.right, style.bottom, style.left].map(
      parse,
    ) as [number, number, number, number];
    if ([t, r, b, l].some(Number.isNaN)) continue;
    left = Math.min(left, rect.left + l);
    top = Math.min(top, rect.top + t);
    right = Math.max(right, rect.right - r);
    bottom = Math.max(bottom, rect.bottom - b);
  }

  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  // Half a pixel in from the 24px square's edge: Blink hit-tests against pixel-snapped bounds, so
  // a smaller inset reports phantom misses on the right/bottom edge of a perfectly sized control.
  const half = 12 - 0.5;
  const misses = (
    [
      [centerX - half, centerY],
      [centerX + half, centerY],
      [centerX, centerY - half],
      [centerX, centerY + half],
      [centerX, centerY],
    ] as const
  )
    .map(([x, y]) => ({ x, y, hit: document.elementFromPoint(x, y) }))
    .filter(({ hit }) => !hit || !(hit === element || element.contains(hit)))
    .map(({ x, y, hit }) => ({
      x,
      y,
      hit: hit instanceof Element ? hit.outerHTML.slice(0, 120) : null,
    }));

  return {
    visual: { width: rect.width, height: rect.height },
    effective: { width: right - left, height: bottom - top },
    misses,
  };
}

/* ── Usage ──────────────────────────────────────────────────────────────────────────────────── */

test("renders the whole shell, every exported part carrying its data-slot (Usage)", async () => {
  const screen = await render(<Shell />);
  const root = screen.container;

  for (const name of [
    "sidebar-wrapper",
    "sidebar",
    "sidebar-gap",
    "sidebar-container",
    "sidebar-inner",
    "sidebar-header",
    "sidebar-input",
    "sidebar-content",
    "sidebar-group",
    "sidebar-group-label",
    "sidebar-group-action",
    "sidebar-group-content",
    "sidebar-menu",
    "sidebar-menu-item",
    "sidebar-menu-button",
    "sidebar-menu-action",
    "sidebar-menu-badge",
    "sidebar-menu-sub",
    "sidebar-menu-sub-item",
    "sidebar-menu-sub-button",
    "sidebar-footer",
    "sidebar-separator",
    "sidebar-rail",
    "sidebar-inset",
    "sidebar-trigger",
  ]) {
    expect(slot(root, name), `missing [data-slot="${name}"]`).not.toBeNull();
  }

  // `SidebarMenuSkeleton` is the one part the shell does not carry; it replaces a menu button.
  const loading = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  expect(slot(loading.container, "sidebar-menu-skeleton")).not.toBeNull();
});

test("the wrapper publishes the two width variables the layout is built on (Usage)", async () => {
  const screen = await render(<Shell />);
  const wrapper = slot(screen.container, "sidebar-wrapper") as HTMLElement;
  expect(wrapper.style.getPropertyValue("--sidebar-width")).toBe("16rem");
  expect(wrapper.style.getPropertyValue("--sidebar-width-icon")).toBe("3rem");
});

/* ── Composition ────────────────────────────────────────────────────────────────────────────── */

test("the parts nest in upstream's documented order (Composition)", async () => {
  const screen = await render(<Shell />);
  const root = screen.container;
  const inner = slot(root, "sidebar-inner") as HTMLElement;

  // SidebarProvider ├── Sidebar ├── SidebarInset
  const wrapper = slot(root, "sidebar-wrapper") as HTMLElement;
  expect(wrapper.contains(slot(root, "sidebar") as Node)).toBe(true);
  expect(wrapper.contains(slot(root, "sidebar-inset") as Node)).toBe(true);

  // Sidebar ├── Header ├── Content ├── Footer └── Rail
  for (const name of [
    "sidebar-header",
    "sidebar-content",
    "sidebar-footer",
    "sidebar-rail",
  ]) {
    expect(inner.contains(slot(root, name) as Node), name).toBe(true);
  }

  // Content → Group → (GroupLabel, GroupAction, GroupContent → Menu → MenuItem → …)
  const group = slot(root, "sidebar-group") as HTMLElement;
  expect((slot(root, "sidebar-content") as HTMLElement).contains(group)).toBe(
    true,
  );
  for (const name of [
    "sidebar-group-label",
    "sidebar-group-action",
    "sidebar-group-content",
  ]) {
    expect(group.contains(slot(root, name) as Node), name).toBe(true);
  }
  const item = slot(root, "sidebar-menu-item") as HTMLElement;
  for (const name of [
    "sidebar-menu-button",
    "sidebar-menu-action",
    "sidebar-menu-badge",
  ]) {
    expect(item.contains(slot(root, name) as Node), name).toBe(true);
  }
  const subHost = allSlots(root, "sidebar-menu-item")[1] as HTMLElement;
  expect(subHost.contains(slot(root, "sidebar-menu-sub") as Node)).toBe(true);
});

/* ── Structure ──────────────────────────────────────────────────────────────────────────────── */

test("each structural part is the element its role needs (Structure)", async () => {
  const screen = await render(<Shell />);
  const root = screen.container;

  // SidebarContent is the scrollable region between header and footer.
  const content = slot(root, "sidebar-content") as HTMLElement;
  expect(getComputedStyle(content).overflowY).toBe("auto");
  expect(getComputedStyle(content).flexGrow).toBe("1");

  // SidebarMenu is a real list, so the rows are announced as list items.
  expect((slot(root, "sidebar-menu") as HTMLElement).tagName).toBe("UL");
  expect((slot(root, "sidebar-menu-item") as HTMLElement).tagName).toBe("LI");
  expect((slot(root, "sidebar-menu-sub") as HTMLElement).tagName).toBe("UL");

  // SidebarInset wraps main content — it IS the <main> landmark.
  expect((slot(root, "sidebar-inset") as HTMLElement).tagName).toBe("MAIN");

  // SidebarRail and SidebarTrigger are both real buttons that toggle the sidebar.
  expect((slot(root, "sidebar-rail") as HTMLElement).tagName).toBe("BUTTON");
  expect((slot(root, "sidebar-trigger") as HTMLElement).tagName).toBe("BUTTON");
});

/* ── SidebarProvider ────────────────────────────────────────────────────────────────────────── */

test("defaultOpen={false} mounts collapsed, and a toggle writes the state cookie (SidebarProvider)", async () => {
  const screen = await render(
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="offcanvas">
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
      </SidebarInset>
    </SidebarProvider>,
  );
  const sidebar = slot(screen.container, "sidebar") as HTMLElement;
  expect(sidebar.getAttribute("data-state")).toBe("collapsed");
  expect(sidebar.getAttribute("data-collapsible")).toBe("offcanvas");

  await screen.getByRole("button", { name: "Toggle Sidebar" }).click();
  expect(sidebar.getAttribute("data-state")).toBe("expanded");
  expect(sidebar.getAttribute("data-collapsible")).toBe("");
  expect(document.cookie).toContain("sidebar_state=true");
});

test("a --sidebar-width on the provider overrides the panel width (SidebarProvider)", async () => {
  const screen = await render(
    <SidebarProvider
      style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
    >
      <Sidebar>
        <SidebarContent />
      </Sidebar>
    </SidebarProvider>,
  );
  const container = slot(screen.container, "sidebar-container") as HTMLElement;
  expect(getComputedStyle(container).width).toBe("320px");
});

test("cmd/ctrl + B toggles the sidebar (SidebarProvider — Keyboard Shortcut)", async () => {
  const screen = await render(<Shell />);
  const sidebar = slot(screen.container, "sidebar") as HTMLElement;
  expect(sidebar.getAttribute("data-state")).toBe("expanded");

  await userEvent.keyboard("{Control>}b{/Control}");
  await expect.poll(() => sidebar.getAttribute("data-state")).toBe("collapsed");

  await userEvent.keyboard("{Control>}b{/Control}");
  await expect.poll(() => sidebar.getAttribute("data-state")).toBe("expanded");
});

test("that chord is the ONLY one — the shortcut is not configurable (SidebarProvider — Keyboard Shortcut)", async () => {
  // Upstream's provider hard-codes `SIDEBAR_KEYBOARD_SHORTCUT = "b"` and exposes no prop to retune
  // or disable it; the pre-reset `keyboardShortcut` prop is gone. What can still be asserted is the
  // replacement contract: a different chord, and an unmodified "b", do nothing.
  const screen = await render(<Shell />);
  const sidebar = slot(screen.container, "sidebar") as HTMLElement;

  await userEvent.keyboard("{Control>}k{/Control}");
  expect(sidebar.getAttribute("data-state")).toBe("expanded");

  await userEvent.keyboard("b");
  expect(sidebar.getAttribute("data-state")).toBe("expanded");
});

/* ── Sidebar ────────────────────────────────────────────────────────────────────────────────── */

test.each(["left", "right"] as const)(
  "side=%s is recorded on the panel and its container (Sidebar)",
  async (side) => {
    const screen = await render(<Shell side={side} />);
    expect(
      (slot(screen.container, "sidebar") as HTMLElement).getAttribute(
        "data-side",
      ),
    ).toBe(side);
    expect(
      (slot(screen.container, "sidebar-container") as HTMLElement).getAttribute(
        "data-side",
      ),
    ).toBe(side);
  },
);

test.each(["sidebar", "floating", "inset"] as const)(
  "variant=%s is recorded on the panel (Sidebar)",
  async (variant) => {
    const screen = await render(<Shell variant={variant} />);
    expect(
      (slot(screen.container, "sidebar") as HTMLElement).getAttribute(
        "data-variant",
      ),
    ).toBe(variant);
  },
);

// BRD-1 (extended to the floating sidebar by MK 23-09-2026): the floating panel is a floating
// surface, so its edge is a real 1px border in the sidebar's own hairline ink — not upstream's
// `ring-1 ring-sidebar-border` box-shadow outline. Measured on the compiled CSS (geometry.css), so
// a ring that came back under any spelling shows up as a `0 0 0 1px` layer in box-shadow.
test("BRD-1: the floating panel draws a real sidebar-border edge, not a ring (Sidebar)", async () => {
  const screen = await render(<Shell variant="floating" />);
  const inner = slot(screen.container, "sidebar-inner") as HTMLElement;
  const style = getComputedStyle(inner);
  expect(inner.className).not.toMatch(/ring-1|ring-sidebar-border/);
  expect(style.borderTopWidth).toBe("1px");
  expect(style.borderInlineEndWidth).toBe("1px");
  expect(style.borderTopStyle).toBe("solid");
  const probe = document.createElement("div");
  probe.style.color = "var(--sidebar-border)";
  document.body.append(probe);
  const sidebarBorder = getComputedStyle(probe).color;
  probe.remove();
  expect(style.borderTopColor).toBe(sidebarBorder);
  expect(style.boxShadow).not.toMatch(/0px 0px 0px 1px/);

  // The docked `sidebar` variant keeps its single edge on the container, not a second one here.
  const docked = await render(<Shell variant="sidebar" />);
  const dockedInner = slot(docked.container, "sidebar-inner") as HTMLElement;
  expect(getComputedStyle(dockedInner).borderTopWidth).toBe("0px");
});

test.each(["offcanvas", "icon"] as const)(
  "collapsible=%s reaches data-collapsible once collapsed (Sidebar)",
  async (collapsible) => {
    const screen = await render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible={collapsible}>
          <SidebarContent />
        </Sidebar>
      </SidebarProvider>,
    );
    expect(
      (slot(screen.container, "sidebar") as HTMLElement).getAttribute(
        "data-collapsible",
      ),
    ).toBe(collapsible);
  },
);

test('collapsible="none" renders one plain panel with no gap, container or rail slot (Sidebar)', async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarGroup>
        <SidebarGroupLabel>Static</SidebarGroupLabel>
      </SidebarGroup>
    </StaticPanel>,
  );
  const root = screen.container;
  expect(slot(root, "sidebar")).not.toBeNull();
  expect(slot(root, "sidebar-gap")).toBeNull();
  expect(slot(root, "sidebar-container")).toBeNull();
  expect(slot(root, "sidebar")?.getAttribute("data-state")).toBeNull();
  // It is visible without `md:` — the whole point of the branch.
  expect(getComputedStyle(slot(root, "sidebar") as HTMLElement).display).toBe(
    "flex",
  );
});

test("below md the panel mounts inside a Sheet and opens from the trigger (Sidebar)", async () => {
  await page.viewport(...NARROW);
  const screen = await render(<Shell />);

  // No desktop panel at all: the mobile branch renders a closed Sheet.
  expect(slot(screen.container, "sidebar-container")).toBeNull();
  expect(
    document.querySelector('[data-slot="sidebar"][data-mobile="true"]'),
  ).toBeNull();

  await screen.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect
    .poll(() =>
      document.querySelector('[data-slot="sidebar"][data-mobile="true"]'),
    )
    .not.toBeNull();
  const panel = document.querySelector(
    '[data-slot="sidebar"][data-mobile="true"]',
  ) as HTMLElement;
  expect(panel.getAttribute("data-sidebar")).toBe("sidebar");
  expect(panel.textContent).toContain("Home");
});

/* ── useSidebar ─────────────────────────────────────────────────────────────────────────────── */

function StateReadout() {
  const { state, open, isMobile, toggleSidebar, setOpen, setOpenMobile } =
    useSidebar();
  return (
    <div>
      <output data-testid="readout">
        {state}/{String(open)}/{String(isMobile)}
      </output>
      <button onClick={toggleSidebar}>toggle</button>
      <button onClick={() => setOpen(false)}>close</button>
      <button onClick={() => setOpenMobile(true)}>open mobile</button>
    </div>
  );
}

test("useSidebar exposes the state, the setters and the toggle (useSidebar)", async () => {
  const screen = await render(
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <StateReadout />
      </SidebarInset>
    </SidebarProvider>,
  );
  const readout = screen.getByTestId("readout");
  await expect.element(readout).toHaveTextContent("expanded/true/false");

  await screen.getByRole("button", { name: "toggle" }).click();
  await expect.element(readout).toHaveTextContent("collapsed/false/false");

  await screen.getByRole("button", { name: "toggle" }).click();
  await expect.element(readout).toHaveTextContent("expanded/true/false");

  await screen.getByRole("button", { name: "close" }).click();
  await expect.element(readout).toHaveTextContent("collapsed/false/false");
});

class Catcher extends React.Component<
  { children: React.ReactNode },
  { message: string | null }
> {
  state: { message: string | null } = { message: null };
  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }
  render() {
    return this.state.message ?? this.props.children;
  }
}

test("useSidebar refuses to run outside a SidebarProvider (useSidebar)", async () => {
  function Orphan() {
    useSidebar();
    return null;
  }
  const screen = await render(
    <Catcher>
      <Orphan />
    </Catcher>,
  );
  await expect
    .element(
      screen.getByText("useSidebar must be used within a SidebarProvider."),
    )
    .toBeInTheDocument();
});

/* ── SidebarHeader / SidebarFooter / SidebarContent ─────────────────────────────────────────── */

test("SidebarHeader sits above the content and takes a workspace switcher (SidebarHeader)", async () => {
  const screen = await render(<Shell />);
  const header = slot(screen.container, "sidebar-header") as HTMLElement;
  const content = slot(screen.container, "sidebar-content") as HTMLElement;
  expect(header.getAttribute("data-sidebar")).toBe("header");
  expect(
    header.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  // The header is where `SidebarInput` belongs, and it is a real text input.
  const input = slot(screen.container, "sidebar-input") as HTMLInputElement;
  expect(header.contains(input)).toBe(true);
  expect(input.tagName).toBe("INPUT");
});

test("SidebarFooter sits below the content (SidebarFooter)", async () => {
  const screen = await render(<Shell />);
  const footer = slot(screen.container, "sidebar-footer") as HTMLElement;
  const content = slot(screen.container, "sidebar-content") as HTMLElement;
  expect(footer.getAttribute("data-sidebar")).toBe("footer");
  expect(
    content.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    footer.contains(slot(screen.container, "sidebar-separator") as Node),
  ).toBe(true);
});

test("SidebarContent scrolls and holds the groups (SidebarContent)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarGroup>
        <SidebarGroupLabel>One</SidebarGroupLabel>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Two</SidebarGroupLabel>
      </SidebarGroup>
    </StaticPanel>,
  );
  const content = slot(screen.container, "sidebar-content") as HTMLElement;
  expect(content.getAttribute("data-sidebar")).toBe("content");
  expect(allSlots(content, "sidebar-group")).toHaveLength(2);
  expect(getComputedStyle(content).overflowY).toBe("auto");
});

/* ── SidebarGroup ───────────────────────────────────────────────────────────────────────────── */

test("a group carries a label, an action and a content region (SidebarGroup)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarGroup>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupAction>
          <Plus />
          <span className="sr-only">Add Project</span>
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </StaticPanel>,
  );
  const group = slot(screen.container, "sidebar-group") as HTMLElement;
  expect(group.getAttribute("data-sidebar")).toBe("group");
  expect(
    (slot(group, "sidebar-group-label") as HTMLElement).getAttribute(
      "data-sidebar",
    ),
  ).toBe("group-label");
  const action = slot(group, "sidebar-group-action") as HTMLElement;
  expect(action.tagName).toBe("BUTTON");
  expect(action.getAttribute("data-sidebar")).toBe("group-action");
  await expect
    .element(screen.getByRole("button", { name: "Add Project" }))
    .toBeInTheDocument();
  expect(
    (slot(group, "sidebar-group-content") as HTMLElement).getAttribute(
      "data-sidebar",
    ),
  ).toBe("group-content");
});

test("SidebarGroupLabel takes render, so a Collapsible trigger can BE the label (SidebarGroup)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarGroup>
        <SidebarGroupLabel render={<button type="button" />}>
          Help
        </SidebarGroupLabel>
      </SidebarGroup>
    </StaticPanel>,
  );
  const label = slot(screen.container, "sidebar-group-label") as HTMLElement;
  expect(label.tagName).toBe("BUTTON");
  expect(label.getAttribute("data-sidebar")).toBe("group-label");
});

/* ── SidebarMenu ────────────────────────────────────────────────────────────────────────────── */

test("a menu is a list of items, each one row (SidebarMenu)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarGroup>
        <SidebarMenu>
          {["Home", "Inbox", "Settings"].map((title) => (
            <SidebarMenuItem key={title}>
              <SidebarMenuButton render={<a href={`#${title}`} />}>
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </StaticPanel>,
  );
  const menu = slot(screen.container, "sidebar-menu") as HTMLElement;
  expect(menu.tagName).toBe("UL");
  expect(menu.getAttribute("data-sidebar")).toBe("menu");
  expect(allSlots(menu, "sidebar-menu-item")).toHaveLength(3);
  expect(
    screen.container.querySelectorAll('a[data-slot="sidebar-menu-button"]'),
  ).toHaveLength(3);
});

/* ── SidebarMenuButton ──────────────────────────────────────────────────────────────────────── */

test("render turns the button into an anchor without losing its slot (SidebarMenuButton)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<a href="#home" />} isActive>
            Home
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const button = slot(screen.container, "sidebar-menu-button") as HTMLElement;
  expect(button.tagName).toBe("A");
  expect(button.getAttribute("href")).toBe("#home");
  expect(button.getAttribute("data-sidebar")).toBe("menu-button");
});

test("isActive sets data-active, and the default is no attribute (SidebarMenuButton)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton isActive>Active</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>Idle</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const [active, idle] = allSlots(screen.container, "sidebar-menu-button");
  expect(active!.hasAttribute("data-active")).toBe(true);
  expect(idle!.hasAttribute("data-active")).toBe(false);
});

test.each([
  ["sm", 28],
  ["default", 32],
  ["lg", 48],
] as const)(
  "size=%s sets data-size and compiles to %spx (SidebarMenuButton)",
  async (size, height) => {
    const screen = await render(
      <StaticPanel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size={size}>Row</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </StaticPanel>,
    );
    const button = slot(screen.container, "sidebar-menu-button") as HTMLElement;
    expect(button.getAttribute("data-size")).toBe(size);
    expect(button.getBoundingClientRect().height).toBeCloseTo(height, 0);
  },
);

test("variant=outline paints the ring recipe, default does not (SidebarMenuButton)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton variant="outline">Outline</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton variant="default">Default</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const [outline, base] = allSlots(screen.container, "sidebar-menu-button");
  expect(outline!.className).toContain(
    "shadow-[0_0_0_1px_var(--sidebar-border)]",
  );
  expect(base!.className).not.toContain("shadow-[0_0_0_1px");
});

test("tooltip mounts a Tooltip trigger around the row (SidebarMenuButton)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Home">
            <Home />
            <span>Home</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const button = slot(screen.container, "sidebar-menu-button") as HTMLElement;
  expect(button.getAttribute("data-slot")).toBe("sidebar-menu-button");
  // The Tooltip.Trigger merges onto the same element, so the row keeps one DOM node.
  expect(button.hasAttribute("aria-describedby")).toBe(false);
  expect(button.closest('[data-slot="sidebar-menu-item"]')).not.toBeNull();
});

/* ── SidebarMenuAction ──────────────────────────────────────────────────────────────────────── */

test("an action is a second control inside the row (SidebarMenuAction)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<a href="#home" />}>
            <Home />
            <span>Home</span>
          </SidebarMenuButton>
          <SidebarMenuAction>
            <Plus />
            <span className="sr-only">Add Project</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const action = slot(screen.container, "sidebar-menu-action") as HTMLElement;
  expect(action.tagName).toBe("BUTTON");
  expect(action.getAttribute("data-sidebar")).toBe("menu-action");
  await expect
    .element(screen.getByRole("button", { name: "Add Project" }))
    .toBeInTheDocument();
});

test("showOnHover hides the action at md and above until the row is hovered (SidebarMenuAction)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>Home</SidebarMenuButton>
          <SidebarMenuAction showOnHover>
            <Plus />
            <span className="sr-only">Add</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const action = slot(screen.container, "sidebar-menu-action") as HTMLElement;
  expect(Number(getComputedStyle(action).opacity)).toBe(0);

  await userEvent.hover(
    slot(screen.container, "sidebar-menu-item") as HTMLElement,
  );
  await expect.poll(() => Number(getComputedStyle(action).opacity)).toBe(1);
});

/* ── SidebarMenuSub ─────────────────────────────────────────────────────────────────────────── */

test("a submenu is a nested list of anchors with their own size and active state (SidebarMenuSub)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>Playground</SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton render={<a href="#history" />}>
                History
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                render={<a href="#starred" />}
                size="sm"
                isActive
              >
                Starred
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const sub = slot(screen.container, "sidebar-menu-sub") as HTMLElement;
  expect(sub.tagName).toBe("UL");
  expect(allSlots(sub, "sidebar-menu-sub-item")).toHaveLength(2);

  const [first, second] = allSlots(sub, "sidebar-menu-sub-button");
  expect(first!.tagName).toBe("A");
  expect(first!.getAttribute("data-size")).toBe("md");
  expect(first!.hasAttribute("data-active")).toBe(false);
  expect(second!.getAttribute("data-size")).toBe("sm");
  expect(second!.hasAttribute("data-active")).toBe(true);
});

/* ── SidebarMenuBadge ───────────────────────────────────────────────────────────────────────── */

test("a badge renders its count and never steals the row's pointer (SidebarMenuBadge)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Inbox />
            <span>Inbox</span>
          </SidebarMenuButton>
          <SidebarMenuBadge>24</SidebarMenuBadge>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const badge = slot(screen.container, "sidebar-menu-badge") as HTMLElement;
  expect(badge.textContent).toBe("24");
  expect(badge.getAttribute("data-sidebar")).toBe("menu-badge");
  expect(getComputedStyle(badge).pointerEvents).toBe("none");
});

/* ── SidebarMenuSkeleton ────────────────────────────────────────────────────────────────────── */

test("showIcon adds the leading square, and the text bar is width-capped (SidebarMenuSkeleton)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton />
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const [withIcon, withoutIcon] = allSlots(
    screen.container,
    "sidebar-menu-skeleton",
  );
  expect(
    withIcon!.querySelector('[data-sidebar="menu-skeleton-icon"]'),
  ).not.toBeNull();
  expect(
    withoutIcon!.querySelector('[data-sidebar="menu-skeleton-icon"]'),
  ).toBeNull();

  const bar = withIcon!.querySelector(
    '[data-sidebar="menu-skeleton-text"]',
  ) as HTMLElement;
  // Upstream picks a random 50–90% width once per mount; assert the CONTRACT (the variable is set
  // and inside the documented band), never a specific number.
  const width = Number.parseFloat(
    bar.style.getPropertyValue("--skeleton-width"),
  );
  expect(width).toBeGreaterThanOrEqual(50);
  expect(width).toBeLessThanOrEqual(90);
});

/* ── SidebarTrigger ─────────────────────────────────────────────────────────────────────────── */

test("the trigger toggles the sidebar and keeps its own onClick (SidebarTrigger)", async () => {
  let clicks = 0;
  const screen = await render(
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger
          onClick={() => {
            clicks += 1;
          }}
        />
      </SidebarInset>
    </SidebarProvider>,
  );
  const sidebar = slot(screen.container, "sidebar") as HTMLElement;
  const trigger = screen.getByRole("button", { name: "Toggle Sidebar" });

  await trigger.click();
  expect(clicks).toBe(1);
  expect(sidebar.getAttribute("data-state")).toBe("collapsed");

  await trigger.click();
  expect(clicks).toBe(2);
  expect(sidebar.getAttribute("data-state")).toBe("expanded");
});

/* ── SidebarRail ────────────────────────────────────────────────────────────────────────────── */

test("the rail toggles the sidebar, is named, and is out of the tab order (SidebarRail)", async () => {
  const screen = await render(<Shell />);
  const rail = slot(screen.container, "sidebar-rail") as HTMLButtonElement;
  const sidebar = slot(screen.container, "sidebar") as HTMLElement;

  expect(rail.getAttribute("aria-label")).toBe("Toggle Sidebar");
  expect(rail.getAttribute("title")).toBe("Toggle Sidebar");
  // Upstream keeps the rail out of sequential focus on purpose: SidebarTrigger is the keyboard
  // affordance, and the rail is the pointer one. Recorded here so a change is deliberate.
  expect(rail.tabIndex).toBe(-1);

  rail.click();
  await expect.poll(() => sidebar.getAttribute("data-state")).toBe("collapsed");
});

/* ── Controlled Sidebar ─────────────────────────────────────────────────────────────────────── */

function Controlled() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar collapsible="offcanvas">
          <SidebarContent />
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
      <button onClick={() => setOpen(true)}>open from outside</button>
    </>
  );
}

test("open/onOpenChange drive the panel from outside (Controlled Sidebar)", async () => {
  const screen = await render(<Controlled />);
  const sidebar = slot(screen.container, "sidebar") as HTMLElement;
  expect(sidebar.getAttribute("data-state")).toBe("collapsed");

  await screen.getByRole("button", { name: "open from outside" }).click();
  await expect.poll(() => sidebar.getAttribute("data-state")).toBe("expanded");

  await screen.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect.poll(() => sidebar.getAttribute("data-state")).toBe("collapsed");
});

test("a controlled provider never writes the state cookie itself — the host owns it (Controlled Sidebar)", async () => {
  const screen = await render(<Controlled />);
  await screen.getByRole("button", { name: "open from outside" }).click();
  // Upstream writes the cookie from `setOpen`, which the host's own state button bypasses, so a
  // controlled sidebar persists only what its host chooses to persist.
  expect(document.cookie).not.toContain("sidebar_state=");
});

/* ── Theming ────────────────────────────────────────────────────────────────────────────────── */

test("the --sidebar-* variables repaint every part (Theming)", async () => {
  const screen = await render(
    <div
      style={
        {
          "--sidebar": "rgb(10, 20, 30)",
          "--sidebar-foreground": "rgb(240, 240, 240)",
        } as React.CSSProperties
      }
    >
      <StaticPanel>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </StaticPanel>
    </div>,
  );
  const panel = slot(screen.container, "sidebar") as HTMLElement;
  expect(getComputedStyle(panel).backgroundColor).toBe("rgb(10, 20, 30)");
  expect(getComputedStyle(panel).color).toBe("rgb(240, 240, 240)");
});

/* ── Styling ────────────────────────────────────────────────────────────────────────────────── */

test("group-data-[collapsible=icon] hides what icon mode cannot show (Styling)", async () => {
  const screen = await render(
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Always</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );
  const [hidden, always] = allSlots(screen.container, "sidebar-group");
  expect(getComputedStyle(hidden!).display).toBe("none");
  expect(getComputedStyle(always!).display).toBe("flex");
});

/**
 * Upstream's Styling section documents `peer-data-[active=true]/menu-button:opacity-100` for
 * pinning a hover-revealed action on the active row. That literal does not work on this build, for
 * two measured reasons, and the `md:` prefix below is the form that does:
 *
 *   1. Base UI's `useRender` writes `data-active` with an EMPTY value, so `[active=true]` never
 *      matches. The shorthand `peer-data-active/…` does — Tailwind compiles it to
 *      `[data-active]:not([data-active="false"])`.
 *   2. That shorthand's compiled selector wraps both the peer class and the attribute in
 *      `:where()`, so it scores (0,1,0) — exactly the same as `showOnHover`'s own `md:opacity-0`,
 *      which then wins on source order. `group-hover/menu-item:` survives the same collision only
 *      because its `:hover` is NOT inside the `:where()` and lifts it to (0,2,0).
 *
 * Adding `md:` puts the override in the same cascade layer as the rule it is overriding. Both
 * halves are asserted, so if upstream ever changes either the attribute or the selector shape,
 * this test names which one moved.
 */
test("md:peer-data-active/menu-button pins an action on the active row (Styling)", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton isActive>Home</SidebarMenuButton>
          <SidebarMenuAction
            showOnHover
            className="md:peer-data-active/menu-button:opacity-100"
          >
            <Plus />
            <span className="sr-only">Add</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>Inbox</SidebarMenuButton>
          <SidebarMenuAction
            showOnHover
            className="md:peer-data-active/menu-button:opacity-100"
          >
            <Plus />
            <span className="sr-only">Add</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const [onActive, onIdle] = allSlots(screen.container, "sidebar-menu-action");
  expect(Number(getComputedStyle(onActive!).opacity)).toBe(1);
  expect(Number(getComputedStyle(onIdle!).opacity)).toBe(0);

  // Reason (1), pinned: the attribute carries no value, so `data-[active=true]` cannot match it.
  const active = allSlots(
    screen.container,
    "sidebar-menu-button",
  )[0] as HTMLElement;
  expect(active.getAttribute("data-active")).toBe("");
});

/* ── RTL ────────────────────────────────────────────────────────────────────────────────────── */

test("side=right under dir=rtl anchors the panel to the reading start (RTL)", async () => {
  document.documentElement.setAttribute("dir", "rtl");
  const screen = await render(<Shell side="right" dir="rtl" />);
  const container = slot(screen.container, "sidebar-container") as HTMLElement;
  expect(container.getAttribute("data-side")).toBe("right");

  const rect = container.getBoundingClientRect();
  expect(rect.right).toBeCloseTo(window.innerWidth, 0);

  // The trigger icon flips with the reading direction — `rtl:rotate-180` on the glyph. Tailwind v4
  // compiles `rotate-180` to the standalone `rotate` property, not to `transform`.
  const icon = (
    slot(screen.container, "sidebar-trigger") as HTMLElement
  ).querySelector("svg") as SVGElement;
  expect(getComputedStyle(icon).rotate).toBe("180deg");
});

test("the submenu rail is a logical inline-start border, so it flips with the direction (RTL)", async () => {
  document.documentElement.setAttribute("dir", "rtl");
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>القائمة</SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton render={<a href="#one" />}>
                عنصر
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const sub = slot(screen.container, "sidebar-menu-sub") as HTMLElement;
  const style = getComputedStyle(sub);
  // `border-s` resolves to the RIGHT edge in RTL and the left edge in LTR.
  expect(Number.parseFloat(style.borderRightWidth)).toBeGreaterThan(0);
  expect(Number.parseFloat(style.borderLeftWidth)).toBe(0);
});

/* ── exceptions the patch implements ────────────────────────────────────────────────────────── */

/**
 * The parts `sidebar.tsx` styles ITSELF. `sidebar-input`, `sidebar-trigger` and
 * `sidebar-separator` are excluded because they are `Input`, `Button` and `Separator` wearing a
 * sidebar slot name: their recipes belong to those components' own patches, and `Input` in
 * particular carries a SANCTIONED `outline-hidden` (FOC-3 — text entry shows a border tint instead
 * of a ring). Sweeping them here would assert someone else's contract and fail on a rule this
 * system deliberately keeps.
 */
const OWN_SLOTS =
  '[data-slot^="sidebar"]:not([data-slot="sidebar-input"]):not([data-slot="sidebar-trigger"]):not([data-slot="sidebar-separator"])';

test("FOC-1/FOC-6: no sidebar part cancels its outline or paints a ring glow", async () => {
  const screen = await render(<Shell />);
  const parts = [...screen.container.querySelectorAll<HTMLElement>(OWN_SLOTS)];
  expect(parts.length).toBeGreaterThan(15);
  for (const part of parts) {
    const classes = part.className;
    expect(classes, part.dataset.slot).not.toMatch(
      /ring-3|ring-\[3px\]|ring-ring\/\d+/,
    );
    expect(classes, part.dataset.slot).not.toContain("focus-visible:ring-");
    expect(classes, part.dataset.slot).not.toMatch(
      /(?:^|\s)outline-hidden(?:\s|$)/,
    );
    expect(classes, part.dataset.slot).not.toMatch(
      /(?:^|\s)outline-none(?:\s|$)/,
    );
  }
});

test("FOC-1/FOC-6: the five patched controls keep ring-sidebar-ring and paint no ring", async () => {
  const screen = await render(<Shell />);
  const patched = [
    slot(screen.container, "sidebar-group-label"),
    slot(screen.container, "sidebar-group-action"),
    slot(screen.container, "sidebar-menu-button"),
    slot(screen.container, "sidebar-menu-action"),
    slot(screen.container, "sidebar-menu-sub-button"),
  ] as HTMLElement[];

  for (const element of patched) {
    expect(element, "one of the five patched controls did not render").not.toBe(
      null,
    );
    // `ring-sidebar-ring` survives the patch deliberately — it is a colour with no ring width
    // behind it, and it is `--sidebar-ring`'s only reference in the file. So it must be present
    // AND must paint nothing.
    expect(element.className).toContain("ring-sidebar-ring");
    const style = getComputedStyle(element);
    expect(style.outlineStyle, element.dataset.slot).not.toBe("auto");
    // A 3px halo would show up here as a spread ring in the box shadow; nothing paints one.
    expect(style.boxShadow, element.dataset.slot).not.toMatch(/ 3px/);
  }
});

test("FOC-1/FOC-6: keyboard focus lands on the design system's own 2px outline", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>Home</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  // Real keyboard focus, not `element.focus()`: Chromium's `:focus-visible` heuristic is sensitive
  // to what the last interaction was, and a file this long has clicked things before this point.
  await userEvent.tab();
  const focused = document.activeElement as HTMLElement;
  expect(focused.dataset.slot).toBe("sidebar-menu-button");
  const style = getComputedStyle(focused);
  // `auto` would be the USER AGENT's ring — accepting it is how a focus check becomes unfalsifiable.
  expect(style.outlineStyle).toBe("solid");
  expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
});

test("FRM-4: a disabled row keeps live pointer events so a tooltip can explain it", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled aria-disabled="true">
            Disabled row
          </SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton aria-disabled="true">
                Disabled sub row
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  const button = slot(screen.container, "sidebar-menu-button") as HTMLElement;
  const sub = slot(screen.container, "sidebar-menu-sub-button") as HTMLElement;

  for (const element of [button, sub]) {
    expect(element.className).not.toContain("disabled:pointer-events-none");
    expect(element.className).not.toContain(
      "aria-disabled:pointer-events-none",
    );
    // The measurement, not the class string: the element still receives the pointer.
    expect(getComputedStyle(element).pointerEvents).not.toBe("none");
    // Both opacity halves stay, so the row still READS as disabled.
    expect(element.className).toContain("aria-disabled:opacity-50");
    expect(Number(getComputedStyle(element).opacity)).toBeCloseTo(0.5, 2);
  }

  // …and the browser agrees: the disabled row still wins its own centre pixel.
  const rect = button.getBoundingClientRect();
  const hit = document.elementFromPoint(
    (rect.left + rect.right) / 2,
    (rect.top + rect.bottom) / 2,
  );
  expect(hit === button || button.contains(hit)).toBe(true);
});

/*
 * A11Y-2 — the floor, at both widths, for both action controls.
 *
 * `SidebarMenuAction` and `SidebarGroupAction` are `w-5 aspect-square` glyphs — 20×20, under the
 * WCAG 2.2 §2.5.8 floor on their own. Upstream grows them with an invisible
 * `after:absolute after:-inset-2` hit area and then switches it off again at `md` and above with
 * `md:after:hidden`, which left both controls at 20×20 on every desktop width. The patch drops
 * `md:after:hidden`, so the hit area is live at every width; that is the whole hunk, and these
 * tests are what it is accountable to.
 *
 * Both widths are measured with a real `elementFromPoint` probe, and the wide case is not a weaker
 * assertion than the narrow one — it is the same floor and the same obstruction sweep. If
 * `md:after:hidden` ever comes back on an upstream pull, the 1280px case is what catches it.
 */
function ActionRow() {
  return (
    <StaticPanel>
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupAction>
          <Plus />
          <span className="sr-only">Add project</span>
        </SidebarGroupAction>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Home</SidebarMenuButton>
            <SidebarMenuAction>
              <Plus />
              <span className="sr-only">Add to Home</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </StaticPanel>
  );
}

test.each([
  ["390px (below md)", NARROW],
  ["1280px (md and above)", WIDE],
] as const)(
  "A11Y-2: at %s the invisible after hit area carries both actions past 24px",
  async (_label, [width, height]) => {
    await page.viewport(width, height);
    const screen = await render(<ActionRow />);

    for (const name of ["sidebar-menu-action", "sidebar-group-action"]) {
      const control = slot(screen.container, name) as HTMLElement;

      // The hit area must be LIVE here. `md:after:hidden` is the hunk A11Y-2 removed, and a
      // pseudo-element switched off by the cascade is exactly what `effectiveTarget` refuses to
      // count — so this assertion and the measurement below are two independent statements of the
      // same fact, and neither can pass on the other's behalf.
      const after = getComputedStyle(control, "::after");
      expect(
        after.display,
        `${name}'s ::after hit area at ${width}px`,
      ).not.toBe("none");
      expect(after.position, `${name}'s ::after hit area at ${width}px`).toBe(
        "absolute",
      );

      const probe = effectiveTarget(control);
      // The visible glyph stays upstream's 20px square — the patch changed the hit area and
      // nothing else.
      expect(
        { width: probe.visual.width, height: probe.visual.height },
        `${name} visual box at ${width}px`,
      ).toEqual({ width: 20, height: 20 });
      expect(
        {
          width: probe.effective.width >= 23.5,
          height: probe.effective.height >= 23.5,
        },
        `${name} effective target at ${width}px measured ` +
          `${probe.effective.width.toFixed(2)}×${probe.effective.height.toFixed(2)}px`,
      ).toEqual({ width: true, height: true });
      expect(
        probe.misses,
        `${name} must own the interior of its centred 24px square at ${width}px`,
      ).toEqual([]);
    }
  },
);

test("A11Y-2: the rows and the trigger clear 24px at both widths", async () => {
  for (const [width, height] of [NARROW, WIDE]) {
    await page.viewport(width, height);
    const screen = await render(<ActionRow />);
    const row = slot(screen.container, "sidebar-menu-button") as HTMLElement;
    const probe = effectiveTarget(row);
    expect(
      probe.effective.height >= 23.5,
      `menu row at ${width}px measured ${probe.effective.height.toFixed(2)}px tall`,
    ).toBe(true);
    expect(probe.misses, `menu row at ${width}px`).toEqual([]);
  }

  await page.viewport(...WIDE);
  const shell = await render(<Shell />);
  const trigger = slot(shell.container, "sidebar-trigger") as HTMLElement;
  const probe = effectiveTarget(trigger);
  expect(
    {
      width: probe.effective.width >= 23.5,
      height: probe.effective.height >= 23.5,
    },
    `SidebarTrigger measured ${probe.effective.width.toFixed(2)}×${probe.effective.height.toFixed(2)}px`,
  ).toEqual({ width: true, height: true });
  expect(probe.misses, "SidebarTrigger").toEqual([]);
});

/* ── accessibility, per distinct state ──────────────────────────────────────────────────────── */

test("no a11y violations — expanded", async () => {
  const screen = await render(<Shell />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — collapsed to icons", async () => {
  const screen = await render(
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Home">
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
      </SidebarInset>
    </SidebarProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled row", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled aria-disabled="true">
            Disabled row
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </StaticPanel>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading skeletons", async () => {
  const screen = await render(
    <StaticPanel>
      <SidebarMenu>
        {Array.from({ length: 3 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </StaticPanel>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — mobile sheet open", async () => {
  await page.viewport(...NARROW);
  const screen = await render(<Shell />);
  await screen.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect
    .poll(() =>
      document.querySelector('[data-slot="sidebar"][data-mobile="true"]'),
    )
    .not.toBeNull();
  // The Sheet portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});
