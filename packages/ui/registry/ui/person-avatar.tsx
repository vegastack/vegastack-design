// @vegastack person-avatar@0.25.1 sha256-Be6em61/SIpMMLM+4VfqPX2vAnKQ+jP7zL1S/HOAXJA=

"use client";

import * as React from "react";
import { UsersRound } from "lucide-react";
import { cn } from "@vegastack/design";
import { Avatar, AvatarFallback, type AvatarHue } from "@/components/ui/avatar";

/* ------------------------------------------------------------------------------------------------
 * PersonAvatar — the ONE way a person is drawn as an avatar: their photo, else their initials on
 * their own colour (`hue`, API-32), else initials on the muted fallback. Every people surface
 * (PersonHoverCard, RecordChip, BoardCard, Inbox, Comments, RecordAside, SearchableSelect's person
 * rows, AvatarPicker) composes it, so a person reads the same everywhere. Initials follow the one
 * rule in `personInitials`, exported here for anything else that shows a person's initials.
 * A team (`kind: "team"`) is drawn as a rounded-square tile with the team icon on its hue — never
 * initials — so a team reads as a group wherever people and teams are listed together.
 * ----------------------------------------------------------------------------------------------*/

/** The first `n` characters of a string, by code point, so an emoji or accent is never split. */
function head(value: string, n: number): string {
  return Array.from(value).slice(0, n).join("");
}

/**
 * `personInitials` — the one initials rule for a person, on the trimmed name: the first letters of
 * the first and last words ("Asha K Rao" → "AR"); one word → its first two letters ("Asha" → "AS");
 * no name → the email's first two characters; punctuation is skipped; always uppercase.
 *
 * @example
 * personInitials("Asha Rao"); // "AR"
 * personInitials("", "ops@acme.com"); // "OP"
 */
export function personInitials(name: string, email?: string | null): string {
  // Letters and digits only: "D. Rao" → "DR", "Farid (contractor)" → "FC", never "D." or "F(".
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
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
  /** A person, or a team of people — a team is a rounded-square tile with the team icon on its hue. @default "person" */
  kind?: "person" | "team";
}

/** Props for `PersonAvatar`. */
export interface PersonAvatarProps extends Omit<
  React.ComponentProps<typeof Avatar>,
  "children" | "size"
> {
  /** The person. */
  person: Pick<Person, "name" | "email" | "image" | "hue" | "kind">;
  /** Avatar size. @default "sm" */
  size?: "sm" | "default" | "lg";
  /** Draw a person or a team; overrides `person.kind`. @default person.kind ?? "person" */
  kind?: "person" | "team";
}

/**
 * `PersonAvatar` — a person's avatar: the image, else their initials on their hue.
 *
 * The photo is a plain `<img>` in the server HTML, layered over the initials, so the browser starts
 * fetching it from the markup and paints it the moment it decodes — a cached photo shows on first
 * paint, with no flash of initials and no wait for hydration. (Base UI's `AvatarImage` renders its
 * `<img>` only after a JS loader reports it loaded, which is what made every photo start as
 * initials.) The initials stay underneath until the photo has loaded, and come back if it fails.
 *
 * A team (`kind="team"`, or `person.kind`) is a rounded-square tile with the `UsersRound` icon on
 * its hue, and no photo or initials.
 *
 * @example <PersonAvatar person={{ name: "Asha Rao", hue: "blue" }} />
 * @example <PersonAvatar person={{ name: "Sales", kind: "team", hue: "green" }} />
 */
export function PersonAvatar({
  person,
  size = "sm",
  kind,
  className,
  ...props
}: PersonAvatarProps) {
  const team = (kind ?? person.kind) === "team";
  const src = team ? undefined : person.image || undefined;
  // Keyed by `src`, so a new photo starts over: a failure or a load of the old one never sticks.
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // The photo may have loaded, or failed, before hydration attached `onLoad`/`onError` — read the
  // element's own state once it is in the tree.
  React.useLayoutEffect(() => {
    const img = imgRef.current;
    if (!src || !img || !img.complete) return;
    if (img.naturalWidth > 0) setLoaded(src);
    else if (img.currentSrc) setFailed(src);
  }, [src]);

  const showImage = src !== undefined && failed !== src;
  const imageLoaded = showImage && loaded === src;

  if (team) {
    return (
      <Avatar
        size={size}
        data-kind="team"
        className={cn("rounded-md after:rounded-md", className)}
        {...props}
      >
        <AvatarFallback hue={person.hue ?? undefined} className="rounded-md">
          <UsersRound
            aria-hidden
            className="size-4 group-data-[size=lg]/avatar:size-5 group-data-[size=sm]/avatar:size-3.5"
          />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar size={size} className={className} {...props}>
      {imageLoaded ? null : (
        <AvatarFallback hue={person.hue ?? undefined}>
          {personInitials(person.name, person.email)}
        </AvatarFallback>
      )}
      {showImage ? (
        <img
          ref={imgRef}
          data-slot="avatar-image"
          src={src}
          alt=""
          decoding="async"
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
          // Over the initials (the root is `relative` and sized), so nothing shifts when it lands.
          className="absolute inset-0 aspect-square size-full rounded-full object-cover"
        />
      ) : null}
    </Avatar>
  );
}
