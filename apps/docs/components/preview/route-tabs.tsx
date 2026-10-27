"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/route-tabs` (dogfoods the registry) → auto-scanned.
import {
  RouteTabs,
  RouteTabsPanel,
  RouteTabsProvider,
  type RouteTab,
} from "@/components/ui/route-tabs";

const TABS: RouteTab[] = [
  { href: "/connections", label: "Yours" },
  { href: "/connections/everyone", label: "Everyone", count: 12 },
  {
    href: "/connections/activity",
    label: "Activity",
    also: ["/connections/activity/42"],
  },
];

/** A strip longer than its column — it scrolls. */
const LONG_TABS: RouteTab[] = [
  { href: "/connections", label: "Your connections" },
  { href: "/connections/everyone", label: "Everyone", count: 12 },
  { href: "/connections/policy", label: "Policy" },
  {
    href: "/connections/activity",
    label: "Activity",
    count: 1284,
    also: ["/connections/activity/42"],
  },
];

const PAGES: Record<string, string> = {
  "/connections": "Agents you connected — Claude, Codex.",
  "/connections/everyone": "Every agent connected in this workspace.",
  "/connections/policy": "Which agents may connect, and what they may do.",
  "/connections/activity": "What connected agents did, newest first.",
};

/** In the docs a link only changes the demo's page, after a delay; in an app it is your router's `<Link />`. */
const NavigateContext = React.createContext<(href: string) => void>(() => {});

function DemoLink({ href = "", onClick, ...props }: React.ComponentProps<"a">) {
  const navigate = React.useContext(NavigateContext);
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
        navigate(href);
      }}
    />
  );
}

function Demo({
  overflow,
  narrow = false,
}: {
  overflow?: "scroll" | "visible";
  narrow?: boolean;
}): ReactNode {
  const [path, setPath] = React.useState("/connections");
  // A slow page: the tab is current at once, with a pending bar, while the old page dims.
  const navigate = React.useCallback((href: string) => {
    window.setTimeout(() => setPath(href), 1200);
  }, []);
  return (
    <Wrapper className="block">
      <NavigateContext.Provider value={navigate}>
        <RouteTabsProvider>
          <div
            className={
              narrow
                ? "mx-auto flex w-full max-w-72 flex-col gap-4"
                : "flex flex-col gap-4"
            }
          >
            <RouteTabs
              label="Connections"
              tabs={narrow ? LONG_TABS : TABS}
              currentHref={path}
              overflow={overflow}
              linkRender={<DemoLink />}
            />
            <RouteTabsPanel className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              {PAGES[path]}
            </RouteTabsPanel>
          </div>
        </RouteTabsProvider>
      </NavigateContext.Provider>
    </Wrapper>
  );
}

/** Page tabs in a section layout: choose a tab — it is current at once, the old page dims. */
export function routeTabs(): ReactNode {
  return <Demo />;
}

/** A strip too long for its column scrolls sideways and keeps the current tab in view. */
export function routeTabsScroll(): ReactNode {
  return <Demo overflow="scroll" narrow />;
}
