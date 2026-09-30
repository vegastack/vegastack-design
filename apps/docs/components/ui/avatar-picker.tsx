// @vegastack avatar-picker@0.23.87 sha256-94OoEVbUkPhIZ7BKZcb1S7cpIdNXrb/8aopqrnqVdZo=

"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  useFileDrop,
  type FileDropRejection,
} from "@/components/ui/use-file-drop";
import { formatBytes } from "@/lib/file-kind";
import { scrimClasses } from "@/lib/tile-overlay";

/* ------------------------------------------------------------------------------------------------
 * AvatarPicker — a person's own photo. Inline it is only the avatar circle: hover or keyboard focus
 * lays a scrim with a white pencil over it (a device without hover shows a small pencil badge on
 * its edge instead), and a click opens a small dialog. In the dialog a 128px circle is itself the
 * file button and a drop target; a chosen or dropped file is only STAGED there as a local preview.
 * "Update" hands it to `onUpload`; "Remove" clears a staged file, else calls `onRemove`. While a
 * call is pending its button shows a spinner, the rest is disabled and the dialog cannot be
 * dismissed; it closes when
 * the call resolves and stays open with the error's message when it rejects. Closing the dialog
 * any other way discards the staged file.
 *
 * Deliberately NOT done here: no upload, no resizing, no cropping, no toasts. The app does the
 * work inside `onUpload` / `onRemove` and passes the new `person.image` back.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `AvatarPicker`. */
export interface AvatarPickerProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The person whose photo this is: the avatar, its initials and hue, and whether a photo exists (`image`). */
  person: Person;
  /**
   * Saves the staged file. The dialog closes when it resolves; when it rejects the dialog stays
   * open, the preview is kept and the error's message shows under the circle.
   */
  onUpload: (file: File) => Promise<void>;
  /**
   * Removes the photo. Called by "Remove" while there is no staged file; omit to hide "Remove". The
   * dialog closes when it resolves and shows the error's message when it rejects.
   * @default undefined
   */
  onRemove?: () => Promise<void>;
  /**
   * The accepted MIME types, comma-separated, as on `<input accept>`. The dialog's hint lists them.
   * @default "image/jpeg,image/png,image/webp"
   */
  accept?: string;
  /**
   * The largest file accepted, in bytes; a larger one is refused with a message.
   * @default undefined
   */
  maxSize?: number;
  /**
   * The inline circle: `xs` 32px, `sm` 40px, `md` 48px, `lg` 64px, `xl` 80px; the initials scale.
   * @default "sm"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * The dialog's title.
   * @default "Profile photo"
   */
  title?: string;
  /**
   * The circles' accessible name while there is no photo.
   * @default "Upload photo"
   */
  uploadLabel?: string;
  /**
   * The circles' accessible name once there is a photo.
   * @default "Change photo"
   */
  changeLabel?: string;
  /**
   * The primary button's label.
   * @default "Update"
   */
  updateLabel?: string;
  /**
   * The secondary button's label.
   * @default "Remove"
   */
  removeLabel?: string;
}

/** The inline circle and its initials, per size, with the icon size that fits it. */
const TRIGGER: Record<
  NonNullable<AvatarPickerProps["size"]>,
  { circle: string; icon: string }
> = {
  xs: {
    circle: "size-8 *:data-[slot=avatar-fallback]:text-xs",
    icon: "size-3.5",
  },
  sm: {
    circle: "size-10 *:data-[slot=avatar-fallback]:text-sm",
    icon: "size-3.5",
  },
  md: {
    circle: "size-12 *:data-[slot=avatar-fallback]:text-base",
    icon: "size-4",
  },
  lg: {
    circle: "size-16 *:data-[slot=avatar-fallback]:text-lg",
    icon: "size-4",
  },
  xl: {
    circle: "size-20 *:data-[slot=avatar-fallback]:text-2xl",
    icon: "size-4",
  },
};

/** The circle-as-a-button chrome: no box, no press nudge, opaque while disabled. */
const CIRCLE_BUTTON =
  "relative h-auto shrink-0 cursor-pointer rounded-full p-0 hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 data-disabled:not-data-loading:opacity-100";

const FORMAT_NAMES: Record<string, string> = {
  jpeg: "JPEG",
  png: "PNG",
  webp: "WebP",
  gif: "GIF",
  avif: "AVIF",
};

/** "JPEG, PNG or WebP · up to 10 MB", from `accept` and `maxSize`. */
function hintText(accept: string, maxSize: number | undefined): string {
  const names = accept
    .split(",")
    .map((type) => type.trim().split("/")[1] ?? "")
    .filter(Boolean)
    .map((sub) => FORMAT_NAMES[sub.toLowerCase()] ?? sub.toUpperCase());
  const list =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`
      : (names[0] ?? "");
  return maxSize !== undefined
    ? `${list} · up to ${formatBytes(maxSize)}`
    : list;
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
    return `${file.name} is larger than ${formatBytes(maxSize)}. Choose a smaller image.`;
  return `${file.name} can't be used. Try another image.`;
}

/**
 * The inside of a circle button: the avatar, the scrim with a white pencil on hover, keyboard
 * focus or `active` (a file dragged over it), and the pencil badge a device without hover gets
 * instead. The initials fade out whenever the scrim shows, so only the icon sits on the hue.
 */
function CircleFace({
  person,
  circle,
  icon,
  active,
  badge,
}: {
  person: Person;
  circle: string;
  icon: string;
  active: boolean;
  badge: string;
}) {
  const shown = active;
  return (
    <>
      <PersonAvatar
        person={person}
        size="default"
        data-slot="avatar-picker-avatar"
        className={cn(
          circle,
          "*:data-[slot=avatar-fallback]:transition-colors *:data-[slot=avatar-fallback]:duration-150",
          shown
            ? "*:data-[slot=avatar-fallback]:text-transparent"
            : "group-hover/button:*:data-[slot=avatar-fallback]:text-transparent group-focus-visible/button:*:data-[slot=avatar-fallback]:text-transparent",
        )}
      />
      {/* The shared photo scrim (`tile-overlay`), no blur, so the photo stays readable. `group-hover` only matches
          where hover exists; a device without it gets the badge below. */}
      <span
        aria-hidden="true"
        data-slot="avatar-picker-overlay"
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-150",
          scrimClasses,
          shown
            ? "opacity-100"
            : "opacity-0 group-hover/button:opacity-100 group-focus-visible/button:opacity-100 [@media(hover:none)]:hidden",
        )}
      >
        {/* `data-icon-tone` stands the pencil down from the ghost Button's svg ink, so it keeps
            the scrim's white. */}
        <Pencil data-icon-tone="" className={icon} />
      </span>
      {shown ? null : (
        <span
          aria-hidden="true"
          data-slot="avatar-picker-badge"
          className={cn(
            "absolute hidden items-center justify-center rounded-full border border-border bg-background text-foreground [@media(hover:none)]:flex",
            badge,
          )}
        >
          <Pencil />
        </span>
      )}
    </>
  );
}

/**
 * `AvatarPicker` — a person's avatar that opens a small dialog to upload, change or remove their
 * photo. The file is staged in the dialog and saved only on "Update".
 *
 * @example
 * <AvatarPicker
 *   person={{ name: "Asha Rao", image: me.image, hue: me.color }}
 *   maxSize={10 * 1024 * 1024}
 *   onUpload={(file) => uploadPhoto(file)}
 *   onRemove={() => removePhoto()}
 * />
 */
export function AvatarPicker({
  person,
  onUpload,
  onRemove,
  accept = "image/jpeg,image/png,image/webp",
  maxSize,
  size = "sm",
  title = "Profile photo",
  uploadLabel = "Upload photo",
  changeLabel = "Change photo",
  updateLabel = "Update",
  removeLabel = "Remove",
  className,
  ...props
}: AvatarPickerProps) {
  const [open, setOpen] = React.useState(false);
  // Which call is in flight: its button shows the spinner, everything else waits.
  const [pending, setPending] = React.useState<"update" | "remove" | null>(
    null,
  );
  const [message, setMessage] = React.useState<string | null>(null);
  // The staged file and its local preview URL; nothing is saved until "Update".
  const [staged, setStaged] = React.useState<{
    file: File;
    url: string;
  } | null>(null);
  React.useEffect(
    () => () => {
      if (staged) URL.revokeObjectURL(staged.url);
    },
    [staged],
  );
  const hintId = React.useId();
  const messageId = React.useId();
  // ONE polite region speaks every refusal and every failed call, once each; the drop hook's own
  // region (its generic "was refused — wrong type") is deliberately not rendered.
  const { announce, Announcer } = useAnnouncer();
  const say = React.useCallback(
    (text: string) => {
      setMessage(text);
      announce(text);
    },
    [announce],
  );

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
    disabled: pending !== null,
    paste: false,
    onFilesAccepted: (files) => {
      const file = files[0];
      if (!file) return;
      setMessage(null);
      setStaged({ file, url: URL.createObjectURL(file) });
    },
    onFilesRejected: (rejections) => {
      if (rejections[0]) say(refusal(rejections[0], maxSize));
    },
  });

  const close = () => {
    setOpen(false);
    setStaged(null);
    setMessage(null);
  };
  const run = async (
    action: "update" | "remove",
    call: () => Promise<void>,
  ) => {
    setPending(action);
    setMessage(null);
    try {
      await call();
      close();
    } catch (error) {
      say(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setPending(null);
    }
  };

  const hasImage = Boolean(person.image);
  const trigger = TRIGGER[size];
  // The drop surface keeps the engine's drag handlers and ref, but not its click, keyboard or tab
  // stop: the circle button inside it is the one control that opens the file browser.
  const {
    onClick: _onClick,
    onKeyDown: _onKeyDown,
    tabIndex: _tabIndex,
    role: _role,
    ...dropSurface
  } = drop.dropProps;

  return (
    <span
      data-slot="avatar-picker"
      data-size={size}
      className={cn("inline-flex", className)}
      {...props}
    >
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // A pending call holds the dialog open; any other close discards the staged file.
          if (pending !== null) return;
          if (next) setOpen(true);
          else close();
        }}
      >
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              data-slot="avatar-picker-trigger"
              aria-label={hasImage ? changeLabel : uploadLabel}
              className={CIRCLE_BUTTON}
            />
          }
        >
          <CircleFace
            person={person}
            circle={trigger.circle}
            icon={trigger.icon}
            active={false}
            badge="-end-0.5 -bottom-0.5 size-4 [&_svg]:size-2.5"
          />
        </DialogTrigger>
        <DialogContent size="sm" data-slot="avatar-picker-dialog">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              {...dropSurface}
              data-slot="avatar-picker-drop"
              // `flex`, not a block: a line box around the circle added a descender gap that
              // grew when a photo replaced the initials.
              className="flex rounded-full"
            >
              <Button
                type="button"
                variant="ghost"
                data-slot="avatar-picker-circle"
                aria-label={staged || hasImage ? changeLabel : uploadLabel}
                aria-describedby={message ? `${hintId} ${messageId}` : hintId}
                disabled={pending !== null}
                onClick={drop.open}
                // While a call is pending the circle only shows the photo: no hover scrim.
                className={cn(
                  CIRCLE_BUTTON,
                  "data-disabled:pointer-events-none",
                )}
              >
                <CircleFace
                  person={staged ? { ...person, image: staged.url } : person}
                  circle="size-32 *:data-[slot=avatar-fallback]:text-4xl"
                  icon="size-6"
                  active={drop.isDragging}
                  badge="end-1 bottom-1 size-8 [&_svg]:size-4"
                />
              </Button>
              {/* Out of the dialog's grid flow: a static input there was a grid item and added a
                  row gap under the footer. `open()` still clicks it while it is not displayed. */}
              <input {...drop.inputProps} className="hidden" />
            </div>
            <p id={hintId} className="text-xs text-muted-foreground">
              {hintText(accept, maxSize)}
            </p>
            {/* The visible line; the Announcer below is what speaks it. */}
            {message ? (
              <p
                id={messageId}
                data-slot="avatar-picker-message"
                className="text-center text-xs text-destructive-text"
              >
                {message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            {hasImage && onRemove ? (
              <Button
                variant="outline"
                loading={pending === "remove"}
                disabled={pending === "update"}
                data-slot="avatar-picker-remove"
                onClick={() => {
                  if (staged) {
                    setStaged(null);
                    setMessage(null);
                  } else void run("remove", onRemove);
                }}
              >
                {removeLabel}
              </Button>
            ) : null}
            <Button
              loading={pending === "update"}
              disabled={pending === "remove" || !staged}
              data-slot="avatar-picker-update"
              onClick={() => {
                if (staged) void run("update", () => onUpload(staged.file));
              }}
            >
              {updateLabel}
            </Button>
          </DialogFooter>
          <Announcer />
        </DialogContent>
      </Dialog>
    </span>
  );
}
