"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-table-parts` (dogfoods the registry).
import {
  EmptyRow,
  SelectAllHead,
  SelectionCell,
  SkeletonRows,
  SortableHead,
  columnCellClass,
  cycleSort,
  useRowSelection,
  type DataTableHeaderColumn,
  type SortDirection,
} from "@/components/ui/data-table-parts";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Release {
  id: string;
  name: string;
  channel: string;
  size: string;
}

const RELEASES: Release[] = [
  { id: "r-1041", name: "Design tokens", channel: "stable", size: "48 kB" },
  { id: "r-1042", name: "Registry manifest", channel: "beta", size: "12 kB" },
  { id: "r-1043", name: "Docs bundle", channel: "stable", size: "1.2 MB" },
];

const COLUMNS: DataTableHeaderColumn[] = [
  { key: "id", header: "Ref", mono: true },
  { key: "name", header: "Release", sortable: true },
  { key: "channel", header: "Channel" },
  { key: "size", header: "Size", align: "end", mono: true },
];

export function dataTableParts(): ReactNode {
  function Composed() {
    const [sort, setSort] = useState<
      { key: string; direction: SortDirection }[]
    >([{ key: "name", direction: "asc" }]);
    const rowIds = RELEASES.map((release) => release.id);
    const { selected, allSelected, indeterminate, toggleAll, toggleRow } =
      useRowSelection({ rowIds });

    const rows = [...RELEASES].sort((a, b) => {
      const entry = sort[0];
      if (!entry) return 0;
      const compare = String(a[entry.key as keyof Release]).localeCompare(
        String(b[entry.key as keyof Release]),
      );
      return entry.direction === "asc" ? compare : -compare;
    });

    return (
      <Table scrollLabel="Releases">
        <TableHeader>
          <TableRow>
            <SelectAllHead
              checked={allSelected}
              indeterminate={indeterminate}
              onToggle={toggleAll}
            />
            {COLUMNS.map((column) => (
              <SortableHead
                key={column.key}
                column={column}
                direction={
                  sort[0]?.key === column.key ? sort[0].direction : null
                }
                onSort={(event) =>
                  setSort(
                    cycleSort(sort, column.key, { additive: event.shiftKey }),
                  )
                }
              />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((release) => (
            <TableRow
              key={release.id}
              data-selected={selected.has(release.id) ? "" : undefined}
            >
              <SelectionCell
                checked={selected.has(release.id)}
                onToggle={() => toggleRow(release.id)}
                label={`Select ${release.name}`}
              />
              {COLUMNS.map((column) => (
                <TableCell key={column.key} className={columnCellClass(column)}>
                  {release[column.key as keyof Release]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Wrapper className="justify-stretch">
      <div className="w-full">
        <Composed />
      </div>
    </Wrapper>
  );
}

export function dataTablePartsAsyncStates(): ReactNode {
  return (
    <Wrapper className="w-full flex-col items-stretch gap-6">
      <Table scrollLabel="Releases, loading">
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <SortableHead key={column.key} column={column} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <SkeletonRows columns={COLUMNS} rows={3} />
        </TableBody>
      </Table>
      <Table scrollLabel="Releases, empty">
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <SortableHead key={column.key} column={column} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <EmptyRow colSpan={COLUMNS.length} />
        </TableBody>
      </Table>
    </Wrapper>
  );
}
