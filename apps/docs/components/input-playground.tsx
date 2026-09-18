"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type InputPlaygroundKey = "type" | "disabled" | "invalid";

const TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "password", label: "Password" },
] as const;

const inputPlaygroundConfig: PlaygroundConfig<InputPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "type",
      label: "Type",
      options: TYPE_OPTIONS,
      defaultValue: "text",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "invalid", label: "Invalid", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <div className="w-64">
      <Input
        type={state.type as string}
        placeholder="you@vegastack.com"
        aria-label="Email"
        disabled={Boolean(state.disabled)}
        aria-invalid={state.invalid ? true : undefined}
      />
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.type !== "text") props.push(`type="${state.type}"`);
    props.push('placeholder="you@vegastack.com"');
    if (state.disabled) props.push("disabled");
    if (state.invalid) props.push('aria-invalid="true"');
    return `<Input ${props.join(" ")} />`;
  },
};

/**
 * `InputPlayground` — interactive props playground for `Input` (type / disabled / invalid).
 * Upstream's Input has one size, so the size control the fork carried is gone; a taller or
 * shorter field is a `className` decision. Backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/input.mdx`.
 */
export function InputPlayground() {
  return <PropsPlayground {...inputPlaygroundConfig} />;
}
