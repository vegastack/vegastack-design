"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type TabsPlaygroundKey = "variant" | "orientation";

/**
 * Upstream's whole variant set. `default` is the grey pill track AND the default value, so the
 * generated JSX omits it; `line` is the only one worth spelling out at a call site.
 */
const VARIANT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "line", label: "Line" },
] as const;

const ORIENTATION_OPTIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const;

type TabsListVariant = (typeof VARIANT_OPTIONS)[number]["value"];
type TabsOrientation = (typeof ORIENTATION_OPTIONS)[number]["value"];

const tabsPlaygroundConfig: PlaygroundConfig<TabsPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: VARIANT_OPTIONS,
      defaultValue: "default",
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
      orientation={state.orientation as TabsOrientation}
      className="w-full max-w-md"
    >
      <TabsList variant={state.variant as TabsListVariant}>
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
      state.variant !== "default" ? ` variant="${state.variant}"` : "";
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
 * `TabsPlayground` — interactive props playground for `Tabs`: the list's two upstream variants and
 * the root's two orientations, backed by the generic `PropsPlayground`. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/tabs.mdx`.
 */
export function TabsPlayground() {
  return <PropsPlayground {...tabsPlaygroundConfig} />;
}
