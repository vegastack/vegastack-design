// @vegastack shortcut-overlay@0.3.0 sha256-MgpOlhhYZBA93PKyXtbEd6J/f3fC+tlEN8iXfueSHsI=

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
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlatform } from "@/components/ui/use-platform";

/* ---
`ShortcutOverlay`'s value is the REGISTRY model, not the dialog. A hand-listed shortcuts
dialog goes stale the day someone adds a binding; declaring each shortcut once — keys,
label, category, an optional `when` — and rendering the overlay FROM that data is what
keeps the surface maintainable. The same declarations can feed tooltip hints and
Command rows; this component just owns the `?` surface.

This is also the one surface that should use the real `Kbd`: `CommandShortcut` is
deliberately plain text and `TooltipKbd` hand-rolls its own markup, but a dialog whose
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

/** Props accepted by `ShortcutOverlay`. */
export interface ShortcutOverlayProps {
  /** The declared shortcuts. Categories render in first-appearance order. */
  shortcuts: readonly ShortcutDefinition[];
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
 */
export function ShortcutOverlay({
  shortcuts,
  open,
  onOpenChange,
  triggerKey = "?",
  shouldHandle,
  title = "Keyboard shortcuts",
  searchable,
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
  const kbdOs = os === "mac" ? "mac" : "other";

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
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable)
      )
        return;
      if (shouldHandleRef.current && !shouldHandleRef.current()) return;
      event.preventDefault();
      setOpenRef.current(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [triggerKey]);

  const visible = shortcuts.filter((s) => s.when !== false);
  const showSearch = searchable ?? visible.length > 10;
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? visible.filter(
        (s) =>
          s.label.toLowerCase().includes(trimmed) ||
          s.category.toLowerCase().includes(trimmed) ||
          s.keys.join(" ").toLowerCase().includes(trimmed),
      )
    : visible;

  // Group by category in first-appearance order — the declaration order is the
  // information architecture.
  const categories: { name: string; entries: ShortcutDefinition[] }[] = [];
  for (const shortcut of filtered) {
    const existing = categories.find((c) => c.name === shortcut.category);
    if (existing) existing.entries.push(shortcut);
    else categories.push({ name: shortcut.category, entries: [shortcut] });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent data-slot="shortcut-overlay" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Shortcuts available on this page.
          </DialogDescription>
        </DialogHeader>
        {showSearch ? (
          <Input
            size="sm"
            aria-label="Filter shortcuts"
            placeholder="Filter shortcuts…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        ) : null}
        <ScrollArea className="max-h-[calc(100dvh-var(--spacing)*64)]">
          <div className="flex flex-col gap-4 pe-3">
            {categories.length === 0 ? (
              <p
                data-slot="shortcut-overlay-empty"
                className="py-4 text-center text-sm text-muted-foreground"
              >
                No shortcuts match your filter
              </p>
            ) : (
              categories.map((category) => (
                <section
                  key={category.name}
                  data-slot="shortcut-overlay-category"
                >
                  <h3 className="mb-2 text-label-sm text-muted-foreground">
                    {category.name}
                  </h3>
                  {/* A description list so each label/keys pair is announced
                      as a pair. */}
                  <dl className="flex flex-col">
                    {category.entries.map((shortcut) => (
                      <div
                        key={`${shortcut.category}-${shortcut.label}`}
                        data-slot="shortcut-overlay-row"
                        className={cn(
                          "flex min-w-0 items-center justify-between gap-4 border-b border-border py-1.5 last:border-b-0",
                        )}
                      >
                        <dt className="min-w-0 text-base">
                          <span className="block truncate">
                            {shortcut.label}
                          </span>
                        </dt>
                        <dd className="m-0 shrink-0">
                          <Kbd keys={shortcut.keys} os={kbdOs} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
