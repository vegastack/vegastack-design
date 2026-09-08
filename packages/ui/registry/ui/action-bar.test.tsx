import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ActionBar, ActionBarButton, ActionBarSeparator } from "./action-bar";

function bar(): HTMLElement {
  return document.querySelector('[data-slot="action-bar"]') as HTMLElement;
}

test("renders a labelled toolbar with status and actions", async () => {
  const screen = await render(
    <ActionBar status="5 selected" aria-label="Bulk actions">
      <ActionBarButton>Tag</ActionBarButton>
      <ActionBarButton>Archive</ActionBarButton>
    </ActionBar>,
  );
  const toolbar = screen.getByRole("toolbar", { name: "Bulk actions" });
  await expect.element(toolbar).toBeInTheDocument();
  // Visible status (the sr-only live region duplicates the text).
  expect(
    document.querySelector('[data-slot="action-bar-status"]')?.textContent,
  ).toBe("5 selected");
  await expect
    .element(screen.getByRole("button", { name: "Tag" }))
    .toBeInTheDocument();
});

test("open drives data-active; the bar stays mounted while hidden", async () => {
  const screen = await render(
    <ActionBar open={false} status="0 selected">
      <ActionBarButton>Tag</ActionBarButton>
    </ActionBar>,
  );
  expect(bar().dataset.active).toBe("false");
  // Hidden = inert: nothing invisible may stay focusable or activatable.
  expect(bar().hasAttribute("inert")).toBe(true);
  // `motion-dock-out` carries the pointer-events guard; the class is the promise.
  expect(bar().className).toContain("data-[active=false]:motion-dock-out");
  await screen.rerender(
    <ActionBar open status="1 selected">
      <ActionBarButton>Tag</ActionBarButton>
    </ActionBar>,
  );
  expect(bar().dataset.active).toBe("true");
  expect(bar().hasAttribute("inert")).toBe(false);
});

test("the dock recipe is the shared motion pair, and the exit is not slower than the enter", async () => {
  await render(
    <ActionBar status="s">
      <ActionBarButton>A</ActionBarButton>
    </ActionBar>,
  );
  const cls = bar().className;
  expect(cls).toContain("data-[active=true]:motion-dock-in");
  expect(cls).toContain("data-[active=false]:motion-dock-out");
  // The retired recipe: a slower exit, and a scale on a bar that slides off its own edge.
  expect(cls).not.toContain("scale-95");
  expect(cls).not.toContain("duration-slow");
  // Raised band, never overlay — a dialog must cover the bar.
  expect(cls).toContain("z-(--z-raised)");

  // Deliberately class-level, not `getComputedStyle`: this harness compiles NO Tailwind CSS
  // (only `test/contrast.css` is built — see the component skill's testing reference), so a
  // resolved-style assertion here would read browser defaults and say nothing. What IS worth
  // gating is that the bar reaches for the SHARED pair instead of restating a recipe; the 150/100
  // values themselves have exactly one definition, in `design-tokens/src/utilities.css`, and the
  // docs contract lane is where they are rendered for real.
});

test("toolbar keyboard: one tab stop in, arrows move between actions, Shift+Tab leaves", async () => {
  const screen = await render(
    <div>
      <button type="button">before</button>
      <ActionBar status="3 selected" aria-label="Bulk actions">
        <ActionBarButton>Tag</ActionBarButton>
        <ActionBarSeparator />
        <ActionBarButton>Archive</ActionBarButton>
      </ActionBar>
      <button type="button">after</button>
    </div>,
  );
  const before = screen.getByRole("button", { name: "before" }).element();
  const tag = screen.getByRole("button", { name: "Tag" }).element();
  const archive = screen.getByRole("button", { name: "Archive" }).element();

  // ONE tab stop: exactly one action is tabbable, the rest are roving.
  expect(tag.getAttribute("tabindex")).toBe("0");
  expect(archive.getAttribute("tabindex")).toBe("-1");

  (before as HTMLElement).focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(tag);

  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(archive);
  await userEvent.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(tag);

  // Shift+Tab leaves the whole bar rather than stepping back through its actions.
  await userEvent.tab({ shift: true });
  expect(document.activeElement).toBe(before);
});

test("a string status is announced through the polite live region", async () => {
  await render(
    <ActionBar status="5 selected">
      <ActionBarButton>Tag</ActionBarButton>
    </ActionBar>,
  );
  const region = bar().querySelector('[role="status"]') as HTMLElement;
  expect(region.getAttribute("aria-live")).toBe("polite");
  expect(region.textContent).toBe("5 selected");
});

test("announcement overrides composite status for the live region", async () => {
  await render(
    <ActionBar
      status={<strong>340 / 1,000</strong>}
      announcement="Importing 340 of 1,000…"
    >
      <ActionBarButton>Cancel</ActionBarButton>
    </ActionBar>,
  );
  const region = bar().querySelector('[role="status"]') as HTMLElement;
  expect(region.textContent).toBe("Importing 340 of 1,000…");
});

test("pending inerts the actions but keeps the status readable", async () => {
  await render(
    <ActionBar status="Importing…" pending>
      <ActionBarButton>Cancel</ActionBarButton>
    </ActionBar>,
  );
  const actions = bar().querySelector(
    '[data-slot="action-bar-actions"]',
  ) as HTMLElement;
  expect(actions.getAttribute("aria-busy")).toBe("true");
  // Truly inert — a bulk operation in flight is not keyboard-retriggerable.
  expect(actions.hasAttribute("inert")).toBe(true);
  expect(bar().hasAttribute("data-pending")).toBe(true);
});

test("containerRef switches to measured centring via a unitless custom property", async () => {
  function Harness() {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    return (
      <div>
        <div ref={containerRef} data-testid="content" />
        <ActionBar status="s" containerRef={containerRef}>
          <ActionBarButton>A</ActionBarButton>
        </ActionBar>
      </div>
    );
  }
  await render(<Harness />);
  await expect
    .poll(() => bar().style.getPropertyValue("--action-bar-x"))
    .not.toBe("");
  // The value is a bare number — the class multiplies it by 1px, so the inline
  // style stays custom-properties-only.
  expect(bar().style.getPropertyValue("--action-bar-x")).toMatch(
    /^\d+(\.\d+)?$/,
  );
  expect(bar().className).toContain("calc(var(--action-bar-x)*1px)");
});

test("without containerRef the bar centres with auto margins, never left:50%", async () => {
  await render(
    <ActionBar status="s">
      <ActionBarButton>A</ActionBarButton>
    </ActionBar>,
  );
  expect(bar().className).toContain("mx-auto");
  expect(bar().className).not.toContain("left-1/2");
});

test("ref forwards to the toolbar root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <ActionBar ref={ref} status="s">
      <ActionBarButton>A</ActionBarButton>
    </ActionBar>,
  );
  expect(ref.current?.dataset.slot).toBe("action-bar");
});

test("focus: action buttons are reachable and the bar strips no outlines", async () => {
  const screen = await render(
    <ActionBar status="2 selected">
      <ActionBarButton>Tag</ActionBarButton>
    </ActionBar>,
  );
  const button = screen
    .getByRole("button", { name: "Tag" })
    .element() as HTMLElement;
  button.focus();
  expect(document.activeElement).toBe(button);
  expect(bar().className).not.toContain("outline-none");
});

test("no a11y violations — open, pending, hidden", async () => {
  const screen = await render(
    <div>
      <ActionBar status="5 selected">
        <ActionBarButton>Tag</ActionBarButton>
      </ActionBar>
      <ActionBar status="Importing…" pending aria-label="Import progress">
        <ActionBarButton>Cancel</ActionBarButton>
      </ActionBar>
      <ActionBar open={false} status="0 selected" aria-label="Hidden bar">
        <ActionBarButton>Tag</ActionBarButton>
      </ActionBar>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
