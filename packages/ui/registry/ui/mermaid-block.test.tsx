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
    /^Line 4: .+ Showing the last diagram that worked\.$/,
  );
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
    /^Couldn't draw this diagram\. Line 2: /,
  );
  expect(
    figure.element().querySelector("[data-slot=mermaid-block-source]")
      ?.textContent,
  ).toBe("flowchart LR\n  a -->");
  await expectNoA11yViolations(screen.container);
});
