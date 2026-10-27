import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ActionList,
  ActionListEmpty,
  ActionListItem,
  RecordAsideCard,
  RecordAsideSection,
} from "./record-aside";

test("renders sections and edge-to-edge rows", async () => {
  const screen = await render(
    <RecordAsideCard>
      <RecordAsideSection title="Tasks" count={1}>
        <ActionList>
          <ActionListItem>Send the quote</ActionListItem>
        </ActionList>
        <ActionListEmpty>No suggestions</ActionListEmpty>
      </RecordAsideSection>
    </RecordAsideCard>,
  );
  await expect
    .element(screen.getByRole("region", { name: /Tasks/ }))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("a collapsible section folds from its title and keeps its count and action", async () => {
  const screen = await render(
    <RecordAsideSection
      collapsible
      headingLevel="h3"
      title="Attachments"
      count={2}
      action={<button type="button">Add attachment</button>}
    >
      <p>Two files</p>
    </RecordAsideSection>,
  );
  const toggle = screen.getByRole("button", { name: "Attachments 2" });
  await expect.element(toggle).toBeVisible();
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  await expect.element(screen.getByText("Two files")).toBeVisible();
  await userEvent.click(toggle);
  await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
  await expect.element(screen.getByText("Two files")).not.toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Add attachment" }))
    .toBeVisible();
  expect(screen.container.querySelector("h3")).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("an expanded section's trigger does not keep the ghost popup-open fill (disclosure-trigger)", async () => {
  const screen = await render(
    <RecordAsideSection collapsible title="Subtasks" count={3}>
      <p>Three subtasks</p>
    </RecordAsideSection>,
  );
  const toggle = screen
    .getByRole("button", { name: "Subtasks 3" })
    .element() as HTMLButtonElement;
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  // This lane compiles no CSS: the contract is the shared recipe's literal on the trigger,
  // the same one SectionToggle carries.
  expect(toggle.className.split(/\s+/)).toContain(
    "aria-expanded:not-hover:bg-transparent",
  );
});

test("an empty collapsible section is its header alone", async () => {
  const screen = await render(
    <RecordAsideSection
      collapsible
      title="Related"
      count={0}
      notice={<p>Drop here</p>}
    >
      <p>never</p>
    </RecordAsideSection>,
  );
  await expect
    .element(screen.getByRole("heading", { name: "Related 0" }))
    .toBeVisible();
  expect(screen.container.querySelector("[aria-expanded]")).toBeNull();
  await expect.element(screen.getByText("Drop here")).toBeVisible();
  expect(screen.container.textContent).not.toContain("never");
});
