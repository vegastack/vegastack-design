"use client";

import type { ReactNode } from "react";
import {
  AnimatedNumber,
  type AnimatedNumberProps,
} from "@/components/ui/animated-number";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type AnimatedNumberPlaygroundKey = "value" | "format" | "duration";

/** Widely spread presets so switching between them makes the tween clearly visible. */
const VALUE_OPTIONS = [
  { value: "1204", label: "1,204" },
  { value: "86400", label: "86,400" },
  { value: "1250000", label: "1,250,000" },
] as const;

const FORMAT_OPTIONS = [
  { value: "none", label: "Plain" },
  { value: "currency", label: "Currency (USD)" },
  { value: "compact", label: "Compact" },
] as const;

const DURATION_OPTIONS = [
  { value: "fast", label: "Fast" },
  { value: "base", label: "Base" },
  { value: "slow", label: "Slow" },
] as const;

/** Maps the format select to `Intl.NumberFormatOptions` (render) + the copyable prop (code). */
const FORMATS: Record<
  string,
  { options?: Intl.NumberFormatOptions; code?: string }
> = {
  none: {},
  currency: {
    options: { style: "currency", currency: "USD" },
    code: "format={{ style: 'currency', currency: 'USD' }}",
  },
  compact: {
    options: { notation: "compact" },
    code: "format={{ notation: 'compact' }}",
  },
};

const animatedNumberPlaygroundConfig: PlaygroundConfig<AnimatedNumberPlaygroundKey> =
  {
    controls: [
      {
        type: "select",
        key: "value",
        label: "Value",
        options: VALUE_OPTIONS,
        defaultValue: "1204",
      },
      {
        type: "select",
        key: "format",
        label: "Format",
        options: FORMAT_OPTIONS,
        defaultValue: "none",
      },
      {
        type: "select",
        key: "duration",
        label: "Duration",
        options: DURATION_OPTIONS,
        defaultValue: "base",
      },
    ],
    render: (state): ReactNode => (
      <AnimatedNumber
        value={Number(state.value)}
        format={FORMATS[String(state.format)]?.options}
        duration={state.duration as AnimatedNumberProps["duration"]}
      />
    ),
    toCode: (state) => {
      const props: string[] = [`value={${state.value}}`];
      const format = FORMATS[String(state.format)]?.code;
      if (format) props.push(format);
      if (state.duration !== "base") props.push(`duration="${state.duration}"`);
      return `<AnimatedNumber ${props.join(" ")} />`;
    },
  };

/**
 * `AnimatedNumberPlayground` — interactive props playground for `AnimatedNumber`
 * (value / format / duration), backed by the generic {@link PropsPlayground}. The initial render is
 * static (the component never animates on mount); picking a different value preset triggers the
 * tween. Registered in `mdx.tsx`, adopted in `content/docs/components/animated-number.mdx`.
 */
export function AnimatedNumberPlayground() {
  return <PropsPlayground {...animatedNumberPlaygroundConfig} />;
}
