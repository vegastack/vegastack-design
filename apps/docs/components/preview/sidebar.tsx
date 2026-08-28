"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { usePreviewFrameWidth } from "../preview-controls";
import {
  Home,
  Inbox,
  Search,
  Settings,
  LifeBuoy,
  Bot,
  BarChart3,
  Users,
} from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/sidebar` (dogfoods the registry) → auto-scanned.
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// Desktop-specific demos pass `mobileBreakpoint={1}` — below the provider's breakpoint (default 768px)
// the sidebar renders inside a CLOSED Sheet, so a 375px docs preview would be an empty box.
// `1` becomes a `(max-width: 0px)` media query that never matches, keeping the desktop rail
// visible at every preview width.
const DEMO_MOBILE_BREAKPOINT = 1;

const GROUPS = [
  {
    label: "Workspace",
    items: [
      { key: "home", label: "Home", icon: Home, badge: undefined },
      { key: "inbox", label: "Inbox", icon: Inbox, badge: "12" },
      { key: "search", label: "Search", icon: Search, badge: undefined },
      {
        key: "analytics",
        label: "Analytics",
        icon: BarChart3,
        badge: undefined,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      { key: "agents", label: "Agents", icon: Bot, badge: "3" },
      { key: "members", label: "Members", icon: Users, badge: undefined },
      { key: "help", label: "Help", icon: LifeBuoy, badge: undefined },
    ],
  },
] as const;

export function sidebar(): ReactNode {
  const [active, setActive] = useState<string>("inbox");
  return (
    <Wrapper className="block h-104 overflow-hidden p-0">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar aria-label="Demo navigation">
          <SidebarHeader>
            <span className="px-1 text-label font-medium group-data-[state=collapsed]/sidebar:hidden">
              VegaStack
            </span>
          </SidebarHeader>
          <SidebarContent>
            {GROUPS.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => (
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
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger />
            <span className="min-w-0 truncate text-label font-medium text-foreground">
              Workspace
            </span>
          </header>
          <main className="flex min-h-0 flex-1 items-center justify-center p-4 text-base text-muted-foreground">
            Select a navigation item
          </main>
        </div>
      </SidebarProvider>
    </Wrapper>
  );
}

/**
 * Frame-responsive navigation. The docs width toggle constrains a container, not `matchMedia`, so
 * this demo reads the selected frame preset and forces the rail into its modal Sheet at the mobile
 * preset. Toggle the toolbar's phone icon to watch the rail collapse into a Sheet you open from the
 * header trigger; wider presets keep the default viewport behaviour.
 */
export function sidebarMobile(): ReactNode {
  const frameWidth = usePreviewFrameWidth();
  return (
    <Wrapper className="block h-80 overflow-hidden p-0">
      <SidebarProvider
        mobileBreakpoint={frameWidth === "mobile" ? 10000 : undefined}
        className="h-full min-h-0"
      >
        <Sidebar aria-label="Mobile demo navigation">
          <SidebarHeader>
            <span className="px-1 text-label font-medium">VegaStack</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {GROUPS[0].items.slice(0, 3).map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
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
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger />
            <span className="truncate text-label font-medium text-foreground">
              Mobile workspace
            </span>
          </header>
          <main className="p-4 text-base text-muted-foreground">
            Navigation opens over this content.
          </main>
        </div>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarGroups(): ReactNode {
  const [active, setActive] = useState<string>("agents");
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}>
        <Sidebar aria-label="Grouped navigation">
          <SidebarContent>
            {GROUPS.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => (
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
            ))}
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarRight(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}>
        {/* page content sits before the rail; the right-side rail orders itself last */}
        <div className="flex-1 p-4 text-base text-muted-foreground">
          Page content sits to the left of a right-edge rail.
        </div>
        <Sidebar side="right" aria-label="Right-edge navigation">
          <SidebarHeader>
            <div className="flex items-center justify-between px-1">
              <span className="text-label font-medium group-data-[state=collapsed]/sidebar:hidden">
                VegaStack
              </span>
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {GROUPS[0].items.map((item) => (
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
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

const SIZES = [
  { size: "sm", label: "sm (28px)" },
  { size: "default", label: "default (32px)" },
  { size: "lg", label: "lg (40px)" },
] as const;

export function sidebarSizes(): ReactNode {
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}>
        <Sidebar aria-label="Menu button sizes">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Sizes</SidebarGroupLabel>
              <SidebarMenu>
                {SIZES.map((entry) => (
                  <SidebarMenuItem key={entry.size}>
                    <SidebarMenuButton
                      size={entry.size}
                      isActive={entry.size === "default"}
                    >
                      <Home />
                      <span>{entry.label}</span>
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

/** Reads `useSidebar()` to render an external toggle + a live state read-out. */
function ExternalControls(): ReactNode {
  const { state, open, toggleSidebar } = useSidebar();
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <p className="text-base text-muted-foreground">
        State from <code>useSidebar()</code>:{" "}
        <span className="font-mono text-foreground">{state}</span> (open:{" "}
        <span className="font-mono text-foreground">{String(open)}</span>)
      </p>
      <div>
        <Button size="sm" variant="outline" onClick={toggleSidebar}>
          {open ? "Collapse" : "Expand"} from outside
        </Button>
      </div>
    </div>
  );
}

export function sidebarControlled(): ReactNode {
  const [open, setOpen] = useState(true);
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider
        open={open}
        onOpenChange={setOpen}
        mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}
      >
        <Sidebar aria-label="Controlled navigation">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {GROUPS[0].items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton isActive={item.key === "home"}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <ExternalControls />
      </SidebarProvider>
    </Wrapper>
  );
}

export function sidebarCollapsed(): ReactNode {
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider
        defaultOpen={false}
        mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}
      >
        <Sidebar aria-label="Collapsed navigation">
          <SidebarHeader>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Inbox />
                    <span>Inbox</span>
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
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

/** `variant="floating"` — a detached, bordered, shadowed panel with margin on every edge. */
export function sidebarFloating(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}>
        <Sidebar variant="floating" aria-label="Floating navigation">
          <SidebarHeader>
            <div className="flex items-center justify-between px-1">
              <span className="text-label font-medium group-data-[state=collapsed]/sidebar:hidden">
                VegaStack
              </span>
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {GROUPS[0].items.map((item) => (
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
        </Sidebar>
      </SidebarProvider>
    </Wrapper>
  );
}

/**
 * `variant="inset"` pairs `Sidebar` with `SidebarInset` for the main content — `SidebarInset`
 * becomes the rounded/bordered/shadowed panel instead of the rail. `SidebarRail` adds the
 * click-to-toggle edge strip alongside the explicit trigger.
 */
export function sidebarInset(): ReactNode {
  const [active, setActive] = useState<string>("home");
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}>
        <Sidebar variant="inset" aria-label="Inset navigation">
          <SidebarHeader>
            <div className="flex items-center justify-between px-1">
              <span className="text-label font-medium group-data-[state=collapsed]/sidebar:hidden">
                VegaStack
              </span>
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {GROUPS[0].items.map((item) => (
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
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <div className="p-4 text-base text-muted-foreground">
            Page content sits in the rounded inset panel; drag the thin edge
            strip (<code>SidebarRail</code>) or use the trigger to collapse the
            rail.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Wrapper>
  );
}

/** `collapsible="offcanvas"` — the rail slides fully off-screen (instead of shrinking to icons). */
export function sidebarOffcanvas(): ReactNode {
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}>
        <Sidebar aria-label="Off-canvas navigation" collapsible="offcanvas">
          <SidebarHeader>
            <div className="flex items-center justify-between px-1">
              <span className="text-label font-medium">VegaStack</span>
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {GROUPS[0].items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 p-4 text-base text-muted-foreground">
          Toggle the trigger — the rail slides fully off-screen instead of
          shrinking to icons.
        </div>
      </SidebarProvider>
    </Wrapper>
  );
}

/** `SidebarMenuSkeleton` — a loading placeholder shaped like a row of `SidebarMenuButton`s. */
export function sidebarMenuSkeleton(): ReactNode {
  return (
    <Wrapper className="block overflow-hidden p-0">
      <SidebarProvider mobileBreakpoint={DEMO_MOBILE_BREAKPOINT}>
        <Sidebar aria-label="Loading navigation">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {Array.from({ length: 5 }, (_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton index={i} />
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
