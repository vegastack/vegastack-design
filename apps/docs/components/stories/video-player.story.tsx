import { defineStory } from "@/lib/story";
import { VideoPlayerStory } from "@/components/stories/story-shims";

const SAMPLE_VIDEO = "/preview/media-player-demo.mp4";

/**
 * Story explorer for `VideoPlayer` — controls auto-generated from `VideoPlayerProps`
 * by the Story build plugin. The local poster fixture keeps the preview deterministic. The
 * Recording variant uses a recording's keyboard steps (← → 5 s, J L 10 s); the HLS source has its
 * own preview on the page.
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
    {
      variant: "Recording",
      initial: {
        src: SAMPLE_VIDEO,
        poster: "/preview/landscape.svg",
        label: "Recording",
        skipSeconds: 10,
        arrowSkipSeconds: 5,
      },
    },
  ],
});
