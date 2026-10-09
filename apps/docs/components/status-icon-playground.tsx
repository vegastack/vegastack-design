"use client";

import type { ReactNode } from "react";
import { StatusIcon, type StatusIconProps } from "@/components/ui/status-icon";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type StatusIconPlaygroundKey = "status" | "size";

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "progress", label: "In progress" },
  { value: "review", label: "In review" },
  { value: "done", label: "Done" },
  { value: "canceled", label: "Canceled" },
  { value: "duplicate", label: "Duplicate" },
  { value: "triage", label: "Triage" },
] as const;

const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

const statusIconPlaygroundConfig: PlaygroundConfig<StatusIconPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "status",
      label: "Status",
      options: STATUS_OPTIONS,
      defaultValue: "todo",
    },
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "md",
    },
  ],
  render: (state): ReactNode => (
    <StatusIcon
      status={state.status as StatusIconProps["status"]}
      size={state.size as StatusIconProps["size"]}
    />
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.status !== "todo") props.push(`status="${state.status}"`);
    if (state.size !== "md") props.push(`size="${state.size}"`);
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return `<StatusIcon${propsString} />`;
  },
};

/**
 * `StatusIconPlayground` — interactive props playground for `StatusIcon` (status / size),
 * backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/status-icon.mdx`.
 */
export function StatusIconPlayground() {
  return <PropsPlayground {...statusIconPlaygroundConfig} />;
}
