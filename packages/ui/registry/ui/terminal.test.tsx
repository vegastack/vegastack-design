import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Terminal } from "./terminal";

let writeText: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  writeText = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("renders string lines as commands prefixed with the prompt glyph", async () => {
  const screen = await render(<Terminal lines={["pnpm install"]} />);
  const promptEls = screen.container.querySelectorAll(
    '[data-slot="terminal-prompt"]',
  );
  expect(promptEls.length).toBe(1);
  expect(promptEls[0]?.textContent).toBe("$");
  expect(promptEls[0]?.getAttribute("aria-hidden")).toBe("true");
  await expect.element(screen.getByText("pnpm install")).toBeInTheDocument();
});

test("body scrolls horizontally with a scroll-fade edge affordance (clipped commands read as scrollable)", async () => {
  const screen = await render(
    <Terminal lines={["pnpm run build --filter @vegastack/ui"]} />,
  );
  const body = screen.container.querySelector(
    '[data-slot="terminal-body"]',
  ) as HTMLElement;
  expect(body.classList.contains("overflow-x-auto")).toBe(true);
  expect(body.classList.contains("scroll-fade-x")).toBe(true);
  expect(body.tabIndex).toBe(0);
  // The focus affordance must be an INSET outline, not a border tint and not an outward outline.
  // A border tint is erased by `forced-colors: active` (which replaces border-color outright), and
  // an outward outline is clipped twice — by the terminal root's `overflow-hidden` and by
  // `scroll-fade-x`'s mask, which limits painting to this element's own border box. Both mistakes
  // shipped here once and left the pane with no visible focus indicator at all in the forced
  // palette; see docs/ledger/bugs.md, 2026-07-25.
  expect(body.classList.contains("focus-visible:-outline-offset-2")).toBe(true);
  expect(body.className).not.toMatch(/focus-visible:(outline-none|border-)/);
});

test("a custom prompt glyph replaces the default", async () => {
  const screen = await render(<Terminal lines={["pnpm install"]} prompt=">" />);
  expect(
    screen.container.querySelector('[data-slot="terminal-prompt"]')
      ?.textContent,
  ).toBe(">");
});

test("output lines render without a prompt glyph", async () => {
  const screen = await render(<Terminal lines={[{ output: "✓ Done" }]} />);
  expect(
    screen.container.querySelector('[data-slot="terminal-prompt"]'),
  ).toBeNull();
  await expect.element(screen.getByText("✓ Done")).toBeInTheDocument();
});

test('the header title defaults to "Terminal" and is overridable', async () => {
  const screen = await render(<Terminal lines={["x"]} />);
  await expect.element(screen.getByText("Terminal")).toBeInTheDocument();

  const screen2 = await render(<Terminal lines={["x"]} title="Install" />);
  await expect.element(screen2.getByText("Install")).toBeInTheDocument();
});

test("the trailing icon CopyButton copies only the command lines, joined by newline", async () => {
  const screen = await render(
    <Terminal lines={["first", { output: "ignored" }, "second"]} />,
  );
  const copyButton = screen.getByRole("button", { name: "Copy command" });
  await expect.element(copyButton).toHaveAttribute("data-size", "icon-sm");
  expect(copyButton.element().className).toContain("text-foreground");
  expect(
    screen.container.querySelector('[data-slot="copy-button-label"]'),
  ).toBeNull();
  expect(
    screen.container
      .querySelector('[data-slot="terminal-copy"]')
      ?.contains(copyButton.element()),
  ).toBe(true);
  expect(
    screen.container
      .querySelector('[data-slot="terminal-header"]')
      ?.contains(copyButton.element()),
  ).toBe(false);

  await copyButton.click();
  expect(writeText).toHaveBeenCalledWith("first\nsecond");
  const copiedButton = screen.getByRole("button", { name: "Copied command" });
  await expect
    .element(copiedButton)
    .toHaveAttribute("aria-label", "Copied command");
  expect(copiedButton.element().className).toContain(
    "data-[copied]:text-primary",
  );
  expect(copiedButton.element().className).not.toContain("text-success-text");
});

test("copyValue overrides the default joined command text", async () => {
  const screen = await render(
    <Terminal lines={["first"]} copyValue="explicit" />,
  );
  await screen.getByRole("button", { name: "Copy command" }).click();
  expect(writeText).toHaveBeenCalledWith("explicit");
});

test("is scoped to the marketing dark ground", async () => {
  const screen = await render(
    <Terminal lines={["x"]} data-testid="terminal" />,
  );
  const el = screen.getByTestId("terminal").element() as HTMLElement;
  expect(el.classList.contains("vs-marketing")).toBe(true);
});

test("no a11y violations", async () => {
  const screen = await render(
    <Terminal
      title="Install"
      lines={[
        "pnpm dlx shadcn add @vegastack/button",
        { output: "✓ Installed" },
      ]}
    />,
  );
  await expectNoA11yViolations(screen.container);
});
