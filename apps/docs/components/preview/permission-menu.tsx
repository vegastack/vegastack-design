"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { PermissionMenu } from "@/components/ui/permission-menu";
import { PersonAvatar } from "@/components/ui/person-avatar";

const LEVELS = [
  {
    value: "full",
    label: "Full access",
    description: "Edit, share and delete",
  },
  { value: "edit", label: "Can edit", description: "Edit, comment and assign" },
  { value: "view", label: "Can view", description: "View and comment" },
];

/** One sharing row: the person, then their level — with Remove access at the end of the menu. */
export function permissionMenu(): ReactNode {
  const [level, setLevel] = React.useState("edit");
  const [removed, setRemoved] = React.useState(false);
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto flex w-full max-w-sm items-center gap-2">
        <PersonAvatar
          size="default"
          person={{ name: "Anand Iyer", hue: "purple" }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">Anand Iyer</span>
          <span className="truncate text-xs text-muted-foreground">
            {removed ? "Access removed" : "anand@acme.com"}
          </span>
        </div>
        <PermissionMenu
          value={level}
          options={LEVELS}
          onValueChange={setLevel}
          onRemove={() => setRemoved(true)}
          aria-label={`Anand Iyer's access: ${LEVELS.find((l) => l.value === level)?.label}`}
        />
      </div>
    </Wrapper>
  );
}

/** Levels without descriptions, and the default size. */
export function permissionMenuPlain(): ReactNode {
  const [level, setLevel] = React.useState("view");
  return (
    <Wrapper>
      <PermissionMenu
        size="default"
        value={level}
        options={LEVELS.map(({ value, label }) => ({ value, label }))}
        onValueChange={setLevel}
      />
    </Wrapper>
  );
}

/** A built-in row (the creator) and a disabled trigger while a change saves. */
export function permissionMenuReadOnly(): ReactNode {
  return (
    <Wrapper>
      <PermissionMenu value="full" options={LEVELS} readOnly />
      <PermissionMenu value="edit" options={LEVELS} disabled />
    </Wrapper>
  );
}
