"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/skeleton` (dogfoods the registry).
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function skeleton(): ReactNode {
  return (
    <Wrapper>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </Wrapper>
  );
}

export function skeletonAvatar(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-fit items-center gap-4">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    </Wrapper>
  );
}

export function skeletonCard(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-xs">
        <CardHeader>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-video w-full" />
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export function skeletonText(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Wrapper>
  );
}

export function skeletonForm(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-xs flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    </Wrapper>
  );
}

export function skeletonTable(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="flex gap-4" key={index}>
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function skeletonRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex items-center justify-center gap-4" dir="ltr">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4" dir="rtl">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </Wrapper>
  );
}
