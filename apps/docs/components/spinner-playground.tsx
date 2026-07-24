"use client";

import type { ReactNode } from "react";
import { Spinner, type SpinnerProps } from "@/components/ui/spinner";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type SpinnerPlaygroundKey = "size";

// `inherit` is deliberately omitted: it renders NO size class and relies on a host's
// `[&_svg]` selector sizing (Button/Badge). Standalone in the playground it would
// collapse to the svg default and mislead — it only makes sense inside a sized parent.
const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
] as const;

const spinnerPlaygroundConfig: PlaygroundConfig<SpinnerPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
  ],
  render: (state): ReactNode => (
    <Spinner size={state.size as SpinnerProps["size"]} />
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.size !== "default") props.push(`size="${state.size}"`);
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return `<Spinner${propsString} />`;
  },
};

/**
 * `SpinnerPlayground` — interactive props playground for `Spinner` (size), backed by the
 * generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/spinner.mdx`.
 */
export function SpinnerPlayground() {
  return <PropsPlayground {...spinnerPlaygroundConfig} />;
}
