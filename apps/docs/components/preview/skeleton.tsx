"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/skeleton` (dogfoods the registry) → auto-scanned.
import { Skeleton, SkeletonReveal } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function skeleton(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-sm">
        <Skeleton count={3} />
      </div>
    </Wrapper>
  );
}

export function skeletonShapes(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Skeleton shape="line" />
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" />
          <Skeleton shape="line" className="flex-1" />
        </div>
        <Skeleton shape="rect" />
        <Skeleton shape="card" />
      </div>
    </Wrapper>
  );
}

export function skeletonCount(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-sm">
        <Skeleton count={4} />
      </div>
    </Wrapper>
  );
}

export function skeletonShapeCount(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <div className="grid w-full max-w-2xl grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">line</p>
          <Skeleton shape="line" count={3} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">circle</p>
          <Skeleton shape="circle" count={3} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">rect</p>
          <Skeleton shape="rect" count={3} />
        </div>
      </div>
    </Wrapper>
  );
}

export function skeletonReveal(): ReactNode {
  const [loading, setLoading] = useState(true);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="w-full max-w-sm rounded-lg border border-border p-4">
        <SkeletonReveal
          loading={loading}
          skeleton={
            <div className="flex items-center gap-3">
              <Skeleton shape="circle" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="w-1/2" />
                <Skeleton className="w-3/4" />
              </div>
            </div>
          }
        >
          <div className="flex items-center gap-3">
            <Avatar fallback="AL" />
            <div className="flex min-w-0 flex-col">
              <span className="font-medium">Ada Lovelace</span>
              <span className="text-sm text-muted-foreground">
                Analytical Engine, v2
              </span>
            </div>
          </div>
        </SkeletonReveal>
      </div>
      <Button variant="outline" size="sm" onClick={() => setLoading((v) => !v)}>
        {loading ? "Finish loading" : "Reload"}
      </Button>
    </Wrapper>
  );
}

export function skeletonCard(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-sm rounded-lg border border-border p-4">
        {/* Header: avatar + title/subtitle */}
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="w-1/2" />
            <Skeleton className="w-1/3" />
          </div>
        </div>
        {/* Media block */}
        <Skeleton shape="rect" className="mt-4" />
        {/* Body copy */}
        <div className="mt-4">
          <Skeleton count={3} />
        </div>
        {/* Footer actions */}
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-(--size-md) w-20 rounded-md" />
          <Skeleton className="h-(--size-md) w-20 rounded-md" />
        </div>
      </div>
    </Wrapper>
  );
}
