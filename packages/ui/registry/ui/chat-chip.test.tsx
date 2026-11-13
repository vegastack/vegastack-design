import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ChatChip } from "./chat-chip";

const chip = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[data-slot="chat-chip"]')!;

test("a static chip is a span on the chat card surface with no chevron", async () => {
  const screen = await render(<ChatChip label="3 running" meta="2m" />);
  const element = chip(screen.container);
  expect(element.tagName).toBe("SPAN");
  for (const cls of ["bg-chat-card", "border-chat-hairline", "h-7"])
    expect(element.classList.contains(cls)).toBe(true);
  expect(element.querySelector("svg")).toBeNull();
  expect(element.textContent).toBe("3 running 2m");
});

test("onClick makes a button and href a link, each with a trailing chevron", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <>
      <ChatChip label="7 commands done" onClick={onClick} />
      <ChatChip label="1 failed" href="#work" />
    </>,
  );
  const button = screen.getByRole("button", { name: "7 commands done" });
  await userEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
  expect(button.element().querySelector("svg")).not.toBeNull();
  const link = screen.getByRole("link", { name: "1 failed" });
  expect(link.element().getAttribute("href")).toBe("#work");
});

test("COL-25: attention lifts the label's ink and never adds a status fill", async () => {
  const screen = await render(<ChatChip tone="attention" label="1 failed" />);
  const element = chip(screen.container);
  expect(element.dataset.tone).toBe("attention");
  expect(element.className).not.toMatch(/bg-(success|warning|destructive)/);
  const label = element.querySelector<HTMLElement>(
    '[data-slot="chat-chip-label"]',
  )!;
  expect(label.className).toContain("text-foreground");
});

test("no a11y violations — static, button and link", async () => {
  const screen = await render(
    <p>
      <ChatChip label="3 running" />
      <ChatChip label="7 done" onClick={() => {}} />
      <ChatChip tone="attention" label="1 failed" href="#work" />
    </p>,
  );
  await expectNoA11yViolations(screen.container);
});

test("native props reach every host: an aria-label overrides the name on a button and a link", async () => {
  const screen = await render(
    <>
      <ChatChip
        label="7"
        aria-label="7 background commands"
        onClick={() => {}}
      />
      <ChatChip label="1" aria-label="1 failed command" href="#work" />
    </>,
  );
  await expect
    .element(screen.getByRole("button", { name: "7 background commands" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("link", { name: "1 failed command" }))
    .toBeInTheDocument();
});
