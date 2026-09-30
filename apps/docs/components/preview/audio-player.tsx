"use client";

import { useRef, useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/audio-player` (dogfoods the registry) → auto-scanned.
import {
  AudioPlayer,
  AudioPlayerProvider,
  AudioWaveform,
  GlobalAudioPlayer,
  useGlobalPlayer,
  type AudioPlayerActions,
} from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/ui/media-card";

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

function StateCaption({ children }: { children: ReactNode }): ReactNode {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

// Buffering after play shows the same spinner as `loading`; this toggle stands in for the media's
// own `waiting` event so the state can be seen while the clip plays.
function AudioPlayerBufferingDemo(): ReactNode {
  const [buffering, setBuffering] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <AudioPlayer
        src={SAMPLE_AUDIO}
        label="Standup recording"
        title="Standup"
        loading={buffering}
      />
      <div>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={buffering}
          onClick={() => setBuffering((value) => !value)}
        >
          {buffering ? "Stop buffering" : "Simulate buffering"}
        </Button>
      </div>
    </div>
  );
}

export function audioPlayerStates(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <StateCaption>Idle — press play to see the playing state.</StateCaption>
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Planning recording"
          title="Planning"
        />
        <StateCaption>
          Loading — the play button shows a spinner; nothing else moves.
        </StateCaption>
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Interview recording"
          title="Interview"
          loading
        />
        <StateCaption>
          Buffering — the same spinner, while playing.
        </StateCaption>
        <AudioPlayerBufferingDemo />
        <StateCaption>Lazy source — resolving on the first play.</StateCaption>
        <AudioPlayer
          src={resolveSignedUrl}
          label="Retro recording"
          title="Retro"
        />
        <StateCaption>Error</StateCaption>
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

export function audioPlayerFloating(): ReactNode {
  return (
    <Wrapper>
      <div className="relative flex h-64 w-full flex-col overflow-auto rounded-lg border border-border bg-background">
        <div className="flex-1 p-4 text-sm text-muted-foreground">
          The pill floats 16px above the bottom of this column, centred on it.
        </div>
        <AudioPlayer
          variant="floating"
          src={SAMPLE_AUDIO}
          label="Weekly sync recording"
          skipSeconds={10}
          onOpenChange={() => {}}
        />
      </div>
    </Wrapper>
  );
}

function GlobalPlayerOpenButton(): ReactNode {
  const player = useGlobalPlayer();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          player.open({
            id: "weekly-sync",
            src: SAMPLE_AUDIO,
            title: "Weekly sync",
            href: "#global-player",
          })
        }
      >
        Play
      </Button>
      <Button
        variant="outline"
        disabled={!player.track}
        onClick={() => player.seek(30)}
      >
        Jump to 0:30
      </Button>
    </div>
  );
}

export function audioPlayerGlobal(): ReactNode {
  return (
    <Wrapper>
      <AudioPlayerProvider>
        <div className="relative flex h-64 w-full flex-col overflow-auto rounded-lg border border-border bg-background">
          <div className="flex-1 p-4">
            <GlobalPlayerOpenButton />
          </div>
          <GlobalAudioPlayer />
        </div>
      </AudioPlayerProvider>
    </Wrapper>
  );
}

/**
 * Peaks stored at upload (`probeAudio`) — the waveform draws at once and the file is never
 * downloaded to decode it. The shape here is a stand-in for a real recording's.
 */
const STORED_PEAKS = Array.from({ length: 200 }, (_, i) =>
  Number(
    (0.25 + 0.75 * Math.abs(Math.sin(i / 7) * Math.cos(i / 23))).toFixed(2),
  ),
);

export function audioPlayerPeaks(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xl">
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Site visit recording"
          title="Site visit recording"
          variant="waveform"
          peaks={STORED_PEAKS}
        />
      </div>
    </Wrapper>
  );
}

/**
 * Past `maxDecodeBytes` (20 MB by default) the waveform variant does not download the file to
 * decode it: it shows the plain seek slider. Here the limit is set below the sample's size.
 */
export function audioPlayerDecodeLimit(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xl">
        <AudioPlayer
          src={SAMPLE_AUDIO}
          label="Long recording"
          title="Long recording"
          variant="waveform"
          maxDecodeBytes={1024 * 1024}
        />
      </div>
    </Wrapper>
  );
}

/**
 * `AudioWaveform` — the stored peaks as a still picture, no player: an audio file's card in a
 * grid, with its duration over the image. Resampled to 48 bars, so it keeps its gaps at card
 * width.
 */
export function audioPlayerWaveformStill(): ReactNode {
  return (
    <Wrapper className="grid max-w-lg grid-cols-2 gap-3">
      <MediaCard
        size="lg"
        href="#site-visit"
        title="Site visit recording.m4a"
        meta="Audio · 3 MB"
        image={null}
        fallback={<AudioWaveform peaks={STORED_PEAKS} className="h-1/2 px-4" />}
        imageBadge="2:10"
      />
      <MediaCard
        size="lg"
        href="#voice-note"
        title="Voice note.m4a"
        meta="Audio · no waveform yet"
        image={null}
        fallback={<AudioWaveform peaks={[]} className="h-1/2 px-4" />}
      />
    </Wrapper>
  );
}
