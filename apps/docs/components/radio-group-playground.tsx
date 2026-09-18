"use client";

import type { ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type RadioGroupPlaygroundKey = "orientation" | "disabled" | "invalid";

const ORIENTATION_OPTIONS = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
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
      label: "Layout",
      options: ORIENTATION_OPTIONS,
      defaultValue: "vertical",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "invalid", label: "Invalid", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <RadioGroup
      defaultValue="comfortable"
      disabled={Boolean(state.disabled)}
      aria-label="Density"
      className={state.orientation === "horizontal" ? "grid-flow-col" : ""}
    >
      {DENSITY_OPTIONS.map((option) => (
        <Field
          key={option.value}
          orientation="horizontal"
          data-disabled={state.disabled ? true : undefined}
          data-invalid={state.invalid ? true : undefined}
        >
          <RadioGroupItem
            value={option.value}
            id={`density-${option.value}`}
            aria-invalid={state.invalid ? true : undefined}
          />
          <FieldLabel htmlFor={`density-${option.value}`}>
            {option.label}
          </FieldLabel>
        </Field>
      ))}
    </RadioGroup>
  ),
  toCode: (state) => {
    const groupProps: string[] = ['defaultValue="comfortable"'];
    if (state.orientation === "horizontal")
      groupProps.push('className="grid-flow-col"');
    if (state.disabled) groupProps.push("disabled");
    const itemProps = state.invalid ? " aria-invalid" : "";
    const fieldProps = [
      'orientation="horizontal"',
      state.disabled ? "data-disabled" : "",
      state.invalid ? "data-invalid" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const items = DENSITY_OPTIONS.map((option) =>
      [
        `  <Field ${fieldProps}>`,
        `    <RadioGroupItem value="${option.value}" id="${option.value}"${itemProps} />`,
        `    <FieldLabel htmlFor="${option.value}">${option.label}</FieldLabel>`,
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
 * `RadioGroupPlayground` — interactive props playground for `RadioGroup` (layout / disabled /
 * invalid), with three options each bound to a `FieldLabel`. Upstream's RadioGroup is a grid with
 * one item size and no `orientation` prop, so the layout control is a `grid-flow-col` className
 * rather than a prop. Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/radio-group.mdx`.
 */
export function RadioGroupPlayground() {
  return <PropsPlayground {...radioGroupPlaygroundConfig} />;
}
