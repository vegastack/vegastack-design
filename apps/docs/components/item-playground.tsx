"use client";

import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  type ItemMediaProps,
  type ItemProps,
} from "@/components/ui/item";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ItemPlaygroundKey = "variant" | "size" | "media";

const VARIANT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "outline", label: "Outline" },
  { value: "muted", label: "Muted" },
] as const;

const SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "sm", label: "Small" },
] as const;

const MEDIA_OPTIONS = [
  { value: "default", label: "Default (bare)" },
  { value: "icon", label: "Icon chip" },
  { value: "image", label: "Image tile" },
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

const itemPlaygroundConfig: PlaygroundConfig<ItemPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: VARIANT_OPTIONS,
      defaultValue: "default",
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
      key: "media",
      label: "Media variant",
      options: MEDIA_OPTIONS,
      defaultValue: "default",
    },
  ],
  render: (state): ReactNode => (
    // The outer div is preview-only chrome (constrains the row width); the generated JSX
    // mirrors the `Item` element itself.
    <div className="w-full max-w-md">
      <Item
        variant={state.variant as ItemProps["variant"]}
        size={state.size as ItemProps["size"]}
      >
        <ItemMedia variant={state.media as ItemMediaProps["variant"]}>
          {state.media === "image" ? IMAGE_PLACEHOLDER : <Mail />}
        </ItemMedia>
        <ItemContent>
          <ItemTitle>New message</ItemTitle>
          <ItemDescription>Ada Lovelace sent you a message.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),
  toCode: (state) => {
    const rootProps: string[] = [];
    if (state.variant !== "default")
      rootProps.push(`variant="${state.variant}"`);
    if (state.size !== "default") rootProps.push(`size="${state.size}"`);
    const root = rootProps.length > 0 ? ` ${rootProps.join(" ")}` : "";
    const media = state.media !== "default" ? ` variant="${state.media}"` : "";
    const mediaChild =
      state.media === "image" ? IMAGE_PLACEHOLDER_CODE : "<Mail />";
    return `<Item${root}>
  <ItemMedia${media}>
    ${mediaChild}
  </ItemMedia>
  <ItemContent>
    <ItemTitle>New message</ItemTitle>
    <ItemDescription>Ada Lovelace sent you a message.</ItemDescription>
  </ItemContent>
</Item>`;
  },
};

/**
 * `ItemPlayground` — interactive props playground for `Item` (variant / size / `ItemMedia`
 * variant), backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/item.mdx`.
 */
export function ItemPlayground() {
  return <PropsPlayground {...itemPlaygroundConfig} />;
}
