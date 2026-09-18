"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type PaginationPlaygroundKey = "size";

/**
 * `size` is forwarded to the `Button` under `PaginationLink`, so the options are Button's own
 * scale. `icon` (a square) is the default for a numbered page link; the others widen the target
 * with horizontal padding. Upstream exports no props type, so the union is read off the component.
 */
type PaginationLinkSize = NonNullable<
  ComponentProps<typeof PaginationLink>["size"]
>;

const SIZE_OPTIONS = [
  { value: "icon", label: "Icon (square)" },
  { value: "icon-sm", label: "Icon, small" },
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
              size={state.size as PaginationLinkSize}
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
 * `PaginationPlayground` — interactive props playground for `Pagination`: the `PaginationLink`
 * size across a 5-page bar with previous/next, backed by the generic `PropsPlayground`.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/pagination.mdx`.
 */
export function PaginationPlayground() {
  return <PropsPlayground {...paginationPlaygroundConfig} />;
}
