"use client";

import type { ReactNode } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ScrollAreaPlaygroundKey = "axis";

/*
 * There is no `orientation` prop any more. Upstream's `ScrollArea` renders ONE vertical `ScrollBar`
 * and a `Corner` for you; the other axis is a `ScrollBar orientation="horizontal"` written beside
 * the content, inside the viewport. So the knob here picks which axis the CONTENT overflows on, and
 * the generated JSX shows the one composition step that follows from it.
 */
const AXIS_OPTIONS = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "both", label: "Both" },
] as const;

/** Deterministic overflow content — 14 fixed rows (tall) with fixed copy (wide when un-wrapped). */
const ROWS = Array.from(
  { length: 14 },
  (_, i) => `Changeset ${String(i + 1).padStart(2, "0")}`,
);

const TAGS = [
  "design-tokens",
  "registry",
  "a11y-audit",
  "motion",
  "typography",
  "icons",
  "dark-mode",
  "vrt-baselines",
] as const;

/** The bounding classes per axis — the constraint is what makes the content overflow. */
function boxClassName(axis: string | boolean): string {
  return axis === "horizontal"
    ? "w-56 rounded-md border"
    : "h-40 w-56 rounded-md border";
}

function overflowContent(axis: string | boolean): ReactNode {
  if (axis === "horizontal") {
    return (
      <div className="flex w-max gap-2 p-3">
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-muted px-2 py-1 text-sm whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }
  if (axis === "both") {
    return (
      <div className="flex w-max flex-col gap-1 p-3">
        {ROWS.map((row) => (
          <p key={row} className="text-sm whitespace-nowrap">
            {row} — semantic token sweep across every registry component
          </p>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 p-3">
      {ROWS.map((row) => (
        <p key={row} className="text-sm">
          {row} — token sweep
        </p>
      ))}
    </div>
  );
}

const scrollAreaPlaygroundConfig: PlaygroundConfig<ScrollAreaPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "axis",
      label: "Overflow axis",
      options: AXIS_OPTIONS,
      defaultValue: "vertical",
    },
  ],
  render: (state): ReactNode => (
    <ScrollArea className={boxClassName(state.axis)} aria-label="Changesets">
      {overflowContent(state.axis)}
      {state.axis !== "vertical" && <ScrollBar orientation="horizontal" />}
    </ScrollArea>
  ),
  toCode: (state) => {
    const horizontal =
      state.axis === "vertical"
        ? ""
        : '\n  <ScrollBar orientation="horizontal" />';
    return `<ScrollArea className="${boxClassName(state.axis)}" aria-label="Changesets">
  {/* overflowing content */}${horizontal}
</ScrollArea>`;
  },
};

/**
 * `ScrollAreaPlayground` — interactive playground for `ScrollArea`, backed by the generic
 * `PropsPlayground`. The knob picks the axis the content overflows on: each setting renders
 * deterministic content that overflows on exactly that axis, and the horizontal settings add the
 * one `ScrollBar` upstream asks you to compose. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/scroll-area.mdx`.
 */
export function ScrollAreaPlayground() {
  return <PropsPlayground {...scrollAreaPlaygroundConfig} />;
}
