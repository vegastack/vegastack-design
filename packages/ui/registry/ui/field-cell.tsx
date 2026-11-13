// @vegastack field-cell@0.77.0 sha256-FsFV942CaDb+hFyk7E8I06H0rc2eOGLK6CkPLz7j/6Q=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { FieldCounter } from "@/components/ui/field";
import {
  AtSign,
  Calculator,
  Calendar,
  CalendarClock,
  CircleDot,
  CircleUser,
  Clock,
  DollarSign,
  Globe,
  Hash,
  Link2,
  ListChecks,
  Paperclip,
  Pencil,
  Percent,
  Phone,
  SquareCheck,
  Text,
  TextQuote,
  UserPen,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker, DateTimePicker } from "@/components/ui/date-picker";
import {
  EditableCell,
  type EditableCellMove,
} from "@/components/ui/editable-cell";
import { InlineChip, useInlineChipResolver } from "@/components/ui/inline-chip";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import {
  PeoplePicker,
  PeoplePickerContent,
  type PeoplePickerOption,
  type PeoplePickerSearch,
} from "@/components/ui/people-picker";
import { PersonAvatar, personDisplayName } from "@/components/ui/person-avatar";
import {
  PropertyLabel,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useDateFormat, useTimeZone } from "@/components/ui/relative-time";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  TEXT_EDIT_SESSION_SELECTOR,
  TextEdit,
  type MentionKind,
  type TextEditHandle,
  type TextEditMentions,
} from "@/components/ui/text-edit";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Thumbnail } from "@/components/ui/thumbnail";
import { toast } from "@/components/ui/toast";
import {
  TruncatedText,
  TruncationFocusProvider,
  useTruncationFocusable,
} from "@/components/ui/truncated-text";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  useAsyncSearch,
  type AsyncSearchLoader,
} from "@/components/ui/use-async-search";
import { Chip, type ChipHue } from "@/components/ui/chip";
import {
  formatCalendarDate,
  formatDateTime,
  parseCalendarDay,
  toCalendarDay,
  zonedToday,
  type DateFormat,
} from "@/lib/date-time";
import { FileKindTile } from "@/lib/file-kind";
import { typedFirstLine } from "@/lib/text-edit-grammar";

/* ---
`field-cell` is one display and one editor per field type, so a table cell, a row panel and a
record page's Fields group show and edit a value the same way — no module writes its own field
editors. Three exports:

- `FieldCellDisplay` — the value as text, chips, avatars or thumbnails, one line, truncating.
- `FieldCellEditor` — the editor a grid cell opens (`EditableCell`'s `custom` slot): it commits a
  TYPED value, or cancels.
- `FieldInput` — the same editors as plain form controls (`onChange`), for a panel or a form.

Field TYPES are data types (text, number, date, choice, person, link, file…), not app vocabulary:
what a link points at, its kind's icon and noun, whose people exist and how records are found are
all the host's (`config`, and the `InlineChip` resolver the host provides). Locale and time zone
come from the reader (`TimeZoneProvider`), not props.

Deliberately NOT done here:
- No persistence and no validation beyond a value's own shape (a URL, an email, a phone number):
  required fields, uniqueness and formulas are the host's.
- No rollup, lookup or status types (later).
--- */

/** A field's data type. */
export type FieldType =
  | "text"
  | "long_text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "datetime"
  | "single_choice"
  | "multi_choice"
  | "checkbox"
  | "person"
  | "link"
  | "file"
  | "url"
  | "email"
  | "phone"
  | "calculated"
  | "autonumber"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "updated_by";

/** Plain words for each field type ("Date and time"), for menus, headers and messages. */
export const FIELD_TYPE_LABELS: Readonly<Record<FieldType, string>> = {
  text: "Text",
  long_text: "Long text",
  number: "Number",
  currency: "Currency",
  percent: "Percent",
  date: "Date",
  datetime: "Date and time",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  checkbox: "Checkbox",
  person: "Person",
  link: "Link",
  file: "File",
  url: "URL",
  email: "Email",
  phone: "Phone",
  calculated: "Calculated",
  autonumber: "Auto-number",
  created_at: "Created",
  updated_at: "Updated",
  created_by: "Created by",
  updated_by: "Updated by",
};

/** Each field type's glyph (a lucide icon): a column header's leading icon, a type picker's. */
export const FIELD_TYPE_ICONS: Readonly<Record<FieldType, LucideIcon>> = {
  text: Text,
  long_text: TextQuote,
  number: Hash,
  currency: DollarSign,
  percent: Percent,
  date: Calendar,
  datetime: CalendarClock,
  single_choice: CircleDot,
  multi_choice: ListChecks,
  checkbox: SquareCheck,
  person: UserRound,
  link: Link2,
  file: Paperclip,
  url: Globe,
  email: AtSign,
  phone: Phone,
  calculated: Calculator,
  autonumber: Hash,
  created_at: Clock,
  updated_at: Clock,
  created_by: CircleUser,
  updated_by: UserPen,
};

/** Props accepted by `FieldTypeIcon`. */
export interface FieldTypeIconProps extends Omit<
  React.ComponentProps<LucideIcon>,
  "ref"
> {
  /** The field's type. */
  type: FieldType;
}

/**
 * `FieldTypeIcon` — a field type's glyph, decorative beside the field's name or the type's label
 * (`FIELD_TYPE_LABELS`). Sized by its slot (a header's icon, a picker row's).
 *
 * @example
 * <FieldTypeIcon type="currency" />
 */
export function FieldTypeIcon({ type, ...props }: FieldTypeIconProps) {
  const Icon = FIELD_TYPE_ICONS[type];
  return (
    <Icon aria-hidden data-slot="field-type-icon" data-type={type} {...props} />
  );
}

/** One option of a choice field. */
export interface FieldChoiceOption {
  /** Stable id — what the value stores. */
  id: string;
  label: string;
  /**
   * One of the ten tag hues (`HUE_COLORS` in `color-picker`).
   * @default "neutral"
   */
  hue?: ChipHue;
}

/** A person a person field holds (or a created/updated-by field shows). */
export interface FieldPerson {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
}

/** A record a link field points at, as the host resolved it for this reader. */
export interface FieldLinkTarget {
  id: string;
  label: string;
  /** The record kind (the host's `InlineChip` kinds name its icon and noun). */
  kind: string;
  /** Where it opens. @default undefined */
  href?: string | null;
  /**
   * `ok`, or a target the reader can't reach: `restricted` (exists, not theirs to open — shown
   * muted, never named by the host), `unavailable` (its module is off) or `deleted`.
   * @default "ok"
   */
  state?: "ok" | "restricted" | "unavailable" | "deleted";
}

/** A file a file field holds. */
export interface FieldFile {
  id: string;
  name: string;
  contentType?: string | null;
  /**
   * A small image of the file (an image's own thumbnail): a grid cell (`variant="cell"`) shows it
   * in place of the file's chip.
   * @default undefined
   */
  thumbnailUrl?: string | null;
  /**
   * Where the file opens (the host's file link, such as `/api/files/<id>`). A grid cell's chip and
   * thumbnail open it through the host's chip provider (`InlineChipResolver.onOpen`, a file
   * viewer), as a file link in a page does. Unset, the chip asks the provider's `href`.
   * @default undefined
   */
  href?: string | null;
}

/** A file link that is same-site (`/…`) or http(s); anything else (`javascript:`…) is none. */
function safeFileHref(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return safeHttp(value);
}

/**
 * An image file's thumbnail in a grid cell. With a link — the file's `href`, else the host
 * provider's `href` for a file, as the chip beside it resolves — it is a button that opens the
 * file as the chip would: the provider's `onOpen` (a file viewer) on a plain click, a new tab on
 * ⌘/Ctrl/Shift-click. With no link, a picture.
 */
function FieldFileThumbnail({ file, src }: { file: FieldFile; src: string }) {
  const resolver = useInlineChipResolver();
  const href = safeFileHref(
    file.href !== undefined ? file.href : resolver?.href?.("file", file.id),
  );
  const thumbnail = (
    <Thumbnail
      src={src}
      alt={file.name}
      size="sm"
      className="h-5 w-8 rounded-sm"
    />
  );
  if (!href)
    return (
      <span
        data-slot="field-cell-file-thumbnail"
        title={file.name}
        className="flex shrink-0"
      >
        {thumbnail}
      </span>
    );
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      data-slot="field-cell-file-thumbnail"
      aria-label={file.name}
      title={file.name}
      className="h-5 w-8 rounded-sm border-0"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
          window.open(href, "_blank", "noopener,noreferrer");
          return;
        }
        const target = {
          kind: "file",
          id: file.id,
          label: file.name,
          href,
          ...(file.contentType ? { contentType: file.contentType } : {}),
        };
        if (resolver?.onOpen && resolver.onOpen(target, event) !== false)
          return;
        window.location.assign(href);
      }}
    >
      {thumbnail}
    </Button>
  );
}

/** A field's configuration — what each type needs to show and edit its value. */
export interface FieldConfig {
  /** A choice field's options, in order. @default undefined */
  options?: readonly FieldChoiceOption[];
  /**
   * Lets a choice editor add the typed option ("Add “Sent”"); resolves with the created option.
   * @default undefined
   */
  onCreateOption?: (label: string) => Promise<FieldChoiceOption>;
  /** A currency field's ISO code. @default "USD" */
  currency?: string;
  /** Decimal places a number, currency or percent shows. @default the value's own */
  decimals?: number;
  /**
   * A text field's most characters (10000 when unset), and a long text's when set (no limit
   * otherwise). Counted as `String.length`, as a server counts it. A text field stops typing at
   * it; a long text — rich text, never cut while typing, pasting or composing — shows a `n/max`
   * count from 80% of it and, past it, `maxLengthMessage`, and refuses to commit.
   * @default 10000 for text, undefined for long text
   */
  maxLength?: number;
  /**
   * What a long text says while it is over `maxLength`, given how many characters are over — the
   * host's words.
   * @default (excess) => `Remove ${excess} characters`
   */
  maxLengthMessage?: (excess: number) => string;
  /** An auto-number's prefix ("SR-"). @default "" */
  prefix?: string;
  /** A person field holds several. @default false */
  multiple?: boolean;
  /** The people a person field offers (or `searchPeople`). @default undefined */
  people?: readonly FieldPerson[];
  /** Finds people for a person field. @default undefined */
  searchPeople?: PeoplePickerSearch;
  /** Finds records for a link field (recents first is the host's order). @default undefined */
  searchRecords?: AsyncSearchLoader<FieldLinkTarget>;
  /** A calculated field's inputs that are empty, shown on hover over "—". @default undefined */
  missingInputs?: readonly string[];
  /** Shown while an editor or input is empty. @default undefined */
  placeholder?: string;
  /**
   * A long-text field's `@` mentions: the menu's kinds and search, as `TextEdit` takes them.
   * @default undefined — no mention menu
   */
  mentions?: TextEditMentions;
  /** Where a mention in a long-text field links (`TextEdit`'s `mentionHref`). @default undefined */
  mentionHref?: (kind: MentionKind, id: string) => string | null;
  /** A person mention's photo in a long-text field (`TextEdit`'s `mentionImage`). @default undefined */
  mentionImage?: (id: string) => string | null | undefined;
}

/** The value of each type. */
export type FieldValue =
  | string
  | number
  | boolean
  | readonly string[]
  | FieldPerson
  | readonly FieldPerson[]
  | readonly FieldLinkTarget[]
  | readonly FieldFile[]
  | null
  | undefined;

/** The read-only types: computed or system-kept, never edited. */
export const READ_ONLY_FIELD_TYPES: ReadonlySet<FieldType> = new Set([
  "calculated",
  "autonumber",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
]);

/** The types whose value sits at the end of its line, so a column's figures line up. */
const END_ALIGNED_FIELD_TYPES: ReadonlySet<FieldType> = new Set([
  "number",
  "currency",
  "percent",
  "calculated",
]);

/** The most chips, avatars or thumbnails a cell shows before a count. */
const SHOWN = 3;

/** The most choice badges a cell shows before a count. */
const CHOICES_SHOWN = 2;

/**
 * A choice's hue on a `Badge` — Badge's documented custom-colour route, on the AA-gated tag tokens
 * (`-subtle` fill, `-text` ink): a filled pill with no outline. The neutral option is Badge's own
 * `secondary`. Static literals, so the Tailwind scanner sees every string.
 */
const CHOICE_HUE: Record<ChipHue, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  blue: "bg-tag-blue-subtle text-tag-blue-text",
  cyan: "bg-tag-cyan-subtle text-tag-cyan-text",
  green: "bg-tag-green-subtle text-tag-green-text",
  lime: "bg-tag-lime-subtle text-tag-lime-text",
  yellow: "bg-tag-yellow-subtle text-tag-yellow-text",
  orange: "bg-tag-orange-subtle text-tag-orange-text",
  red: "bg-tag-red-subtle text-tag-red-text",
  pink: "bg-tag-pink-subtle text-tag-pink-text",
  magenta: "bg-tag-magenta-subtle text-tag-magenta-text",
  purple: "bg-tag-purple-subtle text-tag-purple-text",
};

/** Props accepted by `FieldChoiceBadge`. */
export interface FieldChoiceBadgeProps extends Omit<
  React.ComponentProps<typeof Badge>,
  "variant"
> {
  /**
   * The option's hue (`FieldChoiceOption.hue`).
   * @default "neutral"
   */
  hue?: ChipHue;
}

/**
 * `FieldChoiceBadge` — one choice option's value, the way the system draws it everywhere: a
 * `Badge` filled in the option's hue (a cell, a phone card, a picker's list, a trigger). It
 * shrinks to its container: wrap the label in `<span className="min-w-0 truncate">` (or a
 * `TruncatedText`) so a long name ends in an ellipsis.
 *
 * @example
 * <FieldChoiceBadge hue="green"><span className="min-w-0 truncate">Sent</span></FieldChoiceBadge>
 */
export function FieldChoiceBadge({
  hue = "neutral",
  className,
  ...props
}: FieldChoiceBadgeProps) {
  return (
    <Badge
      variant="secondary"
      data-hue={hue}
      // The hue is the option's identity: a highlighted Select, Combobox or Command row recolours
      // its contents to the accent ink but skips `data-icon-tone`, so the chip keeps its own.
      data-icon-tone=""
      // Shrinks with its cell (`min-w-0`); `overflow-visible` lets a clipped name's 24px
      // disclosure target (`TruncatedText`) keep its whole box around the 20px pill.
      className={cn(
        "max-w-full min-w-0 shrink justify-start overflow-visible",
        CHOICE_HUE[hue],
        className,
      )}
      {...props}
    />
  );
}

/** A choice field's chosen options, in the value's order (an id with no option is skipped). */
function chosenOptions(
  value: FieldValue,
  config: FieldConfig,
): FieldChoiceOption[] {
  const ids =
    typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? (value as string[])
        : [];
  return ids
    .map((id) => config.options?.find((option) => option.id === id))
    .filter((option): option is FieldChoiceOption => option != null);
}

/** A choice option in a list or on a trigger: its badge, the name cut with an ellipsis. */
function choiceFace(option: FieldChoiceOption) {
  return (
    <FieldChoiceBadge hue={option.hue}>
      <span className="min-w-0 truncate">{option.label}</span>
    </FieldChoiceBadge>
  );
}

/**
 * Currencies whose grouping is their own, not the reader's: an amount in rupees groups in lakhs
 * and crores (₹5,88,000.00) wherever it is read. Any other currency formats in the reader's locale.
 */
const CURRENCY_LOCALE: Record<string, string> = { INR: "en-IN" };

/** The locale a currency formats in: its own grouping when it has one, else the reader's. */
function currencyLocale(currency: string): string | undefined {
  return CURRENCY_LOCALE[currency.toUpperCase()];
}

/** Number formatting per type, in the reader's locale (a currency with its own grouping, in that). */
function formatNumber(
  type: FieldType,
  value: number,
  config: FieldConfig,
  plain = false,
) {
  const digits =
    config.decimals == null
      ? {}
      : {
          minimumFractionDigits: config.decimals,
          maximumFractionDigits: config.decimals,
        };
  const currency = config.currency ?? "USD";
  const options: Intl.NumberFormatOptions =
    type === "currency"
      ? { style: "currency", currency, ...digits }
      : type === "percent"
        ? { style: "percent", maximumFractionDigits: 2, ...digits }
        : digits;
  // Plain: only a currency groups its digits, so a year reads 2026 and not 2,026.
  return new Intl.NumberFormat(
    type === "currency" ? currencyLocale(currency) : undefined,
    plain && type !== "currency" ? { ...options, useGrouping: false } : options,
  ).format(value);
}

/** A link as a grid cell shows it: no scheme, and no trailing slash on a bare host. */
function plainLink(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

/** A URL value as a link target, or `null` when it is not http(s). */
function safeHttp(value: string): string | null {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s().-]{5,}$/;

/** Whether a text value is valid for its type (url, email, phone; anything else is). */
export function isValidFieldText(type: FieldType, value: string): boolean {
  if (value === "") return true;
  if (type === "url") return safeHttp(value) != null;
  if (type === "email") return EMAIL.test(value);
  if (type === "phone") return PHONE.test(value);
  return true;
}

/** What a link target may show: its name when the reader can reach it, else only its state. */
function linkLabel(target: FieldLinkTarget): string {
  const state = target.state ?? "ok";
  return state === "ok"
    ? target.label
    : state === "restricted"
      ? "Restricted"
      : state === "unavailable"
        ? "Unavailable"
        : "Deleted";
}

function Overflow({
  count,
  labels,
  tabIndex,
}: {
  count: number;
  /** The hidden entries' names, shown on hover and keyboard focus and read by screen readers. */
  labels?: string[];
  tabIndex?: number;
}) {
  // A tap shows the names too: a touch screen has no hover, and a tooltip opens on nothing else.
  // In an editable grid cell the tap is the cell's (not a control of its own), so it opens the
  // editor, whose list shows every value — the fuller disclosure.
  const [open, setOpen] = React.useState(false);
  if (count <= 0) return null;
  const className = "shrink-0 text-xs text-muted-foreground tabular-nums";
  if (!labels || labels.length === 0)
    return (
      <span data-slot="field-cell-more" className={className}>
        +{count}
      </span>
    );
  const names = labels.join(", ");
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          <span
            data-slot="field-cell-more"
            tabIndex={tabIndex ?? 0}
            onClick={() => setOpen((shown) => !shown)}
            // A tab stop: at least a 24px-wide hit area, however short the count.
            className={cn(
              className,
              "inline-block min-h-6 min-w-6 text-center leading-6",
            )}
          />
        }
      >
        <span aria-hidden>+{count}</span>
        <span className="sr-only">
          {count} more: {names}
        </span>
      </TooltipTrigger>
      <TooltipContent>{names}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A value's mark: named on hover, on keyboard focus and to a screen reader. `tabIndex` is the
 * display's focus policy, as `Overflow`'s: a tab stop on its own, one the cell steps to in a grid.
 */
function ValueMark({
  mark,
  side,
  tabIndex,
  className,
}: {
  mark: FieldCellMark;
  side: "start" | "end";
  tabIndex?: number;
  className?: string;
}) {
  // A tap shows the name too, as `Overflow`'s does: a touch screen has no hover.
  const [open, setOpen] = React.useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          <span
            role="img"
            aria-label={mark.label}
            data-slot="field-cell-mark"
            data-side={side}
            tabIndex={tabIndex ?? 0}
            // The press is the mark's: it shows the name, it doesn't reach an edit button or a row
            // around the value.
            onClick={(event) => {
              event.stopPropagation();
              setOpen((shown) => !shown);
            }}
            // 12px to look at, a 24px target (A11Y-2). Its content takes the box, whatever size
            // it was drawn at.
            className={cn(
              "relative flex size-3 shrink-0 items-center justify-center text-muted-foreground before:absolute before:-inset-1.5 before:content-[''] [&>*]:size-3",
              className,
            )}
          />
        }
      >
        {mark.content}
      </TooltipTrigger>
      <TooltipContent>{mark.label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A link chip in a cell: one line, cut with an ellipsis, never broken inside a word. A chip wraps
 * like running text in prose (its first word may break in a narrow column), and a host's prose
 * (`overflow-wrap: break-word`) would split its letters, so every part of it stays unbroken here.
 */
const LINK_CHIP_FIT = "min-w-0 truncate wrap-normal [&_*]:whitespace-nowrap";

/**
 * A link chip's full name on hover and on keyboard focus. The chip itself is the tab stop when
 * it rendered as one (a link, a button, a person's card — whatever its resolved behaviour);
 * otherwise the wrapper is, under the ambient focus policy.
 */
function LinkNameDisclosure({
  name,
  tabIndex,
  children,
}: {
  name: string;
  tabIndex: number | undefined;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [chipFocusable, setChipFocusable] = React.useState(false);
  // The host's chip provider decides what the chip renders: reading it re-renders this wrapper
  // with the chip, so the check below runs again whenever the provider changes.
  const resolver = useInlineChipResolver();
  React.useLayoutEffect(() => {
    setChipFocusable(
      ref.current?.querySelector("a[href], [tabindex]:not([tabindex='-1'])") !=
        null,
    );
  }, [resolver, children]);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            ref={ref}
            tabIndex={chipFocusable ? undefined : (tabIndex ?? 0)}
            className={LINK_CHIP_FIT}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

/** A small adornment on a displayed value: who filled it, where it came from. */
export interface FieldCellMark {
  /** What it draws (an avatar, an icon), in a 12px box. */
  content: React.ReactNode;
  /** Its accessible name ("Filled by Asha Rao"), also shown on hover and on keyboard focus. */
  label: string;
  /**
   * Which end of the value it sits at.
   * @default "end", or "start" on a value that sits at the end of its line, so the figures of a
   * partly marked column still line up
   */
  side?: "start" | "end";
}

/** Props accepted by `FieldCellDisplay`. */
export interface FieldCellDisplayProps {
  /** The field's type. */
  type: FieldType;
  /** The value, in its type's shape. */
  value: FieldValue;
  /**
   * The field's configuration (options, currency, prefix…).
   * @default {}
   */
  config?: FieldConfig;
  /**
   * `filling` — a converted copy's field still being filled (a shimmer); `recalculating` — a
   * calculated field being recomputed.
   * @default "ready"
   */
  state?: "ready" | "filling" | "recalculating";
  /**
   * A checkbox toggles where it is shown, with no edit mode: called with the next value. Without
   * it the checkbox is read-only.
   * @default undefined
   */
  onToggle?: (next: boolean) => void;
  /**
   * The field's name: a checkbox's accessible name ("Done") where no column header names it (a
   * property row). Without it the checkbox reads its state.
   * @default undefined
   */
  label?: string;
  /**
   * Where the value sits on its line. By default a number, currency, percent or calculated value
   * sits at the end (a grid column's figures line up) and every other type at the start; `start`
   * puts a number at the start too, where it reads as a property's value rather than a column's.
   * @default undefined — by type
   */
  align?: "start" | "end";
  /**
   * `cell` — the value as a grid cell shows it: one clipped line that never grows its cell. A
   * number or percent is plain (no digit grouping; only a currency groups), a link shows without
   * its scheme and without a trailing slash on a bare host, a date or date-time is clipped on one
   * line instead of ending in an ellipsis, a person is always their avatar and whole name (every
   * person, not avatars and "+N"; none shrinks, the line clips at the cell's edge), and every file shows as its chip, or an image's thumbnail.
   * @default "default"
   */
  variant?: "default" | "cell";
  /**
   * A 12px mark at the start or end of the value, with its own accessible name. It adorns a value:
   * an empty field (a calculated one with no result, a checkbox never set), and one `filling` or
   * `recalculating`, shows none.
   * @default undefined
   */
  mark?: FieldCellMark;
  /** Extra classes for the root. @default undefined */
  className?: string;
}

/**
 * `FieldCellDisplay` — one field's value, on one line, the way every surface shows it: text that
 * truncates (the full value on hover and keyboard focus) and a long text's first line as typed (no
 * Markdown escapes, mentions as their names), end-aligned tabular numbers in the
 * reader's locale, a calendar day that never shifts with the zone, coloured choice tags with "+N",
 * a checkbox, people as avatars and names, links as `InlineChip`s in their four states, files as
 * kind tiles, and links out for URLs, emails and phones. A `mark` adorns any of them.
 *
 * @example
 * <FieldCellDisplay type="currency" value={1234.5} config={{ currency: "EUR" }} />
 *
 * @example
 * <FieldCellDisplay
 *   type="number"
 *   value={184}
 *   mark={{ label: "Filled by Asha Rao", content: <PersonAvatar person={asha} size="2xs" /> }}
 * />
 */
export function FieldCellDisplay({
  type,
  value,
  config = {},
  state = "ready",
  onToggle,
  label,
  align,
  variant = "default",
  mark,
  className,
}: FieldCellDisplayProps) {
  const timeZone = useTimeZone();
  const dateFormat = useDateFormat();
  const cell = variant === "cell";
  // Inside a grid the cell is the tab stop (`TruncationFocusProvider focusable={false}`); a
  // standalone display's checkbox and links are reachable themselves.
  const tabIndex = useTruncationFocusable() ? undefined : -1;
  const endAligned = align
    ? align === "end"
    : END_ALIGNED_FIELD_TYPES.has(type);
  const markSide = mark?.side ?? (endAligned ? "start" : "end");
  const root = (
    children: React.ReactNode,
    extra?: string,
    hasValue: boolean = true,
  ) => {
    const shownMark =
      mark && hasValue ? (
        <ValueMark mark={mark} side={markSide} tabIndex={tabIndex} />
      ) : null;
    return (
      <span
        data-slot="field-cell-display"
        data-type={type}
        data-variant={variant}
        className={cn(
          "flex min-w-0 items-center gap-1",
          // In a cell, every value lays out on the 20px text line: its 24px parts (a clipped
          // name's disclosure target, a chip's, an avatar, a link) keep their size and overflow
          // into the cell's padding. A 24px box made the cell 36px, which with the row's 1px rule
          // grew a `short` row past its 36px — so a row's height changed as such a column
          // scrolled in and out of view. Every row of a fixed-height grid now matches.
          variant === "cell" && "h-5",
          extra,
          align === "start" && "justify-start",
          align === "end" && "justify-end",
          className,
        )}
      >
        {markSide === "start" ? shownMark : null}
        {children}
        {markSide === "end" ? shownMark : null}
      </span>
    );
  };
  if (state === "filling")
    return root(
      <Skeleton data-slot="field-cell-filling" className="h-4 w-3/4" />,
      undefined,
      false,
    );
  if (state === "recalculating")
    return root(
      <span className="text-xs text-muted-foreground">Recalculating…</span>,
      undefined,
      false,
    );
  const empty = root(null, undefined, false);

  switch (type) {
    case "text":
    case "long_text": {
      if (typeof value !== "string" || value === "") return empty;
      // A long text is Markdown: its first line shows as it was typed, mentions as their names.
      const firstLine =
        type === "long_text" ? typedFirstLine(value) : value.split("\n")[0]!;
      return root(<TruncatedText>{firstLine}</TruncatedText>);
    }
    case "number":
    case "currency":
    case "percent":
    case "calculated": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        if (type !== "calculated") return empty;
        const missing = config.missingInputs ?? [];
        return root(
          missing.length > 0 ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span tabIndex={-1} className="text-muted-foreground" />
                }
              >
                —
              </TooltipTrigger>
              <TooltipContent>Missing: {missing.join(", ")}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
          "justify-end",
          false,
        );
      }
      return root(
        <TruncatedText className="tabular-nums">
          {formatNumber(type, value, config, cell)}
        </TruncatedText>,
        "justify-end",
      );
    }
    case "autonumber":
      return typeof value === "number"
        ? root(
            <TruncatedText className="font-mono text-sm tabular-nums">
              {config.prefix ?? ""}
              {value}
            </TruncatedText>,
          )
        : empty;
    case "date":
    case "datetime":
    case "created_at":
    case "updated_at": {
      if (typeof value !== "string" || !value) return empty;
      const text =
        type === "date"
          ? formatCalendarDate(value, { dateFormat })
          : formatDateTime(value, { timeZone, dateFormat });
      return root(
        cell ? (
          <span className="min-w-0 overflow-hidden text-clip whitespace-nowrap tabular-nums">
            {text}
          </span>
        ) : (
          <TruncatedText className="tabular-nums">{text}</TruncatedText>
        ),
      );
    }
    case "single_choice":
    case "multi_choice": {
      const chosen = chosenOptions(value, config);
      if (chosen.length === 0) return empty;
      return root(
        <>
          {chosen.slice(0, CHOICES_SHOWN).map((option) => (
            <FieldChoiceBadge key={option.id} hue={option.hue}>
              {/* A clipped name is revealed on hover and on keyboard focus. */}
              {/* A clipped name becomes a tab stop: never under the 24px target floor. */}
              <TruncatedText className="min-w-6">{option.label}</TruncatedText>
            </FieldChoiceBadge>
          ))}
          <Overflow
            count={chosen.length - CHOICES_SHOWN}
            labels={chosen.slice(CHOICES_SHOWN).map((option) => option.label)}
            tabIndex={tabIndex}
          />
        </>,
        // A clipped name's 24px disclosure target (taller than the 20px badge) keeps its whole box
        // inside the row, so a clipping wrapper never cuts it. In a cell it overflows into the
        // cell's padding instead (`h-5` on the root), so it never grows the row.
        cell ? undefined : "min-h-6",
      );
    }
    case "checkbox":
      return root(
        <Checkbox
          checked={value === true}
          readOnly={!onToggle}
          tabIndex={onToggle ? tabIndex : -1}
          aria-label={label ?? (value === true ? "Checked" : "Unchecked")}
          onCheckedChange={(next) => onToggle?.(next === true)}
        />,
        undefined,
        value != null,
      );
    case "person":
    case "created_by":
    case "updated_by": {
      const people = (
        Array.isArray(value) ? value : value ? [value] : []
      ) as FieldPerson[];
      if (people.length === 0) return empty;
      if (cell)
        return root(
          // Every person keeps their whole avatar and name, one after another, and the line clips
          // at the cell's edge like the file cell: nobody shrinks as the column narrows.
          // `overflow-clip`, not `hidden`: a clipped box has no scroll position.
          <span className="flex min-w-0 items-center gap-3 overflow-clip whitespace-nowrap">
            {people.map((person) => (
              <span
                key={person.id}
                data-slot="field-cell-person"
                title={person.name}
                className="flex shrink-0 items-center gap-1.5"
              >
                {/* `xs` (20px): the cell's 20px line, so an editable cell's clipping wrapper never
                    cuts the circle. */}
                <PersonAvatar person={person} size="xs" className="shrink-0" />
                <span>{person.name}</span>
              </span>
            ))}
          </span>,
        );
      if (people.length === 1)
        return root(
          <>
            <PersonAvatar person={people[0]!} size="sm" />
            <TruncatedText>{people[0]!.name}</TruncatedText>
          </>,
        );
      return root(
        <>
          {people.slice(0, SHOWN).map((person) => (
            <PersonAvatar key={person.id} person={person} size="sm" />
          ))}
          <span className="sr-only">
            {people.map((person) => person.name).join(", ")}
          </span>
          <Overflow count={people.length - SHOWN} />
        </>,
      );
    }
    case "link": {
      const targets = (Array.isArray(value) ? value : []) as FieldLinkTarget[];
      if (targets.length === 0) return empty;
      return root(
        <>
          {targets.slice(0, SHOWN).map((target) => {
            // A target the reader can't reach carries no name: not as text, a title or a label.
            const reachable = (target.state ?? "ok") === "ok";
            const label = linkLabel(target);
            const chip = (
              <InlineChip
                kind={target.kind}
                label={label}
                targetId={reachable ? target.id : `restricted:${target.id}`}
                href={reachable ? target.href : null}
                struck={target.state === "deleted"}
              />
            );
            if (!reachable)
              return (
                <span key={target.id} className={LINK_CHIP_FIT}>
                  {chip}
                </span>
              );
            return (
              <LinkNameDisclosure
                key={target.id}
                name={target.label}
                tabIndex={tabIndex}
              >
                {chip}
              </LinkNameDisclosure>
            );
          })}
          <Overflow
            count={targets.length - SHOWN}
            labels={targets.slice(SHOWN).map(linkLabel)}
            tabIndex={tabIndex}
          />
        </>,
      );
    }
    case "file": {
      const files = (Array.isArray(value) ? value : []) as FieldFile[];
      if (files.length === 0) return empty;
      // In a grid cell every file shows, as a Page shows it — its chip, or an image's thumbnail —
      // on one line that clips at the cell's edge, like the person cell (no "+N", no scroll bar).
      // `overflow-clip`, not `hidden`: a clipped box has no scroll position, so focusing a chip
      // past the edge (the grid's arrow keys step through a cell's chips) never slides the line.
      if (cell)
        return root(
          <span className="flex min-w-0 items-center gap-1.5 overflow-clip whitespace-nowrap">
            {files.map((file) =>
              file.thumbnailUrl ? (
                <FieldFileThumbnail
                  key={file.id}
                  file={file}
                  src={file.thumbnailUrl}
                />
              ) : (
                <span
                  key={file.id}
                  data-slot="field-cell-file-chip"
                  title={file.name}
                  className="shrink-0 [&_*]:whitespace-nowrap"
                >
                  <InlineChip
                    kind="file"
                    label={file.name}
                    contentType={file.contentType}
                    targetId={file.id}
                    href={file.href}
                  />
                </span>
              ),
            )}
          </span>,
        );
      return root(
        <>
          {files.slice(0, SHOWN).map((file) => (
            <span
              key={file.id}
              title={file.name}
              className="block size-6 shrink-0 overflow-hidden rounded-sm"
            >
              <FileKindTile
                name={file.name}
                contentType={file.contentType}
                label={null}
              />
            </span>
          ))}
          <span className="sr-only">
            {files.map((file) => file.name).join(", ")}
          </span>
          <Overflow count={files.length - SHOWN} />
        </>,
      );
    }
    case "url":
    case "email":
    case "phone": {
      if (typeof value !== "string" || value === "") return empty;
      const href =
        type === "url"
          ? safeHttp(value)
          : type === "email"
            ? EMAIL.test(value)
              ? `mailto:${value}`
              : null
            : PHONE.test(value)
              ? `tel:${value.replace(/[^\d+]/g, "")}`
              : null;
      return root(
        href ? (
          <a
            href={href}
            target={type === "url" ? "_blank" : undefined}
            rel={type === "url" ? "noopener noreferrer" : undefined}
            tabIndex={tabIndex}
            className="min-h-6 min-w-0 truncate leading-6 text-primary underline-offset-2 hover:underline"
          >
            {cell && type === "url" ? plainLink(value) : value}
          </a>
        ) : (
          <TruncatedText>
            {cell && type === "url" ? plainLink(value) : value}
          </TruncatedText>
        ),
      );
    }
    default:
      return empty;
  }
}

/** A long text over `config.maxLength`: the message it shows (and refuses to commit), else `null`. */
function longTextOver(text: string, config: FieldConfig): string | null {
  const max = config.maxLength;
  if (max === undefined || text.length <= max) return null;
  const excess = text.length - max;
  return (
    config.maxLengthMessage?.(excess) ||
    `Remove ${excess} ${excess === 1 ? "character" : "characters"}`
  );
}

/** Under a long text's editor: past the limit, its message; near it, the `n/max` count. */
function LongTextLimit({
  text,
  config,
  id,
}: {
  text: string;
  config: FieldConfig;
  id?: string;
}) {
  if (config.maxLength === undefined) return null;
  const over = longTextOver(text, config);
  return (
    <div
      id={id}
      data-slot="field-long-text-limit"
      className="flex min-w-0 items-start gap-2 pt-1"
    >
      {over ? (
        <p
          role="alert"
          className="min-w-0 flex-1 text-xs text-destructive-text"
        >
          {over}
        </p>
      ) : null}
      <FieldCounter value={text} maxLength={config.maxLength} />
    </div>
  );
}

/** Props accepted by `FieldInput`. */
export interface FieldInputProps {
  /** The field's type. */
  type: FieldType;
  /** The value, in its type's shape. */
  value: FieldValue;
  /**
   * The field's configuration (options, people, record search…).
   * @default {}
   */
  config?: FieldConfig;
  /** Called with each new typed value. */
  onChange: (value: FieldValue) => void;
  /** Mark the control invalid (the host's validation). @default false */
  invalid?: boolean;
  /** The control's accessible name (its field's name). */
  "aria-label": string;
  /** The control's id (a label's `htmlFor`). @default undefined */
  id?: string;
  /** Points at the host's error text. @default undefined */
  "aria-describedby"?: string;
  /** Disable the control. @default false */
  disabled?: boolean;
  /** Focus the control when it mounts (an opened cell editor). @default false */
  autoFocus?: boolean;
  /**
   * A picker (choice, person, link) opens on mount searching for this text — the character that
   * opened a cell editor. Other types ignore it.
   * @default undefined
   */
  defaultSearch?: string;
  /** Extra classes for the control. @default undefined */
  className?: string;
  /**
   * `cell` — the control sits inside a surface that already is its box (a floating cell editor):
   * a date and a date-time's date take the picker's inline (`ghost`) tier instead of a bordered
   * field. Every other type is as it is.
   * @default "default"
   */
  variant?: "default" | "cell";
}

/** A record search for a link field: async, paged, the host's order (recents first). */
function RecordLinkEditor({
  value,
  config,
  onChange,
  defaultSearch,
  flat,
  ...a11y
}: {
  value: readonly FieldLinkTarget[];
  config: FieldConfig;
  onChange: (value: FieldLinkTarget[]) => void;
  defaultSearch?: string;
  /** The editor sits in a grid cell, which is its box: the trigger sits flat in it. */
  flat?: boolean;
  "aria-label": string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  disabled?: boolean;
}) {
  const loader = React.useCallback<AsyncSearchLoader<FieldLinkTarget>>(
    (query, context) =>
      config.searchRecords
        ? config.searchRecords(query, context)
        : Promise.resolve({ items: [] }),
    [config],
  );
  const search = useAsyncSearch(loader);
  return (
    <SearchableSelect<FieldLinkTarget, true>
      multiple
      remote
      defaultSearch={defaultSearch}
      items={search.items}
      onSearchChange={search.onSearchChange}
      loading={search.loading}
      error={search.error}
      loadMore={search.loadMore}
      value={[...value]}
      onValueChange={(next) => onChange(next)}
      itemToKey={(target) => target.id}
      // The same rule as the display: an unreachable target never shows its name here either.
      itemToStringLabel={linkLabel}
      renderItem={(target) => (
        <span className="min-w-0 truncate">{linkLabel(target)}</span>
      )}
      placeholder={config.placeholder ?? "Link a record…"}
      searchLabel="Search records"
      size="sm"
      flat={flat}
      {...a11y}
    />
  );
}

/** A date and a time of day, in the reader's zone; the value is an ISO instant. */
function DateTimeEditor({
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
  id,
  invalid,
  describedBy,
  inline,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  "aria-label": string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  /**
   * The editor sits in a surface that is its box: the trigger takes its inline (ghost) tier and
   * sits flat in it, with no open tint.
   */
  inline?: boolean;
}) {
  const date = value ? new Date(value) : undefined;
  return (
    <span data-slot="field-datetime-editor" className="flex w-full min-w-0">
      <DateTimePicker
        aria-label={ariaLabel}
        id={id}
        size="sm"
        variant={inline ? "ghost" : "outline"}
        flat={inline}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        value={date && !Number.isNaN(date.getTime()) ? date : undefined}
        onValueChange={(next) => onChange(next ? next.toISOString() : null)}
      />
    </span>
  );
}

/**
 * `FieldInput` — a field's editor as a plain form control, for a row panel, a record's Fields
 * group or a form: text and long text (the `TextEdit` editor), numbers through `NumberField`
 * (locale-aware, so "1,5" is 1.5 where the comma is the decimal), dates and date-times, choices on
 * `SearchableSelect` (with Add option when `onCreateOption`), a checkbox, people on `PeoplePicker`,
 * records on an async search, and URLs, emails and phones checked as typed. Read-only types render
 * their display.
 *
 * @example
 * <FieldInput type="number" aria-label="Qty" value={qty} onChange={setQty} />
 */
export function FieldInput({
  type,
  value,
  config = {},
  onChange,
  invalid = false,
  "aria-label": ariaLabel,
  id,
  "aria-describedby": describedBy,
  disabled = false,
  autoFocus = false,
  defaultSearch,
  className,
  variant = "default",
}: FieldInputProps) {
  const limitId = React.useId();
  const a11y = {
    id,
    "aria-label": ariaLabel,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    disabled,
  };
  if (READ_ONLY_FIELD_TYPES.has(type))
    return (
      // A computed or system-kept value: read, never edited, and said so.
      <span
        role="textbox"
        aria-readonly="true"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        id={id}
        tabIndex={0}
        data-slot="field-input-read-only"
        className={cn("flex min-h-8 min-w-0 items-center", className)}
      >
        <FieldCellDisplay type={type} value={value} config={config} />
      </span>
    );

  switch (type) {
    case "text":
    case "url":
    case "email":
    case "phone": {
      const text = typeof value === "string" ? value : "";
      const bad = !isValidFieldText(type, text);
      return (
        <Input
          {...a11y}
          aria-invalid={invalid || bad || undefined}
          type={
            type === "email"
              ? "email"
              : type === "url"
                ? "url"
                : type === "phone"
                  ? "tel"
                  : "text"
          }
          inputMode={type === "phone" ? "tel" : undefined}
          maxLength={type === "text" ? (config.maxLength ?? 10_000) : undefined}
          placeholder={config.placeholder}
          autoFocus={autoFocus}
          value={text}
          className={className}
          onChange={(event) => onChange(event.target.value || null)}
        />
      );
    }
    case "long_text": {
      const longText = typeof value === "string" ? value : "";
      const over = longTextOver(longText, config) !== null;
      const editor = (
        <TextEdit
          variant="boxed"
          format="markdown"
          aria-label={ariaLabel}
          id={id}
          aria-invalid={invalid || over || undefined}
          aria-describedby={
            [describedBy, config.maxLength !== undefined ? limitId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          disabled={disabled}
          placeholder={config.placeholder}
          value={longText}
          onValueChange={(next) => onChange(next || null)}
          mentions={config.mentions}
          mentionHref={config.mentionHref}
          mentionImage={config.mentionImage}
          minHeight="6rem"
        />
      );
      if (config.maxLength === undefined) return editor;
      return (
        <div className="flex min-w-0 flex-col">
          {editor}
          <LongTextLimit id={limitId} text={longText} config={config} />
        </div>
      );
    }
    case "number":
    case "currency":
    case "percent":
      return (
        <NumberField
          {...a11y}
          className={className}
          locale={
            type === "currency"
              ? currencyLocale(config.currency ?? "USD")
              : undefined
          }
          format={
            type === "currency"
              ? { style: "currency", currency: config.currency ?? "USD" }
              : type === "percent"
                ? { style: "percent" }
                : undefined
          }
          value={typeof value === "number" ? value : null}
          onValueChange={(next) => onChange(next ?? null)}
          inputRef={(node) => {
            if (autoFocus && node && document.activeElement !== node)
              node.focus();
          }}
        />
      );
    case "date":
      return (
        <DatePicker
          {...a11y}
          size="sm"
          variant={variant === "cell" ? "ghost" : "outline"}
          flat={variant === "cell"}
          clearable
          className={className}
          value={
            typeof value === "string" ? parseCalendarDay(value) : undefined
          }
          onValueChange={(day) => onChange(day ? toCalendarDay(day) : null)}
        />
      );
    case "datetime":
      return (
        <DateTimeEditor
          aria-label={ariaLabel}
          id={id}
          invalid={invalid}
          describedBy={describedBy}
          disabled={disabled}
          inline={variant === "cell"}
          value={typeof value === "string" ? value : null}
          onChange={onChange}
        />
      );
    case "single_choice":
    case "multi_choice": {
      const options = [...(config.options ?? [])];
      const common = {
        items: options,
        itemToKey: (option: FieldChoiceOption) => option.id,
        itemToStringLabel: (option: FieldChoiceOption) => option.label,
        renderItem: choiceFace,
        onCreateOption: config.onCreateOption,
        placeholder: config.placeholder ?? "Choose…",
        searchLabel: "Search options",
        defaultSearch,
        size: "sm" as const,
        ...a11y,
      };
      if (type === "multi_choice") {
        const ids = Array.isArray(value) ? (value as string[]) : [];
        return (
          <SearchableSelect<FieldChoiceOption, true>
            {...common}
            multiple
            value={options.filter((option) => ids.includes(option.id))}
            onValueChange={(next) => onChange(next.map((option) => option.id))}
          />
        );
      }
      return (
        <SearchableSelect<FieldChoiceOption>
          {...common}
          // Cleared like a date: a control on the field while an option is chosen.
          clearable
          value={options.find((option) => option.id === value) ?? null}
          onValueChange={(next) => onChange(next?.id ?? null)}
        />
      );
    }
    case "checkbox":
      return (
        <Checkbox
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          checked={value === true}
          onCheckedChange={(next) => onChange(next === true)}
        />
      );
    case "person": {
      const toOption = (person: FieldPerson): PeoplePickerOption => ({
        ...person,
      });
      const common = {
        options: config.people?.map(toOption),
        search: config.searchPeople,
        defaultSearch,
        size: "sm" as const,
        ...a11y,
      };
      if (config.multiple) {
        const people = (Array.isArray(value) ? value : []) as FieldPerson[];
        return (
          <PeoplePicker
            {...common}
            multiple
            value={people.map(toOption)}
            onValueChange={(next) =>
              onChange(
                next.map(({ id, name, email, image }) => ({
                  id,
                  name,
                  email,
                  image,
                })),
              )
            }
          />
        );
      }
      const person =
        value && !Array.isArray(value) && typeof value === "object"
          ? (value as FieldPerson)
          : null;
      return (
        <PeoplePicker
          {...common}
          value={person ? toOption(person) : null}
          onValueChange={(next) =>
            onChange(
              next
                ? {
                    id: next.id,
                    name: next.name,
                    email: next.email,
                    image: next.image,
                  }
                : null,
            )
          }
        />
      );
    }
    case "link":
      return (
        <RecordLinkEditor
          {...a11y}
          config={config}
          defaultSearch={defaultSearch}
          flat={variant === "cell"}
          value={(Array.isArray(value) ? value : []) as FieldLinkTarget[]}
          onChange={onChange}
        />
      );
    case "file":
      // Files are added and removed where uploads live (the row panel's upload area).
      return <FieldCellDisplay type={type} value={value} config={config} />;
    default:
      return null;
  }
}

/**
 * A choice cell's editor (`FieldCellEditor`): the cell keeps showing its badges — no field, no
 * chevron — and the option list opens under it at once, the search field first, each option drawn
 * as its badge with a check on the chosen ones. A single choice commits on the pick; a multiple
 * choice toggles with the list open and commits when the edit ends. "Add “…”" ends the list when
 * `onCreateOption` is given.
 */
function ChoiceCellEditor({
  multiple,
  value,
  config,
  label,
  defaultSearch,
  creating,
  onChange,
  onClose,
}: {
  multiple: boolean;
  value: FieldValue;
  config: FieldConfig;
  label: string;
  defaultSearch?: string;
  /** The option `onCreateOption` is still making, if any: the edit waits for it. */
  creating: React.RefObject<Promise<unknown> | null>;
  onChange: (value: FieldValue) => void;
  /** The list closed without a key or a pick ending the edit (a click outside, the cell again). */
  onClose: () => void;
}) {
  // The list opens with the editor.
  const [open, setOpen] = React.useState(true);
  // ...and its search field takes focus as soon as it is there, so the first keys search and
  // choose (the list mounts a frame or more after the editor; keys before that would be lost).
  const trigger = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    let frame = 0;
    let tries = 0;
    const focusSearch = () => {
      const popup = document.getElementById(
        trigger.current?.getAttribute("aria-controls") ?? "",
      );
      const search = popup?.querySelector<HTMLInputElement>(
        'input:not([type="hidden"])',
      );
      if (search) {
        if (!popup!.contains(document.activeElement)) search.focus();
      } else if (++tries < 30) frame = requestAnimationFrame(focusSearch);
    };
    focusSearch();
    return () => cancelAnimationFrame(frame);
  }, []);
  // Options made here stay listed (and chosen) until the host's `config.options` carries them.
  const [made, setMade] = React.useState<FieldChoiceOption[]>([]);
  const listed = config.options ?? [];
  const options = [
    ...listed,
    ...made.filter((option) => !listed.some((known) => known.id === option.id)),
  ];
  const chosen = chosenOptions(value, { options });
  const onCreateOption = config.onCreateOption
    ? (text: string) => {
        const pending = config.onCreateOption!(text).then((option) => {
          setMade((list) => [...list, option]);
          return option;
        });
        creating.current = pending;
        const settle = () => {
          if (creating.current === pending) creating.current = null;
        };
        pending.then(settle, settle);
        return pending;
      }
    : undefined;
  const common = {
    items: options,
    itemToKey: (option: FieldChoiceOption) => option.id,
    itemToStringLabel: (option: FieldChoiceOption) => option.label,
    renderItem: choiceFace,
    onCreateOption,
    searchLabel: "Search options",
    defaultSearch,
    "aria-label": label,
    // A narrow column still gets a list its option names fit in.
    contentClassName: "min-w-56",
    ref: trigger,
    open,
    onOpenChange: (next: boolean) => {
      setOpen(next);
      if (!next) onClose();
    },
    // The cell itself is the trigger: its badges as they are, no field chrome around them, in
    // the resting cell's box (`EditableCell`'s padding), so opening the editor moves nothing.
    renderTrigger: () => (
      <Button
        variant="ghost"
        data-slot="field-cell-choice-trigger"
        // No wash, no press nudge: the cell is what is being edited, not a button on it.
        className="h-auto min-h-9 w-full min-w-0 shrink justify-start gap-1 px-2.5 py-1.5 text-start font-normal hover:not-focus-visible:bg-none active:not-aria-[haspopup]:translate-y-0 aria-expanded:bg-transparent"
      >
        {chosen.slice(0, CHOICES_SHOWN).map((option) => (
          <FieldChoiceBadge key={option.id} hue={option.hue}>
            <span className="min-w-0 truncate">{option.label}</span>
          </FieldChoiceBadge>
        ))}
        {chosen.length > CHOICES_SHOWN ? (
          // The display's "+N" box (`Overflow`), so the row keeps its height.
          <span className="inline-block min-h-6 min-w-6 shrink-0 text-center text-xs leading-6 text-muted-foreground tabular-nums">
            +{chosen.length - CHOICES_SHOWN}
          </span>
        ) : null}
      </Button>
    ),
  };
  if (multiple)
    return (
      <SearchableSelect<FieldChoiceOption, true>
        {...common}
        multiple
        value={chosen}
        onValueChange={(next) => onChange(next.map((option) => option.id))}
      />
    );
  return (
    <SearchableSelect<FieldChoiceOption>
      {...common}
      // A single choice is cleared from its own list: the cell is the trigger, so there is no
      // clear control to put on it.
      clearOption
      value={chosen[0] ?? null}
      onValueChange={(next) => onChange(next?.id ?? null)}
    />
  );
}

/** Whether two choice values hold the same ids, in any order. */
function sameChoices(a: FieldValue, b: FieldValue) {
  const ids = (v: FieldValue) =>
    (typeof v === "string" ? [v] : Array.isArray(v) ? (v as string[]) : [])
      .slice()
      .sort()
      .join("\u0000");
  return ids(a) === ids(b);
}

/**
 * A person cell's editor (`FieldCellEditor variant="cell"`): the people chosen as removable chips
 * over the `PeoplePicker` list, which leaves them out — one place to see who is chosen, one list
 * of who is left. A multiple field toggles with the editor open and commits when focus leaves it;
 * a single field's pick replaces the chip and commits.
 */
function PersonCellEditor({
  multiple,
  value,
  config,
  label,
  defaultSearch,
  onChange,
  onClose,
}: {
  multiple: boolean;
  value: FieldValue;
  config: FieldConfig;
  label: string;
  defaultSearch?: string;
  onChange: (value: FieldValue) => void;
  /** Focus left the editor. */
  onClose: () => void;
}) {
  const initial = Array.isArray(value)
    ? (value as FieldPerson[])
    : value && typeof value === "object"
      ? [value as FieldPerson]
      : [];
  const [chosen, setChosen] = React.useState<FieldPerson[]>(initial);
  const host = React.useRef<HTMLSpanElement>(null);
  const search = () =>
    host.current?.querySelector<HTMLInputElement>("input") ?? null;
  React.useEffect(() => {
    const field = search();
    field?.focus();
    field?.setSelectionRange(field.value.length, field.value.length);
  }, []);
  const set = (next: FieldPerson[]) => {
    setChosen(next);
    onChange(multiple ? next : (next[0] ?? null));
  };
  return (
    <span
      ref={host}
      data-slot="field-person-editor"
      tabIndex={-1}
      className="flex w-full min-w-0 flex-col outline-hidden"
      onBlur={(event) => {
        const scope = event.currentTarget;
        if (scope.contains(event.relatedTarget as Node | null)) return;
        // After the event that moved focus: a chip's remove button that just unmounted, or a press
        // inside the list, leaves it in the editor.
        setTimeout(() => {
          if (!scope.contains(document.activeElement)) onClose();
        }, 0);
      }}
    >
      {chosen.length > 0 ? (
        <span
          role="list"
          aria-label={`${label}, chosen`}
          className="flex flex-wrap gap-1 border-b p-1.5"
        >
          {chosen.map((person) => (
            <Chip
              key={person.id}
              role="listitem"
              removeLabel={`Remove ${personDisplayName(person)}`}
              onRemove={() => {
                // Focus stays in the editor as the chip goes.
                search()?.focus();
                set(chosen.filter((other) => other.id !== person.id));
              }}
            >
              <PersonAvatar person={person} size="sm" />
              <span className="min-w-0 truncate">
                {personDisplayName(person)}
              </span>
            </Chip>
          ))}
        </span>
      ) : null}
      <PeoplePickerContent
        search={config.searchPeople}
        options={config.people?.map((person) => ({ ...person }))}
        exclude={chosen.map((person) => person.id)}
        defaultSearch={defaultSearch}
        onSelect={({ id, name, email, image }) => {
          const person = { id, name, email, image };
          set(multiple ? [...chosen, person] : [person]);
        }}
      />
    </span>
  );
}

/** Whether two person values name the same people, in any order. */
function samePeople(a: FieldValue, b: FieldValue) {
  const ids = (v: FieldValue) =>
    (Array.isArray(v) ? (v as FieldPerson[]) : v ? [v as FieldPerson] : [])
      .map((person) => person.id)
      .sort()
      .join("\u0000");
  return ids(a) === ids(b);
}

/** Props accepted by `FieldCellEditor`. */
export interface FieldCellEditorProps {
  /** The field's type. */
  type: FieldType;
  /** The value the cell holds. */
  value: FieldValue;
  /**
   * The field's configuration (options, people, record search…).
   * @default {}
   */
  config?: FieldConfig;
  /**
   * Commit a typed value and close. `move` is where the key that committed sends the grid's focus
   * (<kbd>Enter</kbd> `down`, <kbd>Shift</kbd>+<kbd>Enter</kbd> `up`, <kbd>Tab</kbd> `right`,
   * <kbd>Shift</kbd>+<kbd>Tab</kbd> `left`); a pick, a blur or the long-text editor's save has
   * none. Hand it on to the slot's `commit(value, move)`.
   */
  onCommit: (value: FieldValue, move?: EditableCellMove) => void;
  /** Close without committing. */
  onCancel: () => void;
  /** The field's name, for the editor's accessible name. */
  label: string;
  /**
   * The character that opened the editor (the slot's `seed`): a text, URL, email, phone, number or
   * long-text field starts from it in place of the value, a date opens as a field that takes a
   * typed date ("12/3", "Mar 12", "today") starting from it, and a picker (choice, person, link)
   * opens searching for it. A date-time opens as it is.
   * @default undefined
   */
  seed?: string;
  /**
   * `cell` — the editor of a floating grid cell, which is the box itself: no border, fill or
   * shadow of its own (an invalid draft turns its text destructive, and a number's steppers go).
   * A `text` field is one wrapping box that grows to `max-h-60` then scrolls, its newlines typed
   * or pasted becoming spaces. A `number`, `currency` or `percent` field is typed as written: the
   * reader's decimal mark, no digit grouping, no symbol, no border and no steppers, ArrowUp and
   * ArrowDown step by 1, and "-", "." and "1." are drafts on the way to a value (a draft that never
   * becomes one cancels on blur). A percent is typed as the points its cell shows ("42" for 42%)
   * and committed as the fraction it is stored as (0.42). `long_text` edits in
   * place on the cell's own surface (no popover from it) and grows to 15rem before it scrolls. A
   * `person` is the chosen people as removable chips over the people list, which leaves them out.
   * A `date` and a date-time's date take the inline (`ghost`) date picker. Every other type is the
   * default editor, only borderless.
   * @default "default"
   */
  variant?: "default" | "cell";
}

/** Text-like types edit a draft and commit on Enter or when focus leaves the editor. */
const DRAFT_TYPES: ReadonlySet<FieldType> = new Set([
  "text",
  "url",
  "email",
  "phone",
  "number",
  "currency",
  "percent",
]);

/** The types whose field a typed seed is entered into: one text field, no picker. */
const SEEDED_TYPES: ReadonlySet<FieldType> = new Set([
  "text",
  "url",
  "email",
  "phone",
  "number",
  "currency",
  "percent",
]);

/** The pickers whose list or calendar opens with the editor. */
const PICKER_TYPES: ReadonlySet<FieldType> = new Set([
  "single_choice",
  "multi_choice",
  "person",
  "link",
  "date",
]);

/** The pickers that open searching for a typed seed. */
const SEARCHED_TYPES: ReadonlySet<FieldType> = new Set([
  "single_choice",
  "multi_choice",
  "person",
  "link",
]);

/** How long after a date editor opens its trigger ignores a press (a double-click's second). */
const DATE_SETTLE_MS = 350;

/** Strips the box the DS draws around an input and a number field: the cell editor's host is it. */
const CELL_BARE =
  "[&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:shadow-none dark:[&_[data-slot=input]]:bg-transparent " +
  "[&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:shadow-none dark:[&_[data-slot=input-group]]:bg-transparent " +
  "[&_[data-slot=input]]:aria-invalid:text-destructive [&_[data-slot=input-group-control]]:aria-invalid:text-destructive " +
  "[&_[data-slot=input-group-addon]:has([data-slot^=number-field-])]:hidden";

/** The decimal mark of the reader's locale: a number is typed as they write it. */
function decimalMark(): string {
  return (
    new Intl.NumberFormat()
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? "."
  );
}

/**
 * `scale` of a number-like type in its cell editor: a percent is stored as a fraction and typed as
 * the points the cell shows (0.42 is "42"); a number and a currency are typed as they are.
 */
function cellScale(type: FieldType): number {
  return type === "percent" ? 100 : 1;
}

/**
 * `text` (a number as written, `1.5`, `-2e-7`) with its decimal point moved `places` to the right
 * (left when negative) — exact, digit for digit, so a percent's ×100 and ÷100 never round what a
 * server keeps (15 significant digits).
 */
function shiftDecimal(text: string, places: number): string {
  let rest = text.trim();
  const sign = rest.startsWith("-") ? "-" : "";
  if (rest.startsWith("-") || rest.startsWith("+")) rest = rest.slice(1);
  let exponent = 0;
  const e = rest.search(/e/i);
  if (e >= 0) {
    exponent = Number(rest.slice(e + 1));
    rest = rest.slice(0, e);
  }
  const dot = rest.indexOf(".");
  const whole = dot < 0 ? rest : rest.slice(0, dot);
  let digits = whole + (dot < 0 ? "" : rest.slice(dot + 1));
  let point = whole.length + exponent + places;
  if (point <= 0) {
    digits = "0".repeat(1 - point) + digits;
    point = 1;
  }
  if (point > digits.length) digits += "0".repeat(point - digits.length);
  const int = digits.slice(0, point).replace(/^0+(?=\d)/, "") || "0";
  const fraction = digits.slice(point).replace(/0+$/, "");
  return sign + int + (fraction ? `.${fraction}` : "");
}

/** A multiplication or division by `scale` (1 or 100) done on the digits, never in floats. */
function scaled(number: number, scale: number, direction: "up" | "down") {
  if (scale === 1) return number;
  const places = Math.round(Math.log10(scale));
  return Number(
    shiftDecimal(String(number), direction === "up" ? places : -places),
  );
}

/**
 * A number as its draft: the shortest text that reads back as it, in the reader's decimal mark,
 * at the editor's `scale` (a percent is its points).
 */
function numberDraft(value: FieldValue, scale = 1): string {
  return typeof value === "number"
    ? String(scaled(value, scale, "up")).replace(".", decimalMark())
    : "";
}

/** A number draft's value: `null` when empty, `undefined` while it is not (yet) a number ("-"). */
function readNumberDraft(draft: string): number | null | undefined {
  if (draft === "") return null;
  const number = Number(draft.replace(decimalMark(), "."));
  return Number.isFinite(number) ? number : undefined;
}

/** Puts the caret after the text, as a cell editor opened on a value or a typed key does. */
function caretToEnd(node: HTMLInputElement | HTMLTextAreaElement | null) {
  if (!node) return;
  node.focus();
  node.setSelectionRange(node.value.length, node.value.length);
}

/** A `cell` text editor: a wrapping box that grows with its text, one paragraph. */
function CellTextBox({
  value,
  maxLength,
  placeholder,
  invalid,
  onChange,
  ...a11y
}: {
  value: string;
  maxLength?: number;
  placeholder?: string;
  invalid: boolean;
  onChange: (next: string) => void;
  "aria-label": string;
}) {
  const field = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => caretToEnd(field.current), []);
  return (
    <Textarea
      {...a11y}
      ref={field}
      variant="ghost"
      rows={1}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      value={value}
      className="block max-h-60 min-h-8 w-full overflow-y-auto px-2.5 py-1.5 leading-5"
      onChange={(event) => onChange(event.target.value.replace(/\r?\n/g, " "))}
    />
  );
}

/** A `cell` number editor: the number as typed, no grouping and no steppers. */
function CellNumberInput({
  value,
  invalid,
  onChange,
  ...a11y
}: {
  value: string;
  invalid: boolean;
  onChange: (next: string) => void;
  "aria-label": string;
}) {
  const field = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => caretToEnd(field.current), []);
  const mark = decimalMark();
  return (
    <Input
      {...a11y}
      ref={field}
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={invalid || undefined}
      value={value}
      className="h-8 w-full px-2.5 tabular-nums"
      onChange={(event) => {
        // What may be typed on the way to a number: "-", "." and "1." are steps, not values. The
        // other mark ("." in a comma locale) is typed as the reader's own.
        const next = event.target.value.trim().replace(/[.,]/, mark);
        if (/^-?\d*[.,]?\d*$/.test(next)) onChange(next);
      }}
      onKeyDown={(event) => {
        // The arrow keys step the value by one, as a number field's always have.
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        event.stopPropagation();
        const places = value.split(mark)[1]?.length ?? 0;
        const next =
          (readNumberDraft(value) ?? 0) + (event.key === "ArrowUp" ? 1 : -1);
        onChange(next.toFixed(places).replace(".", mark));
      }}
    />
  );
}

/**
 * Replace a field's text the way typing would: through the native setter and an `input` event, so
 * the control's own parser reads it — a number field's `-` or `.`, a percent's scale.
 */
function typeInto(field: HTMLInputElement, text: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set?.call(field, text);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * A typed key as literal Markdown: a long text's seed `#`, `-` or `*` is the character typed, not
 * the start of a heading or a list.
 */
function markdownLiteral(key: string): string {
  return /^[\\`*_{}[\]()#+\-.!|>~<&=]$/.test(key) ? `\\${key}` : key;
}

/**
 * Whether a numeric date is written month first ("3/12" is 12 March): the workspace's
 * `dateFormat` decides (`mdy` and `ymd` put the month before the day), else the reader's locale.
 */
function monthFirst(dateFormat?: DateFormat): boolean {
  if (dateFormat) return dateFormat.dateStyle !== "dmy";
  const parts = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(2000, 11, 31));
  const order = parts
    .filter((part) => part.type === "month" || part.type === "day")
    .map((part) => part.type);
  return order[0] === "month";
}

/** A typed date's pattern, in the workspace's order or the reader's locale ("mm/dd/yyyy"): the typed field's hint. */
function typedDatePattern(dateFormat?: DateFormat): string {
  if (dateFormat?.dateStyle === "ymd") return "yyyy-mm-dd";
  return monthFirst(dateFormat) ? "mm/dd/yyyy" : "dd/mm/yyyy";
}

/** A month named in the reader's locale or English, from its first three letters. */
function monthOf(name: string): number | undefined {
  if (name.length < 3) return undefined;
  for (const locale of [undefined, "en"]) {
    for (let month = 0; month < 12; month++) {
      const long = new Intl.DateTimeFormat(locale, { month: "long" })
        .format(new Date(2000, month, 1))
        .toLowerCase();
      if (long.startsWith(name.replace(/\.$/, ""))) return month + 1;
    }
  }
  return undefined;
}

/**
 * A typed date as a calendar day (`"2026-03-12"`), or `undefined` when it isn't one: an ISO day,
 * a numeric day and month in the locale's order with an optional year ("12/3", "12/3/26"), a
 * month name with a day ("Mar 12", "12 March 2026"), or "today", "tomorrow", "yesterday".
 */
function parseTypedDay(
  input: string,
  timeZone?: string,
  at: Date = new Date(),
  dateFormat?: DateFormat,
): string | undefined {
  // "Today" (and a year left out) is the reader's day in their time zone, not the runtime's.
  const now = zonedToday(at, timeZone);
  const text = input
    .trim()
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ");
  const day = (year: number, month: number, date: number) => {
    if (month < 1 || month > 12 || date < 1 || date > 31) return undefined;
    const value = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    return parseCalendarDay(value) ? value : undefined;
  };
  const yearOf = (typed: string | undefined) =>
    typed === undefined
      ? now.getFullYear()
      : typed.length === 2
        ? 2000 + Number(typed)
        : Number(typed);
  const relative = { today: 0, tomorrow: 1, yesterday: -1 }[text];
  if (relative !== undefined) {
    const at = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + relative,
    );
    return day(at.getFullYear(), at.getMonth() + 1, at.getDate());
  }
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text);
  if (match) return day(Number(match[1]), Number(match[2]), Number(match[3]));
  match = /^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2}|\d{4}))?$/.exec(text);
  if (match) {
    const [a, b] = [Number(match[1]), Number(match[2])];
    const year = yearOf(match[3]);
    return monthFirst(dateFormat) ? day(year, a, b) : day(year, b, a);
  }
  match = /^(\d{1,2}) ([a-z\u00c0-\u024f.]+)(?: (\d{2}|\d{4}))?$/.exec(text);
  if (match) {
    const month = monthOf(match[2]!);
    return month ? day(yearOf(match[3]), month, Number(match[1])) : undefined;
  }
  match = /^([a-z\u00c0-\u024f.]+) (\d{1,2})(?: (\d{2}|\d{4}))?$/.exec(text);
  if (match) {
    const month = monthOf(match[1]!);
    return month ? day(yearOf(match[3]), month, Number(match[2])) : undefined;
  }
  return undefined;
}

/**
 * Whether focus moved into one of the editor's OWN popups (its calendar, its list) — a popup a
 * control inside the editor controls (`aria-controls`) — rather than away.
 */
function inOwnPopup(root: Element, node: Element | null) {
  for (let at = node; at; at = at.parentElement)
    if (at.id && root.querySelector(`[aria-controls="${CSS.escape(at.id)}"]`))
      return true;
  return false;
}

/**
 * `FieldCellEditor` — the editor a grid cell opens, inside `EditableCell`'s `custom` slot. It
 * commits a TYPED value, so the host saves it and closes the slot itself:
 * `editable: { type: "custom", render: ({ cancel }) => <FieldCellEditor … onCommit={(v) => {
 * save(v); cancel(); }} onCancel={cancel} /> }`. Text, numbers and date-times edit a draft and
 * commit on <kbd>Enter</kbd> or when focus leaves the editor; pickers (date, single choice, person,
 * link) commit on choosing; a multiple choice toggles with its list open and commits on
 * <kbd>Tab</kbd>, on <kbd>Enter</kbd> with no option highlighted, or when the list closes; long
 * text opens the `TextEdit` editor in a popover
 * (<kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> or closing it saves); <kbd>Escape</kbd> cancels
 * the edit, an open picker or calendar with it.
 * The editor takes focus as it opens. A read-only type cancels at once.
 *
 * @example
 * <FieldCellEditor type="single_choice" label="Status" value={row.status}
 *   config={{ options }} onCommit={(v) => { save(row.id, "status", v); cancel(); }}
 *   onCancel={cancel} />
 */
export function FieldCellEditor({
  type,
  value,
  config = {},
  onCommit,
  onCancel,
  label,
  seed,
  variant = "default",
}: FieldCellEditorProps) {
  const cell = variant === "cell";
  // A cell's text and number are edited as text: a number's draft is what was typed.
  const cellText = cell && type === "text";
  // ...a currency and a percent too: the same plain editor, the symbol and the grouping are the
  // resting cell's. A percent is typed as points (42) and stored as the fraction (0.42).
  const cellNumber =
    cell && (type === "number" || type === "currency" || type === "percent");
  const scale = cellScale(type);
  // A cell's long text edits where the floating editor is: its own surface, not a popover from it.
  const cellLong = cell && type === "long_text";
  // A cell's people are chips over the picker's list, searched at once.
  const cellPerson = cell && type === "person";
  // A date opened by typing edits the typed text (a field, not the calendar), committed as the
  // day it names.
  const typedDate = type === "date" && Boolean(seed);
  const timeZone = useTimeZone();
  const dateFormat = useDateFormat();
  // Type-to-edit replaces the value: long text and a typed date start from the key itself.
  const [draft, setDraft] = React.useState<FieldValue>(() =>
    seed && type === "long_text"
      ? markdownLiteral(seed)
      : seed && (typedDate || cellText || cellNumber)
        ? seed
        : cellNumber
          ? numberDraft(value, scale)
          : value,
  );
  const done = React.useRef(false);
  // The draft as of the last change, for a commit scheduled outside a render (a list closing).
  const latest = React.useRef<FieldValue>(draft);
  // A choice option `onCreateOption` is still making.
  const creating = React.useRef<Promise<unknown> | null>(null);
  const choice = type === "single_choice" || type === "multi_choice";
  const multiChoice = type === "multi_choice";
  // A date's calendar is open from the first render, like a choice's list: no trigger press, whose
  // click (or the double-click's own second one) the just-opened calendar could take for a close.
  const [calendarOpen, setCalendarOpen] = React.useState(true);
  // The press that opened the editor may be the first half of a double-click: its second press
  // lands on the date's trigger, under the pointer, and must not close the calendar it just opened
  // (`FloatingCellEditor`'s lock layer holds off the same press for the same time).
  const openedAt = React.useRef(0);
  React.useEffect(() => {
    openedAt.current = performance.now();
  }, []);
  const root = React.useRef<HTMLSpanElement | null>(null);
  const longText = React.useRef<TextEditHandle | null>(null);
  const longTextLimitId = React.useId();
  const commit = (next: FieldValue, move?: EditableCellMove) => {
    if (done.current) return;
    done.current = true;
    onCommit(next, move);
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };
  React.useEffect(() => {
    if (READ_ONLY_FIELD_TYPES.has(type)) {
      cancel();
      return;
    }
    // The opened editor takes focus: its first control (a field, a picker's trigger).
    // The field itself first (a number's input, not its Decrease button), then a picker trigger.
    // A seeded picker opened searching: its popup's search field holds focus, not the trigger.
    if (seed && SEARCHED_TYPES.has(type)) return;
    // A choice's list is open from the first render, its search field focused: no trigger press,
    // whose click the just-opened list could take for a press outside it and close.
    if (type === "single_choice" || type === "multi_choice") return;
    // A date's calendar is open from the first render and focuses its own day.
    if (type === "date" && !typedDate) return;
    // A cell's long text and people edit in place and focus themselves.
    if (cellLong || cellPerson) return;
    // Long text edits in a popover outside the cell: its editor takes the caret, however the
    // editor was opened (Enter, F2, a click).
    if (type === "long_text") {
      // The popover mounts its content a frame or two after the editor: focus it once it is there.
      let frame = 0;
      // Type-to-edit: printable keys typed before the editor's popover is there join the draft
      // it opens with. From then on its read view holds focus and replays every input (typing,
      // Enter, a paste) into the editor in order once it loads.
      const keep = (event: KeyboardEvent) => {
        if (
          event.key.length !== 1 ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.isComposing
        )
          return;
        event.preventDefault();
        setDraft(
          (text) =>
            (typeof text === "string" ? text : "") + markdownLiteral(event.key),
        );
      };
      const stopKeeping = () =>
        document.removeEventListener("keydown", keep, true);
      if (seed) document.addEventListener("keydown", keep, true);
      let tries = 0;
      const focusText = () => {
        if (longText.current) {
          stopKeeping();
          // The caret goes at the end, nothing selected: after a seeded editor's typed keys, so
          // the next keys follow; after an opened value's text (Enter, F2, a click), to go on
          // writing it.
          longText.current.focus("end");
        } else if (++tries < 30) frame = requestAnimationFrame(focusText);
        else stopKeeping();
      };
      focusText();
      return () => {
        cancelAnimationFrame(frame);
        stopKeeping();
      };
    }
    // A cell's text and number focus themselves, caret after the text (the seed is their draft).
    if (cellText || cellNumber) return;
    const scope = root.current;
    // A control's own hidden form input (a picker's, `aria-hidden`, out of the tab order) is
    // never the one to focus: keys typed there go nowhere.
    const field = scope?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not(:disabled):not([aria-hidden="true"]):not([tabindex="-1"]), textarea:not(:disabled), [contenteditable="true"]',
    );
    const target =
      field ??
      scope?.querySelector<HTMLElement>(
        'button:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
    target?.focus();
    // A picker opened from the keyboard (Enter, F2) opens its list or calendar at once, as a
    // spreadsheet's does, so the next keys choose.
    if (
      !seed &&
      PICKER_TYPES.has(type) &&
      type !== "date" &&
      target instanceof HTMLButtonElement
    )
      target.click();
    // Type-to-edit: the key that opened the editor replaces the value, caret after it. (A picker
    // took it as its search instead.)
    if (
      seed &&
      (SEEDED_TYPES.has(type) || typedDate) &&
      field instanceof HTMLInputElement
    )
      typeInto(field, seed);
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const drafted = DRAFT_TYPES.has(type) || typedDate;
  // The move a picker's choice carries: Enter (down, Shift+Enter up) chose it, a click didn't.
  const pickMove = React.useRef<EditableCellMove | undefined>(undefined);
  const typedText = typedDate && typeof draft === "string" ? draft.trim() : "";
  const typedDay = typedText
    ? parseTypedDay(typedText, timeZone, undefined, dateFormat)
    : undefined;
  const typedNumber =
    cellNumber && typeof draft === "string" ? readNumberDraft(draft) : null;
  const valid = typedDate
    ? typedText === "" || typedDay !== undefined
    : cellNumber
      ? typedNumber !== undefined
      : typeof draft !== "string" || isValidFieldText(type, draft);
  // What a drafted editor commits: a typed date commits the day it names (empty clears it), a
  // cell's number the number typed, a cell's text nothing when it is empty.
  const out: FieldValue = typedDate
    ? (typedDay ?? null)
    : cellNumber
      ? // An untouched draft commits the value it was opened from, never a re-read of it.
        !seed && draft === numberDraft(value, scale)
        ? value
        : typedNumber == null
          ? null
          : scaled(typedNumber, scale, "down")
      : cellText
        ? draft || null
        : draft;

  if (cellLong)
    return (
      <span
        ref={root}
        data-slot="field-cell-editor"
        data-type={type}
        data-variant={variant}
        className="block min-w-0 flex-1"
        onKeyDownCapture={(event) => {
          // IME composition never commits or cancels: the key stays with the editor.
          if (event.nativeEvent.isComposing || event.keyCode === 229)
            event.stopPropagation();
        }}
      >
        <LongTextPropertyEditor
          label={label}
          value={value}
          seed={seed}
          config={config}
          maxHeight="15rem"
          className="px-2.5 py-1.5"
          onCommit={(next) => commit(next)}
          onCancel={cancel}
        />
      </span>
    );

  if (type === "long_text") {
    const text = typeof draft === "string" ? draft : "";
    return (
      <Popover
        open
        onOpenChange={(open, details) => {
          if (open) return;
          // The editor's own floating parts (the @ mention menu, its toolbars) live in a layer
          // portalled outside the popover: a press or focus there is inside the edit.
          const at = (details?.event as Event | undefined)?.target;
          if (
            at instanceof Element &&
            at.closest('[data-slot="text-edit-layer"]')
          )
            return;
          if (
            details?.reason === "focus-out" &&
            document.activeElement?.closest('[data-slot="text-edit-layer"]')
          )
            return;
          if (details?.reason === "escape-key") {
            // An Escape the editor already used (closing its find bar or a menu) is not ours.
            if ((details.event as Event | undefined)?.defaultPrevented) return;
            cancel();
          } else if (longTextOver(text, config) === null) commit(text || null);
          // Over `maxLength`: the popover stays open with the message; Escape cancels.
        }}
      >
        <span
          ref={root}
          data-slot="field-cell-editor"
          data-type={type}
          className="relative flex min-w-0 flex-1 items-center"
        >
          <PopoverAnchor />
          <span className="min-w-0 truncate">{text.split("\n")[0]}</span>
        </span>
        <PopoverContent align="start" className="w-96">
          {/* TextEdit owns ⌘/Ctrl+Enter (onSubmit) and its own Escape (find bar, menus). */}
          <TextEdit
            handleRef={longText}
            variant="boxed"
            format="markdown"
            aria-label={label}
            placeholder={config.placeholder}
            value={text}
            onValueChange={setDraft}
            aria-invalid={longTextOver(text, config) !== null || undefined}
            aria-describedby={
              config.maxLength !== undefined ? longTextLimitId : undefined
            }
            onSubmit={(next) => {
              if (longTextOver(next, config) === null) commit(next || null);
            }}
            // Escape: TextEdit reverts (and marks the key used); the edit is cancelled.
            onRevert={cancel}
            mentions={config.mentions}
            mentionHref={config.mentionHref}
            mentionImage={config.mentionImage}
            minHeight="6rem"
          />
          <LongTextLimit id={longTextLimitId} text={text} config={config} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <span
      ref={root}
      data-slot="field-cell-editor"
      data-type={type}
      data-variant={variant}
      className={cn("flex min-w-0 flex-1 items-center", cell && CELL_BARE)}
      onKeyDownCapture={(event) => {
        // IME composition never commits, chooses or moves: the key stops here, before any control
        // inside (a picker's highlighted option) sees it.
        if (event.nativeEvent.isComposing || event.keyCode === 229) {
          event.stopPropagation();
          return;
        }
        // Escape cancels the edit, whatever inside has focus: an open picker or calendar goes
        // with it, so one Escape always leaves the cell.
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          cancel();
          return;
        }
        pickMove.current =
          event.key === "Enter" ? (event.shiftKey ? "up" : "down") : undefined;
        // A multiple choice toggles on Enter while an option is highlighted; with none, Enter
        // ends the edit and commits what is ticked.
        if (
          multiChoice &&
          event.key === "Enter" &&
          !(event.target as Element).getAttribute?.("aria-activedescendant")
        ) {
          event.preventDefault();
          event.stopPropagation();
          commit(latest.current, event.shiftKey ? "up" : "down");
        }
      }}
      onPointerDownCapture={() => {
        pickMove.current = undefined;
      }}
      onClickCapture={(event) => {
        if (
          (type === "date" || type === "datetime") &&
          performance.now() - openedAt.current < DATE_SETTLE_MS &&
          (event.target as Element).closest?.(
            '[data-slot="date-picker-trigger"], [data-slot="date-time-picker-trigger"]',
          )
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onKeyDown={(event) => {
        // A key the control inside already handled is its own.
        if (event.defaultPrevented) return;
        if (event.key === "Enter" && drafted) {
          event.preventDefault();
          event.stopPropagation();
          if (valid) commit(out, event.shiftKey ? "up" : "down");
        } else if (event.key === "Tab") {
          // Tab commits and moves across. Inside a date-time's popup it steps between the calendar
          // and the time instead (the popup is portaled: outside the editor's own DOM).
          if (
            type === "datetime" &&
            !event.currentTarget.contains(event.target as Node)
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          if (valid) commit(out, event.shiftKey ? "left" : "right");
        }
      }}
      onBlur={(event) => {
        // A drafted editor commits when focus leaves it — not into its own popup.
        if (!drafted) return;
        const next = event.relatedTarget as Element | null;
        if (
          event.currentTarget.contains(next) ||
          inOwnPopup(event.currentTarget, next)
        )
          return;
        if (valid) commit(out);
        else cancel();
      }}
    >
      {choice ? (
        <ChoiceCellEditor
          multiple={multiChoice}
          value={draft}
          config={config}
          label={label}
          defaultSearch={seed || undefined}
          creating={creating}
          onChange={(next) => {
            setDraft(next);
            latest.current = next;
            // A single choice's pick is the commit, and moves on when Enter made it.
            if (!multiChoice) commit(next, pickMove.current);
          }}
          onClose={() => {
            const settle = () => {
              if (multiChoice && !sameChoices(latest.current, value))
                commit(latest.current);
              else cancel();
            };
            // After the event that closed the list: a pick in the same event commits first. An
            // option still being made ("Add “…”" closed the list) is waited for, then chosen.
            setTimeout(() => {
              const pending = creating.current;
              if (!pending) return settle();
              const later = () => setTimeout(settle, 0);
              pending.then(later, later);
            }, 0);
          }}
        />
      ) : cellPerson ? (
        <PersonCellEditor
          multiple={config.multiple === true}
          value={draft}
          config={config}
          label={label}
          defaultSearch={seed || undefined}
          onChange={(next) => {
            setDraft(next);
            latest.current = next;
            // A single person's pick is the commit.
            if (!config.multiple) commit(next);
          }}
          onClose={() => {
            if (!samePeople(latest.current, value)) commit(latest.current);
            else cancel();
          }}
        />
      ) : cellText ? (
        <CellTextBox
          aria-label={label}
          value={typeof draft === "string" ? draft : ""}
          maxLength={config.maxLength ?? 10_000}
          placeholder={config.placeholder}
          invalid={!valid}
          onChange={setDraft}
        />
      ) : cellNumber ? (
        <CellNumberInput
          aria-label={label}
          value={typeof draft === "string" ? draft : ""}
          invalid={!valid}
          onChange={setDraft}
        />
      ) : typedDate ? (
        <Input
          type="text"
          inputMode="text"
          autoComplete="off"
          aria-label={label}
          aria-invalid={!valid || undefined}
          placeholder={typedDatePattern(dateFormat)}
          value={typeof draft === "string" ? draft : ""}
          className="h-7 w-full"
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : type === "date" ? (
        // A day is the commit, and moves on when Enter made it. A calendar closed with no day
        // (a press outside, the trigger pressed again) is a dismissal: the edit is cancelled, so
        // the host's floating editor and the page lock behind it go with it, like a closed list.
        <DatePicker
          aria-label={label}
          aria-invalid={!valid || undefined}
          size="sm"
          variant={cell ? "ghost" : "outline"}
          // A grid cell is the trigger's box: no border, fill or open tint inside it.
          flat={cell}
          // Clearing is the × beside the day: pressing the chosen day again (Enter on it) keeps it.
          clearable
          calendarProps={{ required: true }}
          className="w-full"
          open={calendarOpen}
          value={
            typeof draft === "string" ? parseCalendarDay(draft) : undefined
          }
          onValueChange={(day) => {
            const next = day ? toCalendarDay(day) : null;
            setDraft(next);
            commit(next, pickMove.current);
          }}
          onOpenChange={(open, details) => {
            setCalendarOpen(open);
            // The × beside the day closes the calendar as a press or focus outside it, then
            // clears: that press is the clear, not a dismissal. (After a pick the edit is done:
            // a no-op.)
            const event = details?.event as Event | undefined;
            const at =
              event && "relatedTarget" in event
                ? (event as FocusEvent).relatedTarget
                : event?.target;
            const onClear =
              at instanceof Element &&
              root.current?.contains(at) === true &&
              !at.closest('[data-slot="date-picker-trigger"]');
            if (!open && !onClear) cancel();
          }}
        />
      ) : type === "datetime" ? (
        // One popup, open from the first render like the date's calendar: a day keeps it open for
        // the time, a time closes it. Closing commits what was picked (moving on when Enter picked
        // it); closed with nothing changed (a press outside, Escape) is a dismissal.
        <DateTimePicker
          aria-label={label}
          aria-invalid={!valid || undefined}
          size="sm"
          variant={cell ? "ghost" : "outline"}
          // A grid cell is the trigger's box: no border, fill or open tint inside it.
          flat={cell}
          className="w-full"
          open={calendarOpen}
          value={
            typeof draft === "string" && !Number.isNaN(Date.parse(draft))
              ? new Date(draft)
              : undefined
          }
          onValueChange={(next) => {
            const iso = next ? next.toISOString() : null;
            setDraft(iso);
            latest.current = iso;
          }}
          onOpenChange={(open) => {
            setCalendarOpen(open);
            if (open) return;
            if (latest.current !== value)
              commit(latest.current, pickMove.current);
            else cancel();
          }}
        />
      ) : (
        <FieldInput
          type={type}
          value={draft}
          config={config}
          aria-label={label}
          invalid={!valid}
          defaultSearch={seed && SEARCHED_TYPES.has(type) ? seed : undefined}
          variant={variant}
          className="w-full"
          onChange={(next) => {
            setDraft(next);
            // A picker's choice is the commit, and moves on when Enter made it.
            if (!drafted) commit(next, pickMove.current);
          }}
        />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * FieldProperty — one field as an editable property row (web app POL-30)
 * ----------------------------------------------------------------------------------------------*/

/** Props for `FieldProperty`. */
export interface FieldPropertyProps {
  /** The field's name: the row's label and the editor's accessible name. */
  label: string;
  /** A leading icon for the label (the field type's). @default undefined */
  icon?: React.ReactNode;
  /** The field's type. */
  type: FieldType;
  /** The persisted value, in its type's shape. */
  value: FieldValue;
  /**
   * The field's configuration (options, currency, people and record search…), as the grid's.
   * @default {}
   */
  config?: FieldConfig;
  /**
   * Save the edited value. Return a promise: the value shows at once, a spinner follows after
   * 300ms, and a rejection rolls the value back with an announcement and an error toast offering
   * Retry — `EditableCell`'s contract. Fires only when the value changed.
   * @default undefined
   */
  onSave?: (next: FieldValue) => void | Promise<void>;
  /**
   * Someone else changed the field while it was open: `true` shows "Someone changed this field."
   * under the value; a node shows that instead.
   * @default undefined
   */
  conflict?: boolean | React.ReactNode;
  /** Show the value only: no hover, no edit. Read-only types always are. @default false */
  readOnly?: boolean;
  /**
   * For a value normally filled by something else that a person can still override: it reads as
   * read-only (no hover wash, no text cursor, a mouse click doesn't open the editor), while a
   * double-click, a tap, <kbd>Enter</kbd> or a typed character still does. A checkbox and a value
   * that is itself a link keep their own controls.
   * @default false
   */
  readOnlyHint?: boolean;
  /** A 12px mark on the value (`FieldCellDisplay`'s `mark`). @default undefined */
  mark?: FieldCellMark;
  /** Disable the row: the value dims, no hover, no edit. @default false */
  disabled?: boolean;
  /**
   * What an empty value reads as, muted.
   * @default "Empty"
   */
  emptyText?: string;
  /**
   * `standalone` gives the value its own tab stop; `managed` hands reachability to the host's
   * roving focus.
   * @default "standalone"
   */
  focusMode?: "standalone" | "managed";
  /**
   * Controlled edit mode: a `managed` host opens the editor (its own Enter, a "Edit all fields"
   * pass). Omit it and the row opens on a click, <kbd>Enter</kbd> or a typed character.
   * @default undefined
   */
  editing?: boolean;
  /** Called when the row opens or closes its editor. @default undefined */
  onEditingChange?: (editing: boolean) => void;
  /** Raise the error toast with Retry when `onSave` rejects. @default true */
  saveErrorToast?: boolean;
  /** Extra classes for the row. @default undefined */
  className?: string;
}

/** JSON with object keys in sorted order: one string per value, whatever order its keys came in. */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(
          Object.keys(inner as Record<string, unknown>)
            .sort()
            .map((key) => [key, (inner as Record<string, unknown>)[key]]),
        )
      : inner,
  );
}

/**
 * A field value as `EditableCell`'s string: `""` for empty, else its key-sorted JSON — so the same
 * person picked again (keys in another order) is the same string, and saves nothing.
 */
function propertyString(value: FieldValue): string {
  if (value == null || value === "") return "";
  if (Array.isArray(value) && value.length === 0) return "";
  return stableJson(value);
}

/** The value back from `propertyString`. */
function propertyValue(text: string): FieldValue {
  return text === "" ? null : (JSON.parse(text) as FieldValue);
}

/** The controls a Tab can land on, in document order. */
const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable="true"],[tabindex]';

/** Focus the control before or after `from` in the Tab order (what Tab out of an editor does). */
function focusAdjacent(from: HTMLElement, direction: "next" | "previous") {
  const all = [...document.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el === from || (el.tabIndex >= 0 && el.getClientRects().length > 0),
  );
  const index = all.indexOf(from);
  const target = all[index + (direction === "next" ? 1 : -1)];
  (target ?? from).focus();
}

/** A printable key with no modifier: it opens the editor with itself as the seed (type-to-edit). */
function isPropertyTypingKey(event: React.KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    event.key !== " " &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.nativeEvent.isComposing &&
    event.keyCode !== 229
  );
}

/**
 * The async save a checkbox or linked-value property runs itself (an `EditableCell` runs its own):
 * the value shows at once, a spinner after 300ms, and a rejection rolls back with an announcement
 * and an error toast offering Retry — the same contract, word for word.
 */
function usePropertySave(
  label: string,
  onSave: ((next: FieldValue) => void | Promise<void>) | undefined,
  saveErrorToast: boolean,
) {
  const [pending, setPending] = React.useState<{ value: FieldValue } | null>(
    null,
  );
  const [spinner, setSpinner] = React.useState(false);
  const { announce, Announcer } = useAnnouncer();
  // Only the latest save settles the shown value: an older one finishing late changes nothing.
  const sequence = React.useRef(0);
  const saving = pending !== null;
  React.useEffect(() => {
    if (!saving) return setSpinner(false);
    const timer = setTimeout(() => setSpinner(true), 300);
    return () => clearTimeout(timer);
  }, [saving]);
  const save = (next: FieldValue) => {
    // Every save advances the sequence, a synchronous one too: it supersedes any still in flight.
    const seq = ++sequence.current;
    const result = onSave?.(next);
    if (!(result instanceof Promise)) {
      setPending(null);
      return;
    }
    setPending({ value: next });
    result.then(
      () => {
        if (seq === sequence.current) setPending(null);
      },
      (error: unknown) => {
        if (seq !== sequence.current) return;
        setPending(null);
        announce(`Couldn't save ${label} — value restored`);
        if (!saveErrorToast) return;
        const id = toast.add({
          type: "error",
          title: `Couldn't save ${label}`,
          description: error instanceof Error ? error.message : undefined,
          actionProps: {
            children: "Retry",
            onClick: () => {
              toast.close(id);
              save(next);
            },
          },
        });
      },
    );
  };
  return { pending, saving, spinner, save, Announcer };
}

/** The trailing spinner of a slow save (after 300ms); decorative — the save is announced. */
function PropertySpinner() {
  return (
    <Spinner aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
  );
}

/** A checkbox property: it toggles where it is, saving at once — no edit state. */
function CheckboxProperty({
  label,
  value,
  onSave,
  saveErrorToast,
  managed,
  mark,
}: {
  label: string;
  value: FieldValue;
  onSave: ((next: FieldValue) => void | Promise<void>) | undefined;
  saveErrorToast: boolean;
  managed: boolean;
  mark: FieldCellMark | undefined;
}) {
  const { pending, saving, spinner, save, Announcer } = usePropertySave(
    label,
    onSave,
    saveErrorToast,
  );
  const shown = pending ? pending.value : value;
  return (
    <span
      data-slot="field-property-checkbox"
      aria-busy={saving || undefined}
      className="inline-flex items-center gap-1.5"
    >
      {/* `managed`: the host's roving focus owns reachability — no tab stop of its own. */}
      <TruncationFocusProvider focusable={!managed}>
        <FieldCellDisplay
          type="checkbox"
          value={shown === true}
          label={label}
          onToggle={onSave ? (next) => save(next) : undefined}
          mark={shown == null ? undefined : mark}
        />
      </TruncationFocusProvider>
      {spinner ? <PropertySpinner /> : null}
      <Announcer />
    </span>
  );
}

/** The types whose value holds its own links (a URL, a record chip): no edit button over it. */
const LINKED_PROPERTY_TYPES: ReadonlySet<FieldType> = new Set([
  "url",
  "email",
  "phone",
  "link",
]);

/**
 * A property whose value is itself a link — a URL, an email, a phone, record chips, files. The
 * value stays followable, so it can't sit inside an edit button (a control in a control); an
 * "Edit {label}" pencil beside it (shown on hover and focus, always on touch) opens the cell editor
 * instead, and an empty value is the edit button itself.
 */
function LinkedProperty({
  label,
  type,
  value,
  config,
  onSave,
  emptyText,
  saveErrorToast,
  managed,
  editing,
  setEditing,
  mark,
}: {
  label: string;
  type: FieldType;
  value: FieldValue;
  config: FieldConfig;
  onSave: (next: FieldValue) => void | Promise<void>;
  emptyText: string;
  saveErrorToast: boolean;
  managed: boolean;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  mark: FieldCellMark | undefined;
}) {
  const trigger = React.useRef<HTMLButtonElement>(null);
  const root = React.useRef<HTMLSpanElement>(null);
  const { pending, saving, spinner, save, Announcer } = usePropertySave(
    label,
    onSave,
    saveErrorToast,
  );
  const shown = pending ? pending.value : value;
  // Focus comes back to the Edit pencil only when it would otherwise be lost (Enter, Escape, a
  // pick); a click into another field keeps its focus there.
  const close = (move?: EditableCellMove) => {
    setEditing(false);
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body && !root.current?.contains(active))
        return;
      const target = trigger.current;
      if (!target) return;
      // Tab / Shift+Tab out of the editor go on to the next or previous control.
      if (move === "right" || move === "left")
        focusAdjacent(target, move === "right" ? "next" : "previous");
      else target.focus();
    });
  };
  let body: React.ReactNode;
  if (editing)
    body = (
      <FieldCellEditor
        type={type}
        label={label}
        value={shown}
        config={config}
        onCommit={(next, move) => {
          close(move);
          if (propertyString(next) !== propertyString(shown)) save(next);
        }}
        onCancel={() => close()}
      />
    );
  else if (propertyString(shown) === "")
    body = (
      <Button
        ref={trigger}
        variant="ghost"
        size="xs"
        data-slot="field-property-edit"
        aria-label={`Edit ${label}`}
        tabIndex={managed ? -1 : undefined}
        onClick={() => setEditing(true)}
        className="-mx-1.5 -my-0.5 h-auto min-h-6 px-1.5 text-sm font-normal text-muted-foreground"
      >
        {emptyText}
      </Button>
    );
  else
    body = (
      <>
        {/* `managed`: the host's roving focus owns reachability, so the links are no tab stops. */}
        <TruncationFocusProvider focusable={!managed}>
          <FieldCellDisplay
            type={type}
            value={shown}
            config={config}
            align="start"
            mark={mark}
          />
        </TruncationFocusProvider>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-xs"
          data-slot="field-property-edit"
          aria-label={`Edit ${label}`}
          tabIndex={managed ? -1 : undefined}
          onClick={() => setEditing(true)}
          className="shrink-0 opacity-0 group-hover/linked:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
        >
          <Pencil />
        </Button>
      </>
    );
  return (
    <span
      ref={root}
      data-slot="field-property-linked"
      aria-busy={saving || undefined}
      className="group/linked inline-flex max-w-full min-w-0 items-center gap-1"
    >
      {body}
      {spinner ? <PropertySpinner /> : null}
      <Announcer />
    </span>
  );
}

/**
 * Long text edited in place: the document editor grows with its text where the value was (no
 * popover, no box), with the `@` menu when `config.mentions` is given. Focus leaving it commits a
 * change (or closes it unchanged), <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> commits, and
 * <kbd>Escape</kbd> reverts.
 */
function LongTextPropertyEditor({
  label,
  value,
  seed,
  config,
  maxHeight,
  className,
  onCommit,
  onCancel,
}: {
  label: string;
  value: FieldValue;
  seed?: string;
  config: FieldConfig;
  /** The most the editor grows before it scrolls. */
  maxHeight?: string;
  className?: string;
  onCommit: (value: FieldValue) => void;
  onCancel: () => void;
}) {
  const handle = React.useRef<TextEditHandle>(null);
  const done = React.useRef(false);
  const persisted = typeof value === "string" ? value : "";
  const start = seed ?? persisted;
  // The draft as typed, compared with the PERSISTED value when focus leaves: a seeded edit ("W"
  // typed on the resting value) is TextEdit's own baseline, so it would report no change.
  const draft = React.useRef(start);
  // The text as typed, for the limit's count and message.
  const [shown, setShown] = React.useState(start);
  const limitId = React.useId();
  React.useEffect(() => {
    handle.current?.focus("end");
  }, []);
  const finish = (markdown: string) => {
    if (done.current) return;
    // Over `maxLength`: no commit — the editor stays open with the message (Escape reverts).
    if (longTextOver(markdown, config) !== null) return;
    done.current = true;
    onCommit(markdown.trim() === "" ? null : markdown);
  };
  return (
    <div
      data-slot="field-property-long-text"
      className={cn("w-full min-w-0", className)}
      onBlur={(event) => {
        const wrapper = event.currentTarget;
        if (wrapper.contains(event.relatedTarget as Node | null)) return;
        // After the editor's own blur commit (a change), or closed unchanged — unless focus went
        // into the editor's own floating surfaces (the link panel, a menu), which keep the edit.
        setTimeout(() => {
          if (done.current) return;
          const active = document.activeElement;
          if (
            active &&
            (wrapper.contains(active) ||
              active.closest(TEXT_EDIT_SESSION_SELECTOR))
          )
            return;
          if (draft.current !== persisted) return finish(draft.current);
          done.current = true;
          onCancel();
        }, 0);
      }}
    >
      <TextEdit
        format="markdown"
        inset="none"
        aria-label={label}
        defaultValue={start}
        onValueChange={(next) => {
          draft.current = next;
          setShown(next);
        }}
        aria-invalid={longTextOver(shown, config) !== null || undefined}
        aria-describedby={config.maxLength !== undefined ? limitId : undefined}
        escapeBehavior="revert"
        handleRef={handle}
        maxHeight={maxHeight}
        placeholder={config.placeholder}
        mentions={config.mentions}
        mentionHref={config.mentionHref}
        mentionImage={config.mentionImage}
        onCommit={finish}
        onSubmit={finish}
        onRevert={() => {
          done.current = true;
          onCancel();
        }}
      />
      <LongTextLimit id={limitId} text={shown} config={config} />
    </div>
  );
}

/**
 * `FieldProperty` — one field as a record's property row, inside a `PropertyList`: its name on
 * the left and its value on the right, drawn exactly as the grid draws it (`FieldCellDisplay` —
 * choice badges, avatars, link chips, files), with no box at rest and a quiet wash on hover. A
 * click, <kbd>Enter</kbd> or a typed character opens the grid cell's own editor
 * (`FieldCellEditor`) in place: text, numbers, URLs, emails and phones inline; long text growing
 * in place; choices on the in-cell option list; dates on the calendar; a link on the record
 * picker. A checkbox toggles where it is. Read-only types (calculated, auto number, created and
 * updated at and by) never edit. Saving follows `EditableCell`: the value shows at once, a spinner
 * after 300ms, rollback and a Retry toast on failure. On a phone (below 40rem) the value goes full
 * width under its label.
 *
 * @example
 * <PropertyList variant="inline" aria-label="Fields">
 *   <FieldProperty label="Stage" type="single_choice" value={stage} config={{ options }} onSave={saveStage} />
 *   <FieldProperty label="Budget" type="currency" value={budget} config={{ currency: "EUR" }} onSave={saveBudget} />
 * </PropertyList>
 */
export function FieldProperty({
  label,
  icon,
  type,
  value,
  config = {},
  onSave,
  conflict,
  readOnly = false,
  readOnlyHint = false,
  mark,
  disabled = false,
  emptyText = "Empty",
  focusMode = "standalone",
  editing: editingProp,
  onEditingChange,
  saveErrorToast = true,
  className,
}: FieldPropertyProps) {
  const [editingState, setEditingState] = React.useState(false);
  const editing = editingProp ?? editingState;
  const setEditing = (open: boolean) => {
    setEditingState(open);
    onEditingChange?.(open);
  };
  const managed = focusMode === "managed";
  const [seed, setSeed] = React.useState<string | undefined>(undefined);
  const valueRef = React.useRef<HTMLElement>(null);
  // Where focus goes when the editor closes: back onto the value (Enter, Escape, a pick), or on
  // to the next or previous control (Tab) — never pulled back from a field the reader clicked into.
  const move = React.useRef<"next" | "previous" | null>(null);
  const wasEditing = React.useRef(editing);
  React.useEffect(() => {
    const closed = wasEditing.current && !editing;
    wasEditing.current = editing;
    if (!closed) return;
    const direction = move.current;
    move.current = null;
    requestAnimationFrame(() => {
      const box = valueRef.current;
      const display = box?.querySelector<HTMLElement>(
        "[data-slot=editable-cell-display]",
      );
      if (!box || !display) return;
      const active = document.activeElement;
      if (active && active !== document.body && !box.contains(active)) return;
      if (direction) focusAdjacent(display, direction);
      else if (!managed) display.focus();
    });
  }, [editing, managed]);
  // `managed`: nothing inside the row is a tab stop — the host's roving focus owns reachability
  // (record chips and links included, which take no focus policy of their own).
  React.useLayoutEffect(() => {
    if (!managed || editing) return;
    for (const el of valueRef.current?.querySelectorAll<HTMLElement>(
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ) ?? [])
      el.tabIndex = -1;
  });
  // Files have no in-place editor (uploads are the host's): they show, like the read-only types.
  const still =
    readOnly ||
    disabled ||
    !onSave ||
    READ_ONLY_FIELD_TYPES.has(type) ||
    type === "file";
  const text = propertyString(value);
  // On an editable value the mark sits beside the edit button, not in it: a control in a control
  // has no tab stop of its own, and the value's clipped line would cut its target. Its margin keeps
  // the two 24px targets apart: a short value's button has none to spare.
  const beside =
    mark && text !== "" ? (
      <ValueMark
        mark={mark}
        side={mark.side ?? "end"}
        tabIndex={managed ? -1 : undefined}
        className={mark.side === "start" ? "me-1.5" : "ms-1.5"}
      />
    ) : null;
  const shownEmpty = (
    <span
      data-slot="field-property-empty"
      className="text-sm text-muted-foreground"
    >
      {emptyText}
    </span>
  );
  let body: React.ReactNode;
  if (type === "checkbox")
    body = (
      <CheckboxProperty
        label={label}
        value={value}
        onSave={still ? undefined : onSave}
        saveErrorToast={saveErrorToast}
        managed={managed}
        mark={mark}
      />
    );
  else if (!still && LINKED_PROPERTY_TYPES.has(type))
    body = (
      <LinkedProperty
        label={label}
        type={type}
        value={value}
        config={config}
        onSave={onSave!}
        emptyText={emptyText}
        saveErrorToast={saveErrorToast}
        managed={managed}
        editing={editing}
        setEditing={setEditing}
        mark={mark}
      />
    );
  else if (still)
    body =
      text === "" ? (
        shownEmpty
      ) : (
        <FieldCellDisplay
          type={type}
          value={value}
          config={config}
          align="start"
          mark={mark}
        />
      );
  else
    body = (
      <EditableCell
        variant="inline"
        label={label}
        value={text}
        emptyText={emptyText}
        focusMode={focusMode}
        readOnlyHint={readOnlyHint}
        leading={mark?.side === "start" ? beside : undefined}
        trailing={mark?.side === "start" ? undefined : beside}
        saveErrorToast={saveErrorToast}
        editing={editing}
        editSeed={seed}
        onNavigate={(direction, via) => {
          if (via === "tab") move.current = direction;
        }}
        onEditingChange={(open) => {
          setEditing(open);
          if (!open) setSeed(undefined);
        }}
        renderValue={(shown) => (
          // The value sits inside the edit button: its links and chips take a pointer click (they
          // open, they don't edit) but are no tab stops — Enter edits, as in a grid cell.
          <TruncationFocusProvider focusable={false}>
            <FieldCellDisplay
              type={type}
              value={propertyValue(shown)}
              config={config}
              align="start"
            />
          </TruncationFocusProvider>
        )}
        editor={{
          type: "custom",
          render: (slot) =>
            type === "long_text" ? (
              <LongTextPropertyEditor
                label={label}
                value={propertyValue(slot.value)}
                seed={slot.seed}
                config={config}
                onCommit={(next) => slot.commit(propertyString(next))}
                onCancel={slot.cancel}
              />
            ) : (
              <FieldCellEditor
                type={type}
                label={label}
                value={propertyValue(slot.value)}
                config={config}
                seed={slot.seed}
                onCommit={(next, keyMove) =>
                  slot.commit(propertyString(next), keyMove)
                }
                onCancel={slot.cancel}
              />
            ),
        }}
        onSave={(next) => onSave(propertyValue(next))}
      />
    );
  return (
    <PropertyRow
      data-slot="field-property"
      data-type={type}
      data-read-only={still ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        // On a phone (below 40rem) the value goes full width under its label, in either variant.
        "max-sm:grid-cols-1 max-sm:gap-y-0.5 max-sm:group-data-[variant=inline]/property-list:grid-cols-1",
        disabled && "opacity-50",
        className,
      )}
    >
      <PropertyLabel icon={icon}>{label}</PropertyLabel>
      <PropertyValue
        ref={valueRef}
        className={cn(
          // A conflict note takes its own line under the value, in a flex (inline) value too.
          "flex-wrap",
          // The quiet hover wash on an editable value, as a ghost picker in a task's properties.
          !readOnlyHint &&
            "[&>[data-slot=editable-cell]_[data-slot=editable-cell-display]]:transition-colors [&>[data-slot=editable-cell]_[data-slot=editable-cell-display]]:state-layer",
          // While editing, the cell editor (or long text's in-place editor) takes the value's full
          // width, and its box — a 32px field, a 36px choice picker — hangs over the line and past
          // the column's start by its padding and border (as a select trigger's does), so its text
          // stays where the resting value's text was and the row keeps its height.
          "[&>[data-slot=editable-cell]:has(>[data-slot=field-cell-editor])]:w-full [&>[data-slot=editable-cell]:has(>[data-slot=field-property-long-text])]:w-full",
          "[&>[data-slot=editable-cell]>[data-slot=field-cell-editor]]:-ms-[calc(var(--spacing)*2.5+1px)]",
          // A one-character value ("2") is still a 24px target.
          "[&>[data-slot=editable-cell]_[data-slot=editable-cell-display]]:min-w-6",
          type === "single_choice" || type === "multi_choice"
            ? "[&>[data-slot=editable-cell]>[data-slot=field-cell-editor]]:-mt-2 [&>[data-slot=editable-cell]>[data-slot=field-cell-editor]]:-mb-1"
            : "[&>[data-slot=editable-cell]>[data-slot=field-cell-editor]]:-mt-1.5 [&>[data-slot=editable-cell]>[data-slot=field-cell-editor]]:-mb-0.5",
        )}
        onKeyDown={
          still ||
          editing ||
          type === "checkbox" ||
          LINKED_PROPERTY_TYPES.has(type)
            ? undefined
            : (event) => {
                // Type-to-edit: a character typed on the resting value opens the editor from it.
                if (
                  event.target instanceof HTMLElement &&
                  event.target.closest("[data-slot=editable-cell-display]") &&
                  isPropertyTypingKey(event)
                ) {
                  event.preventDefault();
                  setSeed(event.key);
                  setEditing(true);
                }
              }
        }
      >
        {body}
        {conflict ? (
          <p
            data-slot="field-property-conflict"
            role="status"
            className="mt-1 basis-full text-xs text-warning-text"
          >
            {conflict === true ? "Someone changed this field." : conflict}
          </p>
        ) : null}
      </PropertyValue>
    </PropertyRow>
  );
}
