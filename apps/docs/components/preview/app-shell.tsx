"use client";

import { useState, type ReactNode } from "react";
import { Home, Inbox, Settings, BarChart3, Bot } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/app-shell` (dogfoods the registry) → auto-scanned.
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellPage,
  AppShellSidebar,
  AppShellSkeleton,
} from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
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

/*
 * The frame every desktop-rail demo sits in. Upstream's `Sidebar` pins its desktop rail with
 * `position: fixed` and `h-svh`: an application shell, sized to the viewport. A docs frame is not
 * the viewport, so — exactly as `sidebar.tsx`'s previews do — the frame carries `contain: paint`,
 * which makes it the fixed-positioning containing block, and the rail and the main column take the
 * frame's height (`h-full`) instead of the viewport's. Without both, the rail was drawn at the
 * viewport's edge and the frame showed an empty gap where the floating variant's bordered rail
 * belonged. A property of the frame, not of the component: no sidebar part is restyled.
 */
const FRAME = { contain: "paint" } as const;

/**
 * The primary composed mini-shell demo — a fixed, non-fullscreen frame (the docs page frames it,
 * per the preview convention already used by `sidebar.tsx`'s previews) so the whole trio
 * (sidebar + header + scrollable content) is visible without the demo taking over the page.
 */
export function appShellDemo(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block h-104 overflow-hidden p-0" style={FRAME}>
      <AppShell className="h-full min-h-0">
        <AppShellSidebar className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active === item.key}
                      onClick={() => setActive(item.key)}
                      badge={item.badge}
                      badgeLabel={
                        item.badge ? `${item.badge} unread` : undefined
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
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
        <div className="flex h-full min-w-0 flex-1 flex-col">
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
          <AppShellContent landmark="region" aria-label="Page content">
            <div className="grid grid-cols-1 gap-4 p-4 @sm/app-shell-content:grid-cols-2 @lg/app-shell-content:grid-cols-4">
              {STAT_CARDS.map((label) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className="font-mono text-xl text-foreground">—</p>
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
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0" style={FRAME}>
      <AppShell className="h-full min-h-0">
        <AppShellSidebar variant="inset" className="h-full">
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
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <AppShellHeader>
            <span className="truncate text-sm font-medium font-medium text-foreground">
              Dashboard
            </span>
          </AppShellHeader>
          <AppShellContent
            variant="inset"
            landmark="region"
            aria-label="Page content"
          >
            <p className="p-4 text-sm text-muted-foreground">
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
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0" style={FRAME}>
      <AppShell className="h-full min-h-0">
        <AppShellSidebar variant="floating" className="h-full">
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
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <AppShellHeader>
            <span className="truncate text-sm font-medium font-medium text-foreground">
              Dashboard
            </span>
          </AppShellHeader>
          <AppShellContent landmark="region" aria-label="Page content">
            <p className="p-4 text-sm text-muted-foreground">
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

/**
 * Responsive navigation. Upstream's `SidebarProvider` reads one fixed breakpoint through
 * `useIsMobile` (768px, the Tailwind `md` boundary) and takes no override, so — since Batch 5 of
 * the shadcn reset put Sidebar back on upstream's file — this demo shows the real viewport
 * behaviour rather than forcing it: narrow the BROWSER below 768px and the desktop rail becomes
 * the modal Sheet you open from the header trigger. The docs width toggle constrains a container,
 * not the viewport, so it does not change this demo.
 */
export function appShellMobile(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block h-104 overflow-hidden p-0" style={FRAME}>
      <AppShell className="h-full min-h-0">
        <AppShellSidebar className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {NAV_ITEMS.slice(0, 3).map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active === item.key}
                      onClick={() => setActive(item.key)}
                      badge={item.badge}
                      badgeLabel={
                        item.badge ? `${item.badge} unread` : undefined
                      }
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
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <AppShellHeader>
            <span className="truncate text-sm font-medium font-medium text-foreground">
              Mobile dashboard
            </span>
          </AppShellHeader>
          <AppShellContent landmark="region" aria-label="Page content">
            <p className="p-4 text-sm text-muted-foreground">
              Use the menu trigger to open navigation over this content.
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

/**
 * DS-19: `AppShellPage` is the one page container inside the content region — the page gutters,
 * a `gap-6` rhythm between the header and each section, and the `size` measure (`narrow` here,
 * for a settings form).
 */
export function appShellPage(): ReactNode {
  return (
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0">
      <AppShellContent landmark="region" aria-label="Page content">
        <AppShellPage size="narrow">
          <PageHeader
            title="Profile"
            description="How your name and photo appear to your team."
          />
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Display name</h2>
            <p className="text-sm text-muted-foreground">
              A narrow page caps its measure at 768px and keeps the same gutters
              as every other page.
            </p>
          </section>
        </AppShellPage>
      </AppShellContent>
    </Wrapper>
  );
}
