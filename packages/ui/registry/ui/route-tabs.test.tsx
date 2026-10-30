import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  RouteTabs,
  RouteTabsPanel,
  RouteTabsProvider,
  type RouteTab,
} from "./route-tabs";

const TABS: RouteTab[] = [
  { href: "/connections", label: "Your connections" },
  { href: "/connections/everyone", label: "Everyone", count: 1234 },
  { href: "/connections/policy", label: "Policy", count: null },
  {
    href: "/connections/activity",
    label: "Activity",
    also: ["/connections/activity/42"],
    "aria-label": "Activity, 3 new",
  },
];

/** Links that never navigate: the test drives `currentHref` itself, as a router would. */
function Inert(props: React.ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        event.preventDefault();
      }}
    />
  );
}

const link = (name: string) =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>("nav a")).find(
    (a) => a.getAttribute("href") === name,
  )!;

test("a named nav of links; the current page matches currentHref", async () => {
  const screen = await render(
    <RouteTabs
      label="Connections"
      tabs={TABS}
      currentHref="/connections/everyone"
    />,
  );
  await expect
    .element(screen.getByRole("navigation", { name: "Connections" }))
    .toBeInTheDocument();
  const everyone = link("/connections/everyone");
  expect(everyone.getAttribute("aria-current")).toBe("page");
  expect(everyone.hasAttribute("data-active")).toBe(true);
  expect(everyone.getAttribute("data-slot")).toBe("tabs-trigger");
  expect(link("/connections").getAttribute("aria-current")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("counts render muted after the label; null shows none; aria-label names the link", async () => {
  const screen = await render(
    <RouteTabs label="Connections" tabs={TABS} currentHref="/connections" />,
  );
  expect(link("/connections/everyone").textContent).toBe("Everyone1,234");
  expect(link("/connections/policy").textContent).toBe("Policy");
  await expect
    .element(screen.getByRole("link", { name: "Activity, 3 new" }))
    .toBeInTheDocument();
});

test("an `also` path marks its tab current", async () => {
  await render(
    <RouteTabs
      label="Connections"
      tabs={TABS}
      currentHref="/connections/activity/42"
    />,
  );
  expect(link("/connections/activity").getAttribute("aria-current")).toBe(
    "page",
  );
});

test("a click marks the tab current at once, with no bar under it, until currentHref moves", async () => {
  const onPendingHrefChange = vi.fn();
  function Host() {
    const [path, setPath] = React.useState("/connections");
    return (
      <>
        <RouteTabs
          label="Connections"
          tabs={TABS}
          currentHref={path}
          linkRender={<Inert />}
          onPendingHrefChange={onPendingHrefChange}
        />
        <a
          href="#land"
          data-testid="land"
          onClick={(event) => {
            event.preventDefault();
            setPath("/connections/policy");
          }}
        >
          land
        </a>
      </>
    );
  }
  const screen = await render(<Host />);
  link("/connections/policy").click();
  await expect
    .poll(() => link("/connections/policy").getAttribute("aria-current"))
    .toBe("page");
  const policy = link("/connections/policy");
  expect(policy.hasAttribute("data-pending")).toBe(true);
  // T25: nothing flashes under the text while the page loads.
  expect(policy.querySelector('[data-slot="route-tabs-pending"]')).toBeNull();
  expect(link("/connections").getAttribute("aria-current")).toBeNull();
  const nav = screen.getByRole("navigation", { name: "Connections" });
  await expect.element(nav).toHaveAttribute("aria-busy", "true");
  await expect
    .poll(() => onPendingHrefChange.mock.calls.at(-1)?.[0])
    .toBe("/connections/policy");
  await expectNoA11yViolations(screen.container);

  (screen.getByTestId("land").element() as HTMLElement).click();
  await expect
    .poll(() => link("/connections/policy").hasAttribute("data-pending"))
    .toBe(false);
  expect(link("/connections/policy").getAttribute("aria-current")).toBe("page");
  await expect.element(nav).not.toHaveAttribute("aria-busy");
  await expect
    .poll(() => onPendingHrefChange.mock.calls.at(-1)?.[0])
    .toBe(null);
});

test("modified clicks and a click on the current tab start nothing", async () => {
  await render(
    <RouteTabs
      label="Connections"
      tabs={TABS}
      currentHref="/connections"
      linkRender={<Inert />}
    />,
  );
  link("/connections/policy").dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true }),
  );
  link("/connections").click();
  await new Promise((r) => setTimeout(r, 50));
  expect(document.querySelector("[data-pending]")).toBeNull();
  expect(link("/connections").getAttribute("aria-current")).toBe("page");
});

test("a controlled pendingHref drives the current tab", async () => {
  await render(
    <RouteTabs
      label="Connections"
      tabs={TABS}
      currentHref="/connections"
      pendingHref="/connections/everyone"
    />,
  );
  const everyone = link("/connections/everyone");
  expect(everyone.getAttribute("aria-current")).toBe("page");
  expect(everyone.hasAttribute("data-pending")).toBe(true);
});

test("linkRender's own classes and onClick survive the merge", async () => {
  const onClick = vi.fn();
  await render(
    <RouteTabs
      label="Connections"
      tabs={TABS}
      currentHref="/connections"
      linkRender={
        <a
          className="extra"
          onClick={(event) => {
            onClick();
            event.preventDefault();
          }}
        />
      }
    />,
  );
  const policy = link("/connections/policy");
  expect(policy.classList.contains("extra")).toBe(true);
  policy.click();
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("RouteTabsPanel dims while the provider's tabs are pending, or by its own prop", async () => {
  function Host() {
    return (
      <RouteTabsProvider>
        <RouteTabs
          label="Connections"
          tabs={TABS}
          currentHref="/connections"
          linkRender={<Inert />}
        />
        <RouteTabsPanel data-testid="panel">Your connections</RouteTabsPanel>
      </RouteTabsProvider>
    );
  }
  const screen = await render(<Host />);
  const panel = screen.getByTestId("panel");
  await expect.element(panel).not.toHaveAttribute("data-pending");
  link("/connections/everyone").click();
  await expect.element(panel).toHaveAttribute("data-pending", "");
  await expect.element(panel).toHaveAttribute("aria-busy", "true");
  await expectNoA11yViolations(screen.container);

  const own = await render(
    <RouteTabsPanel pending data-testid="own">
      Page
    </RouteTabsPanel>,
  );
  await expect
    .element(own.getByTestId("own"))
    .toHaveAttribute("data-pending", "");
});

test("overflow=scroll is reflected on the strip", async () => {
  await render(
    <RouteTabs
      label="Connections"
      tabs={TABS}
      currentHref="/connections"
      overflow="scroll"
    />,
  );
  expect(
    document
      .querySelector('[data-slot="tabs-list"]')
      ?.getAttribute("data-overflow"),
  ).toBe("scroll");
});

test("a spent click never revives: Back to the page it left shows that page, nothing pending", async () => {
  function Host() {
    const [path, setPath] = React.useState("/connections");
    return (
      <RouteTabsProvider>
        <RouteTabs
          label="Connections"
          tabs={TABS}
          currentHref={path}
          linkRender={<Inert />}
        />
        <RouteTabsPanel data-testid="panel">page</RouteTabsPanel>
        <a
          href="#land"
          data-testid="land"
          onClick={(event) => {
            event.preventDefault();
            setPath("/connections/policy");
          }}
        >
          land
        </a>
        <a
          href="#back"
          data-testid="back"
          onClick={(event) => {
            event.preventDefault();
            setPath("/connections");
          }}
        >
          back
        </a>
      </RouteTabsProvider>
    );
  }
  const screen = await render(<Host />);
  link("/connections/policy").click();
  await expect
    .poll(() => link("/connections/policy").hasAttribute("data-pending"))
    .toBe(true);
  (screen.getByTestId("land").element() as HTMLElement).click();
  await expect
    .poll(() => link("/connections/policy").hasAttribute("data-pending"))
    .toBe(false);
  (screen.getByTestId("back").element() as HTMLElement).click();
  await expect
    .poll(() => link("/connections").getAttribute("aria-current"))
    .toBe("page");
  expect(link("/connections/policy").getAttribute("aria-current")).toBeNull();
  expect(document.querySelector("nav [data-pending]")).toBeNull();
  await expect
    .element(screen.getByTestId("panel"))
    .not.toHaveAttribute("data-pending");
});

test("choosing the shown page again while another loads cancels the pending tab", async () => {
  await render(
    <RouteTabs
      label="Connections"
      tabs={TABS}
      currentHref="/connections"
      linkRender={<Inert />}
    />,
  );
  link("/connections/policy").click();
  await expect
    .poll(() => link("/connections/policy").hasAttribute("data-pending"))
    .toBe(true);
  link("/connections").click();
  await expect
    .poll(() => link("/connections").getAttribute("aria-current"))
    .toBe("page");
  expect(document.querySelector("nav [data-pending]")).toBeNull();
});

test("controlled pendingHref: a click requests through onPendingHrefChange; the shown page cancels", async () => {
  const requests: (string | null)[] = [];
  function Host() {
    const [pending, setPending] = React.useState<string | null>(null);
    return (
      <RouteTabs
        label="Connections"
        tabs={TABS}
        currentHref="/connections"
        linkRender={<Inert />}
        pendingHref={pending}
        onPendingHrefChange={(href) => {
          requests.push(href);
          setPending(href);
        }}
      />
    );
  }
  await render(<Host />);
  link("/connections/policy").click();
  await expect
    .poll(() => link("/connections/policy").hasAttribute("data-pending"))
    .toBe(true);
  link("/connections").click();
  await expect
    .poll(() => document.querySelector("nav [data-pending]"))
    .toBeNull();
  expect(requests).toEqual(["/connections/policy", null]);
});

test("overflow=menu: a strip that does not fit folds to the current tab and a menu of links", async () => {
  const sheetCss = await import("../../test/geometry.css?inline");
  const sheet = document.createElement("style");
  sheet.textContent = sheetCss.default;
  document.head.append(sheet);
  const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
  const screen = await render(
    <div style={{ width: 120 }}>
      <RouteTabs
        label="Connections"
        tabs={TABS}
        currentHref="/connections"
        overflow="menu"
        linkRender={<a onClick={onClick} />}
      />
    </div>,
  );
  await expect
    .poll(() =>
      document
        .querySelector('[data-slot="route-tabs"]')!
        .hasAttribute("data-folded"),
    )
    .toBe(true);
  await screen
    .getByRole("button", { name: "Connections: Your connections" })
    .click();
  // Real links in the menu: href kept for new-tab and context-menu use.
  const item = screen.getByRole("menuitem", { name: /Everyone/ });
  expect(item.element().getAttribute("href")).toBe("/connections/everyone");
  await item.click();
  expect(onClick).toHaveBeenCalled();
  sheet.remove();
});
