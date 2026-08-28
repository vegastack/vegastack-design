"use client";
import type { FC } from "react";
import {
  AudioPlayer,
  type AudioPlayerProps,
} from "@/components/ui/audio-player";
import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox";
import { Switch, type SwitchProps } from "@/components/ui/switch";
import {
  VideoPlayer,
  type VideoPlayerProps,
} from "@/components/ui/video-player";

/**
 * Narrow-prop client wrappers for Story explorers whose real prop types explode under the
 * Story build plugin's TypeScript introspection. Base UI's `Checkbox.Root` / `Switch.Root`
 * prop graphs are pathologically recursive and serialize to ~24MB of controls JSON per page
 * in the static export — over Cloudflare's 25MiB per-asset limit (deploy.yml guards this).
 * The `Pick` keeps every control a human would actually toggle; runtime behavior is
 * unchanged. Must be a `'use client'` module: stories pass the component across the RSC
 * boundary, which only client references survive.
 */

type CheckboxStoryProps = Pick<
  CheckboxProps,
  | "checked"
  | "defaultChecked"
  | "indeterminate"
  | "disabled"
  | "required"
  | "size"
  | "aria-label"
>;

export const CheckboxStory: FC<CheckboxStoryProps> = (props) => (
  <Checkbox {...props} />
);
CheckboxStory.displayName = "Checkbox";

type SwitchStoryProps = Pick<
  SwitchProps,
  "checked" | "defaultChecked" | "disabled" | "required" | "size" | "aria-label"
>;

export const SwitchStory: FC<SwitchStoryProps> = (props) => (
  <Switch {...props} />
);
SwitchStory.displayName = "Switch";

// AudioPlayer / VideoPlayer extend `React.ComponentPropsWithRef<"audio"|"video">` and expose a
// `mediaRef` to the media element — introspecting those DOM types serialized the entire
// HTMLMediaElement interface (~320× the DOM constant surface) to ~25MB of controls JSON per page,
// over Cloudflare's 25MiB per-asset limit. The `Pick` keeps the controls a human would toggle;
// runtime behavior is unchanged.
type AudioPlayerStoryProps = Pick<
  AudioPlayerProps,
  "src" | "label" | "title" | "description" | "variant" | "skipSeconds"
>;

export const AudioPlayerStory: FC<AudioPlayerStoryProps> = (props) => (
  <AudioPlayer {...props} />
);
AudioPlayerStory.displayName = "AudioPlayer";

type VideoPlayerStoryProps = Pick<
  VideoPlayerProps,
  | "src"
  | "label"
  | "title"
  | "description"
  | "aspectRatio"
  | "poster"
  | "skipSeconds"
>;

export const VideoPlayerStory: FC<VideoPlayerStoryProps> = (props) => (
  <VideoPlayer {...props} />
);
VideoPlayerStory.displayName = "VideoPlayer";
