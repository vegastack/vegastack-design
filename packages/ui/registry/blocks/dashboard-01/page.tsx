// @vegastack dashboard-01@0.2.0 sha256-qm7+2LKVAhfwH5v5FXl7Weku+tAmcp/QpP0RBAnmHOM=

/**
 * `page.tsx` — registry:page, target `app/dashboard/page.tsx`. The dashboard-01 block's sample
 * AI-platform dashboard (audit §e): `AppShell` + `AppSidebar` + `AppShellHeader` (a
 * `BreadcrumbTrail`) + content (`StatCards`, `DashboardChart`, `RecentActivity`), a full-page
 * `Empty` zero-state branch, and per-region loading/error handling.
 *
 * **Server-safe.** `DashboardPage` itself has no hooks and no `'use client'` — the interactive
 * pieces (`AppSidebar`'s nav-user menu, `StatCards`' `AnimatedNumber`, `DashboardChart`'s
 * Recharts composition, `RecentActivity`'s `DataList`/`RelativeTime`) are client leaves imported
 * as JSX, per the React Server Components boundary rules (`app-shell.tsx`'s `AppShellSkeleton`
 * doc walks through the same pattern for `SidebarMenuSkeleton`).
 *
 * **Zero Next.js imports** (house rule — keeps this file testable/previewable as plain React).
 * `AppSidebar`'s nav links and this file's breadcrumb link render as plain `<a>`; swap in your
 * router's `Link` via `render={<Link href={...} />}` at the call sites without touching structure.
 *
 * **View Transitions.** `AppShellHeader` below carries
 * `[view-transition-name:dashboard-shell-header]` (paired with `AppSidebar`'s
 * `dashboard-shell-sidebar` name) — see the block's docs page "View Transitions" section for the
 * full mechanism, the required `next.config.js` flag, and what a consuming app still has to wire
 * up itself (this single-route block can't demonstrate a real cross-route transition on its own).
 */

import { AlertTriangle, PlusCircle } from "lucide-react";
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
} from "@/components/ui/app-shell";
import { Breadcrumb, BreadcrumbTrail } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AppSidebar } from "./components/app-sidebar";
import { DashboardChart, type UsagePoint } from "./components/dashboard-chart";
import { RecentActivity, type ActivityRow } from "./components/recent-activity";
import { StatCards, type StatCardDatum } from "./components/stat-cards";
import sampleData from "./data.json";

const DEFAULT_DATA = sampleData as {
  stats: StatCardDatum[];
  usage: UsagePoint[];
  activity: ActivityRow[];
};

/** Props accepted by `DashboardPage`. */
export interface DashboardPageProps {
  /** Stat-card row data. @default bundled sample `data.json` */
  stats?: StatCardDatum[];
  /** "Usage over time" chart series. @default bundled sample `data.json` */
  usage?: UsagePoint[];
  /** Recent-activity rows. @default bundled sample `data.json` */
  activity?: ActivityRow[];
  /** Per-region loading flags — each region shows its own skeleton independently. @default {} */
  loading?: { stats?: boolean; chart?: boolean; activity?: boolean };
  /** Per-region error messages — each region shows an inline error `Empty` instead of its content. @default {} */
  error?: { stats?: string; chart?: string; activity?: string };
  /**
   * True when the workspace genuinely has no agents/tasks yet — renders a full-page `Empty`
   * zero-state instead of the stat/chart/activity regions (audit §e item 5, the block's own
   * responsibility, not `AppShell`'s).
   * @default false
   */
  isEmpty?: boolean;
}

/** One region's inline error state — an `Empty` in place of that region's normal content. */
function RegionError({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty size="sm" bordered>
      <EmptyHeader>
        <EmptyMedia intent="destructive">
          <AlertTriangle />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/**
 * A complete, editable dashboard starter composed on the shared `AppShell` landmarks.
 *
 * @example
 * <DashboardPage loading={{ activity: true }} />
 */
export function DashboardPage({
  stats = DEFAULT_DATA.stats,
  usage = DEFAULT_DATA.usage,
  activity = DEFAULT_DATA.activity,
  loading = {},
  error = {},
  isEmpty = false,
}: DashboardPageProps) {
  return (
    <AppShell defaultOpen>
      <AppSidebar activeKey="dashboard" />
      <div className="flex h-svh min-w-0 flex-1 flex-col">
        <AppShellHeader
          className="[view-transition-name:dashboard-shell-header]"
          actions={
            <Button size="sm">
              <PlusCircle />
              New agent
            </Button>
          }
        >
          <Breadcrumb>
            <BreadcrumbTrail
              items={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
            />
          </Breadcrumb>
        </AppShellHeader>

        <AppShellContent>
          {isEmpty ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <Empty size="lg">
                <EmptyHeader>
                  <EmptyMedia intent="info">
                    <PlusCircle />
                  </EmptyMedia>
                  <EmptyTitle>No agents yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first agent to start seeing usage, tasks, and
                    activity here.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button>
                    <PlusCircle />
                    New agent
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-4">
              {error.stats ? (
                <RegionError
                  title="Couldn't load stats"
                  description={error.stats}
                />
              ) : (
                <StatCards stats={stats} loading={loading.stats} />
              )}

              {error.chart ? (
                <RegionError
                  title="Couldn't load the usage chart"
                  description={error.chart}
                />
              ) : (
                <DashboardChart data={usage} loading={loading.chart} />
              )}

              {error.activity ? (
                <RegionError
                  title="Couldn't load recent activity"
                  description={error.activity}
                />
              ) : (
                <RecentActivity data={activity} loading={loading.activity} />
              )}
            </div>
          )}
        </AppShellContent>
      </div>
    </AppShell>
  );
}

// Next.js app-route target (`app/dashboard/page.tsx`) — route files REQUIRE a default
// export; the named export above stays for composition/tests.
export default DashboardPage;
