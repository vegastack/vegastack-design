import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeAll, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import {
  ChatComposer,
  ChatComposerNotice,
  type ChatComposerHandle,
  type ChatComposerProps,
} from "./chat-composer";
import { preloadTextEdit } from "./text-edit";
import "../../test/geometry.css";

beforeAll(() => preloadTextEdit());

const box = () => page.getByRole("textbox", { name: "Message" });
const send = () => page.getByRole("button", { name: "Send" });

/** Click into the box and wait for the editor, so the keys that follow reach it. */
async function typeInto(text: string) {
  await userEvent.click(box());
  await vi.waitFor(() =>
    expect(document.activeElement?.className).toContain("ProseMirror"),
  );
  await userEvent.keyboard(text);
}

const mount = (props: ChatComposerProps = {}) =>
  render(<ChatComposer placeholder="Ask anything" {...props} />);

test("Enter sends and clears; Shift+Enter breaks the line", async () => {
  const onSubmit = vi.fn();
  const onValueChange = vi.fn();
  await mount({ onSubmit, onValueChange });
  await typeInto("Hello{Shift>}{Enter}{/Shift}there");
  expect(onSubmit).not.toHaveBeenCalled();
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toBe("Hello\\\nthere");
  await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(""));
  await expect.element(box()).toHaveTextContent("");
});

test("an empty box sends nothing, unless something is attached", async () => {
  const onSubmit = vi.fn();
  const screen = await mount({ onSubmit });
  await expect.element(send()).toHaveAttribute("aria-disabled", "true");
  await typeInto("{Enter}");
  expect(onSubmit).not.toHaveBeenCalled();
  await screen.rerender(<ChatComposer onSubmit={onSubmit} hasAttachments />);
  await send().click();
  expect(onSubmit).toHaveBeenCalledWith("");
});

test("Send is the Stop button while the agent answers, and typing carries on", async () => {
  const onSubmit = vi.fn();
  const onStop = vi.fn();
  const screen = await mount({ onSubmit, onStop, status: "streaming" });
  const stop = page.getByRole("button", { name: "Stop" });
  await expect.element(stop).toBeVisible();
  expect(
    screen.container.querySelector("[data-slot=chat-composer-send]"),
  ).toBeNull();
  await typeInto("Next question{Enter}");
  await expect.element(box()).toHaveTextContent("Next question");
  expect(onSubmit).not.toHaveBeenCalled();
  await stop.click();
  expect(onStop).toHaveBeenCalledTimes(1);
  await screen.rerender(
    <ChatComposer onSubmit={onSubmit} onStop={onStop} status="idle" />,
  );
  await expect.element(send()).toBeVisible();
});

test("a streaming box the viewer can't stop keeps Send, held", async () => {
  await mount({ status: "streaming" });
  await expect.element(send()).toHaveAttribute("aria-disabled", "true");
});

test("a rejected send puts the text back and says so", async () => {
  const onSubmit = vi.fn(() => Promise.reject(new Error("HTTP 500")));
  await mount({ onSubmit });
  await typeInto("Keep me{Enter}");
  await expect
    .element(page.getByRole("alert"))
    .toHaveTextContent("Couldn't send. Try again.");
  await expect.element(box()).toHaveTextContent("Keep me");
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toBe("Keep me"),
  );
});

test("a synchronous throw puts the text back too", async () => {
  const onSubmit = vi.fn(() => {
    throw new Error("No");
  });
  await mount({ onSubmit });
  await typeInto("Keep me{Enter}");
  await expect.element(page.getByRole("alert")).toBeVisible();
  await expect.element(box()).toHaveTextContent("Keep me");
});

test("resolving false puts the text back with no error", async () => {
  const onSubmit = vi.fn(async () => false);
  await mount({ onSubmit });
  await typeInto("Ask first{Enter}");
  await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
  await expect.element(box()).toHaveTextContent("Ask first");
  expect(document.querySelector("[role=alert]")).toBeNull();
});

test("the box stays live while a send is pending, and a failure loses neither text", async () => {
  let fail = (_: Error) => {};
  const onSubmit = vi.fn(
    () => new Promise<void>((_, reject) => (fail = reject)),
  );
  const screen = await mount({ onSubmit });
  await typeInto("First{Enter}");
  await vi.waitFor(() =>
    expect(send().element().getAttribute("data-loading")).not.toBeNull(),
  );
  await expect.element(box()).toHaveTextContent("");
  await vi.waitFor(() =>
    expect(document.activeElement?.className).toContain("ProseMirror"),
  );
  await userEvent.keyboard("Second{Enter}");
  expect(onSubmit).toHaveBeenCalledTimes(1);
  await expect.element(box()).toHaveTextContent("Second");
  fail(new Error("No"));
  await expect.element(page.getByRole("alert")).toBeVisible();
  await vi.waitFor(() => {
    const text = screen.container.querySelector("[role=textbox]")!.textContent;
    expect(text).toContain("First");
    expect(text).toContain("Second");
  });
});

test("without onSubmit nothing is cleared", async () => {
  await mount({ defaultValue: "Draft" });
  await typeInto("{Enter}");
  await expect.element(box()).toHaveTextContent("Draft");
  await expect.element(send()).toHaveAttribute("aria-disabled", "true");
});

test("a box of spaces sends nothing, and edges are trimmed", async () => {
  const onSubmit = vi.fn();
  await mount({ onSubmit });
  await typeInto("   {Enter}");
  expect(onSubmit).not.toHaveBeenCalled();
  await userEvent.keyboard("Hello{Enter}");
  await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Hello"));
});

test("a held Send says why under the box and keeps the text", async () => {
  const onSubmit = vi.fn();
  const screen = await mount({
    onSubmit,
    defaultValue: "Draft",
    submitDisabled: true,
    submitDisabledReason: "datasheet.pdf is still uploading",
  });
  await expect.element(send()).toHaveAttribute("aria-disabled", "true");
  const line = screen.container.querySelector(
    "[data-slot=chat-composer-held]",
  )!;
  expect(line.textContent).toBe("datasheet.pdf is still uploading");
  expect(box().element().getAttribute("aria-describedby")).toContain(line.id);
  await typeInto("{Enter}");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("the placeholder follows the prop while the box is empty", async () => {
  const screen = await mount({ placeholder: "Ask a follow-up…" });
  await userEvent.click(box());
  await screen.rerender(<ChatComposer placeholder="Answer Bob…" />);
  await vi.waitFor(() =>
    expect(
      screen.container
        .querySelector("[data-placeholder]")
        ?.getAttribute("data-placeholder"),
    ).toBe("Answer Bob…"),
  );
});

test("text pasted with a picture of it stays text; a plain file goes to onFiles", async () => {
  const onFiles = vi.fn();
  await mount({ onFiles });
  await typeInto("x");
  const paste = (data: DataTransfer) =>
    document.activeElement!.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
  const both = new DataTransfer();
  both.setData("text/plain", "A1 B1");
  both.items.add(new File(["x"], "cells.png", { type: "image/png" }));
  paste(both);
  expect(onFiles).not.toHaveBeenCalled();
  const file = new DataTransfer();
  file.items.add(new File(["x"], "shot.png", { type: "image/png" }));
  paste(file);
  await vi.waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
});

test("↑ in the empty box brings back the last message, and only there", async () => {
  const onEditLast = vi.fn();
  await mount({ onEditLast });
  await typeInto("{ArrowUp}");
  expect(onEditLast).toHaveBeenCalledTimes(1);
  await userEvent.keyboard("text{ArrowUp}");
  expect(onEditLast).toHaveBeenCalledTimes(1);
});

test("↑ on a button stays the button's", async () => {
  const onEditLast = vi.fn();
  await mount({ onEditLast, onAttach: () => {} });
  (
    page.getByRole("button", { name: "Add files" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowUp}");
  expect(onEditLast).not.toHaveBeenCalled();
});

test("the handle fills the box and focuses it", async () => {
  const handle = React.createRef<ChatComposerHandle>();
  const onValueChange = vi.fn();
  await mount({ handleRef: handle, onValueChange, onSubmit: () => {} });
  handle.current!.setValue("Plan my day");
  await expect.element(box()).toHaveTextContent("Plan my day");
  expect(onValueChange).toHaveBeenLastCalledWith("Plan my day");
  await expect.element(send()).not.toHaveAttribute("aria-disabled", "true");
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toBe("Plan my day"),
  );
});

test("chips sit in the box above the text; the hint and error describe it", async () => {
  const screen = await mount({
    chips: <Button size="xs">SR-12</Button>,
    hint: "Only you can see this chat",
    error: "That failed.",
  });
  const chips = screen.container.querySelector(
    "[data-slot=chat-composer-chips]",
  )!;
  const editor = screen.container.querySelector("[role=textbox]")!;
  expect(
    chips.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const described = box().element().getAttribute("aria-describedby")!;
  expect(described.split(" ")).toHaveLength(2);
  await expectNoA11yViolations(screen.container);
});

test("the 📎 button belongs to the host; files dropped reach onFiles", async () => {
  const onAttach = vi.fn();
  const onFiles = vi.fn();
  const screen = await mount({ onAttach, onFiles });
  await page.getByRole("button", { name: "Add files" }).click();
  expect(onAttach).toHaveBeenCalledTimes(1);
  const data = new DataTransfer();
  data.items.add(new File(["x"], "a.txt", { type: "text/plain" }));
  const target = screen.container.querySelector(
    "[data-slot=chat-composer-box]",
  )!;
  target.dispatchEvent(
    new DragEvent("dragenter", { bubbles: true, dataTransfer: data }),
  );
  await expect.element(page.getByText("Drop to add to chat")).toBeVisible();
  target.dispatchEvent(
    new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: data,
    }),
  );
  await vi.waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
  expect(onFiles.mock.calls[0]![0][0].name).toBe("a.txt");
  expect(
    screen.container.querySelector("[data-slot=chat-composer-drop]"),
  ).toBeNull();
});

test("a drop type the host takes reaches onDropData", async () => {
  const onDropData = vi.fn();
  const screen = await mount({ dropTypes: ["text/x-record"], onDropData });
  const data = new DataTransfer();
  data.setData("text/x-record", "task:12");
  screen.container
    .querySelector("[data-slot=chat-composer-box]")!
    .dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
      }),
    );
  await vi.waitFor(() => expect(onDropData).toHaveBeenCalledTimes(1));
});

test("@ opens the mention menu, after a word too", async () => {
  const search = vi.fn(async () => [
    { kind: "agent", id: "a1", label: "BOQ processor" },
  ]);
  await mount({
    mentions: {
      kinds: [{ id: "agent", noun: "Agent", plural: "Agents", order: 0 }],
      search,
    },
  });
  await page.getByRole("button", { name: "Mention" }).click();
  await vi.waitFor(() => expect(search).toHaveBeenCalled());
  await expect.element(page.getByText("BOQ processor")).toBeVisible();
  await userEvent.keyboard("{Enter}");
  await expect.element(box()).toHaveTextContent("BOQ processor");
  await userEvent.keyboard("hello");
  await page.getByRole("button", { name: "Mention" }).click();
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="suggestion-menu"]'),
    ).not.toBeNull(),
  );
});

test("disabled turns the whole box off", async () => {
  const screen = await mount({
    disabled: true,
    onAttach: () => {},
    defaultValue: "Draft",
  });
  await expect.element(send()).toHaveAttribute("aria-disabled", "true");
  await expect
    .element(page.getByRole("button", { name: "Add files" }))
    .toHaveAttribute("aria-disabled", "true");
  await expectNoA11yViolations(screen.container);
});

test("no slash menu in a chat", async () => {
  await mount();
  await typeInto("/");
  await expect.element(box()).toHaveTextContent("/");
  await new Promise((done) => setTimeout(done, 150));
  expect(document.querySelector("[data-slot=suggestion-menu]")).toBeNull();
});

test("the box stops growing at about eight lines", async () => {
  const screen = await mount({ defaultValue: "x\n\n".repeat(30) });
  await vi.waitFor(() =>
    expect(screen.container.querySelector("[role=textbox]")).not.toBeNull(),
  );
  const height = screen.container
    .querySelector("[data-slot=text-edit]")!
    .getBoundingClientRect().height;
  // 10rem of text, the padding and the toolbar.
  expect(height).toBeLessThanOrEqual(212);
});

test("Enter stays a line in a code block, and ``` then Enter opens one", async () => {
  const onSubmit = vi.fn();
  const screen = await mount({ onSubmit });
  await typeInto("```js{Enter}");
  await vi.waitFor(() =>
    expect(screen.container.querySelector("pre")).not.toBeNull(),
  );
  await userEvent.keyboard("a{Enter}b");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("on a coarse pointer return breaks the line and the button sends", async () => {
  const media = window.matchMedia;
  window.matchMedia = ((query: string) =>
    query === "(pointer: coarse)"
      ? { matches: true, addEventListener() {}, removeEventListener() {} }
      : media.call(window, query)) as typeof window.matchMedia;
  try {
    const onSubmit = vi.fn();
    await mount({ onSubmit });
    await typeInto("One{Enter}two");
    expect(onSubmit).not.toHaveBeenCalled();
    await send().click();
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  } finally {
    window.matchMedia = media;
  }
});

test("a drag that crosses children keeps the highlight until it leaves", async () => {
  const onFiles = vi.fn();
  const screen = await mount({ onFiles });
  const target = screen.container.querySelector(
    "[data-slot=chat-composer-box]",
  )!;
  const data = new DataTransfer();
  data.items.add(new File(["x"], "a.txt"));
  const fire = (type: string) =>
    target.dispatchEvent(
      new DragEvent(type, { bubbles: true, dataTransfer: data }),
    );
  fire("dragenter");
  fire("dragenter");
  fire("dragleave");
  await expect.element(page.getByText("Drop to add to chat")).toBeVisible();
  fire("dragleave");
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector("[data-slot=chat-composer-drop]"),
    ).toBeNull(),
  );
});

test("a notice sits on top of the box as part of it, with its action and ✕", async () => {
  const dismiss = vi.fn();
  const screen = await mount({
    notice: (
      <ChatComposerNotice
        action={
          <Button size="xs" variant="secondary">
            Details
          </Button>
        }
        onDismiss={dismiss}
      >
        You've used 90% of this month's budget.
      </ChatComposerNotice>
    ),
  });
  const notice = screen.container.querySelector<HTMLElement>(
    "[data-slot=chat-composer-notice]",
  )!;
  const editor = screen.container.querySelector<HTMLElement>(
    "[data-slot=text-edit]",
  )!;
  expect(notice.getAttribute("role")).toBeNull();
  // Attached: the notice ends where the box begins, the same width, the box's top corners square.
  const a = notice.getBoundingClientRect();
  const b = editor.getBoundingClientRect();
  expect(Math.round(a.bottom)).toBe(Math.round(b.top));
  expect(a.width).toBe(b.width);
  expect(getComputedStyle(editor).borderTopLeftRadius).toBe("0px");
  expect(getComputedStyle(notice).borderBottomWidth).toBe("0px");
  await page.getByRole("button", { name: "Dismiss" }).click();
  expect(dismiss).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("a live notice is a polite status", async () => {
  const screen = await mount({
    notice: (
      <ChatComposerNotice live tone="warning">
        Held.
      </ChatComposerNotice>
    ),
  });
  expect(
    screen.container
      .querySelector("[data-slot=chat-composer-notice]")
      ?.getAttribute("role"),
  ).toBe("status");
});

test("Backspace in the empty box takes the last attachment off; with text it deletes text", async () => {
  const remove = vi.fn();
  await mount({ hasAttachments: true, onRemoveLastAttachment: remove });
  await userEvent.click(box());
  await vi.waitFor(() =>
    expect(document.activeElement?.className).toContain("ProseMirror"),
  );
  await userEvent.keyboard("{Backspace}");
  expect(remove).toHaveBeenCalledOnce();
  await userEvent.keyboard("ab{Backspace}");
  expect(remove).toHaveBeenCalledOnce();
});

test("toolbarStart follows 📎 and toolbarEnd sits just before Send", async () => {
  const screen = await mount({
    onSubmit: () => {},
    onAttach: () => {},
    toolbarStart: <Button size="xs">Plan</Button>,
    toolbarEnd: <Button size="xs">Ring</Button>,
  });
  const order = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="chat-composer-toolbar"] button',
    ),
  ].map((button) => button.getAttribute("aria-label") ?? button.textContent);
  expect(order).toEqual(["Add files", "Plan", "Ring", "Send"]);
  await expectNoA11yViolations(screen.container);
});

test("at a phone's width the end slot keeps Send on the toolbar's line", async () => {
  const screen = await render(
    <div style={{ width: 320 }}>
      <ChatComposer
        onSubmit={() => {}}
        onAttach={() => {}}
        toolbarStart={<Button size="xs">A long mode name that wraps</Button>}
        toolbarEnd={<Button size="xs">Ring</Button>}
      />
    </div>,
  );
  const toolbar = screen.container.querySelector<HTMLElement>(
    '[data-slot="chat-composer-toolbar"]',
  )!;
  const sendBox = send().element().getBoundingClientRect();
  const bar = toolbar.getBoundingClientRect();
  expect(sendBox.right).toBeLessThanOrEqual(bar.right + 0.5);
  expect(sendBox.top).toBeGreaterThanOrEqual(bar.top - 0.5);
  // The start slot gives way: nothing in it paints into the end slot.
  const start = toolbar
    .querySelector<HTMLElement>('[data-slot="chat-composer-toolbar-start"]')!
    .getBoundingClientRect();
  const end = toolbar
    .querySelector<HTMLElement>('[data-slot="chat-composer-toolbar-end"]')!
    .getBoundingClientRect();
  expect(start.right).toBeLessThanOrEqual(end.left + 0.5);
  const chip = toolbar
    .querySelector<HTMLElement>(
      '[data-slot="chat-composer-toolbar-start"] > *',
    )!
    .getBoundingClientRect();
  expect(chip.right).toBeLessThanOrEqual(start.right + 0.5);
});
