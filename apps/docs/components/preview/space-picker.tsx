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
  { id: "general", space: { name: "General", access: "open", hue: "blue" } },
  {
    id: "product",
    space: { name: "Product", access: "open", hue: "purple" },
  },
  {
    id: "sales",
    space: { name: "Sales", access: "private", hue: "green" },
    disabled: "You can view, not add, here",
  },
];

/** A create dialog led by the outlined space chip, `[▣ General ▾]`; keyboard works end to end. */
export function spacePicker(): ReactNode {
  const [space, setSpace] = React.useState("general");
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          New task
        </DialogTrigger>
        <DialogContent size="md">
          <DialogHeader className="items-start">
            <DialogTitle className="sr-only">New task</DialogTitle>
            <SpacePicker
              placement="title"
              spaces={SPACES}
              value={space}
              onValueChange={setSpace}
            />
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
