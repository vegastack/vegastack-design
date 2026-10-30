// @vegastack option-list-editor@0.26.4 sha256-3ZRq80KDt1r7Rb/0mkZ7vbdqewdTmu4Cnr+QeHxm3Co=

"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import type { ChipHue } from "@/components/ui/chip";
import { ColorPicker, HUE_COLORS } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { stopMenuTyping } from "@/components/ui/dropdown-menu-form";

/* ---
`OptionListEditor` edits a choice field's options — a hue, a name, remove, and add — as a list of
rows. It holds no state: the options are the host's, `onChange` follows every edit (so the host
can show it), and `onCommit` says an edit is done (a name left, a hue picked, an option removed),
which is when a host saves.

Deliberately NOT done here:
- No validation: duplicate or empty names are the host's to refuse.
- No reordering: an option's place in the list is its order, and the host decides how to move it.
--- */

/** One option of a choice field. */
export interface OptionListEditorOption {
  /** Stable id — what a value stores. */
  id: string;
  /** Its name. */
  label: string;
  /**
   * One of the ten tag hues (`HUE_COLORS` in `color-picker`).
   * @default undefined — neutral
   */
  hue?: ChipHue;
}

/** The words the editor shows; each is a function of what it names, or the label itself. */
export interface OptionListEditorLabels {
  /** A row's name field, by its place in the list (1-based). @default (n) => `Option ${n}` */
  option: (position: number) => string;
  /** A row's hue picker, by the option's name. @default (name) => `Colour of ${name}` */
  hue: (name: string) => string;
  /** A row's remove button, by the option's name. @default (name) => `Remove ${name}` */
  remove: (name: string) => string;
  /** The add button. @default "Add option" */
  add: string;
}

const DEFAULT_LABELS: OptionListEditorLabels = {
  option: (position) => `Option ${position}`,
  hue: (name) => `Colour of ${name}`,
  remove: (name) => `Remove ${name}`,
  add: "Add option",
};

/** Props accepted by `OptionListEditor`. */
export interface OptionListEditorProps {
  /** The options, in order. */
  options: readonly OptionListEditorOption[];
  /** The list after every edit, keystrokes included. */
  onChange: (options: OptionListEditorOption[]) => void;
  /**
   * The list when an edit is done: a name left (blur) or confirmed with Enter, a hue picked, an
   * option removed. An added option is not committed until it is named.
   */
  onCommit: (options: OptionListEditorOption[]) => void;
  /**
   * Make an id for an added option.
   * @default crypto.randomUUID
   */
  createId?: () => string;
  /**
   * The most characters a name holds.
   * @default 200
   */
  maxLength?: number;
  /**
   * The editor sits inside a menu: typing in a name stays the field's own (the menu's arrow-key
   * and type-ahead handling does not see it).
   * @default false
   */
  inMenu?: boolean;
  /**
   * The words shown, in part or whole.
   * @default English
   */
  labels?: Partial<OptionListEditorLabels>;
  /** Extra classes for the root. @default undefined */
  className?: string;
}

/**
 * `OptionListEditor` — a choice field's options as rows of hue, name and remove, with an add
 * button. `onChange` follows every keystroke; `onCommit` fires when an edit is done. Enter in a
 * name commits it (and never submits a form around the editor).
 *
 * @example
 * <OptionListEditor options={options} onChange={setOptions} onCommit={save} />
 */
export function OptionListEditor({
  options,
  onChange,
  onCommit,
  createId = () => crypto.randomUUID(),
  maxLength = 200,
  inMenu = false,
  labels: labelsProp,
  className,
}: OptionListEditorProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const list = [...options];
  const set = (
    id: string,
    patch: Partial<OptionListEditorOption>,
    commit: boolean,
  ) => {
    const next = list.map((o) => (o.id === id ? { ...o, ...patch } : o));
    onChange(next);
    if (commit) onCommit(next);
  };
  return (
    <div
      data-slot="option-list-editor"
      className={cn("flex flex-col gap-2", className)}
    >
      <ul className="flex flex-col gap-2">
        {list.map((option, index) => {
          const name = option.label || `option ${index + 1}`;
          return (
            <li
              key={option.id}
              data-slot="option-list-editor-row"
              className="flex items-center gap-2"
            >
              <ColorPicker
                colors={HUE_COLORS}
                value={option.hue ?? ""}
                onValueChange={(hue) =>
                  set(option.id, { hue: hue as ChipHue }, true)
                }
                aria-label={labels.hue(name)}
              />
              <Input
                value={option.label}
                maxLength={maxLength}
                aria-label={labels.option(index + 1)}
                onChange={(event) =>
                  set(option.id, { label: event.target.value }, false)
                }
                onBlur={() => onCommit(list)}
                onKeyDown={(event) => {
                  if (inMenu) stopMenuTyping(event);
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    onCommit(list);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={labels.remove(name)}
                onClick={() => {
                  const next = list.filter((o) => o.id !== option.id);
                  onChange(next);
                  onCommit(next);
                }}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...list, { id: createId(), label: "" }])}
      >
        <Plus aria-hidden />
        {labels.add}
      </Button>
    </div>
  );
}
