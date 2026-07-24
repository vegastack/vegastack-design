"use client";

import * as React from "react";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/pagination` (dogfoods the registry) → auto-scanned.
import {
  PaginationPager,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function pagination(): ReactNode {
  return (
    <Wrapper>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">10</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Wrapper>
  );
}

export function paginationRouting(): ReactNode {
  // `render` swaps the underlying element while keeping pagination styling and
  // semantics. In an app you would pass your router's link (e.g. `<NextLink />`);
  // here a plain `<a>` stands in to show the composition renders unchanged.
  return (
    <Wrapper>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious render={<a href="#prev" />} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink render={<a href="#1" />}>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink render={<a href="#2" />} isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink render={<a href="#3" />}>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext render={<a href="#next" />} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Wrapper>
  );
}

export function paginationSizes(): ReactNode {
  return (
    <Wrapper className="flex-col gap-4">
      {(["sm", "default", "lg", "icon"] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          <span className="text-muted-foreground w-14 text-right font-mono text-sm">
            {size}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink href="#" size={size}>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" size={size} isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" size={size}>
                  3
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ))}
    </Wrapper>
  );
}

export function paginationFirstPage(): ReactNode {
  return (
    <Wrapper>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {/* `aria-disabled="true"` is enough — PaginationLink enforces the tab-order
                removal and click-swallowing itself now, no manual `tabIndex={-1}` needed. */}
            <PaginationPrevious aria-disabled="true" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Wrapper>
  );
}

export function paginationLastPage(): ReactNode {
  return (
    <Wrapper>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">8</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">9</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              10
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext aria-disabled="true" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Wrapper>
  );
}
export function paginationPager(): ReactNode {
  return <PaginationPagerExample />;
}

function PaginationPagerExample() {
  const [index, setIndex] = React.useState(3);
  return (
    <Wrapper>
      <PaginationPager
        index={index}
        total={10}
        context="in All Companies"
        onIndexChange={setIndex}
      />
    </Wrapper>
  );
}
