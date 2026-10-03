"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SpaceChip,
  SpacePicker,
  type SpacePickerItem,
} from "@/components/ui/space-picker";

const SPACES: SpacePickerItem[] = [
  { id: "mine", space: { name: "My space", access: "personal" } },
  {
    id: "general",
    space: { name: "General", access: "open", hue: "blue" },
    secondary: "Everyone in the workspace",
  },
  {
    id: "product",
    space: { name: "Product", access: "open", hue: "purple" },
    secondary: "14 members",
  },
  {
    id: "sales",
    space: { name: "Sales", access: "private", hue: "green" },
    disabled: "You can view, not add, here",
  },
];

/** The create-dialog title: `[▣ General ▾] › New task`, keyboard only works end to end. */
export function spacePicker(): ReactNode {
  const [space, setSpace] = React.useState("general");
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          New task
        </DialogTrigger>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-1">
              <SpacePicker
                placement="title"
                spaces={SPACES}
                value={space}
                onValueChange={setSpace}
              />
              <span aria-hidden className="text-muted-foreground">
                ›
              </span>
              <span>New task</span>
            </DialogTitle>
          </DialogHeader>
          <Input aria-label="Task title" placeholder="Task title" />
          <DialogFooter>
            <Button>Create task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

/** In a form or property row, and the read-only chip a card shows. */
export function spacePickerField(): ReactNode {
  const [space, setSpace] = React.useState<string | undefined>(undefined);
  return (
    <Wrapper className="flex-col items-start">
      <SpacePicker spaces={SPACES} value={space} onValueChange={setSpace} />
      <div className="flex items-center gap-3">
        <SpaceChip
          size="xs"
          readOnly
          space={{ name: "Product", access: "open", hue: "purple" }}
        />
        <SpaceChip
          size="xs"
          readOnly
          space={{ name: "My space", access: "personal" }}
        />
      </div>
    </Wrapper>
  );
}
