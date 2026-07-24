"use client";

import type { ReactNode } from "react";
import { OTPInput, type OTPInputProps } from "@/components/ui/otp-input";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type OTPInputPlaygroundKey = "length" | "size" | "mask" | "disabled";

/** `length` is a real numeric prop (default 6) — select values are strings, converted on render. */
const LENGTH_OPTIONS = [
  { value: "4", label: "4 digits" },
  { value: "6", label: "6 digits" },
] as const;

/** The shared 28/32/40 control scale. */
const SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
] as const;

const otpInputPlaygroundConfig: PlaygroundConfig<OTPInputPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "length",
      label: "Length",
      options: LENGTH_OPTIONS,
      defaultValue: "6",
    },
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    { type: "switch", key: "mask", label: "Mask", defaultValue: false },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <OTPInput
      aria-label="Verification code"
      length={Number(state.length)}
      size={state.size as OTPInputProps["size"]}
      mask={Boolean(state.mask)}
      disabled={Boolean(state.disabled)}
    />
  ),
  toCode: (state) => {
    const props: string[] = ['aria-label="Verification code"'];
    if (state.length !== "6") props.push(`length={${state.length}}`);
    if (state.size !== "default") props.push(`size="${state.size}"`);
    if (state.mask) props.push("mask");
    if (state.disabled) props.push("disabled");
    return `<OTPInput ${props.join(" ")} />`;
  },
};

/**
 * `OTPInputPlayground` — interactive props playground for `OTPInput` (`length`, `size`, `mask`,
 * `disabled`), backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted
 * in `content/docs/components/otp-input.mdx`.
 */
export function OTPInputPlayground() {
  return <PropsPlayground {...otpInputPlaygroundConfig} />;
}
