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
        <div style={{ height: 3000 }}>Page</div>
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
  const scroller = screen.getByTestId("scroller").element() as HTMLElement;
  const pill = pillOf(screen.container);
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
