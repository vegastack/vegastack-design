// @vegastack command@0.5.0 sha256-A3Dfdb2m2O2ATsQJaiFGbI2TGSQFkKs4jzu9QtfjbVA=

"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { Search } from "lucide-react";
import { cn } from "@vegastack/design";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ------------------------------------------------------------------------------------------------
 * Command — a searchable command palette built on Base UI's `Combobox`, rendered ALWAYS-OPEN in
 * its `inline` mode (`<Combobox.Root inline open>`) so the list stays inline in the layout instead
 * of a floating popup — exactly the palette shape (`Command` inline / inside a `Popover`, or
 * `CommandDialog` inside our `Dialog`). Exported FLAT (shadcn-style): `Command`, `CommandInput`
 * (leading search icon), `CommandList`, `CommandEmpty`, `CommandLoading`, `CommandGroup`,
 * `CommandItem`, `CommandSeparator`, `CommandShortcut`, `CommandDialog`.
 *
 * DATA-DRIVEN (breaking change from the prior build): Base UI's Combobox only filters and
 * drives `CommandEmpty` off a query-filtered `items` array — static children never narrow (see
 * combobox.tsx's own finding #5). Pass `items` to `Command` (flat, or an array of
 * `{ heading, items }` groups) and render with a function child: `{(item) => <CommandItem .../>}`
 * on `CommandList` for a flat list, or call {@link useCommandFilteredItems} + map to
 * `CommandGroup`s for a grouped one (mirrors combobox.tsx's `useComboboxFilteredItems` — its own
 * `ComboboxGroup.items` is read verbatim, NOT re-filtered, so always feed it the filtered result).
 *
 * ANATOMY CHANGE: `CommandEmpty`/`CommandLoading` render `role="status"`, which is not a valid
 * child of `CommandList`'s `role="listbox"` (ARIA only permits `option`/`group`). The old
 * build nested them inside `CommandList` and suppressed the resulting `aria-required-children`
 * violation for `CommandLoading` (see the removed suppression in command.test.tsx). Base UI's own
 * `ComboboxContent` docs prescribe the fix: render `CommandEmpty`/`CommandLoading` as SIBLINGS of
 * `CommandList`, not its children — done here, with NO suppression needed.
 *
 * DROPPED: `useCommandState` (no equivalent internal store to subscribe to;
 * consumers needing derived state now own it via `items`/`onInputValueChange` on `Command`, or
 * {@link useCommandFilteredItems}). `keywords`/`forceMount` per-item props (no Base UI
 * equivalent — see the deviations recorded in command.characterization.test.tsx /
 * docs/plans/.x1-command-summary.md for how each is now expressed, where it still makes sense, via
 * the data-driven `items` + a custom `filter`).
 *
 * PRESENTATIONAL (G7): items take `onSelect` callbacks — the consuming app wires routes/actions.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `Command`. */
export type CommandProps<Value = unknown> = Omit<
  React.ComponentProps<typeof BaseCombobox.Root<Value, false>>,
  "inline" | "open" | "defaultOpen" | "multiple" | "children" | "autoHighlight"
> & {
  children?: React.ReactNode;
  /** Additional class names for the styled `<div data-slot="command">` shell. */
  className?: string;
  /**
   * Loop keyboard navigation past the first/last item back to the other end.
   * @default false
   */
  loop?: boolean;
  /**
   * Whether the first matching item is highlighted automatically. Defaults to `'always'` (highlight
   * item 0 as soon as the list is visible) — Command is always-open, so this reproduces the prior
   * build's behavior of the first item starting highlighted, letting `ArrowDown` move to the
   * SECOND item on the very first press rather than merely highlighting the first.
   * @default 'always'
   */
  autoHighlight?: boolean | "always";
};

/**
 * `Command` — the palette root. Owns the search query (`inputValue`), the query-filtered `items`,
 * and keyboard navigation over its descendant `CommandItem`s. Always rendered "open" (Base UI's
 * `inline` mode — the list is part of the normal layout flow, never a floating popup) since a
 * command palette's list is always visible once mounted; wrap it in `CommandDialog` for the ⌘K
 * overlay, or place it inline / inside a `Popover`.
 *
 * @example
 * // Flat, filterable list
 * const items = [
 *   { value: 'docs', label: 'Documentation' },
 *   { value: 'settings', label: 'Settings' },
 * ];
 * <Command items={items}>
 *   <CommandInput placeholder="Search…" />
 *   <CommandEmpty>No results found.</CommandEmpty>
 *   <CommandList>
 *     {(item: (typeof items)[number]) => (
 *       <CommandItem key={item.value} value={item.value} onSelect={() => goTo(item.value)}>
 *         {item.label}
 *       </CommandItem>
 *     )}
 *   </CommandList>
 * </Command>
 *
 * @example
 * // Grouped — see useCommandFilteredItems for why groups read the FILTERED result, not the
 * // original static array.
 * function Groups() {
 *   const groups = useCommandFilteredItems<{ heading: string; items: typeof items }>();
 *   return groups.map((group) => (
 *     <CommandGroup key={group.heading} heading={group.heading} items={group.items}>
 *       {(item) => <CommandItem key={item.value} value={item.value}>{item.label}</CommandItem>}
 *     </CommandGroup>
 *   ));
 * }
 */
export function Command<Value = unknown>({
  className,
  loop = false,
  autoHighlight = "always",
  children,
  ...props
}: CommandProps<Value>) {
  return (
    <BaseCombobox.Root
      inline
      open
      modal={false}
      loopFocus={loop}
      // Base UI's public `Combobox.Root` type narrows `autoHighlight` to `boolean` (dropping the
      // `'always'` literal), but the runtime (`AriaCombobox`, which `ComboboxRoot` passes this
      // straight through to, unvalidated) fully supports it — verified empirically. Cast around
      // the narrower public type rather than dropping the feature Command actually needs.
      autoHighlight={autoHighlight as boolean}
      {...props}
    >
      <div
        data-slot="command"
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground",
          className,
        )}
      >
        {children}
      </div>
    </BaseCombobox.Root>
  );
}

/** Props accepted by `CommandDialog`. */
export interface CommandDialogProps extends React.ComponentProps<
  typeof Dialog
> {
  /** Command palette content (CommandInput, CommandList, CommandGroup, …).
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * Accessible title for the dialog. Visually hidden by default (the search input is the visible
   * affordance), but always announced to assistive tech.
   * @default "Command Menu"
   */
  title?: string;
  /**
   * Accessible description for the dialog. Visually hidden, announced to assistive tech.
   * @default "Search for a command to run."
   */
  description?: string;
  /** Additional className on the inner `Command` element.
   * @default undefined
   */
  className?: string;
  /**
   * Props forwarded to the inner `Command` root (`items`, `loop`, `filter`, `value`,
   * `onValueChange`, …). `className` and `children` stay on `CommandDialog` so the styled shell
   * remains stable.

   * @default undefined
   */
  commandProps?: Omit<CommandProps, "className" | "children">;
}

/**
 * `CommandDialog` — a `Command` rendered inside our `Dialog`, for the ⌘K command-palette overlay.
 * Open/close is controlled exactly like `Dialog` (`open` / `defaultOpen` / `onOpenChange`); the
 * app owns the keyboard shortcut that toggles it. The title/description are visually hidden but
 * wired for screen readers.
 *
 * @example
 * const [open, setOpen] = React.useState(false);
 * // app wires: useEffect(() => bind ⌘K → setOpen((o) => !o), []);
 * <CommandDialog open={open} onOpenChange={setOpen} commandProps={{ items }}>
 *   <CommandInput placeholder="Type a command or search…" />
 *   <CommandEmpty>No results found.</CommandEmpty>
 *   <CommandList>{(item) => <CommandItem key={item.value} value={item.value}>{item.label}</CommandItem>}</CommandList>
 * </CommandDialog>
 */
export function CommandDialog({
  title = "Command Menu",
  description = "Search for a command to run.",
  className,
  commandProps,
  children,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent
        data-slot="command-dialog-content"
        showCloseButton={false}
        className="overflow-hidden p-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command
          {...commandProps}
          className={cn(
            "[&_[data-slot=command-input-wrapper]]:h-(--size-lg) [&_[data-slot=command-input]]:h-(--size-lg) [&_[data-slot=command-input-wrapper]_svg]:size-(--icon-action)",
            "[&_[data-slot=command-item]]:px-3 [&_[data-slot=command-item]]:py-2",
            className,
          )}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/** Props accepted by `CommandInput`. */
export type CommandInputProps = React.ComponentProps<typeof BaseCombobox.Input>;

/**
 * `CommandInput` — the search field. Renders a leading search icon plus Base UI's combobox input
 * (`role="combobox"`); typing live-filters `Command`'s `items`. Control it with `inputValue` +
 * `onInputValueChange` on `Command`, or let it manage its own state.

 *
 * @example
 * <CommandInput />
 */
export function CommandInput({ className, ...props }: CommandInputProps) {
  // ARIA prohibits name-from-content on role=combobox, so default an accessible name from the
  // placeholder (a placeholder alone is a weak/disappearing name). Consumers can override aria-label.
  const accessibleName =
    props["aria-label"] ??
    (props["aria-labelledby"]
      ? undefined
      : typeof props.placeholder === "string"
        ? props.placeholder
        : "Search");
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-(--size-md) items-center gap-2 border-b border-border px-3 focus-within:border-ring/(--alpha-tint-border)"
    >
      <Search
        aria-hidden
        className="size-(--icon-default) shrink-0 text-muted-foreground"
      />
      <BaseCombobox.Input
        data-slot="command-input"
        aria-label={accessibleName}
        // `role="combobox"` REQUIRES `aria-expanded` unconditionally (WAI-ARIA), but Base UI's
        // `inline` mode (the list is always part of the layout, never a floating popup) never sets
        // it — verified: consistently absent across every render, not a timing race. Command is
        // architecturally always "expanded" (`inline open`), so hardcode it true.
        aria-expanded="true"
        className={cn(
          "flex h-(--size-md) w-full bg-transparent text-base text-foreground outline-none",
          "placeholder:text-muted-foreground-faint",
          "disabled:cursor-not-allowed disabled:opacity-(--opacity-dim)",
          className,
        )}
        {...props}
      />
    </div>
  );
}

/** Props accepted by `CommandList`. */
export type CommandListProps<Item = unknown> = Omit<
  React.ComponentProps<typeof BaseCombobox.List>,
  "children"
> & {
  /**
   * Static composition (e.g. `CommandGroup`s) or a function child for flat, filtered rendering
   * (`{(item) => <CommandItem .../>}` — Base UI implicitly wraps a function child in a
   * `Combobox.Collection`).
   */
  children?: React.ReactNode | ((item: Item, index: number) => React.ReactNode);
};

/**
 * `CommandList` — the scrollable listbox (`role="listbox"`) that holds groups and items. Does
 * **not** render `CommandEmpty`/`CommandLoading` — place those as its siblings (see the anatomy
 * note on {@link Command}); nesting them inside trips ARIA's `aria-required-children` (a listbox
 * only owns `option`/`group`).

 *
 * @example
 * <CommandList />
 */
export function CommandList<Item = unknown>({
  className,
  ...props
}: CommandListProps<Item>) {
  return (
    <BaseCombobox.List
      data-slot="command-list"
      className={cn(
        "flex max-h-80 scroll-py-1 flex-col overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `CommandEmpty`. */
export type CommandEmptyProps = React.ComponentProps<typeof BaseCombobox.Empty>;

/**
 * `CommandEmpty` — shown when the query-filtered `items` is empty. Requires `items` on `Command`.
 * Politely announced to screen readers. Must stay mounted (Base UI toggles its children
 * internally) and render as a SIBLING of `CommandList`, not its child (see {@link Command}'s
 * anatomy note).

 *
 * @example
 * <CommandEmpty />
 */
export function CommandEmpty({ className, ...props }: CommandEmptyProps) {
  return (
    <BaseCombobox.Empty
      data-slot="command-empty"
      className={cn(
        "py-6 text-center text-base text-muted-foreground empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `CommandLoading`. */
export type CommandLoadingProps = React.ComponentProps<
  typeof BaseCombobox.Status
>;

/**
 * `CommandLoading` — an announced status row for asynchronous command results (built on Base UI's
 * `Combobox.Status`, a polite `role="status"` live region). Conditionally render it while
 * fetching; compose `<Spinner size="inherit" label="" />` + a message as children. Must stay
 * mounted, and renders as a SIBLING of `CommandList` — same anatomy reason as {@link CommandEmpty}.
 *
 * @example
 * <CommandLoading>
 *   {isLoading ? (
 *     <>
 *       <Spinner size="inherit" label="" />
 *       Loading commands…
 *     </>
 *   ) : null}
 * </CommandLoading>
 */
export function CommandLoading({ className, ...props }: CommandLoadingProps) {
  return (
    <BaseCombobox.Status
      data-slot="command-loading"
      className={cn(
        "flex items-center justify-center gap-2 py-6 text-base text-muted-foreground empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `CommandGroup`. */
export type CommandGroupProps<Item = unknown> = Omit<
  React.ComponentProps<typeof BaseCombobox.Group>,
  "children" | "items"
> & {
  /** Section label, rendered above the group's items. */
  heading?: React.ReactNode;
  /**
   * This group's items — MUST be the already query-filtered subset (from
   * {@link useCommandFilteredItems}), not the group's original static array; Base UI reads this
   * prop verbatim and does not re-filter it.
   */
  items?: readonly Item[];
  /** Render function invoked once per item in {@link items} (wrapped in a `Combobox.Collection`). */
  children?: (item: Item, index: number) => React.ReactNode;
};

/**
 * `CommandGroup` — a labeled section of items. Pass `heading` for the section label and `items`
 * for its (filtered) items; the group hides itself automatically when its `items` is empty.

 *
 * @example
 * <CommandGroup />
 */
export function CommandGroup<Item = unknown>({
  className,
  heading,
  items,
  children,
  ...props
}: CommandGroupProps<Item>) {
  return (
    <BaseCombobox.Group
      data-slot="command-group"
      items={items}
      className={cn("overflow-hidden p-1 text-foreground", className)}
      {...props}
    >
      {heading ? (
        <BaseCombobox.GroupLabel
          data-slot="command-group-heading"
          className="px-2 py-1.5 text-label-sm text-muted-foreground"
        >
          {heading}
        </BaseCombobox.GroupLabel>
      ) : null}
      {children ? (
        <BaseCombobox.Collection>{children}</BaseCombobox.Collection>
      ) : null}
    </BaseCombobox.Group>
  );
}

/** Props accepted by `CommandSeparator`. */
export type CommandSeparatorProps = React.ComponentProps<typeof BaseSeparator>;

/**
 * `CommandSeparator` — a thin divider between groups. Decorative; ignored by item navigation.
 *
 * a11y: Base UI's `Separator` renders `role="separator"`, which — like `CommandEmpty` /
 * `CommandLoading`'s `role="status"` — is not a permitted owned child of `CommandList`'s
 * `role="listbox"` (ARIA allows only `group`/`option`) when rendered between groups. Marked
 * `aria-hidden` (same fix the prior build used): purely decorative, so removing it from the
 * accessibility tree is the correct ARIA treatment and `aria-required-children` passes with no
 * suppression.

 *
 * @example
 * <CommandSeparator />
 */
export function CommandSeparator({
  className,
  ...props
}: CommandSeparatorProps) {
  return (
    <BaseSeparator
      data-slot="command-separator"
      aria-hidden
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/** Props accepted by `CommandItem`. */
export interface CommandItemProps<Value = unknown> extends Omit<
  React.ComponentProps<typeof BaseCombobox.Item>,
  "onClick" | "onSelect"
> {
  /**
   * Fired when the item is activated — by click, or by pressing `Enter` while it's highlighted
   * (Base UI's `Combobox.Item.onClick` covers both; see its own doc comment). Receives the item's
   * `value`. The app wires the actual command/navigation — this component is presentational.
   *
   * Note: shadows the native DOM `onSelect` text-selection event (irrelevant on a non-input
   * `<div>`) — intentional, kept for continuity with the prior API.

   * @default undefined
   */
  onSelect?: (value: Value) => void;
}

/**
 * `CommandItem` — a selectable row. Wire `onSelect` to run a command / navigate. The
 * keyboard/pointer-active item carries Base UI's `data-highlighted` and is styled with
 * `bg-accent`; pass `disabled` to skip it in navigation. Render an icon + label (and optionally a
 * `CommandShortcut`) as children.

 *
 * @example
 * <CommandItem />
 */
export function CommandItem<Value = unknown>({
  className,
  onSelect,
  value,
  ...props
}: CommandItemProps<Value>) {
  return (
    <BaseCombobox.Item
      data-slot="command-item"
      value={value}
      onClick={onSelect ? () => onSelect(value as Value) : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none",
        "text-foreground",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim)",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `CommandShortcut`. */
export type CommandShortcutProps = React.ComponentProps<"span">;

/**
 * `CommandShortcut` — the trailing keyboard-hint text on an item (e.g. `⌘P`). Right-aligned,
 * muted. Purely visual — the app binds the actual shortcut.
 *
 * Deliberately plain text, NOT the `Kbd` component (audit-reviewed): menu shortcut hints
 * (DropdownMenuShortcut / ContextMenu) are plain muted text too, and chip-styled keys would
 * make every palette row read busier than the menus it sits beside. Compose `Kbd` yourself
 * for a one-off if a surface genuinely needs the chip treatment.

 *
 * @example
 * <CommandShortcut />
 */
export function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("ms-auto text-mono-label text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Props accepted by `CommandFooter`. */
export type CommandFooterProps = React.ComponentProps<"div">;

/**
 * `CommandFooter` — the palette footer action bar (Wave 2, from the app-teardown
 * command-menu anatomy): a hairline-topped row pinned under the list, with
 * keyboard hints on the left and a primary action on the right. Compose
 * `Kbd` + muted copy for the hints and a small `Button` for the action:
 *
 * @example
 * <Command items={items}>
 *   <CommandInput placeholder="Search…" />
 *   <CommandList>{…}</CommandList>
 *   <CommandFooter>
 *     <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
 *       <Kbd keys="↑" size="sm" /> <Kbd keys="↓" size="sm" /> Navigate
 *     </span>
 *     <Button size="sm">Open<Kbd keys="↵" size="sm" className="ms-1" /></Button>
 *   </CommandFooter>
 * </Command>
 */
export function CommandFooter({ className, ...props }: CommandFooterProps) {
  return (
    <div
      data-slot="command-footer"
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-t border-border px-3 py-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `useCommandFilteredItems` — reads `Command`'s query-filtered `items` (call inside `Command`).
 * Required for **grouped** rendering: {@link CommandGroup}'s `items` prop is read verbatim by its
 * internal `Combobox.Collection` (not re-filtered against the input query), so map each group's
 * items from this hook's result — not the original static array — or typing won't narrow the
 * groups. A flat list doesn't need this: a function child on {@link CommandList} filters
 * automatically. Thin re-export of Base UI's `Combobox.useFilteredItems`.
 */
export const useCommandFilteredItems = BaseCombobox.useFilteredItems;
