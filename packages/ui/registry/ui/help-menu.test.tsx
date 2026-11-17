import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { CircleHelp } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { HelpMenu } from "./help-menu";
import { ShellRailItem } from "./shell";

function Rail({ children }: { children: React.ReactNode }) {
  return <nav aria-label="Modules">{children}</nav>;
}

const helpTrigger = (dot?: string) => (
  <ShellRailItem icon={<CircleHelp />} label="Help" dot={dot} />
);

const LINKS = {
  whatsNew: { href: "/docs/whats-new" },
  docs: { href: "/docs" },
  shortcuts: { onSelect: () => {} },
  support: { href: "mailto:help@example.com", external: true },
};

const trigger = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="help-menu"] [aria-haspopup="menu"]',
  )!;

async function openMenu() {
  trigger().click();
  await expect
    .poll(() => document.querySelector('[data-slot="help-menu-content"]'))
    .not.toBeNull();
}

test("the rail trigger is named Help and opens the menu in order", async () => {
  const screen = await render(
    <Rail>
      <HelpMenu trigger={helpTrigger()} links={LINKS} version="v1.8.21" />
    </Rail>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Help" }))
    .toBeInTheDocument();
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
    <Rail>
      <HelpMenu
        trigger={helpTrigger()}
        links={LINKS}
        linkRender={<RouterLink />}
      />
    </Rail>,
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
    <Rail>
      <HelpMenu trigger={helpTrigger()} links={{ shortcuts: { onSelect } }} />
    </Rail>,
  );
  await openMenu();
  document.querySelector<HTMLElement>('[data-entry="shortcuts"]')!.click();
  expect(onSelect).toHaveBeenCalledTimes(1);
});

test("omitted entries are not shown; labels and the shortcut hint are overridable", async () => {
  await render(
    <Rail>
      <HelpMenu
        trigger={helpTrigger()}
        shortcutsHint="⇧/"
        links={{
          docs: { href: "/docs", label: "Documentation" },
          shortcuts: { onSelect: () => {}, label: "Raccourcis" },
        }}
      />
    </Rail>,
  );
  await openMenu();
  const items = Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="help-menu-item"]'),
  ).map((i) => i.textContent);
  expect(items).toEqual(["Documentation", "Raccourcis⇧/"]);
  expect(document.querySelector('[data-slot="help-menu-version"]')).toBeNull();
});

test("whatsNewUnread marks What's new with a dot and says so", async () => {
  await render(
    <Rail>
      <HelpMenu
        trigger={helpTrigger("new updates")}
        links={LINKS}
        whatsNewUnread
      />
    </Rail>,
  );
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
