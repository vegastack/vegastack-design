// @vegastack avatar-picker@0.23.44 sha256-a5TXIEGVNySjJC81YCh20AjMaR0oW7HHH9f0i+hGuTU=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import { Spinner } from "@/components/ui/spinner";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  useFileDrop,
  type FileDropRejection,
} from "@/components/ui/use-file-drop";

/* ------------------------------------------------------------------------------------------------
 * AvatarPicker — a person's own photo, set and cleared in place: a large `PersonAvatar` (the photo,
 * else initials on their hue), "Upload photo" (or "Change photo" once there is one) opening the
 * file browser, "Remove" while a photo exists, and one line under the buttons for a refused file.
 * On a phone the browser's own picker offers the camera and the gallery.
 *
 * Deliberately NOT done here: no upload, no resizing, no cropping. `onSelect` hands the app the
 * accepted file; the app processes and uploads it, holds `busy` while it does, and passes the new
 * `person.image` back. A failure the app finds after acquisition (an unreadable image) goes back
 * in through `error`.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `AvatarPicker`. */
export interface AvatarPickerProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onSelect" | "children"
> {
  /** The person whose photo this is: the avatar, its initials and hue, and whether a photo exists (`image`). */
  person: Person;
  /**
   * An upload or removal is in flight: a spinner covers the avatar and the buttons are disabled.
   * @default false
   */
  busy?: boolean;
  /** Called with the one accepted file. */
  onSelect: (file: File) => void;
  /**
   * Called by "Remove"; omit to hide it. It shows only while `person.image` is set.
   * @default undefined
   */
  onRemove?: () => void;
  /**
   * The accepted MIME types, comma-separated, as on `<input accept>`.
   * @default "image/jpeg,image/png,image/webp"
   */
  accept?: string;
  /**
   * The largest file accepted, in bytes; a larger one is refused with a message.
   * @default undefined
   */
  maxSize?: number;
  /**
   * An error from after the file was accepted (processing or upload), shown on the message line
   * and announced (a string is announced each time it changes).
   * @default undefined
   */
  error?: React.ReactNode;
  /**
   * `lg` is a 64px avatar, `xl` 80px.
   * @default "lg"
   */
  size?: "lg" | "xl";
  /**
   * The button label while there is no photo.
   * @default "Upload photo"
   */
  uploadLabel?: string;
  /**
   * The button label once there is a photo.
   * @default "Change photo"
   */
  changeLabel?: string;
  /**
   * The remove button's label.
   * @default "Remove"
   */
  removeLabel?: string;
}

/** A byte count as the message line says it ("5 MB"). */
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024)
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/** An iPhone HEIC/HEIF photo — by type, or by extension when the browser reports no type. */
function isHeic(file: File): boolean {
  return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** The message for a refused file: what was wrong, in one sentence. */
function refusal(
  { file, reasons }: FileDropRejection,
  maxSize: number | undefined,
): string {
  if (reasons.includes("file-invalid-type"))
    return isHeic(file)
      ? `${file.name} is a HEIC photo. Export it as JPEG and try again.`
      : `${file.name} isn't a supported image.`;
  if (reasons.includes("file-too-large") && maxSize !== undefined)
    return `${file.name} is larger than ${formatSize(maxSize)}. Choose a smaller image.`;
  return `${file.name} can't be used. Try another image.`;
}

/**
 * `AvatarPicker` — upload, change or remove a person's photo, with the avatar beside the buttons.
 *
 * @example
 * <AvatarPicker
 *   person={{ name: "Asha Rao", image: me.image, hue: me.color }}
 *   busy={saving}
 *   maxSize={10 * 1024 * 1024}
 *   onSelect={(file) => uploadPhoto(file)}
 *   onRemove={() => removePhoto()}
 * />
 */
export function AvatarPicker({
  person,
  busy = false,
  onSelect,
  onRemove,
  accept = "image/jpeg,image/png,image/webp",
  maxSize,
  error,
  size = "lg",
  uploadLabel = "Upload photo",
  changeLabel = "Change photo",
  removeLabel = "Remove",
  className,
  ...props
}: AvatarPickerProps) {
  const [refused, setRefused] = React.useState<string | null>(null);
  const messageId = React.useId();
  // ONE polite region speaks every refusal and every `error`, exactly once each; the drop hook's
  // own region (its generic "was refused — wrong type") is deliberately not rendered.
  const { announce, Announcer } = useAnnouncer();
  React.useEffect(() => {
    if (typeof error === "string" && error) announce(error);
  }, [error, announce]);
  const drop = useFileDrop({
    accept: Object.fromEntries(
      accept
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean)
        .map((type) => [type, []]),
    ),
    multiple: false,
    maxSize,
    disabled: busy,
    paste: false,
    preventWindowDrop: false,
    onFilesAccepted: (files) => {
      setRefused(null);
      if (files[0]) onSelect(files[0]);
    },
    onFilesRejected: (rejections) => {
      const text = rejections[0] ? refusal(rejections[0], maxSize) : null;
      setRefused(text);
      if (text) announce(text);
    },
  });
  const message = refused ?? error;
  const hasImage = Boolean(person.image);

  return (
    <div
      data-slot="avatar-picker"
      data-size={size}
      aria-busy={busy || undefined}
      className={cn("flex items-center gap-4", className)}
      {...props}
    >
      <span className="relative inline-flex shrink-0 rounded-full">
        <PersonAvatar
          person={person}
          size="default"
          data-slot="avatar-picker-avatar"
          className={cn(
            "*:data-[slot=avatar-fallback]:text-lg",
            size === "xl"
              ? "size-20 *:data-[slot=avatar-fallback]:text-2xl"
              : "size-16",
          )}
        />
        {busy ? (
          <span
            data-slot="avatar-picker-busy"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60"
          >
            <Spinner className="size-5" />
          </span>
        ) : null}
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            aria-describedby={message ? messageId : undefined}
            data-slot="avatar-picker-upload"
            onClick={drop.open}
          >
            {hasImage ? changeLabel : uploadLabel}
          </Button>
          {hasImage && onRemove ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              data-slot="avatar-picker-remove"
              onClick={() => {
                setRefused(null);
                onRemove();
              }}
            >
              {removeLabel}
            </Button>
          ) : null}
        </div>
        {/* The visible line; the Announcer below is what speaks it. */}
        {message ? (
          <p
            id={messageId}
            data-slot="avatar-picker-message"
            className="text-xs text-destructive-text"
          >
            {message}
          </p>
        ) : null}
      </div>
      <input {...drop.inputProps} />
      <Announcer />
    </div>
  );
}
