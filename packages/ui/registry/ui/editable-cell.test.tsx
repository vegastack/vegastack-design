import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { EditableCell } from "./editable-cell";

function deferred() {
  let resolve!: () => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("displays the value; clicking opens the text editor; Enter commits", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <EditableCell value="Acme" label="Account name" onCommit={onCommit} />,
  );
  await screen.getByRole("button", { name: "Account name" }).click();
  const input = screen.getByRole("textbox", { name: "Account name" });
  await expect.element(input).toBeInTheDocument();
  // FieldInline focus-and-selects the whole value on open — wait for it so
  // typing replaces rather than appends.
  await expect
    .poll(() => (input.element() as HTMLInputElement).selectionEnd)
    .toBe(4);
  await userEvent.keyboard("Globex{Enter}");
  expect(onCommit).toHaveBeenCalledWith("Globex");
});

test("Escape cancels without committing", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <EditableCell value="Acme" label="Account name" onCommit={onCommit} />,
  );
  await screen.getByRole("button", { name: "Account name" }).click();
  await userEvent.keyboard("edited{Escape}");
  expect(onCommit).not.toHaveBeenCalled();
  await expect
    .element(screen.getByRole("button", { name: "Account name" }))
    .toBeInTheDocument();
});

test("committing an unchanged value never engages the async layer", async () => {
  const onCommit = vi.fn(() => Promise.resolve());
  const screen = await render(
    <EditableCell value="Acme" label="Account name" onCommit={onCommit} />,
  );
  await screen.getByRole("button", { name: "Account name" }).click();
  await userEvent.keyboard("{Enter}");
  expect(onCommit).not.toHaveBeenCalled();
  const root = document.querySelector('[data-slot="editable-cell"]')!;
  expect(root.getAttribute("data-status")).toBe("idle");
});

test("a promise-returning commit shows the optimistic value + saving, then saved", async () => {
  const d = deferred();
  const screen = await render(
    <EditableCell
      value="Acme"
      label="Account name"
      onCommit={() => d.promise}
    />,
  );
  await screen.getByRole("button", { name: "Account name" }).click();
  await expect
    .poll(
      () =>
        (
          document.querySelector(
            '[data-slot="editable-cell"] input',
          ) as HTMLInputElement
        )?.selectionEnd,
    )
    .toBe(4);
  await userEvent.keyboard("Globex{Enter}");
  const root = document.querySelector('[data-slot="editable-cell"]')!;
  // Optimistic: the display shows the committed draft while saving.
  await expect
    .element(screen.getByRole("button", { name: "Account name" }))
    .toHaveTextContent("Globex");
  expect(root.getAttribute("data-status")).toBe("saving");
  d.resolve();
  await expect.poll(() => root.getAttribute("data-status")).toBe("saved");
});

test("a rejected commit reverts the display to `value` and announces it", async () => {
  const d = deferred();
  const screen = await render(
    <EditableCell
      value="Acme"
      label="Account name"
      onCommit={() => d.promise}
    />,
  );
  await screen.getByRole("button", { name: "Account name" }).click();
  await expect
    .poll(
      () =>
        (
          document.querySelector(
            '[data-slot="editable-cell"] input',
          ) as HTMLInputElement
        )?.selectionEnd,
    )
    .toBe(4);
  await userEvent.keyboard("Globex{Enter}");
  d.reject(new Error("version_conflict"));
  const root = document.querySelector('[data-slot="editable-cell"]')!;
  await expect.poll(() => root.getAttribute("data-status")).toBe("error");
  // The revert: display snaps back to the persisted value.
  await expect
    .element(screen.getByRole("button", { name: "Account name" }))
    .toHaveTextContent("Acme");
  const status = document.querySelector(
    '[data-slot="editable-cell-status"]',
  ) as HTMLElement;
  expect(status.textContent).toContain("Save failed — value reverted");
});

test("controlled status wins over the internal machine", async () => {
  await render(
    <EditableCell
      value="Acme"
      label="Account name"
      status="saving"
      onCommit={() => {}}
    />,
  );
  const root = document.querySelector('[data-slot="editable-cell"]')!;
  expect(root.getAttribute("data-status")).toBe("saving");
});

test('focusMode="managed" removes the display tab stop; the host opens the editor via `editing`', async () => {
  const onEditingChange = vi.fn();
  const screen = await render(
    <EditableCell
      value="Acme"
      label="Account name"
      focusMode="managed"
      editing={false}
      onEditingChange={onEditingChange}
      onCommit={() => {}}
    />,
  );
  const display = screen
    .getByRole("button", { name: "Account name" })
    .element() as HTMLElement;
  expect(display.tabIndex).toBe(-1);
  // Activation only *requests* edit mode — the host decides.
  display.click();
  expect(onEditingChange).toHaveBeenCalledWith(true);
  expect(
    document.querySelector('[data-slot="editable-cell"] input'),
  ).toBeNull();
  // Host grants it:
  await screen.rerender(
    <EditableCell
      value="Acme"
      label="Account name"
      focusMode="managed"
      editing
      onEditingChange={onEditingChange}
      onCommit={() => {}}
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Account name" }))
    .toBeInTheDocument();
});

test("select editor commits on selection", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <EditableCell
      value="open"
      label="Stage"
      editor={{
        type: "select",
        options: [
          { value: "open", label: "Open" },
          { value: "won", label: "Won" },
        ],
      }}
      onCommit={onCommit}
    />,
  );
  await screen.getByRole("combobox", { name: "Stage" }).click();
  await screen.getByRole("option", { name: "Won" }).click();
  await expect.poll(() => onCommit.mock.calls.length).toBe(1);
  expect(onCommit).toHaveBeenCalledWith("won");
});

test("custom editor renders through the open contract and can commit", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <EditableCell
      value="2026-07-27"
      label="Close date"
      editor={{
        type: "custom",
        render: ({ value, commit, cancel }) => (
          <span data-testid="custom-editor">
            <span>{value}</span>
            <button type="button" onClick={() => commit("2026-08-01")}>
              Set date
            </button>
            <button type="button" onClick={cancel}>
              Cancel
            </button>
          </span>
        ),
      }}
      onCommit={onCommit}
    />,
  );
  await screen.getByRole("button", { name: "Close date" }).click();
  await expect.element(screen.getByTestId("custom-editor")).toBeInTheDocument();
  await screen.getByRole("button", { name: "Set date" }).click();
  expect(onCommit).toHaveBeenCalledWith("2026-08-01");
  // Back to display mode after commit.
  await expect
    .element(screen.getByRole("button", { name: "Close date" }))
    .toBeInTheDocument();
});

test("readOnly renders plain text with no edit affordance", async () => {
  const screen = await render(
    <EditableCell
      value="Acme"
      label="Account name"
      readOnly
      onCommit={() => {}}
    />,
  );
  expect(screen.container.querySelector('[role="button"]')).toBeNull();
  await expect.element(screen.getByText("Acme")).toBeInTheDocument();
});

test("disabled keeps the display visible but blocks editing", async () => {
  const screen = await render(
    <EditableCell
      value="Acme"
      label="Account name"
      disabled
      onCommit={() => {}}
    />,
  );
  const display = screen
    .getByRole("button", { name: "Account name" })
    .element() as HTMLElement;
  expect(display.getAttribute("aria-disabled")).toBe("true");
  expect(display.tabIndex).toBe(-1);
});

test("ref forwards to the root", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(
    <EditableCell
      ref={ref}
      value="Acme"
      label="Account name"
      onCommit={() => {}}
    />,
  );
  expect(ref.current?.dataset.slot).toBe("editable-cell");
});

test("focus: the display element receives the keyboard focus outline (no outline-none without affordance)", async () => {
  const screen = await render(
    <EditableCell value="Acme" label="Account name" onCommit={() => {}} />,
  );
  const display = screen
    .getByRole("button", { name: "Account name" })
    .element() as HTMLElement;
  display.focus();
  expect(document.activeElement).toBe(display);
  // The component must not strip the centralized focus outline.
  expect(display.className).not.toContain("outline-none");
});

test("no a11y violations — display, edit, saving, error states", async () => {
  const screen = await render(
    <EditableCell value="Acme" label="Account name" onCommit={() => {}} />,
  );
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Account name" }).click();
  await expectNoA11yViolations(screen.container);
  await userEvent.keyboard("{Escape}");
  await screen.rerender(
    <EditableCell
      value="Acme"
      label="Account name"
      status="saving"
      onCommit={() => {}}
    />,
  );
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <EditableCell
      value="Acme"
      label="Account name"
      status="error"
      onCommit={() => {}}
    />,
  );
  await expectNoA11yViolations(screen.container);
});
