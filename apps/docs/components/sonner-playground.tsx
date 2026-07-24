"use client";

import type { ReactNode } from "react";
// `toast` is re-exported from the copied-in Sonner component. The `<Toaster />`
// itself is already mounted in the docs provider (mirrors `VegaStackProvider`),
// so the playground just calls toast() — no local toaster needed.
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type SonnerPlaygroundKey = "intent" | "description";

type ToastIntent = "default" | "success" | "error" | "warning" | "info";

const INTENT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
] as const;

/** Message + optional description per intent, mirrored verbatim into `toCode`. */
const TOAST_CONTENT: Record<
  ToastIntent,
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

function fireToast(intent: ToastIntent, withDescription: boolean) {
  const { message, description } = TOAST_CONTENT[intent];
  const options = withDescription ? { description } : undefined;
  // Fired ONLY from the button click — control changes never auto-fire a toast.
  if (intent === "default") toast(message, options);
  else toast[intent](message, options);
}

const sonnerPlaygroundConfig: PlaygroundConfig<SonnerPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "intent",
      label: "Intent",
      options: INTENT_OPTIONS,
      defaultValue: "default",
    },
    {
      type: "switch",
      key: "description",
      label: "Description",
      defaultValue: false,
    },
  ],
  render: (state): ReactNode => (
    <Button
      variant="outline"
      onClick={() =>
        fireToast(state.intent as ToastIntent, Boolean(state.description))
      }
    >
      Show toast
    </Button>
  ),
  toCode: (state) => {
    const intent = state.intent as ToastIntent;
    const { message, description } = TOAST_CONTENT[intent];
    const fn = intent === "default" ? "toast" : `toast.${intent}`;
    const args = state.description
      ? `"${message}", { description: "${description}" }`
      : `"${message}"`;
    return `${fn}(${args});`;
  },
};

/**
 * `SonnerPlayground` — interactive props playground for Toast (the `sonner` registry item):
 * pick an intent (`toast()` / `toast.success` / `toast.error` / `toast.warning` / `toast.info`)
 * and an optional description, then fire it from the button. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/toast.mdx`.
 */
export function SonnerPlayground() {
  return <PropsPlayground {...sonnerPlaygroundConfig} />;
}
