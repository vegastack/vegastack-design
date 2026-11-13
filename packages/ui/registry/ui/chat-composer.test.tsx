import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeAll, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { ChatMenuItem } from "./chat-menu";
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
  await screen.rerender(
    <ChatComposer
      onSubmit={onSubmit}
      attachments={[{ id: "f", name: "a.pdf", mediaType: "application/pdf" }]}
    />,
  );
  await send().click();
  expect(onSubmit).toHaveBeenCalledWith("");
});

test("Send is the Stop button while the agent answers, and typing carries on", async () => {
  const onSubmit = vi.fn();
  const onStop = vi.fn();
  const screen = await mount({ onSubmit, onStop, state: "running" });
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
    <ChatComposer onSubmit={onSubmit} onStop={onStop} state="idle" />,
  );
  await expect.element(send()).toBeVisible();
});

test("a running box the viewer can't stop keeps Send, held", async () => {
  await mount({ state: "running" });
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
  await expect
    .element(page.getByRole("button", { name: "Sending" }))
    .toHaveAttribute("data-face", "sending");
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

test("a held Send keeps the text", async () => {
  const onSubmit = vi.fn();
  await mount({ onSubmit, defaultValue: "Draft", submitDisabled: true });
  await expect.element(send()).toHaveAttribute("aria-disabled", "true");
  await typeInto("{Enter}");
  expect(onSubmit).not.toHaveBeenCalled();
  await expect.element(box()).toHaveTextContent("Draft");
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
  (page.getByRole("button", { name: "Add" }).element() as HTMLElement).focus();
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

test("files and chips sit in the box above the text; the error describes it", async () => {
  const screen = await mount({
    attachments: [{ id: "a", name: "a.pdf", mediaType: "application/pdf" }],
    chips: <Button size="xs">SR-12</Button>,
    error: "That failed.",
  });
  const row = screen.container.querySelector(
    "[data-slot=chat-composer-attachments]",
  )!;
  const editor = screen.container.querySelector("[role=textbox]")!;
  expect(
    row.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(row.querySelector("[data-slot=chat-composer-chips]")).not.toBeNull();
  const described = box().element().getAttribute("aria-describedby")!;
  expect(described.split(" ")).toHaveLength(1);
  await expectNoA11yViolations(screen.container);
});

test("+ without a menu calls the host's picker; files dropped reach onFiles", async () => {
  const onAttach = vi.fn();
  const onFiles = vi.fn();
  const screen = await mount({ onAttach, onFiles });
  await page.getByRole("button", { name: "Add" }).click();
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

test("the handle opens the mention menu, after a word too", async () => {
  const search = vi.fn(async () => [
    { kind: "agent", id: "a1", label: "BOQ processor" },
  ]);
  const handle = React.createRef<ChatComposerHandle>();
  await mount({
    handleRef: handle,
    mentions: {
      kinds: [{ id: "agent", noun: "Agent", plural: "Agents", order: 0 }],
      search,
    },
  });
  handle.current!.openMentionMenu();
  await vi.waitFor(() => expect(search).toHaveBeenCalled());
  await expect.element(page.getByText("BOQ processor")).toBeVisible();
  await userEvent.keyboard("{Enter}");
  await expect.element(box()).toHaveTextContent("BOQ processor");
  await userEvent.keyboard("hello");
  handle.current!.openMentionMenu();
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
    .element(page.getByRole("button", { name: "Add" }))
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

test("the box stops growing at its share of the window", async () => {
  const screen = await mount({ defaultValue: "x\n\n".repeat(60) });
  await vi.waitFor(() =>
    expect(screen.container.querySelector("[role=textbox]")).not.toBeNull(),
  );
  const height = screen.container
    .querySelector("[data-slot=text-edit]")!
    .getBoundingClientRect().height;
  // 35% of the window for the text, plus the padding and the toolbar.
  expect(height).toBeLessThanOrEqual(window.innerHeight * 0.35 + 80);
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

test("a notice sits on the box's top edge, inside its hairline, with its action and ✕", async () => {
  const dismiss = vi.fn();
  const screen = await mount({
    notice: (
      <ChatComposerNotice
        tone="progress"
        action={
          <Button size="xs" variant="ghost">
            Reload
          </Button>
        }
        onDismiss={dismiss}
      >
        Reconnecting — your agent kept working
      </ChatComposerNotice>
    ),
  });
  const notice = screen.container.querySelector<HTMLElement>(
    "[data-slot=chat-composer-notice]",
  )!;
  const frame = screen.container.querySelector<HTMLElement>(
    "[data-slot=chat-composer-box]",
  )!;
  expect(notice.getAttribute("role")).toBeNull();
  expect(frame.contains(notice)).toBe(true);
  expect(notice.querySelector("[data-slot=text-spinner]")).not.toBeNull();
  // Edge to edge on the box's top edge, inside its hairline, with the text below it.
  const a = notice.getBoundingClientRect();
  const editor = screen.container
    .querySelector<HTMLElement>("[data-slot=text-edit]")!
    .getBoundingClientRect();
  expect(Math.round(a.top - editor.top)).toBe(1);
  expect(Math.round(editor.right - a.right)).toBe(1);
  const text = box().element().getBoundingClientRect();
  expect(text.top).toBeGreaterThanOrEqual(a.bottom);
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
  await mount({
    attachments: [
      { id: "a", name: "a.pdf", mediaType: "application/pdf" },
      { id: "b", name: "b.pdf", mediaType: "application/pdf" },
    ],
    onRemoveAttachment: remove,
  });
  await userEvent.click(box());
  await vi.waitFor(() =>
    expect(document.activeElement?.className).toContain("ProseMirror"),
  );
  await userEvent.keyboard("{Backspace}");
  expect(remove).toHaveBeenCalledExactlyOnceWith("b");
  await userEvent.keyboard("ab{Backspace}");
  expect(remove).toHaveBeenCalledOnce();
});

test("Send morphs in place: a spinner while sending, Stop while running, held while stopping", async () => {
  const onStop = vi.fn();
  const screen = await mount({
    onSubmit: () => {},
    onStop,
    defaultValue: "Hi",
    state: "sending",
  });
  const sending = page.getByRole("button", { name: "Sending" });
  await expect.element(sending).toHaveAttribute("data-face", "sending");
  expect(
    sending.element().querySelector("[data-slot=text-spinner]"),
  ).not.toBeNull();
  await screen.rerender(
    <ChatComposer onSubmit={() => {}} onStop={onStop} state="running" />,
  );
  await expect
    .element(page.getByRole("button", { name: "Stop" }))
    .toHaveAttribute("data-face", "stop");
  await screen.rerender(
    <ChatComposer onSubmit={() => {}} onStop={onStop} state="stopping" />,
  );
  const stopping = page.getByRole("button", { name: "Stopping" });
  await expect.element(stopping).toHaveAttribute("aria-disabled", "true");
  await expectNoA11yViolations(screen.container);
});

test("while running with queues, Enter steers and a Send stands beside Stop", async () => {
  const onSubmit = vi.fn();
  await mount({ onSubmit, onStop: () => {}, state: "running", queues: true });
  await typeInto("use the 2025 list");
  await expect.element(send()).toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Stop" }))
    .toBeVisible();
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith("use the 2025 list"),
  );
});

test("steers wait above the box; a queued one can be taken back, a read one can't", async () => {
  const cancel = vi.fn();
  const screen = await mount({
    steers: [
      { id: "1", text: "use the 2025 list", state: "queued" },
      { id: "2", text: "skip page 3", state: "read" },
    ],
    onCancelSteer: cancel,
  });
  const list = screen.container.querySelector<HTMLElement>(
    "[data-slot=chat-composer-steers]",
  )!;
  const frame = screen.container.querySelector<HTMLElement>(
    "[data-slot=chat-composer-box]",
  )!;
  expect(
    list.compareDocumentPosition(frame) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await expect.element(page.getByText("read after this step")).toBeVisible();
  await page
    .getByRole("button", { name: "Take back: use the 2025 list" })
    .click();
  expect(cancel).toHaveBeenCalledWith("1");
  expect(
    page.getByRole("button", { name: "Take back: skip page 3" }).query(),
  ).toBeNull();
});

test("attachments: images as thumbnails, files as chips with a middle ellipsis, progress and errors", async () => {
  const remove = vi.fn();
  const retry = vi.fn();
  const screen = await mount({
    attachments: [
      {
        id: "i",
        name: "photo.png",
        mediaType: "image/png",
        thumbUrl:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'/>",
      },
      {
        id: "p",
        name: "quarterly-price-list-for-distributors-final.pdf",
        mediaType: "application/pdf",
      },
      { id: "c", name: "rows.csv", mediaType: "text/csv", progress: 0.42 },
      { id: "e", name: "drawing.dwg", mediaType: "x/dwg", error: "Too large" },
    ],
    onRemoveAttachment: remove,
    onRetryAttachment: retry,
  });
  const items = [
    ...screen.container.querySelectorAll<HTMLElement>(
      "[data-slot=chat-composer-attachment]",
    ),
  ];
  expect(items.map((item) => item.dataset.kind)).toEqual([
    "image",
    "file",
    "file",
    "file",
  ]);
  expect(items[0]!.getBoundingClientRect().width).toBe(56);
  expect(items[1]!.textContent).toContain("…");
  expect(items[1]!.textContent).toContain("final.pdf");
  expect(items[2]!.textContent).toContain("42%");
  expect(
    items[2]!.querySelector("[data-slot=chat-composer-attachment-progress]"),
  ).not.toBeNull();
  expect(items[3]!.dataset.state).toBe("error");
  await page.getByRole("button", { name: "Try drawing.dwg again" }).click();
  expect(retry).toHaveBeenCalledWith("e");
  await page.getByRole("button", { name: "Remove rows.csv" }).click();
  expect(remove).toHaveBeenCalledWith("c");
  await expectNoA11yViolations(screen.container);
});

test("+ opens the add menu above the box", async () => {
  const upload = vi.fn();
  await mount({
    addMenu: <ChatMenuItem onSelect={upload}>Upload files</ChatMenuItem>,
  });
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("menuitem", { name: "Upload files" }).click();
  expect(upload).toHaveBeenCalledOnce();
});

test("at 320px the box keeps + and Send inside it, on one line", async () => {
  const screen = await render(
    <div style={{ width: 320 }}>
      <ChatComposer onSubmit={() => {}} onAttach={() => {}} />
    </div>,
  );
  const frame = screen.container
    .querySelector<HTMLElement>("[data-slot=chat-composer-box]")!
    .getBoundingClientRect();
  const sendBox = send().element().getBoundingClientRect();
  const plus = page
    .getByRole("button", { name: "Add" })
    .element()
    .getBoundingClientRect();
  expect(sendBox.right).toBeLessThanOrEqual(frame.right);
  expect(Math.round(sendBox.top)).toBe(Math.round(plus.top));
  expect(sendBox.width).toBe(32);
});

test("one steer at a time: a pending one holds Send, and stopping takes none", async () => {
  let settle: () => void = () => {};
  const onSubmit = vi.fn(() => new Promise<void>((r) => (settle = r)));
  const screen = await mount({
    onSubmit,
    onStop: () => {},
    state: "running",
    queues: true,
    attachments: [{ id: "a", name: "a.pdf", mediaType: "application/pdf" }],
  });
  await send().click();
  expect(onSubmit).toHaveBeenCalledTimes(1);
  (send().element() as HTMLElement).click();
  expect(onSubmit).toHaveBeenCalledTimes(1);
  settle();
  await screen.rerender(
    <ChatComposer
      onSubmit={onSubmit}
      onStop={() => {}}
      state="stopping"
      queues
      defaultValue="more"
    />,
  );
  await typeInto("{Enter}");
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test("a turned-off box takes nothing off and takes no steer back", async () => {
  const remove = vi.fn();
  const cancel = vi.fn();
  await mount({
    disabled: true,
    attachments: [{ id: "a", name: "a.pdf", mediaType: "application/pdf" }],
    onRemoveAttachment: remove,
    steers: [{ id: "1", text: "x", state: "queued" }],
    onCancelSteer: cancel,
  });
  await expect
    .element(page.getByRole("button", { name: "Remove a.pdf" }))
    .toHaveAttribute("aria-disabled", "true");
  await expect
    .element(page.getByRole("button", { name: "Take back: x" }))
    .toHaveAttribute("aria-disabled", "true");
  (
    page.getByRole("button", { name: "Remove a.pdf" }).element() as HTMLElement
  ).click();
  expect(remove).not.toHaveBeenCalled();
});
