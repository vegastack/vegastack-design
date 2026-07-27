"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-grid` (dogfoods the registry) → auto-scanned.
import {
  DataGrid,
  type DataGridColumn,
  type DataGridSort,
} from "@/components/ui/data-grid";
import { Badge } from "@/components/ui/badge";

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
      render: (deal) => <Badge variant="subtle">{deal.stage}</Badge>,
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
        <p className="text-sm text-muted-foreground">
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
