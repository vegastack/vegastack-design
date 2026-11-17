"use client";

import type { ReactNode } from "react";
import { ChevronsUpDown, CircleHelp, PanelLeft } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/global-bar` (dogfoods the registry) → auto-scanned.
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  GlobalBar,
  GlobalBarAsk,
  GlobalBarCenter,
  GlobalBarHistory,
  GlobalBarLeading,
  GlobalBarSearch,
  GlobalBarTrailing,
} from "@/components/ui/global-bar";

const history = {
  canGoBack: true,
  canGoForward: false,
  back: () => {},
  forward: () => {},
};

/** The whole bar: ▤, ‹ ›, the workspace · search (⌘K) · Ask (⌘J), Help, the account. */
export function globalBar(): ReactNode {
  return (
    <Wrapper className="block overflow-hidden p-0">
      <GlobalBar className="border-b border-sidebar-border">
        <GlobalBarLeading>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Show or hide the column"
          >
            <PanelLeft />
          </Button>
          <GlobalBarHistory history={history} />
          <Button variant="ghost" size="sm" className="gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="grid size-5 place-items-center rounded-tile bg-primary text-xs font-semibold text-primary-foreground"
            >
              A
            </span>
            Acme
            <ChevronsUpDown className="text-muted-foreground" />
          </Button>
        </GlobalBarLeading>
        <GlobalBarCenter>
          <GlobalBarSearch />
        </GlobalBarCenter>
        <GlobalBarTrailing>
          <GlobalBarAsk />
          <Button variant="ghost" size="icon-sm" aria-label="Help">
            <CircleHelp />
          </Button>
          <Avatar size="sm">
            <AvatarFallback aria-label="Manoj Kumar">MK</AvatarFallback>
          </Avatar>
        </GlobalBarTrailing>
      </GlobalBar>
      <div className="h-24 bg-background" />
    </Wrapper>
  );
}
