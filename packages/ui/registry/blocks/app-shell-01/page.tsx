// @vegastack app-shell-01@0.23.10 sha256-yNbh9wMLke8B6drYkYfI2CyLB6OD9PUJTwZktn3UjYk=

import { Plus } from "lucide-react";

import { AppSidebar } from "./components/app-sidebar";
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellPage,
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
import { Item, ItemContent } from "@/components/ui/item";
import { PageHeader } from "@/components/ui/page-header";
import { Stat, StatLabel, StatValue } from "@/components/ui/stat";

const counts = [
  { label: "Active agents", value: 12, href: "/agents?status=active" },
  { label: "Open tasks", value: 1284, href: "/tasks?status=open" },
  { label: "Overdue tasks", value: 3, href: "/tasks?due=overdue" },
  { label: "Escalations", value: 7, href: "/tasks?escalated=true" },
];

/**
 * `app-shell-01` — the shell reference page: `AppShell`'s landmark trio and skip link, the rail
 * (`AppSidebar`), a breadcrumb banner, and a page of `PageHeader` h1 over linked stat tiles — each
 * count a link to the list it counts.
 *
 * Copy-once. Once a second route exists, move the `AppShell` composition into
 * `app/<segment>/layout.tsx` and leave each page its own `AppShellPage` — the shell then survives a
 * navigation instead of remounting with it. For a static shell that paints collapsed on first
 * load, put `SidebarStateScript` in the root layout's `<head>`.
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
        <AppShellHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Acme</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </AppShellHeader>
        <AppShellContent>
          <AppShellPage>
            <PageHeader
              title="Overview"
              description="What needs you today across Acme."
              actions={
                <Button>
                  <Plus />
                  New agent
                </Button>
              }
            />
            <section aria-label="Counts" className="@container">
              <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
                {counts.map((count) => (
                  <Item
                    key={count.label}
                    variant="outline"
                    render={<a href={count.href} />}
                  >
                    <ItemContent>
                      <Stat size="lg">
                        <StatLabel>{count.label}</StatLabel>
                        <StatValue>
                          {count.value.toLocaleString("en-US")}
                        </StatValue>
                      </Stat>
                    </ItemContent>
                  </Item>
                ))}
              </div>
            </section>
            <Card className="min-h-80">
              <CardHeader>
                <CardTitle render={<h2 />}>Your content</CardTitle>
                <CardDescription>
                  Replace this region with the page a route actually renders.
                  Everything around it — the rail, the banner, the skip link —
                  belongs in a shared layout once there is more than one route.
                </CardDescription>
              </CardHeader>
            </Card>
          </AppShellPage>
        </AppShellContent>
      </div>
    </AppShell>
  );
}
