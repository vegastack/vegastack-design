// @vegastack time-picker@0.29.3 sha256-bO6N8bAouEJQLRkE0N3Sb9j5XRX2GiE8k8XR5/8cDgU=

"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@vegastack/design";
import { DEFAULT_LOCALE } from "@/lib/date-time";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";

/* ------------------------------------------------------------------------------------------------
 * TimePicker — a time of day, typed or picked. Composed from our `Combobox` parts (an
 * `InputGroup` input with a clock, and a list popup), so it wears the same field chrome, sizes,
 * focus and invalid border as every other text field. The value is `HH:MM` on a 24-hour clock,
 * the same string a native `<input type="time">` holds; the face follows the locale's clock
 * ("9:30 AM" or "09:30"). The list offers the day at `step` minutes; a typed time may fall
 * between steps ("9:37"), and the parsed time is always the first option, so Enter takes it.
 * ----------------------------------------------------------------------------------------------*/

/** A 12-hour or 24-hour clock. */
export type TimePickerHourCycle = "h12" | "h23";

/** One option in the list: the `HH:MM` value and the locale's face for it. */
interface TimeSlot {
  value: string;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The locale's own clock: `h12` where it writes "9:30 AM", `h23` where it writes "09:30". */
function localeHourCycle(locale: string): TimePickerHourCycle {
  const cycle = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).resolvedOptions().hourCycle;
  return cycle === "h11" || cycle === "h12" ? "h12" : "h23";
}

/** "9:30 AM" / "09:30" for `HH:MM`; Intl's narrow no-break spaces become plain spaces. */
function formatTime(
  value: string,
  locale: string,
  hourCycle: TimePickerHourCycle,
) {
  const [h, m] = value.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hourCycle,
    timeZone: "UTC",
  })
    .format(Date.UTC(2000, 0, 1, h ?? 0, m ?? 0))
    .replace(/[  ]/g, " ");
}

/** The locale's AM and PM words, lower-cased ("am"/"pm"; "vorm."/"nachm." in `de`). */
function dayPeriods(locale: string) {
  const period = (hour: number) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      hourCycle: "h12",
      timeZone: "UTC",
    })
      .formatToParts(Date.UTC(2000, 0, 1, hour))
      .find((part) => part.type === "dayPeriod")
      ?.value.toLowerCase() ?? "";
  return { am: period(1), pm: period(13) };
}

/**
 * Reads a typed time: "9", "930", "0930", "9:30", "9:3" (9:30), "9.30", "21:30", with
 * "a"/"am"/"p"/"pm" (or the locale's own words) after it. `""` for an empty field, `null` for text that is not a time.
 * Without AM/PM an hour up to 12 is read as written ("9" is 9 AM, "12" noon).
 */
function parseTime(text: string, locale: string): string | null {
  let rest = text.trim().toLowerCase();
  if (!rest) return "";
  let meridiem: "am" | "pm" | undefined;
  const { am, pm } = dayPeriods(locale);
  for (const [word, kind] of [
    [pm, "pm"],
    [am, "am"],
  ] as const) {
    if (word && rest.endsWith(word)) {
      meridiem = kind;
      rest = rest.slice(0, -word.length);
      break;
    }
  }
  if (!meridiem) {
    const match = /(a|p)\.?\s*(m\.?)?$/.exec(rest);
    if (match) {
      meridiem = match[1] === "p" ? "pm" : "am";
      rest = rest.slice(0, match.index);
    }
  }
  rest = rest.trim();
  let hour: number;
  let minute: number;
  const split = /^(\d{1,2})(?:\s*[:.h\s]\s*(\d{0,2}))?$/.exec(rest);
  const packed = /^(\d{1,2})(\d{2})$/.exec(rest);
  if (split) {
    hour = Number(split[1]);
    // One digit after the separator is the tens ("9:3" is 9:30), as it reads while typing.
    minute = split[2] ? Number(split[2].padEnd(2, "0")) : 0;
  } else if (packed) {
    hour = Number(packed[1]);
    minute = Number(packed[2]);
  } else return null;
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (meridiem === "pm" ? 12 : 0);
  } else if (hour > 23) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

/** Every `step` minutes from midnight, plus `extra` (an off-step value) in its place. */
function daySlots(
  step: number,
  locale: string,
  hourCycle: TimePickerHourCycle,
  extra: string | null | undefined,
): TimeSlot[] {
  const every = Math.min(720, Math.max(1, Math.round(step)));
  const values = new Set<string>();
  for (let at = 0; at < 24 * 60; at += every)
    values.add(`${pad(Math.floor(at / 60))}:${pad(at % 60)}`);
  if (extra) values.add(extra);
  return [...values]
    .sort()
    .map((value) => ({ value, label: formatTime(value, locale, hourCycle) }));
}

/**
 * Whether a slot is a time the typed text can still become. The hour is read on either clock
 * ("9" and "21" both reach 9 PM); one digit is also a prefix ("1" reaches 1, 10, 11 and 12). After
 * a separator, or in a packed "930", the minutes are a prefix ("9:3" reaches 9:30–9:39). AM/PM
 * letters keep only that half of the day.
 */
function slotMatches(slot: TimeSlot, text: string) {
  const lower = text.toLowerCase();
  const pm = /p/.test(lower);
  const am = /a/.test(lower) && !pm;
  const hour = Number(slot.value.slice(0, 2));
  if ((pm && hour < 12) || (am && hour >= 12)) return false;
  const core = lower.replace(/[^\d:.h\s]/g, "").trim();
  const digits = core.replace(/\D/g, "");
  if (!digits) return true;
  const split = /^(\d{1,2})\s*[:.h\s]\s*(\d{0,2})/.exec(core);
  const exact = !!split || digits.length >= 3;
  const typedHour = split?.[1] ?? (exact ? digits.slice(0, -2) : digits);
  const typedMinute = split?.[2] ?? (exact ? digits.slice(-2) : "");
  const hours = [String(hour), String(hour % 12 || 12)];
  const wanted = String(Number(typedHour));
  const hourOk = exact
    ? hours.includes(wanted)
    : hours.some(
        (h) => h === wanted || (typedHour.length === 1 && h.startsWith(wanted)),
      );
  return hourOk && slot.value.slice(3).startsWith(typedMinute);
}

/** Props for `TimePicker`. */
export interface TimePickerProps {
  /**
   * The time, `HH:MM` on a 24-hour clock (`"09:30"`, `"21:00"`), or `null` for none (controlled).
   * @default undefined
   */
  value?: string | null;
  /**
   * Fires with the new `HH:MM` when a time is picked or a typed one is committed (Enter, Tab or
   * leaving the field), and with `null` when the field is emptied.
   * @default undefined
   */
  onValueChange?: (time: string | null) => void;
  /**
   * Minutes between the options in the list. A typed time may fall between them.
   * @default 15
   */
  step?: number;
  /**
   * `h12` ("9:30 AM") or `h23` ("09:30"). Omit it and the locale decides.
   * @default undefined
   */
  hourCycle?: TimePickerHourCycle;
  /**
   * BCP-47 locale for the face and the AM/PM words (defaults to `DEFAULT_LOCALE`, `en-US`, so the
   * server and the browser agree).
   * @default undefined
   */
  locale?: string;
  /**
   * Text shown while there is no time.
   * @default "Pick a time"
   */
  placeholder?: string;
  /**
   * The line in the list when the typed text matches no time.
   * @default "No matching time"
   */
  emptyLabel?: string;
  /** Disable the field.
   * @default undefined
   */
  disabled?: boolean;
  /**
   * `sm` (28px) is the inline tier shared with `DatePicker size="sm"` and `Select size="sm"`.
   * @default "default"
   */
  size?: "sm" | "default";
  /**
   * `ghost` is the inline field: no border at rest, the border on hover and while typing — the
   * same tier as `DatePicker variant="ghost"`.
   * @default "outline"
   */
  variant?: "outline" | "ghost";
  /** Extra classes for the field's root.
   * @default undefined
   */
  className?: string;
  /** `id` for the input, so a `FieldLabel htmlFor` names it.
   * @default undefined
   */
  id?: string;
  /** Accessible name for the input (recommended when there is no visible label).
   * @default undefined
   */
  "aria-label"?: string;
  /** Ids of the elements describing the input — a `FieldDescription` or `FieldError`.
   * @default undefined
   */
  "aria-describedby"?: string;
  /**
   * Marks the field invalid (the destructive border). Typed text that is not a time marks it
   * invalid on its own until it is fixed or the field is left.
   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /** Ref forwarded to the input.
   * @default undefined
   */
  ref?: React.Ref<HTMLInputElement>;
}

/** The inline (`ghost`) field chrome, matching `DatePicker variant="ghost"`. */
const GHOST_FIELD =
  "border-transparent bg-transparent shadow-none hover:border-input dark:bg-transparent";

/**
 * `TimePicker` — a time of day. An input with a clock that you type into ("930", "9:30 pm",
 * "21:30") or open for the day's times every `step` minutes, in the locale's clock. The value is
 * `HH:MM` (24-hour). Leaving the field commits what was typed; text that is not a time goes back
 * to the last value, and Escape reverts at once.
 *
 * @example
 * const [time, setTime] = React.useState<string | null>("09:00");
 * <TimePicker aria-label="Start time" value={time} onValueChange={setTime} />
 *
 * @example
 * // Inline in a table row, every 30 minutes, on a 24-hour clock
 * <TimePicker size="sm" variant="ghost" step={30} hourCycle="h23" value={time} onValueChange={setTime} />
 */
export function TimePicker({
  value,
  onValueChange,
  step = 15,
  hourCycle: hourCycleProp,
  locale = DEFAULT_LOCALE,
  placeholder = "Pick a time",
  emptyLabel = "No matching time",
  disabled,
  size = "default",
  variant = "outline",
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ref,
}: TimePickerProps) {
  const hourCycle = hourCycleProp ?? localeHourCycle(locale);
  const current = value || null;
  const slots = React.useMemo(
    () => daySlots(step, locale, hourCycle, current),
    [step, locale, hourCycle, current],
  );
  const selected = slots.find((slot) => slot.value === current) ?? null;
  // What is being typed; `null` while the field shows the value's own face.
  const [draft, setDraft] = React.useState<string | null>(null);
  const parsed = draft == null ? undefined : parseTime(draft, locale);
  const typedInvalid = draft != null && parsed === null;

  const options = React.useMemo(() => {
    if (draft == null || !draft.trim()) return slots;
    // Text that is not a time offers nothing ("No matching time").
    if (!parsed) return [];
    const matches = slots.filter((slot) => slotMatches(slot, draft));
    // The parsed time leads, so Enter takes exactly what was typed.
    const typed = slots.find((slot) => slot.value === parsed) ?? {
      value: parsed,
      label: formatTime(parsed, locale, hourCycle),
    };
    return [typed, ...matches.filter((slot) => slot.value !== parsed)];
  }, [draft, parsed, slots, locale, hourCycle]);

  const commit = (next: string | null) => {
    setDraft(null);
    if (next !== current) onValueChange?.(next);
  };
  /** Leaving or Enter with nothing highlighted: take the typed time, or go back. */
  const commitDraft = () => {
    if (draft == null) return;
    if (parsed === "") commit(null);
    else if (parsed) commit(parsed);
    else setDraft(null);
  };
  const highlighted = React.useRef<TimeSlot | undefined>(undefined);

  // On open, the list scrolls to the value (else 09:00) instead of starting at midnight.
  const scrollToCurrent = React.useCallback(
    (list: HTMLDivElement | null) => {
      if (!list) return;
      const target = current ?? "09:00";
      const items = Array.from(
        list.querySelectorAll<HTMLElement>("[data-time]"),
      );
      const item =
        items.find((el) => (el.dataset.time ?? "") >= target) ?? items.at(-1);
      if (item)
        list.scrollTop =
          item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2;
    },
    [current],
  );

  return (
    <div
      data-slot="time-picker"
      data-size={size}
      data-variant={variant}
      data-empty={current ? undefined : ""}
      className={cn("relative w-full min-w-0", className)}
    >
      <Combobox
        items={slots}
        filteredItems={options}
        filter={null}
        value={selected}
        isItemEqualToValue={(item: TimeSlot, other: TimeSlot) =>
          item.value === other.value
        }
        itemToStringLabel={(item: TimeSlot) => item.label}
        inputValue={draft ?? selected?.label ?? ""}
        onInputValueChange={(text, details) => {
          // Typing edits the draft; anything else (a pick, Escape, a close) shows the value again.
          if (details.reason === "input-change") setDraft(text);
          else setDraft(null);
        }}
        // A pick reports its time; emptying the input clears the selection, which reports `null`.
        onValueChange={(slot: TimeSlot | null) => commit(slot?.value ?? null)}
        onItemHighlighted={(slot: TimeSlot | undefined) => {
          highlighted.current = slot;
        }}
        autoHighlight
        disabled={disabled}
      >
        <ComboboxInput
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || typedInvalid || undefined}
          placeholder={placeholder}
          disabled={disabled}
          showTrigger={false}
          autoComplete="off"
          inputMode="text"
          className={cn(
            "w-full",
            size === "sm" && "h-7",
            variant === "ghost" && GHOST_FIELD,
            // The input fills the group's height, so the `sm` tier is one 28px box.
            "[&>input]:h-full [&>input]:text-sm [&>input]:tabular-nums",
          )}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !highlighted.current &&
              draft != null
            ) {
              event.preventDefault();
              commitDraft();
            }
          }}
        >
          <InputGroupAddon align="inline-start">
            <Clock aria-hidden />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent data-slot="time-picker-content">
          <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
          <ComboboxList ref={scrollToCurrent}>
            {(slot: TimeSlot) => (
              <ComboboxItem
                key={slot.value}
                value={slot}
                data-time={slot.value}
                className="tabular-nums"
              >
                {slot.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
