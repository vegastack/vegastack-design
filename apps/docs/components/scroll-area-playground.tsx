"use client";

import type { ReactNode } from "react";
import { ScrollArea, type ScrollAreaProps } from "@/components/ui/scroll-area";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ScrollAreaPlaygroundKey = "orientation";

const ORIENTATION_OPTIONS = [
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

/** The bounding classes per orientation — the constraint is what makes the content overflow. */
function boxClassName(orientation: string | boolean): string {
  return orientation === "horizontal"
    ? "w-56 rounded-md border"
    : "h-40 w-56 rounded-md border";
}

function overflowContent(orientation: string | boolean): ReactNode {
  if (orientation === "horizontal") {
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
  if (orientation === "both") {
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
      key: "orientation",
      label: "Orientation",
      options: ORIENTATION_OPTIONS,
      defaultValue: "vertical",
    },
  ],
  render: (state): ReactNode => (
    <ScrollArea
      orientation={state.orientation as ScrollAreaProps["orientation"]}
      className={boxClassName(state.orientation)}
      aria-label="Changesets"
    >
      {overflowContent(state.orientation)}
    </ScrollArea>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.orientation !== "vertical")
      props.push(`orientation="${state.orientation}"`);
    props.push(`className="${boxClassName(state.orientation)}"`);
    props.push('aria-label="Changesets"');
    return `<ScrollArea ${props.join(" ")}>
  {/* overflowing content */}
</ScrollArea>`;
  },
};

/**
 * `ScrollAreaPlayground` — interactive props playground for `ScrollArea` (orientation), backed by
 * the generic {@link PropsPlayground}. Each orientation renders deterministic content that
 * overflows on exactly the matching axis (or both), so the custom scrollbar(s) always engage.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/scroll-area.mdx`.
 */
export function ScrollAreaPlayground() {
  return <PropsPlayground {...scrollAreaPlaygroundConfig} />;
}
