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
