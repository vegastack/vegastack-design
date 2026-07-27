// @vegastack combobox@0.3.0 sha256-lioM/RAirPYJvtMsYOmt6IiekSG2l3Y9/nVj5Om9zoI=

"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

function mergeStateClassName<State>(
  className: string,
  userClassName: string | ((state: State) => string | undefined) | undefined,
) {
  if (typeof userClassName === "function") {
    return (state: State) => cn(className, userClassName(state));
  }

  return cn(className, userClassName);
}

/* ------------------------------------------------------------------------------------------------
 * Combobox — a filterable, keyboard-navigable listbox behind a text input. Built on
 * [Base UI Combobox](https://base-ui.com/react/components/combobox). Unlike `Select` (choose from a
 * known set via a button trigger), `Combobox` is driven by a text `ComboboxInput` — the list narrows
 * as the user types, via Base UI's built-in `Intl.Collator` filtering against the `items` prop.
 *
 * Pass `items` (a flat array, a `{ value, label }` array, or an array of `{ items, ...groupMeta }`
 * groups) to the root so filtering, `itemToStringLabel`, and `ComboboxEmpty` all work automatically.
 * Render the list with a function child on `ComboboxList` (flat) or `ComboboxCollection` nested
 * inside `ComboboxGroup`s (grouped) — see the examples below.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `Combobox`. */
export type ComboboxProps<
  Value,
  Multiple extends boolean | undefined = false,
> = React.ComponentProps<typeof BaseCombobox.Root<Value, Multiple>>;

/**
 * `Combobox` — the root. Owns the selected value (`value`/`defaultValue`/`onValueChange`), the
 * input's text (`inputValue`/`defaultInputValue`/`onInputValueChange`), and the open state. Doesn't
 * render its own element. Add `multiple` to collect several values into an array and enable the
 * `ComboboxChips` parts. Pass `items` so filtering, label resolution, and `ComboboxEmpty` work.
 *
 * @example
 * // Flat, filterable list
 * const fonts = [
 *   { value: 'sans', label: 'Sans-serif' },
 *   { value: 'serif', label: 'Serif' },
 * ];
 * <Combobox items={fonts}>
 *   <ComboboxInputGroup>
 *     <ComboboxInput placeholder="Search fonts…" />
 *     <ComboboxTrigger />
 *   </ComboboxInputGroup>
 *   <ComboboxContent>
 *     <ComboboxEmpty>No fonts found.</ComboboxEmpty>
 *     <ComboboxList>
 *       {(item: (typeof fonts)[number]) => (
 *         <ComboboxItem key={item.value} value={item.value}>
 *           {item.label}
 *         </ComboboxItem>
 *       )}
 *     </ComboboxList>
 *   </ComboboxContent>
 * </Combobox>
 *
 * @example
 * // Multiple selection with chips
 * <Combobox multiple items={labels} defaultValue={['bug', 'docs']}>
 *   <ComboboxInputGroup>
 *     <ComboboxChips>
 *       <ComboboxValue>
 *         {(value: string[]) =>
 *           value.map((v) => (
 *             <ComboboxChip key={v}>
 *               {labelFor(v)}
 *               <ComboboxChipRemove aria-label={`Remove ${labelFor(v)}`} />
 *             </ComboboxChip>
 *           ))
 *         }
 *       </ComboboxValue>
 *       <ComboboxInput placeholder="Add labels…" />
 *     </ComboboxChips>
 *     <ComboboxClear aria-label="Clear all" />
 *     <ComboboxTrigger />
 *   </ComboboxInputGroup>
 *   <ComboboxContent>{/* ComboboxList / ComboboxItem *\/}</ComboboxContent>
 * </Combobox>
 */
export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxProps<Value, Multiple>,
) {
  // Non-modal by default (Base UI's own default) — deliberately NOT following Select/DropdownMenu's
  // modal-by-default convention. A Combobox's whole point is staying interactive alongside the open
  // popup: typing keeps filtering, and in `multiple` mode the ComboboxChipRemove controls next to
  // the input must stay clickable. `modal` locks the rest of the page as inert behind a clipped
  // backdrop that only carves out the anchor's ORIGINAL bounding box — once ComboboxChips grows the
  // input group (wrapped chips), controls outside that stale clip fall behind the inert backdrop and
  // become unclickable (verified: `modal` breaks chip removal while the popup stays open). Opt into
  // `modal` explicitly for a single-select, button-trigger-style usage that behaves like `Select`.
  return <BaseCombobox.Root data-slot="combobox" {...props} />;
}

/** Props accepted by `ComboboxValue`. */
export type ComboboxValueProps = React.ComponentProps<
  typeof BaseCombobox.Value
> & {
  /** Additional class names for the wrapping `<span>` (Base UI's `Value` renders no element). */
  className?: string;
};

/**
 * `ComboboxValue` — renders the selected value's label (or the `placeholder`) as read-only text.
 * Mainly for a button-style `ComboboxTrigger` with no visible text input (mirrors `SelectValue`).
 * Renders a `<span>`.
 *
 * @example
 * <ComboboxValue placeholder="Choose a country" />
 */
export function ComboboxValue({
  className,
  children,
  ...props
}: ComboboxValueProps) {
  return (
    <span
      data-slot="combobox-value"
      className={cn(
        "flex min-w-0 items-center gap-2 overflow-hidden text-start",
        className,
      )}
    >
      <BaseCombobox.Value {...props}>{children}</BaseCombobox.Value>
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Input + InputGroup — the text field. `ComboboxInput` is styled exactly like our standalone
 * `Input` field surface (border, focus ring, sizes). `ComboboxInputGroup` is the bordered wrapper
 * that composes the input with a trigger/clear/chips into ONE field — the group owns the border and
 * strips the nested input's own border/background via a `data-slot` descendant selector (same
 * technique `field.tsx` uses to flatten a nested control into its chrome).
 * ----------------------------------------------------------------------------------------------*/

export const comboboxInputVariants = cva(
  [
    "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base outline-none ",
    "focus:border-ring/(--alpha-tint-border)",
    "dark:bg-input/(--alpha-input)",
    "placeholder:text-muted-foreground-faint",
    "selection:bg-primary selection:text-primary-foreground",
    "data-[invalid]:border-destructive-border/(--alpha-tint-border)",
    "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--opacity-dim) data-[disabled]:bg-muted",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-(--size-sm) text-sm",
        default: "h-(--size-md)",
        lg: "h-(--size-lg)",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** Props accepted by `ComboboxInput`. */
export interface ComboboxInputProps
  extends
    Omit<React.ComponentProps<typeof BaseCombobox.Input>, "size">,
    VariantProps<typeof comboboxInputVariants> {}

/**
 * `ComboboxInput` — the text field that filters the list as the user types. Styled on the shared
 * 28/32/40 control scale (`size`: `sm` / `default` / `lg`), matching `Input`/`Select`. Use standalone
 * for a bare search field, or nested in a {@link ComboboxInputGroup} alongside a
 * {@link ComboboxTrigger} / {@link ComboboxClear} / {@link ComboboxChips}. Renders an `<input>`.
 *
 * @example
 * <ComboboxInput aria-label="Search projects" placeholder="Search…" />
 */
export function ComboboxInput({
  className,
  size = "default",
  ...props
}: ComboboxInputProps) {
  return (
    <BaseCombobox.Input
      data-slot="combobox-input"
      data-size={size}
      className={cn(comboboxInputVariants({ size }), className)}
      {...props}
    />
  );
}

/** Props accepted by `ComboboxPopupInput`. */
export type ComboboxPopupInputProps = Omit<ComboboxInputProps, "size">;

/**
 * `ComboboxPopupInput` — the search field for a Select-style combobox whose input lives INSIDE
 * `ComboboxContent` (the country-select / region-select pattern, with `p-0` on the content). A
 * bare {@link ComboboxInput} is a standalone bordered control — flush against the popup's
 * rounded corners it clips and double-borders. This is the popup-native form instead: a
 * full-bleed header row with a search icon and a bottom hairline (the same anatomy as
 * `CommandInput`), no own border or radius, sticky so it stays visible while the list scrolls
 * (the popup is the scroll container). Give the sibling `ComboboxList` its own `p-1`.
 *
 * @example
 * <ComboboxPopupInput aria-label="Search countries" placeholder="Search…" />
 */
export function ComboboxPopupInput({
  className,
  ...props
}: ComboboxPopupInputProps) {
  return (
    <div
      data-slot="combobox-popup-input-wrapper"
      // No focus tint here, unlike CommandInput's wrapper: this input is AUTO-focused the
      // moment the popup opens, so a `focus-within:border-ring/…` tint would be permanently
      // on — and in dark it paints the hairline near-white (ring is a light tint token),
      // reading as a stray border rather than a focus affordance. The open popup + caret
      // already communicate focus; the hairline stays a plain `border-border` separator.
      className="sticky top-0 z-(--z-raised) flex items-center gap-2 border-b border-border bg-popover px-3"
    >
      <Search
        aria-hidden
        className="size-(--icon-default) shrink-0 text-muted-foreground"
      />
      <BaseCombobox.Input
        data-slot="combobox-popup-input"
        className={cn(
          "h-(--size-md) w-full min-w-0 bg-transparent text-base text-foreground outline-none",
          "placeholder:text-muted-foreground-faint",
          "disabled:cursor-not-allowed disabled:opacity-(--opacity-dim)",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export const comboboxInputGroupVariants = cva(
  [
    "flex w-full min-w-0 flex-wrap items-center gap-1 rounded-md border border-input bg-transparent p-1 ",
    "dark:bg-input/(--alpha-input)",
    "data-[focused]:border-ring/(--alpha-tint-border)",
    "data-[invalid]:border-destructive-border/(--alpha-tint-border)",
    "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--opacity-dim) data-[disabled]:bg-muted",
    // Flatten the nested ComboboxInput into the group's own chrome (same technique as
    // field.tsx's CONTROL_SLOTS) — the group owns the border/ring, the input becomes borderless.
    "[&_[data-slot=combobox-input]]:h-full [&_[data-slot=combobox-input]]:min-w-12 [&_[data-slot=combobox-input]]:flex-1 [&_[data-slot=combobox-input]]:border-none [&_[data-slot=combobox-input]]:bg-transparent [&_[data-slot=combobox-input]]:px-1.5 [&_[data-slot=combobox-input]]:py-0 [&_[data-slot=combobox-input]]:focus:border-transparent [&_[data-slot=combobox-input]]:dark:bg-transparent",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "min-h-(--size-sm)",
        default: "min-h-(--size-md)",
        lg: "min-h-(--size-lg)",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** Props accepted by `ComboboxInputGroup`. */
export interface ComboboxInputGroupProps
  extends
    React.ComponentProps<typeof BaseCombobox.InputGroup>,
    VariantProps<typeof comboboxInputGroupVariants> {}

/**
 * `ComboboxInputGroup` — the bordered wrapper for the input and its adornments (trigger, clear,
 * chips). Reacts to field state directly via Base UI's own `data-focused`/`data-invalid`/
 * `data-disabled` attributes (no `focus-within`/`has-*` needed). `size` sets a `min-height` on the
 * 28/32/40 scale — it grows past that when {@link ComboboxChips} wrap to multiple lines. Renders a
 * `<div>`.
 *
 * @example
 * <ComboboxInputGroup>
 *   <ComboboxInput placeholder="Search…" />
 *   <ComboboxClear aria-label="Clear" />
 *   <ComboboxTrigger />
 * </ComboboxInputGroup>
 */
export function ComboboxInputGroup({
  className,
  size = "default",
  ...props
}: ComboboxInputGroupProps) {
  return (
    <BaseCombobox.InputGroup
      data-slot="combobox-input-group"
      data-size={size}
      className={cn(comboboxInputGroupVariants({ size }), className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Trigger — a chevron button that toggles the popup. Default styling is a compact, icon-only
 * square (for the common case: attached inside a ComboboxInputGroup next to the input). Override
 * `className` for a full-width, Select-style button trigger paired with ComboboxValue instead of a
 * visible ComboboxInput.
 * ----------------------------------------------------------------------------------------------*/

export const comboboxTriggerVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground select-none",
    "hover:bg-muted hover:text-foreground dark:hover:bg-muted/(--alpha-wash)",
    "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--opacity-dim)",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-(--size-sm)",
        default: "size-(--size-md)",
        lg: "size-(--size-lg)",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** Props accepted by `ComboboxTrigger`. */
export interface ComboboxTriggerProps
  extends
    React.ComponentProps<typeof BaseCombobox.Trigger>,
    VariantProps<typeof comboboxTriggerVariants> {}

/**
 * `ComboboxTrigger` — a button that opens/closes the popup without changing focus away from the
 * input. Renders a `ChevronsUpDown` chevron by default (THE combobox chevron — unlike `Select`'s
 * `ChevronDown`, it doesn't need to rotate, since it already reads as bidirectional/open-or-closed).
 * Pass children to render a different icon. Renders a `<button>`.
 *
 * @example
 * <ComboboxTrigger aria-label="Open options" />
 */
export function ComboboxTrigger({
  className,
  size = "default",
  children,
  ...props
}: ComboboxTriggerProps) {
  return (
    <BaseCombobox.Trigger
      data-slot="combobox-trigger"
      data-size={size}
      className={cn(comboboxTriggerVariants({ size }), className)}
      {...props}
    >
      <BaseCombobox.Icon
        data-slot="combobox-icon"
        className="flex items-center justify-center"
      >
        {children ?? (
          <ChevronsUpDown className="size-(--icon-default)" aria-hidden />
        )}
      </BaseCombobox.Icon>
    </BaseCombobox.Trigger>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Content — Portal + Positioner + Popup + List, mirroring SelectContent. `children` may be static
 * JSX (ComboboxItem/ComboboxGroup) or a function passed to the underlying List for flat, filtered
 * rendering (`{(item) => <ComboboxItem .../>}`) — Base UI implicitly wraps a function child in
 * `Combobox.Collection`.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ComboboxList`. */
export type ComboboxListProps = React.ComponentProps<typeof BaseCombobox.List>;

/**
 * `ComboboxList` — the Base UI list wrapper around items, required for roving-tabindex keyboard
 * navigation. Most consumers let {@link ComboboxContent} render it automatically; export is
 * available for direct composition. Accepts a function child for flat, filtered rendering. Renders
 * a `<div>`.
 *
 * @example
 * <ComboboxList>{(item) => <ComboboxItem value={item}>{item.name}</ComboboxItem>}</ComboboxList>
 */
export function ComboboxList({ className, ...props }: ComboboxListProps) {
  return (
    <BaseCombobox.List
      data-slot="combobox-list"
      className={cn(className)}
      {...props}
    />
  );
}

/** Props accepted by `ComboboxContent`. */
export interface ComboboxContentProps extends React.ComponentProps<
  typeof BaseCombobox.Popup
> {
  /** Preferred side of the anchor to render against. @default 'bottom' */
  side?: React.ComponentProps<typeof BaseCombobox.Positioner>["side"];
  /** Alignment relative to the anchor. @default 'start' */
  align?: React.ComponentProps<typeof BaseCombobox.Positioner>["align"];
  /** Gap in px between the anchor and the popup. @default FLOATING.sideOffsetAttached (4) */
  sideOffset?: number;
  /** Padding (px) reserved around the popup during collision detection. @default FLOATING.collisionPadding (8) */
  collisionPadding?: React.ComponentProps<
    typeof BaseCombobox.Positioner
  >["collisionPadding"];
  /** Props forwarded to the Base UI `Combobox.Positioner`.
   * @default undefined
   */
  positionerProps?: React.ComponentProps<typeof BaseCombobox.Positioner>;
  /** Props forwarded to the Base UI `Combobox.Portal`.
   * @default undefined
   */
  portalProps?: React.ComponentProps<typeof BaseCombobox.Portal>;
}

/**
 * `ComboboxContent` — the dropdown surface: Base UI `Portal` → `Positioner` → `Popup`. Enter/exit
 * animate via `data-starting-style`/`data-ending-style`. Sized to at least the anchor width and
 * capped to the available viewport height (scrolls past that). Renders a `<div>`.
 *
 * Unlike `SelectContent`, this does **not** auto-wrap `children` in a `ComboboxList` — compose one
 * yourself (required for keyboard nav) as a **sibling** of `ComboboxEmpty`/`ComboboxStatus`, not
 * their parent. `role="listbox"` only permits `role="option"`/group children per ARIA; nesting
 * `ComboboxEmpty` (`role="status"`) inside it fails `aria-required-children`. Verified: axe flags
 * this combination when List wraps Empty — see combobox.test.tsx.
 *
 * @example
 * <ComboboxContent>
 *   <ComboboxEmpty>No results.</ComboboxEmpty>
 *   <ComboboxList>{(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>
 * </ComboboxContent>
 */
export function ComboboxContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = FLOATING.sideOffsetAttached,
  collisionPadding = FLOATING.collisionPadding,
  positionerProps,
  portalProps,
  ...props
}: ComboboxContentProps) {
  const themeScope = useInternalThemeScope();
  const { className: positionerClassName, ...positionerPropsRest } =
    positionerProps ?? {};

  return (
    <BaseCombobox.Portal {...portalProps}>
      <BaseCombobox.Positioner
        {...positionerPropsRest}
        data-slot="combobox-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={mergeStateClassName<BaseCombobox.Positioner.State>(
          cn(themeScope, "z-(--z-overlay) outline-none"),
          positionerClassName,
        )}
      >
        <BaseCombobox.Popup
          data-slot="combobox-content"
          className={cn(
            themeScope,
            "relative z-(--z-overlay) max-h-[var(--available-height)] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-overlay",
            // `scale` must be listed explicitly — Tailwind v4 `scale-*` sets the CSS `scale`
            // property, which `transform` does not cover (register P0-06; matches every sibling).
            "transition-[transform,scale,opacity] duration-fast ease-standard",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Item — an option, with a trailing check indicator for the selected state. Styled identically to
 * `SelectItem`. `data-highlighted` (keyboard/hover) tints the accent; `data-disabled` dims.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ComboboxItem`. */
export type ComboboxItemProps = React.ComponentProps<typeof BaseCombobox.Item>;

/**
 * `ComboboxItem` — a single option. Shows a trailing check when selected; tints on
 * `data-highlighted` (keyboard nav / hover) and dims on `data-disabled`. Renders a `<div>`.
 *
 * @example
 * <ComboboxItem value={project}>{project.name}</ComboboxItem>
 */
export function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxItemProps) {
  return (
    <BaseCombobox.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full items-center gap-2 rounded-sm py-1.5 pe-8 ps-2 text-base outline-none select-none",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim)",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
        className,
      )}
      {...props}
    >
      <span className="absolute end-2 flex size-(--icon-default) items-center justify-center text-foreground">
        <BaseCombobox.ItemIndicator data-slot="combobox-item-indicator">
          <Check className="size-(--icon-default)" aria-hidden />
        </BaseCombobox.ItemIndicator>
      </span>
      {children}
    </BaseCombobox.Item>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Group + GroupLabel + Collection — grouped rendering. Pass `items` as an array of groups
 * (`{ items, label }` shape — the `label` key is yours to read) to the root, then render one
 * `ComboboxGroup` per group with a `ComboboxCollection` function child for its items.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ComboboxGroup`. */
export type ComboboxGroupProps = React.ComponentProps<
  typeof BaseCombobox.Group
>;

/**
 * `ComboboxGroup` — groups related items with a {@link ComboboxGroupLabel}. Renders a `<div>`.
 *
 * @example
 * <ComboboxGroup><ComboboxGroupLabel>Recent</ComboboxGroupLabel>{items}</ComboboxGroup>
 */
export function ComboboxGroup({ className, ...props }: ComboboxGroupProps) {
  return (
    <BaseCombobox.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

/** Props accepted by `ComboboxGroupLabel`. */
export type ComboboxGroupLabelProps = React.ComponentProps<
  typeof BaseCombobox.GroupLabel
>;

/**
 * `ComboboxGroupLabel` — a heading for a {@link ComboboxGroup}, auto-associated with it. Muted,
 * small. Renders a `<div>`.
 *
 * @example
 * <ComboboxGroupLabel>Recent</ComboboxGroupLabel>
 */
export function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxGroupLabelProps) {
  return (
    <BaseCombobox.GroupLabel
      data-slot="combobox-group-label"
      className={cn(
        "px-2 py-1.5 text-label-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ComboboxCollection`. */
export type ComboboxCollectionProps = React.ComponentProps<
  typeof BaseCombobox.Collection
>;

/**
 * `ComboboxCollection` — renders filtered items via a function child (`{(item) => …}`). Required
 * inside a {@link ComboboxGroup} for grouped rendering; a flat list can pass the same function
 * directly as {@link ComboboxList}'s child instead (Base UI implicitly wraps it in a `Collection`).
 * Doesn't render its own element.
 *
 * @example
 * <ComboboxCollection>{(item) => <ComboboxItem value={item}>{item.name}</ComboboxItem>}</ComboboxCollection>
 */
export function ComboboxCollection(props: ComboboxCollectionProps) {
  return <BaseCombobox.Collection {...props} />;
}

/**
 * `useComboboxFilteredItems` — reads the root's query-filtered `items` (call inside `Combobox`).
 * Required for **grouped** rendering: {@link ComboboxGroup}'s `items` prop is used verbatim by its
 * nested {@link ComboboxCollection} (it is NOT re-filtered against the input query on its own), so
 * map each group's items from this hook's result — not from your original static `items` array —
 * or typing into {@link ComboboxInput} won't narrow the groups. A flat list doesn't need this: a
 * function child on {@link ComboboxList} filters automatically.
 *
 * @example
 * function GroupedItems() {
 *   const groups = useComboboxFilteredItems<{ label: string; items: string[] }>();
 *   return groups.map((group) => (
 *     <ComboboxGroup key={group.label} items={group.items}>
 *       <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
 *       <ComboboxCollection>
 *         {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
 *       </ComboboxCollection>
 *     </ComboboxGroup>
 *   ));
 * }
 * // …
 * <ComboboxList><GroupedItems /></ComboboxList>
 */
export const useComboboxFilteredItems = BaseCombobox.useFilteredItems;

/* ------------------------------------------------------------------------------------------------
 * Empty + Status — announced, always-mounted feedback rows. Base UI requires their root element to
 * stay in the DOM (it drives the ARIA live-region announcement) — toggle their CHILDREN, never
 * conditionally render the component itself.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ComboboxEmpty`. */
export type ComboboxEmptyProps = React.ComponentProps<
  typeof BaseCombobox.Empty
>;

/**
 * `ComboboxEmpty` — shown when the current query matches no items (requires `items` on the root).
 * Politely announced to screen readers. Must stay mounted — never wrap it in a conditional; Base UI
 * shows/hides its children internally. Renders a `<div>`.
 *
 * @example
 * <ComboboxEmpty>No project found.</ComboboxEmpty>
 */
export function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <BaseCombobox.Empty
      data-slot="combobox-empty"
      className={cn(
        "py-6 text-center text-base text-muted-foreground empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ComboboxStatus`. */
export type ComboboxStatusProps = React.ComponentProps<
  typeof BaseCombobox.Status
>;

/**
 * `ComboboxStatus` — a politely-announced status row, for conveying the state of an asynchronously
 * loaded list (e.g. a search request in flight). Compose it with `<Spinner size="inherit" label="" />`
 * for a loading row. Must stay mounted, like {@link ComboboxEmpty}. Renders a `<div>`.
 *
 * @example
 * <ComboboxStatus>
 *   {isLoading ? (
 *     <>
 *       <Spinner size="inherit" label="" />
 *       Searching…
 *     </>
 *   ) : null}
 * </ComboboxStatus>
 */
export function ComboboxStatus({ className, ...props }: ComboboxStatusProps) {
  return (
    <BaseCombobox.Status
      data-slot="combobox-status"
      className={cn(
        "flex items-center justify-center gap-2 py-6 text-base text-muted-foreground empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Clear — an X button that resets the input text / selected value(s). Unmounts itself when there's
 * nothing to clear (`data-visible`, default `keepMounted={false}`).
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ComboboxClear`. */
export type ComboboxClearProps = React.ComponentProps<
  typeof BaseCombobox.Clear
>;

/**
 * `ComboboxClear` — clears the input text (single mode) or every selected value (multiple mode) on
 * click. Renders nothing until there's something to clear, and fades out on removal
 * (`data-starting-style`/`data-ending-style`). Requires an `aria-label` (no visible text). Renders a
 * `<button>`.
 *
 * @example
 * <ComboboxClear aria-label="Clear search" />
 */
export function ComboboxClear({
  className,
  children,
  ...props
}: ComboboxClearProps) {
  return (
    <BaseCombobox.Clear
      data-slot="combobox-clear"
      className={cn(
        "inline-flex size-(--size-xs) shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity duration-fast ease-standard",
        "hover:text-foreground",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--opacity-dim)",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-compact)",
        className,
      )}
      {...props}
    >
      {children ?? <X className="size-(--icon-compact)" aria-hidden />}
    </BaseCombobox.Clear>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Chips + Chip + ChipRemove — the `multiple`-mode tag row. `ComboboxChips` wraps the selected-value
 * chips AND the `ComboboxInput` together (the input flows after the chips and keeps typing/filtering
 * — put it as the last child). Chip visuals mirror `FilterChip` (filter-bar.tsx): a neutral `accent`
 * pill with a trailing remove control, one control-scale tier down (`h-(--size-xs)`) to read as
 * inline tags rather than standalone chips.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ComboboxChips`. */
export type ComboboxChipsProps = React.ComponentProps<
  typeof BaseCombobox.Chips
>;

/**
 * `ComboboxChips` — a flex-wrap container for {@link ComboboxChip}s and the `ComboboxInput` in
 * `multiple` mode. Compose it inside a {@link ComboboxInputGroup}. Renders a `<div>`.
 *
 * @example
 * <ComboboxChips>
 *   <ComboboxValue>
 *     {(values: string[]) => values.map((v) => (
 *       <ComboboxChip key={v}>
 *         {labelFor(v)}
 *         <ComboboxChipRemove aria-label={`Remove ${labelFor(v)}`} />
 *       </ComboboxChip>
 *     ))}
 *   </ComboboxValue>
 *   <ComboboxInput placeholder="Add labels…" />
 * </ComboboxChips>
 */
export function ComboboxChips({ className, ...props }: ComboboxChipsProps) {
  return (
    <BaseCombobox.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-w-0 flex-1 flex-wrap items-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ComboboxChip`. */
export type ComboboxChipProps = React.ComponentProps<typeof BaseCombobox.Chip>;

/**
 * `ComboboxChip` — a single selected-value tag inside {@link ComboboxChips}. Neutral `accent` fill,
 * one control-scale tier down (`h-(--size-xs)`, matching `FilterChip`'s inline-tag treatment).
 * Pass the label text followed by a {@link ComboboxChipRemove} as children — they render as
 * siblings (not wrapped together) so the remove control stays independently clickable/focusable.
 * Renders a `<div>`.
 *
 * @example
 * <ComboboxChip>Design<ComboboxChipRemove aria-label="Remove Design" /></ComboboxChip>
 */
export function ComboboxChip({
  className,
  children,
  ...props
}: ComboboxChipProps) {
  return (
    <BaseCombobox.Chip
      data-slot="combobox-chip"
      className={cn(
        "inline-flex h-(--size-xs) max-w-full shrink-0 items-center gap-1 rounded-md border border-border bg-accent pe-1 ps-2 text-sm text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim)",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-compact)",
        className,
      )}
      {...props}
    >
      {children}
    </BaseCombobox.Chip>
  );
}

/** Props accepted by `ComboboxChipRemove`. */
export type ComboboxChipRemoveProps = React.ComponentProps<
  typeof BaseCombobox.ChipRemove
>;

/**
 * `ComboboxChipRemove` — the trailing `×` control on a {@link ComboboxChip} that removes it from the
 * selection. Requires an `aria-label` (no visible text). Renders a `<button>`.
 *
 * @example
 * <ComboboxChipRemove aria-label="Remove Design" />
 */
export function ComboboxChipRemove({
  className,
  children,
  ...props
}: ComboboxChipRemoveProps) {
  return (
    <BaseCombobox.ChipRemove
      data-slot="combobox-chip-remove"
      className={cn(
        "-me-0.5 ms-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-foreground",
        "hover:bg-foreground/(--alpha-ink-tint)",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim)",
        className,
      )}
      {...props}
    >
      {children ?? <X className="size-(--icon-compact)" aria-hidden />}
    </BaseCombobox.ChipRemove>
  );
}
