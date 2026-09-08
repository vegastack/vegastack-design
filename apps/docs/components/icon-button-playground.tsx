"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import type { ButtonAppearance } from "@/components/ui/button";
import { IconButton, type IconButtonProps } from "@/components/ui/icon-button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type IconButtonPlaygroundKey =
  "variant" | "tone" | "size" | "shape" | "disabled" | "loading";

/** The Button matrix passes straight through the wrapper. */
const VARIANT_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "soft", label: "Soft" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "link", label: "Link" },
] as const;

const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "destructive", label: "Destructive" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
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

/**
 * `solid` × `destructive` is the doctrine's one forbidden cell (a destructive action is never a
 * solid red button), so the playground resolves the pair to `soft` rather than silently ignoring
 * the tone.
 */
function resolveAppearance(variant: string, tone: string): ButtonAppearance {
  if (variant === "solid" && tone === "destructive") {
    return { variant: "soft", tone: "destructive" };
  }
  return { variant, tone } as ButtonAppearance;
}

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
      key: "tone",
      label: "Tone",
      options: TONE_OPTIONS,
      defaultValue: "neutral",
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
      {...resolveAppearance(String(state.variant), String(state.tone))}
      size={state.size as IconButtonProps["size"]}
      shape={state.shape as IconButtonProps["shape"]}
      disabled={Boolean(state.disabled)}
      loading={Boolean(state.loading)}
    >
      <Plus />
    </IconButton>
  ),
  toCode: (state) => {
    const appearance = resolveAppearance(
      String(state.variant),
      String(state.tone),
    ) as { variant: string; tone?: string };
    const props: string[] = ['aria-label="Add item"'];
    if (appearance.variant !== "solid") {
      props.push(`variant="${appearance.variant}"`);
    }
    if (appearance.tone != null && appearance.tone !== "neutral") {
      props.push(`tone="${appearance.tone}"`);
    }
    if (state.size !== "md") props.push(`size="${state.size}"`);
    if (state.shape !== "square") props.push(`shape="${state.shape}"`);
    if (state.disabled) props.push("disabled");
    if (state.loading) props.push("loading");
    return `<IconButton ${props.join(" ")}>\n  <Plus />\n</IconButton>`;
  },
};

/**
 * `IconButtonPlayground` — interactive props playground for `IconButton` (the pass-through
 * `variant × tone` matrix, the square `xs`/`sm`/`md`/`lg` scale, `shape`, `disabled` / `loading`),
 * backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/icon-button.mdx`.
 */
export function IconButtonPlayground() {
  return <PropsPlayground {...iconButtonPlaygroundConfig} />;
}
