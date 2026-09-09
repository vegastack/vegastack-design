"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/table` (dogfoods the registry) → auto-scanned.
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type InvoiceStatus = "paid" | "pending" | "overdue";

const STATUS: Record<
  InvoiceStatus,
  { label: string; color: "success" | "warning" | "destructive" }
> = {
  paid: { label: "Paid", color: "success" },
  pending: { label: "Pending", color: "warning" },
  overdue: { label: "Overdue", color: "destructive" },
};

const invoices: {
  invoice: string;
  status: InvoiceStatus;
  method: string;
  amount: string;
}[] = [
  {
    invoice: "INV-001",
    status: "paid",
    method: "Credit card",
    amount: "$250.00",
  },
  {
    invoice: "INV-002",
    status: "pending",
    method: "PayPal",
    amount: "$150.00",
  },
  {
    invoice: "INV-003",
    status: "overdue",
    method: "Bank transfer",
    amount: "$350.00",
  },
  {
    invoice: "INV-004",
    status: "paid",
    method: "Credit card",
    amount: "$90.00",
  },
];

export function table(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Invoice</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Method</TableHead>
            <TableHead scope="col" className="text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((row) => (
            <TableRow key={row.invoice}>
              <TableCell className="font-mono tabular-nums font-medium">
                {row.invoice}
              </TableCell>
              <TableCell>
                <Badge
                  variant="soft"
                  intent={STATUS[row.status].color}
                  dot
                  size="sm"
                >
                  {STATUS[row.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.method}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {row.amount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

export function tableWithCaptionAndFooter(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Invoice</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col" className="text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.slice(0, 3).map((row) => (
            <TableRow
              key={row.invoice}
              data-selected={row.invoice === "INV-002" ? "" : undefined}
            >
              <TableCell className="font-mono tabular-nums font-medium">
                {row.invoice}
              </TableCell>
              <TableCell>
                <Badge
                  variant="soft"
                  intent={STATUS[row.status].color}
                  dot
                  size="sm"
                >
                  {STATUS[row.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {row.amount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              $750.00
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Wrapper>
  );
}

// Wide table: more columns than the container can fit, so the
// `data-slot="table-container"` overflow-x-auto wrapper kicks in and the table
// scrolls horizontally instead of overflowing its parent.
const wideColumns = [
  "Invoice",
  "Status",
  "Method",
  "Customer",
  "Email",
  "Issued",
  "Due",
  "Amount",
] as const;

const wideRows: Record<(typeof wideColumns)[number], string>[] = [
  {
    Invoice: "INV-001",
    Status: "Paid",
    Method: "Credit card",
    Customer: "Ada Lovelace",
    Email: "ada@analytical.dev",
    Issued: "2026-05-01",
    Due: "2026-05-15",
    Amount: "$250.00",
  },
  {
    Invoice: "INV-002",
    Status: "Pending",
    Method: "PayPal",
    Customer: "Grace Hopper",
    Email: "grace@cobol.mil",
    Issued: "2026-05-03",
    Due: "2026-05-17",
    Amount: "$150.00",
  },
  {
    Invoice: "INV-003",
    Status: "Overdue",
    Method: "Bank transfer",
    Customer: "Alan Turing",
    Email: "alan@enigma.uk",
    Issued: "2026-04-20",
    Due: "2026-05-04",
    Amount: "$350.00",
  },
];

export function tableOverflow(): ReactNode {
  return (
    // Constrain the width so the wide table must scroll inside its container.
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-md">
        {/* Named, so the scroll region a keyboard user lands on announces what
            it holds. The region takes a tab stop only while it can scroll. */}
        <Table scrollLabel="Invoice ledger">
          <TableHeader>
            <TableRow>
              {wideColumns.map((col) => (
                <TableHead
                  key={col}
                  scope="col"
                  className={col === "Amount" ? "text-right" : undefined}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {wideRows.map((row) => (
              <TableRow key={row.Invoice}>
                {wideColumns.map((col) => (
                  <TableCell
                    key={col}
                    className={
                      col === "Amount"
                        ? "text-right font-mono tabular-nums"
                        : col === "Invoice"
                          ? "font-mono tabular-nums font-medium"
                          : "text-muted-foreground"
                    }
                  >
                    {row[col]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Wrapper>
  );
}

export function tableSelectable(): ReactNode {
  const allInvoices = invoices.map((row) => row.invoice);

  function SelectableTable() {
    const [selected, setSelected] = useState<string[]>(["INV-002"]);
    const allSelected = selected.length === allInvoices.length;
    const someSelected = selected.length > 0 && !allSelected;

    function toggleAll() {
      setSelected(allSelected ? [] : allInvoices);
    }

    function toggleRow(invoice: string) {
      setSelected((prev) =>
        prev.includes(invoice)
          ? prev.filter((id) => id !== invoice)
          : [...prev, invoice],
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {/* The checkbox cell collapses its right padding via [&:has([role=checkbox])]:pr-0 */}
            <TableHead className="w-0">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all invoices"
              />
            </TableHead>
            <TableHead scope="col">Invoice</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col" className="text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((row) => {
            const isSelected = selected.includes(row.invoice);
            return (
              <TableRow
                key={row.invoice}
                data-selected={isSelected ? "" : undefined}
                aria-selected={isSelected}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(row.invoice)}
                    aria-label={`Select ${row.invoice}`}
                  />
                </TableCell>
                <TableCell className="font-mono tabular-nums font-medium">
                  {row.invoice}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="soft"
                    intent={STATUS[row.status].color}
                    dot
                    size="sm"
                  >
                    {STATUS[row.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {row.amount}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  return (
    <Wrapper className="justify-stretch">
      <SelectableTable />
    </Wrapper>
  );
}

export function tableSpreadsheet(): ReactNode {
  // Wave 2 data-table voice: `grid` (full cell hairlines) + `headerTone="ink"`
  // (14/500 foreground headers) + `density="compact"` (~32px rows).
  return (
    <Wrapper className="flex-col items-stretch">
      <Table grid headerTone="ink" density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">ARR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ["Globex", "Ada Lovelace", "$1.2M"],
            ["Initech", "Grace Hopper", "$840K"],
            ["Umbrella", "Edsger Dijkstra", "$310K"],
          ].map(([company, owner, arr]) => (
            <TableRow key={company}>
              <TableCell className="font-medium">{company}</TableCell>
              <TableCell>{owner}</TableCell>
              <TableCell className="text-right font-mono text-code-sm tabular-nums">
                {arr}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

const notes = [
  {
    id: "REQ-4821",
    subject: "Storage quota exceeded on the production bucket",
    note: "The nightly export wrote 42 GB of intermediate artefacts before the retention job ran, so the quota alarm fired at 03:14 UTC and paused ingestion for eleven minutes.",
    amount: "$1,240.00",
  },
  {
    id: "REQ-4822",
    subject: "Webhook retries exhausted",
    note: "Six consecutive deliveries to https://hooks.internal.example.com/v2/billing/settlement returned 504; the endpoint is now in cooldown until it answers a probe.",
    amount: "$86.00",
  },
];

export function tableWrapping(): ReactNode {
  return (
    // Cells wrap by default: a long value breaks inside its column instead of
    // forcing the whole table sideways. The id and the figure opt back out.
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-lg">
        <Table scrollLabel="Support requests">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Ref</TableHead>
              <TableHead scope="col">Request</TableHead>
              <TableHead scope="col" className="text-end">
                Credit
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono tabular-nums whitespace-nowrap">
                  {row.id}
                </TableCell>
                <TableCell>
                  <span className="text-foreground">{row.subject}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {row.note}
                  </span>
                </TableCell>
                <TableCell className="text-end font-mono tabular-nums whitespace-nowrap">
                  {row.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Wrapper>
  );
}
