import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ContextPanel } from "./context-panel";
import "../../test/geometry.css";

const PARTS = [
  { id: "instructions", label: "Instructions and tools", tokens: 16_000 },
  { id: "memory", label: "Memory", tokens: 2_000 },
  { id: "conversation", label: "Conversation", tokens: 7_000 },
  { id: "tools", label: "Tool results", tokens: 1_000 },
];

const rows = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-slot=context-panel-parts] dt")].map(
    (dt) => {
      const tokens = dt.nextElementSibling!.textContent!;
      const share = dt.nextElementSibling!.nextElementSibling!.textContent!;
      return [dt.textContent, tokens, share];
    },
  );

test("the share, the window, and a legend that adds up to it", async () => {
  const screen = await render(
    <ContextPanel used={26_000} window={200_000} parts={PARTS} />,
  );
  const used = screen.container.querySelector(
    "[data-slot=context-panel-used]",
  )!;
  expect(used.textContent).toBe("13% used26k / 200k");
  const legend = rows(screen.container);
  expect(legend).toEqual([
    ["Instructions and tools", "16k", "8.0%"],
    ["Memory", "2k", "1.0%"],
    ["Conversation", "7k", "3.5%"],
    ["Tool results", "1k", "0.5%"],
    ["Free", "174k", "87.0%"],
  ]);
  const sum = PARTS.reduce((s, p) => s + p.tokens, 0) + 174_000;
  expect(sum).toBe(200_000);
  await expectNoA11yViolations(screen.container);
});

test("measured tokens the parts don't name are Other", async () => {
  const screen = await render(
    <ContextPanel used={30_000} window={200_000} parts={PARTS} />,
  );
  const legend = rows(screen.container);
  expect(legend[4]).toEqual(["Other", "4k", "2.0%"]);
  expect(legend[5]).toEqual(["Free", "170k", "85.0%"]);
});

test("Summarize now ends the panel, busy while its promise runs; held before the first answer", async () => {
  let done: () => void = () => {};
  const summarize = vi.fn(() => new Promise<void>((r) => (done = r)));
  const screen = await render(
    <ContextPanel
      used={26_000}
      window={200_000}
      parts={PARTS}
      onSummarize={summarize}
    />,
  );
  const button = page.getByRole("button", { name: "Summarize now" });
  const panel = screen.container.querySelector("[data-slot=context-panel]")!;
  expect(panel.lastElementChild).toBe(button.element());
  await button.click();
  const busy = page.getByRole("button", { name: "Summarizing" });
  await expect.element(busy).toHaveAttribute("aria-busy", "true");
  // The braille loader, never an icon spinner.
  expect(
    busy.element().querySelector("[data-slot=text-spinner]"),
  ).not.toBeNull();
  expect(busy.element().querySelector("svg")).toBeNull();
  done();
  await expect.element(button).not.toHaveAttribute("aria-busy", "true");
  await screen.rerender(
    <ContextPanel used={null} window={200_000} onSummarize={summarize} />,
  );
  await expect.element(button).toHaveAttribute("aria-disabled", "true");
  await expect
    .element(page.getByText("Measured after the first answer."))
    .toBeVisible();
});

test("parts that say more than the measure, or than the window, never break the sum", async () => {
  const screen = await render(
    <ContextPanel
      used={20_000}
      window={100_000}
      parts={[
        { id: "a", label: "Instructions and tools", tokens: 70_000 },
        { id: "b", label: "Conversation", tokens: 50_000 },
      ]}
    />,
  );
  expect(
    screen.container.querySelector("[data-slot=context-panel-used]")!
      .textContent,
  ).toBe("100% used100k / 100k");
  expect(rows(screen.container)).toEqual([
    ["Instructions and tools", "70k", "70.0%"],
    ["Conversation", "30k", "30.0%"],
    ["Free", "0", "0.0%"],
  ]);
});
