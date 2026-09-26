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

/** Busy — an upload in flight: a spinner covers the avatar and the buttons wait. */
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

/** Error — a failure the app found after acquisition, on the message line; `size="xl"` is 80px. */
export function avatarPickerError(): ReactNode {
  return (
    <Wrapper>
      <AvatarPicker
        person={{ name: "Yuki Tan", hue: "orange" }}
        size="xl"
        error="IMG_2041.heic is a HEIC photo. Export it as JPEG and try again."
        onSelect={() => {}}
      />
    </Wrapper>
  );
}
