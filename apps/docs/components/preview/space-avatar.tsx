"use client";

import type { ReactNode } from "react";
import { Building2, Megaphone } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  SpaceAvatar,
  SpaceIcon,
  SpaceOption,
  type Space,
} from "@/components/ui/space-avatar";

const SPACES: Space[] = [
  { name: "General", hue: "blue", access: "open" },
  { name: "Sales", hue: "green", access: "private" },
  { name: "Product", hue: "purple", access: "open", icon: <Building2 /> },
  { name: "Marketing", hue: "orange", access: "private", icon: <Megaphone /> },
  { name: "Archive", access: "open" },
  { name: "My space", access: "personal" },
];

/** An open space, a private one (corner lock), an icon instead of the initial, no hue, and a personal My space. */
export function spaceAvatar(): ReactNode {
  return (
    <Wrapper>
      {SPACES.map((space) => (
        <SpaceAvatar key={space.name} size="lg" space={space} />
      ))}
    </Wrapper>
  );
}

/** The five sizes: 16 (`2xs`, a sidebar row's icon slot), 20, 24, 32 and 40px. */
export function spaceAvatarSizes(): ReactNode {
  return (
    <Wrapper>
      {(["2xs", "xs", "sm", "default", "lg"] as const).map((size) => (
        <SpaceAvatar key={size} size={size} space={SPACES[1]!} />
      ))}
    </Wrapper>
  );
}

/** SpaceOption rows, as a picker or a Move to… menu lists them. */
export function spaceAvatarOption(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ul className="mx-auto flex w-full max-w-xs flex-col gap-3">
        <li>
          <SpaceOption
            name="My space"
            secondary="Only you"
            avatar={<SpaceAvatar space={SPACES[5]!} />}
          />
        </li>
        <li>
          <SpaceOption
            name="General"
            secondary="Everyone · 42 members"
            badge="Joined"
            avatar={<SpaceAvatar space={SPACES[0]!} />}
          />
        </li>
        <li>
          <SpaceOption
            name="Sales"
            secondary="Private · 8 members"
            avatar={<SpaceAvatar space={SPACES[1]!} />}
          />
        </li>
      </ul>
    </Wrapper>
  );
}

/** `SpaceIcon` (lucide `Layers`) — the one glyph for "a space" when no particular space is meant. */
export function spaceAvatarIcon(): ReactNode {
  return (
    <Wrapper>
      <span className="flex items-center gap-2 text-sm">
        <SpaceIcon aria-hidden className="size-4 text-muted-foreground" />
        Move to…
      </span>
    </Wrapper>
  );
}
