// @vegastack person-avatar@0.23.43 sha256-c6t+p5WOknoQtGSZxRDwo02u28z80u4ZNAqbVoH31Ag=

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarHue,
} from "@/components/ui/avatar";

/* ------------------------------------------------------------------------------------------------
 * PersonAvatar — the ONE way a person is drawn as an avatar: their photo, else their initials on
 * their own colour (`hue`, API-32), else initials on the muted fallback. Every people surface
 * (PersonHoverCard, RecordChip, BoardCard, Inbox, Comments, RecordAside, SearchableSelect's person
 * rows, AvatarPicker) composes it, so a person reads the same everywhere. Initials follow the one
 * rule in `personInitials`, exported here for anything else that shows a person's initials.
 * ----------------------------------------------------------------------------------------------*/

/** The first `n` characters of a string, by code point, so an emoji or accent is never split. */
function head(value: string, n: number): string {
  return Array.from(value).slice(0, n).join("");
}

/**
 * `personInitials` — the one initials rule for a person, on the trimmed name: the first letters of
 * the first and last words ("Asha K Rao" → "AR"); one word → its first two letters ("Asha" → "AS");
 * no name → the email's first two characters; always uppercase.
 *
 * @example
 * personInitials("Asha Rao"); // "AR"
 * personInitials("", "ops@acme.com"); // "OP"
 */
export function personInitials(name: string, email?: string | null): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return head((email ?? "").trim(), 2).toUpperCase();
  if (words.length === 1) return head(words[0]!, 2).toUpperCase();
  return (head(words[0]!, 1) + head(words.at(-1)!, 1)).toUpperCase();
}

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
