// @vegastack field-cell@0.25.104 sha256-h4+R5cHCQbCaENPcX6wnBcFkYqXxhE3We8vqwVlnZUs=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  EditableCell,
  type EditableCellMove,
} from "@/components/ui/editable-cell";
import { InlineChip, useInlineChipResolver } from "@/components/ui/inline-chip";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import {
  PeoplePicker,
  type PeoplePickerOption,
  type PeoplePickerSearch,
} from "@/components/ui/people-picker";
import { PersonAvatar } from "@/components/ui/person-avatar";
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
import { useTimeZone } from "@/components/ui/relative-time";
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
import type { ChipHue } from "@/components/ui/chip";
import {
  formatCalendarDate,
  formatDateTime,
  parseCalendarDay,
  toCalendarDay,
  zonedToday,
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
  /** A text field's most characters. @default 10000 */
  maxLength?: number;
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

/** Number formatting per type, in the reader's locale. */
function formatNumber(type: FieldType, value: number, config: FieldConfig) {
  const digits =
    config.decimals == null
      ? {}
      : {
          minimumFractionDigits: config.decimals,
          maximumFractionDigits: config.decimals,
        };
  const options: Intl.NumberFormatOptions =
    type === "currency"
      ? { style: "currency", currency: config.currency ?? "USD", ...digits }
      : type === "percent"
        ? { style: "percent", maximumFractionDigits: 2, ...digits }
        : digits;
  return new Intl.NumberFormat(undefined, options).format(value);
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
  /** Extra classes for the root. @default undefined */
  className?: string;
}

/**
 * `FieldCellDisplay` — one field's value, on one line, the way every surface shows it: text that
 * truncates (the full value on hover and keyboard focus) and a long text's first line as typed (no
 * Markdown escapes, mentions as their names), end-aligned tabular numbers in the
 * reader's locale, a calendar day that never shifts with the zone, coloured choice tags with "+N",
 * a checkbox, people as avatars and names, links as `InlineChip`s in their four states, files as
 * kind tiles, and links out for URLs, emails and phones.
 *
 * @example
 * <FieldCellDisplay type="currency" value={1234.5} config={{ currency: "EUR" }} />
 */
export function FieldCellDisplay({
  type,
  value,
  config = {},
  state = "ready",
  onToggle,
  label,
  align,
  className,
}: FieldCellDisplayProps) {
  const timeZone = useTimeZone();
  // Inside a grid the cell is the tab stop (`TruncationFocusProvider focusable={false}`); a
  // standalone display's checkbox and links are reachable themselves.
  const tabIndex = useTruncationFocusable() ? undefined : -1;
  const root = (children: React.ReactNode, extra?: string) => (
    <span
      data-slot="field-cell-display"
      data-type={type}
      className={cn(
        "flex min-w-0 items-center gap-1",
        extra,
        align === "start" && "justify-start",
        align === "end" && "justify-end",
        className,
      )}
    >
      {children}
    </span>
  );
  if (state === "filling")
    return root(
      <Skeleton data-slot="field-cell-filling" className="h-4 w-3/4" />,
    );
  if (state === "recalculating")
    return root(
      <span className="text-xs text-muted-foreground">Recalculating…</span>,
    );
  const empty = root(null);

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
        );
      }
      return root(
        <TruncatedText className="tabular-nums">
          {formatNumber(type, value, config)}
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
      return typeof value === "string" && value
        ? root(
            <TruncatedText className="tabular-nums">
              {formatCalendarDate(value)}
            </TruncatedText>,
          )
        : empty;
    case "datetime":
    case "created_at":
    case "updated_at":
      return typeof value === "string" && value
        ? root(
            <TruncatedText className="tabular-nums">
              {formatDateTime(value, { timeZone })}
            </TruncatedText>,
          )
        : empty;
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
        // inside the row, so a clipping wrapper (a grid cell's) never cuts it.
        "min-h-6",
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
      );
    case "person":
    case "created_by":
    case "updated_by": {
      const people = (
        Array.isArray(value) ? value : value ? [value] : []
      ) as FieldPerson[];
      if (people.length === 0) return empty;
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
            {value}
          </a>
        ) : (
          <TruncatedText>{value}</TruncatedText>
        ),
      );
    }
    default:
      return empty;
  }
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
}

/** A record search for a link field: async, paged, the host's order (recents first). */
function RecordLinkEditor({
  value,
  config,
  onChange,
  defaultSearch,
  ...a11y
}: {
  value: readonly FieldLinkTarget[];
  config: FieldConfig;
  onChange: (value: FieldLinkTarget[]) => void;
  defaultSearch?: string;
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
      {...a11y}
    />
  );
}

/** An instant's wall-clock day and time in a zone (the reader's, else the browser's). */
function zonedParts(iso: string, timeZone: string | undefined) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** A zone's offset from UTC at an instant, in milliseconds. */
function zoneOffset(instant: number, timeZone: string | undefined) {
  const seen = zonedParts(new Date(instant).toISOString(), timeZone);
  const [y, mo, d] = seen.day.split("-").map(Number);
  const [h, mi] = seen.time.split(":").map(Number);
  return (
    Date.UTC(y!, mo! - 1, d!, h!, mi!) - Math.floor(instant / 60_000) * 60_000
  );
}

/**
 * The instant a wall-clock day and time in a zone names. The zone's offsets either side of the
 * moment give the candidates: one fits on an ordinary day; on the autumn change two do (the hour
 * repeats) and the one sharing `previous`'s offset is kept, else the earlier; on the spring
 * change none does (the hour is skipped) and the time moves forward past the gap.
 */
function fromZoned(
  day: string,
  time: string,
  timeZone: string | undefined,
  previous?: string | null,
) {
  const [y, mo, d] = day.split("-").map(Number);
  const [h, mi] = (time || "00:00").split(":").map(Number);
  const wall = Date.UTC(y!, mo! - 1, d!, h ?? 0, mi ?? 0);
  // Every offset the zone uses within a day either side (zones span UTC−12 to UTC+14), so a
  // change near the moment is seen whichever side of it the wall time falls.
  const offsets = [
    ...new Set(
      Array.from({ length: 31 }, (_, i) =>
        zoneOffset(wall + (i - 15) * 3_600_000, timeZone),
      ),
    ),
  ];
  const wanted = time || "00:00";
  const fits = offsets
    .map((offset) => wall - offset)
    .filter((instant) => {
      const seen = zonedParts(new Date(instant).toISOString(), timeZone);
      return seen.day === day && seen.time === wanted;
    })
    .sort((a, b) => a - b);
  // A skipped time: the offset before a spring change is the smaller one, so the time moves
  // forward past the gap.
  if (fits.length === 0)
    return new Date(wall - Math.min(...offsets)).toISOString();
  const kept =
    previous != null
      ? fits.find(
          (instant) =>
            zoneOffset(instant, timeZone) ===
            zoneOffset(Date.parse(previous), timeZone),
        )
      : undefined;
  return new Date(kept ?? fits[0]!).toISOString();
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
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  "aria-label": string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const timeZone = useTimeZone();
  const current = value ? zonedParts(value, timeZone) : null;
  const commit = (day: string | null, time: string) =>
    onChange(day ? fromZoned(day, time, timeZone, value) : null);
  return (
    <span
      role="group"
      aria-label={ariaLabel}
      data-slot="field-datetime-editor"
      // The date takes what the time leaves, on one line where 8rem of date still fits.
      className="flex w-full min-w-0 flex-wrap items-center gap-2 [&>[data-slot=date-picker]]:w-auto [&>[data-slot=date-picker]]:flex-1 [&>[data-slot=date-picker]]:basis-32"
    >
      <DatePicker
        id={id}
        size="sm"
        aria-label="Date"
        className="w-auto min-w-0 flex-1 basis-32"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        value={current ? parseCalendarDay(current.day) : undefined}
        onValueChange={(day) =>
          commit(day ? toCalendarDay(day) : null, current?.time ?? "09:00")
        }
      />
      <Input
        type="time"
        aria-label="Time"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled || !current}
        value={current?.time ?? ""}
        className="h-7 w-32 max-w-full min-w-0 max-md:w-36"
        onChange={(event) => current && commit(current.day, event.target.value)}
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
}: FieldInputProps) {
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
    case "long_text":
      return (
        <TextEdit
          variant="boxed"
          format="markdown"
          aria-label={ariaLabel}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={config.placeholder}
          value={typeof value === "string" ? value : ""}
          onValueChange={(next) => onChange(next || null)}
          mentions={config.mentions}
          mentionHref={config.mentionHref}
          mentionImage={config.mentionImage}
          minHeight="6rem"
        />
      );
    case "number":
    case "currency":
    case "percent":
      return (
        <NumberField
          {...a11y}
          className={className}
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
        className="h-auto min-h-9 w-full min-w-0 shrink justify-start gap-1 px-2.5 py-1.5 text-start font-normal hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 aria-expanded:bg-transparent dark:hover:bg-transparent"
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
  "datetime",
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

/** Whether the reader's locale writes a numeric date month first ("3/12" is 12 March). */
function monthFirst(): boolean {
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

/** A typed date's pattern, in the reader's locale ("mm/dd/yyyy"): the typed field's hint. */
function typedDatePattern(): string {
  return monthFirst() ? "mm/dd/yyyy" : "dd/mm/yyyy";
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
    return monthFirst() ? day(year, a, b) : day(year, b, a);
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

/** The editors made of several controls, which <kbd>Tab</kbd> steps through before it moves. */
const COMPOUND_TYPES: ReadonlySet<FieldType> = new Set(["datetime"]);

/** The editor's own tab stops, in order. */
function tabStops(root: Element): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), textarea, button, select, [contenteditable="true"], [tabindex]',
    ),
  ].filter((node) => node.tabIndex >= 0 && !node.matches(":disabled"));
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
}: FieldCellEditorProps) {
  // A date opened by typing edits the typed text (a field, not the calendar), committed as the
  // day it names.
  const typedDate = type === "date" && Boolean(seed);
  const timeZone = useTimeZone();
  // Type-to-edit replaces the value: long text and a typed date start from the key itself.
  const [draft, setDraft] = React.useState<FieldValue>(() =>
    seed && type === "long_text"
      ? markdownLiteral(seed)
      : seed && typedDate
        ? seed
        : value,
  );
  const done = React.useRef(false);
  // The draft as of the last change, for a commit scheduled outside a render (a list closing).
  const latest = React.useRef<FieldValue>(draft);
  // A choice option `onCreateOption` is still making.
  const creating = React.useRef<Promise<unknown> | null>(null);
  const choice = type === "single_choice" || type === "multi_choice";
  const multiChoice = type === "multi_choice";
  const root = React.useRef<HTMLSpanElement | null>(null);
  const longText = React.useRef<TextEditHandle | null>(null);
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
    if (!seed && PICKER_TYPES.has(type) && target instanceof HTMLButtonElement)
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
  const typedDay = typedText ? parseTypedDay(typedText, timeZone) : undefined;
  const valid = typedDate
    ? typedText === "" || typedDay !== undefined
    : typeof draft !== "string" || isValidFieldText(type, draft);
  // What a drafted editor commits: a typed date commits the day it names (empty clears it).
  const out: FieldValue = typedDate ? (typedDay ?? null) : draft;

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
          } else commit(text || null);
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
            onSubmit={(next) => commit(next || null)}
            // Escape: TextEdit reverts (and marks the key used); the edit is cancelled.
            onRevert={cancel}
            mentions={config.mentions}
            mentionHref={config.mentionHref}
            mentionImage={config.mentionImage}
            minHeight="6rem"
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <span
      ref={root}
      data-slot="field-cell-editor"
      data-type={type}
      className="flex min-w-0 flex-1 items-center"
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
      onKeyDown={(event) => {
        // A key the control inside already handled is its own.
        if (event.defaultPrevented) return;
        if (event.key === "Enter" && drafted) {
          event.preventDefault();
          event.stopPropagation();
          if (valid) commit(out, event.shiftKey ? "up" : "down");
        } else if (event.key === "Tab") {
          // Tab commits and moves across; in a compound editor (a date-time's date and time) it
          // first steps through its own controls. A number's steppers are not stops.
          if (COMPOUND_TYPES.has(type)) {
            const stops = tabStops(event.currentTarget);
            const at = stops.indexOf(event.target as HTMLElement);
            const next = at + (event.shiftKey ? -1 : 1);
            if (at >= 0 && next >= 0 && next < stops.length) return;
          }
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
      ) : typedDate ? (
        <Input
          type="text"
          inputMode="text"
          autoComplete="off"
          aria-label={label}
          aria-invalid={!valid || undefined}
          placeholder={typedDatePattern()}
          value={typeof draft === "string" ? draft : ""}
          className="h-7 w-full"
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : (
        <FieldInput
          type={type}
          value={draft}
          config={config}
          aria-label={label}
          invalid={!valid}
          defaultSearch={seed && SEARCHED_TYPES.has(type) ? seed : undefined}
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
 * FieldProperty — one field as an editable property row (Regent POL-30)
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
}: {
  label: string;
  value: FieldValue;
  onSave: ((next: FieldValue) => void | Promise<void>) | undefined;
  saveErrorToast: boolean;
  managed: boolean;
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
  onCommit,
  onCancel,
}: {
  label: string;
  value: FieldValue;
  seed?: string;
  config: FieldConfig;
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
  React.useEffect(() => {
    handle.current?.focus("end");
  }, []);
  const finish = (markdown: string) => {
    if (done.current) return;
    done.current = true;
    onCommit(markdown.trim() === "" ? null : markdown);
  };
  return (
    <div
      data-slot="field-property-long-text"
      className="w-full min-w-0"
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
        }}
        escapeBehavior="revert"
        handleRef={handle}
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
          "[&>[data-slot=editable-cell]_[data-slot=editable-cell-display]]:transition-colors [&>[data-slot=editable-cell]_[data-slot=editable-cell-display]]:hover:bg-muted dark:[&>[data-slot=editable-cell]_[data-slot=editable-cell-display]]:hover:bg-muted/50",
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
