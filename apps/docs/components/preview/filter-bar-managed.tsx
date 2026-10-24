"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/filter-bar-managed` (dogfoods the registry) → auto-scanned.
import {
  CheckboxValueEditor,
  DateValueEditor,
  describeFilter,
  FILTER_ME,
  FilterBuilder,
  GroupByPicker,
  LinkValueEditor,
  PersonValueEditor,
  SortBuilder,
  type SortBuilderEntry,
  type FilterField,
  type FilterNode,
  NumberValueEditor,
  OptionValueEditor,
} from "@/components/ui/filter-bar-managed";

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
  {
    key: "amount",
    label: "Amount",
    type: "text",
    operators: [
      { value: "gt", label: "greater than" },
      { value: "lt", label: "less than" },
    ],
  },
];

const SEED: Group = {
  type: "group",
  op: "and",
  children: [
    { type: "condition", field: "stage", operator: "is", value: "Qualified" },
    {
      type: "group",
      op: "or",
      children: [
        { type: "condition", field: "amount", operator: "gt", value: "10000" },
        { type: "condition", field: "owner", operator: "is-empty" },
      ],
    },
  ],
};

export function filterBarManaged(): ReactNode {
  const [tree, setTree] = useState<Group>(SEED);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xl">
        <FilterBuilder<string>
          vocabulary={VOCABULARY}
          value={tree}
          onValueChange={setTree}
        />
      </div>
    </Wrapper>
  );
}

export function filterBarManagedSummary(): ReactNode {
  const [tree, setTree] = useState<Group>(SEED);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xl">
        <FilterBuilder<string>
          vocabulary={VOCABULARY}
          value={tree}
          onValueChange={setTree}
          readOnly
        />
      </div>
    </Wrapper>
  );
}

export function filterBarManagedCaps(): ReactNode {
  const [tree, setTree] = useState<Group>({
    type: "group",
    op: "and",
    children: [
      { type: "condition", field: "stage", operator: "is", value: "Won" },
      {
        type: "group",
        op: "or",
        children: [
          { type: "condition", field: "owner", operator: "is-empty" },
          { type: "condition", field: "amount", operator: "gt", value: "500" },
        ],
      },
    ],
  });
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5">
        <FilterBuilder<string>
          vocabulary={VOCABULARY}
          value={tree}
          onValueChange={setTree}
          maxConditions={3}
          maxDepth={2}
        />
        <p className="text-xs text-muted-foreground">
          Both caps reached: the add affordances disable with a readable reason.
        </p>
      </div>
    </Wrapper>
  );
}

/** DS-28: `maxDepth={1}` is a flat list — no add-group control, and no reason to explain one. */
export function filterBarManagedOneLevel(): ReactNode {
  const [tree, setTree] = useState<Group>({
    type: "group",
    op: "and",
    children: [
      { type: "condition", field: "stage", operator: "is", value: "Won" },
    ],
  });
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xl">
        <FilterBuilder<string>
          vocabulary={VOCABULARY}
          value={tree}
          onValueChange={setTree}
          maxDepth={1}
        />
      </div>
    </Wrapper>
  );
}

const SHAPED_VOCABULARY: FilterField<string>[] = [
  {
    key: "stage",
    label: "Stage",
    type: "text",
    operators: [
      { value: "is", label: "is" },
      { value: "is-not", label: "is not" },
      { value: "in", label: "is any of", valueShape: "list" },
      { value: "is-empty", label: "is empty", valueShape: "none" },
    ],
  },
];

/**
 * DS-28: `valueShape` — switching "is" to "is not" keeps the value (both scalar); switching to
 * "is any of" (a list) clears it, and "is empty" takes none.
 */
export function filterBarManagedValueShapes(): ReactNode {
  const [tree, setTree] = useState<Group>({
    type: "group",
    op: "and",
    children: [
      { type: "condition", field: "stage", operator: "is", value: "Won" },
    ],
  });
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xl">
        <FilterBuilder<string>
          vocabulary={SHAPED_VOCABULARY}
          value={tree}
          onValueChange={setTree}
          maxDepth={1}
        />
      </div>
    </Wrapper>
  );
}

const RULE_VOCABULARY: FilterField<unknown>[] = [
  {
    key: "dimming",
    label: "Dimming",
    type: "option",
    options: [
      { value: "none", label: "Non-dimmable" },
      { value: "dali", label: "DALI" },
      { value: "triac", label: "TRIAC" },
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
];

type RuleGroup = Extract<FilterNode<unknown>, { type: "group" }>;

const RULE_SEED: RuleGroup = {
  type: "group",
  op: "and",
  children: [
    { type: "condition", field: "dimming", operator: "is-not", value: "none" },
    { type: "condition", field: "beam", operator: "gte", value: 30 },
  ],
};

/**
 * "is between" always renders the Minimum–Maximum pair, even though `editors.number` registers a
 * single-value editor for Beam angle; a minimum above the maximum reads under the pair.
 */
export function filterBarManagedBetween(): ReactNode {
  const [tree, setTree] = useState<RuleGroup>({
    type: "group",
    op: "and",
    children: [
      {
        type: "condition",
        field: "beam",
        operator: "between",
        value: { min: 60, max: 24 },
      },
    ],
  });
  return (
    <Wrapper className="flex-col items-stretch">
      <FilterBuilder<unknown>
        vocabulary={RULE_VOCABULARY}
        editors={{ number: NumberValueEditor, option: OptionValueEditor }}
        value={tree}
        onValueChange={setTree}
        allowGroups={false}
        prefix="Required when"
        labels={{ addCondition: "Add rule", remove: (l) => `Remove ${l} rule` }}
      />
      <p className="text-sm text-muted-foreground">
        {describeFilter(tree, RULE_VOCABULARY, { prefix: "Required when" })}
      </p>
    </Wrapper>
  );
}

export function filterBarManagedConditionRules(): ReactNode {
  const [tree, setTree] = useState<RuleGroup>(RULE_SEED);
  return (
    <Wrapper className="flex-col items-stretch">
      <FilterBuilder<unknown>
        vocabulary={RULE_VOCABULARY}
        value={tree}
        onValueChange={setTree}
        allowGroups={false}
        fieldPicker="searchable"
        prefix="Required when"
        labels={{ addCondition: "Add rule", remove: (l) => `Remove ${l} rule` }}
        conditionError={(c) =>
          c.field === "beam" && typeof c.value === "number" && c.value > 120
            ? "Beam angle can't be more than 120°."
            : undefined
        }
      />
      <p className="text-sm text-muted-foreground">
        {describeFilter(tree, RULE_VOCABULARY, { prefix: "Required when" })}
      </p>
    </Wrapper>
  );
}

export function filterBarManagedSentence(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <FilterBuilder<unknown>
        vocabulary={RULE_VOCABULARY}
        value={RULE_SEED}
        onValueChange={() => {}}
        readOnly
        summary="sentence"
        prefix="Required when"
      />
    </Wrapper>
  );
}

/* ── R4: the date, person, checkbox and link editors; SortBuilder and GroupByPicker ── */

const TABLE_VOCABULARY: FilterField<unknown>[] = [
  {
    key: "due",
    label: "Due",
    type: "date",
    operators: [
      { value: "on", label: "is" },
      { value: "before", label: "is before" },
      { value: "between", label: "is between", valueShape: "range" },
    ],
  },
  {
    key: "owner",
    label: "Owner",
    type: "person",
    people: [
      { id: "u1", name: "Asha Rao", email: "asha@example.com" },
      { id: "u2", name: "Ben Kim", email: "ben@example.com" },
    ],
    operators: [
      { value: "is", label: "is" },
      { value: "any", label: "is any of", valueShape: "list" },
    ],
  },
  {
    key: "sample",
    label: "Sample sent",
    type: "checkbox",
    operators: [{ value: "is", label: "is" }],
  },
  {
    key: "customer",
    label: "Customer",
    type: "link",
    search: async (query) => ({
      items: ["Acme Lighting", "Globex", "Initech", "Umbrella"]
        .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
        .map((name) => ({ value: name.toLowerCase(), label: name })),
    }),
    operators: [{ value: "is", label: "is" }],
  },
];

export function filterBarManagedTableEditors(): ReactNode {
  const [tree, setTree] = useState<
    Extract<FilterNode<unknown>, { type: "group" }>
  >({
    type: "group",
    op: "and",
    children: [
      {
        type: "condition",
        field: "due",
        operator: "on",
        value: { relative: "this_week" },
      },
      { type: "condition", field: "owner", operator: "is", value: FILTER_ME },
      { type: "condition", field: "sample", operator: "is", value: false },
    ],
  });
  return (
    <Wrapper className="block">
      <FilterBuilder<unknown>
        vocabulary={TABLE_VOCABULARY}
        editors={{
          date: DateValueEditor,
          "date:range": DateValueEditor,
          person: PersonValueEditor,
          "person:list": PersonValueEditor,
          checkbox: CheckboxValueEditor,
          link: LinkValueEditor,
        }}
        value={tree}
        onValueChange={setTree}
      />
    </Wrapper>
  );
}

const SORT_FIELDS = [
  { key: "due", label: "Due" },
  { key: "qty", label: "Qty" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Owner" },
];

export function filterBarManagedSortGroup(): ReactNode {
  const [sort, setSort] = useState<SortBuilderEntry[]>([
    { key: "due", dir: "asc" },
  ]);
  const [groups, setGroups] = useState<string[]>(["status"]);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <SortBuilder vocabulary={SORT_FIELDS} value={sort} onChange={setSort} />
      <GroupByPicker
        vocabulary={SORT_FIELDS}
        value={groups}
        onChange={setGroups}
      />
      <div className="flex flex-wrap gap-1.5">
        <SortBuilder
          readOnly
          vocabulary={SORT_FIELDS}
          value={sort}
          onChange={setSort}
        />
        <GroupByPicker
          readOnly
          vocabulary={SORT_FIELDS}
          value={groups}
          onChange={setGroups}
        />
      </div>
    </Wrapper>
  );
}
