import { useState } from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { ContextRing, contextRingTone } from "./context-ring";
import "../../test/geometry.css";

const PARTS = [
  { id: "instructions", label: "Instructions and tools", tokens: 16_000 },
  { id: "conversation", label: "Conversation", tokens: 40_000 },
];

const ring = (screen: { container: HTMLElement }) =>
  screen.container.querySelector<HTMLElement>('[data-slot="context-ring"]');
const panel = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="context-ring-panel"]:not([data-ending-style])',
  );

test("the ink follows the bands: foreground under 75%, primary from 75%, warning from 90%", () => {
  expect(contextRingTone(0.1)).toBe("default");
  expect(contextRingTone(0.749)).toBe("default");
  expect(contextRingTone(0.75)).toBe("high");
  expect(contextRingTone(0.899)).toBe("high");
  expect(contextRingTone(0.9)).toBe("full");
});

test("nothing shows before the first measurement", async () => {
  const screen = await render(<ContextRing used={null} window={200_000} />);
  expect(ring(screen)).toBeNull();
});

test.each([
  [52_000, "default", "26%"],
  [160_000, "high", "80%"],
  [190_000, "full", "95%"],
] as const)(
  "used %s is %s and shows %s beside a still 10px ring",
  async (used, tone, text) => {
    const screen = await render(<ContextRing used={used} window={200_000} />);
    const button = ring(screen)!;
    expect(button.dataset.tone).toBe(tone);
    expect(button.textContent).toBe(text);
    const glyph = button.querySelector<HTMLElement>(
      '[data-slot="context-ring-ring"]',
    )!;
    expect(glyph.getBoundingClientRect().width).toBe(10);
    expect(getComputedStyle(glyph).animationName).toBe("none");
    await expectNoA11yViolations(screen.container);
  },
);

test("hover opens the panel after 150ms, not before", async () => {
  await render(<ContextRing used={56_000} window={200_000} parts={PARTS} />);
  await userEvent.hover(
    page.getByRole("button", { name: "Chat memory 28% used" }),
  );
  await new Promise((done) => setTimeout(done, 60));
  expect(panel()).toBeNull();
  await vi.waitFor(() => expect(panel()).toBeTruthy(), { timeout: 1000 });
  expect(panel()!.textContent).toContain("28% used");
  expect(panel()!.textContent).toContain("56k / 200k");
});

test("keyboard focus opens the panel without moving focus; Enter moves in; Escape closes", async () => {
  await render(
    <ContextRing
      used={56_000}
      window={200_000}
      parts={PARTS}
      onSummarize={() => {}}
    />,
  );
  const trigger = page
    .getByRole("button", { name: "Chat memory 28% used" })
    .element();
  await userEvent.tab();
  expect(document.activeElement).toBe(trigger);
  await vi.waitFor(() => expect(panel()).toBeTruthy());
  expect(document.activeElement).toBe(trigger);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(panel()).toBeNull());
});

test("a click toggles the panel; its numbers add up to the window", async () => {
  const screen = await render(
    <ContextRing
      used={56_000}
      window={200_000}
      parts={PARTS}
      onSummarize={() => {}}
    />,
  );
  const button = page.getByRole("button", { name: "Chat memory 28% used" });
  await button.click();
  await vi.waitFor(() => expect(panel()).toBeTruthy());
  const tokens = [
    ...panel()!.querySelectorAll("[data-slot=context-panel-parts] dt"),
  ].map((dt) => dt.nextElementSibling!.textContent);
  expect(tokens).toEqual(["16k", "40k", "144k"]);
  await expectNoA11yViolations(screen.container);
  // The portaled panel itself.
  await expectNoA11yViolations(document.body);
  await button.click();
  await vi.waitFor(() => expect(panel()).toBeNull());
});

test("onOpen hands the press to the host and opens no panel", async () => {
  const onOpen = vi.fn();
  await render(<ContextRing used={30_000} window={100_000} onOpen={onOpen} />);
  await page.getByRole("button", { name: "Chat memory 30% used" }).click();
  expect(onOpen).toHaveBeenCalledOnce();
  expect(panel()).toBeNull();
});

test("the drop after a summary is said once; growth is not", async () => {
  function Host() {
    const [used, setUsed] = useState(92_000);
    return (
      <>
        <ContextRing used={used} window={100_000} onOpen={() => {}} />
        <Button onClick={() => setUsed(95_000)}>Grow</Button>
        <Button onClick={() => setUsed(20_000)}>Summarize</Button>
      </>
    );
  }
  const screen = await render(<Host />);
  const region = () =>
    screen.container.querySelector<HTMLElement>('[role="status"]')!;
  expect(region().textContent).toBe("");
  await page.getByRole("button", { name: "Grow" }).click();
  expect(region().textContent).toBe("");
  await page.getByRole("button", { name: "Summarize" }).click();
  await vi.waitFor(() =>
    expect(region().textContent).toBe("Chat memory 20% used"),
  );
});

test("the ring and its panel show one total, even when the parts say more than the measure", async () => {
  await render(
    <ContextRing
      used={20_000}
      window={100_000}
      parts={[
        { id: "a", label: "Instructions and tools", tokens: 70_000 },
        { id: "b", label: "Conversation", tokens: 50_000 },
      ]}
    />,
  );
  const button = page.getByRole("button", { name: "Chat memory 100% used" });
  await button.click();
  await vi.waitFor(() => expect(panel()).toBeTruthy());
  expect(
    panel()!.querySelector("[data-slot=context-panel-used]")!.textContent,
  ).toBe("100% used100k / 100k");
});
