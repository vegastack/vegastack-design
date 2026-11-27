"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/video-player` (dogfoods the registry) → auto-scanned.
import { VideoPlayer } from "@/components/ui/video-player";

const SAMPLE_VIDEO = "/preview/media-player-demo.mp4";
const POSTER = "/preview/landscape.svg";

export function videoPlayer(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <VideoPlayer src={SAMPLE_VIDEO} poster={POSTER} label="Demo video" />
      </div>
    </Wrapper>
  );
}

export function videoPlayerWithCopy(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <VideoPlayer
          src={SAMPLE_VIDEO}
          poster={POSTER}
          label="Product walkthrough video"
          title="Product walkthrough"
          description="A video frame using the same transport as the audio player."
        />
      </div>
    </Wrapper>
  );
}

export function videoPlayerSquare(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-sm">
        <VideoPlayer
          src={SAMPLE_VIDEO}
          poster={POSTER}
          label="Square video"
          aspectRatio="square"
        />
      </div>
    </Wrapper>
  );
}

/**
 * The overlay pinned open with `controlsVisible`. Without it the chrome is
 * revealed by a pointer or by focus and fades a second later, so a static
 * capture never contains it — which is exactly why the contract lane could not
 * see the video controls at all (audit B4-11). Consumers get the same prop for
 * a kiosk or always-on player.
 */
export function videoPlayerControlsVisible(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <VideoPlayer
          src={SAMPLE_VIDEO}
          poster={POSTER}
          label="Always-on video"
          controlsVisible
        />
      </div>
    </Wrapper>
  );
}

/**
 * A video the browser cannot play — an HEVC `.mov`, an `.mkv` — shows "Can’t play this video
 * here" with a Download button instead of a transport that would do nothing.
 */
export function videoPlayerError(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <VideoPlayer
          src="data:video/mp4;base64,AAAA"
          poster={POSTER}
          label="Site walkthrough"
          downloadHref={SAMPLE_VIDEO}
        />
      </div>
    </Wrapper>
  );
}

const HLS_PLAYLIST = "/preview/video-player-hls/index.m3u8";
const HLS_CHAPTERS = [
  { start_ms: 0, title: "Opening" },
  { start_ms: 8_000, title: "The skipped part" },
  { start_ms: 16_000, title: "After the skip" },
];
const HLS_SKIP: Array<[number, number]> = [[12_000, 16_000]];

/**
 * An HLS playlist — native in Safari, hls.js (loaded on first attach) elsewhere — with chapters,
 * captions, a skipped range shown as edited time, and a playlist that "expires" 70 s after the
 * page opened, so the player renews it at the same position 10 s in. A real playlist route returns
 * a freshly signed URL from `onExpired`; this static fixture returns the same file.
 */
export function videoPlayerHls(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <VideoPlayer
          hls={{
            playlistUrl: HLS_PLAYLIST,
            expiresAt: new Date(Date.now() + 70_000).toISOString(),
            onExpired: async () => HLS_PLAYLIST,
          }}
          poster={POSTER}
          label="Recording"
          chapters={HLS_CHAPTERS}
          skipRanges={HLS_SKIP}
          captions={{
            src: "/preview/video-player-hls/captions.vtt",
            label: "English",
            srclang: "en",
          }}
          skipSeconds={10}
          arrowSkipSeconds={5}
        />
      </div>
    </Wrapper>
  );
}
