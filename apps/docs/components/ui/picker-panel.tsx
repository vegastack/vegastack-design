// @vegastack picker-panel@0.24.5 sha256-NN7fbakaVeDsrmY3OWfiwutFLDTdvr81E+KEFucCGkQ=

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
  Smile,
  Trophy,
  UsersRound,
  SearchX,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { filterPickerEntries } from "@/lib/picker-search";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PanelSearch, PanelSearchField } from "@/components/ui/panel-search";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { useListNav } from "@/components/ui/use-list-nav";
import { useAnnouncer } from "@/components/ui/use-announcer";

/** Shared category glyphs for standalone and combined emoji panels. */
export const EMOJI_CATEGORY_ICONS: Record<string, React.ElementType> = {
  Recent: Clock,
  Smileys: Smile,
  People: UsersRound,
  Animals: PawPrint,
  Food: Apple,
  Activities: Trophy,
  Travel: Plane,
  Objects: Lightbulb,
  Symbols: Hash,
  Flags: Flag,
};

/** Columns in the emoji grid — matches the `grid-cols-7` class below; arrow-key math needs it. */
/** A searchable, selectable item in an internal picker panel. */
export interface PickerPanelEntry {
  /** Stable value. */
  key: string;
  /** Accessible human-readable name. */
  label: string;
  /** Browsing section. */
  category: string;
  /** Search synonyms. */
  keywords?: readonly string[];
  /** Glyph rendered inside the shared cell. */
  glyph: React.ReactNode;
}
/** Shared internal panel content; popup ownership stays with its public picker. */
export interface PickerPanelProps {
  /** Catalogue entries; undefined while loading. @default undefined */
  entries?: readonly PickerPanelEntry[];
  /** Value selected by an identity editor. @default undefined */
  value?: string;
  /** Commit one selection. */
  onSelect: (key: string) => void;
  /** Ordered recent keys. @default undefined */
  recents?: readonly string[];
  /** Quick insertion keys above search. @default undefined */
  quick?: readonly string[];
  /** Categories left out of browsing (the sections and the category bar) but still matched by search. @default undefined */
  searchOnly?: readonly string[];
  /** Optional category glyphs. @default undefined */
  categoryIcons?: Readonly<Record<string, React.ReactNode>>;
  /** Compact or standard grid. @default "default" */
  size?: "default" | "sm";
  /** Search field label. */
  searchPlaceholder: string;
  /** Empty-result label. */
  emptyText: string;
  /** Singular accessible result noun. @default "item" */
  resultLabel?: string;
  /** Search-row trailing action. @default undefined
   * @deprecated The identity picker moved colour into its footer; kept for compatibility. */
  searchAction?: React.ReactNode;
}
/** Search, recents, category navigation and shared cells.
 * @example <PickerPanel entries={entries} onSelect={select} searchPlaceholder="Search icons" emptyText="No icons found" />
 */
export function PickerPanel({
  entries,
  value,
  onSelect,
  recents = [],
  quick = [],
  categoryIcons,
  searchOnly,
  size = "default",
  searchPlaceholder,
  emptyText,
  searchAction,
  resultLabel = "item",
}: PickerPanelProps) {
  const [query, setQuery] = React.useState("");
  const root = React.useRef<HTMLDivElement>(null);
  const columns = size === "sm" ? 7 : 8;
  const byKey = React.useMemo(
    () => new Map(entries?.map((entry) => [entry.key, entry])),
    [entries],
  );
  const sections = React.useMemo(() => {
    if (!entries) return [];
    if (query.trim())
      return [
        { name: "Results", entries: filterPickerEntries(entries, query) },
      ];
    const groups = new Map<string, PickerPanelEntry[]>();
    const recent = recents
      .slice(0, columns * 2)
      .flatMap((key) => (byKey.has(key) ? [byKey.get(key)!] : []));
    if (recent.length) groups.set("Recent", recent);
    for (const entry of entries) {
      if (searchOnly?.includes(entry.category)) continue;
      const group = groups.get(entry.category) ?? [];
      group.push(entry);
      groups.set(entry.category, group);
    }
    return [...groups].map(([name, items]) => ({ name, entries: items }));
  }, [entries, query, recents, columns, byKey, searchOnly]);
  const flat = sections.flatMap((section) => section.entries);
  const rowLengths = sections.flatMap((section) =>
    Array.from(
      { length: Math.ceil(section.entries.length / columns) },
      (_, row) => Math.min(columns, section.entries.length - row * columns),
    ),
  );
  const nav = useListNav({ count: flat.length, columns, rowLengths });
  const quickNav = useListNav({
    count: quick.length,
    columns: quick.length || 1,
  });
  const categories = sections.filter((section) => section.name !== "Recent");
  const categoryNav = useListNav({
    count: categories.length,
    columns: categories.length || 1,
  });
  const { announce, Announcer } = useAnnouncer();
  React.useEffect(() => {
    if (entries)
      announce(
        query.trim()
          ? flat.length
            ? `${flat.length} ${resultLabel} ${flat.length === 1 ? "result" : "results"} available.`
            : `${emptyText}.`
          : "",
      );
  }, [query, entries, flat.length, announce, emptyText, resultLabel]);
  let flatIndex = -1;
  const cell = size === "sm" ? "icon-sm" : "icon";
  const gridClass = size === "sm" ? "grid-cols-7" : "grid-cols-8";
  return (
    <div
      data-slot="picker-panel"
      data-size={size}
      className="flex min-h-0 flex-col"
    >
      {quick.length ? (
        <div
          data-slot="picker-panel-quick"
          role="group"
          aria-label="Quick reactions"
          onKeyDown={quickNav.handleKeyDown}
          className="flex items-center gap-0.5 overflow-x-auto border-b border-border p-1.5"
        >
          {quick.map((key, index) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size={cell}
              aria-label={byKey.get(key)?.label ?? key}
              {...quickNav.getItemProps(index)}
              onClick={() => onSelect(key)}
              className="text-lg leading-none"
            >
              {byKey.get(key)?.glyph ?? key}
            </Button>
          ))}
        </div>
      ) : null}
      <Field>
        <PanelSearch>
          <PanelSearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          {searchAction}
        </PanelSearch>
      </Field>
      {!query.trim() && categories.length > 1 ? (
        <div
          data-slot="picker-panel-categories"
          role="toolbar"
          aria-label="Categories"
          onKeyDown={categoryNav.handleKeyDown}
          className="flex shrink-0 items-center justify-between gap-0.5 overflow-x-auto border-b border-border px-1.5 py-1"
        >
          {categories.map((section, index) => (
            <Button
              key={section.name}
              type="button"
              variant="ghost"
              size={categoryIcons ? "icon-xs" : "xs"}
              aria-label={section.name}
              title={section.name}
              {...categoryNav.getItemProps(index)}
              onClick={() => {
                const element = root.current?.querySelector<HTMLElement>(
                  `[data-section="${section.name}"]`,
                );
                if (element && root.current)
                  root.current.scrollTop = element.offsetTop;
              }}
            >
              {categoryIcons?.[section.name] ?? section.name}
            </Button>
          ))}
        </div>
      ) : null}
      <div
        ref={root}
        data-slot="picker-panel-grid"
        onKeyDown={nav.handleKeyDown}
        className={cn(
          "relative min-h-0 overflow-y-auto overscroll-contain p-2",
          size === "sm" ? "max-h-52" : "max-h-64",
        )}
      >
        {!entries ? (
          <div
            aria-hidden
            className={cn("grid justify-items-center gap-1.5", gridClass)}
          >
            {Array.from({ length: columns * 4 }, (_, index) => (
              <Skeleton
                key={index}
                className={cn(
                  "rounded-md",
                  size === "sm" ? "size-7" : "size-8",
                )}
              />
            ))}
          </div>
        ) : flat.length ? (
          sections.map((section) => (
            <div
              key={section.name}
              data-section={section.name}
              className="mb-2 last:mb-0"
            >
              <div
                data-slot="picker-panel-section-header"
                className="sticky top-0 z-10 bg-popover px-1 py-1 text-xs font-medium text-muted-foreground"
              >
                {section.name}
              </div>
              <div
                role="group"
                aria-label={section.name}
                className={cn("grid justify-items-center gap-1.5", gridClass)}
              >
                {section.entries.map((entry) => {
                  const index = ++flatIndex;
                  return (
                    <Button
                      key={entry.key}
                      type="button"
                      variant="ghost"
                      size={cell}
                      data-slot="picker-panel-item"
                      aria-label={entry.label}
                      title={entry.label}
                      aria-pressed={
                        value === undefined ? undefined : value === entry.key
                      }
                      {...nav.getItemProps(index)}
                      onClick={() => {
                        nav.setActiveIndex(index);
                        onSelect(entry.key);
                      }}
                      className={cn(
                        "text-lg leading-none",
                        value === entry.key && "border-primary bg-muted",
                      )}
                    >
                      {entry.glyph}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <Empty size="sm" icon={<SearchX aria-hidden />}>
            <EmptyHeader>
              <EmptyDescription>{emptyText}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      <Announcer />
    </div>
  );
}
