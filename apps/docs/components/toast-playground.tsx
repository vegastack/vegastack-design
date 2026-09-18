"use client";

import type { ReactNode } from "react";
// `toast` is re-exported from the copied-in Toast component. The `<Toaster />`
// itself is already mounted in the docs provider (mirrors `VegaStackProvider`),
// so the playground just calls toast() — no local toaster needed.
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ToastPlaygroundKey = "type" | "description" | "action";

type ToastType = "default" | "success" | "error" | "warning" | "info";

const TYPE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
] as const;

/** Title + optional description per type, mirrored verbatim into `toCode`. */
const TOAST_CONTENT: Record<
  ToastType,
  { message: string; description: string }
> = {
  default: {
    message: "Event created",
    description: "Friday, June 26 at 10:00",
  },
  success: { message: "Project deployed", description: "main@a1f7c2 is live" },
  error: {
    message: "Could not save changes",
    description: "Check your connection and try again",
  },
  warning: {
    message: "Storage is almost full",
    description: "9.2 GB of 10 GB used",
  },
  info: {
    message: "A new version is available",
    description: "v2.4.0 — refresh to update",
  },
};

function fireToast(
  type: ToastType,
  withDescription: boolean,
  withAction: boolean,
) {
  const { message, description } = TOAST_CONTENT[type];
  // Fired ONLY from the button click — control changes never auto-fire a toast.
  // Upstream's manager is `toast.add({ … })`; `type` drives the status icon, and
  // `error` is announced urgently through `priority: "high"`.
  const id = toast.add({
    title: message,
    ...(withDescription ? { description } : {}),
    ...(type === "default" ? {} : { type }),
    ...(type === "error" ? { priority: "high" as const } : {}),
    ...(withAction
      ? {
          actionProps: {
            children: "Undo",
            onClick: () => {
              toast.close(id);
            },
          },
        }
      : {}),
  });
}

const toastPlaygroundConfig: PlaygroundConfig<ToastPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "type",
      label: "Type",
      options: TYPE_OPTIONS,
      defaultValue: "default",
    },
    {
      type: "switch",
      key: "description",
      label: "Description",
      defaultValue: false,
    },
    { type: "switch", key: "action", label: "Action", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <Button
      variant="outline"
      onClick={() =>
        fireToast(
          state.type as ToastType,
          Boolean(state.description),
          Boolean(state.action),
        )
      }
    >
      Show toast
    </Button>
  ),
  toCode: (state) => {
    const type = state.type as ToastType;
    const { message, description } = TOAST_CONTENT[type];
    const lines = [`  title: "${message}",`];
    if (state.description) lines.push(`  description: "${description}",`);
    if (type !== "default") lines.push(`  type: "${type}",`);
    if (type === "error") lines.push(`  priority: "high",`);
    if (state.action) {
      lines.push(
        "  actionProps: {",
        '    children: "Undo",',
        "    onClick() {",
        "      toast.close(id);",
        "    },",
        "  },",
      );
    }
    const open = state.action ? "const id = toast.add({" : "toast.add({";
    return [open, ...lines, "});"].join("\n");
  },
};

/**
 * `ToastPlayground` — interactive props playground for Toast (the `toast` registry item): pick a
 * `type`, an optional description and an optional action, then fire it from the button through
 * upstream's imperative manager, `toast.add({ … })`. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/toast.mdx`.
 */
export function ToastPlayground() {
  return <PropsPlayground {...toastPlaygroundConfig} />;
}
