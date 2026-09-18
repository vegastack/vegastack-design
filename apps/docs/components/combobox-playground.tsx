"use client";

import type { ReactNode } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type ComboboxPlaygroundKey = "showClear" | "disabled" | "invalid";

const FONTS = ["Sans-serif", "Serif", "Monospace", "Cursive", "Fantasy"];

const comboboxPlaygroundConfig: PlaygroundConfig<ComboboxPlaygroundKey> = {
  controls: [
    {
      type: "switch",
      key: "showClear",
      label: "Clear button",
      defaultValue: false,
    },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
    { type: "switch", key: "invalid", label: "Invalid", defaultValue: false },
  ],
  render: (state): ReactNode => (
    <div className="w-64">
      <Combobox items={FONTS}>
        <ComboboxInput
          aria-label="Font family"
          placeholder="Search fonts…"
          showClear={Boolean(state.showClear)}
          disabled={Boolean(state.disabled)}
          aria-invalid={state.invalid ? true : undefined}
        />
        <ComboboxContent>
          <ComboboxEmpty>No fonts found.</ComboboxEmpty>
          {/* Function child = filtered rendering; static ComboboxItem children are NOT auto-filtered. */}
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
  toCode: (state) => {
    const inputProps = [
      'aria-label="Font family"',
      'placeholder="Search fonts…"',
      state.showClear ? "showClear" : "",
      state.disabled ? "disabled" : "",
      state.invalid ? "aria-invalid" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return [
      'const fonts = ["Sans-serif", "Serif", "Monospace", "Cursive", "Fantasy"];',
      "",
      "<Combobox items={fonts}>",
      `  <ComboboxInput ${inputProps} />`,
      "  <ComboboxContent>",
      "    <ComboboxEmpty>No fonts found.</ComboboxEmpty>",
      "    <ComboboxList>",
      "      {(item: string) => (",
      "        <ComboboxItem key={item} value={item}>",
      "          {item}",
      "        </ComboboxItem>",
      "      )}",
      "    </ComboboxList>",
      "  </ComboboxContent>",
      "</Combobox>",
    ].join("\n");
  },
};

/**
 * `ComboboxPlayground` — interactive props playground for `Combobox` (clear button / disabled /
 * invalid) over a small filterable list, using the function-child `ComboboxList` rendering so
 * typing actually filters. Upstream's `ComboboxInput` IS the input group — the toggle and the
 * clear control live inside it, behind `showTrigger` and `showClear` — so the fork's separate
 * wrapper parts and its size axis are gone. Backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/combobox.mdx`.
 */
export function ComboboxPlayground() {
  return <PropsPlayground {...comboboxPlaygroundConfig} />;
}
