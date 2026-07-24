"use client";

import type { ReactNode } from "react";
import { NotificationBell } from "@/components/ui/notification-bell";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type NotificationBellPlaygroundKey = "count" | "dot";

// `0` hides the badge entirely; values above 99 overflow to the "99+" label.
const COUNT_OPTIONS = [
  { value: "0", label: "0 (no badge)" },
  { value: "3", label: "3" },
  { value: "120", label: "120 (caps to 99+)" },
] as const;

const notificationBellPlaygroundConfig: PlaygroundConfig<NotificationBellPlaygroundKey> =
  {
    controls: [
      {
        type: "select",
        key: "count",
        label: "Count",
        options: COUNT_OPTIONS,
        defaultValue: "0",
      },
      { type: "switch", key: "dot", label: "Dot", defaultValue: false },
    ],
    render: (state): ReactNode => (
      <NotificationBell count={Number(state.count)} dot={Boolean(state.dot)} />
    ),
    toCode: (state) => {
      const props: string[] = [];
      if (state.count !== "0") props.push(`count={${state.count}}`);
      if (state.dot) props.push("dot");
      const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
      return `<NotificationBell${propsString} />`;
    },
  };

/**
 * `NotificationBellPlayground` — interactive props playground for `NotificationBell`
 * (count including the 99+ overflow cap, and the minimal dot mode — `dot` replaces the
 * numeric badge whenever count > 0), backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/notification-bell.mdx`.
 */
export function NotificationBellPlayground() {
  return <PropsPlayground {...notificationBellPlaygroundConfig} />;
}
