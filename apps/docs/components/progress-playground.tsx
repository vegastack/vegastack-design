"use client";

import type { ReactNode } from "react";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ProgressPlaygroundKey = "value" | "readout";

/**
 * `indeterminate` is `value={null}` — the one non-numeric value the root accepts, and the state a
 * task of unknown extent reports.
 */
const VALUE_OPTIONS = [
  { value: "25", label: "25%" },
  { value: "50", label: "50%" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
  { value: "indeterminate", label: "Indeterminate" },
] as const;

const progressPlaygroundConfig: PlaygroundConfig<ProgressPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "value",
      label: "Value",
      options: VALUE_OPTIONS,
      defaultValue: "50",
    },
    // With the read-out off the bar has no visible name, so the generated JSX carries an
    // `aria-label` instead — which is the rule the Accessibility section states.
    {
      type: "switch",
      key: "readout",
      label: "Label and value",
      defaultValue: true,
    },
  ],
  render: (state): ReactNode => {
    const value =
      state.value === "indeterminate" ? null : Number(state.value as string);
    return (
      // The outer div is preview-only chrome (constrains the bar width); the generated JSX
      // mirrors the `Progress` element itself.
      <div className="w-full max-w-64">
        {state.readout ? (
          <Progress value={value}>
            <ProgressLabel>Upload progress</ProgressLabel>
            <ProgressValue />
          </Progress>
        ) : (
          <Progress value={value} aria-label="Upload progress" />
        )}
      </div>
    );
  },
  toCode: (state) => {
    const value = state.value === "indeterminate" ? "null" : state.value;
    if (!state.readout) {
      return `<Progress value={${value}} aria-label="Upload progress" />`;
    }
    return [
      `<Progress value={${value}}>`,
      "  <ProgressLabel>Upload progress</ProgressLabel>",
      "  <ProgressValue />",
      "</Progress>",
    ].join("\n");
  },
};

/**
 * `ProgressPlayground` — interactive props playground for `Progress`: the controlled `value`
 * (including the indeterminate `null`) and whether the bar carries its `ProgressLabel` /
 * `ProgressValue` read-out. Backed by the generic `PropsPlayground`, registered in `mdx.tsx`,
 * adopted in `content/docs/components/progress.mdx`.
 */
export function ProgressPlayground() {
  return <PropsPlayground {...progressPlaygroundConfig} />;
}
