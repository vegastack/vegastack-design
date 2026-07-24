"use client";

import type { ReactNode } from "react";
import {
  Bubble,
  BubbleContent,
  type BubbleProps,
} from "@/components/ui/bubble";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type BubblePlaygroundKey = "variant" | "align" | "animateIn";

/** The seven token-driven surface skins. */
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
      key: "animateIn",
      label: "Animate in",
      defaultValue: false,
    },
  ],
  render: (state): ReactNode => (
    // Full-width flex column so `align="end"` can self-align the bubble to the end edge.
    <div className="flex w-full max-w-md flex-col">
      {/* Keyed on the serialized control state so every control change remounts the bubble —
          with `animateIn` on, the `motion-enter-up` entrance replays instead of staying
          static after the first mount. Defaults are all-off, so nothing animates on load. */}
      <Bubble
        key={`${state.variant}-${state.align}-${state.animateIn}`}
        variant={state.variant as BubbleProps["variant"]}
        align={state.align as BubbleProps["align"]}
        animateIn={Boolean(state.animateIn)}
      >
        <BubbleContent>On my way — be there in five.</BubbleContent>
      </Bubble>
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.variant !== "default") props.push(`variant="${state.variant}"`);
    if (state.align !== "start") props.push(`align="${state.align}"`);
    if (state.animateIn) props.push("animateIn");
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return `<Bubble${propsString}>\n  <BubbleContent>On my way — be there in five.</BubbleContent>\n</Bubble>`;
  },
};

/**
 * `BubblePlayground` — interactive props playground for `Bubble` (`variant`, `align`,
 * `animateIn`, remounting on each change so the entrance replays), backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/bubble.mdx`.
 */
export function BubblePlayground() {
  return <PropsPlayground {...bubblePlaygroundConfig} />;
}
