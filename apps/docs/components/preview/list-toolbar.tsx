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
  type FilterRowChip,
} from "@/components/ui/filter-row";
import {
  ListToolbar,
  ListToolbarAction,
  ListToolbarMenu,
  type ListToolbarLayoutValue,
} from "@/components/ui/list-toolbar";
import {
  SortBuilder,
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

/** The whole pattern, fully wired: scope tabs, search, every tool, the filter row and the CTA. */
function TasksToolbar({ width }: { width?: number }) {
  const [scope, setScope] = React.useState("mine");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<Opt[]>([
    { id: "doing", name: "In progress" },
  ]);
  const [chips, setChips] = React.useState<FilterRowChip[]>([]);
  const [aiNote, setAiNote] = React.useState<{
    ids: string[];
    unmatched: string[];
  } | null>(null);
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
            <TabsList size="sm" overflow="menu" aria-label="Whose tasks">
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
                            className="h-8 justify-start px-2 font-normal"
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
                    setAiNote({ ids: [id], unmatched });
                    return { added: 1, unmatched };
                  },
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
            aiNote={
              aiNote
                ? {
                    count: aiNote.ids.length,
                    unmatched: aiNote.unmatched,
                    onUndo: () => {
                      setChips((all) =>
                        all.filter((chip) => !aiNote.ids.includes(chip.id)),
                      );
                      setAiNote(null);
                    },
                    onDismiss: () => setAiNote(null),
                  }
                : undefined
            }
            onClear={() => {
              setStatus([]);
              setChips([]);
              setAiNote(null);
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
        action={
          <ListToolbarAction
            icon={<Plus />}
            label="New task"
            onClick={() => {}}
          />
        }
      />
    </div>
  );
}

export function listToolbar(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <TasksToolbar />
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
            <Button variant="outline" size="sm" onClick={() => setDirty(false)}>
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
          collapsible: true,
        }}
        filter={{}}
        filterRow={
          <FilterRow
            addFilter={
              <AddFilterMenu
                fields={[{ key: "owner", label: "Owner" }]}
                onAdvanced={() => {}}
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
              { id: "save-as", label: "Save as new view…", onSelect: () => {} },
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
        action={
          <ListToolbarAction
            icon={<Plus />}
            label="New row"
            onClick={() => {}}
          />
        }
      />
    </Wrapper>
  );
}

export function listToolbarSettings(): ReactNode {
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState<Opt[]>([]);
  return (
    <Wrapper className="block p-4">
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
        action={
          <ListToolbarAction
            icon={<Plus />}
            label="Invite member"
            onClick={() => {}}
          />
        }
      />
    </Wrapper>
  );
}

export function listToolbarCompact(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <ListToolbar
        size="compact"
        action={
          <ListToolbarAction
            icon={<Plus />}
            label="New task"
            variant="ghost"
            onClick={() => {}}
          />
        }
      />
    </Wrapper>
  );
}
