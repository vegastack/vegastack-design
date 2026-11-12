import { useState } from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { ComposerChip } from "./composer-chip";
import "../../test/geometry.css";

function Plan() {
  const [on, setOn] = useState(false);
  return (
    <ComposerChip pressed={on} onPressedChange={setOn}>
      Plan
    </ComposerChip>
  );
}

test("a toggle flips aria-pressed by click and by keyboard", async () => {
  const screen = await render(<Plan />);
  const chip = page.getByRole("button", { name: "Plan" });
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect.element(chip).toHaveAttribute("aria-pressed", "true");
  await userEvent.keyboard(" ");
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");
  expect(
    screen.container.querySelector<HTMLElement>('[data-slot="composer-chip"]')!
      .dataset.kind,
  ).toBe("toggle");
  await expectNoA11yViolations(screen.container);
});

test("a menu chip spreads its props onto a button with a chevron", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <ComposerChip
      menu
      aria-label="Model: Haiku 5.5"
      aria-haspopup="menu"
      onClick={onClick}
    >
      Haiku 5.5
    </ComposerChip>,
  );
  const chip = page.getByRole("button", { name: "Model: Haiku 5.5" });
  await chip.click();
  expect(onClick).toHaveBeenCalledOnce();
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="composer-chip"]',
  )!;
  expect(root.dataset.kind).toBe("menu");
  expect(root.getAttribute("aria-pressed")).toBeNull();
  expect(root.querySelectorAll("svg")).toHaveLength(1);
  await expectNoA11yViolations(screen.container);
});

test("read-only shows the words with no control; disabled stays out of reach", async () => {
  const screen = await render(
    <div>
      <ComposerChip readOnly menu>
        Sonnet 5.5
      </ComposerChip>
      <ComposerChip defaultPressed disabled>
        Plan
      </ComposerChip>
    </div>,
  );
  const [shown, off] = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="composer-chip"]',
    ),
  ];
  expect(shown!.tagName).toBe("SPAN");
  expect(shown!.dataset.readOnly).toBe("");
  expect(shown!.querySelector("svg")).toBeNull();
  expect(screen.container.querySelectorAll("button")).toHaveLength(1);
  expect(
    off!.hasAttribute("disabled") || off!.dataset.disabled !== undefined,
  ).toBe(true);
  await expectNoA11yViolations(screen.container);
});

test("a tooltip explains the chip on focus", async () => {
  await render(
    <ComposerChip
      defaultPressed={false}
      tooltip="Plan first: it changes nothing until you accept"
    >
      Plan
    </ComposerChip>,
  );
  await userEvent.tab();
  await expect
    .element(page.getByText("Plan first: it changes nothing until you accept"))
    .toBeVisible();
});
