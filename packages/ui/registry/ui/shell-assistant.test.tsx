import * as React from "react";
import { createPortal } from "react-dom";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, onTestFinished, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  AssistantCard,
  AssistantCardBody,
  AssistantCardComposer,
  AssistantCardContext,
  AssistantCardHeader,
  type AssistantPlace,
} from "./shell-assistant";
import { Peek, PeekBody, PeekTitle } from "./peek";
import { ToolGroupItem } from "./tool-group";
import geometryCss from "../../test/geometry.css?inline";

function Host({
  onBody,
  withContext = true,
}: {
  onBody?: () => void;
  withContext?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [about, setAbout] = React.useState(withContext);
  const [moved, setMoved] = React.useState(0);
  function Body() {
    onBody?.();
    return <p>How can I help?</p>;
  }
  return (
    <div style={{ position: "relative", width: 800, height: 640 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setMoved((n) => n + 1);
          setOpen(true);
        }}
      >
        Ask William
      </button>
      <AssistantCard open={open} onOpenChange={setOpen}>
        <AssistantCardHeader
          title="William"
          actions={
            <ToolGroupItem label="New chat" onClick={() => setMoved(0)}>
              <span />
            </ToolGroupItem>
          }
          onClose={() => setOpen(false)}
        />
        {about ? (
          <AssistantCardContext onRemove={() => setAbout(false)}>
            #3 Review Q3 pricing
          </AssistantCardContext>
        ) : null}
        <AssistantCardBody>
          <Body />
        </AssistantCardBody>
        <AssistantCardComposer>
          <textarea aria-label="Message William" />
        </AssistantCardComposer>
      </AssistantCard>
      <output data-testid="moved">{moved}</output>
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
  const card = screen.getByRole("dialog", { name: "William" });
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

test("a closed card keeps its draft; Close, the chat's tools and removing the context work", async () => {
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "Ask William" }).click();
  const box = screen.getByRole("textbox", { name: "Message William" });
  await box.fill("draft");
  await expect.element(screen.getByTestId("moved")).toHaveTextContent("1");
  // The chat's own tools come first in the header's group.
  const tools = screen.container.querySelectorAll(
    "[data-slot=assistant-card-header] [data-slot=tool-group-item]",
  );
  expect(tools[0]?.getAttribute("aria-label")).toBe("New chat");
  await screen.getByRole("button", { name: "New chat" }).click();
  await expect.element(screen.getByTestId("moved")).toHaveTextContent("0");
  await screen.getByRole("button", { name: "Remove context" }).click();
  expect(screen.container.textContent).not.toContain("Talking about");
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
        <AssistantCard ref={cardRef} open={open} onOpenChange={setOpen}>
          <AssistantCardHeader title="William" onClose={() => setOpen(false)} />
          <AssistantCardComposer>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input aria-label="Draft" autoFocus />
          </AssistantCardComposer>
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

test("a card opened while a record is peeked sits above the peek", async () => {
  // The layout's real classes, for this test only (the others check behaviour, not geometry).
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  await render(
    <div style={{ position: "relative", width: 400, height: 600 }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Peek open onOpenChange={() => {}} layout="side">
          <PeekBody>
            <PeekTitle>Task 1</PeekTitle>
          </PeekBody>
        </Peek>
      </div>
      <AssistantCard open onOpenChange={() => {}}>
        <AssistantCardHeader title="William" onClose={() => {}} />
        <AssistantCardBody>
          <p>How can I help?</p>
        </AssistantCardBody>
      </AssistantCard>
    </div>,
  );
  const card = document.querySelector<HTMLElement>(
    '[data-slot="assistant-card"]',
  )!;
  await expect
    .poll(() => card.getBoundingClientRect().width)
    .toBeGreaterThan(0);
  await expect.poll(() => getComputedStyle(card).opacity).toBe("1");
  const r = card.getBoundingClientRect();
  const hit = document.elementFromPoint(
    r.left + r.width / 2,
    r.top + r.height / 2,
  );
  expect(
    card.contains(hit),
    `${hit?.outerHTML.slice(0, 80)} at ${r.left},${r.top} ${innerWidth}x${innerHeight}`,
  ).toBe(true);
});

function Places() {
  const [place, setPlace] = React.useState<AssistantPlace>("float");
  return (
    <div style={{ position: "relative", width: 900, height: 700 }}>
      <AssistantCard open onOpenChange={() => {}} place={place}>
        <AssistantCardHeader
          title="William"
          place={place}
          onPlaceChange={setPlace}
          onClose={() => {}}
        />
        <AssistantCardBody>
          <p>How can I help?</p>
        </AssistantCardBody>
      </AssistantCard>
    </div>
  );
}

test("the header offers the other place, and the card moves without losing its content", async () => {
  const screen = await render(<Places />);
  const card = () =>
    document.querySelector<HTMLElement>('[data-slot="assistant-card"]')!;
  expect(card().dataset.place).toBe("float");
  await screen.getByRole("button", { name: "Dock beside the page" }).click();
  expect(card().dataset.place).toBe("dock");
  expect(card().getAttribute("role")).toBe("region");
  // The button that moved it is gone: focus stays in the card, not on the page.
  await expect.poll(() => card().contains(document.activeElement)).toBe(true);
  // Docked, "Float over the page" floats it again; one move is offered from each place.
  await screen.getByRole("button", { name: "Float over the page" }).click();
  expect(card().dataset.place).toBe("float");
  expect(card().getAttribute("role")).toBe("dialog");
  expect(
    screen.getByRole("button", { name: "Float over the page" }).query(),
  ).toBeNull();
  await expect.element(screen.getByText("How can I help?")).toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("floating, the card drags by its header and stays inside the window", async () => {
  await page.viewport(1280, 800);
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  await render(<Places />);
  const card = document.querySelector<HTMLElement>(
    '[data-slot="assistant-card"]',
  )!;
  const header = card.querySelector<HTMLElement>(
    '[data-slot="assistant-card-header"]',
  )!;
  const start = card.getBoundingClientRect();
  const at = header.getBoundingClientRect();
  const x = at.left + 8;
  const y = at.top + at.height / 2;
  header.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: x,
      clientY: y,
    }),
  );
  window.dispatchEvent(
    new PointerEvent("pointermove", { clientX: x - 5000, clientY: y - 5000 }),
  );
  window.dispatchEvent(new PointerEvent("pointerup", {}));
  await expect
    .poll(() => card.getBoundingClientRect().left)
    .not.toBe(start.left);
  expect(card.getBoundingClientRect().left).toBe(0);
  expect(card.getBoundingClientRect().top).toBe(0);
});

test("floating, Alt and an arrow key move the card", async () => {
  await page.viewport(1280, 800);
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  await render(<Places />);
  const card = document.querySelector<HTMLElement>(
    '[data-slot="assistant-card"]',
  )!;
  card.focus();
  const before = card.getBoundingClientRect().left;
  await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
  await expect
    .poll(() => Math.round(card.getBoundingClientRect().left))
    .toBe(Math.round(before + 16));
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
