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
} from "./shell-assistant";
import { Peek, PeekBody, PeekTitle } from "./peek";
import { ToolGroupItem } from "./tool-group";
import "../../test/geometry.css";

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
