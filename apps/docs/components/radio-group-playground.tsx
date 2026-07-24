"use client";

import type { ReactNode } from "react";
import {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
  type RadioGroupItemProps,
} from "@/components/ui/radio-group";
import { Field } from "@/components/ui/field";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type RadioGroupPlaygroundKey = "orientation" | "size" | "disabled";

const ORIENTATION_OPTIONS = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
] as const;

const SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "sm", label: "Small" },
] as const;

const DENSITY_OPTIONS = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
  { value: "spacious", label: "Spacious" },
] as const;

const radioGroupPlaygroundConfig: PlaygroundConfig<RadioGroupPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "orientation",
      label: "Orientation",
      options: ORIENTATION_OPTIONS,
      defaultValue: "vertical",
    },
    {
      type: "select",
      key: "size",
      label: "Item size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <RadioGroup
      defaultValue="comfortable"
      orientation={state.orientation as RadioGroupProps["orientation"]}
      disabled={Boolean(state.disabled)}
      aria-label="Density"
    >
      {DENSITY_OPTIONS.map((option) => (
        <Field key={option.value} label={option.label} orientation="horizontal">
          <RadioGroupItem
            value={option.value}
            size={state.size as RadioGroupItemProps["size"]}
          />
        </Field>
      ))}
    </RadioGroup>
  ),
  toCode: (state) => {
    const groupProps: string[] = ['defaultValue="comfortable"'];
    if (state.orientation !== "vertical")
      groupProps.push(`orientation="${state.orientation}"`);
    if (state.disabled) groupProps.push("disabled");
    const itemProps = state.size !== "default" ? ` size="${state.size}"` : "";
    const items = DENSITY_OPTIONS.map((option) =>
      [
        `  <Field label="${option.label}" orientation="horizontal">`,
        `    <RadioGroupItem value="${option.value}"${itemProps} />`,
        "  </Field>",
      ].join("\n"),
    );
    return [
      `<RadioGroup ${groupProps.join(" ")}>`,
      ...items,
      "</RadioGroup>",
    ].join("\n");
  },
};

/**
 * `RadioGroupPlayground` — interactive props playground for `RadioGroup` (orientation / item
 * size / disabled), with three options each labeled via a horizontal `Field`. Backed by the
 * generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/radio-group.mdx`.
 */
export function RadioGroupPlayground() {
  return <PropsPlayground {...radioGroupPlaygroundConfig} />;
}
