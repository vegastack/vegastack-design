"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { IconButton, type IconButtonProps } from "@/components/ui/icon-button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type IconButtonPlaygroundKey =
  "variant" | "size" | "shape" | "disabled" | "loading";

/** The Button matrix passes straight through the wrapper. */
const VARIANT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "destructive", label: "Destructive" },
  { value: "link", label: "Link" },
] as const;

/** The square scale — the one `xs`/`sm`/`md`/`lg` vocabulary. */
const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

const SHAPE_OPTIONS = [
  { value: "square", label: "Square" },
  { value: "round", label: "Round" },
] as const;

const iconButtonPlaygroundConfig: PlaygroundConfig<IconButtonPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: VARIANT_OPTIONS,
      defaultValue: "solid",
    },
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "md",
    },
    {
      type: "select",
      key: "shape",
      label: "Shape",
      options: SHAPE_OPTIONS,
      defaultValue: "square",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "loading", label: "Loading", defaultValue: false },
  ],
  render: (state): ReactNode => (
    // `aria-label` is mandatory (compile-time guarantee) — baked in, not a control.
    <IconButton
      aria-label="Add item"
      variant={state.variant as never}
      size={state.size as IconButtonProps["size"]}
      shape={state.shape as IconButtonProps["shape"]}
      disabled={Boolean(state.disabled)}
      loading={Boolean(state.loading)}
    >
      <Plus />
    </IconButton>
  ),
  toCode: (state) => {
    const props: string[] = ['aria-label="Add item"'];
    if (state.variant !== "default") props.push(`variant="${state.variant}"`);
    if (state.size !== "md") props.push(`size="${state.size}"`);
    if (state.shape !== "square") props.push(`shape="${state.shape}"`);
    if (state.disabled) props.push("disabled");
    if (state.loading) props.push("loading");
    return `<IconButton ${props.join(" ")}>\n  <Plus />\n</IconButton>`;
  },
};

/**
 * `IconButtonPlayground` — interactive props playground for `IconButton` (the pass-through
 * `variant` axis, the square `xs`/`sm`/`md`/`lg` scale, `shape`, `disabled` / `loading`),
 * backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/icon-button.mdx`.
 */
export function IconButtonPlayground() {
  return <PropsPlayground {...iconButtonPlaygroundConfig} />;
}
