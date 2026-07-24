import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TooltipProvider } from "./tooltip";
import { IconText, TableCellText, TruncatedText } from "./truncated-text";

// TruncatedText wraps its content in a Tooltip when the text overflows, and
// Base UI's Tooltip reads its shared delay from a Provider. Even though the
// tooltip only mounts on overflow, we wrap every subject in TooltipProvider so
// the component is exercised exactly as it ships (and a future overflow case
// would not crash for want of a provider).
function Subject(props: React.ComponentProps<typeof TruncatedText>) {
  return (
    <TooltipProvider>
      <TruncatedText {...props} />
    </TooltipProvider>
  );
}

test("renders the text", async () => {
  const screen = await render(<Subject>Hello world</Subject>);
  await expect.element(screen.getByText("Hello world")).toBeInTheDocument();
});

test("defaults to single-line truncate with data-slot + data-lines", async () => {
  const screen = await render(<Subject>Single line</Subject>);
  const el = screen.getByText("Single line");
  await expect.element(el).toHaveAttribute("data-slot", "truncated-text");
  await expect.element(el).toHaveAttribute("data-lines", "1");
  await expect.element(el).toHaveClass("truncate");
  await expect.element(el).toHaveClass("min-h-(--size-xs)");
});

test("applies line-clamp-N for multi-line", async () => {
  const screen = await render(<Subject lines={2}>Two line clamp</Subject>);
  const el = screen.getByText("Two line clamp");
  await expect.element(el).toHaveAttribute("data-lines", "2");
  await expect.element(el).toHaveClass("line-clamp-2");
});

test("renders the chosen element via `as`", async () => {
  const screen = await render(<Subject as="p">Paragraph text</Subject>);
  const el = screen.getByText("Paragraph text");
  await expect.element(el).toBeInTheDocument();
  expect(el.element().tagName).toBe("P");
});

test("no a11y violations", async () => {
  const screen = await render(<Subject>Accessible text</Subject>);
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the rendered element (merged with overflow measurement)", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(<Subject ref={ref}>Hello world</Subject>);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("truncated-text");
});

// --- IconText variant ---------------------------------------------------------

test("IconText renders icon, label, and trailing slot in one row", async () => {
  const screen = await render(
    <TooltipProvider>
      <IconText
        icon={<span data-testid="icon">★</span>}
        text="Project Alpha"
        trailing={<span data-testid="trailing">12</span>}
      />
    </TooltipProvider>,
  );
  await expect.element(screen.getByText("Project Alpha")).toBeInTheDocument();
  await expect.element(screen.getByTestId("icon")).toBeInTheDocument();
  await expect.element(screen.getByTestId("trailing")).toBeInTheDocument();
  const label = screen.getByText("Project Alpha");
  await expect.element(label).toHaveAttribute("data-slot", "icon-text-label");
  await expect.element(label).toHaveClass("truncate");
});

test("IconText forwards ref to the row container", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <TooltipProvider>
      <IconText ref={ref} icon={<span>★</span>} text="Row label" />
    </TooltipProvider>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("icon-text");
});

test("IconText: no a11y violations (decorative icon is hidden)", async () => {
  const screen = await render(
    <TooltipProvider>
      <IconText
        icon={<span>★</span>}
        text="Accessible row"
        trailing={<span>3</span>}
      />
    </TooltipProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

// --- TableCellText variant ----------------------------------------------------

test("TableCellText renders text with its data-slot", async () => {
  const screen = await render(
    <TooltipProvider>
      <TableCellText text="acme-workspace" />
    </TooltipProvider>,
  );
  const el = screen.getByText("acme-workspace");
  await expect.element(el).toHaveAttribute("data-slot", "table-cell-text");
  await expect.element(el).toHaveClass("truncate");
});

test("TableCellText mono applies the monospace utilities", async () => {
  const screen = await render(
    <TooltipProvider>
      <TableCellText text="ws_01HXYZ" mono />
    </TooltipProvider>,
  );
  const el = screen.getByText("ws_01HXYZ");
  await expect.element(el).toHaveClass("font-mono");
  await expect.element(el).toHaveClass("text-sm");
});

test("TableCellText clamps to multiple lines when requested", async () => {
  const screen = await render(
    <TooltipProvider>
      <TableCellText text="A long table cell description" lines={2} />
    </TooltipProvider>,
  );
  const el = screen.getByText("A long table cell description");
  await expect.element(el).toHaveAttribute("data-lines", "2");
  await expect.element(el).toHaveClass("line-clamp-2");
});

test("TableCellText: no a11y violations", async () => {
  const screen = await render(
    <TooltipProvider>
      <TableCellText text="Accessible cell" />
    </TooltipProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

// Test files import no CSS (see vitest.config.ts), so the `truncate` utility is inert here.
// These overflow tests recreate its effect (nowrap + hidden + constrained width) with real
// inline CSS so `useOverflow`'s scrollWidth/clientWidth measurement genuinely engages.
const SINGLE_LINE_BOX: React.CSSProperties = {
  display: "block",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

const CLIP: React.CSSProperties = {
  ...SINGLE_LINE_BOX,
  width: "48px",
};

const ROOMY: React.CSSProperties = {
  ...SINGLE_LINE_BOX,
  width: "200px",
};

test("overflowing text is keyboard-focusable so the tooltip is reachable (tabIndex 0)", async () => {
  const long =
    "A very long piece of text that will certainly overflow its tiny container";
  const screen = await render(<Subject style={CLIP}>{long}</Subject>);
  const el = screen.getByText(long);
  // Overflow measurement is async (ResizeObserver) — poll until the trigger upgrade lands (register P0-04).
  await expect.element(el).toHaveAttribute("tabindex", "0");
});

test("no a11y violations (tooltip open on overflow)", async () => {
  const long =
    "A very long piece of text that will certainly overflow its tiny container";
  const screen = await render(<Subject style={CLIP}>{long}</Subject>);
  const el = screen.getByText(long);
  // Overflow measurement is async (ResizeObserver) — poll until the trigger upgrade lands.
  await expect.element(el).toHaveAttribute("tabindex", "0");
  await userEvent.hover(el);
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
  // axe the portaled popup, which lands outside the test container.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});

test("non-overflowing text is NOT focusable (no phantom tab stop)", async () => {
  const screen = await render(<Subject style={ROOMY}>ok</Subject>);
  const el = screen.getByText("ok");
  await expect.element(el).not.toHaveAttribute("tabindex");
});

test("overflowing IconText row is keyboard-focusable (tabIndex 0)", async () => {
  const long =
    "An extremely long label that will overflow the constrained row width";
  const screen = await render(
    <TooltipProvider>
      {/* The measured node is the internal label span — style it via a real stylesheet. */}
      <style>{`[data-slot="icon-text-label"] { display: block; overflow: hidden; white-space: nowrap; max-width: 48px; }`}</style>
      <IconText icon={<span>•</span>} text={long} />
    </TooltipProvider>,
  );
  // Re-query inside the poll: the trigger upgrade remounts the row, so a captured
  // node reference would go stale and never receive the attribute.
  await expect
    .poll(() =>
      screen.container
        .querySelector('[data-slot="icon-text"]')
        ?.getAttribute("tabindex"),
    )
    .toBe("0");
});

// --- Touch tap-to-toggle disclosure (audit fix #6: Base UI Tooltip is hover/focus-only, so
// touch devices need a tap-driven fallback) -----------------------------------------------

/**
 * Mock `window.matchMedia` so `(hover: none)` matches — simulating a touch-only device
 * (no mouse/trackpad) for the duration of the callback. Mirrors the house pattern in
 * `message-scroller.test.tsx` (mock + spy, restored in `finally`).
 */
async function withNoHoverDevice(run: () => Promise<void>) {
  const matchMediaSpy = vi
    .spyOn(window, "matchMedia")
    .mockImplementation((query: string) => ({
      matches: query === "(hover: none)",
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
  try {
    await run();
  } finally {
    matchMediaSpy.mockRestore();
  }
}

test("on a no-hover device, overflowing text becomes a tap-to-toggle disclosure (aria-expanded)", async () => {
  await withNoHoverDevice(async () => {
    const long =
      "A very long piece of text that will certainly overflow its tiny container";
    const screen = await render(<Subject style={CLIP}>{long}</Subject>);
    const el = screen.getByText(long);

    // Truncated + no-hover device → the element becomes an ARIA disclosure.
    await expect.element(el).toHaveAttribute("tabindex", "0");
    await expect.element(el).toHaveAttribute("role", "button");
    await expect.element(el).toHaveAttribute("aria-expanded", "false");
    await expect.element(el).toHaveClass("truncate");

    // Tap (click) expands: full text wraps in place instead of clamping.
    await el.click();
    await expect.element(el).toHaveAttribute("aria-expanded", "true");
    await expect.element(el).not.toHaveClass("truncate");
    await expect.element(el).toHaveClass("whitespace-normal");

    // Second tap re-clamps.
    await el.click();
    await expect.element(el).toHaveAttribute("aria-expanded", "false");
    await expect.element(el).toHaveClass("truncate");
  });
});

test("on a no-hover device, Escape re-clamps an expanded disclosure", async () => {
  await withNoHoverDevice(async () => {
    const long =
      "A very long piece of text that will certainly overflow its tiny container";
    const screen = await render(<Subject style={CLIP}>{long}</Subject>);
    const el = screen.getByText(long);
    await expect.element(el).toHaveAttribute("role", "button");

    await el.click();
    await expect.element(el).toHaveAttribute("aria-expanded", "true");

    await el.element().focus();
    await userEvent.keyboard("{Escape}");
    await expect.element(el).toHaveAttribute("aria-expanded", "false");
  });
});

test("on a no-hover device, blur re-clamps an expanded disclosure", async () => {
  await withNoHoverDevice(async () => {
    const long =
      "A very long piece of text that will certainly overflow its tiny container";
    const screen = await render(
      <>
        <Subject style={CLIP}>{long}</Subject>
        <button type="button">elsewhere</button>
      </>,
    );
    const el = screen.getByText(long);
    await expect.element(el).toHaveAttribute("role", "button");

    await el.click();
    await expect.element(el).toHaveAttribute("aria-expanded", "true");

    await screen.getByText("elsewhere").click();
    await expect.element(el).toHaveAttribute("aria-expanded", "false");
  });
});

test("on a hover-capable device, overflowing text keeps the Tooltip-only behavior (no touch disclosure attributes)", async () => {
  // Default environment (no matchMedia mock) resolves `(hover: none)` to false in the real
  // browser this suite runs in (Playwright desktop Chromium), so no mock is needed here.
  const long =
    "A very long piece of text that will certainly overflow its tiny container";
  const screen = await render(<Subject style={CLIP}>{long}</Subject>);
  const el = screen.getByText(long);
  await expect.element(el).toHaveAttribute("tabindex", "0");
  await expect.element(el).not.toHaveAttribute("role");
  await expect.element(el).not.toHaveAttribute("aria-expanded");
});

test("on a no-hover device, overflowing IconText row becomes a tap-to-toggle disclosure", async () => {
  await withNoHoverDevice(async () => {
    const long =
      "An extremely long label that will overflow the constrained row width";
    const screen = await render(
      <TooltipProvider>
        <style>{`[data-slot="icon-text-label"] { display: block; overflow: hidden; white-space: nowrap; max-width: 48px; }`}</style>
        <IconText icon={<span>•</span>} text={long} />
      </TooltipProvider>,
    );
    const row = () =>
      screen.container.querySelector('[data-slot="icon-text"]')!;
    await expect.poll(() => row().getAttribute("role")).toBe("button");
    await expect.poll(() => row().getAttribute("aria-expanded")).toBe("false");

    row().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await expect.poll(() => row().getAttribute("aria-expanded")).toBe("true");
    const label = () =>
      screen.container.querySelector('[data-slot="icon-text-label"]')!;
    await expect.poll(() => label().className).not.toContain("truncate");
  });
});
