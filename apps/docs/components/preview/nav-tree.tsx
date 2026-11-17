"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  Library,
  ListChecks,
  MoreHorizontal,
  Plus,
  Star,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/nav-tree` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { NavTree, NavTreeItem, NavTreeSection } from "@/components/ui/nav-tree";

function HomeColumn({ size }: { size?: "default" | "touch" }) {
  return (
    <nav
      aria-label={size === "touch" ? "Home (touch)" : "Home"}
      className="w-60 rounded-card border border-border bg-sidebar px-2 py-2 text-sidebar-foreground"
    >
      <NavTree size={size}>
        <NavTreeSection>
          <NavTreeItem
            label="Overview"
            icon={<LayoutDashboard />}
            href="#overview"
          />
        </NavTreeSection>
        <NavTreeSection label="Favourites">
          <NavTreeItem label="Launch plan" icon={<Star />} href="#launch" />
        </NavTreeSection>
        <NavTreeSection
          label="Work"
          action={
            <Button variant="ghost" size="icon-xs" aria-label="New view">
              <Plus />
            </Button>
          }
        >
          <NavTreeItem
            label="Tasks"
            icon={<ListChecks />}
            count={17}
            href="#tasks"
            defaultOpen
            action={
              <Button variant="ghost" size="icon-xs" aria-label="Tasks menu">
                <MoreHorizontal />
              </Button>
            }
          >
            <NavTreeItem label="My tasks" count={12} href="#mine" active />
            <NavTreeItem label="Created by me" count={5} href="#created" />
            <NavTreeItem label="Overdue" count={3} href="#overdue" />
          </NavTreeItem>
          <NavTreeItem
            label="Meetings"
            icon={<CalendarDays />}
            href="#meetings"
          >
            <NavTreeItem label="Upcoming" href="#upcoming" />
            <NavTreeItem label="Recordings" href="#recordings" />
          </NavTreeItem>
          <NavTreeItem label="Library" icon={<Library />} href="#library" />
        </NavTreeSection>
        <NavTreeSection label="Recent">
          <NavTreeItem
            label="Pricing review"
            icon={<Clock />}
            href="#pricing"
          />
        </NavTreeSection>
      </NavTree>
    </nav>
  );
}

/** Home's column: sections, a parent threaded to its views, counts and the current view. */
export function navTree(): ReactNode {
  return (
    <Wrapper className="items-start">
      <HomeColumn />
    </Wrapper>
  );
}

/** The touch size: 44px rows for a phone sheet. */
export function navTreeTouch(): ReactNode {
  return (
    <Wrapper className="items-start">
      <HomeColumn size="touch" />
    </Wrapper>
  );
}
