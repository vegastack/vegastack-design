"use client";

import type { ReactNode } from "react";
import { Kbd, type KbdProps } from "@/components/ui/kbd";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type KbdPlaygroundKey = "size" | "os";

const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
] as const;

const OS_OPTIONS = [
  { value: "mac", label: "Mac" },
  { value: "other", label: "Other (Win/Linux)" },
] as const;

// A mod+K combo so the `os` control visibly swaps the modifier chip:
// `os="mac"` (the default) renders the ⌘ glyph, `os="other"` rewrites it to "Ctrl".
const COMBO = ["⌘", "K"] as const;

const kbdPlaygroundConfig: PlaygroundConfig<KbdPlaygroundKey> = {
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
      key: "os",
      label: "Platform",
      options: OS_OPTIONS,
      defaultValue: "mac",
    },
  ],
  render: (state): ReactNode => (
    <Kbd
      keys={COMBO}
      size={state.size as KbdProps["size"]}
      os={state.os as KbdProps["os"]}
    />
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.size !== "default") props.push(`size="${state.size}"`);
    if (state.os !== "mac") props.push(`os="${state.os}"`);
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return `<Kbd keys={['⌘', 'K']}${propsString} />`;
  },
};

/**
 * `KbdPlayground` — interactive props playground for `Kbd` (size / os), rendered as a
 * ⌘K combo so the platform rewrite is visible, backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/kbd.mdx`.
 */
export function KbdPlayground() {
  return <PropsPlayground {...kbdPlaygroundConfig} />;
}
