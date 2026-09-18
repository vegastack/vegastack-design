"use client";

import type { ComponentProps, ReactNode } from "react";
import { FileText } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type AttachmentPlaygroundKey = "state" | "size" | "orientation" | "media";

/**
 * Upstream's five lifecycle states. `complete` was the pre-reset name for the settled state and is
 * gone with the reset — `done` is upstream's, and `processing` is new.
 */
const STATE_OPTIONS = [
  { value: "idle", label: "Idle" },
  { value: "uploading", label: "Uploading" },
  { value: "processing", label: "Processing" },
  { value: "error", label: "Error" },
  { value: "done", label: "Done" },
] as const;

const SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "sm", label: "Small" },
  { value: "xs", label: "Extra small" },
] as const;

const ORIENTATION_OPTIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const;

const MEDIA_OPTIONS = [
  { value: "icon", label: "Icon" },
  { value: "image", label: "Image" },
] as const;

type AttachmentOwnProps = ComponentProps<typeof Attachment>;
type AttachmentMediaOwnProps = ComponentProps<typeof AttachmentMedia>;

/** Deterministic gradient stand-in for a thumbnail — no network dependency. */
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
  if (state === "processing") return "Processing…";
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
      defaultValue: "done",
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
  ],
  render: (state): ReactNode => (
    <Attachment
      state={state.state as AttachmentOwnProps["state"]}
      size={state.size as AttachmentOwnProps["size"]}
      orientation={state.orientation as AttachmentOwnProps["orientation"]}
    >
      <AttachmentMedia
        variant={state.media as AttachmentMediaOwnProps["variant"]}
      >
        {state.media === "image" ? IMAGE_PLACEHOLDER : <FileText />}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>release-notes.pdf</AttachmentTitle>
        <AttachmentDescription>
          {descriptionFor(state.state)}
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
  toCode: (state) => {
    const rootProps: string[] = [];
    if (state.state !== "done") rootProps.push(`state="${state.state}"`);
    if (state.size !== "default") rootProps.push(`size="${state.size}"`);
    if (state.orientation !== "horizontal")
      rootProps.push(`orientation="${state.orientation}"`);
    const root = rootProps.length > 0 ? ` ${rootProps.join(" ")}` : "";
    const media = state.media !== "icon" ? ` variant="${state.media}"` : "";
    const mediaChild =
      state.media === "image" ? IMAGE_PLACEHOLDER_CODE : "<FileText />";
    return `<Attachment${root}>
  <AttachmentMedia${media}>
    ${mediaChild}
  </AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>release-notes.pdf</AttachmentTitle>
    <AttachmentDescription>${descriptionFor(state.state)}</AttachmentDescription>
  </AttachmentContent>
</Attachment>`;
  },
};

/**
 * `AttachmentPlayground` — interactive props playground for `Attachment` (lifecycle state / size /
 * orientation / `AttachmentMedia` variant), backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/attachment.mdx`.
 */
export function AttachmentPlayground() {
  return <PropsPlayground {...attachmentPlaygroundConfig} />;
}
