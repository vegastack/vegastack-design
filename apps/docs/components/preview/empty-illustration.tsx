"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  EMPTY_ILLUSTRATIONS,
  EmptyIllustration,
} from "@/components/ui/empty-illustration";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export function emptyIllustration(): ReactNode {
  return (
    <Wrapper>
      <Empty className="border">
        <EmptyMedia>
          <EmptyIllustration name="tasks" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No tasks yet</EmptyTitle>
          <EmptyDescription>
            Tasks you create or are assigned appear here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">New task</Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyIllustrationSet(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {EMPTY_ILLUSTRATIONS.map((name) => (
        <figure key={name} className="flex flex-col items-center gap-2">
          <EmptyIllustration name={name} />
          <figcaption className="text-xs text-muted-foreground">
            {name}
          </figcaption>
        </figure>
      ))}
    </Wrapper>
  );
}
