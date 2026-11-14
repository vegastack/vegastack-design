import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ComposerMeta } from "./composer-meta";
import "../../test/geometry.css";

test("privacy on the left, Plan · model · ring on the right, in that order", async () => {
  const screen = await render(
    <div style={{ width: 640 }}>
      <ComposerMeta
        privacy="Private · AI can make mistakes"
        privacyDetail="Only you can see this chat."
        plan={{ on: false, onToggle: () => {} }}
        model={<button type="button">Sonnet 5.5 Medium</button>}
        context={<button type="button">26%</button>}
      />
    </div>,
  );
  const line = screen.container.querySelector<HTMLElement>(
    "[data-slot=composer-meta]",
  )!;
  // The controls' order; the privacy note is a button of its own, on the left.
  const order = [
    ...line.querySelectorAll("[data-slot=composer-meta-controls] button"),
  ].map((b) => b.textContent);
  expect(order).toEqual(["Plan", "Sonnet 5.5 Medium", "26%"]);
  const privacy = line
    .querySelector<HTMLElement>("[data-slot=composer-meta-privacy]")!
    .getBoundingClientRect();
  const controls = line
    .querySelector<HTMLElement>("[data-slot=composer-meta-controls]")!
    .getBoundingClientRect();
  expect(privacy.right).toBeLessThanOrEqual(controls.left);
  expect(Math.round(controls.right)).toBeGreaterThan(600);
  await userEvent.hover(page.getByText("Private · AI can make mistakes"));
  await vi.waitFor(() =>
    expect(
      document.querySelector("[data-slot=tooltip-content]")?.textContent,
    ).toBe("Only you can see this chat."),
  );
  // A screen reader hears the full sentence with the note, shown or not.
  const note = page.getByRole("button", {
    name: "Private · AI can make mistakes",
  });
  await expect
    .element(note)
    .toHaveAccessibleDescription("Only you can see this chat.");
  await expectNoA11yViolations(screen.container);
});

test("a touch tap on the note shows the sentence and keeps it; a second tap hides it", async () => {
  await render(
    <ComposerMeta
      privacy="Private · AI can make mistakes"
      privacyDetail="Only you can see this chat."
    />,
  );
  const note = page
    .getByRole("button", { name: "Private · AI can make mistakes" })
    .element() as HTMLElement;
  const tap = () => {
    note.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
    );
    note.click();
  };
  const shown = () =>
    document.querySelector("[data-slot=tooltip-content]")?.textContent;
  tap();
  await vi.waitFor(() => expect(shown()).toBe("Only you can see this chat."));
  await new Promise((r) => setTimeout(r, 300));
  expect(shown()).toBe("Only you can see this chat.");
  tap();
  await vi.waitFor(() => expect(shown()).toBeUndefined());
});

test("Plan is a toggle: on reads primary with a dot; held keeps its reason and doesn't toggle", async () => {
  const toggle = vi.fn();
  const screen = await render(
    <ComposerMeta plan={{ on: true, onToggle: toggle }} />,
  );
  const plan = page.getByRole("button", { name: "Plan" });
  await expect.element(plan).toHaveAttribute("aria-pressed", "true");
  expect(plan.element().className).toContain("text-primary");
  expect(
    screen.container.querySelector("[data-slot=composer-meta-plan-dot]"),
  ).not.toBeNull();
  await plan.click();
  expect(toggle).toHaveBeenCalledOnce();
  await screen.rerender(
    <ComposerMeta
      plan={{ on: false, onToggle: toggle, disabledReason: "Can't plan here" }}
    />,
  );
  await expect.element(plan).toHaveAttribute("aria-disabled", "true");
  (plan.element() as HTMLElement).click();
  expect(toggle).toHaveBeenCalledOnce();
});

test("at 320px the privacy note gives way and the controls stay whole", async () => {
  const screen = await render(
    <div style={{ width: 320 }}>
      <ComposerMeta
        privacy="Shared with 3 people · AI can make mistakes"
        privacyDetail="Ana, Ben and Chen can see this chat."
        plan={{ on: false, onToggle: () => {} }}
        model={<button type="button">Sonnet 5.5 Medium</button>}
        context={<button type="button">26%</button>}
      />
    </div>,
  );
  const line = screen.container
    .querySelector<HTMLElement>("[data-slot=composer-meta]")!
    .getBoundingClientRect();
  const controls = screen.container
    .querySelector<HTMLElement>("[data-slot=composer-meta-controls]")!
    .getBoundingClientRect();
  expect(controls.right).toBeLessThanOrEqual(line.right + 0.5);
  expect(controls.left).toBeGreaterThanOrEqual(line.left);
  const note = screen.container.querySelector<HTMLElement>(
    "[data-slot=composer-meta-privacy] span",
  )!;
  expect(note.scrollWidth).toBeGreaterThan(note.clientWidth);
});
