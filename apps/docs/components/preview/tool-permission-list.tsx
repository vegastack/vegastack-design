"use client";

import { useState, type ReactNode } from "react";
import { GitBranch } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/tool-permission-list` (dogfoods the registry) → auto-scanned.
import {
  ToolPermissionList,
  ToolPermissionListSkeleton,
  type ToolAnswer,
  type ToolPermissionRow,
} from "@/components/ui/tool-permission-list";

const ALL: ToolAnswer[] = ["allow", "ask", "block"];

function tool(
  id: string,
  label: string,
  rowClass: ToolPermissionRow["class"],
  overrides: Partial<ToolPermissionRow> = {},
): ToolPermissionRow {
  return {
    id: `tool:${id}`,
    label,
    kind: "tool",
    class: rowClass,
    answer: rowClass === "delete_send" ? "ask" : "allow",
    inherited: true,
    inheritedFrom: "workspace",
    answersAllowed: ALL,
    ...overrides,
  };
}

const ROWS: ToolPermissionRow[] = [
  {
    id: "all",
    label: "All tools",
    kind: "all",
    answer: "ask",
    inherited: true,
    inheritedFrom: "Standard level",
    answersAllowed: ALL,
  },
  {
    id: "class:read",
    label: "Read · 3",
    hint: "Reads only",
    kind: "class",
    class: "read",
    answer: "allow",
    inherited: true,
    inheritedFrom: "Standard level",
    answersAllowed: ALL,
    children: [
      tool("list_issues", "GitHub › List issues", "read"),
      tool("read_file", "GitHub › Read a file", "read"),
      tool("search_code", "GitHub › Search code", "read"),
    ],
  },
  {
    id: "class:write",
    label: "Write · 3",
    hint: "Changes inside the workspace",
    kind: "class",
    class: "write",
    answer: "ask",
    inherited: false,
    defaultFrom: "All tools",
    rules: [
      {
        key: "w1",
        answer: "ask",
        condition: null,
        editable: true,
      },
    ],
    answersAllowed: ALL,
    children: [
      tool("create_issue", "GitHub › Create issue", "write", {
        inherited: false,
        answer: "allow",
        defaultFrom: "workspace",
        rules: [
          {
            key: "r1",
            answer: "allow",
            condition: "Only when: in vegastack/web",
            editable: true,
          },
          {
            key: "r2",
            answer: "ask",
            condition: "Only when: labelled “security”",
            note: "Security asks first",
            pending: true,
            editable: true,
          },
        ],
      }),
      tool("comment", "GitHub › Comment", "write", {
        answer: "ask",
        warningOnAllow:
          "This lets Donna comment on issues without asking. It's logged.",
      }),
      tool("merge_pr", "GitHub › Merge pull request", "write", {
        answer: "block",
        locked: { by: "your admin" },
        inheritedFrom: "your admin's lock",
      }),
    ],
  },
  {
    id: "class:delete_send",
    label: "Delete or send · 1",
    hint: "Deletes, shares, publishes or sends outside",
    kind: "class",
    class: "delete_send",
    answer: "ask",
    inherited: true,
    inheritedFrom: "workspace",
    answersAllowed: ["ask", "block"],
    children: [
      tool("delete_branch", "GitHub › Delete a branch", "delete_send", {
        answersAllowed: ["ask", "block"],
      }),
    ],
  },
];

function apply(
  rows: ToolPermissionRow[],
  id: string,
  change: { answer?: ToolAnswer; locked?: boolean },
): ToolPermissionRow[] {
  return rows.map((row) => {
    const next =
      row.id === id
        ? {
            ...row,
            ...(change.answer
              ? { answer: change.answer, inherited: false }
              : {}),
            ...(change.locked !== undefined
              ? { locked: change.locked ? { by: "you" } : undefined }
              : {}),
          }
        : row;
    return next.children
      ? { ...next, children: apply(next.children, id, change) }
      : next;
  });
}

/** "Use the default": the row's own rules go and it follows its default again. */
function followDefault(
  rows: ToolPermissionRow[],
  id: string,
): ToolPermissionRow[] {
  return rows.map((row) => {
    const next =
      row.id === id
        ? {
            ...row,
            rules: undefined,
            inherited: true,
            inheritedFrom: row.defaultFrom ?? row.inheritedFrom,
          }
        : row;
    return next.children
      ? { ...next, children: followDefault(next.children, id) }
      : next;
  });
}

function Column({
  children,
  width = "max-w-2xl",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`flex w-full flex-col gap-6 ${width}`}>{children}</div>
    </Wrapper>
  );
}

function Live({
  admin = false,
  width,
}: {
  admin?: boolean;
  width?: string;
}): ReactNode {
  const [scope, setScope] = useState("agent");
  const [rows, setRows] = useState(() =>
    admin
      ? ROWS.map((row) => ({
          ...row,
          lockable: true,
          children: row.children?.map((child) => ({
            ...child,
            lockable: !child.locked,
          })),
        }))
      : ROWS,
  );
  return (
    <Column width={width}>
      <ToolPermissionList
        title="GitHub"
        icon={<GitBranch aria-hidden className="size-4" />}
        meta="Connected · company GitHub App"
        note="New tools from GitHub follow All tools."
        scope={{
          value: scope,
          options: [
            { value: "every", label: "Every agent" },
            { value: "agent", label: "This agent" },
          ],
          onChange: setScope,
        }}
        rows={rows}
        onChange={(id, change) => setRows((list) => apply(list, id, change))}
        onAddRule={() => undefined}
        onEditRule={() => undefined}
        onRemoveRule={() => undefined}
        onUseInherited={(id) => setRows((list) => followDefault(list, id))}
      />
    </Column>
  );
}

export function toolPermissionList(): ReactNode {
  return <Live />;
}

export function toolPermissionListAdmin(): ReactNode {
  return <Live admin />;
}

export function toolPermissionListReadOnly(): ReactNode {
  return (
    <Column>
      <ToolPermissionList
        title="GitHub"
        meta="Your admin manages these"
        rows={ROWS}
        onChange={() => undefined}
        readOnly
      />
    </Column>
  );
}

export function toolPermissionListMany(): ReactNode {
  const many: ToolPermissionRow[] = [
    {
      id: "class:read",
      label: "Read · 88",
      kind: "class",
      class: "read",
      answer: "allow",
      inherited: true,
      inheritedFrom: "Standard level",
      answersAllowed: ALL,
      children: Array.from({ length: 88 }, (_, index) =>
        tool(`file_${index}`, `Drive › Read file type ${index + 1}`, "read"),
      ),
    },
  ];
  return (
    <Column>
      <ToolPermissionList
        title="Drive"
        rows={many}
        onChange={() => undefined}
      />
    </Column>
  );
}

export function toolPermissionListStates(): ReactNode {
  return (
    <Column>
      <ToolPermissionListSkeleton rows={3} />
      <ToolPermissionList title="Slack" rows={[]} onChange={() => undefined} />
    </Column>
  );
}

export function toolPermissionListNarrow(): ReactNode {
  return <Live width="max-w-[390px]" />;
}
