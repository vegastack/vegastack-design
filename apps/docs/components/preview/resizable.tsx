"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/resizable` (dogfoods the registry) → auto-scanned.
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";

function Pane({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-full items-center justify-center bg-muted p-4 text-base text-muted-foreground">
      {children}
    </div>
  );
}

/** Two panels, side by side — the default `orientation="horizontal"`. */
export function resizable(): ReactNode {
  return (
    <Wrapper>
      {/* Height lives on a PARENT wrapper — the group sets its own inline `height: 100%`
          (react-resizable-panels v4), so an `h-*` class on the group itself is ignored. */}
      <div className="h-56 w-full max-w-2xl">
        <ResizablePanelGroup className="rounded-lg border border-border">
          <ResizablePanel defaultSize="30" minSize="20">
            <Pane>Sidebar</Pane>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <Pane>Content</Pane>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Wrapper>
  );
}

/** `orientation="vertical"` stacks panels top-to-bottom; the handle bar goes horizontal. */
export function resizableVertical(): ReactNode {
  return (
    <Wrapper>
      <div className="h-64 w-full max-w-md">
        <ResizablePanelGroup
          orientation="vertical"
          className="rounded-lg border border-border"
        >
          <ResizablePanel defaultSize="35" minSize="15">
            <Pane>Header</Pane>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <Pane>Body</Pane>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Wrapper>
  );
}

/**
 * Nested groups — the right panel of the outer horizontal group contains its own
 * vertical group, so the top-right and bottom-right panes resize independently
 * of the split between the left panel and the right column.
 */
export function resizableNested(): ReactNode {
  return (
    <Wrapper>
      <div className="h-64 w-full max-w-2xl">
        <ResizablePanelGroup className="rounded-lg border border-border">
          <ResizablePanel defaultSize="30" minSize="20">
            <Pane>Sidebar</Pane>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="50" minSize="20">
                <Pane>Preview</Pane>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel>
                <Pane>Console</Pane>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Wrapper>
  );
}

/** `withHandle` renders a small grip glyph centered on the handle for a clearer drag affordance. */
export function resizableWithHandle(): ReactNode {
  return (
    <Wrapper>
      <div className="h-56 w-full max-w-2xl">
        <ResizablePanelGroup className="rounded-lg border border-border">
          <ResizablePanel defaultSize="50">
            <Pane>Left</Pane>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50">
            <Pane>Right</Pane>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Wrapper>
  );
}

/**
 * A `collapsible` sidebar — drag past `minSize` to collapse it, or use the
 * button (driven by the panel's imperative `panelRef`: `collapse()` / `expand()`).
 * `onResize` tracks the collapsed state to swap the button label and hide the
 * sidebar's own label once it has no room to render.
 */
function CollapsibleSidebarDemo(): ReactNode {
  const panelRef = useRef<PanelImperativeHandle>(null);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Wrapper>
      <div className="h-56 w-full max-w-2xl">
        <ResizablePanelGroup className="rounded-lg border border-border">
          <ResizablePanel
            panelRef={panelRef}
            collapsible
            collapsedSize="0"
            minSize="15"
            defaultSize="25"
            maxSize="40"
            onResize={(size) => setCollapsed(size.asPercentage === 0)}
          >
            <Pane>{collapsed ? "" : "Sidebar"}</Pane>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <div className="flex size-full flex-col items-center justify-center gap-3 p-4">
              <p className="text-base text-muted-foreground">Main content</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (collapsed) {
                    panelRef.current?.expand();
                  } else {
                    panelRef.current?.collapse();
                  }
                }}
              >
                {collapsed ? "Show sidebar" : "Hide sidebar"}
              </Button>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Wrapper>
  );
}

export function resizableCollapsible(): ReactNode {
  return <CollapsibleSidebarDemo />;
}
