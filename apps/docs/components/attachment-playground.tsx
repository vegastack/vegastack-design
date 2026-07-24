"use client";

import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  type AttachmentMediaProps,
  type AttachmentProps,
} from "@/components/ui/attachment";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type AttachmentPlaygroundKey =
  "state" | "size" | "orientation" | "media" | "live";

const STATE_OPTIONS = [
  { value: "idle", label: "Idle" },
  { value: "uploading", label: "Uploading" },
  { value: "error", label: "Error" },
  { value: "complete", label: "Complete" },
  { value: "disabled", label: "Disabled" },
] as const;

const SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "sm", label: "Small" },
] as const;

const ORIENTATION_OPTIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const;

const MEDIA_OPTIONS = [
  { value: "icon", label: "Icon" },
  { value: "image", label: "Image" },
] as const;

/** Deterministic gradient stand-in for a thumbnail — no network dependency (same idiom as the Attachment preview). */
const IMAGE_PLACEHOLDER = (
  <div
    aria-hidden="true"
    className="size-full bg-gradient-to-br from-muted to-accent"
  />
);

const IMAGE_PLACEHOLDER_CODE =
  '<div className="size-full bg-gradient-to-br from-muted to-accent" />';

/** The meta line follows the lifecycle state, like a real upload would. */
function descriptionFor(state: string | boolean): string {
  if (state === "uploading") return "Uploading — 42%";
  if (state === "error") return "Upload failed — file too large";
  return "248 KB";
}

const attachmentPlaygroundConfig: PlaygroundConfig<AttachmentPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "state",
      label: "State",
      options: STATE_OPTIONS,
      defaultValue: "idle",
    },
    {
      type: "select",
      key: "size",
      label: "Size",
      options: SIZE_OPTIONS,
      defaultValue: "default",
    },
    {
      type: "select",
      key: "orientation",
      label: "Orientation",
      options: ORIENTATION_OPTIONS,
      defaultValue: "horizontal",
    },
    {
      type: "select",
      key: "media",
      label: "Media variant",
      options: MEDIA_OPTIONS,
      defaultValue: "icon",
    },
    {
      type: "switch",
      key: "live",
      label: "Live description",
      defaultValue: false,
    },
  ],
  render: (state): ReactNode => (
    <Attachment
      state={state.state as AttachmentProps["state"]}
      size={state.size as AttachmentProps["size"]}
      orientation={state.orientation as AttachmentProps["orientation"]}
    >
      <AttachmentMedia variant={state.media as AttachmentMediaProps["variant"]}>
        {state.media === "image" ? IMAGE_PLACEHOLDER : <FileText />}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>release-notes.pdf</AttachmentTitle>
        <AttachmentDescription live={Boolean(state.live)}>
          {descriptionFor(state.state)}
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
  toCode: (state) => {
    const rootProps: string[] = [];
    if (state.state !== "idle") rootProps.push(`state="${state.state}"`);
    if (state.size !== "default") rootProps.push(`size="${state.size}"`);
    if (state.orientation !== "horizontal")
      rootProps.push(`orientation="${state.orientation}"`);
    const root = rootProps.length > 0 ? ` ${rootProps.join(" ")}` : "";
    const media = state.media !== "icon" ? ` variant="${state.media}"` : "";
    const mediaChild =
      state.media === "image" ? IMAGE_PLACEHOLDER_CODE : "<FileText />";
    const live = state.live ? " live" : "";
    return `<Attachment${root}>
  <AttachmentMedia${media}>
    ${mediaChild}
  </AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>release-notes.pdf</AttachmentTitle>
    <AttachmentDescription${live}>${descriptionFor(state.state)}</AttachmentDescription>
  </AttachmentContent>
</Attachment>`;
  },
};

/**
 * `AttachmentPlayground` — interactive props playground for `Attachment` (lifecycle state / size /
 * orientation / `AttachmentMedia` variant / `AttachmentDescription` `live`), backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/attachment.mdx`.
 */
export function AttachmentPlayground() {
  return <PropsPlayground {...attachmentPlaygroundConfig} />;
}
