"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  CheckSquare,
  Home,
  Inbox,
  LayoutGrid,
  Library,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/sidebar-menu-flyout` (dogfoods the registry) → auto-scanned.
import { SidebarMenuFlyout } from "@/components/ui/sidebar-menu-flyout";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const SPACES = ["General", "Product", "Sales"];

/**
 * The collapsed icon rail reaches Spaces through a flyout; the expanded sidebar keeps its inline
 * Spaces group (`railOnly`). Toggle the rail with the header button to see both.
 */
export function sidebarMenuFlyout(): ReactNode {
  const [space, setSpace] = React.useState("General");
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider className="h-full min-h-0" defaultOpen={false}>
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Search">
                    <Search />
                    <span>Search</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Inbox"
                    badge={15}
                    badgeLabel="15 unread"
                  >
                    <Inbox />
                    <span>Inbox</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Home">
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Work</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Meetings">
                    <Users />
                    <span>Meetings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Tasks"
                    badge={2}
                    badgeLabel="2 due"
                  >
                    <CheckSquare />
                    <span>Tasks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Library">
                    <Library />
                    <span>Library</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuFlyout
                  label="Spaces"
                  icon={<LayoutGrid />}
                  railOnly
                  isActive
                >
                  {SPACES.map((name) => (
                    <DropdownMenuItem key={name} onClick={() => setSpace(name)}>
                      {name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus />
                    New space
                  </DropdownMenuItem>
                </SidebarMenuFlyout>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Spaces</SidebarGroupLabel>
              <SidebarMenu>
                {SPACES.map((name) => (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton
                      isActive={space === name}
                      onClick={() => setSpace(name)}
                    >
                      <LayoutGrid />
                      <span>{name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b border-border px-3">
            <SidebarTrigger />
            <span className="text-sm font-medium">{space}</span>
          </header>
          <p className="p-4 text-sm text-muted-foreground">
            Hover Spaces in the rail, or focus it and press Enter.
          </p>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}
