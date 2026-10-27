import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { RecordPeek, RecordPeekBody } from "./record-peek";

const ROWS = ["a", "b", "c"];

function Harness({
  start = "b",
  onOpenFull,
  fullHref,
  storageKey,
}: {
  start?: string | null;
  onOpenFull?: () => void;
  fullHref?: string;
  storageKey?: string;
}) {
  const [id, setId] = React.useState<string | null>(start);
  const index = id ? ROWS.indexOf(id) : -1;
  return (
    <>
      <ul>
        {ROWS.map((row) => (
          <li key={row}>
            <button type="button" data-row-id={row} onClick={() => setId(row)}>
              Row {row}
            </button>
          </li>
        ))}
      </ul>
      <input aria-label="Search" />
      <RecordPeek
        open={id !== null}
        onOpenChange={(open) => !open && setId(null)}
        label="Task"
        position={index >= 0 ? { index, total: ROWS.length } : undefined}
        onPrevious={index > 0 ? () => setId(ROWS[index - 1]!) : undefined}
        onNext={
          index < ROWS.length - 1 ? () => setId(ROWS[index + 1]!) : undefined
        }
        onOpenFull={onOpenFull}
        fullHref={fullHref}
        storageKey={storageKey}
        returnFocus={() =>
          id
            ? document.querySelector<HTMLElement>(`[data-row-id="${id}"]`)
            : null
        }
      >
        <RecordPeekBody>
          <p data-testid="body">Record {id}</p>
          <textarea aria-label="Comment" />
          <button
            type="button"
            role="combobox"
            aria-expanded="false"
            aria-controls="none"
            aria-label="Status"
          >
            Open
          </button>
          <button
            type="button"
            onKeyDown={(event) => {
              if (event.key === "j" || event.key === "Enter")
                event.preventDefault();
            }}
          >
            Own keys
          </button>
          <div role="tablist" aria-label="Sections">
            <button type="button" role="tab" aria-selected="true">
              Fields
            </button>
          </div>
        </RecordPeekBody>
      </RecordPeek>
    </>
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

test("renders a non-modal panel named by its label, with the position and the body", async () => {
  const screen = await render(<Harness />);
  await expect
    .element(screen.getByRole("dialog", { name: "Task" }))
    .toBeVisible();
  expect(slot("record-peek-position")?.textContent).toBe("2 of 3");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record b");
  // Non-modal: the list behind stays operable.
  await userEvent.click(screen.getByRole("button", { name: "Row c" }));
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record c");
  await expectNoA11yViolations(document.body);
});

test("previous and next walk the list and disable at the ends", async () => {
  const screen = await render(<Harness start="a" />);
  const previous = screen.getByRole("button", { name: "Previous task" });
  const next = screen.getByRole("button", { name: "Next task" });
  await expect.element(previous).toBeDisabled();
  expect(previous.element().getAttribute("aria-keyshortcuts")).toBe(
    "ArrowUp K",
  );
  await userEvent.click(next);
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record b");
  await userEvent.click(next);
  await expect.element(next).toBeDisabled();
});

test("↓/J and ↑/K walk the list; not while typing", async () => {
  const screen = await render(<Harness start="a" />);
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record b");
  await userEvent.keyboard("j");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record c");
  await userEvent.keyboard("k");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record b");
  await userEvent.click(screen.getByRole("textbox", { name: "Search" }));
  await userEvent.keyboard("j");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record b");
});

test("⌘↵ / Ctrl+↵ opens the full page", async () => {
  const onOpenFull = vi.fn();
  const screen = await render(<Harness onOpenFull={onOpenFull} />);
  await expect
    .element(screen.getByRole("button", { name: "Open full page" }))
    .toBeVisible();
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(onOpenFull).toHaveBeenCalledTimes(1);
});

test("a full-page link renders as a link", async () => {
  const screen = await render(<Harness fullHref="/tasks/b" />);
  const link = screen.getByRole("link", { name: "Open full page" });
  await expect.element(link).toHaveAttribute("href", "/tasks/b");
});

test("Esc closes the peek and returns focus to the row it came from", async () => {
  const screen = await render(<Harness start={null} />);
  await userEvent.click(screen.getByRole("button", { name: "Row b" }));
  await expect
    .element(screen.getByRole("dialog", { name: "Task" }))
    .toBeVisible();
  (
    screen.getByRole("button", { name: "Close" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Escape}");
  await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  await expect
    .poll(() => document.activeElement?.getAttribute("data-row-id"))
    .toBe("b");
});

test("the separator resizes by keyboard within its bounds and remembers the width", async () => {
  await page.viewport(1400, 900);
  window.localStorage.removeItem("peek-test-width");
  const screen = await render(<Harness storageKey="peek-test-width" />);
  const separator = screen.getByRole("separator", {
    name: "Resize the task panel",
  });
  await expect.element(separator).toHaveAttribute("aria-valuenow", "640");
  (separator.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(separator).toHaveAttribute("aria-valuenow", "672");
  await userEvent.keyboard("{Home}");
  await expect.element(separator).toHaveAttribute("aria-valuenow", "480");
  expect(window.localStorage.getItem("peek-test-width")).toBe("480");
  expect(
    slot("record-peek")!.style.getPropertyValue("--record-peek-width"),
  ).toBe("480px");
  window.localStorage.removeItem("peek-test-width");
});

test("below the tablet tier the peek is the whole screen and the separator goes", async () => {
  await render(<Harness />);
  const popup = await vi.waitFor(() => {
    const el = slot("record-peek");
    if (!el) throw new Error("no popup");
    return el;
  });
  const tokens = popup.className.split(/\s+/);
  expect(tokens).toContain(
    "data-[swipe-axis=x]:max-sm:[--drawer-content-width:100vw]",
  );
  expect(tokens).toContain("max-sm:[--drawer-inset:0px]");
  expect(slot("record-peek-resize")!.className.split(/\s+/)).toContain(
    "max-sm:hidden",
  );
});

test("a field, a popup or a control with its own arrows keeps its keys", async () => {
  const onOpenFull = vi.fn();
  const screen = await render(<Harness start="a" onOpenFull={onOpenFull} />);
  await userEvent.click(screen.getByRole("textbox", { name: "Comment" }));
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(onOpenFull).not.toHaveBeenCalled();
  (
    screen.getByRole("tab", { name: "Fields" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record a");
  await userEvent.keyboard("j");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record b");
});

test("a combobox and a control that claims its keys keep J/K and ⌘↵", async () => {
  const onOpenFull = vi.fn();
  const screen = await render(<Harness start="a" onOpenFull={onOpenFull} />);
  (
    screen.getByRole("combobox", { name: "Status" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("j");
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record a");
  expect(onOpenFull).not.toHaveBeenCalled();
  (
    screen.getByRole("button", { name: "Own keys" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("j");
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await expect
    .element(screen.getByTestId("body"))
    .toHaveTextContent("Record a");
  expect(onOpenFull).not.toHaveBeenCalled();
});

test("a consumer ref reaches the panel and the keys still work inside it", async () => {
  const ref = React.createRef<HTMLDivElement>();
  function WithRef() {
    const [id, setId] = React.useState("a");
    return (
      <RecordPeek
        ref={ref}
        open
        onOpenChange={() => {}}
        label="Task"
        position={{ index: ROWS.indexOf(id), total: ROWS.length }}
        onNext={() => setId(ROWS[ROWS.indexOf(id) + 1] ?? id)}
      >
        <RecordPeekBody>
          <button type="button">Inside {id}</button>
        </RecordPeekBody>
      </RecordPeek>
    );
  }
  const screen = await render(<WithRef />);
  await expect
    .element(screen.getByRole("dialog", { name: "Task" }))
    .toBeVisible();
  expect(ref.current?.getAttribute("data-slot")).toBe("record-peek");
  (
    screen.getByRole("button", { name: "Inside a" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("j");
  await expect
    .element(screen.getByRole("button", { name: "Inside b" }))
    .toBeVisible();
});
