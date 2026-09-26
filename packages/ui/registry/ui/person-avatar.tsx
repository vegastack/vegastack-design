// @vegastack person-avatar@0.23.43 sha256-0U+sF+4zsAAyhCcigm4PEakjFj3vDHcyTY35Z8/UV3A=

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarHue,
} from "@/components/ui/avatar";
import { personInitials } from "@/lib/person";

/* ------------------------------------------------------------------------------------------------
 * PersonAvatar — the ONE way a person is drawn as an avatar: their photo, else their initials on
 * their own colour (`hue`, API-32), else initials on the muted fallback. Every people surface
 * (PersonHoverCard, RecordChip, BoardCard, Inbox, Comments, RecordAside, SearchableSelect's person
 * rows, AvatarPicker) composes it, so a person reads the same everywhere. Initials come from the
 * shared rule in `@/lib/person`.
 * ----------------------------------------------------------------------------------------------*/

/** A person shown by `PersonAvatar`, `PersonCard`, `PersonHoverCard` and `AvatarStack`. */
export interface Person {
  /** The name shown, and the avatar's initials. */
  name: string;
  /** The muted line under the name, and the initials when there is no name; omit for someone without an account. @default undefined */
  email?: string | null;
  /** The avatar image. @default undefined */
  image?: string | null;
  /** The person's colour behind their initials — one of the ten tag hues; none is the muted fallback. @default undefined */
  hue?: AvatarHue | null;
  /** A status after the name, such as "Inactive" — a string is a small muted outline badge. @default undefined */
  badge?: React.ReactNode;
}

/** Props for `PersonAvatar`. */
export interface PersonAvatarProps extends Omit<
  React.ComponentProps<typeof Avatar>,
  "children" | "size"
> {
  /** The person. */
  person: Pick<Person, "name" | "email" | "image" | "hue">;
  /** Avatar size. @default "sm" */
  size?: "sm" | "default" | "lg";
}

/** `PersonAvatar` — a person's avatar: the image, else their initials on their hue. @example <PersonAvatar person={{ name: "Asha Rao", hue: "blue" }} /> */
export function PersonAvatar({
  person,
  size = "sm",
  ...props
}: PersonAvatarProps) {
  return (
    <Avatar size={size} {...props}>
      {person.image ? <AvatarImage src={person.image} alt="" /> : null}
      <AvatarFallback hue={person.hue ?? undefined}>
        {personInitials(person.name, person.email)}
      </AvatarFallback>
    </Avatar>
  );
}
