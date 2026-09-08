import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Chip, ChipRemove } from "./chip";

test("renders a neutral sm chip on the rest fill with the slot markers", async () => {
  const screen = await render(<Chip>Uncategorized</Chip>);
  const chip = screen.getByText("Uncategorized").element() as HTMLElement;
  expect(chip.dataset.slot).toBe("chip");
  expect(chip.dataset.hue).toBe("neutral");
  expect(chip.dataset.size).toBe("sm");
  expect(chip.dataset.active).toBeUndefined();
  expect(chip.className).toContain("bg-surface-1");
  expect(chip.className).toContain("rounded-full");
  expect(chip.className).toContain("h-(--size-sm)");
  await expectNoA11yViolations(screen.container);
});

test("active promotes the neutral chip to the selection rung", async () => {
  const screen = await render(
    <Chip size="md" active>
      Status: Open
    </Chip>,
  );
  const chip = screen.getByText("Status: Open").element() as HTMLElement;
  expect(chip.dataset.active).toBe("");
  expect(chip.dataset.size).toBe("md");
  expect(chip.className).toContain("bg-surface-2");
  expect(chip.className).toContain("h-(--size-md)");
});

test("a chromatic hue ignores active and keeps its own tint", async () => {
  const screen = await render(
    <Chip hue="blue" active>
      B2B
    </Chip>,
  );
  const chip = screen.getByText("B2B").element() as HTMLElement;
  expect(chip.dataset.hue).toBe("blue");
  // `active` is a NEUTRAL-only promotion — a hue already carries the meaning.
  expect(chip.className).toContain("bg-tag-blue-subtle");
  expect(chip.className).toContain("text-tag-blue-text");
  expect(chip.className).not.toContain("bg-surface-2");
});

test("every hue resolves to its own three token classes", async () => {
  const hues = [
    "blue",
    "cyan",
    "green",
    "lime",
    "yellow",
    "orange",
    "red",
    "pink",
    "magenta",
    "purple",
  ] as const;
  const screen = await render(
    <div>
      {hues.map((hue) => (
        <Chip key={hue} hue={hue}>
          {hue}
        </Chip>
      ))}
    </div>,
  );
  for (const hue of hues) {
    const chip = screen.getByText(hue).element() as HTMLElement;
    expect(chip.className).toContain(`bg-tag-${hue}-subtle`);
    expect(chip.className).toContain(`text-tag-${hue}-text`);
    expect(chip.className).toContain(`border-tag-${hue}-text/`);
  }
});

test("the chip root is not interactive and carries no hover or pressed step", async () => {
  const screen = await render(<Chip>Label</Chip>);
  const chip = screen.getByText("Label").element() as HTMLElement;
  // Clicking a chip does nothing, so it must not pretend to be a control.
  expect(chip.tagName).toBe("SPAN");
  expect(chip.className).not.toContain("hover:bg-");
  expect(chip.className).not.toContain("active:bg-");
});

test("onRemove mounts a labelled remove control and fires on activation", async () => {
  const onRemove = vi.fn();
  const screen = await render(
    <Chip onRemove={onRemove} removeLabel="Remove API">
      API
    </Chip>,
  );
  const remove = screen.getByRole("button", { name: "Remove API" });
  await userEvent.click(remove);
  expect(onRemove).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("the remove control is a round ghost IconButton with the shared hover/pressed grammar", async () => {
  const screen = await render(
    <Chip onRemove={() => {}} removeLabel="Remove API">
      API
    </Chip>,
  );
  const remove = screen
    .getByRole("button", { name: "Remove API" })
    .element() as HTMLElement;
  expect(remove.dataset.slot).toBe("chip-remove");
  expect(remove.dataset.shape).toBe("round");
  expect(remove.className).toContain("rounded-full");
  // Hover climbs surface ladder rung 2, pressing climbs rung 3 — from Button's `ghost`
  // recipe, never a literal restated here (SP-01: every control needs a pressed step).
  expect(remove.className).toContain("hover:bg-(--btn-soft-hover)");
  expect(remove.className).toContain("active:bg-(--btn-soft-active)");
});

/* ---------------------------------------------------------------------------------------------
 * Touch-target proof (WCAG 2.5.8). The harness compiles no Tailwind, so `--size-xs` collapses to
 * zero — the mirror below is a 1:1 hand-transcription of what `IconButton size="xs"` compiles to
 * (24px square), keyed off the real `data-slot`. Unlike checkbox/radio/slider, this control uses
 * NO `::before` expansion: its own border box is the target, which is precisely the fix — a
 * `::before` on a nested native `<button>` is clipped to the button's border box by Chromium and
 * is therefore never hit-testable, and `ComboboxChipRemove` previously had no expansion at all.
 * ------------------------------------------------------------------------------------------- */
function injectChipRemoveGeometryMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="chip"] { display: inline-flex; align-items: center; }
    [data-slot="chip-remove"] { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; width: 24px; height: 24px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("the remove control's REAL border box is >= 24x24 and owns its own centre", async () => {
  const cleanup = injectChipRemoveGeometryMirror();
  try {
    const onRemove = vi.fn();
    const screen = await render(
      <Chip onRemove={onRemove} removeLabel="Remove API">
        API
      </Chip>,
    );
    const el = screen
      .getByRole("button", { name: "Remove API" })
      .element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(24);
    expect(rect.height).toBeGreaterThanOrEqual(24);
    // A real hit test 1px inside the top-left corner, not a getComputedStyle claim.
    const hit = document.elementFromPoint(rect.left + 1, rect.top + 1);
    expect(el === hit || el.contains(hit)).toBe(true);
    (hit as HTMLElement).click();
    expect(onRemove).toHaveBeenCalledOnce();
  } finally {
    cleanup();
  }
});

test("render composes the geometry onto a host element without losing its props", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <Chip size="md" render={<button type="button" />} onClick={onClick}>
      Show more
    </Chip>,
  );
  const chip = screen
    .getByRole("button", { name: "Show more" })
    .element() as HTMLElement;
  expect(chip.tagName).toBe("BUTTON");
  expect(chip.dataset.slot).toBe("chip");
  expect(chip.className).toContain("h-(--size-md)");
  await userEvent.click(screen.getByRole("button", { name: "Show more" }));
  expect(onClick).toHaveBeenCalledOnce();
});

test("ChipRemove is exported for engines that own their own remove element", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <Chip>
      Design
      <ChipRemove aria-label="Remove Design" onClick={onClick} />
    </Chip>,
  );
  const remove = screen
    .getByRole("button", { name: "Remove Design" })
    .element() as HTMLElement;
  expect(remove.dataset.slot).toBe("chip-remove");
  await userEvent.click(screen.getByRole("button", { name: "Remove Design" }));
  expect(onClick).toHaveBeenCalledOnce();
});

test("data-slot is overridable so a composing wrapper keeps its own slot", async () => {
  const screen = await render(<Chip data-slot="tag">Label</Chip>);
  const chip = screen.getByText("Label").element() as HTMLElement;
  expect(chip.dataset.slot).toBe("tag");
});

test("forwards a ref to the chip root", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(<Chip ref={ref}>Label</Chip>);
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("chip");
});
