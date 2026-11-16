import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  AssistantCard,
  AssistantCardBody,
  AssistantCardComposer,
  AssistantCardContext,
  AssistantCardHeader,
  AssistantPill,
} from "./shell-assistant";

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
  const scroller = React.useRef<HTMLDivElement>(null);
  function Body() {
    onBody?.();
    return <p>How can I help?</p>;
  }
  return (
    <div style={{ position: "relative", width: 800, height: 640 }}>
      <div
        ref={scroller}
        data-testid="scroller"
        style={{ height: 640, overflowY: "auto" }}
      >
        <div style={{ height: 3000 }}>
          <span data-testid="corner">Page</span>
        </div>
      </div>
      <AssistantPill
        name="William"
        expanded={open}
        scrollTarget={scroller}
        onClick={() => setOpen(true)}
      />
      <AssistantCard open={open} onOpenChange={setOpen}>
        <AssistantCardHeader
          title="William"
          onClose={() => setOpen(false)}
          onMoveToPanel={() => setMoved((n) => n + 1)}
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

const pillOf = (root: ParentNode) =>
  root.querySelector<HTMLElement>("[data-slot=assistant-pill]")!;

test("the pill reads Ask {name} with its shortcut hint, and the card is not rendered until asked for", async () => {
  let bodies = 0;
  const screen = await render(<Host onBody={() => bodies++} />);
  const pill = screen.getByRole("button", { name: "Ask William" });
  await expect.element(pill).toHaveAttribute("aria-expanded", "false");
  await expect.element(pill).toHaveClass("h-9");
  expect(pillOf(screen.container).textContent).toContain("⌘J");
  expect(
    screen.container.querySelector("[data-slot=assistant-card]"),
  ).toBeNull();
  expect(bodies).toBe(0);
  await expectNoA11yViolations(screen.container);
});

test("opening moves focus to the composer; Escape closes and focus returns to the pill", async () => {
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

test("a closed card keeps its draft; Close, Move to panel and removing the context work", async () => {
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "Ask William" }).click();
  const box = screen.getByRole("textbox", { name: "Message William" });
  await box.fill("draft");
  await screen.getByRole("button", { name: "Move to panel" }).click();
  await expect.element(screen.getByTestId("moved")).toHaveTextContent("1");
  await screen.getByRole("button", { name: "Remove context" }).click();
  expect(screen.container.textContent).not.toContain("Talking about");
  await screen.getByRole("button", { name: "Close" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Ask William" }))
    .toHaveFocus();
  await screen.getByRole("button", { name: "Ask William" }).click();
  await expect.element(box).toHaveValue("draft");
});

test("the pill tucks while the page scrolls down and returns on scroll up and on focus", async () => {
  const screen = await render(<Host withContext={false} />);
  const scroller = screen.container.querySelector<HTMLElement>(
    "[data-testid=scroller]",
  )!;
  const pill = pillOf(screen.container);
  // The pointer may rest where an earlier test's pill was; hovering the corner brings it back.
  await userEvent.hover(screen.getByTestId("corner"));
  const settle = () => new Promise((r) => requestAnimationFrame(() => r(null)));
  scroller.scrollTop = 200;
  scroller.dispatchEvent(new Event("scroll"));
  await settle();
  await expect.element(pill).toHaveAttribute("data-active", "false");
  scroller.scrollTop = 120;
  scroller.dispatchEvent(new Event("scroll"));
  await settle();
  await expect.element(pill).toHaveAttribute("data-active", "true");
  scroller.scrollTop = 400;
  scroller.dispatchEvent(new Event("scroll"));
  await settle();
  await expect.element(pill).toHaveAttribute("data-active", "false");
  pill.focus();
  await expect.element(pill).toHaveAttribute("data-active", "true");
});

test("a focused pill stays visible while the page scrolls under it", async () => {
  const screen = await render(<Host withContext={false} />);
  const scroller = screen.container.querySelector<HTMLElement>(
    "[data-testid=scroller]",
  )!;
  const pill = pillOf(screen.container);
  pill.focus();
  scroller.scrollTop = 400;
  scroller.dispatchEvent(new Event("scroll"));
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await expect.element(pill).toHaveAttribute("data-active", "true");
});

test("slow scrolling adds up and still tucks the pill", async () => {
  const screen = await render(<Host withContext={false} />);
  const scroller = screen.container.querySelector<HTMLElement>(
    "[data-testid=scroller]",
  )!;
  const pill = pillOf(screen.container);
  await userEvent.hover(screen.getByTestId("corner"));
  const scrollTo = (y: number) => {
    scroller.scrollTop = y;
    scroller.dispatchEvent(new Event("scroll"));
  };
  scrollTo(200);
  scrollTo(150);
  await expect.element(pill).toHaveAttribute("data-active", "true");
  // One pixel at a time: each step is under the slop, the run is not.
  for (let y = 151; y <= 155; y++) scrollTo(y);
  await expect.element(pill).toHaveAttribute("data-active", "false");
});

test("an autofocusing composer keeps focus, and closing still returns to the opener; a caller's ref is honoured", async () => {
  function Auto() {
    const [open, setOpen] = React.useState(false);
    const cardRef = React.useRef<HTMLElement | null>(null);
    return (
      <div style={{ position: "relative", width: 600, height: 600 }}>
        <AssistantPill
          name="William"
          expanded={open}
          onClick={() => setOpen(true)}
        />
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
