"use client";

import type { ReactNode } from "react";
import { Building2, Megaphone } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  SpaceAvatar,
  SpaceOption,
  type Space,
} from "@/components/ui/space-avatar";

const SPACES: Space[] = [
  { name: "General", hue: "blue", access: "open" },
  { name: "Sales", hue: "green", access: "private" },
  { name: "Product", hue: "purple", access: "open", icon: <Building2 /> },
  { name: "Marketing", hue: "orange", access: "private", icon: <Megaphone /> },
  { name: "Archive", access: "open" },
  { name: "Private", access: "personal" },
];

/** An open space, a private one (corner lock), an icon instead of the initial, no hue, and a personal Private area. */
export function spaceAvatar(): ReactNode {
  return (
    <Wrapper>
      {SPACES.map((space) => (
        <SpaceAvatar key={space.name} size="lg" space={space} />
      ))}
    </Wrapper>
  );
}

/** The four sizes: 20, 24, 32 and 40px. */
export function spaceAvatarSizes(): ReactNode {
  return (
    <Wrapper>
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
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
            name="Private"
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
