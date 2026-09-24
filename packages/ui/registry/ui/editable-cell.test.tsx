import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, onTestFinished, test, vi } from "vitest";
// The compiled lane stylesheet as a STRING, mounted only for the truncation test below: every other
// test here is structural and must not see real CSS.
import geometryCss from "../../test/geometry.css?inline";
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
  // The text leaf focus-and-selects the whole value on open — wait for it so
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
  const announcer = document.querySelector(
    '[data-slot="announcer"]',
  ) as HTMLElement;
  expect(announcer.textContent).toContain("Save failed — value reverted");
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

test("a read-only select cell shows the option LABEL, not the stored value", async () => {
  // The editable select cell renders `Closed Won` (the option label); the read-only branch fell
  // through to the text leaf's raw `displayValue` and rendered `won` instead, so the same
  // column read differently depending on a permission the reader cannot see (2026-09-09).
  const screen = await render(
    <EditableCell
      value="won"
      label="Stage"
      readOnly
      editor={{
        type: "select",
        options: [
          { value: "open", label: "Open" },
          { value: "won", label: "Closed Won" },
        ],
      }}
      onCommit={() => {}}
    />,
  );
  await expect.element(screen.getByText("Closed Won")).toBeInTheDocument();
  expect(screen.container.textContent).not.toContain("won");
});

test("a read-only select cell falls back to the raw value for an unknown option", async () => {
  const screen = await render(
    <EditableCell
      value="archived"
      label="Stage"
      readOnly
      editor={{
        type: "select",
        options: [{ value: "open", label: "Open" }],
      }}
      onCommit={() => {}}
    />,
  );
  await expect.element(screen.getByText("archived")).toBeInTheDocument();
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

test("heading use: the display and the editor carry no font size of their own, so they inherit the surrounding type", async () => {
  // This lane compiles no CSS, so the contract is the class list: a fixed `text-*` size on either
  // part would pin the cell at that size inside a page heading (the Regent meeting title).
  const screen = await render(
    <h1 className="text-3xl font-semibold">
      <EditableCell
        value="Weekly sync"
        label="Meeting title"
        onCommit={() => {}}
      />
    </h1>,
  );
  const display = document.querySelector<HTMLElement>(
    '[data-slot="editable-cell-display"]',
  )!;
  expect(display.className).not.toMatch(
    /(^|\s)text-(xs|sm|base|lg|\dxl)(\s|$)/,
  );
  await screen.getByRole("button", { name: "Meeting title" }).click();
  const input = document.querySelector<HTMLElement>(
    '[data-slot="editable-cell-input"]',
  )!;
  // Upstream Input's `text-base md:text-sm` is merged away, not layered under an override.
  expect(input.className).not.toMatch(/(^|\s)(md:)?text-(sm|base)(\s|$)/);
  expect(input.className).toContain("md:text-[length:inherit]");
  expect(input.className).toContain("text-[length:max(1rem,1em)]");
  expect(input.className).toContain("leading-[1lh]");
  // `h-8` would clip heading-sized text; the box keeps its 32px floor instead.
  expect(input.className).not.toMatch(/(^|\s)h-8(\s|$)/);
  expect(input.className).toContain("min-h-8");
});

test("page-title use at 390px: a long value truncates to its container and offers the full value as title", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const long =
    "Quarterly planning review with the regional operations leadership team and finance partners";
  const screen = await render(
    <div style={{ width: 390 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold">
            <EditableCell
              value={long}
              label="Meeting title"
              onCommit={() => {}}
            />
          </h1>
        </div>
      </div>
    </div>,
  );
  const display = screen
    .getByRole("button", { name: "Meeting title" })
    .element() as HTMLElement;
  const text = display.querySelector<HTMLElement>(
    '[data-slot="editable-cell-text"]',
  )!;
  const root = display.closest<HTMLElement>('[data-slot="editable-cell"]')!;
  // One line, clipped with an ellipsis, and nothing wider than the 390px page.
  expect(getComputedStyle(text).whiteSpace).toBe("nowrap");
  expect(getComputedStyle(text).textOverflow).toBe("ellipsis");
  expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
  expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(390);
  expect(display.getBoundingClientRect().right).toBeLessThanOrEqual(
    root.parentElement!.getBoundingClientRect().right + 0.5,
  );
  // The clipped value stays reachable: as the display's title, and in full in the editor.
  await expect.element(display).toHaveAttribute("title", long);
  await expect.element(display).toHaveAttribute("data-truncated", "");
  await display.click();
  const input = screen.getByRole("textbox", { name: "Meeting title" });
  await expect.element(input).toHaveValue(long);
});

test("a value that fits carries no title", async () => {
  const screen = await render(
    <EditableCell value="Acme" label="Account name" onCommit={() => {}} />,
  );
  const display = screen.getByRole("button", { name: "Account name" });
  await expect.element(display).not.toHaveAttribute("title");
  await expect.element(display).not.toHaveAttribute("data-truncated");
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

test("a CONTROLLED status change announces through the live region (the grid recipe)", async () => {
  const screen = await render(
    <EditableCell value="Acme" label="Account name" onCommit={() => {}} />,
  );
  // The live region is the shared `useAnnouncer` node, a SIBLING of the visible status
  // slot: a status slot that were also a live region would announce its own icon swaps.
  const region = () =>
    document.querySelector('[data-slot="announcer"]') as HTMLElement;
  expect(region().textContent).toBe("");
  await screen.rerender(
    <EditableCell
      value="Acme"
      label="Account name"
      status="saving"
      onCommit={() => {}}
    />,
  );
  expect(region().textContent).toBe("Saving…");
  await screen.rerender(
    <EditableCell
      value="Acme"
      label="Account name"
      status="error"
      onCommit={() => {}}
    />,
  );
  expect(region().textContent).toBe("Save failed");
});

test("committing back to the persisted value DURING a slow save supersedes it (no wedge)", async () => {
  const d1 = deferred();
  const d2 = deferred();
  const promises = [d1.promise, d2.promise];
  let call = 0;
  const screen = await render(
    <EditableCell
      value="Acme"
      label="Account name"
      onCommit={() => promises[call++]}
    />,
  );
  const openAndType = async (text: string, selectionEnd: number) => {
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
      .toBe(selectionEnd);
    await userEvent.keyboard(`${text}{Enter}`);
  };
  await openAndType("Globex", 4);
  const root = document.querySelector('[data-slot="editable-cell"]')!;
  expect(root.getAttribute("data-status")).toBe("saving");
  // While saving, edit again and type the ORIGINAL persisted value back —
  // a real edit (it differs from the optimistic display) that must supersede.
  await openAndType("Acme", 6);
  await expect
    .element(screen.getByRole("button", { name: "Account name" }))
    .toHaveTextContent("Acme");
  // The FIRST promise settling is stale and must be ignored.
  d1.resolve();
  await new Promise((r) => setTimeout(r, 10));
  expect(root.getAttribute("data-status")).toBe("saving");
  await expect
    .element(screen.getByRole("button", { name: "Account name" }))
    .toHaveTextContent("Acme");
  // The second (current) commit resolves → saved, showing the reverted value.
  d2.resolve();
  await expect.poll(() => root.getAttribute("data-status")).toBe("saved");
});

/* DS-18 — renderValue shows what a person reads, not the stored id */

test("DS-18: renderValue shows the label, not the id", async () => {
  const screen = await render(
    <EditableCell
      value="u_7"
      onCommit={() => {}}
      editor={{ type: "custom", render: () => null }}
      renderValue={(id) => (id === "u_7" ? "Asha Rao" : id)}
    />,
  );
  await expect.element(screen.getByText("Asha Rao")).toBeInTheDocument();
  expect(screen.container.textContent).not.toContain("u_7");
});

test("DS-18: an empty value keeps the placeholder, not renderValue", async () => {
  const renderValue = vi.fn((id: string) => `Person ${id}`);
  const screen = await render(
    <EditableCell
      value=""
      onCommit={() => {}}
      editor={{ type: "text", placeholder: "Unassigned" }}
      renderValue={renderValue}
    />,
  );
  await expect.element(screen.getByText("Unassigned")).toBeInTheDocument();
  expect(renderValue).not.toHaveBeenCalled();
});

test("DS-18: a text cell still edits the raw value and commits it", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <EditableCell
      value="acme"
      onCommit={onCommit}
      label="Customer"
      renderValue={(value) => value.toUpperCase()}
    />,
  );
  await screen.getByText("ACME").click();
  const input = screen.getByRole("textbox", { name: "Customer" });
  await expect.element(input).toHaveValue("acme");
  await userEvent.fill(input, "globex");
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledWith("globex");
});

test("DS-18: Escape reverts to the rendered display", async () => {
  const screen = await render(
    <EditableCell
      value="acme"
      onCommit={() => {}}
      label="Customer"
      renderValue={(value) => value.toUpperCase()}
    />,
  );
  await screen.getByText("ACME").click();
  await userEvent.fill(
    screen.getByRole("textbox", { name: "Customer" }),
    "draft",
  );
  await userEvent.keyboard("{Escape}");
  await expect.element(screen.getByText("ACME")).toBeInTheDocument();
});

test("DS-18: a select cell renders its trigger value through renderValue", async () => {
  const screen = await render(
    <EditableCell
      value="won"
      onCommit={() => {}}
      label="Stage"
      editor={{
        type: "select",
        options: [
          { value: "won", label: "Closed won" },
          { value: "lost", label: "Closed lost" },
        ],
      }}
      renderValue={(value) => `Stage: ${value}`}
    />,
  );
  await expect.element(screen.getByText("Stage: won")).toBeInTheDocument();
});

test("no a11y violations — renderValue display", async () => {
  const screen = await render(
    <EditableCell
      value="u_7"
      label="Owner"
      onCommit={() => {}}
      editor={{ type: "custom", render: () => null }}
      renderValue={() => "Asha Rao"}
    />,
  );
  await expectNoA11yViolations(screen.container);
});
