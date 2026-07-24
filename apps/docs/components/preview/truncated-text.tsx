"use client";

import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Copied INTO apps/docs via `shadcn add @vegastack/truncated-text` (dogfoods the registry) → auto-scanned.
import {
  IconText,
  TableCellText,
  TruncatedText,
} from "@/components/ui/truncated-text";

// The Tooltip.Provider already lives in the docs <Provider> (mirrors
// VegaStackProvider), so the overflow tooltip works without extra wiring.

const LONG_TITLE =
  "Quarterly revenue reconciliation report — North America region, fiscal year 2026";

const LONG_DESCRIPTION =
  "A long-form description that comfortably exceeds two lines inside a constrained column, so the text clamps with an ellipsis and the full copy is revealed in a tooltip on hover or keyboard focus.";

export function truncatedText(): ReactNode {
  return (
    <Wrapper>
      <div className="w-56 space-y-1 rounded-md border border-fd-border p-3">
        <p className="text-sm text-muted-foreground">Report name</p>
        {/* Single line: hover or focus to reveal the full title in a tooltip. */}
        <TruncatedText className="text-base text-foreground">
          {LONG_TITLE}
        </TruncatedText>
      </div>
    </Wrapper>
  );
}

export function truncatedTextMultiline(): ReactNode {
  return (
    <Wrapper>
      <div className="w-56 space-y-1 rounded-md border border-fd-border p-3">
        <p className="text-sm text-muted-foreground">Description</p>
        {/* Clamp to two lines; the overflow tooltip carries the rest. */}
        <TruncatedText
          as="p"
          lines={2}
          className="text-base text-muted-foreground"
        >
          {LONG_DESCRIPTION}
        </TruncatedText>
      </div>
    </Wrapper>
  );
}

export function truncatedTextLines(): ReactNode {
  // Walk the clamp scale: 1 (truncate) → 3 → 6. The same overflowing copy is
  // clamped at each row, so the line budget is the only difference. `lines`
  // above 6 falls back to `line-clamp-6`.
  return (
    <Wrapper className="flex-col items-start gap-4">
      {([1, 3, 6] as const).map((n) => (
        <div
          key={n}
          className="w-56 space-y-1 rounded-md border border-fd-border p-3"
        >
          <p className="text-sm text-muted-foreground">lines={n}</p>
          <TruncatedText as="p" lines={n} className="text-base text-foreground">
            {LONG_DESCRIPTION}
          </TruncatedText>
        </div>
      ))}
    </Wrapper>
  );
}

const FILE_NAME = "Q3-2026-revenue-reconciliation-north-america-final-v7.xlsx";

export function iconText(): ReactNode {
  return (
    <Wrapper>
      <div className="w-56 rounded-md border border-fd-border p-2">
        {/* Icon and trailing Badge stay pinned (shrink-0); only the label
            truncates and reveals the full name in a tooltip on hover/focus. */}
        <IconText
          icon={<FileText className="size-(--icon-default)" />}
          text={FILE_NAME}
          trailing={<Badge>New</Badge>}
          className="text-base text-foreground"
        />
      </div>
    </Wrapper>
  );
}

export function iconTextSides(): ReactNode {
  // `tooltipSide` places the overflow tooltip on any edge of the row. Each row
  // overflows, so hovering/focusing reveals the full label on the chosen side.
  return (
    <Wrapper className="flex-col items-start gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <div key={side} className="w-56 rounded-md border border-fd-border p-2">
          <IconText
            icon={<FileText className="size-(--icon-default)" />}
            text={`tooltipSide="${side}" — ${FILE_NAME}`}
            tooltipSide={side}
            className="text-base text-foreground"
          />
        </div>
      ))}
    </Wrapper>
  );
}

const SPACE_ID = "spc_3f9a17c4e2b84d6f9a01c5e7";

export function tableCellText(): ReactNode {
  // `width` matches the column header so truncation engages within the column;
  // `mono` renders IDs/paths in the monospace family at a smaller size.
  return (
    <Wrapper className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Name</TableHead>
            <TableHead className="w-40">ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <TableCellText text={LONG_TITLE} width="11rem" />
            </TableCell>
            <TableCell>
              <TableCellText text={SPACE_ID} width="10rem" mono />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <TableCellText text="Marketing site" width="11rem" />
            </TableCell>
            <TableCell>
              <TableCellText text="spc_a1" width="10rem" mono />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Wrapper>
  );
}
