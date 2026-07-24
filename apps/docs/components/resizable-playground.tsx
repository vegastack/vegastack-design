"use client";

import type { ReactNode } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type ResizablePanelGroupProps,
} from "@/components/ui/resizable";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ResizablePlaygroundKey = "orientation" | "withHandle";

/** The group's split axis — the engine's prop is `orientation` (default `horizontal`). */
const ORIENTATION_OPTIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const;

const resizablePlaygroundConfig: PlaygroundConfig<ResizablePlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "orientation",
      label: "Orientation",
      options: ORIENTATION_OPTIONS,
      defaultValue: "horizontal",
    },
    {
      type: "switch",
      key: "withHandle",
      label: "With handle",
      defaultValue: false,
    },
  ],
  render: (state): ReactNode => (
    // Bounded-height wrapper — the group fills its parent at 100%/100%, so the parent
    // must own the height or the panels collapse to zero.
    <div className="h-48 w-full max-w-md">
      {/* The engine persists the dragged layout per group — keyed on `orientation` so an
          axis change remounts the group with a fresh default layout. */}
      <ResizablePanelGroup
        key={String(state.orientation)}
        orientation={
          state.orientation as ResizablePanelGroupProps["orientation"]
        }
        className="rounded-lg border"
      >
        <ResizablePanel defaultSize="40" minSize="20">
          <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
            One
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle={Boolean(state.withHandle)}
          aria-label="Resize panels"
        />
        <ResizablePanel minSize="20">
          <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
            Two
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  toCode: (state) => {
    const orientationProp =
      state.orientation !== "horizontal"
        ? ` orientation="${state.orientation}"`
        : "";
    const handleProp = state.withHandle ? " withHandle" : "";
    // Emit the bounded-height PARENT wrapper — the group's own inline `height: 100%`
    // overrides any `h-*` class placed on the group itself.
    return `<div className="h-48">
  <ResizablePanelGroup${orientationProp} className="rounded-lg border">
    <ResizablePanel defaultSize="40" minSize="20">One</ResizablePanel>
    <ResizableHandle${handleProp} aria-label="Resize panels" />
    <ResizablePanel minSize="20">Two</ResizablePanel>
  </ResizablePanelGroup>
</div>`;
  },
};

/**
 * `ResizablePlayground` — interactive props playground for the Resizable family
 * (`orientation` on the group, `withHandle` on the handle) with two labeled panels in a
 * bounded-height container, backed by the generic {@link PropsPlayground}. Registered in
 * `mdx.tsx`, adopted in `content/docs/components/resizable.mdx`.
 */
export function ResizablePlayground() {
  return <PropsPlayground {...resizablePlaygroundConfig} />;
}
