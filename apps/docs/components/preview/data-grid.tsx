"use client";

import { type ReactNode, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleDot,
  Hash,
  ListFilter,
  Plus,
  Table2,
  Type,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-grid` (dogfoods the registry) → auto-scanned.
import {
  DataGrid,
  type DataGridActions,
  type DataGridColumn,
  type DataGridSort,
} from "@/components/ui/data-grid";
import { ActionBarButton } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  BlockHeader,
  BlockHeaderButton,
  BlockHeaderOpen,
} from "@/components/ui/block-header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Deal {
  id: string;
  name: string;
  stage: string;
  owner: string;
  amount: number;
}

const DEALS: Deal[] = [
  {
    id: "d1",
    name: "Acme renewal",
    stage: "Qualified",
    owner: "Priya",
    amount: 12400,
  },
  {
    id: "d2",
    name: "Globex expansion",
    stage: "Proposal",
    owner: "Mel",
    amount: 48000,
  },
  {
    id: "d3",
    name: "Initech pilot",
    stage: "Qualified",
    owner: "Ada",
    amount: 9800,
  },
  {
    id: "d4",
    name: "Umbrella upsell",
    stage: "Won",
    owner: "Priya",
    amount: 22000,
  },
  {
    id: "d5",
    name: "Northwind seats",
    stage: "Proposal",
    owner: "Ada",
    amount: 15600,
  },
];

const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export function dataGrid(): ReactNode {
  const [sort, setSort] = useState<DataGridSort[]>([
    { key: "amount", direction: "desc" },
  ]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const columns: DataGridColumn<Deal>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      mobile: "visible",
      minWidth: 160,
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      minWidth: 110,
      render: (deal) => <Badge variant="secondary">{deal.stage}</Badge>,
    },
    {
      key: "owner",
      header: "Owner",
      sortable: true,
      minWidth: 100,
      mobile: "merge",
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "end",
      minWidth: 110,
      render: (deal) => <span className="font-mono">{money(deal.amount)}</span>,
    },
  ];
  return (
    <Wrapper className="block">
      <DataGrid<Deal>
        aria-label="Deals"
        columns={columns}
        data={DEALS}
        getRowId={(deal) => deal.id}
        sort={sort}
        onSortChange={setSort}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
      />
    </Wrapper>
  );
}

export function dataGridGrouped(): ReactNode {
  const columns: DataGridColumn<Deal>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      minWidth: 160,
      mobile: "visible",
    },
    { key: "stage", header: "Stage", minWidth: 110, group: true },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "end",
      minWidth: 110,
      render: (deal) => <span className="font-mono">{money(deal.amount)}</span>,
    },
  ];
  return (
    <Wrapper className="block">
      <DataGrid<Deal>
        aria-label="Deals by stage"
        columns={columns}
        data={DEALS}
        getRowId={(deal) => deal.id}
      />
    </Wrapper>
  );
}

export function dataGridEditable(): ReactNode {
  const [deals, setDeals] = useState(DEALS);
  const columns: DataGridColumn<Deal>[] = [
    {
      key: "name",
      header: "Name",
      minWidth: 160,
      mobile: "visible",
      editable: { type: "text" },
    },
    {
      key: "stage",
      header: "Stage",
      minWidth: 130,
      editable: {
        type: "select",
        options: ["Qualified", "Proposal", "Won"].map((value) => ({
          value,
          label: value,
        })),
      },
    },
  ];
  return (
    <Wrapper className="block">
      <div className="flex w-full flex-col gap-1.5">
        <DataGrid<Deal>
          aria-label="Editable deals"
          columns={columns}
          data={deals}
          getRowId={(deal) => deal.id}
          onCellCommit={(row, key, value) =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                setDeals((prev) =>
                  prev.map((deal) =>
                    deal.id === row.id ? { ...deal, [key]: value } : deal,
                  ),
                );
                resolve();
              }, 600),
            )
          }
        />
        <p className="text-xs text-muted-foreground">
          Focus a cell, press Enter or F2 to edit; Escape restores grid
          navigation. Commits are async — watch the cell status.
        </p>
      </div>
    </Wrapper>
  );
}

export function dataGridLoadMore(): ReactNode {
  const [rows, setRows] = useState(DEALS.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const hasMore = rows.length < DEALS.length;
  return (
    <Wrapper className="block">
      <DataGrid<Deal>
        aria-label="Paged deals"
        columns={[
          { key: "name", header: "Name", minWidth: 160, mobile: "visible" },
          { key: "stage", header: "Stage", minWidth: 110 },
        ]}
        data={rows}
        getRowId={(deal) => deal.id}
        loadMore={{
          hasMore,
          loading,
          onLoadMore: () => {
            setLoading(true);
            setTimeout(() => {
              setRows(DEALS.slice(0, rows.length + 2));
              setLoading(false);
            }, 500);
          },
        }}
      />
    </Wrapper>
  );
}

export function dataGridNarrow(): ReactNode {
  // The honest-narrow contract, forced: a 320px-wide pane. Every column that no
  // longer fits STACKS into the primary cell (`mobile: "merge"`, the default)
  // rather than disappearing: narrowing a viewport never loses data silently. A
  // column that opts into `mobile: "hidden"` is counted and reported in the
  // toolbar instead.
  const columns: DataGridColumn<Deal>[] = [
    { key: "name", header: "Deal", minWidth: 160, mobile: "visible" },
    { key: "stage", header: "Stage", minWidth: 140 },
    {
      key: "amount",
      header: "Amount",
      align: "end",
      minWidth: 140,
      mono: true,
      render: (deal) => money(deal.amount),
    },
    { key: "owner", header: "Owner", minWidth: 140, mobile: "hidden" },
  ];
  return (
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-80">
        <DataGrid
          aria-label="Deals at 320px"
          columns={columns}
          data={DEALS.slice(0, 3)}
          getRowId={(deal) => deal.id}
          columnPicker={false}
        />
      </div>
    </Wrapper>
  );
}

/* ── Spreadsheet scale (R2): fixed layout, frozen + resizable + windowed columns ── */

interface SheetRow {
  id: string;
  index: number;
}

const SHEET_COLUMNS = 150;
const SHEET_ROWS = 50_000;
const SHEET_STATUSES = ["Requested", "Sent", "Received", "Closed"];

/** Rows built once, on first use; every other value is computed by its column's `render`. */
let sheetRows: SheetRow[] | null = null;
function getSheetRows(): SheetRow[] {
  sheetRows ??= Array.from({ length: SHEET_ROWS }, (_, index) => ({
    id: `r${index + 1}`,
    index,
  }));
  return sheetRows;
}

export function dataGridSpreadsheet(): ReactNode {
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<Record<string, string | null>>({
    f1: "sum",
  });
  const rows = getSheetRows();
  const columns: DataGridColumn<SheetRow>[] = [
    {
      key: "name",
      header: "Name",
      frozen: true,
      width: widths.name ?? 240,
      render: (row) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            SR-{row.index + 1}
          </span>
          <span className="truncate">Sample request {row.index + 1}</span>
        </span>
      ),
    },
    ...Array.from({ length: SHEET_COLUMNS - 1 }, (_, index) => {
      const key = `f${index + 1}`;
      const numeric = (index + 1) % 3 !== 0;
      return {
        key,
        header: numeric ? `Qty ${index + 1}` : `Status ${index + 1}`,
        width: widths[key] ?? 140,
        align: numeric ? ("end" as const) : undefined,
        numeric,
        render: (row: SheetRow) =>
          numeric
            ? String(((row.index + 1) * (index + 8)) % 1000)
            : SHEET_STATUSES[(row.index + index) % 4],
        summaryOptions: numeric
          ? [
              { value: "sum", label: "Sum" },
              { value: "avg", label: "Average" },
            ]
          : [{ value: "filled", label: "Filled" }],
      } satisfies DataGridColumn<SheetRow>;
    }),
  ];
  return (
    <Wrapper className="block">
      <DataGrid<SheetRow>
        aria-label="Sample requests"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sortMode="manual"
        columnPicker={false}
        virtualize
        virtualizeColumns
        rowHeight="short"
        maxHeight="420px"
        onColumnResize={(key, width) =>
          setWidths((current) => ({ ...current, [key]: width }))
        }
        summaryRow={{
          label: `${SHEET_ROWS.toLocaleString("en-US")} rows`,
          value: summary,
          onValueChange: (key, value) =>
            setSummary((current) => ({ ...current, [key]: value })),
          results: Object.fromEntries(
            Object.keys(summary).map((key) => [
              key,
              summary[key] === "avg" ? "499.5" : "24,975,000",
            ]),
          ),
        }}
      />
    </Wrapper>
  );
}

/* ── Host groups, each paging its own keyset, flattened into one virtual list ── */

const GROUP_STAGES = ["Qualified", "Proposal", "Won"];

export function dataGridServerGroups(): ReactNode {
  const [loaded, setLoaded] = useState<Record<string, number>>({
    Qualified: 40,
    Proposal: 40,
    Won: 40,
  });
  const rows: Deal[] = GROUP_STAGES.flatMap((stage) =>
    Array.from({ length: loaded[stage]! }, (_, index) => ({
      id: `${stage}-${index}`,
      name: `${stage} deal ${index + 1}`,
      stage,
      owner: ["Priya", "Mel", "Ada"][index % 3]!,
      amount: 1000 + ((index * 7919) % 50_000),
    })),
  );
  return (
    <Wrapper className="block">
      <DataGrid<Deal>
        aria-label="Deals by stage"
        columns={[
          { key: "name", header: "Name", width: 240, frozen: true },
          { key: "owner", header: "Owner", width: 140 },
          {
            key: "amount",
            header: "Amount",
            width: 140,
            align: "end",
            numeric: true,
            render: (deal) => money(deal.amount),
          },
        ]}
        data={rows}
        getRowId={(deal) => deal.id}
        sortMode="manual"
        columnPicker={false}
        virtualize
        rowHeight="medium"
        maxHeight="360px"
        sections={GROUP_STAGES.map((stage) => ({
          id: stage,
          label: stage,
          count: 200,
          rowIds: rows
            .filter((row) => row.stage === stage)
            .map((row) => row.id),
          loadMore: {
            hasMore: loaded[stage]! < 200,
            onLoadMore: () =>
              setLoaded((current) => ({
                ...current,
                [stage]: Math.min(200, current[stage]! + 40),
              })),
          },
        }))}
      />
    </Wrapper>
  );
}

/* ── Paged mode: Previous / Next instead of scrolling (a screen-reader setting) ── */

export function dataGridPaged(): ReactNode {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const all: Deal[] = Array.from({ length: 23 }, (_, index) => ({
    id: `p${index}`,
    name: `Deal ${index + 1}`,
    stage: GROUP_STAGES[index % 3]!,
    owner: ["Priya", "Mel", "Ada"][index % 3]!,
    amount: 1000 * (index + 1),
  }));
  const rows = all.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <Wrapper className="block">
      <DataGrid<Deal>
        aria-label="Deals, paged"
        columns={[
          { key: "name", header: "Name" },
          { key: "stage", header: "Stage" },
          {
            key: "amount",
            header: "Amount",
            align: "end",
            numeric: true,
            render: (deal) => money(deal.amount),
          },
        ]}
        data={rows}
        getRowId={(deal) => deal.id}
        sortMode="manual"
        columnPicker={false}
        ariaRowCount={all.length + 1}
        ariaRowIndexOffset={page * pageSize}
        pagedMode={{
          label: `Rows ${page * pageSize + 1}–${page * pageSize + rows.length}`,
          hasPrevious: page > 0,
          hasNext: (page + 1) * pageSize < all.length,
          onPrevious: () => setPage((current) => current - 1),
          onNext: () => setPage((current) => current + 1),
        }}
      />
    </Wrapper>
  );
}

/* ── Cells mode (R3): ranges, copy and paste, clear, fill, undo, remote changes ── */

interface Sample {
  id: string;
  name: string;
  status: string;
  qty: number;
}

const SAMPLES: Sample[] = Array.from({ length: 8 }, (_, index) => ({
  id: `s${index + 1}`,
  name: `Sample request ${index + 1}`,
  status: ["Requested", "Sent", "Received", "Closed"][index % 4]!,
  qty: (index + 1) * 2,
}));

export function dataGridCells(): ReactNode {
  const [rows, setRows] = useState(SAMPLES);
  const [history, setHistory] = useState<Sample[][]>([]);
  const [future, setFuture] = useState<Sample[][]>([]);
  const apply = (next: Sample[]) => {
    setHistory((past) => [...past, rows]);
    setFuture([]);
    setRows(next);
  };
  const columns: DataGridColumn<Sample>[] = [
    {
      key: "name",
      header: "Name",
      width: 220,
      frozen: true,
      editable: { type: "text" },
    },
    {
      key: "status",
      header: "Status",
      width: 140,
      editable: {
        type: "select",
        options: ["Requested", "Sent", "Received", "Closed"].map((value) => ({
          value,
          label: value,
        })),
      },
    },
    {
      key: "qty",
      header: "Qty",
      width: 100,
      align: "end",
      numeric: true,
      // A pasted cell's exact number when the source had one, else its text read as a number.
      parse: (cell) => cell.number ?? Number(cell.text.replace(/,/g, "")),
    },
  ];
  return (
    <Wrapper className="block">
      <DataGrid<Sample>
        aria-label="Sample requests, cells"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sortMode="manual"
        columnPicker={false}
        rowHeight="medium"
        selectionMode="cells"
        onCellCommit={(row, key, value) =>
          apply(rows.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)))
        }
        onCellsCommit={async (changes) => {
          const results = changes.map((change) =>
            change.key === "qty" &&
            change.value !== null &&
            !Number.isFinite(change.value)
              ? { status: "invalid" as const, reason: "Qty must be a number" }
              : {
                  status: "ok" as const,
                  value: change.value,
                  version: 1,
                  changeId: `${change.rowId}:${change.key}`,
                },
          );
          apply(
            rows.map((row) => {
              const next = { ...row } as Record<string, unknown>;
              changes.forEach((change, index) => {
                if (change.rowId === row.id && results[index]!.status === "ok")
                  next[change.key] =
                    change.value ?? (change.key === "qty" ? 0 : "");
              });
              return next as unknown as Sample;
            }),
          );
          return results;
        }}
        onFill={({ source, target }) =>
          apply(
            rows.map((row) => {
              const at = target.rowIds.indexOf(row.id);
              if (at === -1) return row;
              const from = rows.find(
                (r) => r.id === source.rowIds[at % source.rowIds.length],
              )!;
              const next = { ...row } as Record<string, unknown>;
              for (const key of target.keys)
                next[key] = (from as unknown as Record<string, unknown>)[key];
              return next as unknown as Sample;
            }),
          )
        }
        onUndo={() => {
          const previous = history.at(-1);
          if (!previous) return;
          setFuture((next) => [rows, ...next]);
          setHistory((past) => past.slice(0, -1));
          setRows(previous);
        }}
        onRedo={() => {
          const next = future[0];
          if (!next) return;
          setHistory((past) => [...past, rows]);
          setFuture((rest) => rest.slice(1));
          setRows(next);
        }}
      />
    </Wrapper>
  );
}

/* ── A record table: rows open beside the grid, the grid fills its box, cards on a phone ── */

export function dataGridRecords(): ReactNode {
  const [rows, setRows] = useState(SAMPLES);
  const [sort, setSort] = useState<DataGridSort[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const actions = useRef<DataGridActions>(null);
  const sortMenu = (key: string) => (
    <>
      <DropdownMenuItem onClick={() => setSort([{ key, direction: "asc" }])}>
        <ArrowUp /> Sort ascending
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setSort([{ key, direction: "desc" }])}>
        <ArrowDown /> Sort descending
      </DropdownMenuItem>
    </>
  );
  const columns: DataGridColumn<Sample>[] = [
    {
      key: "name",
      header: "Name",
      icon: <Type />,
      width: 220,
      frozen: true,
      editable: { type: "text" },
      headerMenu: sortMenu("name"),
    },
    {
      key: "status",
      header: "Status",
      icon: <CircleDot />,
      width: 140,
      editable: {
        type: "select",
        options: ["Requested", "Sent", "Received", "Closed"].map((value) => ({
          value,
          label: value,
        })),
      },
      headerMenu: sortMenu("status"),
    },
    {
      key: "qty",
      header: "Qty",
      icon: <Hash />,
      width: 100,
      // A numeric column lines its figures and its header up at the end.
      numeric: true,
      editable: { type: "number" },
      headerMenu: sortMenu("qty"),
    },
  ];
  const sorted = sort[0]
    ? [...rows].sort((a, b) => {
        const key = sort[0]!.key as keyof Sample;
        const order = String(a[key]).localeCompare(String(b[key]), "en", {
          numeric: true,
        });
        return sort[0]!.direction === "asc" ? order : -order;
      })
    : rows;
  const openRow = open ? rows.find((row) => row.id === open) : undefined;
  return (
    <Wrapper className="block space-y-3">
      <DataGrid<Sample>
        aria-label="Sample requests"
        columns={columns}
        data={sorted}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        sortMode="manual"
        sort={sort}
        onSortChange={setSort}
        columnPicker={false}
        rowHeight="short"
        selectionMode="cells"
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        selectionActions={(ids, clear) => (
          <ActionBarButton
            onClick={() => {
              setRows((current) => current.filter((row) => !ids.has(row.id)));
              clear();
            }}
          >
            Delete
          </ActionBarButton>
        )}
        onRowOpen={(id) => setOpen(id)}
        activeRowId={open}
        actionsRef={actions}
        phoneLayout="cards"
        onCellCommit={(row, key, value) =>
          setRows((current) =>
            current.map((r) =>
              r.id === row.id
                ? { ...r, [key]: key === "qty" ? Number(value) : value }
                : r,
            ),
          )
        }
        headerTrailing={(focus) => (
          <Button
            {...focus}
            variant="ghost"
            size="icon-sm"
            aria-label="Add field"
          >
            <Plus />
          </Button>
        )}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {openRow
          ? `Open: ${openRow.name} (${(actions.current?.getRowOrder().indexOf(openRow.id) ?? 0) + 1} of ${sorted.length})`
          : "Hover a row and press its Open button, or press Space on a cell."}
      </p>
    </Wrapper>
  );
}

/* ── An empty grid wider than its box: the empty state stays where the reader is ── */

export function dataGridEmpty(): ReactNode {
  const columns: DataGridColumn<Sample>[] = Array.from(
    { length: 9 },
    (_, index) => ({
      key: index === 0 ? "name" : `f${index}`,
      header: index === 0 ? "Name" : `Field ${index}`,
      width: index === 0 ? 220 : 160,
    }),
  );
  return (
    <Wrapper className="block">
      <DataGrid<Sample>
        aria-label="Empty sample requests"
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        columnPicker={false}
      />
    </Wrapper>
  );
}

/* ── A table block in a page: sized to its rows, editable in place for people who can edit ── */

type BlockRow = Sample & { owner: string; site: string };
const BLOCK_ROWS: BlockRow[] = SAMPLES.map((sample, index) => ({
  ...sample,
  owner: ["Priya", "Mel", "Ada"][index % 3]!,
  site: ["Pune", "Leeds", "Austin"][index % 3]!,
}));

export function dataGridEmbedded(): ReactNode {
  const [rows, setRows] = useState(BLOCK_ROWS);
  const [canEdit, setCanEdit] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const total = 117;
  const columns: DataGridColumn<BlockRow>[] = [
    {
      key: "name",
      header: "Name",
      icon: <Type />,
      editable: { type: "text" },
    },
    {
      key: "status",
      header: "Status",
      icon: <CircleDot />,
      editable: {
        type: "select",
        options: ["Requested", "Sent", "Received", "Closed"].map((value) => ({
          value,
          label: value,
        })),
      },
    },
    {
      key: "qty",
      header: "Qty",
      icon: <Hash />,
      numeric: true,
      editable: { type: "number" },
    },
    { key: "owner", header: "Owner", editable: { type: "text" } },
    { key: "site", header: "Site", editable: { type: "text" } },
  ];
  return (
    <Wrapper className="block space-y-3">
      <div className="flex items-center gap-2">
        <Switch
          id="grid-can-edit"
          checked={canEdit}
          onCheckedChange={setCanEdit}
        />
        <Label htmlFor="grid-can-edit">Can edit</Label>
      </div>
      <DataGrid<BlockRow>
        embedded
        maxRows={5}
        aria-label="Sample requests"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        readOnly={!canEdit}
        onRowOpen={(id) => setOpen(id)}
        activeRowId={open}
        onCellCommit={(row, key, value) =>
          setRows((current) =>
            current.map((r) =>
              r.id === row.id
                ? { ...r, [key]: key === "qty" ? Number(value) : value }
                : r,
            ),
          )
        }
        toolbar={
          <BlockHeader
            icon={<Table2 />}
            title="Sample requests"
            open={<BlockHeaderOpen href="#sample-requests" />}
          >
            <BlockHeaderButton>
              Grid <ChevronDown />
            </BlockHeaderButton>
            <BlockHeaderButton>
              <ListFilter /> Filter
            </BlockHeaderButton>
          </BlockHeader>
        }
        footer={{
          onNewRow: () =>
            setRows((current) => [
              {
                id: `n${current.length + 1}`,
                name: "",
                status: "Requested",
                qty: 0,
                owner: "",
                site: "",
              },
              ...current,
            ]),
          shown: Math.min(rows.length, 5),
          total,
        }}
      />
    </Wrapper>
  );
}
