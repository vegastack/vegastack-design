"use client";

import type { ComponentProps, ReactNode } from "react";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type BubblePlaygroundKey = "variant" | "align" | "reactions";

/** Upstream's seven surface skins. */
const VARIANT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "secondary", label: "Secondary" },
  { value: "muted", label: "Muted" },
  { value: "tinted", label: "Tinted" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "destructive", label: "Destructive" },
] as const;

const ALIGN_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
] as const;

type BubbleOwnProps = ComponentProps<typeof Bubble>;

const bubblePlaygroundConfig: PlaygroundConfig<BubblePlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: VARIANT_OPTIONS,
      defaultValue: "default",
    },
    {
      type: "select",
      key: "align",
      label: "Align",
      options: ALIGN_OPTIONS,
      defaultValue: "start",
    },
    {
      type: "switch",
      key: "reactions",
      label: "Reactions",
      defaultValue: false,
    },
  ],
  render: (state): ReactNode => (
    // Full-width flex column so `align="end"` can self-align the bubble to the end edge, with room
    // below for the reactions chip, which hangs outside the bubble's own box.
    <div className="flex w-full max-w-md flex-col pb-4">
      <Bubble
        variant={state.variant as BubbleOwnProps["variant"]}
        align={state.align as BubbleOwnProps["align"]}
      >
        <BubbleContent>On my way — be there in five.</BubbleContent>
        {state.reactions ? (
          <BubbleReactions align={state.align as "start" | "end"}>
            👍 3
          </BubbleReactions>
        ) : null}
      </Bubble>
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.variant !== "default") props.push(`variant="${state.variant}"`);
    if (state.align !== "start") props.push(`align="${state.align}"`);
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    const reactions = state.reactions
      ? `\n  <BubbleReactions${state.align !== "end" ? ` align="${state.align}"` : ""}>👍 3</BubbleReactions>`
      : "";
    return `<Bubble${propsString}>\n  <BubbleContent>On my way — be there in five.</BubbleContent>${reactions}\n</Bubble>`;
  },
};

/**
 * `BubblePlayground` — interactive props playground for `Bubble` (`variant`, `align`, and the
 * `BubbleReactions` chip), backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/bubble.mdx`.
 */
export function BubblePlayground() {
  return <PropsPlayground {...bubblePlaygroundConfig} />;
}
