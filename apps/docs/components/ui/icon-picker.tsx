// @vegastack icon-picker@0.25.2 sha256-mOPsdU3zYqwtfC0i9uD5gNppo1kH6//NJyXP9gOow9Q=

"use client";
import * as React from "react";
import { Ban, Layers, Trash2 } from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";
import type { IconValue } from "@/lib/icon-data";
import {
  readPickerPreference,
  readPickerRecents,
  rememberPickerRecent,
  writePickerPreference,
} from "@/lib/picker-preferences";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HUE_COLORS } from "@/components/ui/color-picker";
import type { AvatarHue } from "@/components/ui/avatar";
import { IconGlyph } from "@/components/ui/icon-glyph";
import {
  PickerPanel,
  EMOJI_CATEGORY_ICONS,
} from "@/components/ui/picker-panel";
import { useEmojiData } from "@/components/ui/emoji-picker";

/** Modes offered by the generic identity picker. */
export type IconPickerMode = "icon" | "emoji";
/** Public identity picker controls. */
export interface IconPickerProps {
  /** Chosen icon or emoji. @default null */
  value?: IconValue | null;
  /** Called after choosing a glyph. */
  onValueChange: (value: IconValue) => void;
  /** Explicit saved hue. Undefined permits a remembered default; null is explicit No colour. @default undefined */
  hue?: AvatarHue | null;
  /** Called on explicit hue selection or committing a remembered hue with a new icon. @default undefined */
  onHueChange?: (hue: AvatarHue | null) => void;
  /** Enabled modes; one mode omits tabs. @default ["icon", "emoji"] */
  modes?: readonly IconPickerMode[];
  /** Namespace for account/workspace-scoped convenience preferences. @default undefined */
  preferenceKey?: string;
  /** Display recent choices. @default true */
  showRecents?: boolean;
  /** Close after choosing a glyph. @default true */
  closeOnSelect?: boolean;
  /** Optional Remove action. @default undefined */
  onRemove?: () => void;
  /** Custom trigger composed through Base UI. @default undefined */
  trigger?: React.ReactElement;
  /** Accessible trigger name. @default "Choose an icon" */
  triggerLabel?: string;
  /** Controlled popup state. @default undefined */
  open?: boolean;
  /** Popup state callback. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** Grid density. @default "default" */
  size?: "default" | "sm";
  /** Disable the trigger. @default false */
  disabled?: boolean;
  /** Additional panel classes. @default undefined */
  className?: string;
  /** Ref to the trigger. @default undefined */
  ref?: React.Ref<HTMLButtonElement>;
}
/** Emoji categories reachable only through search, so both tabs browse eight categories. */
const SEARCH_ONLY_EMOJI = ["Flags"] as const;

/** A DS icon/emoji identity picker with an inline preset-colour footer.
 * @example <IconPicker value={value} onValueChange={setValue} />
 */
export function IconPicker({
  value,
  onValueChange,
  hue,
  onHueChange,
  modes = ["icon", "emoji"],
  preferenceKey,
  showRecents = true,
  closeOnSelect = true,
  onRemove,
  trigger,
  triggerLabel = "Choose an icon",
  open,
  onOpenChange,
  size = "default",
  disabled,
  className,
  ref,
}: IconPickerProps) {
  const enabled = [...new Set(modes.length ? modes : ["icon" as const])];
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const initialMode: IconPickerMode =
    value && enabled.includes(value.kind)
      ? value.kind
      : enabled.includes("icon")
        ? "icon"
        : "emoji";
  const [mode, setMode] = React.useState<IconPickerMode>(initialMode);
  const [catalogue, setCatalogue] =
    React.useState<typeof import("@/lib/icon-data")>();
  const emoji = useEmojiData(isOpen && mode === "emoji");
  const namespace = preferenceKey ?? "vegastack:icon-picker";
  const [recents, setRecents] = React.useState<string[]>([]);
  const [preferredHue, setPreferredHue] = React.useState<AvatarHue | null>(
    null,
  );
  const effectiveHue = hue === undefined ? preferredHue : hue;
  React.useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    const stored = readPickerPreference(`${namespace}:hue`);
    setPreferredHue(
      typeof stored === "string" &&
        HUE_COLORS.some((colour) => colour.name === stored)
        ? (stored as AvatarHue)
        : null,
    );
  }, [isOpen, namespace, initialMode]);
  React.useEffect(() => {
    if (!isOpen) return;
    if (mode === "icon" && !catalogue) {
      let live = true;
      void import("@/lib/icon-data").then((data) => {
        if (live) setCatalogue(data);
      });
      return () => {
        live = false;
      };
    }
  }, [isOpen, mode, catalogue]);
  React.useEffect(() => {
    if (isOpen && showRecents)
      setRecents(readPickerRecents(`${namespace}:${mode}-recents`));
  }, [isOpen, showRecents, namespace, mode]);
  const entries = React.useMemo(
    () =>
      mode === "icon"
        ? catalogue?.ICON_CATALOGUE.map((entry) => ({
            key: entry.name,
            label: entry.label,
            category: entry.category,
            keywords: [entry.name, ...entry.tags, ...entry.aliases],
            glyph: (
              <IconGlyph
                value={{ kind: "icon", name: entry.name }}
                hue={effectiveHue}
              />
            ),
          }))
        : emoji?.EMOJI_CATEGORIES.flatMap((category) =>
            emoji.EMOJI[category].map((entry) => ({
              key: entry.char,
              label: entry.name,
              category,
              keywords: entry.keywords,
              glyph: (
                <IconGlyph
                  value={{ kind: "emoji", char: entry.char }}
                  size="default"
                />
              ),
            })),
          ),
    [mode, catalogue, emoji, effectiveHue],
  );
  const select = (key: string) => {
    if (mode === "icon") {
      if (!catalogue?.isIconName(key)) return;
      if (hue === undefined) onHueChange?.(effectiveHue);
      onValueChange({ kind: "icon", name: key });
    } else onValueChange({ kind: "emoji", char: key });
    if (showRecents)
      setRecents(rememberPickerRecent(`${namespace}:${mode}-recents`, key));
    if (closeOnSelect) setOpen(false);
  };
  const chooseHue = (next: AvatarHue | null) => {
    setPreferredHue(next);
    writePickerPreference(`${namespace}:hue`, next);
    onHueChange?.(next);
  };
  const hueOptions: readonly { name: AvatarHue | null; label: string }[] = [
    { name: null, label: "No colour" },
    ...HUE_COLORS.map((colour) => ({
      name: colour.name as AvatarHue,
      label: colour.label,
    })),
  ];
  const checkedHueIndex = Math.max(
    0,
    hueOptions.findIndex((option) => option.name === (effectiveHue ?? null)),
  );
  const swatchRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  // APG radio group: the checked swatch is the one tab stop, and arrows move AND select, wrapping.
  const onSwatchKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const step =
      event.key === "ArrowDown" ||
      event.key === (rtl ? "ArrowLeft" : "ArrowRight")
        ? 1
        : event.key === "ArrowUp" ||
            event.key === (rtl ? "ArrowRight" : "ArrowLeft")
          ? -1
          : 0;
    const count = hueOptions.length;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? count - 1
          : step
            ? (checkedHueIndex + step + count) % count
            : -1;
    if (next < 0) return;
    event.preventDefault();
    chooseHue(hueOptions[next]!.name);
    swatchRefs.current[next]?.focus();
  };
  const swatches =
    mode === "icon" ? (
      <div
        role="radiogroup"
        aria-label="Icon colour"
        data-slot="icon-picker-colours"
        onKeyDown={onSwatchKeyDown}
        // One row, always: at the default width every swatch fits; the compact size scrolls.
        className="flex min-w-0 flex-nowrap items-center overflow-x-auto"
      >
        {hueOptions.map((option, index) => {
          const checked = option.name === (effectiveHue ?? null);
          const swatch = HUE_COLORS.find(
            (colour) => colour.name === option.name,
          );
          return (
            <Button
              key={option.name ?? "default"}
              type="button"
              variant="ghost"
              size="icon-xs"
              role="radio"
              aria-checked={checked}
              aria-label={option.label}
              title={option.label}
              tabIndex={index === checkedHueIndex ? 0 : -1}
              // The selected picker cell's own cue — the button's 1px border in `primary` — not a ring.
              className="shrink-0 rounded-full aria-checked:border-primary"
              ref={(node) => {
                swatchRefs.current[index] = node;
              }}
              onClick={() => chooseHue(option.name)}
            >
              {swatch ? (
                <span
                  data-slot="icon-picker-swatch"
                  data-checked={checked || undefined}
                  className="size-3.5 rounded-full border border-border bg-clip-padding"
                  // Preset token colour — the colour picker's sanctioned inline-style exception.
                  style={{ backgroundColor: swatch.color }}
                />
              ) : (
                <Ban
                  aria-hidden
                  data-checked={checked || undefined}
                  className="size-3.5 rounded-full text-muted-foreground data-checked:text-foreground"
                />
              )}
            </Button>
          );
        })}
      </div>
    ) : null;
  const categoryIcons = React.useMemo(
    () =>
      mode === "icon" && catalogue
        ? Object.fromEntries(
            catalogue.ICON_CATEGORIES.map((category) => {
              const entry = catalogue.ICON_CATALOGUE.find(
                (item) => item.category === category,
              )!;
              return [
                category,
                <IconGlyph
                  key={category}
                  className="text-muted-foreground"
                  value={{ kind: "icon", name: entry.name }}
                />,
              ];
            }),
          )
        : mode === "emoji"
          ? Object.fromEntries(
              Object.entries(EMOJI_CATEGORY_ICONS).map(([key, Glyph]) => [
                key,
                <Glyph key={key} aria-hidden />,
              ]),
            )
          : undefined,
    [mode, catalogue],
  );
  const content = (
    <PickerPanel
      key={`${mode}:${isOpen}`}
      entries={entries}
      categoryIcons={categoryIcons}
      value={
        value?.kind === mode
          ? value.kind === "icon"
            ? value.name
            : value.char
          : undefined
      }
      onSelect={select}
      recents={showRecents ? recents : []}
      size={size}
      searchOnly={mode === "emoji" ? SEARCH_ONLY_EMOJI : undefined}
      searchPlaceholder={mode === "icon" ? "Search icons…" : "Search emoji…"}
      emptyText={mode === "icon" ? "No icons found" : "No emoji found"}
    />
  );
  const popupRef = React.useRef<HTMLDivElement>(null);
  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        disabled={disabled}
        render={
          trigger ?? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={triggerLabel}
            >
              <IconGlyph
                value={value}
                hue={hue}
                fallback={<Layers aria-hidden />}
              />
            </Button>
          )
        }
      />
      <PopoverContent
        data-slot="icon-picker"
        data-size={size}
        sideOffset={FLOATING.sideOffsetAttached}
        ref={popupRef}
        // Search first, so typing filters at once. Touch focuses the popup itself (`true` would pick
        // the first tabbable — the search in a single-mode picker — and summon the keyboard).
        initialFocus={(type) =>
          type === "touch"
            ? popupRef.current
            : (popupRef.current?.querySelector<HTMLElement>(
                '[data-slot="picker-panel"] input[type="search"]',
              ) ?? true)
        }
        // A portal still bubbles React events to the trigger's ancestors: an `InputGroupAddon`
        // around the trigger would take this click and focus its input. Clicks stay in the popup.
        onClick={(event) => event.stopPropagation()}
        className={cn(
          // One width for both tabs, sized to the grid: 8 × 32px cells + 7 × 6px gaps + 16px padding
          // + the 2px frame (compact: 7 × 28px + 6 × 6px + 18px). The footer's swatch row fits inside.
          "max-w-[calc(100vw-var(--spacing)*8)] max-h-(--available-height) overflow-hidden gap-0 p-0",
          size === "sm" ? "w-62.5" : "w-79",
          className,
        )}
      >
        {enabled.length > 1 ? (
          <Tabs
            value={mode}
            onValueChange={(next) => setMode(next as IconPickerMode)}
            className="min-h-0 gap-0"
          >
            <div
              data-slot="icon-picker-tabs"
              className="shrink-0 border-b border-border px-0.5"
            >
              <TabsList variant="line">
                {enabled.map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {item === "icon" ? "Icons" : "Emoji"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {enabled.map((item) => (
              <TabsContent
                key={item}
                value={item}
                className="flex min-h-0 flex-col"
              >
                {mode === item ? content : null}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          content
        )}
        {swatches || onRemove ? (
          <div
            data-slot="icon-picker-footer"
            className="flex shrink-0 flex-nowrap items-center gap-1 border-t border-border bg-popover p-1.5"
          >
            {swatches}
            {onRemove ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove icon"
                      className="ms-auto shrink-0"
                      onClick={() => {
                        onRemove();
                        setOpen(false);
                      }}
                    />
                  }
                >
                  <Trash2 aria-hidden />
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
