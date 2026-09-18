"use client";

import type { ReactNode } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverHeader,
} from "@/components/ui/popover";
import type { PopoverContentProps } from "@/lib/api-props";
import { Button } from "@/components/ui/button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type PopoverPlaygroundKey = "side" | "align";

const SIDE_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
] as const;

const ALIGN_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
] as const;

const popoverPlaygroundConfig: PlaygroundConfig<PopoverPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "side",
      label: "Side",
      options: SIDE_OPTIONS,
      defaultValue: "bottom",
    },
    {
      type: "select",
      key: "align",
      label: "Align",
      options: ALIGN_OPTIONS,
      defaultValue: "center",
    },
  ],
  // Renders CLOSED — the reader opens it via the trigger, so the initial state is deterministic.
  render: (state): ReactNode => (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline">Open popover</Button>}
      />
      <PopoverContent
        side={state.side as PopoverContentProps["side"]}
        align={state.align as PopoverContentProps["align"]}
      >
        <PopoverHeader>
          <PopoverTitle>About this layer</PopoverTitle>
          <PopoverDescription>
            Floats arbitrary content next to the trigger.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.side !== "bottom") props.push(`side="${state.side}"`);
    if (state.align !== "center") props.push(`align="${state.align}"`);
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return [
      "<Popover>",
      '  <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />',
      `  <PopoverContent${propsString}>`,
      "    <PopoverHeader>",
      "      <PopoverTitle>About this layer</PopoverTitle>",
      "      <PopoverDescription>Floats arbitrary content next to the trigger.</PopoverDescription>",
      "    </PopoverHeader>",
      "  </PopoverContent>",
      "</Popover>",
    ].join("\n");
  },
};

/**
 * `PopoverPlayground` — interactive props playground for `Popover` (`PopoverContent` side /
 * align), backed by the generic `PropsPlayground`. The popover renders closed; the reader
 * opens it from the trigger. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/popover.mdx`.
 */
export function PopoverPlayground() {
  return <PropsPlayground {...popoverPlaygroundConfig} />;
}
