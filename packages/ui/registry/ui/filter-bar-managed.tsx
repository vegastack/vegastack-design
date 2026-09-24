// @vegastack filter-bar-managed@0.19.0 sha256-WdxSCMPPs8K/Wzn5iiI+K5tpt+ZwrGwzv5TLlrTjTcs=

"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-bar";
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
   * date field should render the host's date picker, not a text box.

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
 */
function TextValueEditor<V>({
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

const OP_LABEL = { and: "All conditions match", or: "Any condition matches" };

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
  maxDepth = 3,
  maxConditions = 25,
  disabled = false,
  readOnly = false,
  "aria-label": ariaLabel = "Filter conditions",
  className,
  ref,
}: FilterBuilderProps<V>) {
  const idBase = React.useId();
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
          <span className="text-xs text-muted-foreground">No filters</span>
        ) : (
          conditions.map(({ condition, path }) => {
            const field = fieldByKey.get(condition.field);
            const operator = field?.operators.find(
              (op) => op.value === condition.operator,
            );
            const formatted =
              condition.value === undefined
                ? undefined
                : (field?.formatValue?.(condition.value) ??
                  String(condition.value));
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
          {depth === 1 ? ariaLabel : `Condition group (${OP_LABEL[group.op]})`}
        </legend>
        <div className="flex items-center gap-2">
          <Select
            items={OP_LABEL}
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
              <SelectItem value="and">{OP_LABEL.and}</SelectItem>
              <SelectItem value="or">{OP_LABEL.or}</SelectItem>
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
          const Editor = editors?.[field.type] ?? TextValueEditor<V>;
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

          return (
            <div
              key={childPath.join("-")}
              data-slot="filter-builder-condition"
              data-invalid={missingValue ? "" : undefined}
              className="flex min-w-0 flex-wrap items-center gap-2"
            >
              <Select
                items={Object.fromEntries(
                  vocabulary.map((f) => [f.key, f.label]),
                )}
                value={child.field}
                onValueChange={(nextKey) => {
                  const nextField = fieldByKey.get(String(nextKey));
                  if (!nextField) return;
                  // Changing field resets operator (and value when the editor
                  // type changes — a date value in a text field is garbage).
                  patchCondition({
                    field: nextField.key,
                    operator: nextField.operators[0]?.value ?? "",
                    value:
                      nextField.type === field.type ? child.value : undefined,
                  });
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id={rowId(childPath)}
                  size="sm"
                  aria-label="Field"
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
                  aria-label="Operator"
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
                    aria-invalid={missingValue || undefined}
                    aria-describedby={missingValue ? errorId : undefined}
                  />
                </span>
              ) : null}
              {missingValue ? (
                <span
                  id={errorId}
                  data-slot="filter-builder-condition-error"
                  className="text-xs text-destructive-text"
                >
                  Value required
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${field.label} condition`}
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
            <Plus /> Add condition
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
