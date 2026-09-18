"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon, MoreHorizontalIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/table` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/*
 * Fixtures come from upstream's own examples in `vendor/shadcn/4.21.0/docs/table.md`. `Table`
 * renders its own `data-slot="table-container"` overflow div, so no fixture adds a scroller of its
 * own — a preview composes, it does not restyle.
 */

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
];

export function table(): ReactNode {
  return (
    <Wrapper className="block">
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right">
                {invoice.totalAmount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">$2,500.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Wrapper>
  );
}

/** Upstream's Composition tree, rendered: caption, header, body, footer. */
export function tableComposition(): ReactNode {
  return (
    <Wrapper className="block">
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.slice(0, 2).map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right">
                {invoice.totalAmount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

export function tableFooter(): ReactNode {
  return (
    <Wrapper className="block">
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.slice(0, 3).map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right">
                {invoice.totalAmount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">$2,500.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Wrapper>
  );
}

const products = [
  { product: "Wireless Mouse", price: "$29.99" },
  { product: "Mechanical Keyboard", price: "$129.99" },
  { product: "USB-C Hub", price: "$49.99" },
];

export function tableActions(): ReactNode {
  return (
    <Wrapper className="block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((row) => (
            <TableRow key={row.product}>
              <TableCell className="font-medium">{row.product}</TableCell>
              <TableCell>{row.price}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-8" />
                    }
                  >
                    <MoreHorizontalIcon />
                    <span className="sr-only">Open menu</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

/**
 * Upstream's Data Table section points at `@tanstack/react-table` and its own `/docs/components/
 * data-table` page. Neither exists here, so this is the smallest honest equivalent: the same
 * `Table` parts plus an `Input` and a `Button`, wired to sorting and filtering held in ordinary
 * React state. It introduces no new component and no new dependency — the point of the section is
 * that `Table` is the presentation layer a row model drives, whichever row model that is.
 */
type SortKey = "invoice" | "totalAmount";

function amountOf(value: string) {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function DataTableDemo() {
  const [filter, setFilter] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; desc: boolean }>({
    key: "invoice",
    desc: false,
  });

  const rows = React.useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? invoices.filter((row) =>
          `${row.invoice} ${row.paymentStatus} ${row.paymentMethod}`
            .toLowerCase()
            .includes(needle),
        )
      : invoices;
    const sorted = [...filtered].sort((a, b) =>
      sort.key === "totalAmount"
        ? amountOf(a.totalAmount) - amountOf(b.totalAmount)
        : a.invoice.localeCompare(b.invoice, "en"),
    );
    return sort.desc ? sorted.reverse() : sorted;
  }, [filter, sort]);

  const toggle = (key: SortKey) =>
    setSort((previous) =>
      previous.key === key
        ? { key, desc: !previous.desc }
        : { key, desc: false },
    );

  const SortIcon = sort.desc ? ArrowDownIcon : ArrowUpIcon;

  return (
    <div className="flex w-full flex-col gap-3">
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter invoices…"
        aria-label="Filter invoices"
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="w-[140px]"
              aria-sort={
                sort.key === "invoice"
                  ? sort.desc
                    ? "descending"
                    : "ascending"
                  : "none"
              }
            >
              <Button
                variant="ghost"
                size="sm"
                className="-ms-2.5"
                onClick={() => toggle("invoice")}
              >
                Invoice
                {sort.key === "invoice" ? <SortIcon /> : null}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead
              className="text-right"
              aria-sort={
                sort.key === "totalAmount"
                  ? sort.desc
                    ? "descending"
                    : "ascending"
                  : "none"
              }
            >
              <Button
                variant="ghost"
                size="sm"
                className="-me-2.5"
                onClick={() => toggle("totalAmount")}
              >
                Amount
                {sort.key === "totalAmount" ? <SortIcon /> : null}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.invoice}>
              <TableCell className="font-medium">{row.invoice}</TableCell>
              <TableCell>{row.paymentStatus}</TableCell>
              <TableCell>{row.paymentMethod}</TableCell>
              <TableCell className="text-right">{row.totalAmount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>
              {rows.length} of {invoices.length} invoices
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export function tableDataTable(): ReactNode {
  return (
    <Wrapper className="block">
      <DataTableDemo />
    </Wrapper>
  );
}

/**
 * Upstream drives its RTL example through a `language-selector` fixture we do not ship, so the
 * Arabic strings are inline and the subtree is wrapped in `DirectionProvider`. `TableHead` and
 * `TableCell` align with `text-start`, so the header flips with the reading direction on its own.
 */
const arabic = {
  caption: "قائمة بفواتيرك الأخيرة.",
  invoice: "الفاتورة",
  status: "الحالة",
  method: "الطريقة",
  amount: "المبلغ",
  total: "المجموع",
} as const;

const arabicStatus: Record<string, string> = {
  Paid: "مدفوع",
  Pending: "قيد الانتظار",
  Unpaid: "غير مدفوع",
};

const arabicMethod: Record<string, string> = {
  "Credit Card": "بطاقة ائتمانية",
  PayPal: "PayPal",
  "Bank Transfer": "تحويل بنكي",
};

export function tableRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper className="block" dir="rtl">
        <Table>
          <TableCaption>{arabic.caption}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{arabic.invoice}</TableHead>
              <TableHead>{arabic.status}</TableHead>
              <TableHead>{arabic.method}</TableHead>
              <TableHead className="text-right">{arabic.amount}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.invoice}>
                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                <TableCell>{arabicStatus[invoice.paymentStatus]}</TableCell>
                <TableCell>{arabicMethod[invoice.paymentMethod]}</TableCell>
                <TableCell className="text-right">
                  {invoice.totalAmount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>{arabic.total}</TableCell>
              <TableCell className="text-right">$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Wrapper>
    </DirectionProvider>
  );
}
