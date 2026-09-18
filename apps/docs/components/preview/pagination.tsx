"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/pagination` (dogfoods the registry) → auto-scanned.
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DirectionProvider } from "@/components/ui/direction";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/*
 * Upstream's own examples. `PaginationLink` builds its own `<a>` inside a `Button` with
 * `nativeButton={false}`, so anchor props — `href`, `onClick` — go straight on `PaginationLink`.
 * Every href below is `#`: these fixtures are mounted by the geometry lane and must not navigate.
 */

/** Upstream's `PaginationDemo`: previous, three numbered pages, an ellipsis, next. */
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
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Wrapper>
  );
}

/** The composition tree, rendered: one `PaginationItem` per control. */
export function paginationComposition(): ReactNode {
  return (
    <Wrapper>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
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

/** Upstream's `PaginationSimple`: page numbers only. */
export function paginationSimple(): ReactNode {
  return (
    <Wrapper>
      <Pagination>
        <PaginationContent>
          {[1, 2, 3, 4, 5].map((page) => (
            <PaginationItem key={page}>
              <PaginationLink href="#" isActive={page === 2}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationContent>
      </Pagination>
    </Wrapper>
  );
}

/**
 * Upstream's `PaginationIconsOnly`: the previous/next pair beside a rows-per-page select, which is
 * the data-table footer shape. The labels collapse below `sm`, leaving the two chevrons.
 */
export function paginationIconsOnly(): ReactNode {
  return (
    <Wrapper className="min-h-40 items-start">
      <div className="flex w-full items-center justify-between gap-4">
        <Field orientation="horizontal" className="w-fit">
          <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
          <Select defaultValue="25">
            <SelectTrigger className="w-20" id="select-rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Wrapper>
  );
}

/**
 * Upstream's `Next.js` section. `PaginationLink` renders the `<a>` itself and spreads anchor props
 * onto it, so a Next app passes `next/link`'s props the same way — `href`, `onClick`, `scroll`,
 * `prefetch`. This docs app has no router, so the anchor below is the plain element.
 */
export function paginationNextJs(): ReactNode {
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
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Wrapper>
  );
}

/** Eastern Arabic numerals, so the RTL fixture reads as a localised bar rather than a mirrored one. */
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toArabicNumerals = (value: number) =>
  String(value)
    .split("")
    .map((digit) => ARABIC_DIGITS[Number(digit)])
    .join("");

/**
 * Upstream's `PaginationRtl`. Upstream drives the strings from its `language-selector` demo hook;
 * here they are inline and the direction comes from `DirectionProvider`. `text` on
 * `PaginationPrevious`/`PaginationNext` is what makes the labels translatable, and the chevrons
 * carry `rtl:rotate-180` so they point the way the text reads.
 */
export function paginationRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper dir="rtl">
        <Pagination dir="rtl">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" text="السابق" />
            </PaginationItem>
            {[1, 2, 3].map((page) => (
              <PaginationItem key={page}>
                <PaginationLink href="#" isActive={page === 2}>
                  {toArabicNumerals(page)}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" text="التالي" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Wrapper>
    </DirectionProvider>
  );
}
