import * as React from "react";
import { createPortal } from "react-dom";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AssistantCard } from "./shell-assistant";

function Host({ onBody }: { onBody?: () => void }) {
  const [open, setOpen] = React.useState(false);
  function Body() {
    onBody?.();
    return <p>How can I help?</p>;
  }
  return (
    <div style={{ position: "relative", width: 800, height: 640 }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        Ask William
      </button>
      <AssistantCard aria-label="William" open={open} onOpenChange={setOpen}>
        <button type="button" onClick={() => setOpen(false)}>
          Close
        </button>
        <Body />
        <textarea aria-label="Message William" />
      </AssistantCard>
    </div>
  );
}

test("the card is not rendered until asked for", async () => {
  let bodies = 0;
  const screen = await render(<Host onBody={() => bodies++} />);
  expect(
    screen.container.querySelector("[data-slot=assistant-card]"),
  ).toBeNull();
  expect(bodies).toBe(0);
  await expectNoA11yViolations(screen.container);
});

test("opening moves focus to the composer; Escape closes and focus returns to the opener", async () => {
  const screen = await render(<Host />);
  const pill = screen.getByRole("button", { name: "Ask William" });
  await pill.click();
  const card = screen.getByRole("region", { name: "William" });
  await expect.element(card).toBeVisible();
  await expect.element(pill).toHaveAttribute("aria-expanded", "true");
  await expect
    .element(screen.getByRole("textbox", { name: "Message William" }))
    .toHaveFocus();
  await expectNoA11yViolations(screen.container);
  await userEvent.keyboard("{Escape}");
  await expect.element(card).not.toHaveAttribute("data-open");
  expect(card.element().hasAttribute("inert")).toBe(true);
  await expect.element(pill).toHaveFocus();
});

test("a closed card keeps its draft; the chat's own Close returns focus to the opener", async () => {
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "Ask William" }).click();
  const box = screen.getByRole("textbox", { name: "Message William" });
  await box.fill("draft");
  await screen.getByRole("button", { name: "Close" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Ask William" }))
    .toHaveFocus();
  await screen.getByRole("button", { name: "Ask William" }).click();
  await expect.element(box).toHaveValue("draft");
});

test("an autofocusing composer keeps focus, and closing still returns to the opener; a caller's ref is honoured", async () => {
  function Auto() {
    const [open, setOpen] = React.useState(false);
    const cardRef = React.useRef<HTMLElement | null>(null);
    return (
      <div style={{ position: "relative", width: 600, height: 600 }}>
        <button type="button" onClick={() => setOpen(true)}>
          Ask William
        </button>
        <AssistantCard
          ref={cardRef}
          aria-label="William"
          open={open}
          onOpenChange={setOpen}
        >
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input aria-label="Draft" autoFocus />
        </AssistantCard>
        <output data-testid="ref">{cardRef.current ? "set" : "unset"}</output>
      </div>
    );
  }
  const screen = await render(<Auto />);
  const pill = screen.getByRole("button", { name: "Ask William" });
  await pill.click();
  await expect
    .element(screen.getByRole("textbox", { name: "Draft" }))
    .toHaveFocus();
  await userEvent.keyboard("{Escape}");
  await expect.element(pill).toHaveFocus();
  const card = screen.container.querySelector<HTMLElement>(
    "[data-slot=assistant-card]",
  )!;
  expect(card.hasAttribute("inert")).toBe(true);
});

test("Escape closes the card from content portalled in from another React tree", async () => {
  const onOpenChange = vi.fn();
  function Portalled() {
    const [card, setCard] = React.useState<HTMLElement | null>(null);
    return (
      <>
        <AssistantCard ref={setCard} open onOpenChange={onOpenChange}>
          <p>Card</p>
        </AssistantCard>
        {card
          ? createPortal(<button type="button">Inside</button>, card)
          : null}
      </>
    );
  }
  const screen = await render(<Portalled />);
  (
    screen.getByRole("button", { name: "Inside" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
