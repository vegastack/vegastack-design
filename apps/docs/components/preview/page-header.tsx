"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/page-header` (dogfoods the registry) → auto-scanned.
import { FilterBar, FilterBarFacet } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Wrapper } from "./wrapper";

export function pageHeader(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        title="Spaces"
        description="Organize work into shared spaces."
        favorite={{ defaultActive: true }}
        actions={<Button>New space</Button>}
      />
    </Wrapper>
  );
}

export function pageHeaderWithBreadcrumb(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        backHref="#"
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Workspace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>API Keys</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title="API Keys"
        description="Manage keys for this workspace."
        actions={
          <>
            <Button variant="outline">Docs</Button>
            <Button>Create key</Button>
          </>
        }
      />
    </Wrapper>
  );
}

export function pageHeaderMinimal(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader title="Profile" />
    </Wrapper>
  );
}

export function pageHeaderBack(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        title="Select plan"
        description="Choose a plan to continue. The back button closes the picker."
        onBack={() => {
          // app-local imperative action, e.g. closePlanPicker()
        }}
        actions={<Button>Continue</Button>}
      />
    </Wrapper>
  );
}

export function pageHeaderSecondaryMenu(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        title="Spaces"
        description="The overflow menu renders to the right of the actions."
        actions={<Button>New space</Button>}
        secondaryMenu={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="icon" variant="ghost" aria-label="More actions">
                  <MoreVertical />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </Wrapper>
  );
}

export function pageHeaderLongTitle(): ReactNode {
  return (
    <Wrapper className="block">
      {/* Constrained to demonstrate truncation regardless of viewport width — in a real app the
          title row shrinks naturally against the page's own width. */}
      <div className="mx-auto w-full max-w-sm">
        <PageHeader
          title="Q3 Platform Reliability & Performance Engineering Initiative Retrospective"
          description="An overlong tenant or workspace title truncates instead of overflowing, and reveals in full on hover or focus (tap on touch)."
          actions={<Button>Export</Button>}
        />
      </div>
    </Wrapper>
  );
}

/**
 * DS-02: `backRender` takes the framework's link element — here a stand-in for Next.js `Link` —
 * and gives it the back affordance's classes, label and chevron.
 */
function RouterLink(props: ComponentProps<"a">) {
  // A real app passes `<Link href="…" />`; the preview keeps navigation inside the page.
  return <a {...props} onClick={(event) => event.preventDefault()} />;
}

export function pageHeaderBackRender(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        backRender={<RouterLink href="/products" />}
        backLabel="Back to products"
        title="Linen shirt"
        description="The back link navigates client-side through the router's own Link."
      />
    </Wrapper>
  );
}

/** DS-02: `titleLines="none"` lets a record's name wrap instead of clipping. */
export function pageHeaderWrappingTitle(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <PageHeader
          title="Q3 Platform Reliability & Performance Engineering Initiative Retrospective"
          titleLines="none"
          actions={<Button>Export</Button>}
        />
      </div>
    </Wrapper>
  );
}

/** DS-02: `meta` is a `<div>` row, so it can hold badges and interactive controls. */
export function pageHeaderMeta(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        title="Onboarding redesign"
        meta={
          <>
            <Badge variant="secondary">In progress</Badge>
            <span>Updated 2 hours ago</span>
            <Button variant="outline" size="xs">
              Owner: Asha Rao
            </Button>
          </>
        }
        actions={<Button>Share</Button>}
      />
    </Wrapper>
  );
}

export function pageHeaderFavoriteControlled(): ReactNode {
  const [starred, setStarred] = useState(false);
  return (
    <Wrapper className="block">
      <div className="flex flex-col gap-6">
        {/* Controlled — the host owns the starred state */}
        <PageHeader
          title="Q3 Roadmap"
          description={`Controlled star — currently ${starred ? "starred" : "not starred"}.`}
          favorite={{ active: starred, onToggle: setStarred }}
        />
        {/* Disabled — toggle removed from the tab order */}
        <PageHeader
          title="Archived doc"
          description="Disabled star — non-interactive and out of the tab order."
          favorite={{ defaultActive: true, disabled: true }}
        />
      </div>
    </Wrapper>
  );
}

export function pageHeaderTabs(): ReactNode {
  const [scope, setScope] = useState("mine");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  return (
    <Wrapper className="block space-y-4">
      <PageHeader
        title="Tasks"
        actions={<Button>New task</Button>}
        tabs={
          <Tabs value={scope} onValueChange={(next) => setScope(String(next))}>
            <TabsList aria-label="Tasks to show">
              <TabsTrigger value="mine">My tasks</TabsTrigger>
              <TabsTrigger value="created">Created by me</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />
      {/* The layout switch is the toolbar's, not the header's: it ends the FilterBar's first row. */}
      <FilterBar
        aria-label="Task toolbar"
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks",
        }}
        facets={
          <FilterBarFacet<{ id: string }>
            label="Status"
            items={[{ id: "Open" }, { id: "Done" }]}
            value={null}
            onValueChange={() => {}}
            itemToKey={(o) => o.id}
            itemToStringLabel={(o) => o.id}
          />
        }
        view={
          <ViewToggle
            value={view}
            onValueChange={setView}
            views={["list", "board"]}
          />
        }
      />
    </Wrapper>
  );
}
