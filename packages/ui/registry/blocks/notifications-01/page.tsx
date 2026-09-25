// @vegastack notifications-01@0.23.31 sha256-dTJiA6v21/9sJNgOuK6CxWPVDXoStp/hVijGysDdzlk=

"use client";

import * as React from "react";
import { Home, Inbox } from "lucide-react";

import { InboxSheet } from "./components/inbox-sheet";
import {
  NOTIFICATIONS,
  OLDER_NOTIFICATIONS,
  SAMPLE_NOW,
} from "./components/sample-notifications";
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellPage,
  AppShellSidebar,
} from "@/components/ui/app-shell";
import { NotificationBell } from "@/components/ui/notification-bell";
import { PageHeader } from "@/components/ui/page-header";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const unreadLabel = (n: number) => `${n} unread`;

/**
 * `notifications-01` — the Inbox: an "Inbox" row in the rail (desktop) and a bell in the header
 * (phone), both carrying the unread count in their names, opening one `InboxSheet`.
 *
 * Replace the sample notifications with your API, and "Mark all read" and the infinite-scroll
 * `loadOlder` (15 rows a page) with its calls. The app this mirrors docks the sheet beside the sidebar (`side="left"`, non-modal on
 * desktop, full screen on a phone). In an app with more pages, the triggers live in your shell layout.
 *
 * @example
 * // app/inbox-demo/page.tsx, straight after `shadcn add @vegastack/notifications-01`
 * export { default } from "./page";
 */
export default function Page() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState(NOTIFICATIONS);
  const [olderLoaded, setOlderLoaded] = React.useState(false);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [olderFailed, setOlderFailed] = React.useState(false);
  const attempts = React.useRef(0);
  const unread = items.filter((n) => n.unread).length;

  // Infinite scroll: the first page fails once to show "Try again"; the retry loads the last page
  // and the list ends on "You’re all caught up". Page your API 15 rows at a time.
  function loadOlder() {
    setLoadingOlder(true);
    setOlderFailed(false);
    window.setTimeout(() => {
      attempts.current += 1;
      if (attempts.current === 1) {
        setOlderFailed(true);
      } else {
        setItems((current) => [...current, ...OLDER_NOTIFICATIONS]);
        setOlderLoaded(true);
      }
      setLoadingOlder(false);
    }, 700);
  }

  return (
    <AppShell>
      <AppShellSidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Home"
                    isActive
                    render={<a href="/" />}
                  >
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Inbox"
                    badge={unread || undefined}
                    badgeLabel={unread ? unreadLabel(unread) : undefined}
                    onClick={() => setOpen(true)}
                  >
                    <Inbox />
                    <span>Inbox</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </AppShellSidebar>
      <div className="flex h-svh min-w-0 flex-1 flex-col">
        <AppShellHeader
          actions={
            <NotificationBell
              aria-label="Inbox"
              count={unread}
              countLabel={unreadLabel}
              className="md:hidden"
              onClick={() => setOpen(true)}
            />
          }
        >
          <span className="text-sm font-medium">Acme</span>
        </AppShellHeader>
        <AppShellContent>
          <AppShellPage>
            <PageHeader
              title="Home"
              description="Open the Inbox from the rail, or the bell on a phone."
            />
          </AppShellPage>
        </AppShellContent>
      </div>
      <InboxSheet
        open={open}
        onOpenChange={setOpen}
        notifications={items}
        now={SAMPLE_NOW}
        onMarkAllRead={() =>
          setItems((current) => current.map((n) => ({ ...n, unread: false })))
        }
        onToggleRead={(id) =>
          setItems((current) =>
            current.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)),
          )
        }
        onLoadMore={loadOlder}
        hasMore={!olderLoaded}
        loadingMore={loadingOlder}
        loadMoreError={olderFailed}
      />
    </AppShell>
  );
}
