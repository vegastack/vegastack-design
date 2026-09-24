"use client";

import { useRef, useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/audio-player` (dogfoods the registry) → auto-scanned.
import {
  AudioPlayer,
  type AudioPlayerActions,
} from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";

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
        <div className="rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground">
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

const MEETING_NOTES = [
  "Priya opened with the renewal timeline and the two open questions from legal.",
  "Marcus confirmed the pilot covers four regional teams, not six as first scoped.",
  "The group agreed to move the security review ahead of the pricing call.",
  "Dana will send the revised order form by Thursday.",
  "Open item: who owns onboarding for the second cohort.",
  "Next check-in is set for the week after the pilot starts.",
];

// A docked, closable player at the bottom of a scrolling column. The column is
// the scroll container, so the dock stays pinned to ITS bottom edge while the
// notes scroll behind it; closing hands focus back to the button that opened it.
function AudioPlayerDockedDemo(): ReactNode {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-80 w-full max-w-xl flex-col overflow-y-auto rounded-lg border border-border bg-background">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-base font-medium">Weekly sync</h3>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Play recording
          </Button>
        </div>
        {MEETING_NOTES.map((line) => (
          <p key={line} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
      <AudioPlayer
        docked
        open={open}
        onOpenChange={setOpen}
        src={SAMPLE_AUDIO}
        label="Weekly sync recording"
        title="Weekly sync"
        description="Recorded 12 September"
      />
    </div>
  );
}

export function audioPlayerDocked(): ReactNode {
  return (
    <Wrapper>
      <AudioPlayerDockedDemo />
    </Wrapper>
  );
}

// A lazy source: the function runs once, on the first play — the place to
// fetch a short-lived signed URL. It stands in for a network call here.
async function resolveSignedUrl(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return SAMPLE_AUDIO;
}

export function audioPlayerLazySource(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-3xl">
        <AudioPlayer
          src={resolveSignedUrl}
          label="Customer call recording"
          title="Customer call"
          description="The URL is fetched when you press play."
        />
      </div>
    </Wrapper>
  );
}

export function audioPlayerStates(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Interview recording"
          title="Interview"
          loading
        />
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Board meeting recording"
          title="Board meeting"
          error="Couldn't load the recording."
          onRetry={() => {}}
        />
      </div>
    </Wrapper>
  );
}

const CHAPTERS = [
  { at: 0, title: "Welcome" },
  { at: 24, title: "What changed" },
  { at: 61, title: "Questions" },
];

// Seek from outside: `actionsRef` jumps and plays from a chapter list. A seek
// made before the metadata loads is queued and applied once it does.
function AudioPlayerSeekDemo(): ReactNode {
  const actions = useRef<AudioPlayerActions>(null);
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <AudioPlayer
        src={SAMPLE_AUDIO}
        label="Release walkthrough audio"
        actionsRef={actions}
      />
      <div className="flex flex-wrap gap-2">
        {CHAPTERS.map((chapter) => (
          <Button
            key={chapter.at}
            variant="outline"
            size="sm"
            onClick={() => actions.current?.seek(chapter.at, { play: true })}
          >
            {chapter.title}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function audioPlayerSeek(): ReactNode {
  return (
    <Wrapper>
      <AudioPlayerSeekDemo />
    </Wrapper>
  );
}
