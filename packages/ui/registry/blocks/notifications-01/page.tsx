// @vegastack notifications-01@0.107.0 sha256-zeAWZeEI21xs82YFnKvXYqDnUejeHzEiNhQkD7y+J5g=

"use client";

import * as React from "react";
import { Home, Inbox } from "lucide-react";

import { InboxSheet } from "./components/inbox-sheet";
import {
  NOTIFICATIONS,
  OLDER_NOTIFICATIONS,
  SAMPLE_NOW,
} from "./components/sample-notifications";
import { PageHeader } from "@/components/ui/page-header";
import {
  Shell,
  ShellBottomBar,
  ShellBottomBarItem,
  ShellMain,
  ShellPage,
  ShellTopBar,
  ShellTopBarTitle,
} from "@/components/ui/shell";
import { Rail, RailItem } from "@/components/ui/rail";

/**
 * `notifications-01` — the Inbox: an "Inbox" item on the shell's rail (desktop) and in its phone
 * bar, both carrying the unread count in their names, opening one `InboxSheet`.
 *
 * Replace the sample notifications with your API, and "Mark all read" and the infinite-scroll
 * `loadOlder` (15 rows a page) with its calls. The sheet opens from the right, modal, and full
 * screen on a phone. In an app with more pages, the triggers live in
 * your shell layout.
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
    <Shell
      rail={
        <Rail>
          <RailItem icon={<Home />} label="Home" href="/" active />
          <RailItem
            icon={<Inbox />}
            label="Inbox"
            badge={unread}
            onClick={() => setOpen(true)}
          />
        </Rail>
      }
      bottomBar={
        <ShellBottomBar>
          <ShellBottomBarItem icon={<Home />} label="Home" href="/" active />
          <ShellBottomBarItem
            icon={<Inbox />}
            label="Inbox"
            badge={unread}
            onClick={() => setOpen(true)}
          />
        </ShellBottomBar>
      }
    >
      <ShellTopBar>
        <ShellTopBarTitle>Home</ShellTopBarTitle>
      </ShellTopBar>
      <ShellMain>
        <ShellPage>
          <PageHeader
            title="Home"
            description="Open the Inbox from the rail, or from the bar on a phone."
          />
        </ShellPage>
      </ShellMain>
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
    </Shell>
  );
}
