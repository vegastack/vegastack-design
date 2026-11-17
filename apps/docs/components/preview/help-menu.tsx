"use client";

import { type ReactNode, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/help-menu` (dogfoods the registry) → auto-scanned.
import { HelpMenu } from "@/components/ui/help-menu";
import { Button } from "@/components/ui/button";
import { GlobalBar, GlobalBarTrailing } from "@/components/ui/global-bar";
import { NotificationDot } from "@/components/ui/notification-dot";
import { ShortcutOverlay } from "@/components/ui/shortcut-overlay";

function Demo(): ReactNode {
  const [shortcuts, setShortcuts] = useState(false);
  return (
    <Wrapper
      className="block h-96 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <GlobalBar className="border-b border-border">
        <span />
        <span />
        <GlobalBarTrailing>
          <HelpMenu
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Help (new updates)"
                className="relative"
              >
                <CircleHelp />
                <NotificationDot className="absolute top-0.5 end-0.5" />
              </Button>
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
        </GlobalBarTrailing>
      </GlobalBar>
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

/** The Help button at the end of the global bar, with something new to read. */
export function helpMenu(): ReactNode {
  return <Demo />;
}
