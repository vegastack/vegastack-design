import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  describeFilter,
  FilterBuilder,
  formatRange,
  NumberRangeEditor,
  NumberValueEditor,
  OptionsValueEditor,
  OptionValueEditor,
  TextValueEditor,
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

/** Blur the value editor of the first condition — "touching" it, as a user tabbing past does. */
function touchFirstValue() {
  const editor = document.querySelector<HTMLElement>(
    '[data-slot="filter-builder-condition"] [aria-label$=" value"]',
  )!;
  editor.focus();
  editor.blur();
}

test("DS-28: a value-requiring condition without a value is marked invalid with visible text once touched", async () => {
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
  // Untouched: a freshly added row is not an error yet.
  expect(row.hasAttribute("data-invalid")).toBe(false);
  expect(row.textContent).not.toContain("Value required");
  touchFirstValue();
  await expect.poll(() => row.hasAttribute("data-invalid")).toBe(true);
  expect(row.textContent).toContain("Value required");
});

test("DS-28: submitting the enclosing form shows every missing value", async () => {
  await render(
    <form onSubmit={(event) => event.preventDefault()}>
      <Controlled
        initial={{
          type: "group",
          op: "and",
          children: [{ type: "condition", field: "stage", operator: "is" }],
        }}
      />
      <button type="submit">Apply</button>
    </form>,
  );
  const row = conditionRows()[0]!;
  expect(row.hasAttribute("data-invalid")).toBe(false);
  (
    document.querySelector('button[type="submit"]') as HTMLButtonElement
  ).click();
  await expect.poll(() => row.hasAttribute("data-invalid")).toBe(true);
});

test("DS-28: maxDepth 1 renders no group control and no reason", async () => {
  const screen = await render(<Controlled initial={EMPTY} maxDepth={1} />);
  expect(
    screen.container.querySelector('[data-slot="filter-builder-add-group"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="filter-builder-cap-reason"]'),
  ).toBeNull();
  await expect
    .element(screen.getByRole("button", { name: "Add condition" }))
    .toBeInTheDocument();
});

test("DS-28: a disabled add-group stays focusable with aria-disabled", async () => {
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
  const nested = screen
    .getByRole("button", { name: "Add group" })
    .nth(0)
    .element() as HTMLButtonElement;
  expect(nested.getAttribute("aria-disabled")).toBe("true");
  expect(nested.disabled).toBe(false);
  nested.focus();
  expect(document.activeElement).toBe(nested);
});

test('DS-28: switching "is" → "is any of" clears a scalar; a same-shape switch keeps it', async () => {
  const LIST_VOCABULARY: FilterField<string | string[]>[] = [
    {
      key: "stage",
      label: "Stage",
      type: "text",
      operators: [
        { value: "is", label: "is" },
        { value: "is-not", label: "is not" },
        { value: "in", label: "is any of", valueShape: "list" },
      ],
    },
  ];
  const onChange = vi.fn();
  function ListControlled() {
    const [tree, setTree] = React.useState<
      Extract<FilterNode<string | string[]>, { type: "group" }>
    >({
      type: "group",
      op: "and",
      children: [
        { type: "condition", field: "stage", operator: "is", value: "won" },
      ],
    });
    return (
      <FilterBuilder<string | string[]>
        vocabulary={LIST_VOCABULARY}
        editors={{ text: () => <span aria-label="Stage value" /> }}
        value={tree}
        onValueChange={(next) => {
          setTree(next);
          onChange(next);
        }}
      />
    );
  }
  const screen = await render(<ListControlled />);
  await screen.getByRole("combobox", { name: "Operator" }).click();
  await screen.getByRole("option", { name: "is not" }).click();
  expect(onChange.mock.lastCall?.[0].children[0]).toMatchObject({
    operator: "is-not",
    value: "won",
  });
  await screen.getByRole("combobox", { name: "Operator" }).click();
  await screen.getByRole("option", { name: "is any of" }).click();
  expect(onChange.mock.lastCall?.[0].children[0]).toMatchObject({
    operator: "in",
  });
  expect(onChange.mock.lastCall?.[0].children[0].value).toBeUndefined();
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
  expect(root.getAttribute("aria-disabled")).not.toBe("true");
  expect(nested.getAttribute("aria-disabled")).toBe("true");
  // The reason is VISIBLE text beside the affordance, so it is readable by
  // everyone rather than only by a screen reader that reaches the control.
  const reason = document.querySelector(
    '[data-slot="filter-builder-cap-reason"]',
  );
  expect(reason?.textContent).toContain("levels deep");
});

test("the condition cap disables add-condition but never add-group (restructuring stays possible)", async () => {
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
  expect(addCondition.getAttribute("aria-disabled")).toBe("true");
  const addGroup = screen
    .getByRole("button", { name: "Add group" })
    .element() as HTMLButtonElement;
  // An empty group adds zero conditions — at the cap the user may still
  // restructure the filter.
  expect(addGroup.getAttribute("aria-disabled")).not.toBe("true");
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
  touchFirstValue();
  await expect
    .poll(() => conditionRows()[0]!.hasAttribute("data-invalid"))
    .toBe(true);
  await expectNoA11yViolations(screen.container);
});

test("keyboard-only: build and remove a nested condition without a pointer", async () => {
  const { userEvent } = await import("vitest/browser");
  const screen = await render(<Controlled initial={EMPTY} />);
  // Add a group by keyboard.
  (
    screen.getByRole("button", { name: "Add group" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  expect(
    document.querySelectorAll('[data-slot="filter-builder-group"]'),
  ).toHaveLength(2);
  // Add a condition INSIDE the nested group by keyboard (its add button
  // renders before the root's).
  (
    screen
      .getByRole("button", { name: "Add condition" })
      .nth(0)
      .element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  expect(conditionRows()).toHaveLength(1);
  // Remove it by keyboard; focus policy lands on the group's add button.
  (
    screen
      .getByRole("button", { name: "Remove Stage condition" })
      .element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  expect(conditionRows()).toHaveLength(0);
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.textContent)
    .toContain("Add condition");
});

test("switching to a no-value operator clears the stale value from the tree", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          { type: "condition", field: "owner", operator: "is", value: "priya" },
        ],
      }}
      onChange={onChange}
    />,
  );
  await screen.getByRole("combobox", { name: "Operator" }).click();
  await screen.getByRole("option", { name: "is empty" }).click();
  const next = onChange.mock.calls.at(-1)![0] as Group;
  expect(next.children[0]).toEqual({
    type: "condition",
    field: "owner",
    operator: "is-empty",
    value: undefined,
  });
});

test("cap reasons render as VISIBLE text (a disabled button leaves the tab order)", async () => {
  await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          { type: "condition", field: "stage", operator: "is", value: "a" },
        ],
      }}
      maxConditions={1}
    />,
  );
  const reason = document.querySelector(
    '[data-slot="filter-builder-cap-reason"]',
  );
  expect(reason?.textContent).toBe("A filter can hold 1 condition at most");
});

test("the missing-value error is wired to the editor via aria", async () => {
  await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [{ type: "condition", field: "stage", operator: "is" }],
      }}
    />,
  );
  const editor = document.querySelector(
    '[aria-label="Stage value"]',
  ) as HTMLElement;
  expect(editor.getAttribute("aria-invalid")).toBeNull();
  touchFirstValue();
  await expect.poll(() => editor.getAttribute("aria-invalid")).toBe("true");
  const describedBy = editor.getAttribute("aria-describedby")!;
  expect(document.getElementById(describedBy)?.textContent).toBe(
    "Value required",
  );
});

test("readOnly + disabled makes the summary inert (not keyboard-removable)", async () => {
  await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          { type: "condition", field: "stage", operator: "is", value: "won" },
        ],
      }}
      readOnly
      disabled
    />,
  );
  const root = document.querySelector('[data-slot="filter-builder"]')!;
  expect(root.hasAttribute("inert")).toBe(true);
});

test("focus indicator: nothing in the builder strips the outline (text entry excepted)", async () => {
  await render(
    <Controlled
      initial={{
        type: "group",
        op: "and",
        children: [
          { type: "condition", field: "stage", operator: "is", value: "won" },
        ],
      }}
    />,
  );
  const offenders = Array.from(document.querySelectorAll("*")).filter(
    (el) =>
      (el.getAttribute("class") ?? "").includes("outline-none") &&
      !["INPUT", "TEXTAREA"].includes(el.tagName),
  );
  // Upstream writes `outline-none` on every control and relies on its own ring; FOC-11 is decided
  // as **shadcn**, so the file-scoped `outline-none` lint went with it. What must still hold is the
  // thing that rule was protecting: a focusable control may strip the outline ONLY if something
  // paints focus for it. Here that is the global `:focus-visible` outline in base.css, which the
  // geometry lane measures per control on a real focused element — so the claim this test keeps is
  // narrower and honest: no control strips focus AND declares a glow ring in its place.
  const focusableOffenders = offenders.filter(
    (el) =>
      el.matches("button, a, [tabindex]") &&
      /\bring-3\b|ring-ring\//.test(el.getAttribute("class") ?? ""),
  );
  expect(focusableOffenders).toEqual([]);
});

// ---- DS-41 / DS-42: condition rules, sentence summary, value editors -------------------------

const RULES: FilterField<unknown>[] = [
  {
    key: "dimming",
    label: "Dimming",
    type: "option",
    options: [
      { value: "none", label: "Non-dimmable" },
      { value: "dali", label: "DALI" },
    ],
    operators: [
      { value: "is", label: "is" },
      { value: "is-not", label: "is not" },
      { value: "any-of", label: "is any of", valueShape: "list" },
    ],
  },
  {
    key: "beam",
    label: "Beam angle",
    type: "number",
    unit: "°",
    operators: [
      { value: "gte", label: "is at least" },
      { value: "between", label: "is between", valueShape: "range" },
    ],
  },
  {
    key: "watts",
    label: "Wattage",
    type: "number",
    unit: "W",
    operators: [{ value: "between", label: "is between", valueShape: "range" }],
  },
];

type AnyGroup = Extract<FilterNode<unknown>, { type: "group" }>;

const RULE: AnyGroup = {
  type: "group",
  op: "and",
  children: [
    { type: "condition", field: "dimming", operator: "is-not", value: "none" },
    { type: "condition", field: "beam", operator: "gte", value: 30 },
  ],
};

test("describeFilter reads the rule as one sentence (DS-41)", () => {
  expect(describeFilter(RULE, RULES, { prefix: "Required when" })).toBe(
    "Required when Dimming is not Non-dimmable and Beam angle is at least 30°",
  );
  expect(
    describeFilter({ ...RULE, op: "or" }, RULES, { prefix: "Shown when" }),
  ).toBe(
    "Shown when Dimming is not Non-dimmable or Beam angle is at least 30°",
  );
  expect(
    describeFilter(
      {
        type: "group",
        op: "and",
        children: [
          {
            type: "condition",
            field: "dimming",
            operator: "any-of",
            value: ["none", "dali"],
          },
          {
            type: "condition",
            field: "watts",
            operator: "between",
            value: { min: 10, max: 20 },
          },
        ],
      },
      RULES,
    ),
  ).toBe(
    "Dimming is any of Non-dimmable or DALI and Wattage is between 10–20 W",
  );
  expect(
    describeFilter({ type: "group", op: "and", children: [] }, RULES),
  ).toBe("");
});

test("formatRange reads one or two bounds with a unit (DS-42)", () => {
  expect(formatRange(10, undefined, "W")).toBe("≥ 10 W");
  expect(formatRange(10, 20, "W")).toBe("10–20 W");
  expect(formatRange(undefined, 20, "W")).toBe("≤ 20 W");
  expect(formatRange(30, undefined, "°")).toBe("≥ 30°");
  expect(formatRange()).toBe("");
});

function RuleBuilder(
  props: Partial<React.ComponentProps<typeof FilterBuilder<unknown>>> & {
    initial?: AnyGroup;
  },
) {
  const { initial = RULE, ...rest } = props;
  const [tree, setTree] = React.useState<AnyGroup>(initial);
  return (
    <FilterBuilder<unknown>
      vocabulary={RULES}
      editors={{
        option: OptionValueEditor,
        number: NumberValueEditor,
      }}
      value={tree}
      onValueChange={setTree}
      {...rest}
    />
  );
}

test("allowGroups={false} is a flat rule list; prefix names the fieldset (DS-41)", async () => {
  const screen = await render(
    <RuleBuilder allowGroups={false} prefix="Required when" />,
  );
  expect(
    screen.container.querySelector('[data-slot="filter-builder-add-group"]'),
  ).toBeNull();
  const legend = screen.container.querySelector("legend")!;
  expect(legend.textContent).toBe("Required when");
  await expectNoA11yViolations(screen.container);
});

test("labels rename the builder's own words (DS-41)", async () => {
  const screen = await render(
    <RuleBuilder
      allowGroups={false}
      labels={{
        addCondition: "Add rule",
        remove: (label) => `Delete ${label} rule`,
        matchAll: "Every rule",
      }}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Add rule" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Delete Dimming rule" }))
    .toBeInTheDocument();
  expect(screen.container.textContent).toContain("Every rule");
});

test("conditionError wires a row's own error to its value editor (DS-41)", async () => {
  const screen = await render(
    <RuleBuilder
      conditionError={(c) =>
        c.field === "beam" && typeof c.value === "number" && c.value > 20
          ? "Beam angle must be 20° or less."
          : undefined
      }
    />,
  );
  const input = screen.getByRole("textbox", { name: "Beam angle value" });
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(input)
    .toHaveAccessibleDescription("Beam angle must be 20° or less.");
  await expectNoA11yViolations(screen.container);
});

test('summary="sentence" renders the rule as a sentence when read-only (DS-41)', async () => {
  const screen = await render(
    <RuleBuilder readOnly summary="sentence" prefix="Required when" />,
  );
  expect(
    screen.container.querySelector('[data-slot="filter-builder-sentence"]')
      ?.textContent,
  ).toBe(
    "Required when Dimming is not Non-dimmable and Beam angle is at least 30°",
  );
  expect(
    screen.container.querySelector('[data-slot="filter-chip"]'),
  ).toBeNull();
});

test("OptionValueEditor round-trips an option value (DS-42)", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <OptionValueEditor
      field={RULES[0]!}
      operator="is"
      value="none"
      onValueChange={onValueChange}
      aria-label="Dimming value"
    />,
  );
  expect(
    screen.getByRole("combobox", { name: "Dimming value" }).element()
      .textContent,
  ).toContain("Non-dimmable");
  await screen.getByRole("combobox", { name: "Dimming value" }).click();
  await screen.getByRole("option", { name: "DALI" }).click();
  expect(onValueChange).toHaveBeenLastCalledWith("dali");
});

test("OptionsValueEditor round-trips a list value (DS-42)", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <OptionsValueEditor
      field={RULES[0]!}
      operator="any-of"
      value={["none"]}
      onValueChange={onValueChange}
      aria-label="Dimming values"
    />,
  );
  expect(screen.container.textContent).toContain("Non-dimmable");
  await screen.getByRole("combobox", { name: "Dimming values" }).click();
  await screen.getByRole("option", { name: "DALI" }).click();
  expect(onValueChange).toHaveBeenLastCalledWith(["none", "dali"]);
});

test("NumberValueEditor round-trips a number (DS-42)", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <NumberValueEditor
      field={RULES[1]!}
      operator="gte"
      value={30}
      onValueChange={onValueChange}
      aria-label="Beam angle value"
    />,
  );
  const input = screen.getByRole("textbox", { name: "Beam angle value" });
  await expect.element(input).toHaveValue("30");
  await input.fill("45");
  await userEvent.keyboard("{Tab}");
  expect(onValueChange).toHaveBeenLastCalledWith(45);
});

test("range editor wires the min > max error (DS-42)", async () => {
  const screen = await render(
    <NumberRangeEditor
      field={RULES[2]!}
      operator="between"
      value={{ min: 20, max: 10 }}
      onValueChange={() => {}}
      aria-label="Wattage"
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Minimum" }))
    .toHaveAccessibleDescription("Minimum can't be more than maximum.");
  await expectNoA11yViolations(screen.container);
});

test("range editor accepts one bound (DS-42)", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <NumberRangeEditor
      field={RULES[2]!}
      operator="between"
      value={undefined}
      onValueChange={onValueChange}
      aria-label="Wattage"
    />,
  );
  await screen.getByRole("textbox", { name: "Minimum" }).fill("10");
  await userEvent.keyboard("{Tab}");
  expect(onValueChange).toHaveBeenLastCalledWith({ min: 10 });
});

test("TextValueEditor is exported and string-valued (DS-42)", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <TextValueEditor
      field={VOCABULARY[0]!}
      operator="is"
      value="Open"
      onValueChange={onValueChange}
      aria-label="Stage value"
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Stage value" }))
    .toHaveValue("Open");
});
