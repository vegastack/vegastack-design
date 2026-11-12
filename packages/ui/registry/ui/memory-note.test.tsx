import type * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { MEMORY_NOTE_TONES, MemoryNote } from "./memory-note";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const all = {
  onUndo: () => {},
  onEdit: () => {},
  onWhy: () => {},
  onKeep: () => {},
  onDismiss: () => {},
  onOpen: () => {},
  onRetry: () => {},
};

const LEADS = {
  remembered: "Remembered in Personal memory:",
  updated: "Updated Personal memory:",
  suggested: "Suggested for Personal memory:",
  forgot: "Forgot from Personal memory:",
  would: "Would remember in Personal memory:",
  queued: "Saving to Personal memory…",
  failed: "Couldn't save to Personal memory.",
} as const;

const VISIBLE = {
  remembered: ["Undo", "Edit", "Why?", "Open"],
  updated: ["Undo", "Edit", "Why?", "Open"],
  suggested: ["Keep", "Edit", "Dismiss", "Why?", "Open"],
  forgot: ["Undo", "Why?", "Open"],
  would: [],
  queued: [],
  failed: ["Retry", "Open"],
} as const;

test("every tone leads with its own words and shows only its actions", async () => {
  for (const tone of MEMORY_NOTE_TONES) {
    const screen = await render(
      <MemoryNote
        tone={tone}
        notebook="Personal memory"
        line="You write to customers informally"
        before="formal"
        {...all}
      />,
    );
    const root = slot(screen.container, "memory-note")!;
    expect(root.dataset.tone).toBe(tone);
    expect(slot(root, "memory-note-lead")!.textContent).toBe(LEADS[tone]);
    const labels = [...root.querySelectorAll("button")].map(
      (b) => b.textContent,
    );
    expect(labels).toEqual([...VISIBLE[tone]]);
    await expectNoA11yViolations(screen.container);
    await screen.unmount();
  }
});

test("an action shows only when its handler is passed, and calls it", async () => {
  const onUndo = vi.fn();
  const screen = await render(
    <MemoryNote
      tone="remembered"
      notebook="Personal memory"
      line="First names"
      onUndo={onUndo}
    />,
  );
  const buttons = screen.container.querySelectorAll("button");
  expect(buttons).toHaveLength(1);
  await page
    .getByRole("button", { name: "Undo: Remembered in Personal memory" })
    .click();
  expect(onUndo).toHaveBeenCalledOnce();
});

test("Keep is the only filled action of any tone", async () => {
  for (const tone of MEMORY_NOTE_TONES) {
    const screen = await render(
      <MemoryNote tone={tone} notebook="Sales memory" line="INR" {...all} />,
    );
    const filled = [
      ...screen.container.querySelectorAll<HTMLElement>("[data-slot=button]"),
    ].filter((b) => b.dataset.variant === "default");
    expect(filled.map((b) => b.textContent)).toEqual(
      tone === "suggested" ? ["Keep"] : [],
    );
    await screen.unmount();
  }
});

test("buttons are named by what they act on and described by the line", async () => {
  const screen = await render(
    <MemoryNote
      tone="suggested"
      notebook="Sales memory"
      line="Quotes go out in INR"
      onKeep={() => {}}
      onDismiss={() => {}}
    />,
  );
  const keep = page.getByRole("button", {
    name: "Keep: Suggested for Sales memory",
  });
  await expect.element(keep).toBeVisible();
  await expect
    .element(keep)
    .toHaveAccessibleDescription("Quotes go out in INR");
  await expect
    .element(page.getByRole("group"))
    .toHaveAccessibleName("Suggested for Sales memory: Quotes go out in INR");
  void screen;
});

const visibleButtons = (root: HTMLElement) =>
  [...root.querySelectorAll("button")].filter(
    (b) => getComputedStyle(b).visibility !== "hidden",
  );

test("a settled state replaces the actions with its outcome, at the same size", async () => {
  const props = {
    tone: "remembered" as const,
    notebook: "Personal memory",
    line: "You write to customers informally, first names",
    ...all,
  };
  // Every width from a phone to a desktop column, so a state change near the wrap point counts.
  for (let width = 280; width <= 760; width += 20) {
    const at = (node: React.ReactNode) => <div style={{ width }}>{node}</div>;
    const screen = await render(at(<MemoryNote {...props} />));
    const root = slot(screen.container, "memory-note")!;
    const height = root.getBoundingClientRect().height;
    for (const [state, words] of [
      ["undone", "Undone"],
      ["kept", "Kept"],
      ["dismissed", "Dismissed"],
      ["edited", "Edited"],
    ] as const) {
      await screen.rerender(at(<MemoryNote {...props} state={state} />));
      expect(visibleButtons(root)).toHaveLength(0);
      expect(slot(root, "memory-note-outcome")!.textContent).toBe(words);
      expect(root.getBoundingClientRect().height, `${state} at ${width}`).toBe(
        height,
      );
    }
    await screen.unmount();
  }
  const screen = await render(
    <MemoryNote {...props} state="kept" outcome="Kept by Priya" />,
  );
  const root = slot(screen.container, "memory-note")!;
  expect(slot(root, "memory-note-outcome")!.textContent).toBe("Kept by Priya");
  expect(page.getByRole("button").elements()).toHaveLength(0);
  await screen.rerender(<MemoryNote {...props} state="undone" />);
  expect(slot(root, "memory-note-line")!.className).toContain("line-through");
  await expectNoA11yViolations(screen.container);
});

test("busy keeps the actions in place, disabled, behind a spinner", async () => {
  const props = {
    tone: "suggested" as const,
    notebook: "Sales memory",
    line: "Asha signs off every discount over 10%",
    ...all,
  };
  for (let width = 280; width <= 760; width += 20) {
    const at = (node: React.ReactNode) => <div style={{ width }}>{node}</div>;
    const screen = await render(at(<MemoryNote {...props} />));
    const root = slot(screen.container, "memory-note")!;
    const height = root.getBoundingClientRect().height;
    const left = slot(root, "memory-note-actions")!.getBoundingClientRect()
      .left;
    await screen.rerender(at(<MemoryNote {...props} state="busy" />));
    expect(root.getBoundingClientRect().height, `at ${width}`).toBe(height);
    expect(
      slot(root, "memory-note-actions")!.getBoundingClientRect().left,
    ).toBe(left);
    await screen.unmount();
  }
  const screen = await render(<MemoryNote {...props} state="busy" />);
  const root = slot(screen.container, "memory-note")!;
  const buttons = [...root.querySelectorAll("button")];
  expect(buttons.length).toBeGreaterThan(0);
  expect(buttons.every((b) => b.hasAttribute("data-disabled"))).toBe(true);
  await expect
    .element(page.getByRole("status", { name: "Working" }))
    .toBeVisible();
  expect(root.hasAttribute("aria-busy")).toBe(false);
  await expectNoA11yViolations(screen.container);
});

test("a note replaces the actions; source and before read as muted suffixes", async () => {
  const screen = await render(
    <MemoryNote
      tone="updated"
      notebook="Sales memory"
      line="Quotes in INR"
      before="Quotes in USD"
      source="from an email"
      note="Suggested for Sales: waiting for a reviewer"
      {...all}
    />,
  );
  const root = slot(screen.container, "memory-note")!;
  expect(visibleButtons(root)).toHaveLength(0);
  expect(slot(root, "memory-note-note")!.textContent).toBe(
    "Suggested for Sales: waiting for a reviewer",
  );
  expect(slot(root, "memory-note-before")!.textContent).toBe(
    " (was Quotes in USD)",
  );
  expect(slot(root, "memory-note-source")!.textContent).toBe(
    " · from an email",
  );
  expect(root.getAttribute("aria-label")).toBe(
    "Updated Sales memory: Quotes in INR (was Quotes in USD) · from an email",
  );
});

test("compact drops the icon; queued shows a saving spinner otherwise", async () => {
  const screen = await render(
    <MemoryNote tone="queued" notebook="Personal memory" line="x" />,
  );
  await expect
    .element(page.getByRole("status", { name: "Saving" }))
    .toBeVisible();
  await screen.rerender(
    <MemoryNote
      tone="remembered"
      notebook="Personal memory"
      line="x"
      compact
    />,
  );
  expect(slot(screen.container, "memory-note-icon")).toBeNull();
});

test("at 390px the actions take their own line and nothing overflows", async () => {
  const screen = await render(
    <div style={{ width: 358 }}>
      <MemoryNote
        tone="remembered"
        notebook="Personal memory"
        line="You write to customers informally and use first names, never titles"
        source="from an email"
        {...all}
      />
    </div>,
  );
  const root = slot(screen.container, "memory-note")!;
  const text = slot(root, "memory-note-text")!;
  const actions = slot(root, "memory-note-actions")!;
  expect(actions.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    text.getBoundingClientRect().bottom - 1,
  );
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  for (const button of actions.querySelectorAll("button"))
    expect(button.getBoundingClientRect().height).toBeLessThan(30);
  await screen.unmount();
  const wide = await render(
    <div style={{ width: 960 }}>
      <MemoryNote
        tone="remembered"
        notebook="Personal memory"
        line="First names"
        {...all}
      />
    </div>,
  );
  const a = slot(wide.container, "memory-note-actions")!;
  const t = slot(wide.container, "memory-note-text")!;
  expect(a.getBoundingClientRect().top).toBeLessThan(
    t.getBoundingClientRect().bottom,
  );
});

test("settling keeps the action nodes and hands focus to the outcome", async () => {
  const props = {
    tone: "remembered" as const,
    notebook: "Personal memory",
    line: "First names",
    ...all,
  };
  const screen = await render(<MemoryNote {...props} />);
  const undo =
    screen.container.querySelector<HTMLButtonElement>("[data-action=undo]")!;
  undo.focus();
  await screen.rerender(<MemoryNote {...props} state="busy" />);
  expect(document.activeElement).toBe(undo);
  await screen.rerender(<MemoryNote {...props} state="undone" />);
  expect(screen.container.querySelector("[data-action=undo]")).toBe(undo);
  const outcome = slot(screen.container, "memory-note-outcome")!;
  await expect.poll(() => document.activeElement).toBe(outcome);
  await expectNoA11yViolations(screen.container);
});
