"use client";

import type { ReactNode } from "react";
import { BarChart3, Database, Sparkles, Workflow } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/navigation-menu` (dogfoods the registry) → auto-scanned.
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuGridLink,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function navigationMenu(): ReactNode {
  return (
    <Wrapper className="min-h-72 items-start justify-center pt-4">
      <NavigationMenu aria-label="Example site navigation">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-md grid-cols-2 gap-1">
                <NavigationMenuGridLink
                  href="#nav-ai"
                  title="Ask AI"
                  description="Search and create with AI"
                  icon={<Sparkles />}
                />
                <NavigationMenuGridLink
                  href="#nav-data"
                  title="Data model"
                  description="Sync and enrich your data"
                  icon={<Database />}
                />
                <NavigationMenuGridLink
                  href="#nav-workflows"
                  title="Workflows"
                  description="Orchestrate any revenue motion"
                  icon={<Workflow />}
                />
                <NavigationMenuGridLink
                  href="#nav-reporting"
                  title="Reporting"
                  description="Insights in real time"
                  icon={<BarChart3 />}
                />
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="flex w-56 flex-col gap-1">
                <NavigationMenuGridLink href="#nav-blog" title="Blog" />
                <NavigationMenuGridLink
                  href="#nav-changelog"
                  title="Changelog"
                />
                <NavigationMenuGridLink href="#nav-help" title="Help center" />
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#nav-pricing">Pricing</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuPanel />
      </NavigationMenu>
    </Wrapper>
  );
}
