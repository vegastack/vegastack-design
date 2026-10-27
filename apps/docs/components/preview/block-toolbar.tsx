"use client";

import type { ReactNode } from "react";
import {
  Captions,
  Copy,
  Download,
  Link,
  Maximize2,
  Replace,
  ScanText,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/block-toolbar` (dogfoods the registry) → auto-scanned.
import {
  BlockToolbar,
  BlockToolbarButton,
  BlockToolbarMenu,
} from "@/components/ui/block-toolbar";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/**
 * BlockToolbar — a block's controls in its top-right corner: four 28px buttons at most, the rest
 * in ⋯. Hover the picture.
 */
export function blockToolbar(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <figure className="group/block relative m-0 grid h-48 place-items-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
        An image block
        <BlockToolbar aria-label="Image actions" reveal="hover">
          <BlockToolbarButton label="Replace">
            <Replace />
          </BlockToolbarButton>
          <BlockToolbarButton label="Caption">
            <Captions />
          </BlockToolbarButton>
          <BlockToolbarButton label="Alt text">
            <ScanText />
          </BlockToolbarButton>
          <BlockToolbarButton label="Open">
            <Maximize2 />
          </BlockToolbarButton>
          <BlockToolbarMenu label="More image actions">
            <DropdownMenuItem>
              <Download />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link />
              Copy link
            </DropdownMenuItem>
          </BlockToolbarMenu>
        </BlockToolbar>
      </figure>
    </Wrapper>
  );
}

/** Always shown: a code block's copy, as `CodeBlock` draws it. */
export function blockToolbarAlways(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <figure className="group/block relative m-0 rounded-lg bg-muted p-3 pt-10 font-mono text-xs">
        <BlockToolbar aria-label="Code block actions">
          <BlockToolbarButton label="Copy code">
            <Copy />
          </BlockToolbarButton>
        </BlockToolbar>
        const answer = 42;
      </figure>
    </Wrapper>
  );
}
