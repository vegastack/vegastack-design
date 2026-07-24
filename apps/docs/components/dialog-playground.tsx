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
  type DialogContentProps,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type DialogPlaygroundKey = "size" | "showCloseButton";

const SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "full", label: "Full" },
] as const;

const dialogPlaygroundConfig: PlaygroundConfig<DialogPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    {
      type: "switch",
      key: "showCloseButton",
      label: "Close button",
      defaultValue: true,
    },
  ],
  // Renders CLOSED — the reader opens it via the trigger, so the initial state is deterministic.
  render: (state): ReactNode => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
      <DialogContent
        size={state.size as DialogContentProps["size"]}
        showCloseButton={Boolean(state.showCloseButton)}
      >
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.size !== "default") props.push(`size="${state.size}"`);
    if (!state.showCloseButton) props.push("showCloseButton={false}");
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return [
      "<Dialog>",
      '  <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />',
      `  <DialogContent${propsString}>`,
      "    <DialogHeader>",
      "      <DialogTitle>Delete project</DialogTitle>",
      "      <DialogDescription>This action cannot be undone.</DialogDescription>",
      "    </DialogHeader>",
      "    <DialogFooter>",
      '      <DialogClose render={<Button variant="outline">Cancel</Button>} />',
      '      <Button variant="destructive">Delete</Button>',
      "    </DialogFooter>",
      "  </DialogContent>",
      "</Dialog>",
    ].join("\n");
  },
};

/**
 * `DialogPlayground` — interactive props playground for `Dialog` (`DialogContent` size /
 * showCloseButton), backed by the generic {@link PropsPlayground}. The dialog renders closed;
 * the reader opens it from the trigger. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/dialog.mdx`.
 */
export function DialogPlayground() {
  return <PropsPlayground {...dialogPlaygroundConfig} />;
}
