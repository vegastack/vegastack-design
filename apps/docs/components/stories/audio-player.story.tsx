import { defineStory } from "@/lib/story";
import { AudioPlayer } from "@/components/ui/audio-player";

const SAMPLE_AUDIO = "/preview/media-player-demo.wav";
const SAMPLE_WAVEFORM_AUDIO = "/preview/waveform-demo.wav";

/**
 * Story explorer for `AudioPlayer` — controls auto-generated from `AudioPlayerProps`
 * by the Story build plugin. Uses a tiny data-URI audio fixture so the docs have
 * no network dependency.
 */
export const story = defineStory({
  Component: AudioPlayer,
  args: [
    {
      variant: "Default",
      initial: {
        src: SAMPLE_AUDIO,
        label: "Demo audio",
      },
    },
    {
      variant: "With copy",
      initial: {
        src: SAMPLE_AUDIO,
        label: "Launch briefing audio",
        title: "Launch briefing",
        description: "A compact audio transport with shared media controls.",
      },
    },
    {
      variant: "Waveform",
      initial: {
        src: SAMPLE_WAVEFORM_AUDIO,
        label: "Podcast episode audio",
        title: "Podcast episode",
        description: "The seek bar renders the decoded audio waveform.",
        variant: "waveform",
      },
    },
  ],
});
