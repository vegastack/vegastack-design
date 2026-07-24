"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  type CardProps,
} from "@/components/ui/card";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type CardPlaygroundKey = "size";

const SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "sm", label: "Small" },
] as const;

const cardPlaygroundConfig: PlaygroundConfig<CardPlaygroundKey> = {
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
    // Width comes from the wrapper (preview layout only) so the Card itself
    // carries nothing beyond the props shown in the generated snippet.
    <div className="w-full max-w-sm">
      <Card size={state.size as CardProps["size"]}>
        <CardHeader>
          <CardTitle>Team plan</CardTitle>
          <CardDescription>$20 / user / month</CardDescription>
        </CardHeader>
        <CardContent>Everything in Pro, plus SSO and audit logs.</CardContent>
      </Card>
    </div>
  ),
  toCode: (state) => {
    const sizeProp = state.size !== "default" ? ` size="${state.size}"` : "";
    return [
      `<Card${sizeProp}>`,
      "  <CardHeader>",
      "    <CardTitle>Team plan</CardTitle>",
      "    <CardDescription>$20 / user / month</CardDescription>",
      "  </CardHeader>",
      "  <CardContent>Everything in Pro, plus SSO and audit logs.</CardContent>",
      "</Card>",
    ].join("\n");
  },
};

/**
 * `CardPlayground` — interactive props playground for `Card` (size density), rendered as a
 * title + description + content composition, backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/card.mdx`.
 */
export function CardPlayground() {
  return <PropsPlayground {...cardPlaygroundConfig} />;
}
