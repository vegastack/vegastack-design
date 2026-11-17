"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  Hexagon,
  Home,
  Inbox,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/rail` (dogfoods the registry) → auto-scanned.
import { Rail, RailBottom, RailItem } from "@/components/ui/rail";

/** The seven modules, with counts on Inbox (past 99) and Agents, and Settings at the foot. */
export function rail(): ReactNode {
  return (
    <Wrapper className="p-0">
      <div className="flex h-120 w-16 border-e border-sidebar-border bg-sidebar text-sidebar-foreground">
        <Rail>
          <RailItem icon={<Home />} label="Home" href="#home" active />
          <RailItem icon={<Inbox />} label="Inbox" href="#inbox" badge={120} />
          <RailItem icon={<Hexagon />} label="Spaces" href="#spaces" />
          <RailItem
            icon={<Sparkles />}
            label="Agents"
            href="#agents"
            badge={7}
          />
          <RailItem icon={<Boxes />} label="Products" href="#products" />
          <RailItem
            icon={<BarChart3 />}
            label="Sales"
            href="#sales"
            dot="new leads"
          />
          <RailBottom>
            <RailItem icon={<Settings2 />} label="Settings" href="#settings" />
          </RailBottom>
        </Rail>
      </div>
    </Wrapper>
  );
}
