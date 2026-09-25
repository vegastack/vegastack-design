"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { AudioPlayer } from "@/components/ui/audio-player";
// Copied INTO apps/docs via `shadcn add @vegastack/transcript` → auto-scanned.
import {
  Transcript,
  TranscriptList,
  TranscriptSearch,
  TranscriptSpeakers,
  type TranscriptSegment,
} from "@/components/ui/transcript";

const SAMPLE_AUDIO = "/preview/media-player-demo.wav";

const PEOPLE: Record<string, string> = {
  ana: "Ana Ruiz",
  raj: "Raj Patel",
  mei: "Mei Chen",
};
const speakerName = (id: string) => PEOPLE[id] ?? id;

const LINES: Array<[string, string]> = [
  ["ana", "Thanks for joining. Let's start with the quarterly budget review."],
  [
    "raj",
    "Marketing came in under plan, mostly because two events moved online.",
  ],
  ["mei", "Did the online events reach the same number of people?"],
  ["raj", "More, actually. Registrations were up by about a third."],
  ["ana", "Then we should keep one of them online next quarter as well."],
  ["mei", "Agreed. I'd like the regional teams to weigh in before we decide."],
  ["raj", "I can send them the numbers today and collect answers by Friday."],
  ["ana", "Good. Next item: the hiring plan for the support team."],
  ["mei", "We have two open roles, and the first interviews are next week."],
  ["ana", "Let's make sure the budget covers both before we make offers."],
  ["raj", "It does, with the savings from events. I'll confirm with finance."],
  ["ana", "Great. That's everything on the list. Thanks, everyone."],
];

/** Twelve lines over the 90-second sample, about seven seconds apart. */
const SEGMENTS: TranscriptSegment[] = LINES.map(([speaker, text], index) => ({
  id: `line-${index + 1}`,
  start: index * 7.5,
  speaker,
  text,
}));

function TranscriptDemo(): ReactNode {
  const [time, setTime] = useState(16);
  return (
    <Transcript
      aria-label="Budget review transcript"
      segments={SEGMENTS}
      speakerName={speakerName}
      currentTime={time}
      onSeek={setTime}
      className="h-80 w-full max-w-lg rounded-lg border border-border"
    >
      <TranscriptList />
    </Transcript>
  );
}

export function transcript(): ReactNode {
  return (
    <Wrapper>
      <TranscriptDemo />
    </Wrapper>
  );
}

function TranscriptWithAudioDemo(): ReactNode {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setTime(audio.currentTime);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("seeked", update);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("seeked", update);
    };
  }, []);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <AudioPlayer
        src={SAMPLE_AUDIO}
        label="Budget review recording"
        mediaRef={audioRef}
      />
      <Transcript
        aria-label="Budget review transcript"
        segments={SEGMENTS}
        speakerName={speakerName}
        currentTime={time}
        onSeek={(seconds) => {
          const audio = audioRef.current;
          if (!audio) return;
          audio.currentTime = seconds;
          void audio.play().catch(() => {});
        }}
        className="h-72 rounded-lg border border-border"
      >
        <TranscriptSearch />
        <TranscriptList />
      </Transcript>
    </div>
  );
}

export function transcriptWithAudio(): ReactNode {
  return (
    <Wrapper>
      <TranscriptWithAudioDemo />
    </Wrapper>
  );
}

function TranscriptSearchDemo(): ReactNode {
  const [query, setQuery] = useState("budget");
  return (
    <Transcript
      aria-label="Budget review transcript"
      segments={SEGMENTS}
      speakerName={speakerName}
      query={query}
      onQueryChange={setQuery}
      defaultFollow={false}
      className="h-80 w-full max-w-lg rounded-lg border border-border"
    >
      <TranscriptSearch />
      <TranscriptList />
    </Transcript>
  );
}

export function transcriptSearch(): ReactNode {
  return (
    <Wrapper>
      <TranscriptSearchDemo />
    </Wrapper>
  );
}

export function transcriptReadOnly(): ReactNode {
  return (
    <Wrapper>
      <Transcript
        aria-label="Budget review transcript"
        segments={SEGMENTS.slice(0, 6)}
        speakerName={speakerName}
        className="h-72 w-full max-w-lg rounded-lg border border-border"
      >
        <TranscriptList />
      </Transcript>
    </Wrapper>
  );
}

export function transcriptStates(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-1 items-stretch sm:grid-cols-2">
      <Transcript
        aria-label="Transcript, loading"
        segments={[]}
        loading
        className="h-48 rounded-lg border border-border"
      >
        <TranscriptList />
      </Transcript>
      <Transcript
        aria-label="Transcript, empty"
        segments={[]}
        className="h-48 rounded-lg border border-border"
      >
        <TranscriptList />
      </Transcript>
    </Wrapper>
  );
}

function TranscriptSpeakersDemo(): ReactNode {
  const [names, setNames] = useState(PEOPLE);
  return (
    <Transcript
      aria-label="Budget review transcript"
      segments={SEGMENTS}
      speakerName={(id) => names[id] ?? id}
      onSpeakerRename={(id, name) =>
        setNames((current) => ({ ...current, [id]: name }))
      }
      defaultFollow={false}
      className="h-80 w-full max-w-lg"
    >
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <TranscriptSearch className="min-w-48 flex-1 rounded-md border border-border" />
        <TranscriptSpeakers />
      </div>
      <TranscriptList />
    </Transcript>
  );
}

export function transcriptSpeakers(): ReactNode {
  return (
    <Wrapper>
      <TranscriptSpeakersDemo />
    </Wrapper>
  );
}
