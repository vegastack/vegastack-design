"use client";

import { useState, type ReactNode } from "react";
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

// Constrained to a phone-ish width so the `@sm` container query trips into the
// two-line narrow layout, showing the mobile transport and the transcript
// control (wired to reveal a short transcript). `onTranscriptClick` is where a
// consumer app opens its own transcript surface.
function AudioPlayerMobileDemo(): ReactNode {
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <AudioPlayer
        src={SAMPLE_AUDIO}
        label="Interview audio"
        onTranscriptClick={() => setShowTranscript((open) => !open)}
      />
      {showTranscript ? (
        <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
          “Thanks for joining. Today we are walking through the new release and
          what changed for teams shipping on the platform…”
        </div>
      ) : null}
    </div>
  );
}

export function audioPlayerMobile(): ReactNode {
  return (
    <Wrapper>
      <AudioPlayerMobileDemo />
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
