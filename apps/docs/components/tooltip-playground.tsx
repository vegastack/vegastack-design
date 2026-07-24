"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  type TooltipContentProps,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type TooltipPlaygroundKey = "side" | "arrow";

const SIDE_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
] as const;

const tooltipPlaygroundConfig: PlaygroundConfig<TooltipPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "side",
      label: "Side",
      options: SIDE_OPTIONS,
      defaultValue: "top",
    },
    { type: "switch", key: "arrow", label: "Arrow", defaultValue: false },
  ],
  // Renders CLOSED — the reader hovers or focuses the trigger to open it, so the
  // initial state is deterministic.
  render: (state): ReactNode => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent
        side={state.side as TooltipContentProps["side"]}
        arrow={Boolean(state.arrow)}
      >
        Add to your library
      </TooltipContent>
    </Tooltip>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.side !== "top") props.push(`side="${state.side}"`);
    if (state.arrow) props.push("arrow");
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return [
      "<Tooltip>",
      '  <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />',
      `  <TooltipContent${propsString}>Add to your library</TooltipContent>`,
      "</Tooltip>",
    ].join("\n");
  },
};

/**
 * `TooltipPlayground` — interactive props playground for `Tooltip` (`TooltipContent` side /
 * arrow), backed by the generic {@link PropsPlayground}. The tooltip renders closed; the reader
 * hovers or focuses the trigger to open it. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/tooltip.mdx`.
 */
export function TooltipPlayground() {
  return <PropsPlayground {...tooltipPlaygroundConfig} />;
}
