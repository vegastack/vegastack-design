// @vegastack color-picker@0.4.1 sha256-stT5P6uS3nmNAAdW3PSN3zByoYP0Z8f8+NPsYk4Zu60=

"use client";

import * as React from "react";
import { Check } from "lucide-react";
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
 * @example
 * const [color, setColor] = React.useState('blue');
 * <ColorPicker value={color} onValueChange={setColor} />
 */
export function ColorPicker({
  value,
  onValueChange,
  colors = DEFAULT_COLORS,
  columns = 7,
  disabled = false,
  className,
  "aria-label": ariaLabel = "Pick a color",
  ref,
}: ColorPickerProps) {
  const selected = colors.find((c) => c.name === value);
  const columnCount = Number.isFinite(columns)
    ? Math.max(1, Math.floor(columns))
    : 1;

  // Roving tabindex via the shared `useListNav` hook: exactly one swatch is in the tab order
  // (`tabIndex 0`) at a time — the rest are `-1` — so Tab only stops once on the swatch group.
  // Arrow keys move the "active" index (and DOM focus) around the grid, RTL-aware; click
  // selection is unchanged. The active index STARTS on the color selected at mount (falling back
  // to the first swatch); it does not re-track later `value` changes — focusing a swatch or
  // arrowing moves it from there. Home/End keep the shipped whole-grid jump — the hook's
  // `homeEndScope` default — with only ~13 single-row-wrapped swatches by default; pass
  // `homeEndScope: "row"` instead if a future palette renders many rows.
  const selectedIndex = Math.max(
    0,
    colors.findIndex((c) => c.name === value),
  );
  const {
    setActiveIndex,
    handleKeyDown: handleGridKeyDown,
    getItemProps,
  } = useListNav({
    count: colors.length,
    columns: columnCount,
    defaultActiveIndex: selectedIndex,
    disabled,
  });

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
            // Trigger is a control → `rounded-md` (Button's native radius); no `rounded-full`.
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
        <div
          role="group"
          aria-label="Colors"
          onKeyDown={handleGridKeyDown}
          // Grid column count is dynamic (driven by `columns`). The inline style sets ONLY a CSS
          // custom property (`--swatch-cols`); the arbitrary-value class consumes it as the grid
          // template — so no direct visual property is set inline (contract-clean per §7.1).
          className="grid gap-1.5 grid-cols-[repeat(var(--swatch-cols),minmax(0,1fr))]"
          style={
            { ["--swatch-cols"]: String(columnCount) } as React.CSSProperties
          }
        >
          {colors.map((color, index) => {
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
                className="size-(--size-sm) rounded-full p-0 hover:bg-transparent"
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
                      <Check className="size-(--icon-compact)" aria-hidden />
                    </span>
                  ) : null}
                </span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
