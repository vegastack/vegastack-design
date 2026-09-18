"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type CheckboxPlaygroundKey = "disabled" | "indeterminate" | "invalid";

const checkboxPlaygroundConfig: PlaygroundConfig<CheckboxPlaygroundKey> = {
  controls: [
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    {
      type: "switch",
      key: "indeterminate",
      label: "Indeterminate",
      defaultValue: false,
    },
    { type: "switch", key: "invalid", label: "Invalid", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <Field
      orientation="horizontal"
      data-disabled={state.disabled ? true : undefined}
      data-invalid={state.invalid ? true : undefined}
    >
      <Checkbox
        id="checkbox-playground"
        disabled={Boolean(state.disabled)}
        indeterminate={Boolean(state.indeterminate)}
        aria-invalid={state.invalid ? true : undefined}
      />
      <FieldLabel htmlFor="checkbox-playground">Accept terms</FieldLabel>
    </Field>
  ),
  toCode: (state) => {
    const props: string[] = ['id="terms"'];
    if (state.disabled) props.push("disabled");
    if (state.indeterminate) props.push("indeterminate");
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
      `  <Checkbox ${props.join(" ")} />`,
      '  <FieldLabel htmlFor="terms">Accept terms</FieldLabel>',
      "</Field>",
    ].join("\n");
  },
};

/**
 * `CheckboxPlayground` — interactive props playground for `Checkbox` (disabled / indeterminate /
 * invalid), rendered inside a horizontal `Field` for a visible, bound label. Upstream's Checkbox
 * has one size, so the size control the fork carried is gone. Backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/checkbox.mdx`.
 */
export function CheckboxPlayground() {
  return <PropsPlayground {...checkboxPlaygroundConfig} />;
}
