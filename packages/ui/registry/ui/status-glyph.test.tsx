import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { StatusGlyph, type ChatStatus } from "./status-glyph";

const glyph = (root: ParentNode) =>
  root.querySelector<SVGElement>('[data-slot="status-glyph"]')!;

test.each([
  ["done", "Done", "text-primary"],
  ["running", "Running", "text-primary"],
  ["pending", "Not started", "text-muted-foreground"],
  ["skipped", "Skipped", "text-muted-foreground"],
  ["failed", "Failed", "text-muted-foreground"],
  ["needs-you", "Needs you", "text-warning-text"],
] as const)(
  "%s is named %s and inked %s (COL-25)",
  async (status, name, ink) => {
    const screen = await render(<StatusGlyph status={status as ChatStatus} />);
    const svg = glyph(screen.container);
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe(name);
    expect(svg.getAttribute("data-status")).toBe(status);
    expect(svg.getAttribute("class")).toContain(ink);
    expect(svg.getAttribute("stroke-width")).toBe("1.5");
  },
);

test("COL-25: no state is ever green or a status fill", async () => {
  for (const status of [
    "pending",
    "running",
    "done",
    "skipped",
    "failed",
    "needs-you",
  ] as const) {
    const screen = await render(<StatusGlyph status={status} />);
    const classes = glyph(screen.container).getAttribute("class") ?? "";
    expect(classes).not.toMatch(/success|green|emerald|bg-/);
  }
});

test("size 14 is the meta size; 16 is the default row size", async () => {
  const row = await render(<StatusGlyph status="done" />);
  expect(glyph(row.container).getAttribute("class")).toContain("size-4");
  const meta = await render(<StatusGlyph status="done" size={14} />);
  expect(glyph(meta.container).getAttribute("class")).toContain("size-3.5");
});

test("label={null} makes it decorative; a custom label names it", async () => {
  const quiet = await render(<StatusGlyph status="failed" label={null} />);
  const hidden = glyph(quiet.container);
  expect(hidden.getAttribute("aria-hidden")).toBe("true");
  expect(hidden.getAttribute("role")).toBeNull();
  const named = await render(<StatusGlyph status="done" label="Uploaded" />);
  expect(glyph(named.container).getAttribute("aria-label")).toBe("Uploaded");
});

test("no a11y violations — every state", async () => {
  const screen = await render(
    <p>
      <StatusGlyph status="pending" />
      <StatusGlyph status="running" />
      <StatusGlyph status="done" />
      <StatusGlyph status="skipped" />
      <StatusGlyph status="failed" />
      <StatusGlyph status="needs-you" />
    </p>,
  );
  await expectNoA11yViolations(screen.container);
});
