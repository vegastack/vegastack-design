"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { AvatarPicker } from "@/components/ui/avatar-picker";

const MB = 1024 * 1024;

/**
 * Default — no photo yet: initials on the member's hue and "Upload photo". Choosing a file shows
 * it (a local object URL stands in for the app's upload), after which "Change photo" and "Remove"
 * appear.
 */
export function avatarPicker(): ReactNode {
  const [image, setImage] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  return (
    <Wrapper>
      <AvatarPicker
        person={{ name: "Asha Rao", hue: "blue", image }}
        busy={busy}
        maxSize={10 * MB}
        onSelect={(file) => {
          setBusy(true);
          const url = URL.createObjectURL(file);
          window.setTimeout(() => {
            setImage(url);
            setBusy(false);
          }, 800);
        }}
        onRemove={() => setImage(null)}
      />
    </Wrapper>
  );
}

/** With a photo — "Change photo" and "Remove". */
export function avatarPickerImage(): ReactNode {
  return (
    <Wrapper>
      <AvatarPicker
        person={{
          name: "Ada Lovelace",
          hue: "pink",
          image: "/preview/avatar-1.svg",
        }}
        onSelect={() => {}}
        onRemove={() => {}}
      />
    </Wrapper>
  );
}

/** Busy — an upload in flight: the scrim stays up with a spinner and the controls wait. */
export function avatarPickerBusy(): ReactNode {
  return (
    <Wrapper>
      <AvatarPicker
        person={{ name: "Lena Ortiz", hue: "purple" }}
        busy
        onSelect={() => {}}
      />
    </Wrapper>
  );
}

/** Error — a failure the app found after acquisition, on the message line beside the circle. */
export function avatarPickerError(): ReactNode {
  return (
    <Wrapper>
      <AvatarPicker
        person={{ name: "Yuki Tan", hue: "orange" }}
        error="IMG_2041.heic is a HEIC photo. Export it as JPEG and try again."
        onSelect={() => {}}
      />
    </Wrapper>
  );
}

/** The four sizes: 40, 48 (default), 64 and 80px; the initials scale with the circle. */
export function avatarPickerSizes(): ReactNode {
  return (
    <Wrapper>
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <AvatarPicker
          key={size}
          size={size}
          person={{ name: "Asha Rao", hue: "blue" }}
          onSelect={() => {}}
        />
      ))}
    </Wrapper>
  );
}

/** The hover and keyboard-focus look, held open for the page: the scrim and the pencil. */
export function avatarPickerHover(): ReactNode {
  return (
    <Wrapper>
      <AvatarPicker
        size="lg"
        className="[&_[data-slot=avatar-picker-overlay]]:opacity-100"
        person={{
          name: "Ada Lovelace",
          hue: "pink",
          image: "/preview/avatar-1.svg",
        }}
        onSelect={() => {}}
      />
      <AvatarPicker
        size="lg"
        className="[&_[data-slot=avatar-picker-overlay]]:opacity-100"
        person={{ name: "Lena Ortiz", hue: "purple" }}
        onSelect={() => {}}
      />
    </Wrapper>
  );
}
