"use client";

import { type ReactNode, useState } from "react";
import { Package } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  RecordList,
  RecordListItem,
  RecordListMore,
} from "@/components/ui/record-list";
import { Badge } from "@/components/ui/badge";

const PRODUCTS = Array.from({ length: 23 }, (_, i) => ({
  id: `p${i + 1}`,
  name: [
    "Orbit Track 30W",
    "Halo Downlight 12W",
    "Linea Profile 2m",
    "Nova Pendant",
    "Arc Wall Washer",
  ][i % 5]!.concat(i >= 5 ? ` · ${Math.floor(i / 5) + 1}` : ""),
  draft: i % 4 === 1,
  issue: i % 3 === 0 ? "Missing beam angle" : undefined,
}));

/** The affected records in a confirmation: numbered, a muted type icon, name, ↗ link, badge. */
export function recordList(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-md">
        <RecordList aria-label="Affected products">
          {PRODUCTS.slice(0, 4).map((p) => (
            <RecordListItem
              key={p.id}
              icon={<Package />}
              title={p.name}
              href={`#${p.id}`}
              badge={p.draft ? <Badge variant="secondary">Draft</Badge> : null}
              description={p.issue}
            />
          ))}
        </RecordList>
      </div>
    </Wrapper>
  );
}

/** "Show more" appends to the same list, so the numbers continue: 1–10, then 11–20. */
export function recordListShowMore(): ReactNode {
  const [shown, setShown] = useState(10);
  return (
    <Wrapper className="block">
      <div className="mx-auto flex max-h-96 w-full max-w-md flex-col gap-2 overflow-y-auto">
        <RecordList aria-label="Affected products">
          {PRODUCTS.slice(0, shown).map((p) => (
            <RecordListItem
              key={p.id}
              icon={<Package />}
              title={p.name}
              href={`#${p.id}`}
            />
          ))}
        </RecordList>
        <RecordListMore
          remaining={PRODUCTS.length - shown}
          onShowMore={() => setShown((n) => n + 10)}
        />
      </div>
    </Wrapper>
  );
}
