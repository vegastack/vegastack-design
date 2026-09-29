"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { FileText, Folder } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/breadcrumb-cascade` (dogfoods the registry) → auto-scanned.
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  BreadcrumbDropTarget,
  BreadcrumbSiblings,
  type BreadcrumbSibling,
} from "@/components/ui/breadcrumb-cascade";
import { DataList, type DataListColumn } from "@/components/ui/data-list";

const PROJECTS: BreadcrumbSibling[] = [
  { id: "clients", label: "Clients", href: "#clients", icon: <Folder /> },
  {
    id: "projects",
    label: "Projects",
    href: "#projects",
    icon: <Folder />,
    current: true,
  },
  { id: "templates", label: "Templates", href: "#templates", icon: <Folder /> },
  {
    id: "handbook",
    label: "Handbook.md",
    href: "#handbook",
    icon: <FileText />,
  },
];

/** A trail whose middle segment lists its siblings: jump sideways without going up first. */
export function breadcrumbCascade(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#library">Library</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
            <BreadcrumbSiblings label="Projects" items={PROJECTS} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Q3 launch</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/**
 * Siblings loaded on first open: the menu shows "Loading…" until they arrive, and says so when
 * there is nothing else at that level.
 */
export function breadcrumbCascadeLoading(): ReactNode {
  const [items, setItems] = React.useState<BreadcrumbSibling[] | null>(null);
  const load = (open: boolean) => {
    if (!open || items) return;
    window.setTimeout(() => setItems(PROJECTS), 1200);
  };
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
            <BreadcrumbSiblings
              label="Projects"
              items={items ?? []}
              loading={items === null}
              onOpenChange={load}
            />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#archive">Archive</BreadcrumbLink>
            <BreadcrumbSiblings label="Archive" items={[]} />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

interface FileRow {
  id: string;
  name: string;
}
const FILES: FileRow[] = [
  { id: "brief", name: "Brief.pdf" },
  { id: "notes", name: "Kickoff notes.md" },
  { id: "budget", name: "Budget.xlsx" },
];
const fileColumns: DataListColumn<FileRow>[] = [
  { key: "name", header: "Name" },
];

/**
 * Crumbs as drop targets: drag a file from the list onto Library or Projects to move it up. The
 * crumb washes while a drag is over it, and the refusing one ("Q3 launch" is where the files
 * already are) washes in the destructive tint.
 */
export function breadcrumbCascadeDropTarget(): ReactNode {
  const [rows, setRows] = React.useState(FILES);
  const [log, setLog] = React.useState("Drag a file onto a crumb.");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const move = ({ ids, targetId }: { ids: string[]; targetId: string }) => {
    setRows((current) => current.filter((r) => !ids.includes(r.id)));
    setSelected(new Set());
    setLog(
      `Moved ${ids.length === 1 ? "1 file" : `${ids.length} files`} to ${targetId}`,
    );
  };
  return (
    <Wrapper className="flex flex-col gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbDropTarget
              href="#library"
              targetId="Library"
              dragScope="docs-crumbs"
              onDropInto={move}
            >
              Library
            </BreadcrumbDropTarget>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbDropTarget
              href="#projects"
              targetId="Projects"
              dragScope="docs-crumbs"
              onDropInto={move}
            >
              Projects
            </BreadcrumbDropTarget>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbDropTarget
              href="#q3"
              aria-current="page"
              targetId="Q3 launch"
              dragScope="docs-crumbs"
              onDropInto={move}
              canDropInto={() => false}
            >
              Q3 launch
            </BreadcrumbDropTarget>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DataList<FileRow>
        aria-label="Files in Q3 launch"
        columns={fileColumns}
        data={rows}
        getRowId={(r) => r.id}
        getRowLabel={(r) => r.name}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        dragScope="docs-crumbs"
        onDropInto={() => {}}
      />
      <p className="text-xs text-muted-foreground" role="status">
        {log}
      </p>
    </Wrapper>
  );
}
