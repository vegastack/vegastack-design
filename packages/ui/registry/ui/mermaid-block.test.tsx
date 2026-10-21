import { render } from "vitest-browser-react";
import { afterEach, expect, test, vi } from "vitest";
import mermaid from "mermaid";
import { expectNoA11yViolations } from "../../test/a11y";
import { MermaidBlock, renderMermaid } from "./mermaid-block";

afterEach(() => {
  vi.restoreAllMocks();
});

// Security invariant (plan 12 §9.3): every render pins strict security, SVG labels, the dagre
// layout and no error diagram — whatever the diagram's own directives say.
test("every render pins the security configuration", async () => {
  const initialize = vi.spyOn(mermaid, "initialize");
  const result = await renderMermaid(
    `%%{init: {"securityLevel": "loose", "flowchart": {"htmlLabels": true}}}%%
flowchart LR
  a[Start] --> b[End]
  click a href "javascript:alert(1)"`,
    { theme: "light" },
  );
  expect(initialize).toHaveBeenCalled();
  for (const [config] of initialize.mock.calls) {
    expect(config).toMatchObject({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      maxTextSize: 20000,
      maxEdges: 300,
      theme: "base",
      look: "classic",
      layout: "dagre",
      htmlLabels: false,
      flowchart: { htmlLabels: false, useMaxWidth: false },
      sequence: { useMaxWidth: false },
    });
  }
  expect("svg" in result).toBe(true);
  const svg = "svg" in result ? result.svg : "";
  // Strict: the diagram's `loose` directive is ignored, so no script URL and no HTML label.
  expect(svg).not.toMatch(/javascript:/i);
  expect(svg).not.toContain("<foreignObject");
});

test("a parse error resolves with its line, never throws", async () => {
  const result = await renderMermaid("flowchart LR\n  a --> b\n  c -->", {
    theme: "light",
  });
  expect("error" in result).toBe(true);
  if ("error" in result) {
    expect(result.error.line).toBe(3);
    expect(result.error.message.length).toBeGreaterThan(0);
  }
});

test("draws a figure named by accTitle and keeps the last diagram on an error", async () => {
  const good = "flowchart LR\n  accTitle: Release flow\n  draft --> live";
  const screen = await render(<MermaidBlock source={good} />);
  const figure = screen.getByRole("figure", { name: "Release flow" });
  await expect
    .poll(() => figure.element().getAttribute("data-state"), { timeout: 10000 })
    .toBe("ready");
  expect(figure.element().querySelector("svg")).not.toBeNull();
  await expectNoA11yViolations(screen.container);

  await screen.rerender(<MermaidBlock source={`${good}\n  live -->`} />);
  await expect
    .poll(() => figure.element().getAttribute("data-state"), { timeout: 10000 })
    .toBe("error");
  expect(figure.element().querySelector("svg")).not.toBeNull();
  expect(screen.getByRole("status").element().textContent).toMatch(
    /^This change can't be drawn — check line 4\. Showing the last diagram that worked\.$/,
  );
  // The parser's own words wait behind Details.
  expect(
    figure.element().querySelector("[data-slot=mermaid-block-detail] p")
      ?.textContent,
  ).toMatch(/\S/);
});

test("with no diagram that worked, it says so and shows the source", async () => {
  const screen = await render(
    <MermaidBlock source={"flowchart LR\n  a -->"} />,
  );
  const figure = screen.getByRole("figure", { name: "Diagram" });
  await expect
    .poll(() => figure.element().getAttribute("data-state"), { timeout: 10000 })
    .toBe("failed");
  expect(screen.getByRole("status").element().textContent).toMatch(
    /^Couldn't draw this diagram — check line 2\.$/,
  );
  const detail = figure
    .element()
    .querySelector<HTMLDetailsElement>("[data-slot=mermaid-block-detail]")!;
  expect(detail.open).toBe(false);
  expect(detail.querySelector("p")?.textContent).toMatch(/\S/);
  expect(
    figure.element().querySelector("[data-slot=mermaid-block-source]")
      ?.textContent,
  ).toBe("flowchart LR\n  a -->");
  await expectNoA11yViolations(screen.container);
});

test("draws measured labels while the page hides body's other children (print isolation)", async () => {
  const style = document.createElement("style");
  style.textContent = "body > * { display: none !important; }";
  document.head.append(style);
  try {
    const result = await renderMermaid(
      "flowchart LR\n  isolated[Isolated] -->|Edge label| other[Other]",
      { theme: "light" },
    );
    expect("svg" in result).toBe(true);
    const svg = "svg" in result ? result.svg : "";
    expect(svg).not.toMatch(/transform="[^"]*NaN/);
  } finally {
    style.remove();
  }
  // The measuring box never outlives its render.
  expect(
    document.querySelector("[data-slot=mermaid-block-measure]"),
  ).toBeNull();
});

test("a label that says NaN is a diagram like any other", async () => {
  const result = await renderMermaid(
    'flowchart LR\n  a["NaN x=\\"NaN\\""] --> b[Value]',
    {
      theme: "light",
    },
  );
  expect("svg" in result).toBe(true);
});

test("a drawn diagram carries its natural width and its legible floor for the fit", async () => {
  const source = "flowchart LR\n  a[Site survey] --> b[Design] --> c[Sign-off]";
  const screen = await render(<MermaidBlock source={source} />);
  const figure = () =>
    screen.container.querySelector("[data-slot=mermaid-block]")!;
  await expect
    .poll(() => figure().getAttribute("data-state"), { timeout: 10000 })
    .toBe("ready");
  const box = figure().querySelector<HTMLElement>(
    "[data-slot=mermaid-block-svg]",
  )!;
  const natural = Number(box.querySelector("svg")!.getAttribute("width"));
  expect(natural).toBeGreaterThan(0);
  expect(box.style.getPropertyValue("--mermaid-natural-width")).toBe(
    `${natural}px`,
  );
  expect(
    parseFloat(box.style.getPropertyValue("--mermaid-min-width")),
  ).toBeCloseTo(natural * 0.6, 3);
});

test("an older diagram's late light drawing never replaces the current one's print copy", async () => {
  // Idle work runs at once, so the first diagram's light drawing is in flight when it changes.
  vi.stubGlobal("requestIdleCallback", (run: () => void) => {
    run();
    return 0;
  });
  vi.stubGlobal("cancelIdleCallback", () => {});
  try {
    const older = "flowchart LR\n  olderstart --> olderend";
    const current = "flowchart LR\n  currentstart --> currentend";
    // The current diagram is drawn in both schemes already.
    await renderMermaid(current, { theme: "dark" });
    await renderMermaid(current, { theme: "light" });
    // The older diagram draws slowly, so its light copy is still on its way when it changes.
    const draw = mermaid.render.bind(mermaid);
    vi.spyOn(mermaid, "render").mockImplementation(async (...args) => {
      if (String(args[1]).includes("olderstart"))
        await new Promise((r) => setTimeout(r, 400));
      return draw(...args);
    });
    const screen = await render(<MermaidBlock theme="dark" source={older} />);
    const figure = screen.getByRole("figure", { name: "Diagram" });
    await expect
      .poll(() => figure.element().getAttribute("data-state"), {
        timeout: 10000,
      })
      .toBe("ready");
    await screen.rerender(<MermaidBlock theme="dark" source={current} />);
    // Let the older light drawing land.
    await renderMermaid(older, { theme: "light" });
    await new Promise((r) => setTimeout(r, 50));
    const print = () =>
      figure.element().querySelector("[data-slot=mermaid-block-print]");
    await vi.waitFor(() =>
      expect(print()?.textContent).toContain("currentstart"),
    );
    expect(print()?.textContent).not.toContain("olderstart");
  } finally {
    vi.unstubAllGlobals();
  }
});

test("a diagram never scrolled near keeps its source for print instead of a placeholder", async () => {
  const source = "flowchart LR\n  accTitle: Far away\n  a --> b";
  const screen = await render(
    <div style={{ paddingTop: "5000px" }}>
      <MermaidBlock source={source} />
    </div>,
  );
  const figure = screen.getByRole("figure", { name: "Far away" });
  expect(figure.element().getAttribute("data-state")).toBe("loading");
  const fallback = figure
    .element()
    .querySelector<HTMLElement>("[data-slot=mermaid-block-source]");
  expect(fallback?.textContent).toBe(source);
  // Out of sight on screen; paper shows it.
  expect(fallback!.className).toMatch(/(^| )hidden( |$)/);
  expect(fallback!.className).toContain("print:block");
});
