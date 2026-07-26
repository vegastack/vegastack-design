"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/action-bar` (dogfoods the registry) → auto-scanned.
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const ROWS = ["Acme Corporation", "Globex", "Initech", "Umbrella"];

export function actionBar(): ReactNode {
  const [selected, setSelected] = useState<Set<string>>(new Set(["Globex"]));
  const toggle = (row: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  };
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2 pb-16">
        {ROWS.map((row) => (
          <label key={row} className="flex items-center gap-2 text-base">
            <Checkbox
              size="sm"
              checked={selected.has(row)}
              onCheckedChange={() => toggle(row)}
              aria-label={`Select ${row}`}
            />
            {row}
          </label>
        ))}
        {/* The bar CONSUMES the count — the list above owns the selection. */}
        <ActionBar
          open={selected.size > 0}
          status={`${selected.size} selected`}
          aria-label="Bulk actions"
          className="absolute"
        >
          <Button variant="ghost" size="sm">
            Tag
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Clear selection
          </Button>
        </ActionBar>
      </div>
    </Wrapper>
  );
}

export function actionBarUnsaved(): ReactNode {
  const [dirty, setDirty] = useState(true);
  return (
    <Wrapper className="block">
      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-2 pb-16">
        <Button variant="outline" size="sm" onClick={() => setDirty(true)}>
          Make a change
        </Button>
        <ActionBar
          open={dirty}
          status="Unsaved changes"
          aria-label="Unsaved changes"
          className="absolute"
        >
          <Button variant="ghost" size="sm" onClick={() => setDirty(false)}>
            Discard
          </Button>
          <Button size="sm" onClick={() => setDirty(false)}>
            Save
          </Button>
        </ActionBar>
      </div>
    </Wrapper>
  );
}

export function actionBarPending(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="relative mx-auto flex w-full max-w-sm flex-col pb-16">
        <ActionBar
          status="Importing 340 of 1,000…"
          announcement="Importing 340 of 1,000…"
          pending
          aria-label="Import progress"
          className="absolute"
        >
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </ActionBar>
      </div>
    </Wrapper>
  );
}
