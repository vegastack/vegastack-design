"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  CheckSquare,
  Home,
  Inbox,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  BarChart3,
  Bot,
  Bell,
  Link2,
  Share2,
  Trash2,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/app-shell` (dogfoods the registry) → auto-scanned.
import {
  AppShell,
  AppShellContent,
  AppShellFold,
  AppShellHeader,
  AppShellHeaderActions,
  AppShellHeaderMobileAction,
  AppShellPage,
  AppShellProgress,
  AppShellSection,
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
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarMenuFlyout } from "@/components/ui/sidebar-menu-flyout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <AppShellPage size="prose">
          <PageHeader
            title="Profile"
            description="How your name and photo appear to your team."
          />
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Display name</h2>
            <p className="text-sm text-muted-foreground">
              A prose page holds 720px of content and keeps the same page gutter
              as every other page.
            </p>
          </section>
        </AppShellPage>
      </AppShellContent>
    </Wrapper>
  );
}

/**
 * A page at the default width whose settings column is `prose` (720px), aligned to the page's
 * start under the 1280px header and tabs — no `max-w-*` of its own.
 */
export function appShellSectionMeasure(): ReactNode {
  return (
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0">
      <AppShellContent landmark="region" aria-label="Page content">
        <AppShellPage>
          <PageHeader title="Product" description="A space's settings tab." />
          <AppShellSection measure="prose">
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-medium">Name</h2>
              <p className="text-sm text-muted-foreground">
                The section caps at 720px and starts where the header starts.
              </p>
            </section>
          </AppShellSection>
        </AppShellPage>
      </AppShellContent>
    </Wrapper>
  );
}

/**
 * `align="center"`: the same 720px column centred in the page under the full-width header, like a
 * settings page (`AppShellPage size="prose"`).
 */
export function appShellSectionCentered(): ReactNode {
  return (
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0">
      <AppShellContent landmark="region" aria-label="Page content">
        <AppShellPage>
          <PageHeader title="Product" description="A space's settings tab." />
          <AppShellSection measure="prose" align="center">
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-medium">Name</h2>
              <p className="text-sm text-muted-foreground">
                The section caps at 720px and sits in the middle of the page.
              </p>
            </section>
          </AppShellSection>
        </AppShellPage>
      </AppShellContent>
    </Wrapper>
  );
}

/**
 * A `full` page holding a list at `measure="default"`: the list keeps a default page's content
 * width, centred, whatever else the frame hosts.
 */
export function appShellSectionDefault(): ReactNode {
  return (
    <Wrapper className="block h-104 overflow-hidden bg-muted p-0">
      <AppShellContent landmark="region" aria-label="Page content">
        <AppShellPage size="full">
          <AppShellSection measure="default">
            <PageHeader
              title="Contracts"
              description="A folder in a full-width frame."
            />
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                The list caps at a default page's content width and sits in the
                middle.
              </p>
            </section>
          </AppShellSection>
        </AppShellPage>
      </AppShellContent>
    </Wrapper>
  );
}

const HEADER_ACTIONS = [
  {
    id: "share",
    label: "Share",
    icon: <Share2 />,
    overflow: "never" as const,
    variant: "outline" as const,
  },
  { id: "watch", label: "Watch", icon: <Bell />, overflow: "laptop" as const },
];
const HEADER_MENU = [
  { id: "copy", label: "Copy link", icon: <Link2 /> },
  { id: "trash", label: "Move to Trash", icon: <Trash2 />, destructive: true },
];

/**
 * `AppShellHeaderActions` at two bar widths: wide, both actions sit in the bar; narrow, Watch has
 * moved into ⋮ and Share is icon-only.
 */
export function appShellHeaderActions(): ReactNode {
  return (
    <Wrapper className="flex flex-col gap-4 bg-muted p-4">
      {[960, 480].map((width) => (
        <AppShell
          key={width}
          keyboardShortcut={false}
          collapseRail={false}
          className="min-h-0"
        >
          {/* The header's column, as in a real shell: the bar fills it and measures itself. */}
          <div
            className="flex min-w-0 flex-col"
            style={{ width, maxWidth: "100%" }}
          >
            <AppShellHeader
              className="rounded-lg border"
              actions={
                <AppShellHeaderActions
                  actions={HEADER_ACTIONS}
                  menu={HEADER_MENU}
                  menuLabel="Task actions"
                />
              }
            >
              <span className="truncate text-sm font-medium">
                Quarterly plan
              </span>
            </AppShellHeader>
          </div>
        </AppShell>
      ))}
    </Wrapper>
  );
}

/** A page loading inside the shell: the bar at once, the skeleton after the reveal delay. */
export function appShellProgress(): ReactNode {
  return (
    <Wrapper className="block h-64 overflow-hidden bg-muted p-0">
      <AppShellContent landmark="region" aria-label="Page content">
        <AppShellProgress label="Loading page" />
        <AppShellPage className="motion-reveal">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-24" />
          </div>
        </AppShellPage>
      </AppShellContent>
    </Wrapper>
  );
}

/**
 * The tablet's icon rail: counts at each icon's corner, hairlines between the groups
 * (`railSeparators`), and Spaces reached through a flyout (`SidebarMenuFlyout railOnly`).
 */
export function appShellRail(): ReactNode {
  return (
    <Wrapper className="block h-104 overflow-hidden p-0" style={FRAME}>
      <AppShell className="h-full min-h-0" defaultOpen={false}>
        <AppShellSidebar collapsible="icon" railSeparators className="h-full">
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
                  <SidebarMenuButton tooltip="Home" isActive>
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
                  <SidebarMenuButton
                    tooltip="Tasks"
                    badge={2}
                    badgeLabel="2 due"
                  >
                    <CheckSquare />
                    <span>Tasks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuFlyout
                  label="Spaces"
                  icon={<LayoutGrid />}
                  railOnly
                >
                  <DropdownMenuItem>General</DropdownMenuItem>
                  <DropdownMenuItem>Product</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus />
                    New space
                  </DropdownMenuItem>
                </SidebarMenuFlyout>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mt-auto">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </AppShellSidebar>
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <AppShellHeader>
            <span className="truncate text-sm font-medium text-foreground">
              Tablet rail
            </span>
          </AppShellHeader>
          <AppShellContent landmark="region" aria-label="Rail content">
            <p className="p-4 text-sm text-muted-foreground">
              Hover Spaces for its flyout; expand the rail with the header
              button.
            </p>
          </AppShellContent>
        </div>
      </AppShell>
    </Wrapper>
  );
}

/**
 * The phone bar: Search and the Inbox with its count beside the page's primary, and the footer's
 * Docs and Settings folded into the profile menu while the sidebar is the phone drawer. The
 * phone tools show below 768px of the window.
 */
export function appShellPhoneBar(): ReactNode {
  return (
    <Wrapper className="block h-104 overflow-hidden p-0" style={FRAME}>
      <AppShell className="h-full min-h-0">
        <AppShellSidebar className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <AppShellFold place="sidebar">
              <SidebarGroup className="mt-auto">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <BookOpen />
                      <span>Docs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </AppShellFold>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<SidebarMenuButton />}>
                    <span className="flex size-4 items-center justify-center rounded-full bg-muted text-xs">
                      M
                    </span>
                    <span>Maya Kapoor</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" className="min-w-48">
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <AppShellFold place="menu">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <BookOpen />
                        Docs
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings />
                        Settings
                      </DropdownMenuItem>
                    </AppShellFold>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </AppShellSidebar>
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <AppShellHeader
            mobileActions={
              <>
                <AppShellHeaderMobileAction label="Search" icon={<Search />} />
                <AppShellHeaderMobileAction
                  label="Inbox"
                  icon={<Inbox />}
                  count={15}
                  countLabel="unread"
                />
              </>
            }
            actions={
              <Button size="icon-lg" className="size-10" aria-label="New page">
                <Plus />
              </Button>
            }
          >
            <span className="truncate text-sm font-medium text-foreground">
              Settings
            </span>
          </AppShellHeader>
          <AppShellContent landmark="region" aria-label="Phone content">
            <p className="p-4 text-sm text-muted-foreground">
              Narrow the window below 768px: Search and Inbox join the bar, and
              Docs and Settings move into the profile menu.
            </p>
          </AppShellContent>
        </div>
      </AppShell>
    </Wrapper>
  );
}
