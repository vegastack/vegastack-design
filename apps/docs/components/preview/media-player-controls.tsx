"use client";

import { useRef, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/media-player-controls` (dogfoods the registry) → auto-scanned.
import { MediaPlayerControls } from "@/components/ui/media-player-controls";

const SAMPLE_AUDIO = "/preview/media-player-demo.wav";

/**
 * The transport wired to a media element the page owns. This is what
 * `AudioPlayer` composes internally — install the controls directly only when
 * the surrounding player is yours.
 */
function MediaControlsDemo({
  label,
  onTranscriptClick,
}: {
  label: string;
  onTranscriptClick?: () => void;
}): ReactNode {
  const mediaRef = useRef<HTMLMediaElement>(null);
  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <audio
        ref={mediaRef as React.Ref<HTMLAudioElement>}
        src={SAMPLE_AUDIO}
        preload="metadata"
        aria-label={label}
        className="hidden"
      />
      <MediaPlayerControls
        mediaRef={mediaRef}
        label={label}
        onTranscriptClick={onTranscriptClick}
      />
    </div>
  );
}

export function mediaPlayerControls(): ReactNode {
  return (
    <Wrapper>
      <MediaControlsDemo label="Demo audio" />
    </Wrapper>
  );
}

/**
 * Narrow container → the `@sm` container query trips into the two-line mobile
 * layout, with the transcript and volume controls on the leading edge.
 */
export function mediaPlayerControlsCompact(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xs">
        <MediaControlsDemo
          label="Interview audio"
          onTranscriptClick={() => {}}
        />
      </div>
    </Wrapper>
  );
}
