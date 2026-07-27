"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/shortcut-overlay` (dogfoods the registry) → auto-scanned.
import {
  ShortcutOverlay,
  type ShortcutDefinition,
} from "@/components/ui/shortcut-overlay";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

const SHORTCUTS: ShortcutDefinition[] = [
  { keys: ["⌘", "K"], label: "Open command menu", category: "Navigation" },
  { keys: ["G", "D"], label: "Go to deals", category: "Navigation" },
  { keys: ["G", "P"], label: "Go to people", category: "Navigation" },
  { keys: ["E"], label: "Edit selected record", category: "Editing" },
  { keys: ["⌘", "Enter"], label: "Save and close", category: "Editing" },
  { keys: ["?"], label: "Show keyboard shortcuts", category: "Help" },
];

export function shortcutOverlay(): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col items-start gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          View shortcuts
        </Button>
        <p className="text-sm text-muted-foreground">
          Or press <Kbd>?</Kbd> anywhere outside a text field.
        </p>
        <ShortcutOverlay
          shortcuts={SHORTCUTS}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </Wrapper>
  );
}

export function shortcutOverlaySearch(): ReactNode {
  const [open, setOpen] = useState(false);
  const many: ShortcutDefinition[] = [
    ...SHORTCUTS,
    { keys: ["J"], label: "Next record", category: "Navigation" },
    { keys: ["K"], label: "Previous record", category: "Navigation" },
    {
      keys: ["⌘", "⇧", "F"],
      label: "Search everything",
      category: "Navigation",
    },
    { keys: ["T"], label: "Add tag", category: "Editing" },
    { keys: ["A"], label: "Assign owner", category: "Editing" },
    { keys: ["⌫"], label: "Archive record", category: "Editing" },
  ];
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col items-start gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          View all shortcuts
        </Button>
        <ShortcutOverlay
          shortcuts={many}
          open={open}
          onOpenChange={setOpen}
          triggerKey={false}
        />
      </div>
    </Wrapper>
  );
}
