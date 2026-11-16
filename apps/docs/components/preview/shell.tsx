"use client";

import type { ReactNode } from "react";
import { MessageSquare, Plus, Share2 } from "lucide-react";
import { Wrapper } from "./wrapper";
import Shell01Page from "../../../../packages/ui/registry/blocks/shell-01/page";
// Copied INTO apps/docs via `shadcn add @vegastack/shell` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  ShellPanelToggle,
  ShellTopBar,
  ShellTopBarActions,
  ShellTopBarLabel,
  ShellTopBarPrimary,
  ShellTopBarTitle,
  ShellTopBarTools,
} from "@/components/ui/shell";

/** The whole frame, in a preview box: rail, column, top bar, page and panel. */
export function shell(): ReactNode {
  return (
    <Wrapper
      className="block h-160 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <Shell01Page fill="parent" />
    </Wrapper>
  );
}

function Bar() {
  return (
    <ShellTopBar className="rounded-block border border-border">
      <ShellPanelToggle pressed={false} />
      <ShellTopBarPrimary>
        <Button size="sm">
          <Plus />
          <ShellTopBarLabel>New task</ShellTopBarLabel>
        </Button>
      </ShellTopBarPrimary>
      <ShellTopBarActions>
        <Button variant="outline" size="sm">
          <Share2 />
          <ShellTopBarLabel>Share</ShellTopBarLabel>
        </Button>
      </ShellTopBarActions>
      <ShellTopBarTools>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Comments"
          data-shell-fold
        >
          <MessageSquare />
        </Button>
      </ShellTopBarTools>
      <ShellTopBarTitle parents={<a href="#library">Library</a>}>
        Q3 pricing review
      </ShellTopBarTitle>
    </ShellTopBar>
  );
}

/** The top bar's fixed order, written in reverse on purpose, at a wide and a narrow width. */
export function shellTopBar(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Bar />
      <div className="max-w-sm">
        <Bar />
      </div>
    </Wrapper>
  );
}
