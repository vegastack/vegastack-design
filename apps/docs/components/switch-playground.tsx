"use client";

import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type SwitchPlaygroundKey = "size" | "disabled" | "invalid";

/** Upstream's two size tiers. */
const SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
] as const;

const switchPlaygroundConfig: PlaygroundConfig<SwitchPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "invalid", label: "Invalid", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <Field
      orientation="horizontal"
      data-disabled={state.disabled ? true : undefined}
      data-invalid={state.invalid ? true : undefined}
    >
      <Switch
        id="switch-playground"
        size={state.size === "sm" ? "sm" : "default"}
        disabled={Boolean(state.disabled)}
        aria-invalid={state.invalid ? true : undefined}
      />
      <FieldLabel htmlFor="switch-playground">Email notifications</FieldLabel>
    </Field>
  ),
  toCode: (state) => {
    const props: string[] = ['id="notifications"'];
    if (state.size !== "default") props.push(`size="${state.size}"`);
    if (state.disabled) props.push("disabled");
    if (state.invalid) props.push("aria-invalid");
    const fieldProps = [
      'orientation="horizontal"',
      state.disabled ? "data-disabled" : "",
      state.invalid ? "data-invalid" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return [
      `<Field ${fieldProps}>`,
      `  <Switch ${props.join(" ")} />`,
      '  <FieldLabel htmlFor="notifications">Email notifications</FieldLabel>',
      "</Field>",
    ].join("\n");
  },
};

/**
 * `SwitchPlayground` — interactive props playground for `Switch` (size / disabled / invalid),
 * rendered inside a horizontal `Field` for a visible, bound label. Backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/switch.mdx`.
 */
export function SwitchPlayground() {
  return <PropsPlayground {...switchPlaygroundConfig} />;
}
