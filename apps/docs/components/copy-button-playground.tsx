"use client";

import type { ReactNode } from "react";
import type { ButtonAppearance } from "@/components/ui/button";
import { CopyButton, type CopyButtonProps } from "@/components/ui/copy-button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type CopyButtonPlaygroundKey =
  | "variant"
  | "tone"
  | "size"
  | "showLabel"
  | "disabled";

/** The string written to the clipboard — fixed, so the playground stays a props explorer. */
const COPY_VALUE = "pnpm dlx shadcn@latest add @vegastack/button";

/** The Button matrix is forwarded unchanged; the component's own default is `ghost`. */
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

/** The one size vocabulary — without a visible label the control is a square `IconButton`. */
const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

/**
 * `solid` with the `destructive` tone is the doctrine's one forbidden cell, so the playground
 * resolves the pair to `soft` instead of ignoring the tone.
 */
function resolveAppearance(variant: string, tone: string): ButtonAppearance {
  if (variant === "solid" && tone === "destructive") {
    return { variant: "soft", tone: "destructive" };
  }
  return { variant, tone } as ButtonAppearance;
}

const copyButtonPlaygroundConfig: PlaygroundConfig<CopyButtonPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: VARIANT_OPTIONS,
      defaultValue: "ghost",
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
      defaultValue: "sm",
    },
    {
      type: "switch",
      key: "showLabel",
      label: "Show label",
      defaultValue: false,
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <CopyButton
      value={COPY_VALUE}
      {...resolveAppearance(String(state.variant), String(state.tone))}
      size={state.size as CopyButtonProps["size"]}
      showLabel={Boolean(state.showLabel)}
      disabled={Boolean(state.disabled)}
    />
  ),
  toCode: (state) => {
    const appearance = resolveAppearance(
      String(state.variant),
      String(state.tone),
    ) as { variant: string; tone?: string };
    const props: string[] = [`value="${COPY_VALUE}"`];
    // Component defaults are `ghost` / `sm` — omit them for minimal JSX.
    if (appearance.variant !== "ghost") {
      props.push(`variant="${appearance.variant}"`);
    }
    if (appearance.tone != null && appearance.tone !== "neutral") {
      props.push(`tone="${appearance.tone}"`);
    }
    if (state.size !== "sm") props.push(`size="${state.size}"`);
    if (state.showLabel) props.push("showLabel");
    if (state.disabled) props.push("disabled");
    return `<CopyButton ${props.join(" ")} />`;
  },
};

/**
 * `CopyButtonPlayground` — interactive props playground for `CopyButton` (pass-through `variant`
 * and square `size` axes plus `disabled`, over a fixed `value`), backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/copy-button.mdx`.
 */
export function CopyButtonPlayground() {
  return <PropsPlayground {...copyButtonPlaygroundConfig} />;
}
