"use client";

import * as React from "react";
import {
  BellIcon,
  MessageSquareIcon,
  PanelRightIcon,
  StarIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/tool-group` (dogfoods the registry) → auto-scanned.
import {
  ToolGroup,
  ToolGroupItem,
  ToolGroupMore,
} from "@/components/ui/tool-group";
import { AvatarGroup, Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function PageTools() {
  const [watching, setWatching] = React.useState(true);
  const [starred, setStarred] = React.useState(false);
  return (
    <ToolGroup aria-label="Page tools">
      <ToolGroupItem
        label={watching ? "Stop watching" : "Watch"}
        aria-pressed={watching}
        onClick={() => setWatching((on) => !on)}
      >
        <BellIcon />
      </ToolGroupItem>
      <ToolGroupItem
        label={starred ? "Remove star" : "Star"}
        aria-pressed={starred}
        onClick={() => setStarred((on) => !on)}
      >
        <StarIcon className={starred ? "fill-current" : undefined} />
      </ToolGroupItem>
      <ToolGroupItem label="Comments" count={9}>
        <MessageSquareIcon />
      </ToolGroupItem>
      <DropdownMenu>
        <DropdownMenuTrigger render={<ToolGroupMore />} />
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Copy link</DropdownMenuItem>
          <DropdownMenuItem>Version history</DropdownMenuItem>
          <DropdownMenuItem>Move to…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolGroup>
  );
}

export function toolGroup(): React.ReactNode {
  return (
    <Wrapper>
      <PageTools />
    </Wrapper>
  );
}

/** The proposed top bar's right end: presence · tools · Share · panel toggle (shell layout L9). */
export function toolGroupTopBar(): React.ReactNode {
  return (
    <Wrapper className="justify-end bg-background">
      <div className="flex h-12 w-full items-center justify-end gap-2 border-b border-border px-3">
        <AvatarGroup max={3} total={5} className="-space-x-1.5">
          <Avatar size="sm" data-here="">
            <AvatarFallback hue="orange">MA</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback hue="blue">MK</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback hue="green">AC</AvatarFallback>
          </Avatar>
        </AvatarGroup>
        <PageTools />
        <Button variant="outline" size="sm">
          Share
        </Button>
        <ToolGroup aria-label="Panel">
          <ToolGroupItem label="Show panel">
            <PanelRightIcon />
          </ToolGroupItem>
        </ToolGroup>
      </div>
    </Wrapper>
  );
}
