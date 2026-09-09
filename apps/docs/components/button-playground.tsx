"use client";

import type { ReactNode } from "react";
import { Button, type ButtonAppearance } from "@/components/ui/button";
import { MarketingSurface } from "@/components/ui/marketing-surface";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ButtonPlaygroundKey = "variant" | "tone" | "size" | "disabled" | "loading";

/** The six shapes. `cta` is brand-locked and ignores `tone`. */
const VARIANT_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "soft", label: "Soft" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "link", label: "Link" },
  { value: "cta", label: "CTA" },
] as const;

/** The five hues every non-`cta` variant can carry. */
const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "destructive", label: "Destructive" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
] as const;

/** The one size vocabulary — the same names the `--size-*` tokens carry. */
const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

/**
 * The doctrine's one forbidden cell: a destructive action is never a solid red button. The type
 * makes it unreachable in source; the playground resolves the pair to `soft` so the control set
 * stays fully explorable instead of silently doing nothing.
 */
function resolveAppearance(variant: string, tone: string): ButtonAppearance {
  if (variant === "cta") return { variant: "cta" };
  if (variant === "solid" && tone === "destructive") {
    return { variant: "soft", tone: "destructive" };
  }
  return { variant, tone } as ButtonAppearance;
}

const buttonPlaygroundConfig: PlaygroundConfig<ButtonPlaygroundKey> = {
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
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "loading", label: "Loading", defaultValue: false },
  ],
  render: (state): ReactNode => {
    const button = (
      <Button
        {...resolveAppearance(String(state.variant), String(state.tone))}
        size={state.size as "xs" | "sm" | "md" | "lg"}
        disabled={Boolean(state.disabled)}
        loading={Boolean(state.loading)}
      >
        Save changes
      </Button>
    );
    // `cta` is the marketing recipe (design.md §Brand & marketing), so the playground shows it on
    // the ground it is written for rather than on the plain docs page. Before this the CTA
    // rendered straight onto the light page — which is where its 3.41:1 label was shipping live.
    return state.variant === "cta" ? (
      <MarketingSurface className="flex w-full justify-center rounded-lg px-6 py-8">
        {button}
      </MarketingSurface>
    ) : (
      button
    );
  },
  toCode: (state) => {
    const appearance = resolveAppearance(
      String(state.variant),
      String(state.tone),
    ) as { variant: string; tone?: string };
    const props: string[] = [];
    if (appearance.variant !== "solid") {
      props.push(`variant="${appearance.variant}"`);
    }
    if (appearance.tone != null && appearance.tone !== "neutral") {
      props.push(`tone="${appearance.tone}"`);
    }
    if (state.size !== "md") props.push(`size="${state.size}"`);
    if (state.disabled) props.push("disabled");
    if (state.loading) props.push("loading");
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    const element = `<Button${propsString}>Save changes</Button>`;
    return appearance.variant === "cta"
      ? `<MarketingSurface>\n  ${element}\n</MarketingSurface>`
      : element;
  },
};

/**
 * `ButtonPlayground` — interactive props playground for `Button` covering the full
 * `variant × tone` matrix and all four sizes, plus `disabled` / `loading`. Backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/button.mdx`.
 */
export function ButtonPlayground() {
  return <PropsPlayground {...buttonPlaygroundConfig} />;
}
