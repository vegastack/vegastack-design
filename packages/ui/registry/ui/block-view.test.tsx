import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  StaticBlockView,
  initialBlockViewMode,
  type BlockView,
} from "./block-view";
import { MarkdownView } from "./markdown-view";

const view: BlockView = {
  label: "Diagram",
  render: (source, ctx) => (
    <p data-testid="preview">
      {ctx.theme} preview of {source}
    </p>
  ),
  actions: [{ label: "Copy SVG", onSelect: () => "SVG copied" }],
};

test("Preview and Code switch with the buttons, ⌘Enter and Escape", async () => {
  const screen = await render(
    <StaticBlockView view={view} language="mermaid" source="a --> b" />,
  );
  const previewButton = screen.getByRole("button", { name: "Preview" });
  const codeButton = screen.getByRole("button", { name: "Code" });
  await expect.element(previewButton).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByTestId("preview").element().textContent).toBe(
    "light preview of a --> b",
  );
  await expectNoA11yViolations(screen.container);

  await userEvent.click(codeButton);
  await expect.element(codeButton).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.container.querySelector("[data-slot=block-view-preview]"),
  ).toBeNull();
  await expect.element(screen.getByText("a --> b")).toBeVisible();
  await expectNoA11yViolations(screen.container);

  await userEvent.keyboard("{Escape}");
  await expect.element(previewButton).toHaveAttribute("aria-pressed", "true");
  (codeButton.element() as HTMLElement).focus();
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await expect.element(codeButton).toHaveAttribute("aria-pressed", "true");
});

test("the ⋯ menu offers Copy source, then the view's actions", async () => {
  const screen = await render(
    <StaticBlockView view={view} language="mermaid" source="a --> b" />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Diagram actions" }),
  );
  const items = screen.getByRole("menuitem");
  await expect.element(items.first()).toBeVisible();
  expect(items.elements().map((item) => item.textContent)).toEqual([
    "Copy source",
    "Copy SVG",
  ]);
});

test("Expand opens the preview in a dialog that pans and zooms", async () => {
  const screen = await render(
    <StaticBlockView view={view} language="mermaid" source="a --> b" />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Expand diagram" }));
  const dialog = screen.getByRole("dialog", { name: "Diagram" });
  await expect.element(dialog).toBeVisible();
  await expect
    .element(dialog.getByRole("button", { name: "Zoom in" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body);
});

test("MarkdownView draws a mapped fence with its view after hydration, other fences as code", async () => {
  const screen = await render(
    <MarkdownView blockViews={{ mermaid: view }}>
      {"```mermaid\nflowchart LR\n  a --> b\n```\n\n```ts\nconst x = 1;\n```"}
    </MarkdownView>,
  );
  await expect.element(screen.getByTestId("preview")).toBeVisible();
  expect(screen.getByTestId("preview").element().textContent).toBe(
    "light preview of flowchart LR\n  a --> b",
  );
  expect(
    screen.container.querySelectorAll("[data-slot=block-view]").length,
  ).toBe(1);
  expect(
    screen.container.querySelector("[data-slot=code-block][data-language=ts]"),
  ).not.toBeNull();
});

test("a new block holding the starter opens in Code, with or without its trailing newline", () => {
  const view: BlockView = {
    label: "Diagram",
    render: () => null,
    starter: "flowchart LR\n  a --> b\n",
  };
  expect(initialBlockViewMode(view, "flowchart LR\n  a --> b", true)).toBe(
    "code",
  );
  expect(initialBlockViewMode(view, "flowchart LR\n  a --> b\n", true)).toBe(
    "code",
  );
  expect(initialBlockViewMode(view, "flowchart LR\n  a --> c", true)).toBe(
    "preview",
  );
  expect(initialBlockViewMode(view, "flowchart LR\n  a --> b", false)).toBe(
    "preview",
  );
});
