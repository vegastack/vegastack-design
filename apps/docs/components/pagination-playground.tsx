"use client";

import type { ReactNode } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  type PaginationLinkProps,
} from "@/components/ui/pagination";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type PaginationPlaygroundKey = "size";

// `icon` (a square) is the default for numbered page links; `sm`/`default`/`lg`
// widen the hit target with horizontal padding on the shared control scale.
const SIZE_OPTIONS = [
  { value: "icon", label: "Icon (square)" },
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
] as const;

const PAGES = [1, 2, 3, 4, 5] as const;

const paginationPlaygroundConfig: PlaygroundConfig<PaginationPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "icon",
    },
  ],
  render: (state): ReactNode => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        {PAGES.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              size={state.size as PaginationLinkProps["size"]}
              isActive={page === 2}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  toCode: (state) => {
    const sizeProp = state.size !== "icon" ? ` size="${state.size}"` : "";
    return [
      "<Pagination>",
      "  <PaginationContent>",
      "    <PaginationItem>",
      '      <PaginationPrevious href="?page=1" />',
      "    </PaginationItem>",
      "    <PaginationItem>",
      `      <PaginationLink href="?page=1"${sizeProp}>1</PaginationLink>`,
      "    </PaginationItem>",
      "    <PaginationItem>",
      `      <PaginationLink href="?page=2"${sizeProp} isActive>2</PaginationLink>`,
      "    </PaginationItem>",
      "    <PaginationItem>",
      `      <PaginationLink href="?page=3"${sizeProp}>3</PaginationLink>`,
      "    </PaginationItem>",
      "    <PaginationItem>",
      '      <PaginationNext href="?page=3" />',
      "    </PaginationItem>",
      "  </PaginationContent>",
      "</Pagination>",
    ].join("\n");
  },
};

/**
 * `PaginationPlayground` — interactive props playground for `Pagination` (`PaginationLink`
 * size across a 5-page bar with previous/next), backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/pagination.mdx`.
 */
export function PaginationPlayground() {
  return <PropsPlayground {...paginationPlaygroundConfig} />;
}
