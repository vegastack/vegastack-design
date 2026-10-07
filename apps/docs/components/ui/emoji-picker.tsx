// @vegastack emoji-picker@0.24.2 sha256-sdfw/BKbH3BklhzsvOMUfFx8EJoL7yT05hspbnqkGeE=

"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import {
  PickerPanel,
  EMOJI_CATEGORY_ICONS,
} from "@/components/ui/picker-panel";
import {
  readPickerRecents,
  rememberPickerRecent,
} from "@/lib/picker-preferences";

/* ------------------------------------------------------------------------------------------------
 * EmojiPicker — a Popover-housed, searchable grid of emoji, grouped by category, that returns the
 * selected emoji character via `onValueChange`.
 *
 * The data (`@/lib/emoji-data`, a curated ~260-emoji set) is loaded with a dynamic `import()` the
 * first time the panel opens, so a page that only renders the trigger never ships the table; a
 * skeleton grid stands in for the few milliseconds it takes. Above the grid: an optional quick row
 * (`quickEmoji`), the shared panel-search row and a category bar that jumps to a section. The first
 * section is "Recent" — the viewer's last picks, kept in `localStorage`.
 *
 * Composition: our `Popover` + the shared panel-search row + icon `Button`s. Each emoji button
 * carries an `aria-label` (the emoji name). Search filters across names and keywords.
 * ----------------------------------------------------------------------------------------------*/

export type { EmojiCategory, EmojiEntry } from "@/lib/emoji-data";

type EmojiData = typeof import("@/lib/emoji-data");

let emojiData: EmojiData | undefined;
let emojiDataPromise: Promise<EmojiData> | undefined;

/** Start loading the emoji data (once per page); resolves to the `emoji-data` module. */
export function loadEmojiData(): Promise<EmojiData> {
  emojiDataPromise ??= import("@/lib/emoji-data").then((mod) => {
    emojiData = mod;
    return mod;
  });
  return emojiDataPromise;
}

/**
 * `useEmojiData` — the lazily loaded `emoji-data` module, or `undefined` until it arrives. Loading
 * starts once `enabled` is true (the picker passes its open state) and is shared page-wide.
 *
 * @example
 * const data = useEmojiData(open);
 * const name = data?.getEmoji("👍")?.name;
 */
export function useEmojiData(enabled = true): EmojiData | undefined {
  const [data, setData] = React.useState(emojiData);
  React.useEffect(() => {
    if (!enabled || data) return;
    let live = true;
    void loadEmojiData().then((mod) => {
      if (live) setData(mod);
    });
    return () => {
      live = false;
    };
  }, [enabled, data]);
  return data;
}

/** Props accepted by `EmojiPicker`. */
export interface EmojiPickerProps {
  /**
   * Called with the selected emoji character when the user picks one. The popover closes after
   * selection (unless `closeOnSelect` is `false`).
   */
  onValueChange: (emoji: string) => void;
  /** Current emoji for identity selection styling. @default undefined */
  value?: string;
  /** Account/workspace-scoped recent preference namespace. @default undefined */
  preferenceKey?: string;
  /**
   * Custom trigger element, composed via Base UI's `render` prop. Defaults to a ghost icon button
   * with a smiley-plus glyph.
   * @default undefined
   */
  trigger?: React.ReactElement;
  /**
   * Accessible label for the default trigger button.
   * @default "Pick an emoji"
   */
  triggerLabel?: string;
  /**
   * Placeholder and accessible label for the search field.
   * @default "Search emoji"
   */
  searchPlaceholder?: string;
  /**
   * A row of one-click emoji above the search — the quick reactions of a reaction bar.
   * @default undefined
   */
  quickEmoji?: string[];
  /**
   * Show the "Recent" section: the viewer's last picks, kept in `localStorage`.
   * @default true
   */
  showRecents?: boolean;
  /**
   * `sm` is the compact panel (narrower, 28px cells) for tight spots such as a comment's actions.
   * @default "default"
   */
  size?: "default" | "sm";
  /**
   * Controlled open state of the popover. Omit for uncontrolled usage.
   * @default undefined
   */
  open?: boolean;
  /**
   * Called when the popover's open state changes (controlled or uncontrolled).
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Close the popover automatically after an emoji is selected.
   * @default true
   */
  closeOnSelect?: boolean;
  /**
   * Which side of the trigger to place the panel on.
   * @default "bottom"
   */
  side?: React.ComponentProps<typeof PopoverContent>["side"];
  /**
   * Alignment of the panel relative to the trigger.
   * @default "start"
   */
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  /**
   * A row at the bottom of the panel, under a divider — "Remove icon", say. Its controls are
   * the host's; close the picker from them with `open` / `onOpenChange` when they act.
   * @default undefined
   */
  footer?: React.ReactNode;
  /** Extra classes for the popover panel.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the trigger button — the component's focusable root (the popover panel is
   * portaled, so the trigger is the stable host element to focus/measure).
   * @default undefined
   */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * `EmojiPicker` — a popover with an optional quick row, search, a category bar, a "Recent" section
 * and a category-grouped grid of emoji; returns the picked character via `onValueChange`. The data
 * loads lazily on first open behind a skeleton; a search with no match shows an empty state.
 *
 * **Keyboard:** the grid is one roving-tabindex tab stop spanning every visible emoji across every
 * section. `ArrowLeft`/`ArrowRight` move one emoji; `ArrowUp`/`ArrowDown` move a row (7);
 * `Home`/`End` jump to the first/last emoji. The quick row and the category bar are each one tab
 * stop moved with the arrow keys.
 *
 * @example
 * <EmojiPicker onValueChange={(emoji) => insert(emoji)} />
 * <EmojiPicker onValueChange={setIcon} footer={<Button variant="ghost" size="sm" onClick={clear}>Remove icon</Button>} />
 */
export function EmojiPicker({
  onValueChange,
  value,
  preferenceKey,
  trigger,
  triggerLabel = "Pick an emoji",
  searchPlaceholder = "Search emoji",
  quickEmoji,
  showRecents = true,
  size = "default",
  open,
  onOpenChange,
  closeOnSelect = true,
  side = "bottom",
  align = "start",
  footer,
  className,
  ref,
}: EmojiPickerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const data = useEmojiData(isOpen);
  const [recents, setRecents] = React.useState<string[]>([]);
  const recentKey = preferenceKey
    ? `${preferenceKey}:emoji-recents`
    : "vegastack:emoji-recents";
  React.useEffect(() => {
    if (isOpen && showRecents) setRecents(readPickerRecents(recentKey));
  }, [isOpen, showRecents, recentKey]);
  const handleSelect = (emoji: string) => {
    if (showRecents) setRecents(rememberPickerRecent(recentKey, emoji));
    onValueChange(emoji);
    if (closeOnSelect) setOpen(false);
  };
  const entries = React.useMemo(
    () =>
      data?.EMOJI_CATEGORIES.flatMap((category) =>
        data.EMOJI[category].map((entry) => ({
          key: entry.char,
          label: entry.name,
          category,
          keywords: entry.keywords,
          glyph: <span aria-hidden>{entry.char}</span>,
        })),
      ),
    [data],
  );
  const small = size === "sm";
  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        render={
          trigger ?? (
            <Button variant="ghost" size="icon-sm" aria-label={triggerLabel}>
              <SmilePlus />
            </Button>
          )
        }
      />
      <PopoverContent
        data-slot="emoji-picker"
        data-size={size}
        side={side}
        align={align}
        sideOffset={FLOATING.sideOffsetAttached}
        className={cn(
          "max-w-[calc(100vw-var(--spacing)*8)] max-h-(--available-height) overflow-hidden gap-0 p-0",
          small ? "w-64" : "w-80",
          className,
        )}
      >
        <div className="flex min-h-0 flex-col">
          <PickerPanel
            key={String(isOpen)}
            entries={entries}
            value={value}
            onSelect={handleSelect}
            recents={showRecents ? recents : []}
            quick={quickEmoji}
            size={size}
            searchPlaceholder={searchPlaceholder}
            emptyText="No emoji found"
            resultLabel="emoji"
            categoryIcons={Object.fromEntries(
              Object.entries(EMOJI_CATEGORY_ICONS).map(([key, Glyph]) => [
                key,
                <Glyph key={key} aria-hidden />,
              ]),
            )}
          />
          {footer != null ? (
            <div
              data-slot="emoji-picker-footer"
              className="flex items-center gap-2 border-t border-border p-1"
            >
              {footer}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
