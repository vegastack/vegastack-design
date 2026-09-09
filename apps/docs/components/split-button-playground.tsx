"use client";

import type { ReactNode } from "react";
import type { ButtonAppearance } from "@/components/ui/button";
import {
  SplitButton,
  type SplitButtonAction,
  type SplitButtonProps,
} from "@/components/ui/split-button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type SplitButtonPlaygroundKey =
  "variant" | "tone" | "size" | "destructiveAction" | "disabled" | "loading";

/** `variant` and `tone` pass straight through to both halves. */
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

/** The one size vocabulary, mirroring `Button`. */
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

// `destructive` is a per-action flag (`SplitButtonAction.destructive`), not a root prop — the
// "Destructive action" switch flips the second menu item between a plain and a destructive row.
const DEFAULT_ACTIONS: [SplitButtonAction, ...SplitButtonAction[]] = [
  { label: "Save and continue" },
  { label: "Save as draft" },
];
const DESTRUCTIVE_ACTIONS: [SplitButtonAction, ...SplitButtonAction[]] = [
  { label: "Save and continue" },
  { label: "Discard changes", destructive: true },
];

const splitButtonPlaygroundConfig: PlaygroundConfig<SplitButtonPlaygroundKey> =
  {
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
        type: "switch",
        key: "destructiveAction",
        label: "Destructive action",
        defaultValue: false,
      },
      {
        type: "switch",
        key: "disabled",
        label: "Disabled",
        defaultValue: false,
      },
      { type: "switch", key: "loading", label: "Loading", defaultValue: false },
    ],
    render: (state): ReactNode => (
      <SplitButton
        {...resolveAppearance(String(state.variant), String(state.tone))}
        size={state.size as SplitButtonProps["size"]}
        disabled={Boolean(state.disabled)}
        loading={Boolean(state.loading)}
        actions={
          state.destructiveAction ? DESTRUCTIVE_ACTIONS : DEFAULT_ACTIONS
        }
      >
        Save
      </SplitButton>
    ),
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
      const propsString = props.length > 0 ? `\n  ${props.join(" ")}` : "";
      const secondAction = state.destructiveAction
        ? `{ label: 'Discard changes', destructive: true },`
        : `{ label: 'Save as draft' },`;
      return `<SplitButton${propsString}
  actions={[
    { label: 'Save and continue' },
    ${secondAction}
  ]}
>
  Save
</SplitButton>`;
    },
  };

/**
 * `SplitButtonPlayground` — interactive props playground for `SplitButton` (pass-through
 * `variant` / `size`, `disabled` / `loading`, and a per-action `destructive` flag on the menu),
 * backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/split-button.mdx`.
 */
export function SplitButtonPlayground() {
  return <PropsPlayground {...splitButtonPlaygroundConfig} />;
}
