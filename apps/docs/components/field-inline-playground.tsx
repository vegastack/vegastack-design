"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { FieldInline } from "@/components/ui/field-inline";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type FieldInlinePlaygroundKey = "borderless" | "disabled" | "readOnly";

/**
 * `FieldInline` requires a controlled `value` + `onCommit`; this thin wrapper owns that value so
 * committed edits persist across control changes. State only changes on reader interaction —
 * the initial render is deterministic (VRT-stable).
 */
function FieldInlineDemo({
  borderless,
  disabled,
  readOnly,
}: {
  borderless: boolean;
  disabled: boolean;
  readOnly: boolean;
}) {
  const [value, setValue] = React.useState("Quarterly planning notes");
  return (
    <FieldInline
      value={value}
      onCommit={setValue}
      label="Document title"
      placeholder="Add a title…"
      borderless={borderless}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}

const fieldInlinePlaygroundConfig: PlaygroundConfig<FieldInlinePlaygroundKey> =
  {
    controls: [
      {
        type: "switch",
        key: "borderless",
        label: "Borderless",
        defaultValue: false,
      },
      {
        type: "switch",
        key: "disabled",
        label: "Disabled",
        defaultValue: false,
      },
      {
        type: "switch",
        key: "readOnly",
        label: "Read-only",
        defaultValue: false,
      },
    ],
    render: (state): ReactNode => (
      <FieldInlineDemo
        borderless={Boolean(state.borderless)}
        disabled={Boolean(state.disabled)}
        readOnly={Boolean(state.readOnly)}
      />
    ),
    toCode: (state) => {
      const props: string[] = [
        "value={title}",
        "onCommit={setTitle}",
        'label="Document title"',
      ];
      if (state.borderless) props.push("borderless");
      if (state.disabled) props.push("disabled");
      if (state.readOnly) props.push("readOnly");
      return `<FieldInline ${props.join(" ")} />`;
    },
  };

/**
 * `FieldInlinePlayground` — interactive props playground for `FieldInline` (borderless /
 * disabled / readOnly) around a click-to-edit value. Backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/field-inline.mdx`.
 */
export function FieldInlinePlayground() {
  return <PropsPlayground {...fieldInlinePlaygroundConfig} />;
}
