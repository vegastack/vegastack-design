"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-list-pager` (dogfoods the registry) → auto-scanned.
import { DataList, type DataListColumn } from "@/components/ui/data-list";
import { DataListPager } from "@/components/ui/data-list-pager";

interface Invoice {
  id: string;
  ref: string;
  customer: string;
  amount: number;
}

const CUSTOMERS = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"];

const invoices: Invoice[] = Array.from({ length: 40 }, (_, index) => ({
  id: String(index + 1),
  ref: `INV-${String(1001 + index)}`,
  customer: CUSTOMERS[index % CUSTOMERS.length]!,
  amount: 120 + ((index * 379) % 2400),
}));

const columns: DataListColumn<Invoice>[] = [
  { key: "ref", header: "Invoice", mono: true },
  { key: "customer", header: "Customer" },
  {
    key: "amount",
    header: "Amount",
    align: "end",
    render: (invoice) => `$${invoice.amount.toLocaleString("en-US")}`,
  },
];

/** The pager in `DataList`'s footer: the host owns page and page size, and slices the rows. */
export function dataListPager(): ReactNode {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  return (
    <Wrapper className="block">
      <DataList
        aria-label="Invoices"
        columns={columns}
        data={invoices.slice((page - 1) * pageSize, page * pageSize)}
        getRowId={(invoice) => invoice.id}
        footer={
          <DataListPager
            page={page}
            pageSize={pageSize}
            total={invoices.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      />
    </Wrapper>
  );
}

/** A long run of pages collapses into a window: first, last, and the current page's neighbours. */
export function dataListPagerWindowed(): ReactNode {
  const [page, setPage] = React.useState(6);
  const [pageSize, setPageSize] = React.useState(15);
  return (
    <Wrapper className="block">
      <DataListPager
        page={page}
        pageSize={pageSize}
        total={240}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </Wrapper>
  );
}

/** One page: the page controls hide, while the range and the rows-per-page chooser stay. */
export function dataListPagerSinglePage(): ReactNode {
  const [pageSize, setPageSize] = React.useState(15);
  return (
    <Wrapper className="block">
      <DataListPager
        page={1}
        pageSize={pageSize}
        total={9}
        onPageChange={() => {}}
        onPageSizeChange={setPageSize}
      />
    </Wrapper>
  );
}
