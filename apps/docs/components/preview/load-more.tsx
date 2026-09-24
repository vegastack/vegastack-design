"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/load-more` (dogfoods the registry) → auto-scanned.
import { LoadMore } from "@/components/ui/load-more";

const TASKS = Array.from({ length: 9 }, (_, index) => `Task ${index + 1}`);

export function loadMore(): ReactNode {
  const [count, setCount] = React.useState(3);
  const [loading, setLoading] = React.useState(false);
  const [failedOnce, setFailedOnce] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  return (
    <Wrapper className="flex-col items-stretch">
      <ul className="flex flex-col gap-1 text-sm">
        {TASKS.slice(0, count).map((task) => (
          <li key={task} className="rounded-md border border-border px-3 py-2">
            {task}
          </li>
        ))}
      </ul>
      <LoadMore
        hasMore={count < TASKS.length}
        loading={loading}
        error={error}
        endLabel="End of list"
        onLoadMore={() => {
          setLoading(true);
          setError(undefined);
          setTimeout(() => {
            setLoading(false);
            // The second batch fails once, to show the retry.
            if (count === 6 && !failedOnce) {
              setFailedOnce(true);
              setError("Couldn't load more tasks.");
              return;
            }
            setCount((n) => n + 3);
          }, 600);
        }}
      />
    </Wrapper>
  );
}

export function loadMoreStates(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <LoadMore hasMore onLoadMore={() => {}} />
      <LoadMore hasMore loading onLoadMore={() => {}} />
      <LoadMore
        hasMore
        error="Couldn't load more tasks."
        onLoadMore={() => {}}
      />
      <LoadMore hasMore={false} endLabel="End of list" onLoadMore={() => {}} />
    </Wrapper>
  );
}
