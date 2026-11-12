import { useState } from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { ContextRing, contextRingTone } from "./context-ring";
import "../../test/geometry.css";

const ring = (screen: { container: HTMLElement }) =>
  screen.container.querySelector<HTMLElement>('[data-slot="context-ring"]')!;

test("the tone follows the operator's bands: blue under 75%, amber from 75%, red from 90%", () => {
  expect(contextRingTone(null)).toBe("empty");
  expect(contextRingTone(0.1)).toBe("info");
  expect(contextRingTone(0.749)).toBe("info");
  expect(contextRingTone(0.75)).toBe("warning");
  expect(contextRingTone(0.899)).toBe("warning");
  expect(contextRingTone(0.9)).toBe("danger");
  expect(contextRingTone(1)).toBe("danger");
});

test.each([
  [null, "empty", "Chat memory, not measured yet"],
  [10_000, "info", "Chat memory 10% used"],
  [74_000, "info", "Chat memory 74% used"],
  [80_000, "warning", "Chat memory 80% used"],
  [92_000, "danger", "Chat memory 92% used"],
  [140_000, "danger", "Chat memory 100% used"],
] as const)("used %s is %s and named %s", async (used, tone, name) => {
  const screen = await render(<ContextRing used={used} window={100_000} />);
  await expect
    .element(page.getByRole("button", { name }))
    .toHaveAttribute("data-tone", tone);
  expect(ring(screen).dataset.tone).toBe(tone);
  await expectNoA11yViolations(screen.container);
});

test("pressed, it shows tokens and the parts, never money, and Summarize now", async () => {
  const onSummarize = vi.fn();
  const screen = await render(
    <ContextRing
      used={62_000}
      window={100_000}
      parts={[
        { label: "Instructions & tools", tokens: 12_000 },
        { label: "Conversation", tokens: 40_000 },
        { label: "Tool results", tokens: 10_000 },
      ]}
      onSummarize={onSummarize}
    />,
  );
  await page.getByRole("button", { name: "Chat memory 62% used" }).click();
  const popup = document.querySelector<HTMLElement>(
    '[data-slot="context-ring-breakdown"]',
  )!;
  await vi.waitFor(() => expect(popup).toBeTruthy());
  expect(popup.textContent).toContain("62k of 100k tokens · 62%");
  expect(popup.textContent).toContain("Conversation");
  expect(popup.textContent).toContain("40k");
  expect(popup.textContent).toContain("Older messages are summarized at 90%.");
  expect(popup.textContent).not.toMatch(/\$/);
  await page.getByRole("button", { name: "Summarize now" }).click();
  expect(onSummarize).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
  await expectNoA11yViolations(popup);
});

test("a reader who can't send gets no Summarize now; nothing measured turns it off", async () => {
  await render(<ContextRing used={50_000} window={100_000} />);
  await page.getByRole("button", { name: "Chat memory 50% used" }).click();
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="context-ring-breakdown"]'),
    ).toBeTruthy(),
  );
  expect(
    document.querySelector('[data-slot="context-ring-summarize"]'),
  ).toBeNull();
});

test("a pending summary keeps the button busy until it settles", async () => {
  let finish: () => void = () => {};
  const onSummarize = vi.fn(
    () => new Promise<void>((resolve) => (finish = resolve)),
  );
  await render(
    <ContextRing used={92_000} window={100_000} onSummarize={onSummarize} />,
  );
  await page.getByRole("button", { name: "Chat memory 92% used" }).click();
  const button = page.getByRole("button", { name: "Summarize now" });
  await button.click();
  await expect.element(button).toHaveAttribute("aria-busy", "true");
  finish();
  await vi.waitFor(() =>
    expect(button.element().getAttribute("aria-busy")).not.toBe("true"),
  );
});

test("onOpen hands the press to the host and opens no popover", async () => {
  const onOpen = vi.fn();
  await render(<ContextRing used={30_000} window={100_000} onOpen={onOpen} />);
  await page.getByRole("button", { name: "Chat memory 30% used" }).click();
  expect(onOpen).toHaveBeenCalledOnce();
  expect(
    document.querySelector('[data-slot="context-ring-breakdown"]'),
  ).toBeNull();
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
  await expect
    .element(page.getByRole("button", { name: "Chat memory 20% used" }))
    .toHaveAttribute("data-tone", "info");
});

test("keyboard: Enter opens the breakdown and Escape closes it", async () => {
  await render(
    <ContextRing used={80_000} window={100_000} onSummarize={() => {}} />,
  );
  await userEvent.tab();
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="context-ring-breakdown"]'),
    ).toBeTruthy(),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(
      document.querySelector(
        '[data-slot="context-ring-breakdown"]:not([data-ending-style])',
      ),
    ).toBeNull(),
  );
});

test("labels and a custom formatter word it for the host", async () => {
  await render(
    <ContextRing
      used={1500}
      window={3000}
      formatTokens={(tokens) => `${tokens} t`}
      labels={{
        name: "Context",
        used: (percent) => `Context ${percent} percent`,
        of: (used, window) => `${used} / ${window}`,
      }}
    />,
  );
  await page.getByRole("button", { name: "Context 50 percent" }).click();
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="context-ring-breakdown"]')
        ?.textContent,
    ).toContain("1500 t / 3000 t"),
  );
});
