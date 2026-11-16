"use client";

import { type ReactNode, useState } from "react";
import { CircleHelp, House, ListChecks } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/help-menu` (dogfoods the registry) → auto-scanned.
import { HelpMenu } from "@/components/ui/help-menu";
import {
  ShellRail,
  ShellRailFooter,
  ShellRailItem,
} from "@/components/ui/shell";
import { ShortcutOverlay } from "@/components/ui/shortcut-overlay";

function Demo(): ReactNode {
  const [shortcuts, setShortcuts] = useState(false);
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <ShellRail className="h-full">
        <ShellRailItem icon={<House />} label="Home" href="#home" active />
        <ShellRailItem icon={<ListChecks />} label="Tasks" href="#tasks" />
        <ShellRailFooter>
          <HelpMenu
            side="right"
            trigger={
              <ShellRailItem
                icon={<CircleHelp />}
                label="Help"
                dot="new updates"
              />
            }
            whatsNewUnread
            version="v1.8.21"
            links={{
              whatsNew: { href: "#whats-new" },
              docs: { href: "#docs" },
              shortcuts: { onSelect: () => setShortcuts(true) },
              support: { href: "mailto:support@example.com", external: true },
            }}
          />
        </ShellRailFooter>
      </ShellRail>
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

/** The Help item at the foot of the shell's rail, with something new to read. */
export function helpMenu(): ReactNode {
  return <Demo />;
}
