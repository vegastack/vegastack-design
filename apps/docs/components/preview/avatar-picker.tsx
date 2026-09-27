"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { AvatarPicker } from "@/components/ui/avatar-picker";

const MB = 1024 * 1024;
const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Default — the circle is the whole control. Click it for the dialog: pick or drop a photo (it is
 * only staged), then Update. The demo "saves" after a second; Remove clears it again.
 */
export function avatarPicker(): ReactNode {
  const [image, setImage] = React.useState<string | null>(null);
  return (
    <Wrapper>
      <AvatarPicker
        person={{ name: "Asha Rao", hue: "blue", image }}
        maxSize={10 * MB}
        onUpload={async (file) => {
          await wait(1000);
          setImage(URL.createObjectURL(file));
        }}
        onRemove={async () => {
          await wait(600);
          setImage(null);
        }}
      />
    </Wrapper>
  );
}

/** With a photo — the dialog offers Remove beside Update. */
export function avatarPickerImage(): ReactNode {
  const [image, setImage] = React.useState<string | null>(
    "/preview/avatar-1.svg",
  );
  return (
    <Wrapper>
      <AvatarPicker
        size="lg"
        person={{ name: "Ada Lovelace", hue: "pink", image }}
        maxSize={10 * MB}
        onUpload={async (file) => {
          await wait(1000);
          setImage(URL.createObjectURL(file));
        }}
        onRemove={async () => {
          await wait(600);
          setImage(null);
        }}
      />
    </Wrapper>
  );
}

/** A failing save — the dialog stays open, keeps the staged photo and shows the error. */
export function avatarPickerError(): ReactNode {
  return (
    <Wrapper>
      <AvatarPicker
        size="lg"
        person={{ name: "Yuki Tan", hue: "orange" }}
        maxSize={10 * MB}
        onUpload={async () => {
          await wait(800);
          throw new Error("We couldn't save your photo. Try again.");
        }}
      />
    </Wrapper>
  );
}

/** The five sizes: 32, 40 (default), 48, 64 and 80px; the initials scale with the circle. */
export function avatarPickerSizes(): ReactNode {
  return (
    <Wrapper>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <AvatarPicker
          key={size}
          size={size}
          person={{ name: "Asha Rao", hue: "blue" }}
          onUpload={() => wait(500)}
        />
      ))}
    </Wrapper>
  );
}

/** The hover and keyboard-focus look, held open for the page: the scrim and the white pencil. */
export function avatarPickerHover(): ReactNode {
  const held =
    "[&_[data-slot=avatar-picker-overlay]]:opacity-100 [&_[data-slot=avatar-fallback]]:text-transparent";
  return (
    <Wrapper>
      <AvatarPicker
        size="lg"
        className={held}
        person={{
          name: "Ada Lovelace",
          hue: "pink",
          image: "/preview/avatar-1.svg",
        }}
        onUpload={() => wait(500)}
      />
      <AvatarPicker
        size="lg"
        className={held}
        person={{ name: "Lena Ortiz", hue: "purple" }}
        onUpload={() => wait(500)}
      />
    </Wrapper>
  );
}
