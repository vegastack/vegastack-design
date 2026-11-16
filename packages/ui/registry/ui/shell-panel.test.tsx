import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { parsePanelTabKey, type PanelTabRef } from "../lib/panel-tabs";
import type { ShellPanelMode } from "../lib/shell-layout";
import {
  ShellPanel,
  ShellPanelBody,
  ShellPanelClose,
  ShellPanelEmpty,
  ShellPanelHeader,
  ShellPanelOverflow,
  ShellPanelTab,
  ShellPanelTabs,
  ShellPanelView,
  usePanelTabs,
} from "./shell-panel";

const ref = (key: string) => parsePanelTabKey(key) as PanelTabRef;
const TITLES: Record<string, string> = {
  "task:1": "Review Q3 pricing",
  "task:2": "Orchid quote sign-off",
  "page:3": "Q3 pricing notes",
};

function Counter() {
  const [n, setN] = React.useState(0);
  return (
    <button type="button" onClick={() => setN(n + 1)}>
      Clicked {n}
    </button>
  );
}

function Harness({
  mode = "dock",
  initial = ["task:1", "task:2", "~page:3"],
  onRequestClose,
  onWidthChange,
  onAction,
}: {
  mode?: ShellPanelMode;
  initial?: string[];
  onRequestClose?: () => void;
  onWidthChange?: (w: number) => void;
  onAction?: (key: string, action: string) => void;
}) {
  const tabs = usePanelTabs({ autoClose: "never" });
  React.useEffect(() => {
    for (const k of initial)
      tabs.open(ref(k.replace("~", "")), { preview: k.startsWith("~") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { state } = tabs;
  return (
    <div
      data-slot="shell"
      data-panel-mode={mode}
      className="group/shell flex h-96 w-[48rem]"
    >
      <main data-slot="shell-content" className="flex-1">
        <button type="button" data-testid="opener">
          Opener
        </button>
      </main>
      <div className="h-full w-96">
        <ShellPanel
          onRequestClose={onRequestClose}
          width={384}
          onWidthChange={onWidthChange}
        >
          <ShellPanelHeader>
            <ShellPanelTabs
              value={state.activeKey}
              onValueChange={tabs.activate}
              onClose={tabs.close}
              onReorder={tabs.reorder}
              onAction={(key, action) => {
                onAction?.(key, action);
                tabs.act(key, action);
              }}
            >
              {state.tabs.map((t) => (
                <ShellPanelTab
                  key={t.key}
                  value={t.key}
                  title={TITLES[t.key] ?? t.key}
                  preview={t.preview}
                  pinned={t.pinned}
                  changed={t.changed}
                />
              ))}
            </ShellPanelTabs>
            <ShellPanelOverflow
              tabs={state.tabs.map((t) => ({
                value: t.key,
                title: TITLES[t.key] ?? t.key,
                preview: t.preview,
              }))}
              closed={state.closed.map((t) => ({
                value: t.key,
                title: TITLES[t.key] ?? t.key,
              }))}
              value={state.activeKey}
              onSelect={tabs.activate}
              onReopen={tabs.reopen}
            />
            <ShellPanelClose onClick={onRequestClose} />
          </ShellPanelHeader>
          {state.tabs.length === 0 ? (
            <ShellPanelEmpty
              recent={state.closed.map((t) => ({
                value: t.key,
                title: TITLES[t.key] ?? t.key,
              }))}
              onReopen={tabs.reopen}
            />
          ) : (
            <ShellPanelBody>
              {state.tabs.map((t) => (
                <ShellPanelView
                  key={t.key}
                  value={t.key}
                  activeValue={state.activeKey}
                >
                  <p>{TITLES[t.key]}</p>
                  <Counter />
                </ShellPanelView>
              ))}
            </ShellPanelBody>
          )}
        </ShellPanel>
      </div>
    </div>
  );
}

const tab = (name: RegExp | string) => page.getByRole("tab", { name });

test("renders labelled tabs and panels, with the preview in italics, axe-clean", async () => {
  const screen = await render(<Harness />);
  await expect
    .element(tab(/Q3 pricing notes, preview/))
    .toHaveAttribute("aria-selected", "true");
  const tabs = screen.container.querySelectorAll("[role='tab']");
  expect(tabs).toHaveLength(3);
  expect(tabs[0]!.tagName).toBe("BUTTON");
  expect(
    screen.container.querySelector(
      "[data-preview] [data-slot='shell-panel-tab-title']",
    )!.className,
  ).toContain("italic");
  const panel = screen.container.querySelector(
    "[role='tabpanel']:not([hidden])",
  );
  expect(panel?.getAttribute("aria-labelledby")).toBe(
    screen.container.querySelector("[role='tab'][aria-selected='true']")!.id,
  );
  await expectNoA11yViolations(screen.container);
});

test("roving focus with manual activation; Delete closes and focuses the neighbour", async () => {
  const screen = await render(<Harness />);
  await expect
    .element(tab(/Q3 pricing notes/))
    .toHaveAttribute("aria-selected", "true");
  const focusables = screen.container.querySelectorAll(
    "[role='tab'][tabindex='0']",
  );
  expect(focusables).toHaveLength(1);
  (focusables[0] as HTMLElement).focus();
  await userEvent.keyboard("{Home}");
  await expect.element(tab(/Review Q3 pricing/)).toHaveFocus();
  // Moving focus does not open the tab…
  await expect
    .element(tab(/Q3 pricing notes/))
    .toHaveAttribute("aria-selected", "true");
  // …Enter does.
  await userEvent.keyboard("{Enter}");
  await expect
    .element(tab(/Review Q3 pricing/))
    .toHaveAttribute("aria-selected", "true");
  await userEvent.keyboard("{Delete}");
  await expect.element(tab(/Orchid quote/)).toHaveFocus();
  expect(screen.container.querySelectorAll("[role='tab']")).toHaveLength(2);
});

test("a hidden tab stays alive: switching back keeps its state", async () => {
  await render(<Harness initial={["task:1", "task:2"]} />);
  await tab(/Review Q3 pricing/).click();
  await page.getByRole("button", { name: "Clicked 0" }).click();
  await expect
    .element(page.getByRole("button", { name: "Clicked 1" }))
    .toBeVisible();
  await tab(/Orchid quote/).click();
  await tab(/Review Q3 pricing/).click();
  await expect
    .element(page.getByRole("button", { name: "Clicked 1" }))
    .toBeVisible();
});

test("double-click keeps a preview tab", async () => {
  await render(<Harness />);
  await tab(/Q3 pricing notes, preview/).dblClick();
  await expect.element(tab("Q3 pricing notes")).toBeVisible();
});

test("on a phone the panel is modal: the rest of the shell is inert, close reads Back", async () => {
  const close = vi.fn();
  const screen = await render(<Harness mode="full" onRequestClose={close} />);
  const panel = screen.container.querySelector("[data-slot='shell-panel']")!;
  expect(panel.getAttribute("role")).toBe("dialog");
  expect(panel.getAttribute("aria-modal")).toBe("true");
  const main = screen.container.querySelector("main")!;
  await vi.waitFor(() => expect(main.inert).toBe(true));
  await expect
    .element(page.getByRole("button", { name: "Back" }))
    .toBeVisible();
  // Tab stays inside the panel.
  for (let i = 0; i < 6; i++) {
    await userEvent.keyboard("{Tab}");
    expect(panel.contains(document.activeElement)).toBe(true);
  }
  // Escape closes the phone panel itself (it is not "another" dialog).
  (document.activeElement as HTMLElement).blur();
  await userEvent.keyboard("{Escape}");
  expect(close).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("the separator resizes from the keyboard and reports once per step", async () => {
  const onWidthChange = vi.fn();
  const screen = await render(<Harness onWidthChange={onWidthChange} />);
  const sep =
    screen.container.querySelector<HTMLElement>("[role='separator']")!;
  sep.focus();
  await userEvent.keyboard("{ArrowLeft}");
  expect(onWidthChange).toHaveBeenLastCalledWith(416);
  await userEvent.keyboard("{End}");
  expect(onWidthChange).toHaveBeenLastCalledWith(720);
  const shell = screen.container.querySelector<HTMLElement>(
    "[data-slot='shell']",
  )!;
  expect(shell.style.getPropertyValue("--shell-panel-current-width")).toBe(
    "720px",
  );
});

test("⇧F10 opens the tab menu; its actions reach onAction", async () => {
  const onAction = vi.fn();
  await render(<Harness onAction={onAction} />);
  await expect.element(tab(/Q3 pricing notes/)).toBeVisible();
  (document.querySelector("[role='tab'][tabindex='0']") as HTMLElement).focus();
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await page.getByRole("menuitem", { name: "Pin" }).click();
  expect(onAction).toHaveBeenCalledWith("page:3", "pin");
});

test("closing every tab shows the empty state with Recently closed, axe-clean", async () => {
  const screen = await render(<Harness initial={["task:1"]} />);
  await tab(/Review Q3 pricing/).click();
  await userEvent.keyboard("{Delete}");
  await expect.element(page.getByText("Nothing open")).toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Review Q3 pricing" }))
    .toBeVisible();
  // The opener is gone from the panel's memory: focus lands on the page's main region.
  await vi.waitFor(() => expect(document.activeElement?.tagName).toBe("MAIN"));
  await expectNoA11yViolations(screen.container);
});

test("Escape never closes a docked panel, and closes an overlaying one after its popovers", async () => {
  const close = vi.fn();
  const docked = await render(<Harness onRequestClose={close} />);
  await userEvent.keyboard("{Escape}");
  expect(close).not.toHaveBeenCalled();
  docked.unmount();

  await render(<Harness mode="overlay" onRequestClose={close} />);
  await page.getByRole("button", { name: "All tabs" }).click();
  await expect.element(page.getByPlaceholder("Search tabs")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  expect(close).not.toHaveBeenCalled();
  await userEvent.keyboard("{Escape}");
  expect(close).toHaveBeenCalledTimes(1);
});
