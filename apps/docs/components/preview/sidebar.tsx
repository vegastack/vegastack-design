"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  BadgeCheck,
  Bot,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Folder,
  Forward,
  Frame,
  GalleryVerticalEnd,
  Home,
  Inbox,
  LifeBuoy,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  SquareTerminal,
  Trash2,
} from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/sidebar` (dogfoods the registry) → auto-scanned.
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  useSidebarCookieOpen,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DirectionProvider } from "@/components/ui/direction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/*
 * TWO SHAPES OF FIXTURE, and the reason there are two.
 *
 * `Sidebar`'s DESKTOP panel is `position: fixed` and `hidden md:block` — it is an application
 * shell, pinned to the viewport, not a box in the flow. A docs page is not an application shell,
 * so every fixture that mounts the collapsible panel renders inside a frame carrying
 * `contain: paint`, which makes that frame the fixed-positioning containing block. Without it the
 * demo would pin itself over the docs chrome. It is a property of the FRAME, not of the component:
 * nothing here restyles a sidebar part.
 *
 * Fixtures that are ABOUT one part — the header, a menu button, a badge — use
 * `collapsible="none"` instead. That branch returns a plain flex column before the mobile/desktop
 * fork, so the part is visible at every width, which is what a reader (and the geometry lane, which
 * mounts every fixture at 320px) needs to see.
 *
 * Sample data is inline and fixed; no timers, no randomness, no network.
 */

const NAV = [
  { key: "home", title: "Home", icon: Home, badge: undefined },
  { key: "inbox", title: "Inbox", icon: Inbox, badge: "12" },
  { key: "search", title: "Search", icon: Search, badge: undefined },
  { key: "agents", title: "Agents", icon: Bot, badge: "3" },
] as const;

const PROJECTS = [
  { name: "Design Engineering", icon: Frame },
  { name: "Sales & Marketing", icon: LifeBuoy },
] as const;

/**
 * Reads the sidebar context and prints it. Module-local on purpose: `useSidebar` throws outside a
 * `SidebarProvider`, so the reader has to be a DESCENDANT of the provider rather than the fixture
 * itself. Not exported — every exported function in this barrel is mounted as a preview fixture.
 */
function SidebarStateReadout(): ReactNode {
  const { state, open, isMobile, toggleSidebar } = useSidebar();
  return (
    <div className="flex flex-col items-start gap-2 p-4 text-sm">
      <p>
        state: <code>{state}</code> · open: <code>{String(open)}</code> ·
        isMobile: <code>{String(isMobile)}</code>
      </p>
      <Button variant="outline" size="sm" onClick={toggleSidebar}>
        Toggle sidebar
      </Button>
    </div>
  );
}

export function sidebar(): ReactNode {
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                  <ChevronsUpDown className="ms-auto" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarMenu>
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      render={<SidebarMenuButton tooltip="Playground" />}
                    >
                      <SquareTerminal />
                      <span>Playground</span>
                      <ChevronRight className="ms-auto group-data-open/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton render={<a href="#history" />}>
                            <span>History</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton render={<a href="#starred" />}>
                            <span>Starred</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Models">
                    <Bot />
                    <span>Models</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings">
                    <Settings2 />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Account">
                  <BadgeCheck />
                  <span>Account</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ms-1" />
            <span className="text-sm font-medium">Playground</span>
          </header>
          <div className="p-4 text-sm text-muted-foreground">
            Page content sits in <code>SidebarInset</code>.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarComposition(): ReactNode {
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <span className="px-2 text-sm font-medium">Acme Inc</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupAction>
                <Plus /> <span className="sr-only">Add project</span>
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction>
                      <MoreHorizontal /> <span className="sr-only">More</span>
                    </SidebarMenuAction>
                    <SidebarMenuBadge>24</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Inbox />
                      <span>Inbox</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton render={<a href="#unread" />}>
                          <span>Unread</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <span className="px-2 text-xs text-sidebar-foreground/70">
              SidebarFooter
            </span>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">SidebarInset</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarStructure(): ReactNode {
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <span className="px-2 text-xs text-sidebar-foreground/70">
              SidebarHeader — branding, titles, workspace switchers
            </span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>SidebarGroup</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <span className="px-2 text-xs text-sidebar-foreground/70">
              SidebarFooter — user menus, settings
            </span>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">SidebarTrigger</span>
          </header>
          <div className="p-4 text-sm text-muted-foreground">
            SidebarInset wraps the main content.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarProvider(): ReactNode {
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      {/* `--sidebar-width` on the provider is how a second sidebar in the same app gets its own
          width without touching the component's constants. */}
      <SidebarProvider
        className="h-full min-h-0"
        defaultOpen
        style={{ "--sidebar-width": "20rem" } as CSSProperties}
      >
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>20rem wide</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">
              ⌘/Ctrl + B toggles the sidebar
            </span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarPanel(): ReactNode {
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      {/* `variant="inset"` is the one variant that REQUIRES `SidebarInset` around the main
          content — the wrapper paints the sidebar surface behind an inset page. */}
      <SidebarProvider className="h-full min-h-0">
        <Sidebar variant="inset" collapsible="icon" side="left">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>variant=&quot;inset&quot;</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">Inset content</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarUseSidebar(): ReactNode {
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>useSidebar</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          {/* `SidebarStateReadout` calls `useSidebar()` — it has to be a descendant of the
              provider, so it is its own component rather than part of this fixture. */}
          <SidebarStateReadout />
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarHeader(): ReactNode {
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<SidebarMenuButton />}>
                    Select Workspace
                    <ChevronDown className="ms-auto" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>Acme Inc</DropdownMenuItem>
                    <DropdownMenuItem>Acme Corp.</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarInput placeholder="Search the workspace…" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarFooter(): ReactNode {
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <BadgeCheck />
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">shadcn</span>
                    <span className="truncate text-xs">m@example.com</span>
                  </div>
                  <ChevronsUpDown className="ms-auto" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarContent(): ReactNode {
  return (
    <Wrapper className="block h-72 overflow-hidden p-0">
      {/* `SidebarContent` is the scrollable region between header and footer: two groups and a
          fixed frame height are enough to show it take the overflow. */}
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarHeader>
            <span className="px-2 text-sm font-medium">Acme Inc</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarMenu>
                {PROJECTS.map((project) => (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton render={<a href="#project" />}>
                      <project.icon />
                      <span>{project.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <span className="px-2 text-xs text-sidebar-foreground/70">
              Footer stays put
            </span>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarGroup(): ReactNode {
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupAction>
                <Plus /> <span className="sr-only">Add project</span>
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton>
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {/* A collapsible group: the label IS the trigger, via `render`. */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel render={<CollapsibleTrigger />}>
                  Help
                  <ChevronDown className="ms-auto group-data-open/collapsible:rotate-180" />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton render={<a href="#support" />}>
                          <LifeBuoy />
                          <span>Support</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarMenu(): ReactNode {
  return (
    <Wrapper className="block h-72 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarMenu>
                {PROJECTS.map((project) => (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton render={<a href="#project" />}>
                      <project.icon />
                      <span>{project.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarMenuButton(): ReactNode {
  return (
    <Wrapper className="block h-96 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>isActive and render</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#home" />} isActive>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#inbox" />}>
                    <Inbox />
                    <span>Inbox</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>size</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm">
                    <Home />
                    <span>sm</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="default">
                    <Home />
                    <span>default</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg">
                    <Home />
                    <span>lg</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>variant</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline">
                    <Settings2 />
                    <span>outline</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Settings2 />
                    <span>disabled</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarMenuAction(): ReactNode {
  return (
    <Wrapper className="block h-72 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#home" />}>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction>
                    <Plus /> <span className="sr-only">Add project</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#design" />}>
                    <Frame />
                    <span>Design Engineering</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<SidebarMenuAction showOnHover />}
                    >
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="right">
                      <DropdownMenuItem>
                        <Folder />
                        <span>View project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward />
                        <span>Share project</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Trash2 />
                        <span>Delete project</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarMenuSub(): ReactNode {
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Documentation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <SquareTerminal />
                    <span>Playground</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton render={<a href="#history" />}>
                        <span>History</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<a href="#starred" />}
                        isActive
                      >
                        <span>Starred</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<a href="#settings" />}
                        size="sm"
                      >
                        <span>Settings (size=sm)</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarMenuBadge(): ReactNode {
  return (
    <Wrapper className="block h-72 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Counts</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      badgeLabel={item.badge ? `${item.badge} new` : undefined}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarMenuSkeleton(): ReactNode {
  return (
    <Wrapper className="block h-72 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Loading</SidebarGroupLabel>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton index={index} showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarTrigger(): ReactNode {
  return (
    <Wrapper
      className="block h-80 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">SidebarTrigger</span>
          </header>
          <div className="p-4 text-sm text-muted-foreground">
            The trigger calls <code>toggleSidebar()</code> from{" "}
            <code>useSidebar</code>; any button can do the same.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarRail(): ReactNode {
  return (
    <Wrapper
      className="block h-80 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader>
            <span className="px-2 text-sm font-medium">Acme Inc</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">
              The rail is the thin strip on the panel edge
            </span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarControlled(): ReactNode {
  const [open, setOpen] = useState(true);
  return (
    <Wrapper
      className="block h-80 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider
        className="h-full min-h-0"
        open={open}
        onOpenChange={setOpen}
      >
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Controlled</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col items-start gap-2 p-4 text-sm">
            <p>
              open: <code>{String(open)}</code>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen((value) => !value)}
            >
              Toggle from outside
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarTheming(): ReactNode {
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      {/* The eight `--sidebar-*` variables are the whole theming surface. Set them on any ancestor
          — here the provider — and every sidebar part below inherits the new palette. */}
      <SidebarProvider
        className="h-full min-h-0"
        style={
          {
            "--sidebar": "var(--color-foreground)",
            "--sidebar-foreground": "var(--color-background)",
            "--sidebar-accent": "var(--color-muted-foreground)",
            "--sidebar-accent-foreground": "var(--color-background)",
            "--sidebar-border": "var(--color-muted-foreground)",
            "--sidebar-primary": "var(--color-background)",
            "--sidebar-primary-foreground": "var(--color-foreground)",
          } as CSSProperties
        }
      >
        <Sidebar collapsible="none" className="h-full">
          <SidebarHeader>
            <span className="px-2 text-sm font-medium">Inverted palette</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton isActive={item.key === "inbox"}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarStyling(): ReactNode {
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      {/* Two of upstream's styling hooks, live. The group-level
          `group-data-[collapsible=icon]:hidden` recipe hides a whole group in icon mode, and
          `md:peer-data-active/menu-button:opacity-100` pins a hover-revealed action visible while
          its row is the active one. The `md:` prefix is not decoration: `showOnHover`'s own
          `md:opacity-0` and the bare `peer-data-active/…` override compile to the same (0,1,0)
          specificity, so without it the media rule wins on source order. */}
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Frame />
                    <span>Design Engineering</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    className="md:peer-data-active/menu-button:opacity-100"
                  >
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <LifeBuoy />
                    <span>Sales &amp; Marketing</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    className="md:peer-data-active/menu-button:opacity-100"
                  >
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper
        className="block h-80 overflow-hidden p-0"
        dir="rtl"
        style={{ contain: "paint" }}
      >
        {/* `dir` on `Sidebar` travels to the mobile `SheetContent`, which portals out of this
            subtree; `side="right"` is the reading-order start in RTL. */}
        <SidebarProvider className="h-full min-h-0">
          <Sidebar dir="rtl" side="right" collapsible="offcanvas">
            <SidebarHeader>
              <span className="px-2 text-sm font-medium">شركة أكمي</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>مساحة العمل</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <Home />
                      <span>الرئيسية</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>٢٤</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Inbox />
                      <span>الوارد</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings2 />
                      <span>الإعدادات</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <span className="text-sm font-medium">لوحة التحكم</span>
            </header>
          </SidebarInset>
        </SidebarProvider>
      </Wrapper>
    </DirectionProvider>
  );
}

/*
 * The sections below come after upstream's examples: they document what this system adds on top
 * of upstream's parts (A11Y-17's counts, A11Y-18's current page) and the compositions a product
 * sidebar reaches for most.
 */

const COUNTED = [
  {
    key: "inbox",
    title: "Inbox",
    icon: Inbox,
    count: "12",
    label: "12 unread",
  },
  {
    key: "review",
    title: "Waiting for your review across every workspace",
    icon: BadgeCheck,
    count: "1,204",
    label: "1,204 waiting",
  },
  { key: "agents", title: "Agents", icon: Bot, count: "3", label: "3 running" },
] as const;

export function sidebarCounts(): ReactNode {
  return (
    <Wrapper className="block h-72 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Counts</SidebarGroupLabel>
              <SidebarMenu>
                {COUNTED.map((item, index) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      render={<a href={`#${item.key}`} />}
                      isActive={index === 0}
                      badge={item.count}
                      badgeLabel={item.label}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarActionRow(): ReactNode {
  return (
    <Wrapper className="block h-64 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    variant="outline"
                    aria-keyshortcuts="Meta+K Control+K"
                  >
                    <Search />
                    <span>Search</span>
                    <KbdGroup aria-hidden="true" className="ms-auto">
                      <Kbd>⌘</Kbd>
                      <Kbd>K</Kbd>
                    </KbdGroup>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#projects" />}>
                    <Folder />
                    <span>Projects</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction>
                    <Plus />
                    <span className="sr-only">New project</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarCollapsibleGroup(): ReactNode {
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarMenu>
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<CollapsibleTrigger />}>
                      <SquareTerminal />
                      <span>Playground</span>
                      <ChevronRight className="ms-auto transition-transform group-data-open/collapsible:rotate-90 rtl:rotate-180" />
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            render={<a href="#history" />}
                            isActive
                            aria-current="page"
                          >
                            <span>History</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton render={<a href="#starred" />}>
                            <span>Starred</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarUnavailableItem(): ReactNode {
  return (
    <Wrapper className="block h-64 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="h-full border-e">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#home" />}>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <SidebarMenuButton
                          aria-disabled="true"
                          aria-describedby="sidebar-unavailable-reason"
                        />
                      }
                    >
                      <Bot />
                      <span>Agents</span>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Available on the Team plan
                    </TooltipContent>
                  </Tooltip>
                  <span id="sidebar-unavailable-reason" className="sr-only">
                    Available on the Team plan
                  </span>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarKeyboardShortcut(): ReactNode {
  const [enabled, setEnabled] = useState(true);
  return (
    <Wrapper
      className="block h-80 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider
        className="h-full min-h-0"
        keyboardShortcut={enabled ? "b" : false}
      >
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col items-start gap-3 p-4 text-sm">
            <p>
              Press <Kbd>⌘</Kbd>/<Kbd>Ctrl</Kbd> + <Kbd>B</Kbd>. Typing it in
              the field below does nothing.
            </p>
            <Input
              aria-label="Draft"
              placeholder="Type here"
              className="max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEnabled((value) => !value)}
            >
              {enabled ? "Turn the shortcut off" : "Turn the shortcut on"}
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarStaticShell(): ReactNode {
  const [open, setOpen] = useSidebarCookieOpen();
  return (
    <Wrapper
      className="block h-80 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <SidebarProvider
        className="h-full min-h-0"
        open={open}
        onOpenChange={setOpen}
      >
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">
              Collapse it, then reload the page
            </span>
          </header>
          <div className="p-4 text-sm text-muted-foreground">
            <code>useSidebarCookieOpen</code> keeps the state in the{" "}
            <code>sidebar_state</code> cookie, which{" "}
            <code>SidebarStateScript</code> reads before first paint.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}
