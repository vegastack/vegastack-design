import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  formatReactors,
  Reactions,
  toggleReaction,
  type ReactionData,
} from "./reactions";

const NEHA = { id: "neha", name: "Neha Kapoor" };
const ARJUN = { id: "arjun", name: "Arjun Mehta" };
const ME = { id: "me", name: "Asha Rao" };

const SAMPLE: ReactionData[] = [
  { emoji: "👍", count: 5, reacted: false, users: [NEHA, ARJUN] },
  { emoji: "🎉", count: 1, reacted: true, users: [ME] },
];

test("renders a pill per emoji with its count, pressed when the viewer reacted", async () => {
  const screen = await render(
    <Reactions reactions={SAMPLE} onToggle={() => {}} />,
  );
  const pills = document.querySelectorAll('[data-slot="reaction-pill"]');
  expect(pills).toHaveLength(2);
  expect(pills[0]!.textContent).toContain("5");
  expect(pills[0]!.getAttribute("aria-pressed")).toBe("false");
  expect(pills[1]!.getAttribute("aria-pressed")).toBe("true");
  expect(pills[1]!.hasAttribute("data-reacted")).toBe(true);
  await expect
    .element(screen.getByRole("button", { name: "Add reaction" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("clicking a pill toggles that emoji", async () => {
  const onToggle = vi.fn();
  await render(<Reactions reactions={SAMPLE} onToggle={onToggle} />);
  (
    document.querySelector('[data-slot="reaction-pill"]') as HTMLElement
  ).click();
  expect(onToggle).toHaveBeenCalledWith("👍");
});

test("a pending toggle keeps the pill busy and ignores repeat clicks", async () => {
  let resolve!: () => void;
  const onToggle = vi.fn(() => new Promise<void>((r) => (resolve = r)));
  await render(<Reactions reactions={SAMPLE} onToggle={onToggle} />);
  const pill = document.querySelector(
    '[data-slot="reaction-pill"]',
  ) as HTMLElement;
  pill.click();
  await expect.poll(() => pill.getAttribute("aria-busy")).toBe("true");
  pill.click();
  expect(onToggle).toHaveBeenCalledOnce();
  resolve();
  await expect.poll(() => pill.getAttribute("aria-busy")).toBeNull();
});

test("hovering a pill names who reacted", async () => {
  await render(<Reactions reactions={SAMPLE} onToggle={() => {}} />);
  await userEvent.hover(
    document.querySelector('[data-slot="reaction-pill"]') as HTMLElement,
  );
  await expect
    .poll(
      () => document.querySelector('[data-slot="reaction-card"]')?.textContent,
    )
    .toContain("Neha Kapoor, Arjun Mehta and 3 others reacted with");
  await expect
    .poll(
      () => document.querySelector('[data-slot="reaction-card"]')?.textContent,
    )
    .toContain(":thumbs_up:");
});

test("the add button opens the picker with the quick reactions", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <Reactions reactions={SAMPLE} onToggle={onToggle} />,
  );
  await screen.getByRole("button", { name: "Add reaction" }).click();
  const quick = screen.getByRole("group", { name: "Quick reactions" });
  await expect.element(quick).toBeInTheDocument();
  await quick.getByRole("button", { name: "eyes" }).click();
  expect(onToggle).toHaveBeenCalledWith("👀");
});

test("picking an emoji the viewer already reacted with does nothing", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <Reactions reactions={SAMPLE} onToggle={onToggle} />,
  );
  await screen.getByRole("button", { name: "Add reaction" }).click();
  await screen
    .getByRole("group", { name: "Quick reactions" })
    .getByRole("button", { name: "party popper" })
    .click();
  expect(onToggle).not.toHaveBeenCalled();
});

test("read-only: no add button without onToggle, nothing with no reactions", async () => {
  const screen = await render(
    <div data-testid="host">
      <Reactions reactions={SAMPLE} />
      <Reactions reactions={[]} />
    </div>,
  );
  expect(document.querySelectorAll('[data-slot="reactions"]')).toHaveLength(1);
  expect(document.querySelector('[data-slot="reaction-add"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("formatReactors joins names, caps with maxUsersShown and marks Inactive", () => {
  expect(formatReactors([NEHA], 1)).toBe("Neha Kapoor");
  expect(formatReactors([NEHA, ARJUN], 2)).toBe("Neha Kapoor and Arjun Mehta");
  expect(formatReactors([NEHA, ARJUN, ME], 3)).toBe(
    "Neha Kapoor, Arjun Mehta and Asha Rao",
  );
  expect(formatReactors([NEHA, ARJUN, ME], 3, 1)).toBe(
    "Neha Kapoor and 2 others",
  );
  expect(formatReactors([{ ...NEHA, inactive: true }], 1)).toBe(
    "Neha Kapoor (Inactive)",
  );
});

test("toggleReaction adds, removes and drops an emoji at zero", () => {
  const added = toggleReaction(SAMPLE, "👍", ME);
  expect(added[0]).toMatchObject({ count: 6, reacted: true });
  const removed = toggleReaction(SAMPLE, "🎉", ME);
  expect(removed.map((r) => r.emoji)).toEqual(["👍"]);
  const fresh = toggleReaction([], "🙏", ME);
  expect(fresh).toEqual([
    { emoji: "🙏", count: 1, reacted: true, users: [ME] },
  ]);
});

test("draws no focus ring", async () => {
  const screen = await render(
    <Reactions reactions={SAMPLE} onToggle={() => {}} />,
  );
  expect(screen.container.innerHTML).not.toMatch(/ring-3|focus-visible:ring/);
  void React;
});
