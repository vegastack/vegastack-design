import { defineStory } from "@/lib/story";
import { Label } from "./label.client";

/**
 * Story explorer for `Label` — controls auto-generated from `LabelProps` by the Story
 * build plugin.
 */
export const story = defineStory({
  Component: Label,
  args: [
    {
      variant: "Default",
      initial: {
        children: "Email address",
      },
    },
    {
      variant: "Required",
      initial: {
        children: "Password",
      },
      fixed: {
        required: true,
      },
    },
  ],
});
