import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Terminal } from "./terminal";
import { TerminalBody } from "./terminal-body";

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
  // The tab stop itself is measured, not assumed — see the two `TerminalBody` tests at the foot of
  // this file. The harness compiles no Tailwind, so nothing here can actually overflow.
  // The focus affordance must be an INSET outline, not a border tint and not an outward outline.
  // A border tint is erased by `forced-colors: active` (which replaces border-color outright), and
  // an outward outline is clipped twice — by the terminal root's `overflow-hidden` and by
  // `scroll-fade-x`'s mask, which limits painting to this element's own border box. Both mistakes
  // shipped here once and left the pane with no visible focus indicator at all in the forced
  // palette; see docs/ledger/bugs.md, 2026-07-25.
  expect(body.classList.contains("focus-visible:-outline-offset-2")).toBe(true);
  expect(body.className).not.toMatch(/focus-visible:(outline-none|border-)/);
});

test("the command pane is a named group, labelled by the visible title", async () => {
  const screen = await render(
    <Terminal title="Install" lines={["pnpm install"]} />,
  );
  // Queried BY ROLE AND NAME on purpose: that is the pair a screen reader announces, and it is what
  // a plain `<div tabindex="0">` cannot provide — it maps to `generic`, which prohibits naming, so
  // an `aria-label` there is not reliably exposed and the pane reads as an unnamed focus stop.
  await expect
    .element(screen.getByRole("group", { name: "Install" }))
    .toBeInTheDocument();
  const body = screen.container.querySelector(
    '[data-slot="terminal-body"]',
  ) as HTMLElement;
  expect(body.getAttribute("role")).toBe("group");
  // Not a landmark: several install snippets on one page must not flood the rotor.
  expect(body.getAttribute("role")).not.toBe("region");
  // The name must resolve to the rendered header, not be a duplicated string.
  const labelledBy = body.getAttribute("aria-labelledby");
  expect(labelledBy).toBeTruthy();
  expect(screen.container.querySelector(`#${CSS.escape(labelledBy!)}`)).toBe(
    screen.container.querySelector('[data-slot="terminal-header"] span'),
  );
});

test("an explicit aria-label overrides the title-derived name and suppresses aria-labelledby", async () => {
  const screen = await render(
    <Terminal
      title="Install"
      aria-label="Install commands for the button component"
      lines={["pnpm install"]}
    />,
  );
  const body = screen.container.querySelector(
    '[data-slot="terminal-body"]',
  ) as HTMLElement;
  // Both would be a silent bug: aria-labelledby wins in the AT, so the caller's label would be
  // ignored while appearing to have been applied.
  expect(body.getAttribute("aria-labelledby")).toBeNull();
  await expect
    .element(
      screen.getByRole("group", {
        name: "Install commands for the button component",
      }),
    )
    .toBeInTheDocument();
});

test("each instance names its own pane — generated ids are unique and valid IDREFs", async () => {
  const screen = await render(
    <>
      <Terminal title="One" lines={["a"]} />
      <Terminal title="Two" lines={["b"]} />
      <Terminal title="Three" lines={["c"]} />
    </>,
  );
  const ids = [
    ...screen.container.querySelectorAll('[data-slot="terminal-body"]'),
  ].map((element) => element.getAttribute("aria-labelledby")!);
  // `aria-labelledby` is a SPACE-SEPARATED id list, so a generated id containing whitespace would
  // silently resolve to nothing and the pane would go back to being unnamed.
  for (const id of ids) expect(id).not.toMatch(/\s/);
  expect(new Set(ids).size).toBe(3);
  // And each must resolve to ITS OWN title, not the first one on the page.
  expect(
    ids.map(
      (id) => screen.container.querySelector(`#${CSS.escape(id)}`)?.textContent,
    ),
  ).toEqual(["One", "Two", "Three"]);
});

test("an explicit aria-labelledby takes precedence over the visible title", async () => {
  const screen = await render(
    <>
      <span id="external-terminal-name">Deploy steps</span>
      <Terminal
        title="Install"
        aria-labelledby="external-terminal-name"
        lines={["pnpm install"]}
      />
    </>,
  );
  const body = screen.container.querySelector(
    '[data-slot="terminal-body"]',
  ) as HTMLElement;
  expect(body.getAttribute("aria-labelledby")).toBe("external-terminal-name");
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
  await expect.element(copyButton).toHaveAttribute("data-size", "sm");
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

// ── the pane is a tab stop only while it actually scrolls ──────────────────────────────────────
//
// `TerminalBody` is exercised directly here because the harness compiles no Tailwind: the pane's
// `overflow-x-auto` and its width both have to be real inline layout for `useOverflow` to measure
// anything. Driving it through `Terminal` would measure an unconstrained block that can never
// overflow, and the test would pass for the wrong reason.

test("a command pane that fits adds no tab stop, and keeps its name", async () => {
  const screen = await render(
    <TerminalBody
      label="Install commands"
      style={{ width: "400px", overflowX: "auto", whiteSpace: "nowrap" }}
    >
      <span>ls</span>
    </TerminalBody>,
  );
  const body = screen.container.querySelector(
    '[data-slot="terminal-body"]',
  ) as HTMLElement;
  await expect.element(screen.getByRole("group")).toBeInTheDocument();
  expect(body.hasAttribute("tabindex")).toBe(false);
  expect(body.hasAttribute("data-scrollable")).toBe(false);
  // The name survives whether or not the pane scrolls — a role that appeared and vanished under
  // the reader on resize would be worse than a stable named group.
  expect(body.getAttribute("aria-label")).toBe("Install commands");
});

test("a command pane that overflows becomes a named keyboard-reachable stop with an inset ring", async () => {
  const screen = await render(
    <TerminalBody
      label="Install commands"
      style={{ width: "120px", overflowX: "auto", whiteSpace: "nowrap" }}
    >
      <span>
        pnpm dlx shadcn@latest add @vegastack/button @vegastack/data-grid
      </span>
    </TerminalBody>,
  );
  const body = screen.container.querySelector(
    '[data-slot="terminal-body"]',
  ) as HTMLElement;
  await expect.poll(() => body.getAttribute("tabindex")).toBe("0");
  expect(body.hasAttribute("data-scrollable")).toBe(true);
  // The outline is pulled inside: the Terminal root is `overflow-hidden` and `scroll-fade-x` masks
  // this element to its own border box, so an outward ring is not painted at all.
  expect(body.className).toContain("focus-visible:-outline-offset-2");
});
