// @vegastack avatar-picker@0.23.47 sha256-2mEITrQ2iYdO1A3EwkLgdnOVP/+WFxSbTK7bD9tJHwM=

"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
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
 * AvatarPicker — a person's own photo, edited in place: the avatar IS the control. Hover or
 * keyboard focus lays a scrim with a pencil over the circle; a click opens the file browser (on a
 * phone the browser offers the camera and the gallery). On a device without hover a small pencil
 * badge sits on the circle's edge instead, so the photo is never covered. While `busy` the scrim
 * stays up with a spinner, over an instant local preview of the chosen file. "Remove" is a small
 * ghost button beside the circle while a photo exists, and one line beside it shows a refused
 * file or an `error`.
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
   * The circle: `sm` 40px, `md` 48px, `lg` 64px, `xl` 80px; the initials scale with it.
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * The circle's accessible name while there is no photo.
   * @default "Upload photo"
   */
  uploadLabel?: string;
  /**
   * The circle's accessible name once there is a photo.
   * @default "Change photo"
   */
  changeLabel?: string;
  /**
   * The remove button's label.
   * @default "Remove"
   */
  removeLabel?: string;
}

/** The circle and its initials, per size. */
const CIRCLE: Record<NonNullable<AvatarPickerProps["size"]>, string> = {
  sm: "size-10 *:data-[slot=avatar-fallback]:text-sm",
  md: "size-12 *:data-[slot=avatar-fallback]:text-base",
  lg: "size-16 *:data-[slot=avatar-fallback]:text-lg",
  xl: "size-20 *:data-[slot=avatar-fallback]:text-2xl",
};

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
 * `AvatarPicker` — upload, change or remove a person's photo: the avatar is the button.
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
  size = "md",
  uploadLabel = "Upload photo",
  changeLabel = "Change photo",
  removeLabel = "Remove",
  className,
  ...props
}: AvatarPickerProps) {
  const [refused, setRefused] = React.useState<string | null>(null);
  // An instant local preview of the chosen file, shown under the spinner while `busy`. It is
  // revoked when it is replaced, on unmount, and when `busy` ends (the app's URL takes over).
  const [preview, setPreview] = React.useState<string | null>(null);
  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const [wasBusy, setWasBusy] = React.useState(busy);
  if (wasBusy !== busy) {
    setWasBusy(busy);
    if (!busy) setPreview(null);
  }
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
      const file = files[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));
      onSelect(file);
    },
    onFilesRejected: (rejections) => {
      const text = rejections[0] ? refusal(rejections[0], maxSize) : null;
      setRefused(text);
      if (text) announce(text);
    },
  });
  const message = refused ?? error;
  const hasImage = Boolean(person.image);
  const shown = busy && preview ? { ...person, image: preview } : person;
  const icon = size === "sm" ? "size-3.5" : "size-4";
  const showMeta = (hasImage && onRemove) || message;

  return (
    <div
      data-slot="avatar-picker"
      data-size={size}
      className={cn("flex items-center gap-3", className)}
      {...props}
    >
      <Button
        type="button"
        variant="ghost"
        data-slot="avatar-picker-trigger"
        aria-label={hasImage ? changeLabel : uploadLabel}
        aria-describedby={message ? messageId : undefined}
        aria-busy={busy || undefined}
        disabled={busy}
        onClick={drop.open}
        // The circle is the control: no box of its own, no press nudge, and busy keeps it opaque.
        className="h-auto shrink-0 cursor-pointer rounded-full p-0 hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 data-disabled:not-data-loading:opacity-100"
      >
        <PersonAvatar
          person={shown}
          size="default"
          data-slot="avatar-picker-avatar"
          // Whenever the scrim shows (hover, keyboard focus, busy) the initials fade out, so only
          // the icon sits on the hue. `group-hover` only matches where hover exists, so a touch
          // device keeps its initials beside the corner badge.
          className={cn(
            CIRCLE[size],
            "*:data-[slot=avatar-fallback]:transition-colors *:data-[slot=avatar-fallback]:duration-150",
            busy
              ? "*:data-[slot=avatar-fallback]:text-transparent"
              : "group-hover/button:*:data-[slot=avatar-fallback]:text-transparent group-focus-visible/button:*:data-[slot=avatar-fallback]:text-transparent",
          )}
        />
        {/* Hover and keyboard focus: the modal scrim's ink (no blur, so the photo stays readable) over the circle, a white pencil on it. A
            device without hover never gets it (the badge below stands in), except while busy. */}
        <span
          aria-hidden="true"
          data-slot="avatar-picker-overlay"
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity duration-150",
            busy
              ? "opacity-100"
              : "opacity-0 group-hover/button:opacity-100 group-focus-visible/button:opacity-100 [@media(hover:none)]:hidden",
          )}
        >
          {/* `data-icon-tone` stands the icons down from the ghost Button's muted/hover svg ink,
              so they keep the scrim's white. */}
          {busy ? (
            <Spinner data-icon-tone="" className={icon} />
          ) : (
            <Pencil data-icon-tone="" className={icon} />
          )}
        </span>
        {busy ? null : (
          <span
            aria-hidden="true"
            data-slot="avatar-picker-badge"
            className="absolute -end-0.5 -bottom-0.5 hidden size-5 items-center justify-center rounded-full border border-border bg-background text-foreground [@media(hover:none)]:flex"
          >
            <Pencil className="size-3" />
          </span>
        )}
      </Button>
      {showMeta ? (
        <div className="flex min-w-0 flex-col items-start gap-1">
          {hasImage && onRemove ? (
            <Button
              variant="ghost"
              size="xs"
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
      ) : null}
      <input {...drop.inputProps} />
      <Announcer />
    </div>
  );
}
