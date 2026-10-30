"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  CircleDot,
  Download,
  Flag,
  Link2,
  Plus,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  UserRound,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { AddFilterMenu } from "@/components/ui/add-filter-menu";
import { DisplayMenu } from "@/components/ui/display-menu";
import {
  FilterRow,
  ListFacet,
  useAiFilterApplied,
  type FilterRowChip,
} from "@/components/ui/filter-row";
import {
  ListToolbar,
  ListToolbarMenu,
  type ListToolbarLayoutValue,
} from "@/components/ui/list-toolbar";
import {
  FilterBuilder,
  SortBuilder,
  type FilterField,
  type FilterNode,
  type SortBuilderEntry,
} from "@/components/ui/filter-bar-managed";
import {
  SortMenu,
  sortSummary,
  type SortMenuValue,
} from "@/components/ui/sort-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewTabs } from "@/components/ui/view-tabs";

type Opt = { id: string; name: string };
const optProps = {
  itemToKey: (o: Opt) => o.id,
  itemToStringLabel: (o: Opt) => o.name,
  isItemEqualToValue: (a: Opt, b: Opt) => a.id === b.id,
};

const SORT_FIELDS = [
  { key: "due", label: "Due date", type: "date" as const },
  { key: "priority", label: "Priority", type: "enum" as const },
  { key: "created", label: "Created", type: "date" as const },
  { key: "title", label: "Title", type: "text" as const },
];
const DEFAULT_SORT: SortMenuValue = { key: "due", direction: "asc" };
const STATUSES: Opt[] = [
  { id: "todo", name: "To do" },
  { id: "doing", name: "In progress" },
  { id: "done", name: "Done" },
];
const PRIORITIES = ["High", "Medium", "Low"];

/**
 * The page around a toolbar: the app's top bar (breadcrumb, then the page's main button at its
 * right end — never in the toolbar), the title, then the toolbar.
 */
function PageFrame({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex h-10 items-center justify-between gap-2 border-b border-border pb-2">
        <span className="truncate text-sm text-muted-foreground">{title}</span>
        {action ? (
          <Button size="sm">
            <Plus aria-hidden />
            {action}
          </Button>
        ) : null}
      </div>
      <h2 className="m-0 text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

type AdvancedGroup = Extract<FilterNode<string>, { type: "group" }>;
const ADVANCED_FIELDS: FilterField<string>[] = [
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

/** "Advanced filter": the condition builder, drilled into inside + Filter's popover. */
function AdvancedFilter() {
  const [tree, setTree] = React.useState<AdvancedGroup>({
    type: "group",
    op: "and",
    children: [
      { type: "condition", field: "stage", operator: "is", value: "Qualified" },
    ],
  });
  return (
    <FilterBuilder<string>
      vocabulary={ADVANCED_FIELDS}
      value={tree}
      onValueChange={setTree}
    />
  );
}

/** The whole pattern, fully wired: scope tabs, search, every tool and the filter row. */
function TasksToolbar({ width }: { width?: number }) {
  const [scope, setScope] = React.useState("mine");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<Opt[]>([
    { id: "doing", name: "In progress" },
  ]);
  const [chips, setChips] = React.useState<FilterRowChip[]>([]);
  const onAiApplied = useAiFilterApplied();
  const lastAiChip = React.useRef<string | null>(null);
  const [sort, setSort] = React.useState<SortMenuValue>(DEFAULT_SORT);
  const [layout, setLayout] = React.useState<ListToolbarLayoutValue>("list");
  const [height, setHeight] = React.useState("comfortable");
  const [subtasks, setSubtasks] = React.useState(true);
  const [closed, setClosed] = React.useState(false);
  const [archived, setArchived] = React.useState(false);
  const removeChip = (id: string) =>
    setChips((all) => all.filter((chip) => chip.id !== id));
  const addPriority = (value: string, source: "ai" | "user" = "user") => {
    const id = `priority-${value}`;
    setChips((all) =>
      all.some((chip) => chip.id === id)
        ? all
        : [
            ...all,
            {
              id,
              label: "Priority",
              value,
              source,
              onRemove: () => removeChip(id),
            },
          ],
    );
    return id;
  };
  const displayDefault =
    height === "comfortable" && subtasks && !closed && !archived;
  return (
    <div
      style={width ? { width, maxWidth: "100%" } : undefined}
      className="w-full"
    >
      <ListToolbar
        tabs={
          <Tabs value={scope} onValueChange={(next) => setScope(String(next))}>
            <TabsList overflow="menu" aria-label="Whose tasks">
              <TabsTrigger value="mine">My tasks</TabsTrigger>
              <TabsTrigger value="created">Created by me</TabsTrigger>
              <TabsTrigger value="team">My team</TabsTrigger>
              <TabsTrigger value="shared">Shared with me</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks",
          suggestion: {
            label: "Filter with AI",
            icon: <Sparkles />,
            opensFilter: true,
            onSelect: async () => {
              await new Promise((resolve) => setTimeout(resolve, 600));
              const id = addPriority("High", "ai");
              onAiApplied({ count: 1, onUndo: () => removeChip(id) });
            },
          },
        }}
        filter={{ defaultOpen: true }}
        filterRow={
          <FilterRow
            addFilter={
              <AddFilterMenu
                fields={[
                  {
                    key: "priority",
                    label: "Priority",
                    icon: <Flag />,
                    editor: (done) => (
                      <div className="flex flex-col">
                        {PRIORITIES.map((value) => (
                          <Button
                            key={value}
                            variant="ghost"
                            className="h-7 justify-start rounded-md px-1.5 font-normal"
                            onClick={() => {
                              addPriority(value);
                              done();
                            }}
                          >
                            {value}
                          </Button>
                        ))}
                      </div>
                    ),
                  },
                  {
                    key: "assignee",
                    label: "Assignee",
                    icon: <UserRound />,
                    keywords: ["owner"],
                  },
                  { key: "status", label: "Status", icon: <CircleDot /> },
                ]}
                ai={{
                  onSubmit: async (text) => {
                    await new Promise((resolve) => setTimeout(resolve, 600));
                    const id = addPriority("High", "ai");
                    const unmatched = text.toLowerCase().includes("warehouse")
                      ? ["warehouse"]
                      : [];
                    lastAiChip.current = id;
                    return { added: 1, unmatched };
                  },
                  onApplied: (result) =>
                    onAiApplied({
                      count: result.added,
                      unmatched: result.unmatched,
                      onUndo: () => {
                        if (lastAiChip.current) removeChip(lastAiChip.current);
                      },
                    }),
                }}
              />
            }
            facets={
              <ListFacet<Opt, true>
                label="Status"
                multiple
                items={STATUSES}
                value={status}
                onValueChange={setStatus}
                {...optProps}
              />
            }
            chips={chips}
            onClear={() => {
              setStatus([]);
              setChips([]);
            }}
          />
        }
        sort={
          layout === "board"
            ? undefined
            : {
                content: (
                  <SortMenu
                    fields={SORT_FIELDS}
                    value={sort}
                    defaultValue={DEFAULT_SORT}
                    onValueChange={setSort}
                  />
                ),
                isDefault:
                  sort.key === DEFAULT_SORT.key &&
                  sort.direction === DEFAULT_SORT.direction,
                summary: sortSummary(SORT_FIELDS, sort),
              }
        }
        layout={{
          value: layout,
          options: ["list", "board"],
          onValueChange: setLayout,
        }}
        display={
          <DisplayMenu
            rowHeight={
              layout === "list"
                ? {
                    value: height,
                    options: [
                      { value: "compact", label: "Compact" },
                      { value: "comfortable", label: "Comfortable" },
                    ],
                    onValueChange: setHeight,
                  }
                : undefined
            }
            toggles={[
              {
                id: "subtasks",
                label: "Show subtasks",
                checked: subtasks,
                onCheckedChange: setSubtasks,
              },
              {
                id: "closed",
                label: "Show closed",
                checked: closed,
                onCheckedChange: setClosed,
              },
              {
                id: "archived",
                label: "Show archived",
                checked: archived,
                onCheckedChange: setArchived,
              },
            ]}
            isDefault={displayDefault}
            onReset={() => {
              setHeight("comfortable");
              setSubtasks(true);
              setClosed(false);
              setArchived(false);
            }}
          />
        }
        more={
          <ListToolbarMenu
            items={[
              {
                id: "reset",
                label: "Reset to default",
                icon: <RotateCcw />,
                onSelect: () => setSort(DEFAULT_SORT),
              },
              {
                id: "copy",
                label: "Copy link to this view",
                icon: <Link2 />,
                onSelect: () => {},
              },
            ]}
          />
        }
      />
    </div>
  );
}

export function listToolbar(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <PageFrame title="Tasks" action="New task">
        <TasksToolbar />
      </PageFrame>
    </Wrapper>
  );
}

/** The content widths a page gives its list at 1440, 1280, 1024, 768 and 390. */
const WIDTHS = [
  { viewport: "Desktop 1440", content: 1120 },
  { viewport: "Laptop 1280", content: 960 },
  { viewport: "iPad landscape 1024", content: 700 },
  { viewport: "iPad portrait 768", content: 640 },
  { viewport: "Phone 390", content: 358 },
];

export function listToolbarWidths(): ReactNode {
  return (
    <Wrapper className="block space-y-6 overflow-x-auto p-4">
      {WIDTHS.map(({ viewport, content }) => (
        <figure key={viewport} className="m-0 flex flex-col gap-2">
          <figcaption className="text-xs text-muted-foreground">
            {viewport} · {content}px of content
          </figcaption>
          <div
            className="rounded-md border border-dashed border-border p-2"
            style={{ width: content + 18 }}
          >
            <TasksToolbar width={content} />
          </div>
        </figure>
      ))}
    </Wrapper>
  );
}

export function listToolbarTable(): ReactNode {
  const [view, setView] = React.useState("all");
  const [sorts, setSorts] = React.useState<SortBuilderEntry[]>([
    { key: "status", dir: "asc" },
  ]);
  const [dirty, setDirty] = React.useState(true);
  return (
    <Wrapper className="block p-4">
      <PageFrame title="Requests" action="New row">
        <ListToolbar
          tabs={
            <ViewTabs
              views={[
                {
                  id: "all",
                  name: "All requests",
                  kind: "grid",
                  scope: "shared",
                  dirty,
                },
                {
                  id: "status",
                  name: "By status",
                  kind: "board",
                  scope: "locked",
                },
                {
                  id: "mine",
                  name: "My requests",
                  kind: "grid",
                  scope: "personal",
                },
              ]}
              value={view}
              onValueChange={setView}
              onCreate={() => {}}
            />
          }
          state={
            dirty ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDirty(false)}
              >
                Save view
              </Button>
            ) : null
          }
          edit={[
            {
              id: "undo",
              label: "Undo",
              icon: <Undo2 />,
              shortcut: "⌘Z",
              onSelect: () => {},
            },
            {
              id: "redo",
              label: "Redo",
              icon: <Redo2 />,
              shortcut: "⇧⌘Z",
              onSelect: () => {},
              disabled: true,
            },
          ]}
          search={{
            value: "",
            onValueChange: () => {},
            placeholder: "Search rows",
          }}
          filter={{}}
          filterRow={
            <FilterRow
              addFilter={
                <AddFilterMenu
                  fields={[{ key: "owner", label: "Owner" }]}
                  advanced={<AdvancedFilter />}
                />
              }
            />
          }
          sort={{
            variant: "multi",
            count: sorts.length,
            content: (
              <SortBuilder
                vocabulary={[
                  { key: "status", label: "Status" },
                  { key: "due", label: "Due" },
                  { key: "qty", label: "Qty" },
                ]}
                value={sorts}
                onChange={setSorts}
              />
            ),
          }}
          display={
            <DisplayMenu
              columns={{
                title: "Fields",
                items: [
                  { id: "name", label: "Name", visible: true, locked: true },
                  { id: "customer", label: "Customer", visible: true },
                  { id: "qty", label: "Qty", visible: false },
                ],
                onToggle: () => {},
              }}
              toggles={[
                {
                  id: "empty",
                  label: "Show empty groups",
                  checked: false,
                  onCheckedChange: () => {},
                },
              ]}
              resetLabel="Reset to saved view"
            />
          }
          more={
            <ListToolbarMenu
              items={[
                {
                  id: "save",
                  label: "Save view",
                  onSelect: () => setDirty(false),
                },
                {
                  id: "save-as",
                  label: "Save as new view…",
                  onSelect: () => {},
                },
                "separator",
                {
                  id: "export",
                  label: "Export CSV",
                  icon: <Download />,
                  onSelect: () => {},
                },
              ]}
            />
          }
        />
      </PageFrame>
    </Wrapper>
  );
}

export function listToolbarSettings(): ReactNode {
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState<Opt[]>([]);
  return (
    <Wrapper className="block p-4">
      <PageFrame title="Members" action="Invite member">
        <ListToolbar
          search={{
            value: query,
            onValueChange: setQuery,
            placeholder: "Search name or email",
          }}
          filterRow={
            <FilterRow
              facets={
                <ListFacet<Opt, true>
                  label="Role"
                  multiple
                  items={[
                    { id: "owner", name: "Owner" },
                    { id: "member", name: "Member" },
                  ]}
                  value={role}
                  onValueChange={setRole}
                  {...optProps}
                />
              }
              onClear={() => setRole([])}
            />
          }
        />
      </PageFrame>
    </Wrapper>
  );
}

export function listToolbarCompact(): ReactNode {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<Opt[]>([]);
  return (
    <Wrapper className="block p-4">
      <ListToolbar
        size="compact"
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks",
        }}
        filterRow={
          <FilterRow
            facets={
              <ListFacet<Opt, true>
                label="Status"
                multiple
                items={STATUSES}
                value={status}
                onValueChange={setStatus}
                {...optProps}
              />
            }
            onClear={() => setStatus([])}
          />
        }
        more={
          <ListToolbarMenu
            items={[
              {
                id: "export",
                label: "Export CSV",
                icon: <Download />,
                onSelect: () => {},
              },
            ]}
          />
        }
      />
    </Wrapper>
  );
}
