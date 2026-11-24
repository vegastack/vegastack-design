import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { renderToStaticMarkup } from "react-dom/server";
import { useState } from "react";
import type { AccentId } from "@vegastack/design-tokens/accents";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { AccentScope, restoreAccent, setAccent, useAccent } from "./accent";
import { AccentPicker } from "./accent-picker";
import { AccentPreview } from "./accent-preview";
import { AccentScript } from "./accent-script";

const root = document.documentElement;
const token = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(name).trim();

beforeEach(() => setAccent(null));
afterEach(() => {
  setAccent(null);
  root.classList.remove("dark");
});

/** Runs the script's own source, as the browser would from the server's HTML. */
function runScript(skip?: string[]) {
  const html = renderToStaticMarkup(<AccentScript skip={skip} />);
  const source = new DOMParser().parseFromString(html, "text/html");
  new Function(source.querySelector("script")!.textContent!)();
}

test("setAccent marks the page and keeps the cookie; Black and unknown ids are no mark", () => {
  setAccent("violet");
  expect(root.dataset.accent).toBe("violet");
  expect(document.cookie).toContain("vs_accent=violet");
  setAccent("ultraviolet");
  expect(root.dataset.accent).toBeUndefined();
  expect(document.cookie).toContain("vs_accent=black");
  setAccent(null);
  expect(document.cookie).not.toContain("vs_accent");
});

test("a change has no transition and gives transitions back", async () => {
  const sheets = () => document.adoptedStyleSheets.length;
  await vi.waitFor(() => expect(sheets()).toBe(0));
  setAccent("teal");
  expect(sheets()).toBe(1);
  await vi.waitFor(() => expect(sheets()).toBe(0));
});

test("useAccent follows the page, and restoreAccent re-reads the cookie", async () => {
  function Shown() {
    return <output>{useAccent()}</output>;
  }
  const screen = await render(<Shown />);
  await expect.element(screen.getByText("black")).toBeVisible();
  setAccent("pink");
  await expect.element(screen.getByText("pink")).toBeVisible();
  // Another tab moved the cookie while this page was in the back/forward cache.
  document.cookie = "vs_accent=green;path=/";
  restoreAccent();
  await expect.element(screen.getByText("green")).toBeVisible();
});

test("a scope covers the person's accent while mounted and gives it back", async () => {
  setAccent("violet");
  const screen = await render(<AccentScope accent="orange">page</AccentScope>);
  expect(root.dataset.accent).toBe("orange");
  setAccent("pink");
  expect(root.dataset.accent).toBe("orange");
  await screen.rerender(<AccentScope accent="black">page</AccentScope>);
  expect(root.dataset.accent).toBeUndefined();
  await screen.unmount();
  expect(root.dataset.accent).toBe("pink");
});

test("the scope's script is in the server's HTML and carries only a known id", () => {
  expect(
    renderToStaticMarkup(<AccentScope accent="teal">x</AccentScope>),
  ).toContain('setAttribute("data-accent","teal")');
  const hostile = renderToStaticMarkup(
    <AccentScope accent={'"</script><b>'}>x</AccentScope>,
  );
  expect(hostile).toContain("removeAttribute");
  expect(hostile).not.toContain("<b>");
});

test("the before-paint script takes a known id, and nothing else or on a skipped path", () => {
  document.cookie = "vs_accent=blue;path=/";
  runScript();
  expect(root.dataset.accent).toBe("blue");
  root.removeAttribute("data-accent");
  runScript([location.pathname]);
  expect(root.dataset.accent).toBeUndefined();
  document.cookie = 'vs_accent="><script>;path=/';
  runScript();
  expect(root.dataset.accent).toBeUndefined();
});

test("a swatch wears the colour it offers, whatever the page's, in light and dark", async () => {
  setAccent("violet");
  const screen = await render(
    <AccentPicker
      aria-label="Accent"
      value="violet"
      onValueChange={() => {}}
    />,
  );
  for (const mode of ["light", "dark"]) {
    root.classList.toggle("dark", mode === "dark");
    const page = token(root, "--primary");
    const card = (id: string) =>
      screen.container.querySelector(`[data-accent="${id}"]`)!;
    expect(token(card("violet"), "--primary")).toBe(page);
    expect(token(card("pink"), "--primary")).not.toBe(page);
    // Black inside a coloured page is Black's own value, not the page's.
    expect(token(card("black"), "--primary")).toBe(
      mode === "dark" ? "oklch(0.922 0 0)" : "oklch(0.205 0 0)",
    );
    // A dark surface inside an accented page (the file viewer) keeps the page's accent.
    const scoped = document.createElement("div");
    scoped.className = "dark";
    document.body.append(scoped);
    expect(token(scoped, "--primary")).toBe("oklch(0.584 0.211 293.14)");
    // Its own accent, or one between it and the page, wins over the page's.
    scoped.dataset.accent = "black";
    expect(token(scoped, "--primary")).toBe("oklch(0.922 0 0)");
    delete scoped.dataset.accent;
    const between = document.createElement("div");
    between.dataset.accent = "blue";
    document.body.append(between);
    between.append(scoped);
    expect(token(scoped, "--primary")).toBe("oklch(0.567 0.2005 258.08)");
    between.remove();
    for (const name of ["--check", "--mark", "--ink"])
      expect(token(card("pink"), name)).toBe(token(card("black"), name));
  }
});

test("the picker is a radio group: named options, one check on its colour, arrow keys, the workspace's", async () => {
  const onValueChange = vi.fn();
  function Example() {
    const [value, setValue] = useState<AccentId | null>(null);
    return (
      <AccentPicker
        workspaceAccent="teal"
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          setValue(next);
        }}
      />
    );
  }
  const screen = await render(<Example />);
  await expect
    .element(screen.getByRole("radiogroup", { name: "Colour" }))
    .toBeVisible();
  const follow = screen.getByRole("radio", { name: "Workspace theme, Teal" });
  await expect.element(follow).toBeChecked();
  expect(screen.getByRole("radio").elements()).toHaveLength(8);
  await userEvent.click(
    screen.getByRole("radio", { name: "Violet", exact: true }),
  );
  expect(onValueChange).toHaveBeenLastCalledWith("violet");
  await userEvent.keyboard("{ArrowRight}");
  expect(onValueChange).toHaveBeenLastCalledWith("pink");
  const checks = [
    ...screen.container.querySelectorAll('[data-slot="accent-picker-check"]'),
  ].filter((check) => getComputedStyle(check).display !== "none");
  expect(checks).toHaveLength(1);
  expect(checks[0]!.closest("[data-accent]")).toHaveAttribute(
    "data-accent",
    "pink",
  );
  await userEvent.click(follow);
  expect(onValueChange).toHaveBeenLastCalledWith(null);
  await expectNoA11yViolations(screen.container);
});

test("options reflow with no row of one, equal heights, 44px targets and whole names", async () => {
  for (const workspaceAccent of [undefined, "black"] as const)
    for (const [width, columns] of [
      [240, 2],
      [290, 4],
      [340, 4],
      [900, workspaceAccent ? 8 : 7],
    ] as const) {
      const screen = await render(
        <div style={{ width }}>
          <AccentPicker
            workspaceAccent={workspaceAccent}
            value="blue"
            onValueChange={() => {}}
          />
        </div>,
      );
      const options = [
        ...screen.container.querySelectorAll<HTMLElement>(
          '[data-slot="accent-picker-option"]',
        ),
      ];
      const boxes = options.map((option) => option.getBoundingClientRect());
      const rows = new Map<number, number>();
      for (const box of boxes) {
        rows.set(box.top, (rows.get(box.top) ?? 0) + 1);
        expect(box.height).toBeCloseTo(boxes[0]!.height, 0);
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
      expect(Math.max(...rows.values())).toBe(columns);
      // A lone last option spans its row.
      const last = boxes.at(-1)!;
      if (rows.get(last.top) === 1) expect(last.width).toBeGreaterThan(200);
      for (const option of options)
        expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth);
      await screen.unmount();
    }
});

test("the preview is real components in its own colour, out of reach", async () => {
  const screen = await render(<AccentPreview accent="green" />);
  const preview = screen.container.querySelector<HTMLElement>(
    '[data-slot="accent-preview"]',
  )!;
  expect(preview.inert).toBe(true);
  expect(preview).toHaveAttribute("aria-hidden", "true");
  for (const slot of ["button", "checkbox", "switch", "radio-group-item"])
    expect(preview.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("disabled options do not change the choice", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <AccentPicker disabled value="blue" onValueChange={onValueChange} />,
  );
  await userEvent.click(screen.getByRole("radio", { name: "Pink" }), {
    force: true,
  });
  expect(onValueChange).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});
