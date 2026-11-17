"use client";

import type { ReactNode } from "react";
import {
  MessageSquare,
  MoreHorizontal,
  Plus,
  Share2,
  Star,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import Shell01Page from "../../../../packages/ui/registry/blocks/shell-01/page";
// Copied INTO apps/docs via `shadcn add @vegastack/shell` (dogfoods the registry) → auto-scanned.
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ShellTopBar,
  ShellTopBarFavorite,
  ShellTopBarLabel,
  ShellTopBarMore,
  ShellTopBarPresence,
  ShellTopBarPrimary,
  ShellTopBarShare,
  ShellTopBarTitle,
  ShellTopBarTools,
} from "@/components/ui/shell";

/** The whole frame, in a preview box: global bar, rail, column, top bar, page and panel. */
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
      <ShellTopBarMore>
        <Button variant="ghost" size="icon-sm" aria-label="More">
          <MoreHorizontal />
        </Button>
      </ShellTopBarMore>
      <ShellTopBarFavorite>
        <Button variant="ghost" size="icon-sm" aria-label="Favourite">
          <Star />
        </Button>
      </ShellTopBarFavorite>
      <ShellTopBarShare>
        <Button variant="outline" size="sm">
          <Share2 />
          <ShellTopBarLabel>Share</ShellTopBarLabel>
        </Button>
      </ShellTopBarShare>
      <ShellTopBarPrimary>
        <Button size="sm">
          <Plus />
          <ShellTopBarLabel>New task</ShellTopBarLabel>
        </Button>
      </ShellTopBarPrimary>
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
      <ShellTopBarPresence>
        <AvatarGroup>
          <Avatar size="sm">
            <AvatarFallback aria-label="Asha Chen">AC</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback aria-label="Ravi Shah">RS</AvatarFallback>
          </Avatar>
        </AvatarGroup>
      </ShellTopBarPresence>
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
