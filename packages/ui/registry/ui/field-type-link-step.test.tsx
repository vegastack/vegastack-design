import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { FieldTypePicker } from "./field-type-picker";
import {
  FieldTypeLinkStep,
  type FieldLinkChoice,
  type FieldLinkKind,
} from "./field-type-link-step";

const TYPES = [
  { id: "text", label: "Text", icon: <span>T</span> },
  { id: "link", label: "Link to", icon: <span>↗</span>, next: true },
];

const KINDS: FieldLinkKind[] = [
  {
    id: "page",
    label: "Pages",
    group: "Library",
    description: "Each cell links to pages in the Library",
  },
  {
    id: "customer",
    label: "Customers",
    group: "Sales",
    description: "Each cell links to customers",
    keywords: ["clients"],
  },
  {
    id: "table_row",
    label: "Rows",
    group: "Tables",
    table: true,
    description: "Rows of another table",
  },
  {
    id: "meeting",
    label: "Meetings",
    group: "Library",
    disabledReason: "Turn Meetings on first",
  },
];

const TABLES = [
  { id: "t1", label: "QA fixtures", description: "117 rows" },
  { id: "t2", label: "Leads" },
];

/** The option whose name (its first text line) is `name`. */
const option = (name: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (el) => el.querySelector(".truncate")?.textContent === name,
  );

function Picker({
  onType,
  onLink,
  value,
  tablesLoading,
}: {
  onType?: (id: string) => void;
  onLink?: (choice: FieldLinkChoice) => void;
  value?: Partial<FieldLinkChoice>;
  tablesLoading?: boolean;
}) {
  return (
    <FieldTypePicker
      types={TYPES}
      onSelect={(id) => onType?.(id)}
      renderStep={(_type, controls) => (
        <FieldTypeLinkStep
          controls={controls}
          kinds={KINDS}
          groupOrder={["Library", "Sales", "Tables"]}
          tables={tablesLoading ? [] : TABLES}
          tablesLoading={tablesLoading}
          value={value}
          onSelect={(choice) => onLink?.(choice)}
        />
      )}
    />
  );
}

test("Link to opens grouped kinds with one-line explanations; a plain kind is chosen at once", async () => {
  const onType = vi.fn();
  const onLink = vi.fn();
  const screen = await render(<Picker onType={onType} onLink={onLink} />);
  option("Link to")!.click();
  await expect
    .element(screen.getByText("Each cell links to pages in the Library"))
    .toBeInTheDocument();
  const step = screen.container.querySelector<HTMLElement>(
    '[data-slot="field-type-link-step"]',
  )!;
  expect(step.getAttribute("data-view")).toBe("kinds");
  // Groups in their order.
  expect(
    [...step.querySelectorAll("[cmdk-group-heading]")].map(
      (h) => h.textContent,
    ),
  ).toEqual(["Library", "Sales", "Tables"]);
  // A disabled kind says why.
  await expect
    .element(screen.getByText("Turn Meetings on first"))
    .toBeInTheDocument();
  option("Meetings")!.click();
  expect(onLink).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
  option("Customers")!.click();
  expect(onLink).toHaveBeenCalledWith({ kind: "customer" });
  expect(onType).not.toHaveBeenCalled();
});

test("Rows asks which table, retitling the step header; a table completes the choice", async () => {
  const onLink = vi.fn();
  const screen = await render(<Picker onLink={onLink} />);
  option("Link to")!.click();
  await vi.waitFor(() => expect(option("Rows")).toBeDefined());
  option("Rows")!.click();
  const header = () =>
    screen.container.querySelector(
      '[data-slot="field-type-picker-step-header"]',
    )!.textContent;
  await vi.waitFor(() => expect(header()).toContain("Which table's rows?"));
  const step = screen.container.querySelector<HTMLElement>(
    '[data-slot="field-type-link-step"]',
  )!;
  expect(step.getAttribute("data-view")).toBe("tables");
  await expect.element(screen.getByText("117 rows")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
  option("Leads")!.click();
  expect(onLink).toHaveBeenCalledWith({ kind: "table_row", table: "t2" });
});

test("Backspace in an empty search goes up one view: tables → kinds → types", async () => {
  const screen = await render(<Picker />);
  option("Link to")!.click();
  await vi.waitFor(() => expect(option("Rows")).toBeDefined());
  option("Rows")!.click();
  await vi.waitFor(() => expect(option("Leads")).toBeDefined());
  const search = () =>
    screen.container.querySelector<HTMLInputElement>("[cmdk-input]")!;
  search().focus();
  await userEvent.keyboard("{Backspace}");
  await vi.waitFor(() => expect(option("Rows")).toBeDefined());
  expect(
    screen.container.querySelector(
      '[data-slot="field-type-picker-step-header"]',
    )!.textContent,
  ).toContain("Link to");
  search().focus();
  await userEvent.keyboard("{Backspace}");
  await vi.waitFor(() => expect(option("Text")).toBeDefined());
  expect(
    screen.container.querySelector('[data-slot="field-type-link-step"]'),
  ).toBeNull();
});

test("search matches names, explanations and keywords; the current choice is read as current", async () => {
  const screen = await render(<Picker value={{ kind: "customer" }} />);
  option("Link to")!.click();
  await vi.waitFor(() => expect(option("Customers")).toBeDefined());
  expect(option("Customers")!.textContent).toContain("current");
  const search =
    screen.container.querySelector<HTMLInputElement>("[cmdk-input]")!;
  search.focus();
  await userEvent.keyboard("clients");
  await vi.waitFor(() =>
    expect(document.querySelectorAll('[role="option"]').length).toBe(1),
  );
});

test("tables still loading: the table view says so", async () => {
  const screen = await render(<Picker tablesLoading />);
  option("Link to")!.click();
  await vi.waitFor(() => expect(option("Rows")).toBeDefined());
  option("Rows")!.click();
  await expect.element(screen.getByText("Loading tables…")).toBeInTheDocument();
});

test("forwards a ref to the command root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <FieldTypeLinkStep
      ref={ref}
      controls={{ back: () => {}, setTitle: () => {} }}
      kinds={KINDS}
      onSelect={() => {}}
    />,
  );
  expect(ref.current?.getAttribute("data-slot")).toBe("field-type-link-step");
});
