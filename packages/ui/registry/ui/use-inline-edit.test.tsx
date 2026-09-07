import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { useInlineEdit, type UseInlineEditOptions } from "./use-inline-edit";

/**
 * A minimal host with the exact shape the hook is designed for: a display element that
 * opens the edit, and a text input bound to the draft. Deliberately NOT `FieldInline` —
 * the hook's contract has to hold on its own, or the machine is not really shared.
 */
function Host({
  value,
  onCommit,
  editing,
  onEditingChange,
  disabled,
  trim,
}: UseInlineEditOptions) {
  const edit = useInlineEdit({
    value,
    onCommit,
    editing,
    onEditingChange,
    disabled,
    trim,
  });
  return edit.isEditing ? (
    <input
      ref={edit.editRef}
      aria-label="Editor"
      value={edit.draft}
      onChange={(event) => edit.setDraft(event.target.value)}
      onBlur={edit.commit}
      onKeyDown={edit.onKeyDown}
    />
  ) : (
    <span
      ref={edit.displayRef}
      role="button"
      tabIndex={0}
      onClick={edit.start}
      data-testid="display"
    >
      {value || "Empty"}
    </span>
  );
}

async function openEditor(screen: Awaited<ReturnType<typeof render>>) {
  await screen.getByTestId("display").click();
  const editor = screen.getByRole("textbox", { name: "Editor" });
  await expect.element(editor).toBeInTheDocument();
  return editor;
}

test("clicking the display opens the editor seeded with the value", async () => {
  const screen = await render(<Host value="Ada" onCommit={vi.fn()} />);
  const editor = await openEditor(screen);
  await expect.element(editor).toHaveValue("Ada");
});

test("Enter commits the changed draft exactly once", async () => {
  const onCommit = vi.fn();
  const screen = await render(<Host value="Ada" onCommit={onCommit} />);
  const editor = await openEditor(screen);

  await editor.fill("Grace");
  await userEvent.keyboard("{Enter}");

  expect(onCommit).toHaveBeenCalledTimes(1);
  expect(onCommit).toHaveBeenCalledWith("Grace");
  await expect.element(screen.getByTestId("display")).toBeInTheDocument();
});

test("an unchanged draft commits nothing", async () => {
  const onCommit = vi.fn();
  const screen = await render(<Host value="Ada" onCommit={onCommit} />);
  await openEditor(screen);
  await userEvent.keyboard("{Enter}");
  expect(onCommit).not.toHaveBeenCalled();
});

test("Escape cancels without committing and reverts the draft", async () => {
  const onCommit = vi.fn();
  const screen = await render(<Host value="Ada" onCommit={onCommit} />);
  const editor = await openEditor(screen);

  await editor.fill("Grace");
  await userEvent.keyboard("{Escape}");

  expect(onCommit).not.toHaveBeenCalled();
  const reopened = await openEditor(screen);
  await expect.element(reopened).toHaveValue("Ada");
});

test("a keyboard close returns focus to the display; a commit from blur does not", async () => {
  const onCommit = vi.fn();
  const screen = await render(<Host value="Ada" onCommit={onCommit} />);
  const editor = await openEditor(screen);

  await editor.fill("Grace");
  await userEvent.keyboard("{Enter}");
  const display = screen.getByTestId("display");
  await vi.waitFor(() =>
    expect(document.activeElement).toBe(display.element()),
  );

  // Reopen, then close by moving focus away — the user has already gone somewhere
  // else, so stealing focus back would be a trap.
  await openEditor(screen);
  await userEvent.keyboard("Hopper");
  (document.activeElement as HTMLElement)?.blur();
  await expect.element(screen.getByTestId("display")).toBeInTheDocument();
  expect(document.activeElement).not.toBe(
    screen.getByTestId("display").element(),
  );
});

test("trim is on by default", async () => {
  const onCommit = vi.fn();
  const screen = await render(<Host value="Ada" onCommit={onCommit} />);
  const editor = await openEditor(screen);
  await editor.fill("  Grace  ");
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledWith("Grace");
});

test("trim={false} commits the raw draft", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <Host value="Ada" onCommit={onCommit} trim={false} />,
  );
  const editor = await openEditor(screen);
  await editor.fill("  Grace  ");
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledWith("  Grace  ");
});

test("a controlled host flipping editing on seeds the draft and re-arms the guard", async () => {
  // The drift between the two hand-rolled copies: only one of them did this, so a
  // grid that drove edit mode from its own keyboard model could commit a stale draft.
  const onCommit = vi.fn();
  function Controlled() {
    const [editing, setEditing] = React.useState(false);
    return (
      <>
        <button type="button" onClick={() => setEditing(true)}>
          Open
        </button>
        <Host
          value="Ada"
          onCommit={onCommit}
          editing={editing}
          onEditingChange={setEditing}
        />
      </>
    );
  }
  const screen = await render(<Controlled />);
  await screen.getByRole("button", { name: "Open" }).click();

  const editor = screen.getByRole("textbox", { name: "Editor" });
  await expect.element(editor).toHaveValue("Ada");

  await editor.fill("Grace");
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledTimes(1);
  expect(onCommit).toHaveBeenCalledWith("Grace");
});

test("disabled blocks opening the edit", async () => {
  const screen = await render(<Host value="Ada" onCommit={vi.fn()} disabled />);
  await screen.getByTestId("display").click();
  await expect.element(screen.getByTestId("display")).toBeInTheDocument();
  expect(
    screen.container.querySelector('input[aria-label="Editor"]'),
  ).toBeNull();
});

test("disabling mid-edit reverts rather than silently committing", async () => {
  // The button suppresses its own mousedown so focus never leaves the editor — otherwise
  // blur would commit first and this would prove nothing. `disabled` arriving while an edit
  // is open must revert, exactly as Escape does: never a silent commit of a value the user
  // is no longer allowed to set.
  const onCommit = vi.fn();
  function Toggling() {
    const [disabled, setDisabled] = React.useState(false);
    return (
      <>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setDisabled(true)}
        >
          Lock
        </button>
        <Host value="Ada" onCommit={onCommit} disabled={disabled} />
      </>
    );
  }
  const screen = await render(<Toggling />);
  const editor = await openEditor(screen);
  await editor.fill("Grace");

  await screen.getByRole("button", { name: "Lock" }).click();

  await expect.element(screen.getByTestId("display")).toBeInTheDocument();
  expect(onCommit).not.toHaveBeenCalled();
  await expect.element(screen.getByTestId("display")).toHaveTextContent("Ada");
});

test("a value change from outside an edit reaches the next draft", async () => {
  function External() {
    const [value, setValue] = React.useState("Ada");
    return (
      <>
        <button type="button" onClick={() => setValue("Grace")}>
          Rename
        </button>
        <Host value={value} onCommit={vi.fn()} />
      </>
    );
  }
  const screen = await render(<External />);
  await screen.getByRole("button", { name: "Rename" }).click();
  const editor = await openEditor(screen);
  await expect.element(editor).toHaveValue("Grace");
});

test("onCommit is optional — a mode-only editor still opens and closes", async () => {
  function ModeOnly() {
    const edit = useInlineEdit({ value: "Ada" });
    return (
      <button
        type="button"
        onClick={() => edit.setEditing(!edit.isEditing)}
        data-editing={edit.isEditing ? "" : undefined}
      >
        Toggle
      </button>
    );
  }
  const screen = await render(<ModeOnly />);
  const toggle = screen.getByRole("button", { name: "Toggle" });
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("data-editing");
});
