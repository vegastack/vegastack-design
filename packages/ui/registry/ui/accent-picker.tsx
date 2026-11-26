// @vegastack accent@0.136.4 sha256-QwjkAL5uCfoMTZr3i7Vb6zDPebvAxD3MTomcB+9Z500=

"use client";

import * as React from "react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { Building2, Check } from "lucide-react";
import { cn } from "@vegastack/design";
import {
  ACCENTS,
  isAccentId,
  type AccentId,
} from "@vegastack/design-tokens/accents";
import { RadioGroup } from "@/components/ui/radio-group";

/** The radio value of the option that follows the workspace, whose `value` is `null`. */
const FOLLOW = "workspace";

/** Props accepted by `AccentPicker`. */
export interface AccentPickerProps extends Omit<
  React.ComponentProps<typeof RadioGroup>,
  "value" | "defaultValue" | "onValueChange" | "children"
> {
  /** The chosen accent; `null` follows the workspace (only with `workspaceAccent`). */
  value: AccentId | null;
  /** Called with the new choice; `null` when the workspace's is chosen. */
  onValueChange: (value: AccentId | null) => void;
  /**
   * The workspace's own accent. Given, a first option follows it; left out, only the colours show.
   * @default undefined
   */
  workspaceAccent?: AccentId;
  /**
   * The words on the option that follows the workspace.
   * @default "Workspace theme"
   */
  workspaceLabel?: string;
  /**
   * Other names for the colours, by id.
   * @default undefined
   */
  labels?: Partial<Record<AccentId, string>>;
}

function Option({
  value,
  accent,
  label,
  name,
  className,
}: {
  value: string;
  accent: AccentId;
  label: string;
  /** The accessible name, where it says more than the label. */
  name?: string;
  className?: string;
}) {
  const id = React.useId();
  return (
    <RadioPrimitive.Root
      value={value}
      data-slot="accent-picker-option"
      // Inside a `Field` Base UI would name every option after the field; an option is its colour.
      render={(optionProps: React.ComponentProps<"span">) => (
        <span
          {...optionProps}
          aria-label={name}
          aria-labelledby={name ? undefined : id}
        />
      )}
      className={cn(
        "group/accent-option flex min-h-22 min-w-0 cursor-pointer flex-col items-center gap-2 rounded-item px-0.5 py-3 text-center text-xs select-none state-layer data-disabled:cursor-not-allowed data-disabled:opacity-50 @min-[40rem]/accent-picker:text-sm",
        className,
      )}
    >
      <span
        data-slot="accent-picker-swatch"
        // Only the swatch wears the colour; the name and the focus tint stay the page's.
        data-accent={accent}
        className="grid size-10 flex-none place-items-center rounded-full bg-primary text-primary-foreground forced-color-adjust-none"
      >
        {value === FOLLOW ? (
          <Building2
            aria-hidden="true"
            className="col-start-1 row-start-1 size-4.5 group-data-checked/accent-option:hidden"
          />
        ) : null}
        <Check
          data-slot="accent-picker-check"
          aria-hidden="true"
          strokeWidth={2.5}
          className="col-start-1 row-start-1 hidden size-4.5 group-data-checked/accent-option:block"
        />
      </span>
      <span id={id} className="group-data-checked/accent-option:font-medium">
        {label}
      </span>
    </RadioPrimitive.Root>
  );
}

/**
 * `AccentPicker` — the seven colours as a radio group of round swatches with their names. With
 * `workspaceAccent` a first option, marked with a building, follows the workspace (its value is
 * `null`). The chosen one shows a check on its colour and a heavier name, never an outline; arrow
 * keys move the choice. It applies nothing itself: call `setAccent` and save in `onValueChange`.
 * Give it a label; on its own it is named "Colour".
 *
 * @example
 * <AccentPicker
 *   value={own}
 *   workspaceAccent={workspace.accent}
 *   onValueChange={(next) => {
 *     setAccent(next ?? workspace.accent);
 *     void save(next);
 *   }}
 * />
 */
export function AccentPicker({
  value,
  onValueChange,
  workspaceAccent,
  workspaceLabel = "Workspace theme",
  labels,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: AccentPickerProps) {
  const name = (id: AccentId) =>
    labels?.[id] ?? ACCENTS.find((accent) => accent.id === id)!.label;
  return (
    <div data-slot="accent-picker" className="@container/accent-picker w-full">
      <RadioGroup
        {...props}
        aria-label={ariaLabel ?? (ariaLabelledby ? undefined : "Colour")}
        aria-labelledby={ariaLabelledby}
        value={value ?? FOLLOW}
        onValueChange={(next) => onValueChange(isAccentId(next) ? next : null)}
        className={cn(
          "auto-rows-fr grid-cols-2 gap-1 @min-[17rem]/accent-picker:grid-cols-4 @min-[40rem]/accent-picker:gap-2",
          workspaceAccent
            ? "@min-[40rem]/accent-picker:grid-cols-8"
            : "@min-[40rem]/accent-picker:max-w-204 @min-[40rem]/accent-picker:grid-cols-7",
          className,
        )}
      >
        {workspaceAccent ? (
          <Option
            value={FOLLOW}
            accent={workspaceAccent}
            label={workspaceLabel}
            name={`${workspaceLabel}, ${name(workspaceAccent)}`}
          />
        ) : null}
        {ACCENTS.map(({ id }) => (
          <Option
            key={id}
            value={id}
            accent={id}
            label={name(id)}
            // Seven in two columns: the last takes its whole row, so nothing is left hanging.
            className={
              workspaceAccent
                ? undefined
                : "last-of-type:col-span-2 @min-[17rem]/accent-picker:last-of-type:col-span-1"
            }
          />
        ))}
      </RadioGroup>
    </div>
  );
}
