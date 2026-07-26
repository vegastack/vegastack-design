import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  FilterBuilder,
  type FilterField,
  type FilterNode,
  type FilterValueEditorProps,
} from "./filter-bar-managed";

type Group = Extract<FilterNode<string>, { type: "group" }>;

const VOCABULARY: FilterField<string>[] = [
  {
    key: "stage",
    label: "Stage",
    type: "text",
    operators: [
      { value: "is", label: "is" },
      { value: "is-not", label: "is not" },
    ],
  },
  {
    key: "owner",
    label: "Owner",
    type: "text",
    operators: [
      { value: "is", label: "is" },
      { value: "is-empty", label: "is empty", requiresValue: false },
    ],
  },
];

function Controlled({
  initial,
  onChange,
  ...props
}: Partial<React.ComponentProps<typeof FilterBuilder<string>>> & {
  initial: Group;
  onChange?: (v: Group) => void;
}) {
  const [tree, setTree] = React.useState<Group>(initial);
  return (
    <FilterBuilder<string>
      vocabulary={VOCABULARY}
      value={tree}
      onValueChange={(next) => {
        setTree(next);
        onChange?.(next);
      }}
      {...props}
    />
  );
}

const EMPTY: Group = { type: "group", op: "and", children: [] };

function conditionRows(): NodeListOf<HTMLElement> {
  return document.querySelectorAll('[data-slot="filter-builder-condition"]');
}

test("adding a condition seeds the first field and its first operator", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled initial={EMPTY} onChange={onChange} />,
  );
  await screen.getByRole("button", { name: "Add condition" }).click();
  expect(onChange).toHaveBeenLastCalledWith({
    type: "group",
    op: "and",
    children: [{ type: "condition", field: "stage", operator: "is" }],
  });
  expect(conditionRows()).toHaveLength(1);
});

test("the grammar is host-injected: field menu lists exactly the vocabulary", async () => {
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [{ type: "condition", field: "stage", operator: "is" }],
      }}
    />,
  );
  await screen.getByRole("combobox", { name: "Field" }).click();
  const options = Array.from(document.querySelectorAll('[role="option"]')).map(
    (o) => o.textContent,
  );
  expect(options).toEqual(["Stage", "Owner"]);
});

test("changing the field resets the operator to the new field's first operator", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          {
            type: "condition",
            field: "stage",
            operator: "is-not",
            value: "won",
          },
        ],
      }}
      onChange={onChange}
    />,
  );
  await screen.getByRole("combobox", { name: "Field" }).click();
  await screen.getByRole("option", { name: "Owner" }).click();
  const next = onChange.mock.calls.at(-1)![0] as Group;
  expect(next.children[0]).toEqual({
    type: "condition",
    field: "owner",
    operator: "is",
    // Same editor type ("text") → the value survives the field change.
    value: "won",
  });
});

test("an operator with requiresValue: false hides the value editor and is never invalid", async () => {
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [{ type: "condition", field: "owner", operator: "is-empty" }],
      }}
    />,
  );
  expect(
    screen.container.querySelector('[aria-label="Owner value"]'),
  ).toBeNull();
  expect(conditionRows()[0]!.hasAttribute("data-invalid")).toBe(false);
});

test("a value-requiring condition without a value is marked invalid with visible text", async () => {
  await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [{ type: "condition", field: "stage", operator: "is" }],
      }}
    />,
  );
  const row = conditionRows()[0]!;
  expect(row.hasAttribute("data-invalid")).toBe(true);
  expect(row.textContent).toContain("Value required");
});

test("nested groups render as nested fieldsets and can flip and/or", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          {
            type: "group",
            op: "or",
            children: [
              {
                type: "condition",
                field: "stage",
                operator: "is",
                value: "won",
              },
            ],
          },
        ],
      }}
      onChange={onChange}
    />,
  );
  const groups = document.querySelectorAll(
    '[data-slot="filter-builder-group"]',
  );
  expect(groups).toHaveLength(2);
  expect((groups[1] as HTMLElement).dataset.op).toBe("or");
  expect((groups[1] as HTMLElement).tagName).toBe("FIELDSET");
  // Flip the nested group's op.
  const matchTypes = screen.getByRole("combobox", { name: "Match type" });
  await matchTypes.nth(1).click();
  await screen.getByRole("option", { name: "All conditions match" }).click();
  const next = onChange.mock.calls.at(-1)![0] as Group;
  expect((next.children[0] as Group).op).toBe("and");
});

test("the depth cap disables add-group with a readable reason", async () => {
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [{ type: "group", op: "and", children: [] }],
      }}
      maxDepth={2}
    />,
  );
  // The nested group (depth 2) is at the cap; its add-group is disabled.
  // DOM order: the nested group's footer renders before the root's.
  const addGroupButtons = screen.getByRole("button", { name: "Add group" });
  const nested = addGroupButtons.nth(0).element() as HTMLButtonElement;
  const root = addGroupButtons.nth(1).element() as HTMLButtonElement;
  expect(root.disabled).toBe(false);
  expect(nested.disabled).toBe(true);
  const describedBy = nested.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)?.textContent).toContain(
    "levels deep",
  );
});

test("the condition cap disables both add affordances", async () => {
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          { type: "condition", field: "stage", operator: "is", value: "a" },
          { type: "condition", field: "stage", operator: "is", value: "b" },
        ],
      }}
      maxConditions={2}
    />,
  );
  const addCondition = screen
    .getByRole("button", { name: "Add condition" })
    .element() as HTMLButtonElement;
  expect(addCondition.disabled).toBe(true);
  const addGroup = screen
    .getByRole("button", { name: "Add group" })
    .element() as HTMLButtonElement;
  expect(addGroup.disabled).toBe(true);
});

test("removing a condition moves focus to the NEXT sibling; removing the last focuses add-condition", async () => {
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          { type: "condition", field: "stage", operator: "is", value: "a" },
          { type: "condition", field: "owner", operator: "is", value: "b" },
        ],
      }}
    />,
  );
  await screen.getByRole("button", { name: "Remove Stage condition" }).click();
  // Focus lands on the (previously second, now first) row's field trigger.
  await expect
    .poll(() =>
      (document.activeElement as HTMLElement)?.getAttribute("aria-label"),
    )
    .toBe("Field");
  expect(conditionRows()).toHaveLength(1);
  await screen.getByRole("button", { name: "Remove Owner condition" }).click();
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.textContent)
    .toContain("Add condition");
});

test("a custom per-type editor renders through the registry", async () => {
  function StageEditor({
    value,
    onValueChange,
    "aria-label": ariaLabel,
  }: FilterValueEditorProps<string>) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        data-testid="stage-editor"
        onClick={() => onValueChange("won")}
      >
        {value ?? "pick"}
      </button>
    );
  }
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [{ type: "condition", field: "stage", operator: "is" }],
      }}
      editors={{ text: StageEditor }}
      onChange={onChange}
    />,
  );
  await screen.getByTestId("stage-editor").click();
  const next = onChange.mock.calls.at(-1)![0] as Group;
  expect(next.children[0]).toMatchObject({ value: "won" });
});

test("readOnly renders removable FilterChip summaries that prune the tree", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          { type: "condition", field: "stage", operator: "is", value: "won" },
          {
            type: "group",
            op: "or",
            children: [
              { type: "condition", field: "owner", operator: "is-empty" },
            ],
          },
        ],
      }}
      readOnly
      onChange={onChange}
    />,
  );
  const chips = document.querySelectorAll('[data-slot="filter-chip"]');
  expect(chips).toHaveLength(2);
  expect(chips[0]!.textContent).toContain("Stage");
  expect(chips[0]!.textContent).toContain("is won");
  await screen.getByRole("button", { name: "Remove Stage filter" }).click();
  const next = onChange.mock.calls.at(-1)![0] as Group;
  expect(next.children).toHaveLength(1);
  expect(next.children[0]!.type).toBe("group");
});

test("empty read-only summary says so", async () => {
  await render(<Controlled initial={EMPTY} readOnly />);
  expect(document.body.textContent).toContain("No filters");
});

test("no a11y violations — builder with nesting, invalid row, and summary", async () => {
  const screen = await render(
    <div>
      <Controlled
        initial={{
          type: "group",
          op: "and",
          children: [
            { type: "condition", field: "stage", operator: "is" },
            {
              type: "group",
              op: "or",
              children: [
                { type: "condition", field: "owner", operator: "is-empty" },
              ],
            },
          ],
        }}
      />
      <Controlled
        initial={{
          type: "group",
          op: "and",
          children: [
            { type: "condition", field: "stage", operator: "is", value: "won" },
          ],
        }}
        readOnly
      />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
