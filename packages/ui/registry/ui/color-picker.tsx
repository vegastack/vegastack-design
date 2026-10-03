// @vegastack color-picker@0.23.116 sha256-E1ANeeJUl2KMoPskmHOtAzlu2AAfY05+dqy/k1qHwyw=

"use client";

import * as React from "react";
import { Ban, Check } from "lucide-react";
import { cn } from "@vegastack/design";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useListNav } from "@/components/ui/use-list-nav";

/* ------------------------------------------------------------------------------------------------
 * ColorPicker — a swatch-triggered popover that presents a grid of preset colors. The trigger shows
 * the current selection; opening it reveals the palette, and picking a swatch fires `onValueChange`
 * and marks the chosen swatch with a check. Built on our `Popover` + `Button`.
 *
 * The palette is data: each `ColorOption` carries a `name` (the stable value the picker emits and
 * matches selection against) plus a CSS color `value`. The default palette keeps familiar hue names
 * while using only VegaStack semantic CSS variables (`var(--color-info)`, `var(--color-success)`,
 * chart tokens, etc.).
 *
 * INLINE-STYLE EXCEPTION (the one allowed case): a swatch's background is a *dynamic, user-supplied
 * color value*, not a static design token — there is no semantic Tailwind utility for "the color the
 * consumer passed in". It is therefore set via `style={{ backgroundColor }}`. This is the single
 * sanctioned direct-visual-property `style={}` usage in the design system (design-lint scopes the
 * exception to this file's swatch fill). Everything else (sizing, borders, focus, spacing) uses
 * semantic tokens. The dynamic swatch-grid column count is NOT a direct visual property: it is
 * passed as a CSS custom property (`--swatch-cols`) and consumed by an arbitrary-value class, so the
 * inline `style` there only sets a `--*` variable (the contract-clean form for runtime layout).
 * ----------------------------------------------------------------------------------------------*/

/**
 * A single selectable color in the picker's palette.
 */
export interface ColorOption {
  /**
   * Stable identifier for the color — this is the value `onValueChange` emits and the value matched
   * against `value` to determine the selected swatch (e.g. `"blue"`).
   */
  name: string;
  /**
   * Human-readable label, used as the swatch's accessible name (`aria-label`) and its tooltip
   * (`title`) — e.g. `"Blue"`.
   */
  label: string;
  /**
   * Any CSS color the swatch renders as its background. Prefer semantic design-token variables
   * (`var(--color-info)`, `var(--color-chart-2)`, …). Consumer-provided arbitrary colors are
   * allowed only as dynamic user data, so the value is applied via inline `style` (the sanctioned
   * exception — see the file header).
   */
  color: string;
}

/**
 * Default 12-color palette. Names are stable semantic values for form state, and each swatch uses a
 * VegaStack token (status, neutral, or chart series) so the registry component does not ship
 * raw Tailwind palette variables.
 *
 * `yellow` maps to `--color-chart-7` (hue ~104 — the one token that is genuinely yellow in BOTH
 * themes). There is no second yellow-family token, so the palette carries a single yellow/olive
 * entry rather than a near-duplicate `lime` swatch.
 */
export const DEFAULT_COLORS: readonly ColorOption[] = [
  { name: "gray", label: "Gray", color: "var(--color-primary)" },
  { name: "red", label: "Red", color: "var(--color-destructive)" },
  { name: "orange", label: "Orange", color: "var(--color-chart-4)" },
  { name: "amber", label: "Amber", color: "var(--color-warning)" },
  { name: "yellow", label: "Yellow", color: "var(--color-chart-7)" },
  { name: "green", label: "Green", color: "var(--color-success)" },
  { name: "teal", label: "Teal", color: "var(--color-chart-2)" },
  { name: "sky", label: "Sky", color: "var(--color-info)" },
  { name: "blue", label: "Blue", color: "var(--color-chart-8)" },
  { name: "indigo", label: "Indigo", color: "var(--color-chart-3)" },
  { name: "pink", label: "Pink", color: "var(--color-chart-5)" },
  { name: "rose", label: "Rose", color: "var(--color-chart-6)" },
] as const;

/**
 * The ten tag hues as a palette — the same `--tag-*` colours `Chip`, `Avatar` and `SpaceAvatar`
 * draw with, so a picked hue is exactly the hue a tile or chip shows. Each `name` is the hue's
 * value (`"blue"`, `"cyan"`, …), ready to store as an `AvatarHue` / `ChipHue`.
 */
export const HUE_COLORS: readonly ColorOption[] = [
  { name: "blue", label: "Blue", color: "var(--tag-blue)" },
  { name: "cyan", label: "Cyan", color: "var(--tag-cyan)" },
  { name: "green", label: "Green", color: "var(--tag-green)" },
  { name: "lime", label: "Lime", color: "var(--tag-lime)" },
  { name: "yellow", label: "Yellow", color: "var(--tag-yellow)" },
  { name: "orange", label: "Orange", color: "var(--tag-orange)" },
  { name: "red", label: "Red", color: "var(--tag-red)" },
  { name: "pink", label: "Pink", color: "var(--tag-pink)" },
  { name: "magenta", label: "Magenta", color: "var(--tag-magenta)" },
  { name: "purple", label: "Purple", color: "var(--tag-purple)" },
] as const;

/** Props accepted by `ColorPicker`. */
export interface ColorPickerProps {
  /**
   * The currently selected color, matched against each `ColorOption.name`. When it matches an option,
   * that swatch shows a check and the trigger renders its color.

   * @default undefined
   */
  value?: string;
  /**
   * Fired when a swatch is picked, with the chosen `ColorOption.name`.

   * @default undefined
   */
  onValueChange?: (value: string) => void;
  /**
   * The palette to render.
   * @default DEFAULT_COLORS
   */
  colors?: readonly ColorOption[];
  /**
   * Number of columns in the swatch grid.
   * @default 7
   */
  columns?: number;
  /**
   * `popover` — a swatch trigger that opens the grid. `inline` — the swatch grid itself, in the
   * page (a settings row), with no trigger.
   * @default "popover"
   */
  variant?: "popover" | "inline";
  /**
   * Adds a first "None" swatch that clears the colour; it is selected while `value` matches no
   * option. Omit for no None swatch.
   * @default undefined
   */
  onClear?: () => void;
  /**
   * The None swatch's accessible name.
   * @default "None"
   */
  clearLabel?: string;
  /**
   * Disables the trigger and every swatch.
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessible name for the trigger button.
   * @default "Pick a color"
   */
  "aria-label"?: string;
  /**
   * Extra classes for the trigger swatch button.

   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the trigger button — the component's focusable root (the popover content is
   * portaled, so the trigger is the stable host element to focus/measure).

   * @default undefined
   */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * `ColorPicker` — pick a preset color from a popover grid. The trigger is a `rounded-md` control
 * showing the current selection; opening it reveals the palette, and selecting a swatch fires
 * `onValueChange` (with the color's `name`) and marks that swatch with a primary border plus a
 * semantic-surface check badge.
 *
 * Controlled-only: pass `value` + `onValueChange`. The displayed colors come from `colors` (defaults
 * to {@link DEFAULT_COLORS}).
 *
 * **Keyboard:** the swatch group uses a roving tabindex — only one swatch is
 * ever Tab-reachable at a time. `ArrowLeft`/`ArrowRight` move one swatch; `ArrowUp`/`ArrowDown` move
 * by `columns`; `Home`/`End` jump to the first/last swatch in the whole grid. The active swatch
 * starts on the current `value` (falling back to the first swatch), and clicking or focusing a
 * swatch updates it — click selection itself is unchanged.
 *
 * `variant="inline"` renders the grid in place (no popover), and `onClear` adds a "None" swatch —
 * with `colors={HUE_COLORS}` that is the hue row of a space or tag settings form.
 *
 * @example
 * const [color, setColor] = React.useState('blue');
 * <ColorPicker value={color} onValueChange={setColor} />
 * <ColorPicker variant="inline" colors={HUE_COLORS} columns={11} value={hue} onValueChange={setHue} onClear={() => setHue(undefined)} />
 */
export function ColorPicker({
  value,
  onValueChange,
  colors = DEFAULT_COLORS,
  columns = 7,
  variant = "popover",
  onClear,
  clearLabel = "None",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Pick a color",
  ref,
}: ColorPickerProps) {
  const selected = colors.find((c) => c.name === value);
  const columnCount = Number.isFinite(columns)
    ? Math.max(1, Math.floor(columns))
    : 1;
  // The None swatch, when there is one, is index 0 and every colour shifts by one.
  const offset = onClear ? 1 : 0;
  const count = colors.length + offset;

  // Roving tabindex via the shared `useListNav` hook: exactly one swatch is in the tab order
  // (`tabIndex 0`) at a time — the rest are `-1` — so Tab only stops once on the swatch group.
  // Arrow keys move the "active" index (and DOM focus) around the grid, RTL-aware; click
  // selection is unchanged. The active index STARTS on the color selected at mount (falling back
  // to the first swatch); it does not re-track later `value` changes.
  const selectedIndex = selected ? colors.indexOf(selected) + offset : 0;
  const {
    setActiveIndex,
    handleKeyDown: handleGridKeyDown,
    getItemProps,
  } = useListNav({
    count,
    columns: columnCount,
    defaultActiveIndex: selectedIndex,
    disabled,
  });

  const grid = (
    <div
      role="group"
      aria-label={variant === "inline" ? ariaLabel : "Colors"}
      data-slot={variant === "inline" ? "color-picker" : undefined}
      data-variant={variant}
      onKeyDown={handleGridKeyDown}
      // Grid column count is dynamic (driven by `columns`). The inline style sets ONLY a CSS
      // custom property (`--swatch-cols`); the arbitrary-value class consumes it as the grid
      // template — so no direct visual property is set inline, which is what keeps this
      // clear of the inline-style ban.
      className={cn(
        "grid w-fit gap-1.5 grid-cols-[repeat(var(--swatch-cols),minmax(0,1fr))]",
        variant === "inline" && className,
      )}
      style={{ ["--swatch-cols"]: String(columnCount) } as React.CSSProperties}
    >
      {onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={clearLabel}
          aria-pressed={!selected}
          title={clearLabel}
          {...getItemProps(0)}
          onClick={() => {
            setActiveIndex(0);
            onClear();
          }}
          className="rounded-full hover:bg-transparent"
        >
          <span
            data-slot="color-picker-swatch"
            data-none=""
            className={cn(
              "flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground",
              !selected && "border-primary text-foreground",
            )}
          >
            <Ban className="size-3" aria-hidden />
          </span>
        </Button>
      ) : null}
      {colors.map((color, i) => {
        const index = i + offset;
        const isSelected = color.name === value;
        return (
          <Button
            key={color.name}
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={color.label}
            aria-pressed={isSelected}
            title={color.label}
            // Roving tabindex, registration ref, and focus sync from the shared hook.
            {...getItemProps(index)}
            onClick={() => {
              setActiveIndex(index);
              onValueChange?.(color.name);
            }}
            className="rounded-full hover:bg-transparent"
          >
            <span
              data-slot="color-picker-swatch"
              className={cn(
                "flex size-5 items-center justify-center rounded-full border border-border bg-clip-padding",
                // Selected swatch reads its state through the primary border (selection = primary ink).
                isSelected && "border-primary",
              )}
              // Dynamic user color — the sanctioned inline-style exception (see file header).
              style={{ backgroundColor: color.color }}
            >
              {isSelected ? (
                <span
                  data-slot="color-picker-check"
                  className="flex size-3.5 items-center justify-center rounded-full bg-background text-foreground"
                >
                  <Check className="size-3" aria-hidden />
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );

  if (variant === "inline") return grid;

  return (
    <Popover>
      <PopoverTrigger
        ref={ref}
        disabled={disabled}
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={ariaLabel}
            // The trigger is a control, so it keeps Button's own corner; a swatch grid cell is round.
            className={className}
          >
            <span
              data-slot="color-picker-swatch"
              // Fill chip echoes the control geometry (`rounded-sm`), not a round dot.
              className="size-3.5 rounded-sm border border-border bg-clip-padding"
              // Dynamic user color — the sanctioned inline-style exception (see file header).
              // Dynamic swatch color, not a design token.
              style={selected ? { backgroundColor: selected.color } : undefined}
            />
          </Button>
        }
      />
      <PopoverContent
        data-slot="color-picker"
        align="start"
        className="w-auto p-2"
      >
        {grid}
      </PopoverContent>
    </Popover>
  );
}
