// @vegastack app-shell-01@0.11.2 sha256-guCqrIQRzD42FqsgmTFmrLBVq1VsJ2Gw4FUxDDPAm1s=

import {
  BarChart3,
  Bot,
  LifeBuoy,
  ListChecks,
  Settings2,
  Sparkles,
} from "lucide-react";

import { AppShellSidebar } from "@/components/ui/app-shell";
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
} from "@/components/ui/sidebar";

const data = {
  workspace: { name: "Acme", plan: "Team plan" },
  navMain: [
    { title: "Overview", href: "#", icon: BarChart3, isActive: true },
    { title: "Agents", href: "#", icon: Bot },
    { title: "Tasks", href: "#", icon: ListChecks },
    { title: "Insights", href: "#", icon: Sparkles },
  ],
  navFooter: [
    { title: "Settings", href: "#", icon: Settings2 },
    { title: "Support", href: "#", icon: LifeBuoy },
  ],
};

/**
 * The block's navigation rail: `AppShellSidebar` (the `<nav>` landmark) over upstream's
 * `Sidebar` parts, with the workspace switcher, the main nav and a footer group. The items are
 * inline sample data — replace `data` and swap each `<a>` for your router's link.
 *
 * @example
 * <AppShell>
 *   <AppSidebar />
 *   <div className="flex h-svh min-w-0 flex-1 flex-col">…</div>
 * </AppShell>
 */
export function AppSidebar() {
  return (
    <AppShellSidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {data.workspace.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {data.workspace.plan}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
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
        </SidebarMenu>
      </SidebarFooter>
    </AppShellSidebar>
  );
}
