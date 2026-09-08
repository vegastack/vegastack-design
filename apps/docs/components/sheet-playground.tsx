"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
  type SheetSide,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type SheetPlaygroundKey = "side" | "showCloseButton";

const SIDE_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
] as const;

const sheetPlaygroundConfig: PlaygroundConfig<SheetPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "side",
      label: "Side",
      options: SIDE_OPTIONS,
      defaultValue: "right",
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
    <Sheet side={state.side as SheetSide}>
      <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
      <SheetContent showCloseButton={Boolean(state.showCloseButton)}>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline">Cancel</Button>} />
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  toCode: (state) => {
    // `side` belongs on the root (it picks the swipe direction as well as the edge);
    // only the close-button toggle is a content prop.
    const rootProps = state.side !== "right" ? ` side="${state.side}"` : "";
    const contentProps = !state.showCloseButton
      ? " showCloseButton={false}"
      : "";
    return [
      `<Sheet${rootProps}>`,
      '  <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />',
      `  <SheetContent${contentProps}>`,
      "    <SheetHeader>",
      "      <SheetTitle>Edit profile</SheetTitle>",
      "      <SheetDescription>Make changes to your profile here.</SheetDescription>",
      "    </SheetHeader>",
      "    <SheetFooter>",
      '      <SheetClose render={<Button variant="outline">Cancel</Button>} />',
      "      <Button>Save changes</Button>",
      "    </SheetFooter>",
      "  </SheetContent>",
      "</Sheet>",
    ].join("\n");
  },
};

/**
 * `SheetPlayground` — interactive props playground for `Sheet` (`SheetContent` side /
 * showCloseButton), backed by the generic {@link PropsPlayground}. The sheet renders closed;
 * the reader opens it from the trigger. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/sheet.mdx`.
 */
export function SheetPlayground() {
  return <PropsPlayground {...sheetPlaygroundConfig} />;
}
