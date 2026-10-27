"use client";

import { type ReactNode, useState } from "react";
import { House, ListChecks } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/help-menu` (dogfoods the registry) → auto-scanned.
import { HelpMenu } from "@/components/ui/help-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ShortcutOverlay } from "@/components/ui/shortcut-overlay";

function Shell({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}): ReactNode {
  return (
    <SidebarProvider defaultOpen={open} className="h-full min-h-0">
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Home" isActive>
                  <House aria-hidden />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Tasks">
                  <ListChecks aria-hidden />
                  <span>Tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>{children}</SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

function Demo({ open }: { open: boolean }): ReactNode {
  const [shortcuts, setShortcuts] = useState(false);
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <Shell open={open}>
        <HelpMenu
          whatsNewUnread
          version="v1.8.21"
          links={{
            whatsNew: { href: "#whats-new" },
            docs: { href: "#docs" },
            shortcuts: { onSelect: () => setShortcuts(true) },
            support: { href: "mailto:support@example.com", external: true },
          }}
        />
      </Shell>
      <ShortcutOverlay
        open={shortcuts}
        onOpenChange={setShortcuts}
        triggerKey={false}
        shortcuts={[
          { keys: ["⌘", "K"], label: "Open search", category: "General" },
          {
            keys: ["?"],
            label: "Show keyboard shortcuts",
            category: "General",
          },
        ]}
      />
    </Wrapper>
  );
}

/** The Help item at the foot of an open sidebar, with something new to read. */
export function helpMenu(): ReactNode {
  return <Demo open />;
}

/** The same item in the collapsed rail: the icon, its tooltip, and the dot on the icon. */
export function helpMenuRail(): ReactNode {
  return <Demo open={false} />;
}
