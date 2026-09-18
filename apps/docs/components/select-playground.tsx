"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type SelectPlaygroundKey = "size" | "disabled" | "invalid";

/** Upstream's two trigger size tiers. */
const SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
] as const;

const FONTS = [
  { value: "sans", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
];

const selectPlaygroundConfig: PlaygroundConfig<SelectPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "size",
      label: "Trigger size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "invalid", label: "Invalid", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <div className="w-56">
      <Select
        items={FONTS}
        defaultValue="serif"
        disabled={Boolean(state.disabled)}
      >
        <SelectTrigger
          size={state.size === "sm" ? "sm" : "default"}
          aria-label="Font family"
          aria-invalid={state.invalid ? true : undefined}
          className="w-full"
        >
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {FONTS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
  toCode: (state) => {
    const rootProps = state.disabled ? " disabled" : "";
    const triggerProps = [
      state.size !== "default" ? ` size="${state.size}"` : "",
      state.invalid ? " aria-invalid" : "",
    ].join("");
    return [
      "const fonts = [",
      '  { value: "sans", label: "Sans-serif" },',
      '  { value: "serif", label: "Serif" },',
      '  { value: "mono", label: "Monospace" },',
      "];",
      "",
      `<Select items={fonts} defaultValue="serif"${rootProps}>`,
      `  <SelectTrigger${triggerProps} aria-label="Font family">`,
      '    <SelectValue placeholder="Select a font" />',
      "  </SelectTrigger>",
      "  <SelectContent>",
      "    <SelectGroup>",
      '      <SelectItem value="sans">Sans-serif</SelectItem>',
      '      <SelectItem value="serif">Serif</SelectItem>',
      '      <SelectItem value="mono">Monospace</SelectItem>',
      "    </SelectGroup>",
      "  </SelectContent>",
      "</Select>",
    ].join("\n");
  },
};

/**
 * `SelectPlayground` — interactive props playground for `Select` (trigger size / disabled /
 * invalid) over a small option list. Backed by the generic {@link PropsPlayground}. Registered in
 * `mdx.tsx`, adopted in `content/docs/components/select.mdx`.
 */
export function SelectPlayground() {
  return <PropsPlayground {...selectPlaygroundConfig} />;
}
