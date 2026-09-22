// @vegastack app-shell-01@0.11.0 sha256-LJstjcrTWmV/3BEpxc95rH8R3ArIlID56KJMpJON25g=

import { Plus } from "lucide-react";

import { AppSidebar } from "./components/app-sidebar";
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
} from "@/components/ui/app-shell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { label: "Active agents", value: "12", note: "+2 this week" },
  { label: "Tasks completed", value: "1,284", note: "+18.2%" },
  { label: "Avg. resolution", value: "4m 12s", note: "-31s" },
  { label: "Escalations", value: "7", note: "-3" },
];

/**
 * `app-shell-01` — the shell starter page: `AppShell`'s landmark trio and skip link, the
 * collapsible rail, a breadcrumb banner and a content grid of sample cards.
 *
 * Copy-once. Once a second route exists, move the `AppShell` composition into
 * `app/<segment>/layout.tsx` and leave each page its own content — the shell then survives a
 * navigation instead of remounting with it.
 *
 * @example
 * // app/dashboard/page.tsx, straight after `shadcn add @vegastack/app-shell-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <AppShell>
      <AppSidebar />
      <div className="flex h-svh min-w-0 flex-1 flex-col">
        <AppShellHeader
          actions={
            <Button size="sm">
              <Plus />
              New agent
            </Button>
          }
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Acme</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </AppShellHeader>
        <AppShellContent>
          <div className="grid gap-4 p-4 @sm/app-shell-content:grid-cols-2 @4xl/app-shell-content:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {stat.value}
                  </CardTitle>
                  <CardDescription>{stat.note}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Card className="min-h-80">
              <CardHeader>
                <CardTitle>Your content</CardTitle>
                <CardDescription>
                  Replace this region with the page a route actually renders.
                  Everything above it — the rail, the banner, the skip link —
                  belongs in a shared layout once there is more than one route.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </AppShellContent>
      </div>
    </AppShell>
  );
}
