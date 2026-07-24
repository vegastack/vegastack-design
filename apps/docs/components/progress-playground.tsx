"use client";

import type { ReactNode } from "react";
import { Progress, type ProgressProps } from "@/components/ui/progress";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ProgressPlaygroundKey = "value" | "size";

const VALUE_OPTIONS = [
  { value: "25", label: "25%" },
  { value: "50", label: "50%" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
] as const;

const SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
] as const;

const progressPlaygroundConfig: PlaygroundConfig<ProgressPlaygroundKey> = {
  controls: [
    // `value` starts at 50% (the component's own default is `null` = indeterminate; the
    // playground shows the determinate bar, so `value` is always emitted in the code).
    {
      type: "select",
      key: "value",
      label: "Value",
      options: VALUE_OPTIONS,
      defaultValue: "50",
    },
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
  ],
  render: (state): ReactNode => (
    // The outer div is preview-only chrome (constrains the bar width); the generated JSX
    // mirrors the `Progress` element itself.
    <div className="w-full max-w-64">
      <Progress
        value={Number(state.value)}
        size={state.size as ProgressProps["size"]}
        aria-label="Upload progress"
      />
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [`value={${state.value}}`];
    if (state.size !== "default") props.push(`size="${state.size}"`);
    props.push('aria-label="Upload progress"');
    return `<Progress ${props.join(" ")} />`;
  },
};

/**
 * `ProgressPlayground` — interactive props playground for `Progress` (value / size), backed by the
 * generic {@link PropsPlayground}. Changing the value sweeps the fill via the component's own
 * token-driven width transition. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/progress.mdx`.
 */
export function ProgressPlayground() {
  return <PropsPlayground {...progressPlaygroundConfig} />;
}
