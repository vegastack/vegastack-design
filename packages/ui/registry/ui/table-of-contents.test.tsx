import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import {
  TableOfContents,
  type TableOfContentsItem,
  useActiveHeading,
} from "./table-of-contents";

// The harness compiles no Tailwind, so colour contrast cannot be measured here
// (test/contrast.browser.test.tsx does that against compiled CSS).
const NO_CONTRAST = ["color-contrast"];

const ITEMS: TableOfContentsItem[] = [
  { id: "wiring", level: 1, text: "Wiring" },
  { id: "breakers", level: 2, text: "Breakers" },
  { id: "rcd", level: 3, text: "RCD" },
  { id: "labels", level: 4, text: "Labels" },
  { id: "sign-off", level: 2, text: "Sign-off" },
];

const link = (name: string) =>
  document.querySelector<HTMLAnchorElement>(
    `[data-slot="table-of-contents-link"][href="#${name}"]`,
  )!;
const root = () =>
  document.querySelector<HTMLElement>('[data-slot="table-of-contents"]')!;

test("list: a labelled nav of links, indented relative to the shallowest level, level 4 left out by default", async () => {
  const screen = await render(<TableOfContents items={ITEMS} />);
  const nav = screen.getByRole("navigation", { name: "On this page" });
  await expect.element(nav).toHaveAttribute("data-variant", "list");
  await expect.element(screen.getByText("On this page")).toBeVisible();
  const links = [
    ...document.querySelectorAll('[data-slot="table-of-contents-link"]'),
  ];
  expect(links.map((a) => a.getAttribute("href"))).toEqual([
    "#wiring",
    "#breakers",
    "#rcd",
    "#sign-off",
  ]);
  const depths = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="table-of-contents-item"]',
    ),
  ].map((li) => li.style.getPropertyValue("--table-of-contents-depth"));
  expect(depths).toEqual(["0", "1", "2", "1"]);
  await expectNoA11yViolations(document.body, NO_CONTRAST);
});

test("minLevel and maxLevel filter the levels; indentation follows the shallowest shown", async () => {
  await render(<TableOfContents items={ITEMS} minLevel={2} maxLevel={4} />);
  const items = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="table-of-contents-item"]',
    ),
  ];
  expect(items.map((li) => li.dataset.level)).toEqual(["2", "3", "4", "2"]);
  expect(
    items.map((li) => li.style.getPropertyValue("--table-of-contents-depth")),
  ).toEqual(["0", "1", "2", "0"]);
});

test("renders nothing when no heading is in range", async () => {
  const screen = await render(
    <div data-testid="host">
      <TableOfContents items={[]} />
      <TableOfContents items={[{ id: "x", level: 5, text: "Deep" }]} />
    </div>,
  );
  expect(screen.getByTestId("host").element().childElementCount).toBe(0);
});

test("a controlled activeId marks one item with aria-current=location and data-active", async () => {
  const screen = await render(
    <TableOfContents items={ITEMS} activeId="breakers" />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Breakers" }))
    .toHaveAttribute("aria-current", "location");
  expect(link("breakers").hasAttribute("data-active")).toBe(true);
  expect(document.querySelectorAll('[aria-current="location"]').length).toBe(1);
  expect(link("wiring").hasAttribute("aria-current")).toBe(false);
  await expectNoA11yViolations(document.body, NO_CONTRAST);
});

test("a click calls onNavigate instead of following the hash; a modified click is left to the browser", async () => {
  const onNavigate = vi.fn();
  await render(<TableOfContents items={ITEMS} onNavigate={onNavigate} />);
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  link("rcd").dispatchEvent(click);
  expect(onNavigate).toHaveBeenCalledWith("rcd");
  expect(click.defaultPrevented).toBe(true);

  const modified = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    ctrlKey: true,
  });
  modified.preventDefault(); // keep the test page where it is
  link("wiring").dispatchEvent(modified);
  expect(onNavigate).toHaveBeenCalledTimes(1);
});

test("keyboard: one tab stop landing on the active item; ↓/End/Home move; Enter and Space navigate", async () => {
  const onNavigate = vi.fn();
  const screen = await render(
    <>
      <Button>Before</Button>
      <TableOfContents
        items={ITEMS}
        activeId="breakers"
        onNavigate={onNavigate}
      />
    </>,
  );
  const tabStops = [
    ...document.querySelectorAll('[data-slot="table-of-contents-link"]'),
  ].filter((a) => a.getAttribute("tabindex") === "0");
  expect(tabStops).toEqual([link("breakers")]);

  screen.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(link("breakers"));
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(link("rcd"));
  await userEvent.keyboard("{Enter}");
  expect(onNavigate).toHaveBeenLastCalledWith("rcd");
  await userEvent.keyboard("{End}");
  expect(document.activeElement).toBe(link("sign-off"));
  await userEvent.keyboard(" ");
  expect(onNavigate).toHaveBeenLastCalledWith("sign-off");
  await userEvent.keyboard("{Home}");
  expect(document.activeElement).toBe(link("wiring"));
});

test("without onNavigate the heading is scrolled into view, smoothly", async () => {
  await render(
    <>
      <h2 id="breakers">Breakers</h2>
      <TableOfContents items={ITEMS} />
    </>,
  );
  const heading = document.getElementById("breakers")!;
  const scrollIntoView = vi
    .spyOn(heading, "scrollIntoView")
    .mockImplementation(() => {});
  link("breakers").click();
  expect(scrollIntoView).toHaveBeenCalledWith({
    block: "start",
    behavior: "smooth",
  });
});

const SECTIONS = [
  { id: "s-intro", text: "Intro", body: 400 },
  { id: "s-wiring", text: "Wiring", body: 400 },
  { id: "s-end", text: "End", body: 60 },
];

function SpyFixture({
  onActiveIdChange,
  items = SECTIONS.map(({ id, text }) => ({ id, level: 2, text })),
  explicit = true,
}: {
  onActiveIdChange?: (id: string | null) => void;
  items?: TableOfContentsItem[];
  /** Pass the scroller as `scrollContainer`; `false` leaves the spy to find it. */
  explicit?: boolean;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  return (
    <div style={{ display: "flex" }}>
      <TableOfContents
        items={items}
        scrollContainer={explicit ? scroller : undefined}
        onActiveIdChange={onActiveIdChange}
        sticky={false}
      />
      <div
        ref={scroller}
        data-testid="scroller"
        style={{ height: 300, overflowY: "auto", flex: 1 }}
      >
        {SECTIONS.map((section) => (
          <section key={section.id}>
            <h2 id={section.id} style={{ margin: 0, height: 20 }}>
              {section.text}
            </h2>
            <div style={{ height: section.body }} />
          </section>
        ))}
      </div>
    </div>
  );
}

const active = () =>
  document.querySelector('[aria-current="location"]')?.textContent ?? null;

test("the spy marks the last heading above the activation line, and the last heading at the bottom", async () => {
  const onActiveIdChange = vi.fn();
  const screen = await render(
    <SpyFixture onActiveIdChange={onActiveIdChange} />,
  );
  const scroller = screen.getByTestId("scroller").element() as HTMLElement;
  await expect.poll(active).toBe("Intro");

  // The line sits min(180, 28% × 300 = 84) px below the scroller's top.
  const wiring = document.getElementById("s-wiring")!;
  const offsetOf = (el: HTMLElement) =>
    el.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop;
  scroller.scrollTop = offsetOf(wiring) - 100; // 100px below the top: not reached yet
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await expect.poll(active).toBe("Intro");
  scroller.scrollTop = offsetOf(wiring) - 40; // 40px below the top: past the line
  await expect.poll(active).toBe("Wiring");

  // "End" never reaches the line (its section is short), but the bottom forces it.
  scroller.scrollTop = scroller.scrollHeight;
  await expect.poll(active).toBe("End");
  expect(
    document.getElementById("s-end")!.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top,
  ).toBeGreaterThan(84);
  expect(onActiveIdChange).toHaveBeenLastCalledWith("s-end");
});

test("without scrollContainer the spy finds the headings' own scroller", async () => {
  const screen = await render(<SpyFixture explicit={false} />);
  await expect.poll(active).toBe("Intro");
  const scroller = screen.getByTestId("scroller").element() as HTMLElement;
  scroller.scrollTop = scroller.scrollHeight;
  await expect.poll(active).toBe("End");
});

test("the spy recomputes when the items change", async () => {
  const screen = await render(
    <SpyFixture items={[{ id: "s-wiring", level: 2, text: "Wiring" }]} />,
  );
  await expect.poll(active).toBe("Wiring");
  await screen.rerender(
    <SpyFixture
      items={[
        { id: "s-intro", level: 2, text: "Intro" },
        { id: "s-wiring", level: 2, text: "Wiring" },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Intro" }))
    .toBeInTheDocument();
  await expect.poll(active).toBe("Intro");
});

function HookProbe({ ids }: { ids: string[] }) {
  const id = useActiveHeading(ids);
  return <output>{id ?? "none"}</output>;
}

test("useActiveHeading reports null when no heading is in the DOM", async () => {
  const screen = await render(<HookProbe ids={["missing"]} />);
  await expect.element(screen.getByText("none")).toBeInTheDocument();
});

test("rail: collapsed ticks open into the labelled list on keyboard focus and close on Escape", async () => {
  const screen = await render(
    <>
      <Button>Before</Button>
      <TableOfContents items={ITEMS} variant="rail" activeId="rcd" />
    </>,
  );
  const nav = screen.getByRole("navigation", { name: "On this page" });
  await expect.element(nav).toHaveAttribute("data-variant", "rail");
  expect(root().hasAttribute("data-expanded")).toBe(false);
  expect(
    document.querySelectorAll('[data-slot="table-of-contents-tick"]').length,
  ).toBe(4);
  await expectNoA11yViolations(document.body, NO_CONTRAST);

  screen.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(link("rcd"));
  await vi.waitFor(() =>
    expect(root().hasAttribute("data-expanded")).toBe(true),
  );
  await expectNoA11yViolations(document.body, NO_CONTRAST);

  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(root().hasAttribute("data-expanded")).toBe(false),
  );
});

test("rail: a pointer resting on it opens it, and choosing an item closes it", async () => {
  const onNavigate = vi.fn();
  await render(
    <TableOfContents items={ITEMS} variant="rail" onNavigate={onNavigate} />,
  );
  const panel = document.querySelector<HTMLElement>(
    '[data-slot="table-of-contents-panel"]',
  )!;
  await userEvent.hover(panel);
  await vi.waitFor(() =>
    expect(root().hasAttribute("data-expanded")).toBe(true),
  );
  link("breakers").click();
  expect(onNavigate).toHaveBeenCalledWith("breakers");
  await vi.waitFor(() =>
    expect(root().hasAttribute("data-expanded")).toBe(false),
  );
});

test("trigger: opens a left sheet titled with the label; choosing an item closes it, then navigates", async () => {
  const onNavigate = vi.fn();
  const screen = await render(
    <TableOfContents
      items={ITEMS}
      activeId="breakers"
      onNavigate={onNavigate}
      trigger={<Button variant="outline">Outline</Button>}
    />,
  );
  expect(document.querySelector('[data-slot="table-of-contents"]')).toBeNull();
  await screen.getByRole("button", { name: "Outline" }).click();
  const dialog = screen.getByRole("dialog", { name: "On this page" });
  await expect.element(dialog).toBeVisible();
  expect(
    document
      .querySelector('[data-slot="sheet-content"]')
      ?.getAttribute("data-side"),
  ).toBe("left");
  await expect
    .element(
      dialog
        .getByRole("navigation", { name: "On this page" })
        .getByRole("link", { name: "Breakers" }),
    )
    .toHaveAttribute("aria-current", "location");
  await expectNoA11yViolations(document.body, NO_CONTRAST);

  link("sign-off").click();
  await vi.waitFor(() => expect(onNavigate).toHaveBeenCalledWith("sign-off"));
  await vi.waitFor(() =>
    expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull(),
  );
});

test("the ref reaches the nav", async () => {
  const ref = React.createRef<HTMLElement>();
  await render(<TableOfContents items={ITEMS} ref={ref} />);
  expect(ref.current).toBe(root());
});

test("sticky: the top offset defaults to zero and a className spelling of it wins", async () => {
  await render(
    <TableOfContents
      items={ITEMS}
      variant="rail"
      className="[--table-of-contents-top:--spacing(6)]"
    />,
  );
  expect(root().className).toContain("[--table-of-contents-top:--spacing(6)]");
  expect(root().className).not.toContain(
    "[--table-of-contents-top:--spacing(0)]",
  );
  expect(root().className).toContain("sticky");
});
