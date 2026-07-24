"use client";

import { useState, type ReactNode } from "react";
import { Home, Inbox, Settings, BarChart3, Bot } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/app-shell` (dogfoods the registry) → auto-scanned.
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
  AppShellSkeleton,
} from "@/components/ui/app-shell";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, badge: undefined },
  { key: "inbox", label: "Inbox", icon: Inbox, badge: "4" },
  { key: "analytics", label: "Analytics", icon: BarChart3, badge: undefined },
  { key: "agents", label: "Agents", icon: Bot, badge: undefined },
] as const;

const STAT_CARDS = [
  "Active agents",
  "Tasks today",
  "API calls (24h)",
  "Avg. response",
] as const;

/**
 * The primary composed mini-shell demo — a fixed, non-fullscreen frame (the docs page frames it,
 * per the preview convention already used by `sidebar.tsx`'s previews) so the whole trio
 * (sidebar + header + scrollable content) is visible without the demo taking over the page.
 */
export function appShellDemo(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block h-104 overflow-hidden p-0">
      <AppShell>
        <AppShellSidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active === item.key}
                      onClick={() => setActive(item.key)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </AppShellSidebar>
        <div className="flex h-svh min-w-0 flex-1 flex-col">
          <AppShellHeader actions={<Button size="sm">New agent</Button>}>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </AppShellHeader>
          <AppShellContent>
            <div className="grid grid-cols-1 gap-4 p-4 @sm/app-shell-content:grid-cols-2 @lg/app-shell-content:grid-cols-4">
              {STAT_CARDS.map((label) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="text-label-sm text-muted-foreground">{label}</p>
                  <p className="font-mono text-2xl text-foreground">—</p>
                </div>
              ))}
            </div>
          </AppShellContent>
        </div>
      </AppShell>
    </Wrapper>
  );
}

/** `AppShellSidebar variant="inset"` paired with `AppShellContent variant="inset"` — the rail stays flush, the content region becomes the rounded/bordered/shadowed panel. */
export function appShellInset(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0">
      <AppShell>
        <AppShellSidebar variant="inset">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {NAV_ITEMS.slice(0, 3).map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active === item.key}
                      onClick={() => setActive(item.key)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </AppShellSidebar>
        <div className="flex h-svh min-w-0 flex-1 flex-col">
          <AppShellHeader>
            <span className="truncate text-label font-medium text-foreground">
              Dashboard
            </span>
          </AppShellHeader>
          <AppShellContent variant="inset">
            <p className="p-4 text-base text-muted-foreground">
              The content region is the rounded panel — pass the same{" "}
              <code>variant</code> to both <code>AppShellSidebar</code> and{" "}
              <code>AppShellContent</code>.
            </p>
          </AppShellContent>
        </div>
      </AppShell>
    </Wrapper>
  );
}

/** `AppShellSidebar variant="floating"` — a detached, bordered, shadowed rail with margin on every edge. */
export function appShellFloating(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0">
      <AppShell>
        <AppShellSidebar variant="floating">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {NAV_ITEMS.slice(0, 3).map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active === item.key}
                      onClick={() => setActive(item.key)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </AppShellSidebar>
        <div className="flex h-svh min-w-0 flex-1 flex-col">
          <AppShellHeader>
            <span className="truncate text-label font-medium text-foreground">
              Dashboard
            </span>
          </AppShellHeader>
          <AppShellContent>
            <p className="p-4 text-base text-muted-foreground">
              <code>floating</code> styles the rail itself — the content region
              needs no matching
              <code> variant</code>.
            </p>
          </AppShellContent>
        </div>
      </AppShell>
    </Wrapper>
  );
}

/** `AppShellSkeleton` — drop this straight into a Next.js `loading.tsx` while the real shell's data loads. */
export function appShellSkeletonDemo(): ReactNode {
  return (
    <Wrapper className="block h-88 overflow-hidden p-0">
      <AppShellSkeleton navItemCount={5} statCardCount={4} className="h-full" />
    </Wrapper>
  );
}
