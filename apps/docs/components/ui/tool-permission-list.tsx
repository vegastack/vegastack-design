// @vegastack tool-permission-list@0.139.0 sha256-7z9+Hg59ePY6bFkk2SnuoTyRuWLDP3t2PrRQ5ywTyLY=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  ChevronRight,
  Ellipsis,
  ListFilterPlus,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ToolPermissionList — what an agent may do with one source's tools, answered for the whole source,
 * per class and per tool: Always allow, Needs approval or Blocked. An `all` row ("All tools") comes
 * first and answers every tool of the source; a class row ("Write · 31") is the group: its answer
 * covers its tools, which sit under it. Each row offers only its `answersAllowed`; an answer that
 * comes from elsewhere is muted with "From …"; a row holding its own rule offers "Use the default"
 * at the end of its answer menu; a locked row is read-only with who locked it; an admin view shows
 * the lock toggle. The rules at this layer list under their row, each with its condition. The header
 * can carry a `scope` switch ("Every agent" · "This agent") and a `note` under it. The component
 * holds no state of its own beyond what is open and what is searched: every change goes to
 * `onChange` and the caller's rows come back.
 * ----------------------------------------------------------------------------------------------*/

/** An answer to "may it run?": Always allow, Needs approval or Blocked. */
export type ToolAnswer = "allow" | "ask" | "block";

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

/** What every row carries, whatever its kind. */
type ToolPermissionRowBase = {
  /** Stable key: "all" | "class:write" | "tool:gmail_send" | "tool:create:task". */
  id: string;
  /** "All tools", "Gmail › Send", "Write · 31". */
  label: string;
  /** A muted line under the label. */
  hint?: string;
  /** The unconditional rule's answer, or the one it follows. */
  answer: ToolAnswer;
  /** The answer comes from elsewhere: shown muted with "From {inheritedFrom}". */
  inherited: boolean;
  /** "your admin's lock", "workspace", "this agent's rules", "your rules", "Standard level". */
  inheritedFrom?: string;
  /**
   * Where the answer comes from once this row's own rules go — the description of "Use the
   * default" ("Follows {defaultFrom}."). Omitted, the item has no description.
   */
  defaultFrom?: string;
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
  /** The tools under a class row. An `all` row's are never drawn. */
  children?: ToolPermissionRow[];
  /** The rules at this layer on this row, keyed by rule. */
  rules?: ToolRuleView[];
};

/**
 * The whole source, one class or one tool. `all` answers every tool of the source and is drawn
 * first, above the classes, with no class and no tools under it; a `class` row is the group of the tools
 * in its `children`; a `tool` row is one tool.
 */
export type ToolPermissionRow = ToolPermissionRowBase &
  (
    | {
        /** The whole source's row ("All tools"). */
        kind: "all";
        class?: never;
      }
    | {
        /** A class row is the group of the tools in its `children`. */
        kind: "class" | "tool";
        /** Its permission class. */
        class: ToolClass;
      }
  );

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
  /**
   * "Use the default", the last item of a row's answer menu while the row holds its own rule:
   * removes every rule at this layer on the row. @default undefined
   */
  onUseInherited?(rowId: string): void;
  /** Every answer as text, with no menus. @default false */
  readOnly?: boolean;
  /** A search box over the tools. @default true when there are over 50 tool rows */
  searchable?: boolean;
  /** One muted line under the header: "New tools from Supadata follow All tools.". @default undefined */
  note?: string;
  /**
   * Who the answers apply to, as a segmented switch in the header ("Every agent" · "This agent"),
   * named "Applies to". @default undefined
   */
  scope?: ToolPermissionScope;
}

/** The header's "Applies to" switch. */
export type ToolPermissionScope = {
  /** The chosen option's value. */
  value: string;
  /** Two or three options, in order. */
  options: { value: string; label: string }[];
  /** Called with the chosen option's value. */
  onChange(value: string): void;
};

/** The three answers, with the product's exact copy. */
const ANSWERS: Record<ToolAnswer, PermissionMenuOption<ToolAnswer>> = {
  allow: {
    value: "allow",
    label: "Always allow",
    description: "Runs without asking.",
  },
  ask: {
    value: "ask",
    label: "Needs approval",
    description: "Asks a person each time.",
  },
  block: {
    value: "block",
    label: "Blocked",
    description: "Never runs. The agent isn't offered it.",
  },
};

const ORDER: ToolAnswer[] = ["allow", "ask", "block"];

/** Tools a class row draws before "Show all". */
const FIRST = 50;

function countTools(rows: ToolPermissionRow[]): number {
  let n = 0;
  for (const row of rows) {
    if (row.kind === "tool") n += 1;
    // An `all` row's children are never drawn, so they never count.
    if (row.children && row.kind !== "all") n += countTools(row.children);
  }
  return n;
}

/**
 * The answer control: the menu of `answersAllowed` (ending in "Use the default" while the row holds
 * its own rule), locked, or plain text.
 */
function AnswerControl({
  row,
  onChange,
  onUseInherited,
  readOnly,
}: {
  row: ToolPermissionRow;
  onChange: RowHandlers["onChange"];
  onUseInherited?: RowHandlers["onUseInherited"];
  readOnly?: boolean;
}) {
  const canReset =
    Boolean(onUseInherited) &&
    Boolean(row.rules?.length) &&
    !row.locked &&
    !readOnly;
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
      onReset={canReset ? () => onUseInherited?.(row.id) : undefined}
      resetDescription={
        row.defaultFrom ? `Follows ${row.defaultFrom}.` : undefined
      }
      aria-label={`${row.label} answer: ${ANSWERS[row.answer].label}`}
      className={cn(row.inherited && "text-muted-foreground")}
    />
  );
}

/** "Add a condition": a quiet icon button with its name in a tooltip, so a long list doesn't repeat a word on every row. */
function AddCondition({
  row,
  onAddRule,
}: {
  row: ToolPermissionRow;
  onAddRule?: RowHandlers["onAddRule"];
}) {
  if (!onAddRule || row.conditionEditable === false || row.locked) return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`Add a condition: ${row.label}`}
            onClick={() => onAddRule(row.id)}
          />
        }
      >
        <ListFilterPlus aria-hidden />
      </TooltipTrigger>
      <TooltipContent>Add a condition</TooltipContent>
    </Tooltip>
  );
}

/**
 * One rule under its row: answer, condition, note, pending, and its own Edit · Remove. An
 * unconditional rule reads its answer label alone.
 */
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
        {rule.condition ? (
          <span className="min-w-0 truncate text-muted-foreground">
            {rule.condition}
          </span>
        ) : null}
        {rule.note ? (
          <span className="min-w-0 truncate text-muted-foreground">
            · {rule.note}
          </span>
        ) : null}
        {rule.pending ? (
          <span className="shrink-0 text-muted-foreground">
            · Waiting to be published
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
                aria-label={`Rule options: ${ANSWERS[rule.answer].label}${rule.condition ? ` ${rule.condition}` : ""}`}
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
 * `ToolPermissionRow` — the whole source, one class or one tool: its label and hint, where a
 * followed answer comes from ("From workspace"), its condition, its answer menu (with "Use the
 * default" while it holds its own rule), the lock toggle in an admin view, and its rules.
 *
 * @example
 * <ToolPermissionRow
 *   row={row}
 *   onChange={(id, change) => save(id, change)}
 *   onUseInherited={(id) => clearRules(id)}
 * />
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
    row.inherited && row.inheritedFrom ? `From ${row.inheritedFrom}` : null,
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
      <div className="flex min-h-10 min-w-0 items-center gap-2 py-1">
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
          onUseInherited={onUseInherited}
          readOnly={readOnly && !row.locked}
        />
        {readOnly ? null : (
          <span
            data-slot="tool-permission-more"
            className="flex w-6 shrink-0 justify-end"
          >
            {editable ? <AddCondition row={row} onAddRule={onAddRule} /> : null}
          </span>
        )}
      </div>
      {row.warningOnAllow && row.answer === "allow" ? (
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
              readOnly={readOnly || Boolean(row.locked)}
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
  gutter,
  handlers,
}: {
  row: ToolPermissionRow;
  query: string;
  defaultOpen: boolean;
  /** Another class in the list folds: hold the › column so every label lines up. */
  gutter: boolean;
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
            className="mt-2 shrink-0 aria-expanded:bg-transparent"
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
        ) : gutter ? (
          <span aria-hidden className="size-6 shrink-0" />
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
 * `ToolPermissionList` — one source's tools and what an agent may do with each: an "All tools" row
 * first, then a class row per class with its tools under it, each answered Always allow, Needs
 * approval or Blocked.
 *
 * @example
 * <ToolPermissionList
 *   title="GitHub"
 *   meta="Connected · company GitHub App"
 *   note="New tools from GitHub follow All tools."
 *   scope={{
 *     value: "agent",
 *     options: [
 *       { value: "every", label: "Every agent" },
 *       { value: "agent", label: "This agent" },
 *     ],
 *     onChange: setScope,
 *   }}
 *   rows={rows}
 *   onChange={(rowId, change) => save(rowId, change)}
 *   onAddRule={(rowId) => openConditionEditor(rowId)}
 *   onUseInherited={(rowId) => clearRules(rowId)}
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
  note,
  scope,
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
  // The `all` row leads, above the classes, whatever order the caller passed.
  const ordered = [
    ...rows.filter((row) => row.kind === "all"),
    ...rows.filter((row) => row.kind !== "all"),
  ];
  const shownRows = query ? ordered.filter(matches) : ordered;
  const hasGroups = rows.some(
    (row) => row.kind === "class" && Boolean(row.children?.length),
  );
  return (
    <section
      data-slot="tool-permission-list"
      aria-labelledby={titleId}
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <header className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 basis-48 items-center gap-2">
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
          {scope ? (
            <ToggleGroup
              spacing={0}
              variant="outline"
              deselectable={false}
              aria-label="Applies to"
              data-slot="tool-permission-scope"
              value={[scope.value]}
              onValueChange={(value) => {
                const next = value[0];
                if (typeof next === "string" && next !== scope.value)
                  scope.onChange(next);
              }}
              className="shrink-0"
            >
              {scope.options.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : null}
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
        {note ? (
          <p
            data-slot="tool-permission-note"
            className="min-w-0 text-xs text-muted-foreground"
          >
            {note}
          </p>
        ) : null}
      </div>
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
                gutter={hasGroups}
                handlers={handlers}
              />
            ) : (
              <li
                key={row.id}
                className={cn(
                  "min-w-0",
                  // The All tools row's label lines up with the class rows' labels, past their ›.
                  row.kind === "all" && hasGroups && "ps-7",
                )}
              >
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
