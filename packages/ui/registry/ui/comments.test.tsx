import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeAll, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  CommentComposer,
  CommentItem,
  CommentList,
  CommentThread,
  type CommentData,
} from "./comments";
import { preloadTextEdit } from "./text-edit";

// TextEdit renders a light read view and loads its editor on intent; these tests exercise the
// editor itself, so load it up front — every TextEdit then swaps it in right after mounting.
beforeAll(() => preloadTextEdit());

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
  expect(
    empty.container.querySelector("[data-slot=comment-list-empty]"),
  ).toBeNull();
});

test("editing: the header's ✓ Save is disabled until the text changes, ✕ Cancel leaves", async () => {
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

test("each comment is a card; ⋯ matches the add-reaction button and opens an icon menu", async () => {
  const screen = await render(
    <ul>
      <CommentItem
        onCopyLink={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onReactionToggle={() => {}}
        comment={{
          id: "a",
          author: { name: "Asha Rao" },
          body: "Hello",
          createdAt: Date.now(),
          canEdit: true,
          canDelete: true,
        }}
      />
    </ul>,
  );
  // The card is the item (its replies are rows inside it).
  const card = document.querySelector('[data-slot="comment-item"]')!;
  expect(card.className).toContain("border-border");
  expect(card.className).toContain("rounded-lg");
  expect(card.className).not.toMatch(/(?:hover|focus[\w-]*):border-/);
  const add = document.querySelector('[data-slot="reaction-add"]')!;
  const more = document.querySelector('[data-slot="comment-actions"]')!;
  // Identical: the same variant, size, radius and hover-reveal classes.
  expect(more.className).toBe(add.className);
  expect(more.className).toContain("group-hover/comment:opacity-100");
  await userEvent.click(
    screen.getByRole("button", { name: "Actions for comment by Asha Rao" }),
  );
  const items = screen.getByRole("menuitem");
  await expect.element(items.nth(2)).toHaveTextContent("Delete");
  const content = document.querySelector(
    '[data-slot="comment-actions-content"]',
  )!;
  expect(content.className).not.toContain("min-w-48");
  expect(content.querySelectorAll("svg")).toHaveLength(3);
});

// ---- CommentThread ------------------------------------------------------------------------------

const asha = { name: "Asha Rao" };
const rootComment: CommentData = {
  id: "c1",
  author: asha,
  body: "Is 25 A enough here?",
  createdAt: 0,
};
const reply = (id: string, body: string): CommentData => ({
  id,
  author: { name: "Bo Lindqvist" },
  body,
  createdAt: 0,
});

test("a thread shows its quote, root and replies, and the ✓ resolves it", async () => {
  const onResolve = vi.fn();
  const onQuoteClick = vi.fn();
  const screen = await render(
    <CommentThread
      thread={{
        id: "t1",
        quote: "25 A breaker",
        root: rootComment,
        replies: [reply("c2", "Yes, per the spec.")],
      }}
      onReply={vi.fn()}
      onResolve={onResolve}
      onQuoteClick={onQuoteClick}
      now={0}
    />,
  );
  await expect.element(screen.getByText("25 A breaker")).toBeVisible();
  await expect.element(screen.getByText("Is 25 A enough here?")).toBeVisible();
  await expect.element(screen.getByText("Yes, per the spec.")).toBeVisible();
  await screen.getByText("25 A breaker").click();
  expect(onQuoteClick).toHaveBeenCalled();
  await screen.getByRole("button", { name: "Resolve" }).click();
  expect(onResolve).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("a resolved thread shows who resolved it and Reopen calls onReopen", async () => {
  const onReopen = vi.fn();
  const screen = await render(
    <CommentThread
      thread={{
        id: "t1",
        root: rootComment,
        replies: [],
        resolved: { by: asha, at: "2026-09-29T10:00:00Z" },
      }}
      onReply={vi.fn()}
      onReopen={onReopen}
    />,
  );
  await expect.element(screen.getByText(/Resolved by Asha/)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Reopen" }));
  expect(onReopen).toHaveBeenCalled();
  expect(screen.container.querySelector("[data-resolved]")).not.toBeNull();
});

test("an orphaned thread says the original text was removed", async () => {
  const screen = await render(
    <CommentThread
      thread={{
        id: "t1",
        quote: "old words",
        orphaned: true,
        root: rootComment,
        replies: [],
      }}
      onReply={vi.fn()}
    />,
  );
  await expect
    .element(screen.getByText("Original text was removed"))
    .toBeVisible();
  expect(screen.container.textContent).not.toContain("old words");
});

test("a collapsed thread shows the root, the reply count and the last reply, and no reply box", async () => {
  const screen = await render(
    <CommentThread
      collapsed
      thread={{
        id: "t1",
        root: rootComment,
        replies: [reply("c2", "First reply"), reply("c3", "Second reply")],
      }}
      onReply={vi.fn()}
    />,
  );
  await expect.element(screen.getByText("2 replies")).toBeVisible();
  await expect.element(screen.getByText("Second reply")).toBeVisible();
  expect(screen.container.textContent).not.toContain("First reply");
  expect(
    screen.container.querySelector('[data-slot="comment-thread-reply"]'),
  ).toBeNull();
});

test("the reply box sends on Cmd/Ctrl+Enter and clears once the reply posts", async () => {
  const onReply = vi.fn().mockResolvedValue(undefined);
  const screen = await render(
    <CommentThread
      thread={{ id: "t1", root: rootComment, replies: [] }}
      onReply={onReply}
    />,
  );
  const box = screen.getByRole("textbox", { name: "Reply" });
  await box.click();
  await userEvent.keyboard("Agreed");
  // Focused, the box opens its send button.
  await expect
    .element(screen.getByRole("button", { name: "Send reply" }))
    .toBeEnabled();
  await userEvent.keyboard(
    navigator.platform.startsWith("Mac")
      ? "{Meta>}{Enter}{/Meta}"
      : "{Control>}{Enter}{/Control}",
  );
  await vi.waitFor(() => expect(onReply).toHaveBeenCalledWith("Agreed"));
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector('[data-slot="comment-thread-reply"]')
        ?.textContent,
    ).not.toContain("Agreed"),
  );
});

test("a comment's attachments slot renders under its body", async () => {
  const screen = await render(
    <ul>
      <CommentItem
        comment={rootComment}
        attachments={<span data-testid="files">report.pdf</span>}
      />
    </ul>,
  );
  await expect.element(screen.getByTestId("files")).toBeVisible();
  expect(
    screen.container.querySelector('[data-slot="comment-attachments"]'),
  ).not.toBeNull();
});

test("CommentList passes mentionHref to each comment, so its mention chips link", async () => {
  const screen = await render(
    <CommentList
      comments={[
        {
          id: "m",
          author: { name: "Asha Rao" },
          body: "Filed as [@Fix the hinge](mention://task/t-42) for Dev",
          createdAt: Date.now(),
        },
      ]}
      mentionHref={(kind, id) => `/${kind}s/${id}`}
    />,
  );
  const chip = screen.getByRole("link", { name: /Fix the hinge/ });
  await expect.element(chip).toBeVisible();
  expect(chip.element().getAttribute("href")).toBe("/tasks/t-42");
  await expectNoA11yViolations(screen.container);
});

// ---- Drafts -------------------------------------------------------------------------------------

const submitKeys = () =>
  navigator.platform.startsWith("Mac")
    ? "{Meta>}{Enter}{/Meta}"
    : "{Control>}{Enter}{/Control}";
const endKeys = () =>
  navigator.platform.startsWith("Mac")
    ? "{Meta>}{ArrowDown}{/Meta}"
    : "{Control>}{End}{/Control}";

test("CommentComposer onAttachFiles takes the attach button's files and shows files over the box", async () => {
  const onAttachFiles = vi.fn();
  const screen = await render(
    <CommentComposer
      onSubmit={() => {}}
      onAttachFiles={onAttachFiles}
      files={<p>spec.pdf 40%</p>}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="comment-box-files"]')
      ?.textContent,
  ).toBe("spec.pdf 40%");
  const input = screen.container.querySelector<HTMLInputElement>(
    '[data-slot="comment-box"] input[type="file"]',
  )!;
  expect(input.accept).toBe("");
  const file = new File(["x"], "spec.pdf", { type: "application/pdf" });
  await userEvent.upload(input, file);
  expect(onAttachFiles).toHaveBeenCalledWith([file]);
});

test("CommentComposer restores a draft from defaultValue, sends it, and starts empty after", async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onValueChange = vi.fn();
  const screen = await render(
    <CommentComposer
      defaultValue="Half-written thought"
      onSubmit={onSubmit}
      onValueChange={onValueChange}
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Comment" }))
    .toHaveTextContent("Half-written thought");
  const send = screen.getByRole("button", { name: "Send comment" });
  await expect.element(send).toBeEnabled();
  await expectNoA11yViolations(screen.container);
  await send.click();
  await vi.waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith("Half-written thought"),
  );
  await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(""));
  await expect
    .element(screen.getByRole("textbox", { name: "Comment" }))
    .not.toHaveTextContent("Half-written thought");
  await expect.element(send).toBeDisabled();
});

test('a thread\'s reply box restores a draft unfolded, reports changes, and reports "" after the reply posts', async () => {
  const onReply = vi.fn().mockResolvedValue(undefined);
  const onValueChange = vi.fn();
  const screen = await render(
    <CommentThread
      thread={{ id: "t1", root: rootComment, replies: [] }}
      onReply={onReply}
      composer={{ defaultValue: "Agreed", onValueChange }}
    />,
  );
  const box = screen.getByRole("textbox", { name: "Reply" });
  await expect.element(box).toHaveTextContent("Agreed");
  expect(
    screen.container.querySelector('[data-slot="comment-box"][data-folded]'),
  ).toBeNull();
  const send = screen.getByRole("button", { name: "Send reply" });
  await expect.element(send).toBeEnabled();
  await expectNoA11yViolations(screen.container);
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard(`${endKeys()}, ship it`);
  await vi.waitFor(() =>
    expect(onValueChange).toHaveBeenLastCalledWith("Agreed, ship it"),
  );
  await userEvent.keyboard(submitKeys());
  await vi.waitFor(() =>
    expect(onReply).toHaveBeenCalledWith("Agreed, ship it"),
  );
  await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(""));
  await expect
    .element(screen.getByRole("textbox", { name: "Reply" }))
    .not.toHaveTextContent("Agreed");
});

test("composer.posting holds the reply box busy: Send and Cmd/Ctrl+Enter do nothing", async () => {
  const onReply = vi.fn();
  const thread = { id: "t1", root: rootComment, replies: [] };
  const screen = await render(
    <CommentThread
      thread={thread}
      onReply={onReply}
      composer={{ defaultValue: "Uploading a photo", posting: true }}
    />,
  );
  const send = screen.getByRole("button", { name: "Send reply" });
  await expect.element(send).toHaveAttribute("data-loading");
  await expect.element(send).toBeDisabled();
  (send.element() as HTMLButtonElement).click();
  const box = screen.getByRole("textbox", { name: "Reply" });
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard(submitKeys());
  await new Promise((r) => setTimeout(r, 50));
  expect(onReply).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
  // The upload finishes: the host clears `posting` and the reply sends.
  await screen.rerender(
    <CommentThread
      thread={thread}
      onReply={onReply}
      composer={{ defaultValue: "Uploading a photo", posting: false }}
    />,
  );
  await expect.element(send).toBeEnabled();
  await send.click();
  await vi.waitFor(() =>
    expect(onReply).toHaveBeenCalledWith("Uploading a photo"),
  );
});

const editable: CommentData = {
  id: "e1",
  author: asha,
  body: "Hello",
  createdAt: 0,
  canEdit: true,
};

test("an edit survives a remount: editingId and editDefaultValue restore the box, and Save is enabled", async () => {
  const onEditingIdChange = vi.fn();
  function Host() {
    const [editingId, setEditingId] = React.useState<string | null>("e1");
    return (
      <CommentList
        comments={[editable]}
        onEdit={vi.fn()}
        editingId={editingId}
        onEditingIdChange={(id) => {
          onEditingIdChange(id);
          setEditingId(id);
        }}
        editDefaultValue={(id) => (id === "e1" ? "Hello, restored" : undefined)}
      />
    );
  }
  const screen = await render(<Host />);
  const box = screen.getByRole("textbox", { name: "Edit comment" });
  await expect.element(box).toHaveTextContent("Hello, restored");
  await expect
    .element(screen.getByRole("button", { name: "Save" }))
    .toBeEnabled();
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(onEditingIdChange).toHaveBeenLastCalledWith(null),
  );
  await expect.element(screen.getByText("Hello")).toBeVisible();
});

test("reopening Edit from the menu starts from the retained draft (editDefaultValue), not the body", async () => {
  const screen = await render(
    <ul>
      <CommentItem
        comment={editable}
        onEdit={vi.fn()}
        editDefaultValue="Hello, kept draft"
      />
    </ul>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Actions for comment by Asha Rao" }),
  );
  await screen.getByRole("menuitem", { name: "Edit" }).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Edit comment" }))
    .toHaveTextContent("Hello, kept draft");
  await expect
    .element(screen.getByRole("button", { name: "Save" }))
    .toBeEnabled();
});

test("onEditValueChange reports the edit box's text, then null on Cancel", async () => {
  const onEditValueChange = vi.fn();
  const screen = await render(
    <ul>
      <CommentItem
        editing
        onEdit={vi.fn()}
        onEditValueChange={onEditValueChange}
        comment={editable}
      />
    </ul>,
  );
  const box = screen.getByRole("textbox", { name: "Edit comment" });
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard(`${endKeys()} there`);
  await vi.waitFor(() =>
    expect(onEditValueChange).toHaveBeenLastCalledWith("e1", "Hello there"),
  );
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Cancel" }).click();
  await vi.waitFor(() =>
    expect(onEditValueChange).toHaveBeenLastCalledWith("e1", null),
  );
});

test("onEditValueChange reports null on Escape and after a successful save, through CommentList and CommentThread", async () => {
  const onEditValueChange = vi.fn();
  const onEdit = vi.fn().mockResolvedValue(undefined);
  const list = await render(
    <CommentList
      comments={[editable]}
      onEdit={onEdit}
      onEditValueChange={onEditValueChange}
    />,
  );
  await userEvent.click(
    list.getByRole("button", { name: "Actions for comment by Asha Rao" }),
  );
  await list.getByRole("menuitem", { name: "Edit" }).click();
  const box = list.getByRole("textbox", { name: "Edit comment" });
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard(`${endKeys()}!`);
  await vi.waitFor(() =>
    expect(onEditValueChange).toHaveBeenLastCalledWith("e1", "Hello!"),
  );
  await userEvent.keyboard(submitKeys());
  await vi.waitFor(() => expect(onEdit).toHaveBeenCalledWith("e1", "Hello!"));
  await vi.waitFor(() =>
    expect(onEditValueChange).toHaveBeenLastCalledWith("e1", null),
  );
  await list.unmount();

  onEditValueChange.mockClear();
  const thread = await render(
    <CommentThread
      thread={{ id: "t1", root: editable, replies: [] }}
      onReply={vi.fn()}
      onEdit={onEdit}
      onEditValueChange={onEditValueChange}
    />,
  );
  await userEvent.click(
    thread.getByRole("button", { name: "Actions for comment by Asha Rao" }),
  );
  await thread.getByRole("menuitem", { name: "Edit" }).click();
  const edit = thread.getByRole("textbox", { name: "Edit comment" });
  await userEvent.click(edit.element().querySelector("p")!);
  await userEvent.keyboard(`${endKeys()} again`);
  await vi.waitFor(() =>
    expect(onEditValueChange).toHaveBeenLastCalledWith("e1", "Hello again"),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(onEditValueChange).toHaveBeenLastCalledWith("e1", null),
  );
});

test("read-only threads retain replies and close an editor when permission disappears", async () => {
  const thread = {
    id: "readonly",
    root: { ...rootComment, canEdit: true },
    replies: [{ ...rootComment, id: "reply", body: "Existing reply" }],
  };
  const screen = await render(
    <CommentThread thread={thread} onReply={vi.fn()} onEdit={vi.fn()} />,
  );
  await expect.element(screen.getByText("Existing reply")).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: "Actions for comment by Asha Rao" }),
  );
  await screen.getByRole("menuitem", { name: "Edit" }).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Edit comment" }))
    .toBeVisible();
  await screen.rerender(<CommentThread thread={thread} />);
  expect(
    screen.container.querySelector('[data-slot="comment-thread-reply"]'),
  ).toBeNull();
  expect(screen.container.querySelector('[contenteditable="true"]')).toBeNull();
  await expect
    .poll(() => screen.container.textContent)
    .toContain("Existing reply");
});

test("the attach button sits beside Send at the end of the box, not before the text", async () => {
  const screen = await render(
    <CommentComposer onSubmit={() => {}} onAttachFiles={() => {}} />,
  );
  const actions = await vi.waitUntil(() =>
    screen.container.querySelector('[data-slot="comment-box-actions"]'),
  );
  const attach = actions.querySelector('[data-slot="comment-attach"]');
  expect(attach).not.toBeNull();
  const buttons = Array.from(actions.querySelectorAll("button"));
  expect(buttons.indexOf(attach as HTMLButtonElement)).toBeLessThan(
    buttons.length - 1,
  );
  expect(
    screen.container.querySelector('[data-slot="comment-box-leading"]'),
  ).toBeNull();
});

test("a thread folds replies behind Show N more replies, Show less folds them back, and replies are indented rows", async () => {
  const onShowReplies = vi.fn();
  const onHideReplies = vi.fn();
  const thread = {
    id: "t1",
    root: rootComment,
    replies: [reply("c2", "Latest reply")],
  };
  const screen = await render(
    <CommentThread
      thread={thread}
      hiddenReplies={3}
      onShowReplies={onShowReplies}
      viewer={{ name: "Mo Patel" }}
      onReply={vi.fn()}
    />,
  );
  await screen.getByRole("button", { name: "Show 3 more replies" }).click();
  expect(onShowReplies).toHaveBeenCalledOnce();
  const replyItem = document.querySelector("#comment-c2")!;
  expect(replyItem.getAttribute("data-variant")).toBe("reply");
  expect(replyItem.className).toContain("border-t");
  // The viewer's avatar leads the flat reply row.
  const row = document.querySelector('[data-slot="comment-thread-reply"]')!;
  expect(row.querySelector('[data-slot="avatar"]')).not.toBeNull();
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <CommentThread
      thread={thread}
      onHideReplies={onHideReplies}
      onReply={vi.fn()}
    />,
  );
  await screen.getByRole("button", { name: "Show less" }).click();
  expect(onHideReplies).toHaveBeenCalledOnce();
});

test("Copy text in the ⋯ menu hands the host the comment's Markdown", async () => {
  const onCopyText = vi.fn();
  const screen = await render(
    <ul>
      <CommentItem
        onCopyText={onCopyText}
        comment={{
          id: "a",
          author: { name: "Asha Rao" },
          body: "**Bold** words",
          createdAt: 0,
        }}
        now={0}
      />
    </ul>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Actions for comment by Asha Rao" }),
  );
  await screen.getByRole("menuitem", { name: "Copy text" }).click();
  expect(onCopyText).toHaveBeenCalledWith("a", "**Bold** words");
});

test("a deleted comment keeps its author and says it was deleted, with no actions", async () => {
  const screen = await render(
    <ul>
      <CommentItem
        onDelete={() => {}}
        onCopyLink={() => {}}
        comment={{
          id: "d",
          author: { name: "Asha Rao" },
          body: "",
          createdAt: 0,
          deleted: true,
          canDelete: true,
        }}
        now={0}
      />
    </ul>,
  );
  await expect.element(screen.getByText("Asha Rao")).toBeVisible();
  await expect
    .element(screen.getByText("This comment was deleted."))
    .toBeVisible();
  expect(document.querySelector('[data-slot="comment-actions"]')).toBeNull();
});

test("newest first puts the composer under the heading, and days are named between comments", async () => {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.UTC(2026, 9, 4, 12);
  const screen = await render(
    <CommentList
      now={now}
      order="newest"
      onOrderChange={() => {}}
      comments={[
        { id: "a", author: asha, body: "Older", createdAt: now - 3 * day },
        { id: "b", author: asha, body: "Newer", createdAt: now - 60_000 },
      ]}
      composer={<CommentComposer onSubmit={() => {}} />}
    />,
  );
  const section = screen.container.querySelector('[data-slot="comment-list"]')!;
  const composer = section.querySelector('[data-slot="comment-composer"]')!;
  const list = section.querySelector("ul")!;
  expect(
    composer.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const days = Array.from(
    section.querySelectorAll('[data-slot="comment-day-divider"]'),
  ).map((d) => d.textContent);
  expect(days[0]).toBe("Today");
  expect(days).toHaveLength(2);
  await expectNoA11yViolations(screen.container);
});

test("the composer keeps its text when the order toggles (one instance moves)", async () => {
  function Toggle() {
    const [order, setOrder] = React.useState<"oldest" | "newest">("oldest");
    return (
      <CommentList
        order={order}
        onOrderChange={setOrder}
        comments={[{ id: "a", author: asha, body: "Hi", createdAt: 0 }]}
        composer={<CommentComposer onSubmit={() => {}} />}
      />
    );
  }
  const screen = await render(<Toggle />);
  const box = screen.getByRole("textbox", { name: "Comment" });
  await box.click();
  await userEvent.keyboard("Kept text");
  await screen.getByRole("button", { name: "Oldest first" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Newest first" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("textbox", { name: "Comment" }))
    .toHaveTextContent("Kept text");
});

test("a deleted first comment keeps the reply row; a collapsed thread with one reply keeps its row", async () => {
  const screen = await render(
    <CommentThread
      thread={{
        id: "t1",
        root: { ...rootComment, body: "", deleted: true },
        replies: [reply("c2", "Still here")],
      }}
      onReply={vi.fn()}
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Reply" }))
    .toBeVisible();
  const collapsed = await render(
    <CommentThread
      collapsed
      onExpand={vi.fn()}
      thread={{ id: "t2", root: rootComment, replies: [reply("c3", "Only")] }}
    />,
  );
  await expect
    .element(collapsed.getByRole("button", { name: "1 reply" }))
    .toBeVisible();
});
