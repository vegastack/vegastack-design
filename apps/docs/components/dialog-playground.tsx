"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type DialogPlaygroundKey = "width" | "showCloseButton" | "footerCloseButton";

/**
 * Upstream's DialogContent has no `size` prop: its width is `w-full max-w-[calc(100%-2rem)]`
 * with an `sm:max-w-sm` cap, retuned from the outside with a `max-width` utility. The playground
 * therefore offers the cap rather than a variant name.
 */
const WIDTH_OPTIONS = [
  { value: "sm:max-w-xs", label: "Extra small" },
  { value: "", label: "Small (default)" },
  { value: "sm:max-w-md", label: "Medium" },
  { value: "sm:max-w-lg", label: "Large" },
] as const;

const dialogPlaygroundConfig: PlaygroundConfig<DialogPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "width",
      label: "Max width",
      options: WIDTH_OPTIONS,
      defaultValue: "",
    },
    {
      type: "switch",
      key: "showCloseButton",
      label: "Corner close button",
      defaultValue: true,
    },
    {
      type: "switch",
      key: "footerCloseButton",
      label: "Footer close button",
      defaultValue: false,
    },
  ],
  // Renders CLOSED — the reader opens it via the trigger, so the initial state is deterministic.
  render: (state): ReactNode => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
      <DialogContent
        className={String(state.width)}
        showCloseButton={Boolean(state.showCloseButton)}
      >
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={Boolean(state.footerCloseButton)}>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  toCode: (state) => {
    const contentProps: string[] = [];
    if (state.width) contentProps.push(`className="${state.width}"`);
    if (!state.showCloseButton) contentProps.push("showCloseButton={false}");
    const content = contentProps.length > 0 ? ` ${contentProps.join(" ")}` : "";
    const footer = state.footerCloseButton ? " showCloseButton" : "";
    return [
      "<Dialog>",
      '  <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />',
      `  <DialogContent${content}>`,
      "    <DialogHeader>",
      "      <DialogTitle>Delete project</DialogTitle>",
      "      <DialogDescription>This action cannot be undone.</DialogDescription>",
      "    </DialogHeader>",
      `    <DialogFooter${footer}>`,
      '      <DialogClose render={<Button variant="outline">Cancel</Button>} />',
      '      <Button variant="destructive">Delete</Button>',
      "    </DialogFooter>",
      "  </DialogContent>",
      "</Dialog>",
    ].join("\n");
  },
};

/**
 * `DialogPlayground` — interactive props playground for `Dialog`: the content's max-width cap,
 * the corner close button and the footer's own close button, backed by the generic
 * `PropsPlayground`. The dialog renders closed; the reader opens it from the trigger.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/dialog.mdx`.
 */
export function DialogPlayground() {
  return <PropsPlayground {...dialogPlaygroundConfig} />;
}
