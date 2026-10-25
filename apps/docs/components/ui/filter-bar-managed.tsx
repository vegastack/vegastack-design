// @vegastack filter-bar-managed@0.25.75 sha256-Tfuuj9uXG6WA4NAmS+dxyASdGcOi+/EhOdcoChbcimE=

"use client";

import * as React from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Plus, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { DatePicker } from "@/components/ui/date-picker";
import { FilterChip } from "@/components/ui/filter-bar";
import {
  PeoplePicker,
  type PeoplePickerOption,
} from "@/components/ui/people-picker";
import { SortableList } from "@/components/ui/sortable-list";
import {
  useAsyncSearch,
  type AsyncSearchLoader,
} from "@/components/ui/use-async-search";
import { parseCalendarDay, toCalendarDay } from "@/lib/date-time";
import {
  SearchableSelect,
  type SearchableSelectProps,
} from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---
`FilterBuilder` (the `filter-bar-managed` item) is the stateful sibling `FilterBar`'s
docs promised: nested and/or groups with a configurable depth cap, condition rows whose
operator set and value editor are chosen by field type, add/remove at any level, and a
read-only chip summary rendered through the real `FilterChip`.

THE GRAMMAR IS HOST-INJECTED — the load-bearing decision. The component owns the tree
SHAPE (`FilterNode`: groups and conditions) and its editing surface; the host supplies a
`vocabulary` describing which fields exist, which operators each accepts, and which
editor type renders the value. The component never validates a field's semantics and
never serialises — the moment it did either, it would have adopted one app's AST.
(The platform's flat, implicitly-AND-ed filter params cannot express nesting; this tree
can, which is why it starts as a tree.)

Deliberately NOT done here:
- No `role="tree"`. Editing controls inside tree items are a known screen-reader trap;
  the structure is nested `<fieldset>`/`<legend>`, which announces group boundaries for
  free and keeps every control an ordinary form control.
- No URL/state serialisation, no persistence, no AI-suggested filters — all host-owned
  (G7), as the shipped `filter-bar` page already records.
- No filtering execution. The output is data; running it against rows is the host's job.
--- */

/** The filter tree: a group of conditions and sub-groups, or one condition. */
export type FilterNode<V = unknown> =
  | {
      type: "group";
      /** How this group's children combine. */
      op: "and" | "or";
      children: FilterNode<V>[];
    }
  | {
      type: "condition";
      /** `key` of a vocabulary field. */
      field: string;
      /** One of that field's declared operator values. */
      operator: string;
      /** The comparison value; omitted for operators with `requiresValue: false`. */
      value?: V;
    };

/** One operator a field supports. */
export interface FilterOperator {
  /** Stable operator value ("contains", "gt", "is-empty"). */
  value: string;
  /** Visible label ("contains", "greater than", "is empty"). */
  label: string;
  /**
   * Whether the operator takes a comparison value. `false` hides the value
   * editor and exempts the condition from the missing-value check — the same as
   * `valueShape: "none"`.
   * @default true
   */
  requiresValue?: boolean;
  /**
   * The shape of the value the operator compares against: `none` (no value — "is empty"),
   * `scalar` (one value — "is"), `list` (several — "is any of") or `range` (two bounds —
   * "between"). Switching to an operator of a different shape clears the value, so a scalar
   * never survives into a list operator. Defaults from `requiresValue`.
   * @default "scalar"
   */
  valueShape?: "none" | "scalar" | "list" | "range";
}

/** The value shape an operator declares, falling back to `requiresValue`. */
function valueShapeOf(
  operator: FilterOperator | undefined,
): NonNullable<FilterOperator["valueShape"]> {
  if (operator?.valueShape) return operator.valueShape;
  return operator?.requiresValue === false ? "none" : "scalar";
}

/** One field the host's grammar exposes. */
export interface FilterField<V = unknown> {
  /** Stable field key ("stage", "amount"). */
  key: string;
  /** Visible label ("Stage", "Amount"). */
  label: string;
  /**
   * Editor type for the value — keys the `editors` registry. Opaque to the
   * component: any string works as long as an editor exists for it (a built-in
   * text editor is the fallback).
   */
  type: string;
  /** Operators this field accepts, in menu order. */
  operators: readonly FilterOperator[];
  /**
   * The choices of an option field — what `OptionValueEditor`/`OptionsValueEditor` offer and
   * what `describeFilter` and the chip summary print for a stored value.
   * @default undefined
   */
  options?: readonly { value: string; label: string }[];
  /**
   * The unit a number field is measured in ("W", "°", "mm"), printed after its values.
   * @default undefined
   */
  unit?: string;
  /**
   * The people a `person` field offers (`PersonValueEditor`). A list here, or `search` for a
   * directory.
   * @default undefined
   */
  people?: readonly PeoplePickerOption[];
  /**
   * Finds people (a `person` field) or records (a `link` field) for a typed query, one keyset
   * page at a time. A person condition stores ids, so a `person` field searched this way (rather
   * than listed in `people`) needs `formatValue` for the chips and `describeFilter` to show names.
   * @default undefined
   */
  search?: AsyncSearchLoader<PeoplePickerOption | FilterRecordOption>;
  /**
   * Format a value for the read-only chip summary.

   * @default undefined
   */
  formatValue?: (value: V) => string;
}

/** What a value editor receives. */
export interface FilterValueEditorProps<V = unknown> {
  /** The condition's field definition. */
  field: FilterField<V>;
  /** The condition's current operator. */
  operator: string;
  /** Current value (may be undefined). */
  value: V | undefined;
  /** Commit a new value. */
  onValueChange: (value: V | undefined) => void;
  /** Accessible name for the editor control. */
  "aria-label": string;
  /** Whether the surrounding builder is disabled.
   * @default false
   */
  disabled?: boolean;
  /** Stable id for the editor control (used by the condition's error wiring).
   * @default undefined
   */
  id?: string;
  /** Set when the condition is missing a required value.
   * @default undefined
   */
  "aria-invalid"?: boolean;
  /** Points at the condition's "Value required" message when invalid.
   * @default undefined
   */
  "aria-describedby"?: string;
}

/** Props accepted by `FilterBuilder`. */
export interface FilterBuilderProps<V = unknown> {
  /** The host's field grammar. Order is menu order. */
  vocabulary: readonly FilterField<V>[];
  /**
   * Per-type value editors, keyed by `FilterField.type`. Types without an
   * entry fall back to a STRING-VALUED text `Input` — when `V` is not
   * `string`, every field type needs an entry here. Editors are host code — a
   * date field should render the host's date picker, not a text box. `range` and `list` keys
   * override the shape defaults; a `range` operator ("between") never falls back to the
   * field type's single-value editor — it gets `range`, else `NumberRangeEditor`. A
   * `<type>:range` or `<type>:list` key (`"date:range"`, `"person:list"`) wins over both for
   * that type alone.
   * @default undefined
   */
  editors?: Record<string, React.ComponentType<FilterValueEditorProps<V>>>;
  /** The controlled filter tree. Must be a `group` node at the root. */
  value: Extract<FilterNode<V>, { type: "group" }>;
  /** Fired with the next tree on every edit. */
  onValueChange: (value: Extract<FilterNode<V>, { type: "group" }>) => void;
  /**
   * Maximum group nesting depth (the root group is depth 1). The add-group
   * affordance disables at the cap and the reason renders as visible text
   * beside it. `1` means a flat list: no add-group control and no reason at all.
   * @default 3
   */
  maxDepth?: number;
  /**
   * `false` makes a flat list of conditions — the same as `maxDepth={1}`: no add-group control
   * and no reason. For rule editors ("required when …") that never nest.
   * @default true
   */
  allowGroups?: boolean;
  /**
   * What the rule is for, read as the root fieldset's name ("Required when") and put before the
   * sentence summary. Falls back to `aria-label`.
   * @default undefined
   */
  prefix?: string;
  /**
   * The builder's own words, for another language or a domain's vocabulary.
   * @default English defaults
   */
  labels?: Partial<FilterBuilderLabels>;
  /**
   * The condition row's field picker: a `Select`, or a `SearchableSelect` for a long vocabulary.
   * @default "select"
   */
  fieldPicker?: "select" | "searchable";
  /**
   * Props for the `searchable` field picker — e.g. `remote` with `useAsyncSearch` to search the
   * fields on the server. Every field it offers must also be in `vocabulary`.
   * @default undefined
   */
  fieldPickerProps?: Partial<
    Omit<
      SearchableSelectProps<FilterField<V>>,
      "value" | "onValueChange" | "multiple" | "id" | "aria-label"
    >
  >;
  /**
   * A row's own validation message, shown under the row and read as its value editor's
   * description. Runs on every render; return `undefined` for a valid row.
   * @default undefined
   */
  conditionError?: (
    condition: Extract<FilterNode<V>, { type: "condition" }>,
    path: number[],
  ) => string | undefined;
  /**
   * How the read-only summary reads: removable chips, or one sentence (`describeFilter`).
   * @default "chips"
   */
  summary?: "chips" | "sentence";
  /**
   * Maximum total conditions across the tree. The add affordances disable at
   * the cap.
   * @default 25
   */
  maxConditions?: number;
  /**
   * Disable every control.
   * @default false
   */
  disabled?: boolean;
  /**
   * Render the collapsed chip summary (via `FilterChip`) instead of the full
   * editing surface. Chips stay removable — removing one prunes that condition
   * from the tree — unless `disabled` is also set.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Accessible name for the builder.
   * @default "Filter conditions"
   */
  "aria-label"?: string;
  /** Extra classes for the root element.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the root element.

   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/** Immutably replace the group at `path` (indexes into nested children). */
function updateGroup<V>(
  root: Extract<FilterNode<V>, { type: "group" }>,
  path: readonly number[],
  update: (
    group: Extract<FilterNode<V>, { type: "group" }>,
  ) => Extract<FilterNode<V>, { type: "group" }>,
): Extract<FilterNode<V>, { type: "group" }> {
  if (path.length === 0) return update(root);
  const [head, ...rest] = path;
  const child = root.children[head!];
  if (!child || child.type !== "group") return root;
  const children = [...root.children];
  children[head!] = updateGroup(child, rest, update);
  return { ...root, children };
}

function countConditions(node: FilterNode<unknown>): number {
  if (node.type === "condition") return 1;
  return node.children.reduce((sum, child) => sum + countConditions(child), 0);
}

function collectConditions<V>(
  node: FilterNode<V>,
  path: readonly number[] = [],
): {
  condition: Extract<FilterNode<V>, { type: "condition" }>;
  path: number[];
}[] {
  if (node.type === "condition") return [{ condition: node, path: [...path] }];
  return node.children.flatMap((child, index) =>
    collectConditions(child, [...path, index]),
  );
}

/**
 * The built-in fallback value editor: a text `Input`. STRING-VALUED — when `V`
 * is not `string`, register a typed editor for that field `type`; the fallback
 * would otherwise write strings into the tree.
 *
 * @example
 * editors={{ text: TextValueEditor }}
 */
export function TextValueEditor<V>({
  field,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: FilterValueEditorProps<V>) {
  void field;
  return (
    <Input
      id={id}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      value={typeof value === "string" ? value : ""}
      onChange={(event) =>
        onValueChange((event.target.value || undefined) as V | undefined)
      }
    />
  );
}

/** The words `FilterBuilder` and `describeFilter` print. */
export interface FilterBuilderLabels {
  /** The "and" match type. */
  matchAll: string;
  /** The "or" match type. */
  matchAny: string;
  /** The add-condition button. */
  addCondition: string;
  /** The read-only summary of an empty tree. */
  empty: string;
  /** A missing value's message. */
  valueRequired: string;
  /** The field picker's accessible name. */
  field: string;
  /** The searchable field picker's search field name. */
  searchFields: string;
  /** The operator picker's accessible name. */
  operator: string;
  /** A condition's remove button, from its field label. */
  remove: (label: string) => string;
}

const DEFAULT_LABELS: FilterBuilderLabels = {
  matchAll: "All conditions match",
  matchAny: "Any condition matches",
  addCondition: "Add condition",
  empty: "No filters",
  valueRequired: "Value required",
  field: "Field",
  searchFields: "Search fields",
  operator: "Operator",
  remove: (label) => `Remove ${label} condition`,
};

/**
 * A number range as text: `≥ 10 W`, `10–20 W`, `≤ 20 W`. A unit that is a symbol (`°`, `%`)
 * sits on the number; a word unit gets a space.
 *
 * @example
 * formatRange(10, 20, "W"); // "10–20 W"
 */
export function formatRange(min?: number, max?: number, unit?: string): string {
  const withUnit = (text: string) =>
    unit ? (/^[°%′″]/.test(unit) ? `${text}${unit}` : `${text} ${unit}`) : text;
  if (min != null && max != null) return withUnit(`${min}–${max}`);
  if (min != null) return withUnit(`≥ ${min}`);
  if (max != null) return withUnit(`≤ ${max}`);
  return "";
}

/** One stored value, printed for a person: option labels, units, ranges. */
function formatFilterValue<V>(
  field: FilterField<V> | undefined,
  value: unknown,
  listJoin: string,
): string {
  if (value === undefined || value === null || value === "") return "";
  if (field?.formatValue) return field.formatValue(value as V);
  const optionLabel = (v: unknown) =>
    v === FILTER_ME
      ? "me"
      : (field?.options?.find((o) => o.value === v)?.label ??
        field?.people?.find((p) => p.id === v)?.name ??
        String(v));
  if (Array.isArray(value)) return value.map(optionLabel).join(listJoin);
  if (typeof value === "boolean") return value ? "checked" : "unchecked";
  if (typeof value === "object") {
    // The R4 shapes: a link's record, a relative date, a date range; else a number range.
    if ("label" in value && "id" in value)
      return String((value as FilterLinkValue).label);
    if ("relative" in value) {
      const relative = value as FilterRelativeDate;
      return relative.relative === "today"
        ? "today"
        : relative.relative === "this_week"
          ? "this week"
          : `the last ${relative.days ?? 7} days`;
    }
    if ("from" in value || "to" in value) {
      const { from, to } = value as { from?: string; to?: string };
      return from && to
        ? `${from} – ${to}`
        : from
          ? `from ${from}`
          : `until ${to}`;
    }
    const { min, max } = value as { min?: number; max?: number };
    return formatRange(min, max, field?.unit);
  }
  if (typeof value === "number") {
    const unit = field?.unit;
    if (!unit) return String(value);
    return /^[°%′″]/.test(unit) ? `${value}${unit}` : `${value} ${unit}`;
  }
  return optionLabel(value);
}

/**
 * The filter tree as one sentence — "Required when Dimming is not Non-dimmable and Beam angle is
 * at least 30°". Nested groups read in parentheses. An empty tree reads as "".
 *
 * @example
 * describeFilter(tree, vocabulary, { prefix: "Shown when" });
 */
export function describeFilter<V>(
  tree: Extract<FilterNode<V>, { type: "group" }>,
  vocabulary: readonly FilterField<V>[],
  labels: { prefix?: string; and?: string; or?: string } = {},
): string {
  const and = labels.and ?? "and";
  const or = labels.or ?? "or";
  const byKey = new Map(vocabulary.map((f) => [f.key, f]));
  const read = (node: FilterNode<V>, nested: boolean): string => {
    if (node.type === "condition") {
      const field = byKey.get(node.field);
      const operator = field?.operators.find(
        (op) => op.value === node.operator,
      );
      const value = formatFilterValue(field, node.value, ` ${or} `);
      return [
        field?.label ?? node.field,
        operator?.label ?? node.operator,
        value,
      ]
        .filter(Boolean)
        .join(" ");
    }
    const parts = node.children
      .map((child) => read(child, true))
      .filter(Boolean);
    const text = parts.join(` ${node.op === "and" ? and : or} `);
    return nested && parts.length > 1 ? `(${text})` : text;
  };
  const body = read(tree, false);
  if (!body) return "";
  return labels.prefix ? `${labels.prefix} ${body}` : body;
}

/**
 * A number value editor on `NumberField`. Commits a number, or `undefined` when cleared. The
 * field's `unit` shows as a suffix.
 *
 * @example
 * editors={{ number: NumberValueEditor }}
 */
export function NumberValueEditor<V>({
  field,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: FilterValueEditorProps<V>) {
  return (
    <NumberField
      id={id}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      suffix={field.unit}
      value={typeof value === "number" ? value : null}
      onValueChange={(next) =>
        onValueChange((next ?? undefined) as V | undefined)
      }
    />
  );
}

/**
 * A range value editor: Minimum and Maximum `NumberField`s. Either bound may be empty
 * (`{ min }`, `{ max }`), and a minimum above the maximum is an error read on the Minimum field.
 *
 * @example
 * editors={{ range: NumberRangeEditor }}
 */
export function NumberRangeEditor<V>({
  field,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: FilterValueEditorProps<V>) {
  const errorId = React.useId();
  const range = (value ?? {}) as { min?: number; max?: number };
  const inverted =
    range.min != null && range.max != null && range.min > range.max;
  const commit = (next: { min?: number; max?: number }) => {
    const clean: { min?: number; max?: number } = {};
    if (next.min != null) clean.min = next.min;
    if (next.max != null) clean.max = next.max;
    onValueChange(
      (clean.min == null && clean.max == null ? undefined : clean) as
        V | undefined,
    );
  };
  const describedBy = (extra?: string) =>
    [extra, ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  return (
    <span
      role="group"
      aria-label={ariaLabel}
      data-slot="filter-range-editor"
      className="flex min-w-0 flex-wrap items-center gap-2"
    >
      <NumberField
        id={id}
        aria-label="Minimum"
        aria-invalid={inverted || ariaInvalid || undefined}
        aria-describedby={describedBy(inverted ? errorId : undefined)}
        disabled={disabled}
        suffix={field.unit}
        className="w-28"
        value={range.min ?? null}
        onValueChange={(next) => commit({ ...range, min: next ?? undefined })}
      />
      <span aria-hidden="true" className="text-muted-foreground">
        –
      </span>
      <NumberField
        aria-label="Maximum"
        aria-invalid={inverted || ariaInvalid || undefined}
        aria-describedby={describedBy()}
        disabled={disabled}
        suffix={field.unit}
        className="w-28"
        value={range.max ?? null}
        onValueChange={(next) => commit({ ...range, max: next ?? undefined })}
      />
      {inverted ? (
        <span
          id={errorId}
          data-slot="filter-range-editor-error"
          className="basis-full text-xs text-destructive-text"
        >
          Minimum can't be more than maximum.
        </span>
      ) : null}
    </span>
  );
}

/** What `OptionValueEditor` and `OptionsValueEditor` take: the editor contract plus their words. */
export interface OptionValueEditorProps<
  V = unknown,
> extends FilterValueEditorProps<V> {
  /**
   * Shown while nothing is chosen.
   * @default "Choose…"
   */
  placeholder?: string;
  /**
   * Accessible name of the search field in a searchable list (more than seven options, or
   * several values).
   * @default "Search options"
   */
  searchLabel?: string;
}

type FilterOption = { value: string; label: string };

/** Above this many options, one-option picking gets a search field. */
const SEARCHABLE_OPTIONS = 7;

/** The `SearchableSelect` face both option editors share: an inline `sm` trigger. */
const optionPicker = {
  itemToKey: (o: FilterOption) => o.value,
  itemToStringLabel: (o: FilterOption) => o.label,
  renderItem: (o: FilterOption) => o.label,
  size: "sm",
  containerClassName: "w-fit",
  className: "w-auto min-w-32",
  contentClassName: "min-w-48",
} as const;

/**
 * One option from the field's `options`: a `Select` up to seven options, a `SearchableSelect`
 * above seven.
 *
 * @example
 * editors={{ option: OptionValueEditor }}
 */
export function OptionValueEditor<V>({
  field,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder = "Choose…",
  searchLabel = "Search options",
}: OptionValueEditorProps<V>) {
  const options = field.options ?? [];
  if (options.length > SEARCHABLE_OPTIONS)
    return (
      <SearchableSelect<FilterOption>
        {...optionPicker}
        items={options}
        value={options.find((o) => o.value === value) ?? null}
        onValueChange={(next) => onValueChange(next?.value as V | undefined)}
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        placeholder={placeholder}
        searchLabel={searchLabel}
      />
    );
  return (
    <Select
      items={Object.fromEntries(options.map((o) => [o.value, o.label]))}
      value={typeof value === "string" ? value : null}
      onValueChange={(next) =>
        onValueChange((next ?? undefined) as V | undefined)
      }
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size="sm"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className="w-fit min-w-32"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Several options from the field's `options` (a `list` operator — "is any of"), on a
 * `SearchableSelect multiple`. Commits the chosen values in option order, or `undefined` when
 * none.
 *
 * @example
 * editors={{ options: OptionsValueEditor }}
 */
export function OptionsValueEditor<V>({
  field,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder = "Choose…",
  searchLabel = "Search options",
}: OptionValueEditorProps<V>) {
  const options = field.options ?? [];
  const selected = Array.isArray(value) ? (value as string[]) : [];
  return (
    <SearchableSelect<FilterOption, true>
      {...optionPicker}
      multiple
      items={options}
      value={options.filter((o) => selected.includes(o.value))}
      onValueChange={(next) => {
        const ordered = options
          .filter((o) => next.includes(o))
          .map((o) => o.value);
        onValueChange(
          (ordered.length > 0 ? ordered : undefined) as V | undefined,
        );
      }}
      id={id}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      placeholder={placeholder}
      searchLabel={searchLabel}
    />
  );
}

/**
 * `FilterBuilder` — the stateful nested and/or filter builder
 * (`filter-bar-managed`). The host injects the grammar (`vocabulary` +
 * `editors`); the component owns the tree editing surface: group op pickers,
 * per-field operator menus, per-type value editors, add/remove at any level
 * with depth and condition caps, a missing-value check, and a read-only
 * `FilterChip` summary.
 *
 * Removing a condition moves focus to the next condition in the same group, or
 * to the group's add-condition button when it was the last — keyboard users
 * never fall back to the top of the page.
 *
 * @example
 * const [tree, setTree] = React.useState<FilterNode<string> & { type: "group" }>({
 *   type: "group", op: "and", children: [],
 * });
 * <FilterBuilder
 *   vocabulary={[
 *     { key: "stage", label: "Stage", type: "text",
 *       operators: [{ value: "is", label: "is" }] },
 *   ]}
 *   value={tree}
 *   onValueChange={setTree}
 * />
 */
export function FilterBuilder<V = unknown>({
  vocabulary,
  editors,
  value,
  onValueChange,
  maxDepth: maxDepthProp = 3,
  allowGroups = true,
  prefix,
  labels: labelsProp,
  fieldPicker = "select",
  fieldPickerProps,
  conditionError,
  summary = "chips",
  maxConditions = 25,
  disabled = false,
  readOnly = false,
  "aria-label": ariaLabel = "Filter conditions",
  className,
  ref,
}: FilterBuilderProps<V>) {
  const idBase = React.useId();
  const maxDepth = allowGroups ? maxDepthProp : 1;
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const opLabel = { and: labels.matchAll, or: labels.matchAny };
  const rootName = prefix ?? ariaLabel;
  // DS-28: "Value required" shows only once the value control was touched (blurred) or the
  // enclosing form was submitted — a freshly added row is not an error yet.
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [submitted, setSubmitted] = React.useState(false);
  const markTouched = React.useCallback((key: string) => {
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);
  React.useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const onSubmit = () => setSubmitted(true);
    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, []);
  const mergedRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  // After a removal, focus the element with this id once the tree re-renders.
  // Armed for exactly one commit: if the controlled host rejects the change
  // (no re-render follows), the id expires instead of yanking focus on some
  // unrelated later render.
  const pendingFocusId = React.useRef<string | null>(null);
  const armFocus = React.useCallback((id: string) => {
    pendingFocusId.current = id;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        pendingFocusId.current = null;
      }),
    );
  }, []);
  React.useEffect(() => {
    if (pendingFocusId.current) {
      const target = document.getElementById(pendingFocusId.current);
      pendingFocusId.current = null;
      // A disabled/absent target would silently drop focus to <body>.
      if (target && !target.matches(":disabled")) target.focus();
    }
  });

  const totalConditions = countConditions(value);
  const atConditionCap = totalConditions >= maxConditions;
  const fieldByKey = React.useMemo(
    () => new Map(vocabulary.map((field) => [field.key, field])),
    [vocabulary],
  );

  const rowId = (path: readonly number[]) => `${idBase}-row-${path.join("-")}`;
  const addId = (path: readonly number[]) => `${idBase}-add-${path.join("-")}`;

  if (readOnly) {
    const conditions = collectConditions(value);
    return (
      <div
        ref={ref}
        data-slot="filter-builder"
        data-read-only=""
        data-disabled={disabled ? "" : undefined}
        role="group"
        aria-label={ariaLabel}
        // `inert` (not just pointer-events) — a frozen summary must not be
        // keyboard-editable either.
        inert={disabled || undefined}
        className={cn(
          "flex flex-wrap items-center gap-1.5",
          disabled && "opacity-50",
          className,
        )}
      >
        {conditions.length === 0 ? (
          <span className="text-xs text-muted-foreground">{labels.empty}</span>
        ) : summary === "sentence" ? (
          <p data-slot="filter-builder-sentence" className="text-sm">
            {describeFilter(value, vocabulary, {
              prefix,
            })}
          </p>
        ) : (
          conditions.map(({ condition, path }) => {
            const field = fieldByKey.get(condition.field);
            const operator = field?.operators.find(
              (op) => op.value === condition.operator,
            );
            const formatted =
              condition.value === undefined
                ? undefined
                : formatFilterValue(field, condition.value, ", ");
            const label = field?.label ?? condition.field;
            return (
              <FilterChip
                key={path.join("-")}
                label={label}
                value={[operator?.label ?? condition.operator, formatted]
                  .filter(Boolean)
                  .join(" ")}
                removeLabel={`Remove ${label} filter`}
                onRemove={() => {
                  const parentPath = path.slice(0, -1);
                  const index = path[path.length - 1]!;
                  onValueChange(
                    updateGroup(value, parentPath, (g) => ({
                      ...g,
                      children: g.children.filter((_, i) => i !== index),
                    })),
                  );
                }}
              />
            );
          })
        )}
      </div>
    );
  }

  const renderGroup = (
    group: Extract<FilterNode<V>, { type: "group" }>,
    path: readonly number[],
  ): React.ReactNode => {
    const depth = path.length + 1;
    const atDepthCap = depth >= maxDepth;
    // A flat builder (`maxDepth={1}`) has no groups to add, so it shows no control and no reason.
    const allowsGroups = maxDepth > 1;
    const conditionIndexes = group.children
      .map((child, index) => (child.type === "condition" ? index : -1))
      .filter((index) => index !== -1);

    const removeChild = (index: number) => {
      // Focus policy: the next condition in this group, else the previous one,
      // else this group's add-condition button.
      const siblings = conditionIndexes.filter((i) => i !== index);
      const next =
        siblings.find((i) => i > index) ??
        siblings.filter((i) => i < index).pop();
      armFocus(
        next !== undefined
          ? // Indexes shift down after removal for rows past the removed one.
            rowId([...path, next > index ? next - 1 : next])
          : addId(path),
      );
      // Paths shift after a removal, so the touched marks of this group's rows would point at
      // the wrong rows; drop them.
      setTouched((prev) => {
        const prefix = `${path.join("-")}-`;
        return new Set([...prev].filter((key) => !key.startsWith(prefix)));
      });
      onValueChange(
        updateGroup(value, path, (g) => ({
          ...g,
          children: g.children.filter((_, i) => i !== index),
        })),
      );
    };

    return (
      <fieldset
        key={path.join("-") || "root"}
        data-slot="filter-builder-group"
        data-depth={depth}
        data-op={group.op}
        disabled={disabled}
        className={cn(
          "flex min-w-0 flex-col gap-2",
          depth > 1 && "rounded-md border border-border p-3",
        )}
      >
        <legend className="sr-only">
          {depth === 1 ? rootName : `Condition group (${opLabel[group.op]})`}
        </legend>
        <div className="flex items-center gap-2">
          <Select
            items={opLabel}
            value={group.op}
            onValueChange={(next) => {
              if (next === "and" || next === "or")
                onValueChange(
                  updateGroup(value, path, (g) => ({ ...g, op: next })),
                );
            }}
            disabled={disabled}
          >
            <SelectTrigger size="sm" aria-label="Match type" className="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">{opLabel.and}</SelectItem>
              <SelectItem value="or">{opLabel.or}</SelectItem>
            </SelectContent>
          </Select>
          {depth > 1 ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove group"
              disabled={disabled}
              onClick={() => {
                const parentPath = path.slice(0, -1);
                const index = path[path.length - 1]!;
                armFocus(addId(parentPath));
                onValueChange(
                  updateGroup(value, parentPath, (g) => ({
                    ...g,
                    children: g.children.filter((_, i) => i !== index),
                  })),
                );
              }}
            >
              <X />
            </Button>
          ) : null}
        </div>

        {group.children.map((child, index) => {
          const childPath = [...path, index];
          if (child.type === "group") return renderGroup(child, childPath);

          const field = fieldByKey.get(child.field);
          if (!field) return null;
          const operator = field.operators.find(
            (op) => op.value === child.operator,
          );
          const needsValue = valueShapeOf(operator) !== "none";
          const touchKey = `${childPath.join("-")}-`;
          const missingValue =
            needsValue &&
            (touched.has(touchKey) || submitted) &&
            (child.value === undefined ||
              child.value === ("" as unknown) ||
              (Array.isArray(child.value) && child.value.length === 0));
          const shape = valueShapeOf(operator);
          // "between" is always two boxes: a host's `range` editor, else Minimum–Maximum. A
          // single-value editor registered for the field's type never answers a range — it
          // would store one number where the operator needs two bounds.
          const Editor: React.ComponentType<FilterValueEditorProps<V>> =
            (shape !== "scalar"
              ? editors?.[`${field.type}:${shape}`]
              : undefined) ??
            (shape === "range"
              ? (editors?.range ?? NumberRangeEditor<V>)
              : ((shape === "list" ? editors?.list : undefined) ??
                editors?.[field.type] ??
                (shape === "list" && field.options
                  ? OptionsValueEditor<V>
                  : field.options
                    ? OptionValueEditor<V>
                    : TextValueEditor<V>)));
          const rowError = conditionError?.(child, childPath);
          const invalid = missingValue || rowError !== undefined;
          const editorId = `${rowId(childPath)}-value`;
          const errorId = `${rowId(childPath)}-error`;

          const patchCondition = (
            patch: Partial<Extract<FilterNode<V>, { type: "condition" }>>,
          ) =>
            onValueChange(
              updateGroup(value, path, (g) => {
                const children = [...g.children];
                children[index] = { ...child, ...patch };
                return { ...g, children };
              }),
            );
          const changeField = (nextKey: string | undefined) => {
            const nextField = nextKey ? fieldByKey.get(nextKey) : undefined;
            if (!nextField) return;
            // Changing field resets operator (and value when the editor
            // type changes — a date value in a text field is garbage).
            patchCondition({
              field: nextField.key,
              operator: nextField.operators[0]?.value ?? "",
              value: nextField.type === field.type ? child.value : undefined,
            });
          };
          // A row error (`conditionError`) is about the row, not only its value — and with a
          // no-value operator there is no editor to carry it — so the field picker reads it.
          const rowErrorProps =
            rowError !== undefined
              ? { "aria-invalid": true, "aria-describedby": errorId }
              : {};

          return (
            <div
              key={childPath.join("-")}
              data-slot="filter-builder-condition"
              data-invalid={invalid ? "" : undefined}
              className="flex min-w-0 flex-wrap items-center gap-2"
            >
              {fieldPicker === "searchable" ? (
                <SearchableSelect<FilterField<V>>
                  items={vocabulary}
                  itemToKey={(f) => f.key}
                  itemToStringLabel={(f) => f.label}
                  renderItem={(f) => f.label}
                  searchLabel={labels.searchFields}
                  size="sm"
                  containerClassName="w-fit"
                  className="w-auto"
                  contentClassName="min-w-48"
                  {...fieldPickerProps}
                  value={field}
                  isItemEqualToValue={(a, b) => a.key === b.key}
                  onValueChange={(next) => changeField(next?.key)}
                  id={rowId(childPath)}
                  aria-label={labels.field}
                  {...rowErrorProps}
                  disabled={disabled}
                />
              ) : (
                <Select
                  items={Object.fromEntries(
                    vocabulary.map((f) => [f.key, f.label]),
                  )}
                  value={child.field}
                  onValueChange={(nextKey) => changeField(String(nextKey))}
                  disabled={disabled}
                >
                  <SelectTrigger
                    id={rowId(childPath)}
                    size="sm"
                    aria-label={labels.field}
                    {...rowErrorProps}
                    className="w-fit"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vocabulary.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                items={Object.fromEntries(
                  field.operators.map((op) => [op.value, op.label]),
                )}
                value={child.operator}
                onValueChange={(next) => {
                  const nextOperator = field.operators.find(
                    (op) => op.value === String(next),
                  );
                  patchCondition({
                    operator: String(next),
                    // A value of another shape is garbage for the new operator — a scalar
                    // under "is any of", a list under "is" — and an operator that takes no
                    // value must not leave a stale one in the tree for the host to serialise.
                    value:
                      valueShapeOf(nextOperator) === valueShapeOf(operator)
                        ? child.value
                        : undefined,
                  });
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  size="sm"
                  aria-label={labels.operator}
                  className="w-fit"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {needsValue ? (
                <span
                  className="min-w-0 flex-1 basis-40"
                  onBlur={() => markTouched(touchKey)}
                >
                  <Editor
                    field={field}
                    operator={child.operator}
                    value={child.value}
                    onValueChange={(next) => patchCondition({ value: next })}
                    aria-label={`${field.label} value`}
                    disabled={disabled}
                    id={editorId}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? errorId : undefined}
                  />
                </span>
              ) : null}
              {invalid ? (
                <span
                  id={errorId}
                  data-slot="filter-builder-condition-error"
                  className="text-xs text-destructive-text"
                >
                  {missingValue ? labels.valueRequired : rowError}
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.remove(field.label)}
                disabled={disabled}
                onClick={() => removeChild(index)}
              >
                <X />
              </Button>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            id={addId(path)}
            variant="ghost"
            size="sm"
            disabled={disabled || atConditionCap || vocabulary.length === 0}
            onClick={() => {
              const first = vocabulary[0]!;
              onValueChange(
                updateGroup(value, path, (g) => ({
                  ...g,
                  children: [
                    ...g.children,
                    {
                      type: "condition",
                      field: first.key,
                      operator: first.operators[0]?.value ?? "",
                    },
                  ],
                })),
              );
            }}
          >
            <Plus /> {labels.addCondition}
          </Button>
          {allowsGroups ? (
            <Button
              variant="ghost"
              size="sm"
              data-slot="filter-builder-add-group"
              // FRM-4: `Button` keeps a disabled control focusable (`aria-disabled`, pointer
              // events alive), so the reason beside it stays reachable in the tab order.
              disabled={disabled || atDepthCap}
              onClick={() =>
                onValueChange(
                  updateGroup(value, path, (g) => ({
                    ...g,
                    children: [
                      ...g.children,
                      { type: "group", op: "and", children: [] },
                    ],
                  })),
                )
              }
            >
              <Plus /> Add group
            </Button>
          ) : null}
          {/* Cap reasons render as VISIBLE text beside the affordance, readable by everyone. */}
          {atConditionCap ? (
            <span
              data-slot="filter-builder-cap-reason"
              className="text-xs text-muted-foreground"
            >
              {maxConditions === 1
                ? "A filter can hold 1 condition at most"
                : `A filter can hold ${maxConditions} conditions at most`}
            </span>
          ) : allowsGroups && atDepthCap ? (
            <span
              data-slot="filter-builder-cap-reason"
              className="text-xs text-muted-foreground"
            >
              {/* Only reached with `maxDepth` ≥ 2 — a flat builder shows no reason — so the
                  count is always plural. */}
              Groups can nest {maxDepth} levels deep at most
            </span>
          ) : null}
        </div>
      </fieldset>
    );
  };

  return (
    <div
      ref={mergedRef}
      data-slot="filter-builder"
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      {renderGroup(value, [])}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * R4 value editors: date, person, checkbox, link
 * ----------------------------------------------------------------------------------------------*/

/** The person value meaning "whoever is reading" — `PersonValueEditor`'s "Me". */
export const FILTER_ME = "@me";

/** A relative date a `DateValueEditor` stores instead of a day. */
export interface FilterRelativeDate {
  /** Today, this week (Monday to Sunday in the reader's week), or the last `days` days. */
  relative: "today" | "this_week" | "last_days";
  /**
   * How many days `last_days` covers.
   * @default 7
   */
  days?: number;
}

/**
 * What a date condition holds: an ISO calendar day ("2026-10-24"), a relative date, or — for a
 * `range` operator ("between") — `{ from, to }` days.
 */
export type FilterDateValue =
  string | FilterRelativeDate | { from?: string; to?: string };

/** One record a `link` field's `search` finds. */
export interface FilterRecordOption {
  /** The record's id — what the condition stores. */
  value: string;
  /** Its name. */
  label: string;
  /**
   * The record kind's icon, from the host.
   * @default undefined
   */
  icon?: React.ReactNode;
}

/** What a `link` condition holds: the record's id and the name it was chosen by. */
export interface FilterLinkValue {
  id: string;
  label: string;
}

/** The value shape of the condition's operator (an editor gets the operator's value only). */
function shapeFor<V>(field: FilterField<V>, operator: string) {
  return valueShapeOf(field.operators.find((op) => op.value === operator));
}

const DATE_MODES = ["on", "today", "this_week", "last_days"] as const;
type DateMode = (typeof DATE_MODES)[number];

/**
 * A date value editor. A single-day operator ("is", "before", "after") offers a day from the
 * calendar or a relative date — Today, This week, Last N days; a `range` operator ("between")
 * takes two days. Days are ISO calendar days, so a reader's time zone never moves them.
 *
 * @example
 * editors={{ date: DateValueEditor }}
 */
export function DateValueEditor<V>({
  field,
  operator,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: FilterValueEditorProps<V>) {
  const commit = (next: FilterDateValue | undefined) =>
    onValueChange(next as V | undefined);
  const day = (iso: string | undefined) =>
    iso ? parseCalendarDay(iso) : undefined;
  if (shapeFor(field, operator) === "range") {
    const range = (value ?? {}) as { from?: string; to?: string };
    const set = (next: { from?: string; to?: string }) =>
      commit(next.from || next.to ? next : undefined);
    return (
      <span
        role="group"
        aria-label={ariaLabel}
        data-slot="filter-date-range-editor"
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        <DatePicker
          id={id}
          size="sm"
          aria-label="From"
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          value={day(range.from)}
          onValueChange={(date) =>
            set({ ...range, from: date ? toCalendarDay(date) : undefined })
          }
        />
        <span aria-hidden="true" className="text-muted-foreground">
          –
        </span>
        <DatePicker
          size="sm"
          aria-label="To"
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          value={day(range.to)}
          onValueChange={(date) =>
            set({ ...range, to: date ? toCalendarDay(date) : undefined })
          }
        />
      </span>
    );
  }
  const relative =
    value != null && typeof value === "object" && "relative" in value
      ? (value as FilterRelativeDate)
      : null;
  const mode: DateMode = relative ? relative.relative : "on";
  const modeLabels: Record<DateMode, string> = {
    on: "Exact date",
    today: "Today",
    this_week: "This week",
    last_days: "Last N days",
  };
  return (
    <span
      role="group"
      aria-label={ariaLabel}
      data-slot="filter-date-editor"
      className="flex min-w-0 flex-wrap items-center gap-2"
    >
      <Select
        items={modeLabels}
        value={mode}
        onValueChange={(next) => {
          const chosen = (next ?? "on") as DateMode;
          if (chosen === "on") commit(undefined);
          else if (chosen === "last_days")
            commit({ relative: "last_days", days: relative?.days ?? 7 });
          else commit({ relative: chosen });
        }}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          aria-label={`${ariaLabel}: kind of date`}
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          className="w-fit min-w-32"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_MODES.map((m) => (
            <SelectItem key={m} value={m}>
              {modeLabels[m]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mode === "on" ? (
        <DatePicker
          id={id}
          size="sm"
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          value={typeof value === "string" ? day(value) : undefined}
          onValueChange={(date) =>
            commit(date ? toCalendarDay(date) : undefined)
          }
        />
      ) : mode === "last_days" ? (
        <NumberField
          id={id}
          aria-label="Days"
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          min={1}
          className="w-24"
          value={relative?.days ?? 7}
          onValueChange={(days) =>
            commit({ relative: "last_days", days: Math.max(1, days ?? 1) })
          }
        />
      ) : null}
    </span>
  );
}

/**
 * A person value editor on `PeoplePicker`: the field's `people` (or its `search`), with "Me" first
 * — stored as `FILTER_ME`, so a saved view means whoever opens it. A `list` operator ("is any
 * of") picks several.
 *
 * @example
 * editors={{ person: PersonValueEditor }}
 */
export function PersonValueEditor<V>({
  field,
  operator,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  meLabel = "Me",
}: FilterValueEditorProps<V> & {
  /**
   * The name of the "whoever is reading" option.
   * @default "Me"
   */
  meLabel?: string;
}) {
  const me: PeoplePickerOption = { id: FILTER_ME, name: meLabel };
  // The condition stores ids; the options chosen from a `search` are remembered for their names.
  const [seen, setSeen] = React.useState<Record<string, PeoplePickerOption>>(
    {},
  );
  const optionOf = (personId: string): PeoplePickerOption =>
    personId === FILTER_ME
      ? me
      : (field.people?.find((p) => p.id === personId) ??
        seen[personId] ?? { id: personId, name: personId });
  const remember = (options: readonly PeoplePickerOption[]) =>
    setSeen((current) => ({
      ...current,
      ...Object.fromEntries(options.map((o) => [o.id, o])),
    }));
  const common = {
    options: field.people,
    search: field.search as AsyncSearchLoader<PeoplePickerOption> | undefined,
    leadingOptions: [me],
    size: "sm" as const,
    disabled,
    id,
    "aria-label": ariaLabel,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
  };
  if (shapeFor(field, operator) === "list") {
    const ids = Array.isArray(value) ? (value as string[]) : [];
    return (
      <PeoplePicker
        {...common}
        multiple
        value={ids.map(optionOf)}
        onValueChange={(next) => {
          remember(next);
          onValueChange(
            (next.length > 0 ? next.map((o) => o.id) : undefined) as
              V | undefined,
          );
        }}
      />
    );
  }
  return (
    <PeoplePicker
      {...common}
      value={typeof value === "string" ? optionOf(value) : null}
      onValueChange={(next) => {
        if (next) remember([next]);
        onValueChange((next?.id ?? undefined) as V | undefined);
      }}
    />
  );
}

/**
 * A checkbox value editor: Checked or Unchecked, stored as `true` or `false`.
 *
 * @example
 * editors={{ checkbox: CheckboxValueEditor }}
 */
export function CheckboxValueEditor<V>({
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  checkedLabel = "Checked",
  uncheckedLabel = "Unchecked",
}: FilterValueEditorProps<V> & {
  /** @default "Checked" */
  checkedLabel?: string;
  /** @default "Unchecked" */
  uncheckedLabel?: string;
}) {
  return (
    <Select
      items={{ true: checkedLabel, false: uncheckedLabel }}
      value={typeof value === "boolean" ? String(value) : null}
      onValueChange={(next) =>
        onValueChange(
          (next == null ? undefined : next === "true") as V | undefined,
        )
      }
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size="sm"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className="w-fit min-w-32"
      >
        <SelectValue placeholder="Choose…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">{checkedLabel}</SelectItem>
        <SelectItem value="false">{uncheckedLabel}</SelectItem>
      </SelectContent>
    </Select>
  );
}

/**
 * A link value editor: searches the field's records through the host's `search` (keyset paged,
 * debounced, race-safe) and stores the one chosen as `{ id, label }`, shown as a `RecordChip`.
 *
 * @example
 * editors={{ link: LinkValueEditor }}
 */
export function LinkValueEditor<V>({
  field,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder = "Find a record…",
  searchLabel = "Search records",
}: FilterValueEditorProps<V> & {
  /** @default "Find a record…" */
  placeholder?: string;
  /** @default "Search records" */
  searchLabel?: string;
}) {
  const loader = React.useCallback<AsyncSearchLoader<FilterRecordOption>>(
    async (query, context) =>
      field.search
        ? ((await field.search(query, context)) as {
            items: FilterRecordOption[];
            nextCursor?: string | null;
          })
        : { items: [] },
    [field],
  );
  // A condition switched to another link field searches that field's records, from page one.
  const search = useAsyncSearch(loader, { deps: [field.key] });
  const chosen = value as FilterLinkValue | undefined;
  const current: FilterRecordOption | null = chosen
    ? { value: chosen.id, label: chosen.label }
    : null;
  return (
    <SearchableSelect<FilterRecordOption>
      {...optionPicker}
      remote
      items={search.items}
      onSearchChange={search.onSearchChange}
      loading={search.loading}
      error={search.error}
      loadMore={search.loadMore}
      value={current}
      onValueChange={(next) =>
        onValueChange(
          (next ? { id: next.value, label: next.label } : undefined) as
            V | undefined,
        )
      }
      // Plain content: the option row and the trigger are the only interactive parts.
      renderItem={(option) => (
        <span className="flex min-w-0 items-center gap-1.5">
          {option.icon ? (
            <span
              aria-hidden
              className="flex shrink-0 text-muted-foreground [&_svg]:size-3.5"
            >
              {option.icon}
            </span>
          ) : null}
          <span className="min-w-0 truncate">{option.label}</span>
        </span>
      )}
      id={id}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      placeholder={placeholder}
      searchLabel={searchLabel}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * R4: SortBuilder and GroupByPicker
 * ----------------------------------------------------------------------------------------------*/

/** One sort key: a vocabulary field and a direction. */
export interface SortBuilderEntry {
  key: string;
  dir: "asc" | "desc";
}

/** Props accepted by `SortBuilder`. */
export interface SortBuilderProps {
  /** The fields that can sort — the same vocabulary `FilterBuilder` takes. */
  vocabulary: readonly Pick<FilterField, "key" | "label">[];
  /** The sort keys, first one first. */
  value: readonly SortBuilderEntry[];
  /** Called with the next keys. */
  onChange: (value: SortBuilderEntry[]) => void;
  /**
   * The most keys.
   * @default 3
   */
  max?: number;
  /**
   * Show the keys as removable `FilterChip`s instead of the editor.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Disable every control.
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessible name of the list.
   * @default "Sort"
   */
  "aria-label"?: string;
  /** Extra classes for the root.
   * @default undefined
   */
  className?: string;
}

/**
 * Row ids that stay with a ROW, not with the field it shows: changing a row's field keeps its id
 * (so its picker keeps focus), a move or a remove carries the ids along, and a list replaced from
 * outside gets fresh ones.
 */
function useRowIds(count: number) {
  const ids = React.useRef<string[]>([]);
  const next = React.useRef(0);
  const fresh = () => `row-${(next.current += 1)}`;
  if (ids.current.length !== count)
    ids.current = Array.from(
      { length: count },
      (_, i) => ids.current[i] ?? fresh(),
    );
  return {
    ids: ids.current,
    move: (from: number, to: number) => {
      const list = [...ids.current];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved!);
      ids.current = list;
    },
    remove: (index: number) => {
      ids.current = ids.current.filter((_, i) => i !== index);
    },
  };
}

function remaining<T extends { key: string }>(
  vocabulary: readonly T[],
  taken: readonly string[],
  keep?: string,
) {
  return vocabulary.filter((f) => f.key === keep || !taken.includes(f.key));
}

/** A field picker row control both builders share: a `Select` over the fields still free. */
function FieldSelect({
  fields,
  value,
  onChange,
  disabled,
  label,
}: {
  fields: readonly { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Select
      items={Object.fromEntries(fields.map((f) => [f.key, f.label]))}
      value={value}
      onValueChange={(next) => {
        if (next != null) onChange(String(next));
      }}
      disabled={disabled}
    >
      <SelectTrigger size="sm" aria-label={label} className="w-fit min-w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {fields.map((f) => (
          <SelectItem key={f.key} value={f.key}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * `SortBuilder` — up to three sort keys, first one first: a field and a direction per row, drag
 * (or the keyboard move mode) to reorder on `SortableList`, × to remove, "Add sort" to append the
 * next free field. `readOnly` shows the keys as removable `FilterChip`s. It edits data; the host
 * sorts.
 *
 * @example
 * <SortBuilder
 *   vocabulary={[{ key: "due", label: "Due" }, { key: "qty", label: "Qty" }]}
 *   value={[{ key: "due", dir: "asc" }]}
 *   onChange={setSort}
 * />
 */
export function SortBuilder({
  vocabulary,
  value,
  onChange,
  max = 3,
  readOnly = false,
  disabled = false,
  "aria-label": ariaLabel = "Sort",
  className,
}: SortBuilderProps) {
  const labelOf = (key: string) =>
    vocabulary.find((f) => f.key === key)?.label ?? key;
  const taken = value.map((entry) => entry.key);
  const free = remaining(vocabulary, taken);
  const rows = useRowIds(value.length);
  if (readOnly)
    return (
      <div
        data-slot="sort-builder"
        data-read-only=""
        data-disabled={disabled ? "" : undefined}
        role="group"
        aria-label={ariaLabel}
        // A frozen summary is not keyboard-editable either (as FilterBuilder's).
        inert={disabled || undefined}
        className={cn(
          "flex flex-wrap gap-1.5",
          disabled && "opacity-50",
          className,
        )}
      >
        {value.map((entry, index) => (
          <FilterChip
            key={entry.key}
            label={labelOf(entry.key)}
            icon={
              entry.dir === "asc" ? (
                <ArrowUpNarrowWide aria-hidden />
              ) : (
                <ArrowDownWideNarrow aria-hidden />
              )
            }
            value={entry.dir === "asc" ? "ascending" : "descending"}
            removeLabel={`Remove sort by ${labelOf(entry.key)}`}
            onRemove={() => onChange(value.filter((_, i) => i !== index))}
          />
        ))}
      </div>
    );
  const items = value.map((entry, index) => ({
    ...entry,
    index,
    id: rows.ids[index]!,
    label: labelOf(entry.key),
  }));
  return (
    <div
      data-slot="sort-builder"
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      <SortableList
        aria-label={ariaLabel}
        items={items}
        disabled={disabled}
        onReorder={({ from, to }) => {
          const next = [...value];
          const [moved] = next.splice(from.index, 1);
          next.splice(to.index, 0, moved!);
          rows.move(from.index, to.index);
          onChange(next);
        }}
        onRemove={(item) => {
          rows.remove(item.index);
          onChange(value.filter((_, i) => i !== item.index));
        }}
        removeLabel={(label) => `Remove sort by ${label}`}
        renderItem={(item) => (
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <FieldSelect
              fields={remaining(vocabulary, taken, item.key)}
              value={item.key}
              disabled={disabled}
              label={`Sort field ${items.indexOf(item) + 1}`}
              onChange={(key) =>
                onChange(
                  value.map((e) => (e.key === item.key ? { ...e, key } : e)),
                )
              }
            />
            <Select
              items={{ asc: "Ascending", desc: "Descending" }}
              value={item.dir}
              onValueChange={(dir) =>
                onChange(
                  value.map((e, i) =>
                    i === item.index
                      ? { ...e, dir: dir === "desc" ? "desc" : "asc" }
                      : e,
                  ),
                )
              }
              disabled={disabled}
            >
              <SelectTrigger
                size="sm"
                aria-label={`${item.label} direction`}
                className="w-fit min-w-32"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </span>
        )}
      />
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        data-slot="sort-builder-add"
        disabled={disabled || value.length >= max || free.length === 0}
        onClick={() => onChange([...value, { key: free[0]!.key, dir: "asc" }])}
      >
        <Plus /> Add sort
      </Button>
    </div>
  );
}

/** Props accepted by `GroupByPicker`. */
export interface GroupByPickerProps {
  /** The fields that can group — the same vocabulary `FilterBuilder` takes. */
  vocabulary: readonly Pick<FilterField, "key" | "label">[];
  /** The grouping fields, outermost first. */
  value: readonly string[];
  /** Called with the next fields. */
  onChange: (value: string[]) => void;
  /**
   * The most levels.
   * @default 2
   */
  max?: number;
  /**
   * Show the levels as removable `FilterChip`s instead of the editor.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Disable every control.
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessible name of the list.
   * @default "Group by"
   */
  "aria-label"?: string;
  /** Extra classes for the root.
   * @default undefined
   */
  className?: string;
}

/**
 * `GroupByPicker` — up to two grouping levels, outermost first: a field per row, drag to reorder,
 * × to remove, "Add group" for the next free field. `readOnly` shows them as `FilterChip`s. The
 * host groups.
 *
 * @example
 * <GroupByPicker
 *   vocabulary={[{ key: "status", label: "Status" }, { key: "owner", label: "Owner" }]}
 *   value={["status"]}
 *   onChange={setGroups}
 * />
 */
export function GroupByPicker({
  vocabulary,
  value,
  onChange,
  max = 2,
  readOnly = false,
  disabled = false,
  "aria-label": ariaLabel = "Group by",
  className,
}: GroupByPickerProps) {
  const labelOf = (key: string) =>
    vocabulary.find((f) => f.key === key)?.label ?? key;
  const free = remaining(vocabulary, value);
  const rows = useRowIds(value.length);
  if (readOnly)
    return (
      <div
        data-slot="group-by-picker"
        data-read-only=""
        data-disabled={disabled ? "" : undefined}
        role="group"
        aria-label={ariaLabel}
        // A frozen summary is not keyboard-editable either (as FilterBuilder's).
        inert={disabled || undefined}
        className={cn(
          "flex flex-wrap gap-1.5",
          disabled && "opacity-50",
          className,
        )}
      >
        {value.map((key) => (
          <FilterChip
            key={key}
            label="Group"
            value={labelOf(key)}
            removeLabel={`Remove grouping by ${labelOf(key)}`}
            onRemove={() => onChange(value.filter((k) => k !== key))}
          />
        ))}
      </div>
    );
  const items = value.map((key, index) => ({
    key,
    index,
    id: rows.ids[index]!,
    label: labelOf(key),
  }));
  return (
    <div
      data-slot="group-by-picker"
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      <SortableList
        aria-label={ariaLabel}
        items={items}
        disabled={disabled}
        onReorder={({ from, to }) => {
          const next = [...value];
          const [moved] = next.splice(from.index, 1);
          next.splice(to.index, 0, moved!);
          rows.move(from.index, to.index);
          onChange(next);
        }}
        onRemove={(item) => {
          rows.remove(item.index);
          onChange(value.filter((_, i) => i !== item.index));
        }}
        removeLabel={(label) => `Remove grouping by ${label}`}
        renderItem={(item) => (
          <FieldSelect
            fields={remaining(vocabulary, value, item.key)}
            value={item.key}
            disabled={disabled}
            label={`Group level ${item.index + 1}`}
            onChange={(key) =>
              onChange(value.map((k, i) => (i === item.index ? key : k)))
            }
          />
        )}
      />
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        data-slot="group-by-picker-add"
        disabled={disabled || value.length >= max || free.length === 0}
        onClick={() => onChange([...value, free[0]!.key])}
      >
        <Plus /> Add group
      </Button>
    </div>
  );
}
