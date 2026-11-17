import { render } from "vitest-browser-react";
import { afterEach, expect, test, vi } from "vitest";
import { CircleHelp } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import {
  GlobalBar,
  GlobalBarAsk,
  GlobalBarCenter,
  GlobalBarHistory,
  GlobalBarLeading,
  GlobalBarSearch,
  GlobalBarTrailing,
} from "./global-bar";
import "../../test/geometry.css";

afterEach(() => {
  const html = document.documentElement;
  html.removeAttribute("data-desktop-titlebar");
  html.style.removeProperty("--shell-titlebar-mac-inset");
  html.style.removeProperty("--shell-titlebar-win-inset");
});

function Bar({
  leading = "Acme",
  width = 1200,
}: {
  leading?: string;
  width?: number;
}) {
  return (
    <div style={{ width }}>
      <GlobalBar>
        <GlobalBarLeading>
          <Button variant="ghost" size="icon-sm" aria-label="Column">
            ▤
          </Button>
          <GlobalBarHistory
            history={{
              canGoBack: true,
              canGoForward: false,
              back: () => {},
              forward: () => {},
            }}
          />
          <Button variant="ghost" size="sm">
            {leading}
          </Button>
        </GlobalBarLeading>
        <GlobalBarCenter>
          <GlobalBarSearch />
        </GlobalBarCenter>
        <GlobalBarTrailing>
          <GlobalBarAsk />
          <Button variant="ghost" size="icon-sm" aria-label="Help">
            <CircleHelp />
          </Button>
        </GlobalBarTrailing>
      </GlobalBar>
    </div>
  );
}

const box = (sel: string) =>
  document.querySelector(sel)!.getBoundingClientRect();

test("44px tall, with the search trigger centred whatever the sides hold", async () => {
  const screen = await render(<Bar leading="A much longer workspace name" />);
  const bar = box('[data-slot="global-bar"]');
  expect(bar.height).toBe(44);
  const search = box('[data-slot="global-bar-search"]');
  expect(Math.round(search.left + search.width / 2)).toBe(
    Math.round(bar.left + bar.width / 2),
  );
  await expectNoA11yViolations(screen.container);
});

test("the triggers carry their shortcuts and history follows what the window can do", async () => {
  const screen = await render(<Bar />);
  const search = screen.getByRole("button", { name: "Search" }).element();
  expect(search.getAttribute("aria-keyshortcuts")).toMatch(/\+K$/);
  const ask = screen.getByRole("button", { name: "Ask" }).element();
  expect(ask.getAttribute("aria-keyshortcuts")).toMatch(/\+J$/);
  await expect
    .element(screen.getByRole("button", { name: "Back" }))
    .not.toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Forward" }))
    .toBeDisabled();
});

test("as the desktop title row it drags the window, keeps controls pressable and clears the window's buttons", async () => {
  const html = document.documentElement;
  html.setAttribute("data-desktop-titlebar", "macos");
  html.style.setProperty("--shell-titlebar-mac-inset", "80px");
  await render(<Bar />);
  const bar = document.querySelector<HTMLElement>('[data-slot="global-bar"]')!;
  const leading = bar.querySelector('[data-slot="global-bar-leading"]')!;
  const trailing = bar.querySelector('[data-slot="global-bar-trailing"]')!;
  expect(getComputedStyle(leading).paddingInlineStart).toBe("80px");
  const region = (el: Element) =>
    getComputedStyle(el).getPropertyValue("-webkit-app-region");
  // Chromium exposes the property; elsewhere there is nothing to assert.
  if (region(bar)) {
    expect(region(bar)).toBe("drag");
    expect(region(bar.querySelector("button")!)).toBe("no-drag");
  }
  html.setAttribute("data-desktop-titlebar", "windows");
  html.style.setProperty("--shell-titlebar-win-inset", "138px");
  await vi.waitFor(() =>
    expect(getComputedStyle(trailing).paddingInlineEnd).toBe("146px"),
  );
});

test("in RTL the traffic lights' room stays on the left, at the trailing slot", async () => {
  const html = document.documentElement;
  html.setAttribute("data-desktop-titlebar", "macos");
  html.style.setProperty("--shell-titlebar-mac-inset", "80px");
  await render(
    <div dir="rtl">
      <Bar />
    </div>,
  );
  const trailing = document.querySelector('[data-slot="global-bar-trailing"]')!;
  expect(getComputedStyle(trailing).paddingInlineEnd).toBe("80px");
});

test.each([
  ["ltr", undefined],
  ["ltr", "macos"],
  ["ltr", "windows"],
  ["rtl", "macos"],
  ["rtl", "windows"],
] as const)(
  "in a 640px bar (%s, %s) the sides and the search never overlap",
  async (dir, titlebar) => {
    const html = document.documentElement;
    if (titlebar) {
      html.setAttribute("data-desktop-titlebar", titlebar);
      html.style.setProperty("--shell-titlebar-mac-inset", "78px");
      html.style.setProperty("--shell-titlebar-win-inset", "138px");
    }
    await render(
      <div dir={dir}>
        <Bar width={640} />
      </div>,
    );
    expect(box('[data-slot="global-bar"]').width).toBe(640);
    const search = box('[data-slot="global-bar-search"]');
    const sides = [
      ...document.querySelectorAll(
        '[data-slot="global-bar-leading"] > *, [data-slot="global-bar-trailing"] > *',
      ),
    ]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0);
    for (const r of sides)
      expect(r.right <= search.left + 0.5 || r.left >= search.right - 0.5).toBe(
        true,
      );
  },
);
