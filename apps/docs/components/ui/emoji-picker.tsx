// @vegastack emoji-picker@0.23.40 sha256-1+bjex4cr3VPkS52Wn2V6Zrp1mzUK/lZ1AulTB0QQeg=

"use client";

import * as React from "react";
import {
  Apple,
  Clock,
  Flag,
  Hash,
  Lightbulb,
  PawPrint,
  Plane,
  SearchX,
  Smile,
  SmilePlus,
  Trophy,
  Users,
} from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";
import type { EmojiCategory, EmojiEntry } from "@/lib/emoji-data";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useListNav } from "@/components/ui/use-list-nav";
import { PanelSearch, PanelSearchField } from "@/components/ui/panel-search";

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

const RECENTS_KEY = "vegastack:emoji-recents";
const MAX_RECENTS = 14;

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRecent(char: string) {
  try {
    const next = [char, ...readRecents().filter((c) => c !== char)].slice(
      0,
      MAX_RECENTS,
    );
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode, quota) — recents are a convenience only.
  }
}

const CATEGORY_ICONS: Record<EmojiCategory | "Recent", React.ElementType> = {
  Recent: Clock,
  Smileys: Smile,
  People: Users,
  Animals: PawPrint,
  Food: Apple,
  Activities: Trophy,
  Travel: Plane,
  Objects: Lightbulb,
  Symbols: Hash,
  Flags: Flag,
};

/** Columns in the emoji grid — matches the `grid-cols-7` class below; arrow-key math needs it. */
const GRID_COLUMNS = 7;

interface Section {
  key: EmojiCategory | "Recent";
  entries: EmojiEntry[];
}

/** Props accepted by `EmojiPicker`. */
export interface EmojiPickerProps {
  /**
   * Called with the selected emoji character when the user picks one. The popover closes after
   * selection (unless `closeOnSelect` is `false`).
   */
  onValueChange: (emoji: string) => void;
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
 */
export function EmojiPicker({
  onValueChange,
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
  const [query, setQuery] = React.useState("");
  const [recents, setRecents] = React.useState<string[]>([]);
  const gridRef = React.useRef<HTMLDivElement>(null);

  // Reopen clean, with the recents as they are now.
  React.useEffect(() => {
    if (!isOpen) setQuery("");
    else if (showRecents) setRecents(readRecents());
  }, [isOpen, showRecents]);

  const q = query.trim().toLowerCase();
  const sections = React.useMemo<Section[]>(() => {
    if (!data) return [];
    const byCategory = data.EMOJI_CATEGORIES.map((key) => ({
      key,
      entries: q
        ? data.EMOJI[key].filter((e) => data.matchesEmoji(e, q))
        : data.EMOJI[key],
    }));
    const recent: Section[] =
      showRecents && !q && recents.length > 0
        ? [
            {
              key: "Recent",
              entries: recents
                .map((c) => data.getEmoji(c))
                .filter((e): e is EmojiEntry => !!e),
            },
          ]
        : [];
    return [...recent, ...byCategory].filter((s) => s.entries.length > 0);
  }, [data, q, recents, showRecents]);

  const flatEntries = React.useMemo(
    () => sections.flatMap((s) => s.entries),
    [sections],
  );
  const resultCount = flatEntries.length;
  const statusMessage = !data
    ? ""
    : resultCount > 0
      ? `${resultCount} emoji ${resultCount === 1 ? "result" : "results"} available.`
      : "No emoji found.";

  const handleSelect = React.useCallback(
    (emoji: string) => {
      if (showRecents) writeRecent(emoji);
      onValueChange(emoji);
      if (closeOnSelect) setOpen(false);
    },
    [onValueChange, closeOnSelect, setOpen, showRecents],
  );

  const grid = useListNav({ count: flatEntries.length, columns: GRID_COLUMNS });
  const quick = useListNav({
    count: quickEmoji?.length ?? 0,
    columns: quickEmoji?.length || 1,
  });
  const categoryKeys = sections.map((s) => s.key);
  const bar = useListNav({
    count: categoryKeys.length,
    columns: categoryKeys.length || 1,
  });

  const jumpTo = (key: Section["key"]) => {
    const root = gridRef.current;
    const target = root?.querySelector<HTMLElement>(`[data-section="${key}"]`);
    // The grid is `relative`, so a section's offsetTop is measured from the grid itself.
    if (root && target) root.scrollTop = target.offsetTop;
  };

  const small = size === "sm";
  const cell = small ? "icon-sm" : "icon";

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
          "max-w-[calc(100vw-var(--spacing)*8)] gap-0 p-0",
          small ? "w-64" : "w-72",
          className,
        )}
      >
        <div className="flex flex-col">
          {quickEmoji && quickEmoji.length > 0 ? (
            <div
              role="group"
              aria-label="Quick reactions"
              data-slot="emoji-picker-quick"
              onKeyDown={quick.handleKeyDown}
              className="flex items-center justify-between gap-0.5 border-b border-border p-1.5"
            >
              {quickEmoji.map((char, index) => (
                <Button
                  key={char}
                  type="button"
                  variant="ghost"
                  size={cell}
                  aria-label={data?.getEmoji(char)?.name ?? char}
                  {...quick.getItemProps(index)}
                  onClick={() => {
                    quick.setActiveIndex(index);
                    handleSelect(char);
                  }}
                  className="text-lg leading-none"
                >
                  <span aria-hidden>{char}</span>
                </Button>
              ))}
            </div>
          ) : null}
          {/* Search — the shared in-panel recipe: leading glyph, no box of its own, hairline
              below. A bordered `Input` inside a bordered popup nests two borders (B8-04). */}
          <PanelSearch>
            <PanelSearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              data-slot="emoji-picker-search"
            />
          </PanelSearch>
          <div
            data-slot="emoji-picker-status"
            role="status"
            aria-live="polite"
            className="sr-only"
          >
            {statusMessage}
          </div>

          {data && !q && sections.length > 1 ? (
            <div
              role="toolbar"
              aria-label="Categories"
              data-slot="emoji-picker-categories"
              onKeyDown={bar.handleKeyDown}
              className="flex items-center justify-between border-b border-border px-1.5 py-1"
            >
              {categoryKeys.map((key, index) => {
                const Icon = CATEGORY_ICONS[key];
                return (
                  <Button
                    key={key}
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={key}
                    title={key}
                    {...bar.getItemProps(index)}
                    onClick={() => {
                      bar.setActiveIndex(index);
                      jumpTo(key);
                    }}
                  >
                    <Icon aria-hidden />
                  </Button>
                );
              })}
            </div>
          ) : null}

          <div
            ref={gridRef}
            data-slot="emoji-picker-grid"
            onKeyDown={grid.handleKeyDown}
            className={cn(
              "relative overflow-y-auto overscroll-contain p-2",
              small ? "max-h-52" : "max-h-64",
            )}
          >
            {!data ? (
              <div
                aria-hidden
                data-slot="emoji-picker-skeleton"
                className="grid grid-cols-7 justify-items-center gap-0.5"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <Skeleton
                    key={i}
                    className={cn("rounded-md", small ? "size-7" : "size-8")}
                  />
                ))}
              </div>
            ) : resultCount > 0 ? (
              (() => {
                // `flatIndex` runs across every section so the roving tabindex spans the grid.
                let flatIndex = -1;
                return sections.map(({ key, entries }) => (
                  <div key={key} data-section={key} className="mb-2 last:mb-0">
                    <div className="px-1 py-1 text-xs font-medium text-muted-foreground">
                      {key}
                    </div>
                    <div
                      role="group"
                      aria-label={key}
                      // Centre each fixed-size button in its (wider) track so the gutters read even.
                      className="grid grid-cols-7 justify-items-center gap-0.5"
                    >
                      {entries.map((entry) => {
                        flatIndex += 1;
                        const index = flatIndex;
                        return (
                          <Button
                            key={entry.char}
                            type="button"
                            variant="ghost"
                            size={cell}
                            data-slot="emoji-picker-item"
                            aria-label={entry.name}
                            title={entry.name}
                            {...grid.getItemProps(index)}
                            onClick={() => {
                              grid.setActiveIndex(index);
                              handleSelect(entry.char);
                            }}
                            className="text-lg leading-none"
                          >
                            <span aria-hidden>{entry.char}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()
            ) : (
              <Empty
                size="sm"
                icon={<SearchX aria-hidden />}
                data-slot="emoji-picker-empty"
                aria-hidden="true"
              >
                <EmptyHeader>
                  <EmptyDescription>No emoji found</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
