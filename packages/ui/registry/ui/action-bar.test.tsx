import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ActionBar } from "./action-bar";

function bar(): HTMLElement {
  return document.querySelector('[data-slot="action-bar"]') as HTMLElement;
}

test("renders a labelled group with status and actions", async () => {
  const screen = await render(
    <ActionBar status="5 selected" aria-label="Bulk actions">
      <button type="button">Tag</button>
      <button type="button">Archive</button>
    </ActionBar>,
  );
  const group = screen.getByRole("group", { name: "Bulk actions" });
  await expect.element(group).toBeInTheDocument();
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
      <button type="button">Tag</button>
    </ActionBar>,
  );
  expect(bar().dataset.active).toBe("false");
  // Hidden = inert: nothing invisible may stay focusable or activatable.
  expect(bar().hasAttribute("inert")).toBe(true);
  expect(bar().className).toContain("data-[active=false]:pointer-events-none");
  await screen.rerender(
    <ActionBar open status="1 selected">
      <button type="button">Tag</button>
    </ActionBar>,
  );
  expect(bar().dataset.active).toBe("true");
  expect(bar().hasAttribute("inert")).toBe(false);
});

test("the enter/exit recipe carries paired duration + ease in the same literal (transition-pairing)", async () => {
  await render(
    <ActionBar status="s">
      <button type="button">A</button>
    </ActionBar>,
  );
  const cls = bar().className;
  expect(cls).toContain("transition-[translate,scale,opacity]");
  expect(cls).toContain("duration-base");
  expect(cls).toContain("data-[active=false]:ease-exit");
  expect(cls).toContain("data-[active=true]:ease-emphasized");
  // Raised band, never overlay — a dialog must cover the bar.
  expect(cls).toContain("z-(--z-raised)");
});

test("a string status is announced through the polite live region", async () => {
  await render(
    <ActionBar status="5 selected">
      <button type="button">Tag</button>
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
      <button type="button">Cancel</button>
    </ActionBar>,
  );
  const region = bar().querySelector('[role="status"]') as HTMLElement;
  expect(region.textContent).toBe("Importing 340 of 1,000…");
});

test("pending inerts the actions but keeps the status readable", async () => {
  await render(
    <ActionBar status="Importing…" pending>
      <button type="button">Cancel</button>
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
          <button type="button">A</button>
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
      <button type="button">A</button>
    </ActionBar>,
  );
  expect(bar().className).toContain("mx-auto");
  expect(bar().className).not.toContain("left-1/2");
});

test("ref forwards to the toolbar root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <ActionBar ref={ref} status="s">
      <button type="button">A</button>
    </ActionBar>,
  );
  expect(ref.current?.dataset.slot).toBe("action-bar");
});

test("focus: action buttons are reachable and the bar strips no outlines", async () => {
  const screen = await render(
    <ActionBar status="2 selected">
      <button type="button">Tag</button>
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
        <button type="button">Tag</button>
      </ActionBar>
      <ActionBar status="Importing…" pending aria-label="Import progress">
        <button type="button">Cancel</button>
      </ActionBar>
      <ActionBar open={false} status="0 selected" aria-label="Hidden bar">
        <button type="button">Tag</button>
      </ActionBar>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
