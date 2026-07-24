"use client";

import type { ReactNode } from "react";
import { Bold } from "lucide-react";
import { Toggle, type ToggleProps } from "@/components/ui/toggle";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type TogglePlaygroundKey = "size" | "disabled" | "defaultPressed";

/** One look, three sizes — `Toggle` has no variant axis by design. */
const SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
] as const;

const togglePlaygroundConfig: PlaygroundConfig<TogglePlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    {
      type: "switch",
      key: "defaultPressed",
      label: "Default pressed",
      defaultValue: false,
    },
  ],
  render: (state): ReactNode => (
    // `defaultPressed` is an uncontrolled initial value — it only applies on mount, so the
    // Toggle is keyed on it to remount (and re-read the new initial state) when the control flips.
    <Toggle
      key={String(state.defaultPressed)}
      size={state.size as ToggleProps["size"]}
      disabled={Boolean(state.disabled)}
      defaultPressed={Boolean(state.defaultPressed)}
      aria-label="Toggle bold"
    >
      <Bold />
    </Toggle>
  ),
  toCode: (state) => {
    const props: string[] = ['aria-label="Toggle bold"'];
    if (state.size !== "default") props.push(`size="${state.size}"`);
    if (state.defaultPressed) props.push("defaultPressed");
    if (state.disabled) props.push("disabled");
    return `<Toggle ${props.join(" ")}>\n  <Bold />\n</Toggle>`;
  },
};

/**
 * `TogglePlayground` — interactive props playground for `Toggle` (`size`, `disabled`,
 * `defaultPressed`), backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/toggle.mdx`.
 */
export function TogglePlayground() {
  return <PropsPlayground {...togglePlaygroundConfig} />;
}
