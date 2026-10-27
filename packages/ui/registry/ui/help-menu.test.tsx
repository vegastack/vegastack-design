import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { HelpMenu } from "./help-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarProvider,
} from "./sidebar";

/** Report a desktop viewport so the rail mounts in the page, not as a closed Sheet. */
beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

function Shell({
  open = true,
  children,
}: {
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={open}>
      <Sidebar collapsible="icon">
        <SidebarContent />
        <SidebarFooter>
          <SidebarMenu>{children}</SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

const LINKS = {
  whatsNew: { href: "/docs/whats-new" },
  docs: { href: "/docs" },
  shortcuts: { onSelect: () => {} },
  support: { href: "mailto:help@example.com", external: true },
};

const trigger = () =>
  document.querySelector<HTMLElement>('[data-slot="help-menu-trigger"]')!;

async function openMenu() {
  trigger().click();
  await expect
    .poll(() => document.querySelector('[data-slot="help-menu-content"]'))
    .not.toBeNull();
}

test("renders a sidebar item whose trigger is named Help and opens a menu", async () => {
  const screen = await render(
    <Shell>
      <HelpMenu links={LINKS} version="v1.8.21" />
    </Shell>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Help" }))
    .toBeInTheDocument();
  expect(document.querySelector('[data-slot="help-menu"]')?.tagName).toBe("LI");
  await expectNoA11yViolations(screen.container);
  await openMenu();
  const items = Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="help-menu-item"]'),
  );
  expect(items.map((i) => i.dataset.entry)).toEqual([
    "whatsNew",
    "docs",
    "shortcuts",
    "support",
  ]);
  expect(items.map((i) => i.textContent)).toEqual([
    "What's new",
    "Docs",
    "Keyboard shortcuts?",
    "Contact support",
  ]);
  expect(
    document.querySelector('[data-slot="help-menu-version"]')?.textContent,
  ).toBe("v1.8.21");
  await expectNoA11yViolations(document.body);
});

test("link entries render through linkRender with their href; external opens a new tab", async () => {
  function RouterLink(props: React.ComponentProps<"a">) {
    return <a data-router="" {...props} />;
  }
  await render(
    <Shell>
      <HelpMenu links={LINKS} linkRender={<RouterLink />} />
    </Shell>,
  );
  await openMenu();
  const docs = document.querySelector<HTMLAnchorElement>(
    '[data-entry="docs"]',
  )!;
  expect(docs.tagName).toBe("A");
  expect(docs.getAttribute("href")).toBe("/docs");
  expect(docs.hasAttribute("data-router")).toBe(true);
  const support = document.querySelector<HTMLAnchorElement>(
    '[data-entry="support"]',
  )!;
  expect(support.getAttribute("target")).toBe("_blank");
  expect(support.getAttribute("rel")).toBe("noopener");
  // An action entry is not a link.
  expect(document.querySelector('[data-entry="shortcuts"]')?.tagName).not.toBe(
    "A",
  );
});

test("an action entry runs onSelect", async () => {
  const onSelect = vi.fn();
  await render(
    <Shell>
      <HelpMenu links={{ shortcuts: { onSelect } }} />
    </Shell>,
  );
  await openMenu();
  document.querySelector<HTMLElement>('[data-entry="shortcuts"]')!.click();
  expect(onSelect).toHaveBeenCalledTimes(1);
});

test("omitted entries are not shown; labels and the shortcut hint are overridable", async () => {
  await render(
    <Shell>
      <HelpMenu
        label="Aide"
        shortcutsHint="⇧/"
        links={{
          docs: { href: "/docs", label: "Documentation" },
          shortcuts: { onSelect: () => {}, label: "Raccourcis" },
        }}
      />
    </Shell>,
  );
  expect(trigger().textContent).toBe("Aide");
  await openMenu();
  const items = Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="help-menu-item"]'),
  ).map((i) => i.textContent);
  expect(items).toEqual(["Documentation", "Raccourcis⇧/"]);
  expect(document.querySelector('[data-slot="help-menu-version"]')).toBeNull();
});

test("whatsNewUnread marks the trigger and What's new with a dot and says so", async () => {
  const screen = await render(
    <Shell>
      <HelpMenu links={LINKS} whatsNewUnread />
    </Shell>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Help (new updates)" }))
    .toBeInTheDocument();
  expect(trigger().querySelector('[data-slot="help-menu-dot"]')).not.toBeNull();
  await openMenu();
  const whatsNew = document.querySelector<HTMLElement>(
    '[data-entry="whatsNew"]',
  )!;
  expect(whatsNew.textContent).toBe("What's new (new updates)");
  expect(
    whatsNew.querySelector('[data-slot="notification-dot"]'),
  ).not.toBeNull();
  await expectNoA11yViolations(document.body);
});

test("no dot without a What's new entry, even when unread", async () => {
  await render(
    <Shell>
      <HelpMenu links={{ docs: { href: "/docs" } }} whatsNewUnread />
    </Shell>,
  );
  expect(trigger().querySelector('[data-slot="help-menu-dot"]')).toBeNull();
});

test("in the collapsed rail it stays a named icon trigger; the dot moves onto the icon", async () => {
  const screen = await render(
    <Shell open={false}>
      <HelpMenu links={LINKS} whatsNewUnread />
    </Shell>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Help (new updates)" }))
    .toBeInTheDocument();
  expect(
    trigger()
      .querySelector('[data-slot="help-menu-dot"]')
      ?.className.includes("group-data-[collapsible=icon]:absolute"),
  ).toBe(true);
  await expectNoA11yViolations(screen.container);
});
