"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/audio-player` (dogfoods the registry) → auto-scanned.
import { AudioPlayer } from "@/components/ui/audio-player";

const SAMPLE_AUDIO = "/preview/media-player-demo.wav";
// A dynamic clip (varied amplitude) so the waveform shows a real shape; the
// primary demo fixture is a uniform tone and would render as a flat block.
const SAMPLE_WAVEFORM_AUDIO = "/preview/waveform-demo.wav";

export function audioPlayer(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-3xl">
        <AudioPlayer src={SAMPLE_AUDIO} label="Demo audio" />
      </div>
    </Wrapper>
  );
}

export function audioPlayerWithCopy(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-3xl">
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Launch briefing audio"
          title="Launch briefing"
          description="A compact audio transport with shared media controls."
        />
      </div>
    </Wrapper>
  );
}

export function audioPlayerPlaybackRates(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-3xl">
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Training audio"
          playbackRates={[1, 1.25, 1.5, 2]}
          defaultPlaybackRate={1.25}
        />
      </div>
    </Wrapper>
  );
}

export function audioPlayerWaveform(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-3xl">
        <AudioPlayer
          src={SAMPLE_WAVEFORM_AUDIO}
          label="Podcast episode audio"
          title="Podcast episode"
          description="The waveform variant renders the decoded audio as the seek bar."
          variant="waveform"
        />
      </div>
    </Wrapper>
  );
}
