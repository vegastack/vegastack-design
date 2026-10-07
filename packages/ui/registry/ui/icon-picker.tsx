// @vegastack icon-picker@0.24.2 sha256-8LdtHsxUuwTVujYpYAmL+KBffBAm2UMU+Ch0yPa+dW4=

"use client";
import * as React from "react";
import { Layers } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ColorPicker, HUE_COLORS } from "@/components/ui/color-picker";
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
  /** Explicit saved hue. Undefined permits a remembered default; null is explicit Default. @default undefined */
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
/** A DS icon/emoji identity picker with a nested preset-colour palette.
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
  const [colourOpen, setColourOpen] = React.useState(false);
  const effectiveHue = hue === undefined ? preferredHue : hue;
  React.useEffect(() => {
    if (!isOpen) {
      setColourOpen(false);
      return;
    }
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
  const colour =
    mode === "icon" ? (
      <ColorPicker
        value={effectiveHue ?? undefined}
        onValueChange={(next) => chooseHue(next as AvatarHue)}
        colors={HUE_COLORS}
        columns={5}
        onClear={() => chooseHue(null)}
        clearLabel="Default"
        open={colourOpen && isOpen}
        onOpenChange={setColourOpen}
        closeOnSelect
        aria-label="Icon colour"
      />
    ) : undefined;
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
      searchPlaceholder={mode === "icon" ? "Search icons…" : "Search emoji…"}
      emptyText={mode === "icon" ? "No icons found" : "No emoji found"}
      searchAction={colour}
    />
  );
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
        className={cn(
          "max-w-[calc(100vw-var(--spacing)*8)] max-h-(--available-height) overflow-hidden gap-0 p-0",
          size === "sm" ? "w-64" : "w-80",
          className,
        )}
      >
        {enabled.length > 1 ? (
          <Tabs
            value={mode}
            onValueChange={(next) => {
              setColourOpen(false);
              setMode(next as IconPickerMode);
            }}
            className="min-h-0 gap-0"
          >
            <TabsList variant="line" className="mx-2">
              {enabled.map((item) => (
                <TabsTrigger key={item} value={item}>
                  {item === "icon" ? "Icons" : "Emoji"}
                </TabsTrigger>
              ))}
            </TabsList>
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
        {onRemove ? (
          <div
            data-slot="icon-picker-footer"
            className="shrink-0 border-t border-border p-1"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
            >
              Remove icon
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
