"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  DropdownMenuAtPoint,
  DropdownMenuInput,
  DropdownMenuSwitchItem,
  type DropdownMenuPoint,
} from "@/components/ui/dropdown-menu-form";

export function dropdownMenuForm(): ReactNode {
  const [point, setPoint] = React.useState<DropdownMenuPoint | null>(null);
  const [name, setName] = React.useState("Status");
  const [required, setRequired] = React.useState(false);
  const [unique, setUnique] = React.useState(true);
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setPoint({ x: box.left, y: box.bottom + 4 });
        }}
      >
        Field settings
      </Button>
      <DropdownMenuAtPoint point={point} onClose={() => setPoint(null)}>
        <DropdownMenuInput
          passArrows
          aria-label="Field name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <DropdownMenuSeparator />
        <DropdownMenuSwitchItem
          label="Required"
          hint="A row can't be saved without it."
          checked={required}
          onCheckedChange={setRequired}
        />
        <DropdownMenuSwitchItem
          label="Unique"
          checked={unique}
          onCheckedChange={setUnique}
        />
      </DropdownMenuAtPoint>
    </Wrapper>
  );
}
