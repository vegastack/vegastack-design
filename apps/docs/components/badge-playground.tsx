"use client";

import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type BadgePlaygroundKey =
  "variant" | "intent" | "size" | "dot" | "bordered" | "loading" | "animateIn";

const VARIANT_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "soft", label: "Soft" },
  { value: "outline", label: "Outline" },
  { value: "minimal", label: "Minimal" },
] as const;

const INTENT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "destructive", label: "Destructive" },
  { value: "info", label: "Info" },
] as const;

const SIZE_OPTIONS = [
  { value: "sm", label: "Small (16px)" },
  { value: "md", label: "Medium (20px)" },
  { value: "lg", label: "Large (24px)" },
] as const;

const badgePlaygroundConfig: PlaygroundConfig<BadgePlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: VARIANT_OPTIONS,
      defaultValue: "soft",
    },
    {
      type: "select",
      key: "intent",
      label: "Intent",
      options: INTENT_OPTIONS,
      defaultValue: "default",
    },
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "md",
    },
    { type: "switch", key: "dot", label: "Dot", defaultValue: false },
    { type: "switch", key: "bordered", label: "Bordered", defaultValue: false },
    { type: "switch", key: "loading", label: "Loading", defaultValue: false },
    {
      type: "switch",
      key: "animateIn",
      label: "Animate in",
      defaultValue: false,
    },
  ],
  render: (state): ReactNode => (
    // Keyed on the serialized state so every control change REMOUNTS the badge:
    // `animateIn` is a mount animation (`motion-pop-in`), so without the remount
    // it would only ever play once — the key makes each change replay the
    // entrance while the deterministic initial state stays a plain default badge.
    <Badge
      key={JSON.stringify(state)}
      variant={state.variant as BadgeProps["variant"]}
      intent={state.intent as BadgeProps["intent"]}
      size={state.size as BadgeProps["size"]}
      dot={Boolean(state.dot)}
      bordered={Boolean(state.bordered)}
      loading={Boolean(state.loading)}
      animateIn={Boolean(state.animateIn)}
    >
      Active
    </Badge>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.variant !== "soft") props.push(`variant="${state.variant}"`);
    if (state.intent !== "default") props.push(`intent="${state.intent}"`);
    if (state.size !== "md") props.push(`size="${state.size}"`);
    // `minimal` carries the dot by default, so the switch only earns a prop when it
    // DISAGREES with the variant's own default.
    if (state.dot !== (state.variant === "minimal")) {
      props.push(state.dot ? "dot" : "dot={false}");
    }
    if (state.bordered) props.push("bordered");
    if (state.loading) props.push("loading");
    if (state.animateIn) props.push("animateIn");
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return `<Badge${propsString}>Active</Badge>`;
  },
};

/**
 * `BadgePlayground` — interactive props playground for `Badge` (variant / intent / size /
 * dot / bordered / loading / animateIn), backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/badge.mdx`.
 */
export function BadgePlayground() {
  return <PropsPlayground {...badgePlaygroundConfig} />;
}
