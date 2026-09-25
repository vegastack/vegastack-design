// @vegastack app-shell-01@0.23.32 sha256-9xaWVw4WZ+5HUMhsiLC2PAtGv+qd8QTFEV6F7cQLORs=

"use client";

import * as React from "react";
import {
  BarChart3,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Inbox,
  Keyboard,
  LifeBuoy,
  ListChecks,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Sun,
  SunMoon,
  UserRound,
  UsersRound,
} from "lucide-react";

import { AppShellSidebar } from "@/components/ui/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { useVegaStackTheme } from "@/components/ui/provider";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  formatShortcut,
  isEditableTarget,
  usePlatform,
} from "@/components/ui/use-platform";

interface Workspace {
  id: string;
  name: string;
  plan: string;
}

const WORKSPACES: [Workspace, ...Workspace[]] = [
  { id: "acme", name: "Acme", plan: "Team plan" },
  { id: "globex", name: "Globex", plan: "Free plan" },
];

const data = {
  workspaces: WORKSPACES,
  user: {
    name: "Ana Ruiz",
    role: "Admin",
    email: "ana@acme.com",
    initials: "AR",
  },
  inbox: { href: "/inbox", unread: 3 },
  navMain: [
    { title: "Overview", href: "/", icon: BarChart3, isActive: true },
    { title: "Agents", href: "/agents", icon: Bot },
    { title: "Tasks", href: "/tasks", icon: ListChecks },
  ],
  navLibrary: [
    { title: "Customers", href: "/customers", icon: UsersRound },
    { title: "Documents", href: "/documents", icon: FileText },
  ],
  comingSoon: ["Insights", "Automations"],
  navFooter: [
    { title: "Settings", href: "/settings", icon: Settings2 },
    { title: "Support", href: "/support", icon: LifeBuoy },
  ],
};

/** Every link in the rail, for the Search palette. */
const PAGES = [...data.navMain, ...data.navLibrary, ...data.navFooter];

/**
 * The block's navigation rail: `AppShellSidebar` (the `<nav>` landmark) over the `Sidebar` parts.
 *
 * - A workspace menu in the header — a real `DropdownMenu` trigger, not an inert button.
 * - A Search row that opens a palette on click or ⌘K / Ctrl+K; its hint comes from `formatShortcut`,
 *   and the chord is on the button as `aria-keyshortcuts` so the name stays "Search".
 * - An Inbox row whose unread count is part of its name (`badge` + `badgeLabel`).
 * - Grouped links under `SidebarGroupLabel`s, with `isActive` marking the current page
 *   (`aria-current="page"`), and a collapsible "Coming soon" group.
 * - A user menu in the footer: avatar, name and role on the trigger; the same row with the email as
 *   the menu header; Profile and Settings; a Theme submenu; Keyboard shortcuts; Sign out. Every item
 *   has an icon.
 *
 * The items are inline sample data — replace `data` and swap each `<a>` for your router's link.
 *
 * @example
 * <AppShell>
 *   <AppSidebar />
 *   <div className="flex h-svh min-w-0 flex-1 flex-col">…</div>
 * </AppShell>
 */
export function AppSidebar() {
  const { os } = usePlatform();
  const { theme, setTheme } = useVegaStackTheme();
  const [workspace, setWorkspace] = React.useState<Workspace>(WORKSPACES[0]);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event)) return;
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AppShellSidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton size="lg" />}
                aria-label={`Workspace: ${workspace.name}`}
              >
                <div
                  aria-hidden
                  className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                >
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{workspace.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {workspace.plan}
                  </span>
                </div>
                <ChevronsUpDown aria-hidden className="ms-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={workspace.id}
                    onValueChange={(id) => {
                      const next = data.workspaces.find((w) => w.id === id);
                      if (next) setWorkspace(next);
                    }}
                  >
                    {data.workspaces.map((w) => (
                      <DropdownMenuRadioItem key={w.id} value={w.id}>
                        {w.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus />
                  New workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  variant="outline"
                  tooltip="Search"
                  aria-keyshortcuts="Meta+K Control+K"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search />
                  <span>Search</span>
                  <Kbd aria-hidden className="ms-auto">
                    {formatShortcut(["mod", "K"], os)}
                  </Kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Inbox"
                  render={<a href={data.inbox.href} />}
                  badge={data.inbox.unread}
                  badgeLabel={`${data.inbox.unread} unread`}
                >
                  <Inbox />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    tooltip={item.title}
                    render={<a href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navLibrary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    render={<a href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* The Collapsible IS the list item, so the menu keeps li-only children. */}
              <Collapsible
                className="group/collapsible"
                render={<SidebarMenuItem />}
              >
                <SidebarMenuButton
                  tooltip="Coming soon"
                  render={<CollapsibleTrigger />}
                >
                  <Sparkles />
                  <span>Coming soon</span>
                  <ChevronRight
                    aria-hidden
                    className="ms-auto transition-transform group-data-open/collapsible:rotate-90 rtl:rotate-180"
                  />
                </SidebarMenuButton>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {data.comingSoon.map((title) => (
                      <SidebarMenuSubItem
                        key={title}
                        className="px-2 py-1 text-sm text-muted-foreground"
                      >
                        {title}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {data.navFooter.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                render={<a href={item.href} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton size="lg" />}
                aria-label={`Account: ${data.user.name}`}
              >
                <Avatar size="sm">
                  <AvatarFallback>{data.user.initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{data.user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {data.user.role}
                  </span>
                </div>
                <ChevronsUpDown aria-hidden className="ms-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2 font-normal">
                    <Avatar size="sm">
                      <AvatarFallback>{data.user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-start text-sm leading-tight">
                      <span className="truncate font-medium text-foreground">
                        {data.user.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {data.user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<a href="/settings/profile" />}>
                    <UserRound />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<a href="/settings" />}>
                    <Settings2 />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <SunMoon />
                      Theme
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={theme ?? "system"}
                        onValueChange={(value) => setTheme(value)}
                      >
                        <DropdownMenuRadioItem value="light">
                          <Sun />
                          Light
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                          <Moon />
                          Dark
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system">
                          <Monitor />
                          System
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem>
                    <Keyboard />
                    Keyboard shortcuts
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search"
        description="Go to a page"
      >
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup heading="Pages">
              {PAGES.map((page) => (
                <CommandItem
                  key={page.href}
                  value={page.title}
                  onSelect={() => {
                    window.location.assign(page.href);
                  }}
                >
                  <page.icon />
                  {page.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </AppShellSidebar>
  );
}
