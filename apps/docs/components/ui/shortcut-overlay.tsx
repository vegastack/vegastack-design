// @vegastack shortcut-overlay@0.25.100 sha256-BrtHSxIszB1gA5tOICAuNnTVpbK/sVqD6kL9F0wNPds=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { PanelSearch, PanelSearchField } from "@/components/ui/panel-search";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  formatShortcutKey,
  isEditableTarget,
  usePlatform,
} from "@/components/ui/use-platform";

/* ---
`ShortcutOverlay`'s value is the REGISTRY model, not the dialog. A hand-listed shortcuts
dialog goes stale the day someone adds a binding; declaring each shortcut once — keys,
label, category, an optional `when` — and rendering the overlay FROM that data is what
keeps the surface maintainable. The same declarations can feed tooltip hints and
Command rows; this component just owns the `?` surface.

This is also the one surface that should use the real `Kbd`: `CommandShortcut` is
deliberately plain text and a tooltip's shortcut hint is a `Kbd` chip, but a dialog whose
entire content is keys wants the real component — including its `os` modifier
rewriting, driven here by `use-platform` so ⌘ never ships to a Windows user.

Deliberately NOT done here:
- No key-event dispatching. The overlay documents bindings; executing them is the
  app's key handler (or its command layer). One source of truth for *what exists*,
  not a second event system.
- No persistence or customisation UI. Rebindable shortcuts are app policy.
- No auto-registration context. Declarations arrive as a plain array prop —
  cross-part state via props, not a context the host must wire.
--- */

/** One declared shortcut — declare once, render everywhere. */
export interface ShortcutDefinition {
  /**
   * Keys as rendered, mac-first (`["⌘", "K"]`). `Kbd`'s `os="other"` rewriting
   * translates the modifier glyphs for non-mac platforms automatically.
   */
  keys: readonly string[];
  /** What the shortcut does — verb + noun ("Open command menu"). */
  label: string;
  /** Section the shortcut is grouped under ("Navigation", "Editing"). */
  category: string;
  /**
   * Exclude this shortcut when `false` — for bindings gated by permission or
   * context. Omitted (`undefined`) includes it.

   * @default undefined
   */
  when?: boolean;
}

/** One shortcut inside a `ShortcutGroup` — the group supplies its section. */
export interface ShortcutGroupItem {
  /** Keys as rendered, mac-first (`["⌘", "K"]`), as on `ShortcutDefinition`. */
  keys: readonly string[];
  /** What the shortcut does — verb + noun ("Delegate task"). */
  label: string;
  /**
   * Exclude this shortcut when `false`. Omitted includes it.
   * @default undefined
   */
  when?: boolean;
}

/**
 * A titled section of shortcuts and where it applies. `active` is three-way, so one list can
 * describe every page:
 * - `true` — this page's own keys ("Task page"): listed first;
 * - omitted — keys that work everywhere ("General", "Go to"): listed after the page's;
 * - `false` — another page's keys: hidden until the reader turns on "All shortcuts".
 */
export interface ShortcutGroup {
  /** Stable id (React key). */
  id: string;
  /** The section heading ("This page", "General", "Go to"). */
  label: string;
  /**
   * Where the group applies — `true` this page (first), omitted everywhere, `false` elsewhere
   * (shown only with "All shortcuts").
   * @default undefined
   */
  active?: boolean;
  /** The group's shortcuts, in display order. */
  items: readonly ShortcutGroupItem[];
}

/** Props accepted by `ShortcutOverlay`. */
export interface ShortcutOverlayProps {
  /**
   * The declared shortcuts, sectioned by `category` in first-appearance order. Pass this or
   * `groups`; with `groups` it is ignored.
   * @default []
   */
  shortcuts?: readonly ShortcutDefinition[];
  /**
   * Page-scoped sections: the active page's groups first, then the groups that apply everywhere,
   * and the other pages' groups (`active: false`) behind an "All shortcuts" switch, which resets
   * each time the overlay opens. A filter query searches every group, shown or not.
   * @default undefined
   */
  groups?: readonly ShortcutGroup[];
  /**
   * The switch that reveals the other pages' groups.
   * @default "All shortcuts"
   */
  allShortcutsLabel?: string;
  /**
   * The line under the title.
   * @default "Shortcuts available on this page." ("All keyboard shortcuts." while "All shortcuts" is on)
   */
  description?: React.ReactNode;
  /**
   * Controlled open state. Pair with `onOpenChange`; omit to let the built-in
   * <kbd>?</kbd> binding manage it.

   * @default undefined
   */
  open?: boolean;
  /**
   * Fired when the overlay wants to open or close.

   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Bind the global open key. `false` disables the built-in binding (the host
   * opens the overlay itself). The binding never fires while focus is in a
   * text field or another editable surface.
   * @default "?"
   */
  triggerKey?: string | false;
  /**
   * Predicate consulted before the trigger key opens the overlay — return
   * `false` while another overlay owns the keyboard (the same suppression rule
   * `useListNav` uses).

   * @default undefined
   */
  shouldHandle?: () => boolean;
  /**
   * Dialog title.
   * @default "Keyboard shortcuts"
   */
  title?: string;
  /**
   * Show the filter input. On by default for more than ten shortcuts.

   * @default undefined
   */
  searchable?: boolean;
  /**
   * Content rendered below the shortcut list, outside the scroll area — a
   * hint or a link to the full shortcuts guide.

   * @default undefined
   */
  footer?: React.ReactNode;
}

/** One rendered section: a category or a group. */
interface Section {
  key: string;
  name: string;
  /** Another page's group, shown only with "All shortcuts". */
  elsewhere: boolean;
  entries: readonly { keys: readonly string[]; label: string }[];
}

/** Section flat declarations by category, in first-appearance order. */
function sectionsByCategory(
  shortcuts: readonly ShortcutDefinition[],
): Section[] {
  const sections: (Section & { entries: ShortcutDefinition[] })[] = [];
  for (const shortcut of shortcuts) {
    const existing = sections.find((c) => c.name === shortcut.category);
    if (existing) existing.entries.push(shortcut);
    else
      sections.push({
        key: shortcut.category,
        name: shortcut.category,
        elsewhere: false,
        entries: [shortcut],
      });
  }
  return sections;
}

/**
 * `ShortcutOverlay` — the <kbd>?</kbd>-triggered dialog listing keyboard
 * shortcuts, rendered from a declaration registry rather than hand-listed
 * markup. Shortcuts are grouped by category, rendered as a description list
 * (label/keys announced as pairs) with real `Kbd` keys whose modifier glyphs
 * follow the user's platform via `use-platform`.
 *
 * @example
 * const SHORTCUTS: ShortcutDefinition[] = [
 *   { keys: ["⌘", "K"], label: "Open command menu", category: "Navigation" },
 *   { keys: ["G", "D"], label: "Go to deals", category: "Navigation" },
 *   { keys: ["E"], label: "Edit selected record", category: "Editing" },
 * ];
 * <ShortcutOverlay shortcuts={SHORTCUTS} />
 * <ShortcutOverlay shortcuts={SHORTCUTS} footer={<a href="/help/shortcuts">All shortcuts</a>} />
 *
 * // Page-scoped: this page first, then everywhere-keys; other pages behind "All shortcuts".
 * <ShortcutOverlay
 *   groups={[
 *     { id: "task", label: "Task page", active: true, items: [{ keys: ["D"], label: "Delegate" }] },
 *     { id: "general", label: "General", items: [{ keys: ["⌘", "K"], label: "Open search" }] },
 *     { id: "meeting", label: "Meeting recording", active: false, items: [{ keys: ["Space"], label: "Play or pause" }] },
 *   ]}
 * />
 */
export function ShortcutOverlay({
  shortcuts = [],
  groups,
  allShortcutsLabel = "All shortcuts",
  description,
  open,
  onOpenChange,
  triggerKey = "?",
  shouldHandle,
  title = "Keyboard shortcuts",
  searchable,
  footer,
}: ShortcutOverlayProps) {
  // Open state — controlled when `open` is provided, else internal.
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

  const [query, setQuery] = React.useState("");
  const { os } = usePlatform();

  // The global `?` binding. Never fires from a text field or other editable
  // surface, and defers to `shouldHandle` while another overlay owns the keys.
  const shouldHandleRef = React.useRef(shouldHandle);
  const setOpenRef = React.useRef(setOpen);
  React.useEffect(() => {
    shouldHandleRef.current = shouldHandle;
    setOpenRef.current = setOpen;
  });
  React.useEffect(() => {
    if (triggerKey === false) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== triggerKey) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event)) return;
      if (shouldHandleRef.current && !shouldHandleRef.current()) return;
      event.preventDefault();
      setOpenRef.current(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [triggerKey]);

  // "All shortcuts" starts off at every opening: the page's own keys are the answer most of the time.
  const [showAll, setShowAll] = React.useState(false);
  const switchId = React.useId();
  const [openedAt, setOpenedAt] = React.useState(isOpen);
  if (openedAt !== isOpen) {
    setOpenedAt(isOpen);
    if (isOpen) setShowAll(false);
  }

  // Both inputs reduce to sections. `shortcuts` sections by category in first-appearance order —
  // the declaration order is the information architecture; `groups` arrive sectioned, the page's
  // own (`active: true`) first, then the everywhere groups, then the other pages' (`active: false`).
  const sections: Section[] = groups
    ? [
        ...groups.filter((g) => g.active === true),
        ...groups.filter((g) => g.active === undefined),
        ...groups.filter((g) => g.active === false),
      ].map((g) => ({
        key: g.id,
        name: g.label,
        elsewhere: g.active === false,
        entries: g.items.filter((item) => item.when !== false),
      }))
    : sectionsByCategory(shortcuts.filter((s) => s.when !== false));
  const hasElsewhere = sections.some((section) => section.elsewhere);
  const total = sections.reduce((n, section) => n + section.entries.length, 0);
  const showSearch = searchable ?? total > 10;
  const trimmed = query.trim().toLowerCase();
  // A query searches every section, shown or not, so no binding is unfindable.
  const categories = sections
    .filter((section) => trimmed || showAll || !section.elsewhere)
    .map((section) => ({
      ...section,
      entries: trimmed
        ? section.entries.filter(
            (s) =>
              s.label.toLowerCase().includes(trimmed) ||
              section.name.toLowerCase().includes(trimmed) ||
              s.keys.join(" ").toLowerCase().includes(trimmed),
          )
        : section.entries,
    }))
    .filter((section) => section.entries.length > 0);
  const line =
    description ??
    (showAll ? "All keyboard shortcuts." : "Shortcuts available on this page.");

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {/* `p-0` + per-region padding: the filter row is the shared full-bleed panel-search recipe
          (B9-11), which needs the dialog's own edges to run its hairline across. */}
      <DialogContent
        data-slot="shortcut-overlay"
        className="gap-0 p-0 sm:max-w-2xl"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{line}</DialogDescription>
        </DialogHeader>
        {hasElsewhere ? (
          <div
            data-slot="shortcut-overlay-scope"
            className="flex items-center gap-2 px-6 pb-3"
          >
            <Switch
              id={switchId}
              size="sm"
              checked={showAll}
              onCheckedChange={(checked) => setShowAll(checked)}
            />
            <Label htmlFor={switchId} className="font-normal">
              {allShortcutsLabel}
            </Label>
          </div>
        ) : null}
        {showSearch ? (
          <PanelSearch className="border-t">
            <PanelSearchField
              aria-label="Filter shortcuts"
              placeholder="Filter shortcuts…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </PanelSearch>
        ) : null}
        <ScrollArea className="max-h-[calc(100dvh-16rem)]">
          <div className="flex flex-col gap-4 p-6 pt-4 pe-3">
            {categories.length === 0 ? (
              <p
                data-slot="shortcut-overlay-empty"
                className="py-4 text-center text-xs text-muted-foreground"
              >
                No shortcuts match your filter
              </p>
            ) : (
              categories.map((category) => (
                <section
                  key={category.key}
                  data-slot="shortcut-overlay-category"
                  data-elsewhere={category.elsewhere ? "" : undefined}
                >
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                    {category.name}
                  </h3>
                  {/* A description list so each label/keys pair is announced
                      as a pair. */}
                  <dl className="flex flex-col">
                    {category.entries.map((shortcut) => (
                      <div
                        key={`${category.key}-${shortcut.label}`}
                        data-slot="shortcut-overlay-row"
                        className={cn(
                          "flex min-w-0 items-center justify-between gap-4 border-b border-border py-1.5 last:border-b-0",
                        )}
                      >
                        <dt className="min-w-0 text-sm">
                          <span className="block truncate">
                            {shortcut.label}
                          </span>
                        </dt>
                        <dd className="m-0 shrink-0">
                          <KbdGroup>
                            {shortcut.keys.map((key, index) => (
                              <Kbd key={`${index}-${key}`}>
                                {formatShortcutKey(key, os)}
                              </Kbd>
                            ))}
                          </KbdGroup>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))
            )}
          </div>
        </ScrollArea>
        {footer ? (
          <div
            data-slot="shortcut-overlay-footer"
            className="border-t border-border px-6 py-3 text-xs text-muted-foreground"
          >
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
