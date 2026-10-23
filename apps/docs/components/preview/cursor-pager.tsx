"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
import { CursorPager } from "@/components/ui/cursor-pager";

export function cursorPager(): ReactNode {
  // The host keeps the cursor history; here a page index stands in for it.
  const [page, setPage] = useState(0);
  const pages = 4;
  return (
    <Wrapper>
      <CursorPager
        className="w-full max-w-md"
        label={`Rows ${page * 100 + 1}–${page * 100 + 100}`}
        hasPrevious={page > 0}
        hasNext={page < pages - 1}
        onPrevious={() => setPage((current) => current - 1)}
        onNext={() => setPage((current) => current + 1)}
      />
    </Wrapper>
  );
}

export function cursorPagerStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <CursorPager
        className="w-full max-w-md"
        label="Rows 1–100"
        hasPrevious={false}
        hasNext
        onPrevious={() => {}}
        onNext={() => {}}
      />
      <CursorPager
        className="w-full max-w-md"
        label="Loading…"
        hasPrevious
        hasNext
        loading
        onPrevious={() => {}}
        onNext={() => {}}
      />
    </Wrapper>
  );
}
