// @vegastack field-type-link-step@0.26.4 sha256-zNhN85ZggRMEy0m0hUJQmDmhrIH//xECZ5o3elwyiEM=

"use client";

import * as React from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { FieldTypePickerStepControls } from "@/components/ui/field-type-picker";

/* ---
`FieldTypeLinkStep` is the "Links to" step of `FieldTypePicker`: rendered from its `renderStep`
for the link type (a type with `next`), it lists the kinds of record a link field can point at,
grouped, each with one line on what a link to it does. A kind that lives in a table (Rows) asks
which table in a third view, retitling the picker's step header ("Which table's rows?"); choosing
one reports `{ kind, table }`.

The kinds and the tables are the host's, so the record vocabulary stays out of the design system,
and the picker itself stays free of it too (it only knows `next` and `renderStep`).

Back: the step header's back button leaves for the type list; Backspace in an empty search goes
up one view (tables → kinds → types).

Deliberately NOT done here:
- No fetching: `tables` is the host's list (pass `tablesLoading` while it arrives).
- No field settings after the choice: the host's form follows it.
--- */

/** One kind of record a link field can point at. */
export interface FieldLinkKind {
  /** Stable id ("page", "table_row"). */
  id: string;
  /** Its name, plural ("Pages", "Rows"). */
  label: string;
  /** Its icon. @default undefined */
  icon?: React.ReactNode;
  /** The group heading it sits under ("Library", "Sales"); ungrouped kinds come first. @default undefined */
  group?: string;
  /** One line on what a link to it does ("Each cell links to pages in the Library"). @default undefined */
  description?: string;
  /** Extra words a search matches. @default undefined */
  keywords?: readonly string[];
  /** Why it can't be chosen here — shown, and the pick is refused. @default undefined */
  disabledReason?: string;
  /** The kind lives in a table (rows): choosing it asks which table. @default false */
  table?: boolean;
}

/** A table a rows link can point at. */
export interface FieldLinkTable {
  /** The table's id. */
  id: string;
  /** Its name. */
  label: string;
  /** Its icon. @default undefined */
  icon?: React.ReactNode;
  /** A muted line ("Sales · 117 rows"). @default undefined */
  description?: string;
}

/** What the step chose: a kind, and for a table kind its table. */
export interface FieldLinkChoice {
  /** The kind's id. */
  kind: string;
  /** The table's id, for a kind marked `table`. @default undefined */
  table?: string;
}

/** Props accepted by `FieldTypeLinkStep`. */
export interface FieldTypeLinkStepProps {
  /** The kinds of record, in order within their groups. */
  kinds: readonly FieldLinkKind[];
  /** Called with the final choice. */
  onSelect: (choice: FieldLinkChoice) => void;
  /** The controls `renderStep` hands over: the third view retitles the step header with them. */
  controls: FieldTypePickerStepControls;
  /** The tables a kind marked `table` can point at. @default [] */
  tables?: readonly FieldLinkTable[];
  /** The tables are still arriving: the table view says so. @default false */
  tablesLoading?: boolean;
  /** The current choice, checked. @default undefined */
  value?: Partial<FieldLinkChoice>;
  /** Group order; groups not listed follow in first-seen order. @default undefined */
  groupOrder?: readonly string[];
  /** @default "Search kinds of record" */
  placeholder?: string;
  /** @default "No kind of record matches." */
  emptyLabel?: string;
  /** @default "Search tables" */
  tablePlaceholder?: string;
  /** @default "No table matches." */
  tableEmptyLabel?: string;
  /** @default "Loading tables…" */
  tablesLoadingLabel?: string;
  /**
   * The step header's label in the table view.
   * @default (kind) => `Which table's ${kind.label.toLowerCase()}?`
   */
  tableTitle?: (kind: FieldLinkKind) => React.ReactNode;
  /** Read after the current choice's name. @default "current" */
  currentLabel?: string;
  /** Classes on the command root. @default undefined */
  className?: string;
  /** Ref forwarded to the command root (`data-slot="field-type-link-step"`). @default undefined */
  ref?: React.Ref<HTMLDivElement>;
}

const defaultTableTitle = (kind: FieldLinkKind) =>
  `Which table's ${kind.label.toLowerCase()}?`;

/** The leading icon of a row. */
function RowIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
    >
      {children}
    </span>
  );
}

/** Name over its one-line explanation. */
function RowText({ label, line }: { label: string; line?: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate">{label}</span>
      {line ? (
        <span className="truncate text-xs text-muted-foreground">{line}</span>
      ) : null}
    </span>
  );
}

/** The current choice's tick, read as text (cmdk owns `aria-selected`). */
function Current({ label }: { label: string }) {
  return (
    <>
      <span className="sr-only">{label}</span>
      <Check aria-hidden className="ms-auto size-4" />
    </>
  );
}

/**
 * `FieldTypeLinkStep` — the "Links to" step of a `FieldTypePicker`: grouped kinds of record, each
 * with one line on what a link to it does; a kind marked `table` (Rows) asks which table. Render
 * it from `renderStep` for the link type.
 *
 * @example
 * <FieldTypePicker
 *   types={[...types, { id: "link", label: "Link to", icon: <Link2 />, next: true }]}
 *   onSelect={(type) => addField({ type })}
 *   renderStep={(type, controls) => (
 *     <FieldTypeLinkStep
 *       controls={controls}
 *       kinds={[
 *         { id: "page", label: "Pages", group: "Library", description: "Each cell links to pages" },
 *         { id: "table_row", label: "Rows", group: "Tables", table: true, description: "Rows of another table" },
 *       ]}
 *       tables={tables}
 *       onSelect={({ kind, table }) => addField({ type: type.id, kind, table })}
 *     />
 *   )}
 * />
 */
export function FieldTypeLinkStep({
  kinds,
  onSelect,
  controls,
  tables = [],
  tablesLoading = false,
  value,
  groupOrder,
  placeholder = "Search kinds of record",
  emptyLabel = "No kind of record matches.",
  tablePlaceholder = "Search tables",
  tableEmptyLabel = "No table matches.",
  tablesLoadingLabel = "Loading tables…",
  tableTitle = defaultTableTitle,
  currentLabel = "current",
  className,
  ref,
}: FieldTypeLinkStepProps) {
  const [tableKind, setTableKind] = React.useState<FieldLinkKind | null>(null);
  const [search, setSearch] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const { setTitle, back } = controls;

  const groups = React.useMemo(() => {
    const seen: string[] = [];
    for (const kind of kinds) {
      const group = kind.group ?? "";
      if (!seen.includes(group)) seen.push(group);
    }
    const order = groupOrder ?? [];
    const rank = (group: string) =>
      group === ""
        ? -1
        : order.includes(group)
          ? order.indexOf(group)
          : order.length + seen.indexOf(group);
    return seen
      .sort((a, b) => rank(a) - rank(b))
      .map((group) => ({
        group,
        kinds: kinds.filter((kind) => (kind.group ?? "") === group),
      }));
  }, [kinds, groupOrder]);

  // The view changed under the search: a fresh search, the header's title, and the caret back in.
  const show = (kind: FieldLinkKind | null) => {
    setTableKind(kind);
    setSearch("");
    setTitle(kind ? tableTitle(kind) : null);
    requestAnimationFrame(() =>
      rootRef.current?.querySelector<HTMLElement>("[cmdk-input]")?.focus(),
    );
  };

  return (
    <Command
      // A view is a new list: its own key resets cmdk's highlight to its first row.
      key={tableKind ? `tables:${tableKind.id}` : "kinds"}
      ref={setRootRef}
      data-slot="field-type-link-step"
      data-view={tableKind ? "tables" : "kinds"}
      className={cn("flex flex-col", className)}
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={tableKind ? tablePlaceholder : placeholder}
        aria-label={tableKind ? tablePlaceholder : placeholder}
        onKeyDown={(event) => {
          if (event.key !== "Backspace" || search !== "") return;
          event.preventDefault();
          if (tableKind) show(null);
          else back();
        }}
      />
      <CommandList>
        {tableKind ? (
          <>
            <CommandEmpty>
              {tablesLoading ? tablesLoadingLabel : tableEmptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {tables.map((table) => {
                const current =
                  value?.kind === tableKind.id && value.table === table.id;
                return (
                  <CommandItem
                    key={table.id}
                    value={table.id}
                    keywords={[
                      table.label,
                      ...(table.description ? [table.description] : []),
                    ]}
                    data-checked={current ? "" : undefined}
                    data-slot="field-type-link-step-table"
                    onSelect={() =>
                      onSelect({ kind: tableKind.id, table: table.id })
                    }
                  >
                    {table.icon != null ? (
                      <RowIcon>{table.icon}</RowIcon>
                    ) : null}
                    <RowText label={table.label} line={table.description} />
                    {current ? <Current label={currentLabel} /> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        ) : (
          <>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            {groups.map(({ group, kinds: inGroup }) => (
              <CommandGroup key={group || "_"} heading={group || undefined}>
                {inGroup.map((kind) => {
                  const current = value?.kind === kind.id;
                  return (
                    <CommandItem
                      key={kind.id}
                      value={kind.id}
                      keywords={[
                        kind.label,
                        ...(kind.description ? [kind.description] : []),
                        ...(kind.keywords ?? []),
                      ]}
                      disabled={kind.disabledReason !== undefined}
                      data-checked={current ? "" : undefined}
                      data-slot="field-type-link-step-kind"
                      onSelect={() => {
                        if (kind.disabledReason) return;
                        if (kind.table) show(kind);
                        else onSelect({ kind: kind.id });
                      }}
                    >
                      {kind.icon != null ? (
                        <RowIcon>{kind.icon}</RowIcon>
                      ) : null}
                      <RowText
                        label={kind.label}
                        line={kind.disabledReason ?? kind.description}
                      />
                      {current ? (
                        <Current label={currentLabel} />
                      ) : kind.table ? (
                        <ChevronRight
                          aria-hidden
                          className="ms-auto size-4 text-muted-foreground rtl:-scale-x-100"
                        />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </>
        )}
      </CommandList>
    </Command>
  );
}
