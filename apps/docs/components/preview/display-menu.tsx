"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  DisplayMenu,
  type DisplayMenuColumn,
} from "@/components/ui/display-menu";
import { GroupByPicker } from "@/components/ui/filter-bar-managed";

export function displayMenu(): ReactNode {
  const [height, setHeight] = React.useState("comfortable");
  const [subtasks, setSubtasks] = React.useState(true);
  const [closed, setClosed] = React.useState(false);
  const [archived, setArchived] = React.useState(false);
  const [columns, setColumns] = React.useState<DisplayMenuColumn[]>([
    { id: "name", label: "Name", visible: true, locked: true },
    { id: "assignee", label: "Assignee", visible: true },
    { id: "due", label: "Due", visible: true },
    { id: "priority", label: "Priority", visible: true },
    { id: "created", label: "Created", visible: false },
  ]);
  return (
    <Wrapper>
      <DisplayMenu
        rowHeight={{
          value: height,
          options: [
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfortable" },
          ],
          onValueChange: setHeight,
        }}
        columns={{
          items: columns,
          onToggle: (id, visible) =>
            setColumns((all) =>
              all.map((c) => (c.id === id ? { ...c, visible } : c)),
            ),
          onReorder: (from, to) =>
            setColumns((all) => {
              const next = [...all];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved!);
              return next;
            }),
          onShowAll: () =>
            setColumns((all) => all.map((c) => ({ ...c, visible: true }))),
        }}
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
        isDefault={height === "comfortable" && subtasks && !closed && !archived}
        onReset={() => {
          setHeight("comfortable");
          setSubtasks(true);
          setClosed(false);
          setArchived(false);
        }}
      />
    </Wrapper>
  );
}

export function displayMenuTable(): ReactNode {
  const [groups, setGroups] = React.useState<string[]>(["status"]);
  const [height, setHeight] = React.useState("medium");
  return (
    <Wrapper>
      <DisplayMenu
        groupBy={
          <GroupByPicker
            vocabulary={[
              { key: "status", label: "Status" },
              { key: "owner", label: "Owner" },
            ]}
            value={groups}
            onChange={setGroups}
          />
        }
        rowHeight={{
          value: height,
          options: [
            { value: "short", label: "Short" },
            { value: "medium", label: "Medium" },
            { value: "tall", label: "Tall" },
          ],
          onValueChange: setHeight,
        }}
        toggles={[
          {
            id: "empty",
            label: "Show empty groups",
            checked: false,
            onCheckedChange: () => {},
          },
        ]}
        isDefault={groups.length === 1 && height === "medium"}
        onReset={() => {
          setGroups(["status"]);
          setHeight("medium");
        }}
        resetLabel="Reset to saved view"
      />
    </Wrapper>
  );
}
