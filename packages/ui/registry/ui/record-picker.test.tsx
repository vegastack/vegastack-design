import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  RecordPicker,
  RecordPickerDialog,
  type RecordPickerBrowse,
  type RecordPickerItem,
  type RecordPickerSearch,
} from "./record-picker";

const KINDS = [
  { id: "page", noun: "Pages" },
  { id: "table", noun: "Tables" },
];
const ALL: RecordPickerItem[] = [
  { id: "1", kind: "page", title: "Pricing note" },
  { id: "2", kind: "table", title: "Price list" },
  {
    id: "3",
    kind: "page",
    title: "Launch plan",
    disabledReason: "Already linked",
  },
];
const search: RecordPickerSearch = async (query, { kind }) => ({
  items: ALL.filter(
    (item) =>
      (kind === null || item.kind === kind) &&
      item.title.toLowerCase().includes(query.toLowerCase()),
  ),
});

test("searches the host's records, grouped by kind, and picks one", async () => {
  const onPick = vi.fn();
  const screen = await render(
    <RecordPicker kinds={KINDS} search={search} onPick={onPick} />,
  );
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("option", { name: /Price list/ }))
    .toBeVisible();
  await userEvent.click(screen.getByRole("option", { name: /Price list/ }));
  expect(onPick).toHaveBeenCalledWith(ALL[1]);
  await expectNoA11yViolations(screen.container);
});

test("the kind filter narrows the search", async () => {
  const spy = vi.fn(search);
  const screen = await render(
    <RecordPicker kinds={KINDS} search={spy} onPick={() => {}} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Tables" }));
  await expect.poll(() => spy.mock.calls.at(-1)?.[1].kind).toBe("table");
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .not.toBeInTheDocument();
});

test("a record with a reason shows it and can't be picked", async () => {
  const onPick = vi.fn();
  const screen = await render(
    <RecordPicker kinds={KINDS} search={search} onPick={onPick} />,
  );
  const row = screen.getByRole("option", { name: /Launch plan/ });
  await expect
    .poll(() => row.element().textContent)
    .toContain("Already linked");
  await expect.element(row).toHaveAttribute("aria-disabled", "true");
  await userEvent.click(row, { force: true });
  expect(onPick).not.toHaveBeenCalled();
});

test("recents show while the search is empty", async () => {
  const screen = await render(
    <RecordPicker
      kinds={KINDS}
      search={async () => ({ items: [] })}
      recents={[ALL[0]!]}
      onPick={() => {}}
    />,
  );
  await expect.element(screen.getByText("Recent")).toBeVisible();
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
});

test("multiple toggles records and reports the set", async () => {
  function Multi() {
    const [picked, setPicked] = React.useState<RecordPickerItem[]>([]);
    return (
      <>
        <output data-testid="count">{picked.length}</output>
        <RecordPicker
          kinds={KINDS}
          search={search}
          multiple
          value={picked}
          onValueChange={setPicked}
        />
      </>
    );
  }
  const screen = await render(<Multi />);
  await userEvent.click(screen.getByRole("option", { name: /Pricing note/ }));
  await userEvent.click(screen.getByRole("option", { name: /Price list/ }));
  await expect.element(screen.getByTestId("count")).toHaveTextContent("2");
  await userEvent.click(screen.getByRole("option", { name: /Pricing note/ }));
  await expect.element(screen.getByTestId("count")).toHaveTextContent("1");
});

test("the dialog picks and closes", async () => {
  const onPick = vi.fn();
  function Host() {
    const [open, setOpen] = React.useState(true);
    return (
      <RecordPickerDialog
        open={open}
        onOpenChange={setOpen}
        title="Link a record"
        kinds={KINDS}
        search={search}
        onPick={onPick}
      />
    );
  }
  const screen = await render(<Host />);
  await expect
    .element(screen.getByRole("dialog", { name: "Link a record" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  // The first result is highlighted once the results have settled; Enter picks it.
  await expect
    .poll(
      () =>
        document.querySelector('[cmdk-item][aria-selected="true"]') !== null,
    )
    .toBe(true);
  // The dialog moves focus into the search box as it opens; Enter goes wherever focus is.
  await expect.element(screen.getByRole("combobox")).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  expect(onPick).toHaveBeenCalledTimes(1);
  await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
});

test("Enter on a kind filter switches the filter and picks nothing", async () => {
  const onPick = vi.fn();
  const screen = await render(
    <RecordPicker kinds={KINDS} search={search} onPick={onPick} />,
  );
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  (
    screen.getByRole("button", { name: "Tables" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  await expect
    .element(screen.getByRole("button", { name: "Tables" }))
    .toHaveAttribute("aria-pressed", "true");
  expect(onPick).not.toHaveBeenCalled();
});

test("a pick made earlier survives a search that no longer shows it", async () => {
  function Multi() {
    const [picked, setPicked] = React.useState<RecordPickerItem[]>([
      { id: "99", kind: "page", title: "Old pick" },
    ]);
    return (
      <>
        <output data-testid="picked">
          {picked.map((p) => p.title).join(",")}
        </output>
        <RecordPicker
          kinds={KINDS}
          search={search}
          multiple
          value={picked}
          onValueChange={setPicked}
        />
      </>
    );
  }
  const screen = await render(<Multi />);
  await userEvent.click(screen.getByRole("option", { name: /Price list/ }));
  await expect
    .element(screen.getByTestId("picked"))
    .toHaveTextContent("Old pick,Price list");
});

test("the dialog starts from the earlier picks and Done reports them unchanged", async () => {
  const onConfirm = vi.fn();
  const before = [{ id: "1", kind: "page", title: "Pricing note" }];
  const screen = await render(
    <RecordPickerDialog
      open
      onOpenChange={() => {}}
      title="Link records"
      kinds={KINDS}
      search={search}
      multiple
      value={before}
      onConfirm={onConfirm}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Done" }))
    .toBeVisible();
  (
    screen.getByRole("button", { name: "Done" }).element() as HTMLElement
  ).click();
  expect(onConfirm).toHaveBeenCalledWith(before);
});

test("Enter can't pick a row from a search that is no longer what is typed", async () => {
  const onPick = vi.fn();
  let release: (() => void) | undefined;
  const slow: RecordPickerSearch = (query, context) =>
    query === "launch"
      ? new Promise((resolve) => {
          release = () => void search(query, context).then(resolve);
        })
      : search(query, context);
  const screen = await render(
    <RecordPicker kinds={KINDS} search={slow} onPick={onPick} />,
  );
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  await userEvent.type(screen.getByRole("combobox"), "launch");
  await userEvent.keyboard("{Enter}");
  expect(onPick).not.toHaveBeenCalled();
  release?.();
});

test("a superseded search's late answer leaves the current rows pickable", async () => {
  const onPick = vi.fn();
  const asked: string[] = [];
  let releaseOld: (() => void) | undefined;
  const ordered: RecordPickerSearch = (query, context) => {
    asked.push(query);
    return query === "pri"
      ? new Promise((resolve) => {
          releaseOld = () => void search(query, context).then(resolve);
        })
      : search(query, context);
  };
  const screen = await render(
    <RecordPicker kinds={KINDS} search={ordered} onPick={onPick} />,
  );
  const box = screen.getByRole("combobox");
  await userEvent.type(box, "pri");
  await expect.poll(() => asked.includes("pri")).toBe(true);
  await userEvent.type(box, "ce list");
  await expect.poll(() => asked.includes("price list")).toBe(true);
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .not.toBeInTheDocument();
  releaseOld?.();
  await new Promise((r) => setTimeout(r, 50));
  await userEvent.click(screen.getByRole("option", { name: /Price list/ }));
  expect(onPick).toHaveBeenCalledWith(ALL[1]);
});

/* Browse ---------------------------------------------------------------------------------------- */

const TREE: Record<string, RecordPickerItem[]> = {
  "": [
    { id: "f1", kind: "page", title: "Sales", folder: true },
    { id: "1", kind: "page", title: "Pricing note" },
  ],
  f1: [
    { id: "f2", kind: "page", title: "Contracts", folder: true },
    { id: "2", kind: "table", title: "Price list" },
  ],
  f2: [],
};
const browse: RecordPickerBrowse = async (folder) => ({
  items: TREE[folder?.id ?? ""] ?? [],
});

test("browse opens folders, the breadcrumb climbs back, and typing searches everything", async () => {
  const onPick = vi.fn();
  const asked = vi.fn(search);
  const screen = await render(
    <RecordPicker
      kinds={KINDS}
      search={asked}
      browse={browse}
      rootLabel="Library"
      onPick={onPick}
    />,
  );
  await userEvent.click(screen.getByRole("option", { name: /Sales/ }));
  expect(onPick).not.toHaveBeenCalled();
  await expect
    .element(screen.getByRole("option", { name: /Price list/ }))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
  const path = screen.getByRole("navigation", { name: "Folder path" });
  await expect.poll(() => path.element().textContent).toBe("LibrarySales");
  await userEvent.click(screen.getByRole("option", { name: /Contracts/ }));
  await expect.element(screen.getByText("This folder is empty.")).toBeVisible();
  // The crumb climbs to its folder.
  await userEvent.click(screen.getByRole("button", { name: "Sales" }));
  await expect
    .element(screen.getByRole("option", { name: /Price list/ }))
    .toBeVisible();
  // Typing searches everything, not just the open folder.
  await userEvent.type(screen.getByRole("combobox"), "pricing");
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  expect(asked).toHaveBeenCalled();
  await userEvent.click(screen.getByRole("option", { name: /Pricing note/ }));
  expect(onPick).toHaveBeenCalledWith(ALL[0]);
});

test("Backspace in the empty box climbs one folder", async () => {
  const screen = await render(
    <RecordPicker
      kinds={KINDS}
      search={search}
      browse={browse}
      onPick={() => {}}
    />,
  );
  await userEvent.click(screen.getByRole("option", { name: /Sales/ }));
  await expect
    .element(screen.getByRole("option", { name: /Price list/ }))
    .toBeVisible();
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.keyboard("{Backspace}");
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("navigation", { name: "Folder path" }))
    .not.toBeInTheDocument();
});

test("select all picks the rows on screen, never a folder", async () => {
  function Multi() {
    const [picked, setPicked] = React.useState<RecordPickerItem[]>([]);
    return (
      <>
        <output data-testid="picked">
          {picked.map((p) => p.title).join(",")}
        </output>
        <RecordPicker
          kinds={KINDS}
          search={search}
          browse={browse}
          kindFilter={false}
          selectAll
          multiple
          value={picked}
          onValueChange={setPicked}
        />
      </>
    );
  }
  const screen = await render(<Multi />);
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Pages" }))
    .not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Select all" }));
  await expect
    .poll(() => screen.getByTestId("picked").element().textContent)
    .toBe("Pricing note");
  await expect
    .element(screen.getByRole("button", { name: "Select all" }))
    .toHaveAttribute("aria-pressed", "true");
  await userEvent.click(screen.getByRole("button", { name: "Select all" }));
  await expect
    .poll(() => screen.getByTestId("picked").element().textContent)
    .toBe("");
});

test("an async confirm holds the dialog, and false keeps it open", async () => {
  let settle: ((ok: boolean) => void) | undefined;
  const onOpenChange = vi.fn();
  const screen = await render(
    <RecordPickerDialog
      open
      onOpenChange={onOpenChange}
      title="Add from the archive"
      kinds={KINDS}
      search={search}
      multiple
      cancelLabel="Cancel"
      confirmLabel={(count) => (count > 1 ? `Add ${count}` : "Add")}
      onConfirm={() => new Promise<boolean>((resolve) => (settle = resolve))}
    />,
  );
  // The modal's inert backdrop takes the pointer in this harness: click the elements directly.
  const click = (el: { element: () => Element }) =>
    (el.element() as HTMLElement).click();
  const add = screen.getByRole("button", { name: "Add" });
  await expect.element(add).toBeDisabled();
  await expect
    .element(screen.getByRole("option", { name: /Pricing note/ }))
    .toBeVisible();
  click(screen.getByRole("option", { name: /Pricing note/ }));
  await expect
    .element(screen.getByRole("button", { name: "Add" }))
    .toBeEnabled();
  click(screen.getByRole("option", { name: /Price list/ }));
  const addTwo = screen.getByRole("button", { name: "Add 2" });
  await expect.element(addTwo).toBeEnabled();
  click(addTwo);
  await expect.element(addTwo).toHaveAttribute("aria-busy", "true");
  settle?.(false);
  await expect.element(addTwo).not.toHaveAttribute("aria-busy", "true");
  expect(onOpenChange).not.toHaveBeenCalled();
  click(addTwo);
  await expect.element(addTwo).toHaveAttribute("aria-busy", "true");
  settle?.(true);
  await expect.poll(() => onOpenChange.mock.calls.at(-1)?.[0]).toBe(false);
});
