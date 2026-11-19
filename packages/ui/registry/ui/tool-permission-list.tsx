// @vegastack tool-permission-list@0.120.0 sha256-sdhuPnSw3t8CA2YkS2nC6Bst+psvkZvdrD9w+1fdGOE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  ChevronRight,
  Ellipsis,
  Lock,
  LockOpen,
  TriangleAlert,
} from "lucide-react";

import type { ToolClass } from "@/components/ui/ask-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PermissionMenu,
  type PermissionMenuOption,
} from "@/components/ui/permission-menu";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";

/* ------------------------------------------------------------------------------------------------
 * ToolPermissionList — what an agent may do with one source's tools, answered per class and per
 * tool: Allow, Auto-check, Ask or Block. A class row ("Write · 31") is the group: its answer covers
 * its tools, which sit under it. Each row offers only its `answersAllowed`; an inherited answer is
 * muted with where it comes from; a locked row is read-only with who locked it; an admin view shows
 * the lock toggle. The rules at this layer list under their row, each with its condition. The
 * component holds no state of its own beyond what is open and what is searched: every change goes
 * to `onChange` and the caller's rows come back.
 * ----------------------------------------------------------------------------------------------*/

/** An answer to "may it run?". Never "auto". */
export type ToolAnswer = "allow" | "auto_check" | "ask" | "block";

/** One rule at this layer on a row. */
export type ToolRuleView = {
  /** The rule id, else its `ruleKey` (a pending agent-layer op). */
  key: string;
  /** What the rule answers. */
  answer: ToolAnswer;
  /** One-line summary; null = unconditional. */
  condition: string | null;
  /** The rule's note. */
  note?: string;
  /** Locked: workspace layer only. */
  locked?: boolean;
  /** Agent layer: "Waiting to be published". */
  pending?: boolean;
  /** Shows Edit and Remove. */
  editable: boolean;
};

/** One class or tool, as P1.3 §9.2 defines it. */
export type ToolPermissionRow = {
  /** Stable key: "class:write" | "tool:gmail_send" | "tool:create:task". */
  id: string;
  /** "Gmail › Send", "Write · 31". */
  label: string;
  /** A muted line under the label. */
  hint?: string;
  /** A class row is the group of the tools in its `children`. */
  kind: "class" | "tool";
  /** Its permission class. */
  class: ToolClass;
  /** The unconditional rule's answer, or the inherited one. */
  answer: ToolAnswer;
  /** Shown muted with `inheritedFrom`. */
  inherited: boolean;
  /** "workspace", "Finance team", "Standard". */
  inheritedFrom?: string;
  /** Read-only with the lock and who locked it. */
  locked?: { by: string };
  /** Admin view: shows the lock toggle. */
  lockable?: boolean;
  /** One-line condition summary. */
  condition?: string;
  /** "Add a condition" is offered. */
  conditionEditable?: boolean;
  /** The answers its menu offers, and only these. */
  answersAllowed: ToolAnswer[];
  /** Shown under the row while its answer is Allow. */
  warningOnAllow?: string;
  /** The tools under a class row. */
  children?: ToolPermissionRow[];
  /** The rules at this layer on this row, keyed by rule. */
  rules?: ToolRuleView[];
};

/** Handlers and modes every row shares. */
interface RowHandlers {
  onChange(
    rowId: string,
    change: { answer?: ToolAnswer; locked?: boolean },
  ): void;
  onAddRule?(rowId: string): void;
  onEditRule?(rowId: string, ruleKey: string): void;
  onRemoveRule?(rowId: string, ruleKey: string): void;
  onUseInherited?(rowId: string): void;
  readOnly?: boolean;
}

/** Props accepted by `ToolPermissionList`. */
export interface ToolPermissionListProps
  extends
    RowHandlers,
    Omit<React.ComponentPropsWithRef<"section">, "title" | "onChange"> {
  /** The source's name: "GitHub". */
  title: string;
  /** The source's icon, before the title. @default undefined */
  icon?: React.ReactNode;
  /** A muted line after the title: "Connected · company GitHub App". @default undefined */
  meta?: string;
  /** Class rows with their tools, or tool rows alone. */
  rows: ToolPermissionRow[];
  /**
   * A row's answer or lock changed. A class row's answer is `onChange("class:<class>", { answer })`;
   * the lock toggle is `onChange(rowId, { locked })`.
   */
  onChange(
    rowId: string,
    change: { answer?: ToolAnswer; locked?: boolean },
  ): void;
  /** "Add a condition": opens the caller's condition editor, empty, for that row. @default undefined */
  onAddRule?(rowId: string): void;
  /** Edit one rule. @default undefined */
  onEditRule?(rowId: string, ruleKey: string): void;
  /** Remove one rule. @default undefined */
  onRemoveRule?(rowId: string, ruleKey: string): void;
  /** "Use inherited": removes every rule at this layer on the row. @default undefined */
  onUseInherited?(rowId: string): void;
  /** Every answer as text, with no menus. @default false */
  readOnly?: boolean;
  /** A search box over the tools. @default true when there are over 50 tool rows */
  searchable?: boolean;
}

/** The four answers, with P1.3 §9.1's exact copy. */
const ANSWERS: Record<ToolAnswer, PermissionMenuOption<ToolAnswer>> = {
  allow: { value: "allow", label: "Allow", description: "Runs without asking" },
  auto_check: {
    value: "auto_check",
    label: "Auto-check",
    description: "A quick model check decides; asks when unsure",
  },
  ask: { value: "ask", label: "Ask", description: "Asks a person" },
  block: { value: "block", label: "Block", description: "Never runs" },
};

const ORDER: ToolAnswer[] = ["allow", "auto_check", "ask", "block"];

/** Tools a class row draws before "Show all". */
const FIRST = 50;

function countTools(rows: ToolPermissionRow[]): number {
  let n = 0;
  for (const row of rows) {
    if (row.kind === "tool") n += 1;
    if (row.children) n += countTools(row.children);
  }
  return n;
}

/** The answer control: the menu of `answersAllowed`, locked, or plain text. */
function AnswerControl({
  row,
  onChange,
  readOnly,
}: {
  row: ToolPermissionRow;
  onChange: RowHandlers["onChange"];
  readOnly?: boolean;
}) {
  const options = ORDER.filter(
    (answer) => row.answersAllowed.includes(answer) || answer === row.answer,
  ).map((answer) => ({
    ...ANSWERS[answer],
    disabled: !row.answersAllowed.includes(answer),
  }));
  return (
    <PermissionMenu<ToolAnswer>
      variant="chip"
      value={row.answer}
      options={options}
      readOnly={readOnly}
      locked={Boolean(row.locked)}
      lockedReason={row.locked ? `Locked by ${row.locked.by}` : undefined}
      onValueChange={(answer) => onChange(row.id, { answer })}
      aria-label={`${row.label} answer: ${ANSWERS[row.answer].label}`}
      className={cn(row.inherited && "text-muted-foreground")}
    />
  );
}

/** A row's ⋯: "Add a condition" and "Use inherited"; one item is its own quiet button. */
function RowMore({
  row,
  onAddRule,
  onUseInherited,
}: {
  row: ToolPermissionRow;
  onAddRule?: RowHandlers["onAddRule"];
  onUseInherited?: RowHandlers["onUseInherited"];
}) {
  const items: { label: string; run: () => void }[] = [];
  if (onAddRule && row.conditionEditable !== false && !row.locked)
    items.push({ label: "Add a condition", run: () => onAddRule(row.id) });
  if (onUseInherited && row.rules && row.rules.length > 0 && !row.locked)
    items.push({ label: "Use inherited", run: () => onUseInherited(row.id) });
  if (items.length === 0) return null;
  if (items.length === 1)
    return (
      <Button
        size="xs"
        variant="ghost"
        className="shrink-0 text-muted-foreground"
        onClick={items[0]!.run}
      >
        {items[0]!.label}
      </Button>
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`More for ${row.label}`}
          />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.run}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** One rule under its row: answer, condition, note, pending, and its own Edit · Remove. */
function RuleLine({
  row,
  rule,
  onEditRule,
  onRemoveRule,
  readOnly,
}: {
  row: ToolPermissionRow;
  rule: ToolRuleView;
  onEditRule?: RowHandlers["onEditRule"];
  onRemoveRule?: RowHandlers["onRemoveRule"];
  readOnly?: boolean;
}) {
  const actions: { label: string; run: () => void; destructive?: boolean }[] =
    [];
  if (rule.editable && !readOnly && !rule.locked) {
    if (onEditRule)
      actions.push({ label: "Edit", run: () => onEditRule(row.id, rule.key) });
    if (onRemoveRule)
      actions.push({
        label: "Remove",
        run: () => onRemoveRule(row.id, rule.key),
        destructive: true,
      });
  }
  return (
    <li
      data-slot="tool-permission-rule"
      data-pending={rule.pending ? "" : undefined}
      className="flex min-h-7 min-w-0 items-center gap-2 text-xs"
    >
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5">
        <span className="shrink-0 font-medium text-foreground">
          {ANSWERS[rule.answer].label}
        </span>
        <span className="min-w-0 truncate text-muted-foreground">
          {rule.condition ?? "Always"}
        </span>
        {rule.note ? (
          <span className="min-w-0 truncate text-muted-foreground">
            · {rule.note}
          </span>
        ) : null}
        {rule.pending ? (
          <span className="shrink-0 text-muted-foreground">
            Waiting to be published
          </span>
        ) : null}
      </span>
      {rule.locked ? (
        <Lock
          aria-label="Locked by your admin"
          role="img"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      ) : null}
      {actions.length === 1 ? (
        <Button
          size="xs"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          onClick={actions[0]!.run}
        >
          {actions[0]!.label}
        </Button>
      ) : actions.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Rule options: ${ANSWERS[rule.answer].label} ${rule.condition ?? "always"}`}
              />
            }
          >
            <Ellipsis aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                variant={action.destructive ? "destructive" : undefined}
                onClick={action.run}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}

/** Props accepted by `ToolPermissionRow`. */
export interface ToolPermissionRowProps extends RowHandlers {
  /** The row to draw. */
  row: ToolPermissionRow;
}

/**
 * `ToolPermissionRow` — one tool or class: its label and hint, where an inherited answer comes
 * from, its condition, its answer menu, the lock toggle in an admin view, and its rules.
 *
 * @example
 * <ToolPermissionRow row={row} onChange={(id, change) => save(id, change)} />
 */
export function ToolPermissionRow({
  row,
  onChange,
  onAddRule,
  onEditRule,
  onRemoveRule,
  onUseInherited,
  readOnly,
}: ToolPermissionRowProps) {
  const sub = [
    row.hint,
    row.inherited && row.inheritedFrom
      ? `Inherited from ${row.inheritedFrom}`
      : null,
  ].filter(Boolean);
  const editable = !readOnly && !row.locked;
  return (
    <div
      data-slot="tool-permission-row"
      data-kind={row.kind}
      data-class={row.class}
      data-inherited={row.inherited ? "" : undefined}
      data-locked={row.locked ? "" : undefined}
      className="flex min-w-0 flex-col gap-1"
    >
      <div className="flex min-h-9 min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            data-slot="tool-permission-label"
            title={row.label}
            className={cn(
              "min-w-0 truncate text-sm",
              row.kind === "class" ? "font-medium" : "text-foreground",
            )}
          >
            {row.label}
          </span>
          {sub.length ? (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {sub.join(" · ")}
            </span>
          ) : null}
          {row.condition ? (
            <span
              data-slot="tool-permission-condition"
              className="min-w-0 truncate text-xs text-muted-foreground"
            >
              {row.condition}
            </span>
          ) : null}
        </div>
        {row.lockable && !readOnly ? (
          <Toggle
            size="sm"
            pressed={Boolean(row.locked)}
            onPressedChange={(locked) => onChange(row.id, { locked })}
            aria-label={`Lock ${row.label} for every agent`}
            className="shrink-0"
          >
            {row.locked ? <Lock aria-hidden /> : <LockOpen aria-hidden />}
          </Toggle>
        ) : null}
        <AnswerControl
          row={row}
          onChange={onChange}
          readOnly={readOnly && !row.locked}
        />
        {editable ? (
          <RowMore
            row={row}
            onAddRule={onAddRule}
            onUseInherited={onUseInherited}
          />
        ) : null}
      </div>
      {row.warningOnAllow && row.answer === "allow" && !row.inherited ? (
        <p
          data-slot="tool-permission-warning"
          className="flex min-w-0 items-start gap-1.5 text-xs text-foreground"
        >
          <TriangleAlert
            aria-hidden
            className="mt-px size-3.5 shrink-0 text-warning-text"
          />
          <span className="min-w-0">{row.warningOnAllow}</span>
        </p>
      ) : null}
      {row.rules && row.rules.length > 0 ? (
        <ul
          data-slot="tool-permission-rules"
          aria-label={`Rules for ${row.label}`}
          className="flex min-w-0 flex-col border-s border-border ps-3"
        >
          {row.rules.map((rule) => (
            <RuleLine
              key={rule.key}
              row={row}
              rule={rule}
              onEditRule={onEditRule}
              onRemoveRule={onRemoveRule}
              readOnly={readOnly}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A class row and the tools under it, folding; past 50 tools, "Show all". */
function ClassGroup({
  row,
  query,
  defaultOpen,
  handlers,
}: {
  row: ToolPermissionRow;
  query: string;
  defaultOpen: boolean;
  handlers: RowHandlers;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [all, setAll] = React.useState(false);
  const panelId = React.useId();
  const tools = (row.children ?? []).filter(
    (child) => !query || child.label.toLowerCase().includes(query),
  );
  const shown = open || Boolean(query);
  const visible = all || query ? tools : tools.slice(0, FIRST);
  return (
    <li
      data-slot="tool-permission-group"
      data-state={shown ? "open" : "closed"}
      className="flex min-w-0 flex-col"
    >
      <div className="flex min-w-0 items-start gap-1">
        {row.children?.length ? (
          <Button
            size="icon-xs"
            variant="ghost"
            aria-expanded={shown}
            aria-controls={panelId}
            aria-label={`${shown ? "Hide" : "Show"} ${row.label}`}
            className="mt-1.5 shrink-0"
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "transition-transform rtl:rotate-180",
                shown && "rotate-90 rtl:rotate-90",
              )}
            />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <ToolPermissionRow row={row} {...handlers} />
        </div>
      </div>
      {shown && tools.length > 0 ? (
        <ul
          id={panelId}
          data-slot="tool-permission-tools"
          aria-label={row.label}
          className="flex min-w-0 flex-col ps-7"
        >
          {visible.map((child) => (
            <li key={child.id} className="min-w-0">
              <ToolPermissionRow row={child} {...handlers} />
            </li>
          ))}
          {!all && !query && tools.length > FIRST ? (
            <li>
              <Button
                size="xs"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setAll(true)}
              >
                Show all {tools.length}
              </Button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * `ToolPermissionList` — one source's tools and what an agent may do with each: a class row per
 * class with its tools under it, each answered Allow, Auto-check, Ask or Block.
 *
 * @example
 * <ToolPermissionList
 *   title="GitHub"
 *   meta="Connected · company GitHub App"
 *   rows={rows}
 *   onChange={(rowId, change) => save(rowId, change)}
 *   onAddRule={(rowId) => openConditionEditor(rowId)}
 * />
 */
export function ToolPermissionList({
  title,
  icon,
  meta,
  rows,
  onChange,
  onAddRule,
  onEditRule,
  onRemoveRule,
  onUseInherited,
  readOnly = false,
  searchable,
  className,
  ...props
}: ToolPermissionListProps) {
  const titleId = React.useId();
  const [search, setSearch] = React.useState("");
  const query = search.trim().toLowerCase();
  const total = countTools(rows);
  const canSearch = searchable ?? total > FIRST;
  const handlers: RowHandlers = {
    onChange,
    onAddRule,
    onEditRule,
    onRemoveRule,
    onUseInherited,
    readOnly,
  };
  const matches = (row: ToolPermissionRow) =>
    row.kind === "class"
      ? (row.children ?? []).some((child) =>
          child.label.toLowerCase().includes(query),
        ) || row.label.toLowerCase().includes(query)
      : row.label.toLowerCase().includes(query);
  const shownRows = query ? rows.filter(matches) : rows;
  return (
    <section
      data-slot="tool-permission-list"
      aria-labelledby={titleId}
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      <header className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {icon ? (
            <span
              data-slot="tool-permission-icon"
              className="inline-flex shrink-0"
            >
              {icon}
            </span>
          ) : null}
          <h3
            id={titleId}
            className="min-w-0 truncate text-sm font-semibold text-foreground"
          >
            {title}
          </h3>
          {meta ? (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </div>
        {canSearch ? (
          <SearchInput
            aria-label={`Search ${title} tools`}
            placeholder="Search tools"
            value={search}
            onValueChange={setSearch}
            className="w-full sm:w-56"
          />
        ) : null}
      </header>
      {rows.length === 0 ? (
        <p
          data-slot="tool-permission-empty"
          className="text-sm text-muted-foreground"
        >
          No tools
        </p>
      ) : shownRows.length === 0 ? (
        <p
          data-slot="tool-permission-empty"
          className="text-sm text-muted-foreground"
        >
          No tools match “{search.trim()}”
        </p>
      ) : (
        <ul className="flex min-w-0 flex-col divide-y divide-border">
          {shownRows.map((row) =>
            row.kind === "class" ? (
              <ClassGroup
                key={row.id}
                row={row}
                query={query}
                defaultOpen={total <= 12}
                handlers={handlers}
              />
            ) : (
              <li key={row.id} className="min-w-0">
                <ToolPermissionRow row={row} {...handlers} />
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

/** Props accepted by `ToolPermissionListSkeleton`. */
export interface ToolPermissionListSkeletonProps extends React.ComponentPropsWithRef<"div"> {
  /** How many placeholder rows. @default 4 */
  rows?: number;
}

/**
 * `ToolPermissionListSkeleton` — the list's shape while it loads: a title and rows with an answer.
 *
 * @example
 * <ToolPermissionListSkeleton rows={3} />
 */
export function ToolPermissionListSkeleton({
  rows = 4,
  className,
  ...props
}: ToolPermissionListSkeletonProps) {
  return (
    <div
      data-slot="tool-permission-list-skeleton"
      aria-hidden
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-9 items-center gap-3">
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
