"use client";

import type { ReactNode } from "react";
import { Bell, MoreHorizontal, Share2, Star } from "lucide-react";
import { Wrapper } from "./wrapper";
import Shell01Page from "../../../../packages/ui/registry/blocks/shell-01/page";
// Copied INTO apps/docs via `shadcn add @vegastack/shell` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { MembersStack } from "@/components/ui/members-stack";
import {
  ShellTopBar,
  ShellTopBarFavorite,
  ShellTopBarLabel,
  ShellTopBarMore,
  ShellTopBarMembers,
  ShellTopBarShare,
  ShellTopBarTitle,
  ShellTopBarWatch,
} from "@/components/ui/shell";

/** The whole frame, in a preview box: global bar, rail, column, top bar and page; a task opens in a peek. */
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

/** The same frame at a phone's 390px: the places button, Help and the avatar in the top bar. */
export function shellPhone(): ReactNode {
  return (
    <Wrapper className="justify-center p-0">
      <div
        className="h-160 w-97.5 overflow-hidden border-x border-border"
        style={{ contain: "paint" }}
      >
        <Shell01Page fill="parent" />
      </div>
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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Favourite"
          aria-pressed={false}
        >
          <Star />
        </Button>
      </ShellTopBarFavorite>
      <ShellTopBarWatch>
        <Button variant="ghost" size="icon-sm" aria-label="Watch" aria-pressed>
          <Bell />
        </Button>
      </ShellTopBarWatch>
      <ShellTopBarShare>
        <Button variant="ghost" size="sm">
          <Share2 />
          <ShellTopBarLabel>Share</ShellTopBarLabel>
        </Button>
      </ShellTopBarShare>
      <ShellTopBarMembers>
        <MembersStack
          total={23}
          people={[
            { name: "Asha Chen", hue: "blue", active: true },
            { name: "Ravi Shah", hue: "green" },
            { name: "Kavya Iyer", hue: "orange" },
          ]}
        />
      </ShellTopBarMembers>
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
