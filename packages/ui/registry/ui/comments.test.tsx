import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { CommentComposer, CommentItem, CommentList } from "./comments";

test("lists comments with a count, and shows the empty state", async () => {
  const screen = await render(
    <CommentList
      comments={[
        {
          id: "a",
          author: { name: "Asha Rao" },
          body: "Hello",
          createdAt: Date.now(),
        },
      ]}
      composer={<CommentComposer onSubmit={() => {}} />}
    />,
  );
  await expect.element(screen.getByText("Hello")).toBeVisible();
  expect(screen.container.querySelector("#comment-a")).not.toBeNull();
  await expectNoA11yViolations(screen.container);
  const empty = await render(<CommentList comments={[]} />);
  await expect.element(empty.getByText("No comments yet")).toBeVisible();
});

test("editing: round ↑ Save is disabled until the text changes, × Cancel leaves", async () => {
  const onEdit = vi.fn();
  const screen = await render(
    <ul>
      <CommentItem
        editing
        onEditingChange={() => {}}
        onEdit={onEdit}
        comment={{
          id: "a",
          author: { name: "Asha Rao" },
          body: "Hello",
          createdAt: Date.now(),
          canEdit: true,
        }}
      />
    </ul>,
  );
  const save = screen.getByRole("button", { name: "Save" });
  await expect.element(save).toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Cancel" }))
    .toBeEnabled();
  const box = screen.getByRole("textbox", { name: "Edit comment" });
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard(
    navigator.platform.startsWith("Mac")
      ? "{Meta>}{ArrowDown}{/Meta} there"
      : "{Control>}{End}{/Control} there",
  );
  await expect.element(save).toBeEnabled();
  await save.click();
  await vi.waitFor(() =>
    expect(onEdit).toHaveBeenCalledWith("a", "Hello there"),
  );
});

test("reactions: pills under the body and an add-reaction hover action", async () => {
  const onReactionToggle = vi.fn();
  const screen = await render(
    <ul>
      <CommentItem
        comment={{
          id: "r1",
          author: { name: "Neha Kapoor" },
          body: "Shipped.",
          createdAt: 0,
          reactions: [
            {
              emoji: "👍",
              count: 2,
              reacted: false,
              users: [
                { id: "a", name: "Arjun Mehta" },
                { id: "n", name: "Neha Kapoor" },
              ],
            },
          ],
        }}
        onReactionToggle={onReactionToggle}
        now={0}
      />
    </ul>,
  );
  const pill = document.querySelector(
    '[data-slot="reaction-pill"]',
  ) as HTMLElement;
  pill.click();
  expect(onReactionToggle).toHaveBeenCalledWith("r1", "👍");
  // One add button in the hover actions, one after the pills.
  expect(document.querySelectorAll('[data-slot="reaction-add"]')).toHaveLength(
    2,
  );
  await expectNoA11yViolations(screen.container);
});
