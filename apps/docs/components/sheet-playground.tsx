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
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
      <SheetContent
        side={state.side as SheetSide}
        showCloseButton={Boolean(state.showCloseButton)}
      >
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
    const props: string[] = [];
    if (state.side !== "right") props.push(`side="${state.side}"`);
    if (!state.showCloseButton) props.push("showCloseButton={false}");
    const propsString = props.length > 0 ? ` ${props.join(" ")}` : "";
    return [
      "<Sheet>",
      '  <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />',
      `  <SheetContent${propsString}>`,
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
