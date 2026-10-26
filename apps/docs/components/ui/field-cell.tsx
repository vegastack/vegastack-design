// @vegastack field-cell@0.25.79 sha256-Zb+QTfzdoPT2QwhbzRApxgBuA0gzVxlc4RQskNZdmXk=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import type { EditableCellMove } from "@/components/ui/editable-cell";
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
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useTimeZone } from "@/components/ui/relative-time";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, TagGroup } from "@/components/ui/tag-group";
import { TextEdit, type TextEditHandle } from "@/components/ui/text-edit";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TruncatedText,
  useTruncationFocusable,
} from "@/components/ui/truncated-text";
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
} from "@/lib/date-time";
import { FileKindTile } from "@/lib/file-kind";

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
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            data-slot="field-cell-more"
            tabIndex={tabIndex ?? 0}
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
  /** Extra classes for the root. @default undefined */
  className?: string;
}

/**
 * `FieldCellDisplay` — one field's value, on one line, the way every surface shows it: text that
 * truncates (the full value on hover and keyboard focus), end-aligned tabular numbers in the
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
      className={cn("flex min-w-0 items-center gap-1", extra, className)}
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
      const firstLine = value.split("\n")[0]!;
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
      const ids =
        typeof value === "string"
          ? [value]
          : Array.isArray(value)
            ? (value as string[])
            : [];
      const chosen = ids
        .map((id) => config.options?.find((option) => option.id === id))
        .filter((option): option is FieldChoiceOption => option != null);
      if (chosen.length === 0) return empty;
      return root(
        <TagGroup max={2} className="min-w-0 flex-nowrap overflow-hidden">
          {chosen.map((option) => (
            <Tag key={option.id} hue={option.hue ?? "neutral"}>
              {/* A clipped name is revealed on hover and on keyboard focus. */}
              {/* A clipped name becomes a tab stop: never under the 24px target floor. */}
              <TruncatedText className="min-w-6">{option.label}</TruncatedText>
            </Tag>
          ))}
        </TagGroup>,
      );
    }
    case "checkbox":
      return root(
        <Checkbox
          checked={value === true}
          readOnly={!onToggle}
          tabIndex={onToggle ? tabIndex : -1}
          aria-label={value === true ? "Checked" : "Unchecked"}
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
      className="flex min-w-0 flex-wrap items-center gap-2"
    >
      <DatePicker
        id={id}
        size="sm"
        aria-label="Date"
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
        className="h-7 w-28"
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
        renderItem: (option: FieldChoiceOption) => (
          <Tag hue={option.hue ?? "neutral"}>{option.label}</Tag>
        ),
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
  now: Date = new Date(),
): string | undefined {
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
 * commit on <kbd>Enter</kbd> or when focus leaves the editor; pickers (date, choice, person, link)
 * commit on choosing; long text opens the `TextEdit` editor in a popover
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
  // Type-to-edit replaces the value: long text and a typed date start from the key itself.
  const [draft, setDraft] = React.useState<FieldValue>(() =>
    seed && type === "long_text"
      ? markdownLiteral(seed)
      : seed && typedDate
        ? seed
        : value,
  );
  const done = React.useRef(false);
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
    // Long text edits in a popover outside the cell: its editor takes the caret, however the
    // editor was opened (Enter, F2, a click).
    if (type === "long_text") {
      // The popover mounts its content a frame or two after the editor: focus it once it is there.
      let frame = 0;
      let tries = 0;
      // Keys typed before the editor is there join the draft it opens with, so none is lost.
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
      document.addEventListener("keydown", keep, true);
      const focusText = () => {
        if (longText.current) {
          stopKeeping();
          // A seeded editor holds only the typed keys: the caret goes after them, so the next
          // keys follow.
          longText.current.focus(seed ? "end" : undefined);
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
  const typedDay = typedText ? parseTypedDay(typedText) : undefined;
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
      {typedDate ? (
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
