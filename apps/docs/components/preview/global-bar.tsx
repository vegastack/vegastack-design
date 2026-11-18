"use client";

import type { ReactNode } from "react";
import { History, PanelLeft } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/global-bar` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  GlobalBar,
  GlobalBarCenter,
  GlobalBarHelp,
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

/** The whole bar: ▤, then ‹ › (the desktop app's), History and the search-or-ask box, then ? Help. */
export function globalBar(): ReactNode {
  return (
    // A shell container, as in the app: under 40rem (a phone) the bar hides itself.
    <Wrapper className="block overflow-hidden bg-shell-canvas p-0 @container/shell">
      <GlobalBar>
        <GlobalBarLeading>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Show or hide the column"
          >
            <PanelLeft />
          </Button>
        </GlobalBarLeading>
        <GlobalBarCenter>
          <GlobalBarHistory history={history} />
          <Button variant="ghost" size="icon-sm" aria-label="Recent">
            <History />
          </Button>
          <GlobalBarSearch
            label="Search or ask anything…"
            ask={{ label: "Ask William", onClick: () => {} }}
          />
        </GlobalBarCenter>
        <GlobalBarTrailing>
          <GlobalBarHelp dot="new updates" />
        </GlobalBarTrailing>
      </GlobalBar>
      <div className="mx-2 mb-2 h-24 rounded-block border border-border bg-shell-card" />
    </Wrapper>
  );
}

/**
 * The app's frame is a capsule zone: `GlobalBar` carries `capsule-scope`, so its search, Ask, Help
 * and History are pills and circles, and the search's fills sit 3px in on every side.
 */
export function shapeFrame(): ReactNode {
  return (
    <Wrapper className="block overflow-hidden bg-shell-canvas p-0 @container/shell">
      <GlobalBar>
        <GlobalBarLeading>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Show or hide the column"
          >
            <PanelLeft aria-hidden />
          </Button>
        </GlobalBarLeading>
        <GlobalBarCenter>
          <Button variant="ghost" size="icon-sm" aria-label="Recent">
            <History aria-hidden />
          </Button>
          <GlobalBarSearch
            label="Search or ask anything…"
            ask={{ label: "Ask William", onClick: () => {} }}
          />
        </GlobalBarCenter>
        <GlobalBarTrailing>
          <GlobalBarHelp />
        </GlobalBarTrailing>
      </GlobalBar>
    </Wrapper>
  );
}
