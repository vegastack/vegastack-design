import { defineStory } from "@/lib/story";
import { VideoPlayerStory } from "@/components/stories/story-shims";

const SAMPLE_VIDEO = "/preview/media-player-demo.mp4";

/**
 * Story explorer for `VideoPlayer` — controls auto-generated from `VideoPlayerProps`
 * by the Story build plugin. The local poster fixture keeps the preview deterministic.
 */
export const story = defineStory({
  Component: VideoPlayerStory,
  args: [
    {
      variant: "Default",
      initial: {
        src: SAMPLE_VIDEO,
        poster: "/preview/landscape.svg",
        label: "Demo video",
      },
    },
    {
      variant: "Square",
      initial: {
        src: SAMPLE_VIDEO,
        poster: "/preview/landscape.svg",
        label: "Square video",
        aspectRatio: "square",
      },
    },
  ],
});
