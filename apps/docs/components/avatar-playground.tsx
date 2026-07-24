"use client";

import type { ReactNode } from "react";
import {
  Avatar,
  AvatarGroup,
  type AvatarProps,
  type AvatarGroupProps,
} from "@/components/ui/avatar";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type AvatarPlaygroundKey = "size" | "spacing";

const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
] as const;

const SPACING_OPTIONS = [
  { value: "tight", label: "Tight" },
  { value: "default", label: "Default" },
  { value: "loose", label: "Loose" },
] as const;

const avatarPlaygroundConfig: PlaygroundConfig<AvatarPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    {
      type: "select",
      key: "spacing",
      label: "Group spacing",
      options: SPACING_OPTIONS,
      defaultValue: "default",
    },
  ],
  // Initials fallbacks only (no remote images) — the render is fully deterministic,
  // so a fresh page load (and VRT) never depends on the network.
  render: (state): ReactNode => (
    <AvatarGroup spacing={state.spacing as AvatarGroupProps["spacing"]}>
      <Avatar size={state.size as AvatarProps["size"]} fallback="AL" />
      <Avatar size={state.size as AvatarProps["size"]} fallback="GH" />
      <Avatar size={state.size as AvatarProps["size"]} fallback="+3" />
    </AvatarGroup>
  ),
  toCode: (state) => {
    const sizeProp = state.size !== "default" ? ` size="${state.size}"` : "";
    const spacingProp =
      state.spacing !== "default" ? ` spacing="${state.spacing}"` : "";
    return [
      `<AvatarGroup${spacingProp}>`,
      `  <Avatar${sizeProp} fallback="AL" />`,
      `  <Avatar${sizeProp} fallback="GH" />`,
      `  <Avatar${sizeProp} fallback="+3" />`,
      "</AvatarGroup>",
    ].join("\n");
  },
};

/**
 * `AvatarPlayground` — interactive props playground for `Avatar` (size) and `AvatarGroup`
 * (spacing), rendered as a three-avatar stack with initials fallbacks, backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in `content/docs/components/avatar.mdx`.
 */
export function AvatarPlayground() {
  return <PropsPlayground {...avatarPlaygroundConfig} />;
}
