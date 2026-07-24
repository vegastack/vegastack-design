import { defineStory } from "@/lib/story";
import { Avatar } from "@/components/ui/avatar";

/**
 * Story explorer for `Avatar` — controls auto-generated from `AvatarProps` by the Story
 * build plugin. Prop-driven (`src` / `alt` / `fallback`), no composed children.
 */
export const story = defineStory({
  Component: Avatar,
  args: [
    {
      variant: "Initials",
      initial: {
        fallback: "AL",
      },
    },
    {
      variant: "With image",
      initial: {
        src: "/preview/landscape.svg",
        alt: "Ada Lovelace",
        fallback: "AL",
      },
    },
  ],
});
