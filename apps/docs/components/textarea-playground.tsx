"use client";

import type { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type TextareaPlaygroundKey = "rows" | "disabled" | "invalid";

const ROW_OPTIONS = [
  { value: "2", label: "2 rows" },
  { value: "4", label: "4 rows" },
  { value: "8", label: "8 rows" },
] as const;

const textareaPlaygroundConfig: PlaygroundConfig<TextareaPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "rows",
      label: "Rows",
      options: ROW_OPTIONS,
      defaultValue: "4",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "invalid", label: "Invalid", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <div className="w-64">
      <Textarea
        rows={Number(state.rows)}
        placeholder="Tell us about your project…"
        aria-label="Project details"
        disabled={Boolean(state.disabled)}
        aria-invalid={state.invalid ? true : undefined}
      />
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [`rows={${state.rows}}`];
    props.push('placeholder="Tell us about your project…"');
    if (state.disabled) props.push("disabled");
    if (state.invalid) props.push('aria-invalid="true"');
    return `<Textarea ${props.join(" ")} />`;
  },
};

/**
 * `TextareaPlayground` — interactive props playground for `Textarea` (rows / disabled / invalid).
 * Upstream's Textarea has one size and always grows with its content (`field-sizing: content`),
 * so the two controls the fork carried for those axes are gone; `rows` sets the starting height.
 * Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/textarea.mdx`.
 */
export function TextareaPlayground() {
  return <PropsPlayground {...textareaPlaygroundConfig} />;
}
