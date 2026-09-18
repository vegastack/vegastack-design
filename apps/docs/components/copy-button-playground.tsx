"use client";

import type { ReactNode } from "react";
import { CopyButton, type CopyButtonProps } from "@/components/ui/copy-button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type CopyButtonPlaygroundKey = "variant" | "size" | "showLabel" | "disabled";

/** The string written to the clipboard — fixed, so the playground stays a props explorer. */
const COPY_VALUE = "pnpm dlx shadcn@latest add @vegastack/button";

/** The Button matrix is forwarded unchanged; the component's own default is `ghost`. */
const VARIANT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "destructive", label: "Destructive" },
  { value: "link", label: "Link" },
] as const;

/**
 * The ICON tiers, because a CopyButton without a visible label is an icon-only control. Since
 * Batch 2 of the shadcn reset put `button.tsx` back on upstream, `xs`/`sm`/`lg` are TEXT tiers
 * (`h-6 px-2`, `h-7 px-2.5`, `h-9 px-2.5`) and the square ones are named `icon-*` — and `md` is
 * not a size at all, so that cell rendered with no height and no padding.
 */
const SIZE_OPTIONS = [
  { value: "icon-xs", label: "Extra small" },
  { value: "icon-sm", label: "Small" },
  { value: "icon", label: "Medium" },
  { value: "icon-lg", label: "Large" },
] as const;

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
      variant={state.variant as never}
      size={state.size as CopyButtonProps["size"]}
      showLabel={Boolean(state.showLabel)}
      disabled={Boolean(state.disabled)}
    />
  ),
  toCode: (state) => {
    const props: string[] = [`value="${COPY_VALUE}"`];
    // Component defaults are `ghost` / `sm` — omit them for minimal JSX.
    if (state.variant !== "ghost") props.push(`variant="${state.variant}"`);
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
