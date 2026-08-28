"use client";

/**
 * `preview/dashboard-01.tsx` — the docs live-preview demo for the `dashboard-01` registry block.
 *
 * Imports the REAL block source directly from `packages/ui/registry/blocks/dashboard-01/` (a
 * cross-package relative import, not a copy) rather than re-composing its parts by hand — the
 * block hasn't gone through `shadcn add` into `apps/docs/components/ui/*` (there is nothing to
 * "add": this preview demonstrates the pre-install block itself), so there is no copy-in to import
 * from the way other component previews do. `DashboardPage` (server-safe itself) internally
 * imports its `AppSidebar`/`StatCards`/`DashboardChart`/`RecentActivity` client leaves via
 * `@/components/ui/*` — those aliases resolve, from ANY file in the docs app's module graph
 * (including this cross-package import), to the already-copied-in `apps/docs/components/ui/*`
 * components, exactly like every other preview in this file.
 *
 * Fixed, non-fullscreen frame (same convention as `preview/app-shell.tsx`'s `appShellDemo`) so the
 * whole composed shell is visible without the demo taking over the docs page.
 */

import type { ReactNode } from "react";
import { DashboardPage } from "../../../../packages/ui/registry/blocks/dashboard-01/page";
import { Wrapper } from "./wrapper";
import { usePreviewFrameWidth } from "../preview-controls";

export function dashboard01Demo(): ReactNode {
  return (
    <Wrapper className="block h-136 overflow-hidden p-0">
      <DashboardPage />
    </Wrapper>
  );
}

/**
 * Frame-responsive navigation. The docs width control constrains a container, not `matchMedia`, so
 * this demo reads the selected frame preset and forces the block's AppShell rail into its modal
 * Sheet at the mobile preset. Toggle the toolbar's phone icon to watch the rail collapse; wider
 * presets keep the default viewport behaviour.
 */
export function dashboard01MobileDemo(): ReactNode {
  const frameWidth = usePreviewFrameWidth();
  return (
    <Wrapper className="block h-136 overflow-hidden p-0">
      <DashboardPage
        mobileBreakpoint={frameWidth === "mobile" ? 10000 : undefined}
        className="h-full min-h-0"
      />
    </Wrapper>
  );
}

/** The full-page zero-state branch (audit §e item 5) — no agents/tasks yet. */
export function dashboard01EmptyDemo(): ReactNode {
  return (
    <Wrapper className="block h-104 overflow-hidden p-0">
      <DashboardPage isEmpty />
    </Wrapper>
  );
}

/** Per-region loading — the stat row, chart, and recent-activity list each show their own skeleton. */
export function dashboard01LoadingDemo(): ReactNode {
  return (
    <Wrapper className="block h-136 overflow-hidden p-0">
      <DashboardPage loading={{ stats: true, chart: true, activity: true }} />
    </Wrapper>
  );
}
