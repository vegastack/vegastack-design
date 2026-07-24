"use client";

import type { ReactNode } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProps,
  type TabsListProps,
} from "@/components/ui/tabs";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type TabsPlaygroundKey = "variant" | "orientation";

const VARIANT_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "pill", label: "Pill" },
] as const;

const ORIENTATION_OPTIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const;

const tabsPlaygroundConfig: PlaygroundConfig<TabsPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: VARIANT_OPTIONS,
      defaultValue: "line",
    },
    {
      type: "select",
      key: "orientation",
      label: "Orientation",
      options: ORIENTATION_OPTIONS,
      defaultValue: "horizontal",
    },
  ],
  render: (state): ReactNode => (
    <Tabs
      defaultValue="overview"
      orientation={state.orientation as TabsProps["orientation"]}
      className="w-full max-w-md"
    >
      <TabsList variant={state.variant as TabsListProps["variant"]}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview content</TabsContent>
      <TabsContent value="activity">Activity content</TabsContent>
      <TabsContent value="settings">Settings content</TabsContent>
    </Tabs>
  ),
  toCode: (state) => {
    const rootProps =
      state.orientation !== "horizontal"
        ? ` orientation="${state.orientation}"`
        : "";
    const listProps =
      state.variant !== "line" ? ` variant="${state.variant}"` : "";
    return [
      `<Tabs defaultValue="overview"${rootProps}>`,
      `  <TabsList${listProps}>`,
      '    <TabsTrigger value="overview">Overview</TabsTrigger>',
      '    <TabsTrigger value="activity">Activity</TabsTrigger>',
      '    <TabsTrigger value="settings">Settings</TabsTrigger>',
      "  </TabsList>",
      '  <TabsContent value="overview">Overview content</TabsContent>',
      '  <TabsContent value="activity">Activity content</TabsContent>',
      '  <TabsContent value="settings">Settings content</TabsContent>',
      "</Tabs>",
    ].join("\n");
  },
};

/**
 * `TabsPlayground` — interactive props playground for `Tabs` (list variant / root orientation),
 * backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/tabs.mdx`.
 */
export function TabsPlayground() {
  return <PropsPlayground {...tabsPlaygroundConfig} />;
}
