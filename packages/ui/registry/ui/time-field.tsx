// @vegastack time-field@0.39.0 sha256-66tNkBZSVnNW+UIHfPIQOHZctNJYktm+K71YOs0olqo=

"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@vegastack/design";
import {
  DEFAULT_LOCALE,
  formatTimeValue,
  localeHourCycle,
  parseTimeOfDay,
} from "@/lib/date-time";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

/* ------------------------------------------------------------------------------------------------
 * TimeField — a time of day, `"HH:mm"` (24-hour) in and out, shown on the locale's clock ("9:30 AM"
 * or "09:30"). Type it ("930", "9:30 pm", "21:30") and Enter or leave the field to set it; the
 * arrow keys step it by `step` minutes, snapping to the step's grid. A spin button: the value is
 * minutes since midnight, read out as the formatted time.
 *
 * Presentational and zone-free: it holds a wall-clock time, never an instant. The host decides
 * which zone the time is in and says so (a `RecurrencePicker`'s time-zone line, a field hint).
 * ----------------------------------------------------------------------------------------------*/

const DAY_MINUTES = 24 * 60;

/** `"HH:mm"` → minutes since midnight; `null` for anything that is not a 24-hour time. */
function toMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Minutes since midnight → `"HH:mm"`. */
function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Props for `TimeField`. */
export interface TimeFieldProps {
  /** The time, `"HH:mm"` on a 24-hour clock; `null` for none. */
  value: string | null;
  /** Fires with the new time (`"HH:mm"`), or `null` when the field is cleared. */
  onChange: (value: string | null) => void;
  /**
   * Minutes the arrow keys move the time; it snaps to this grid (15 → :00, :15, :30, :45), so
   * 23:45 is the last stop unless `max` says otherwise. A typed time may fall between steps.
   * @default 15
   */
  step?: number;
  /**
   * `12` shows "9:30 AM", `24` shows "09:30". Omit it and the locale decides.
   * @default undefined
   */
  hourCycle?: 12 | 24;
  /**
   * The earliest time, `"HH:mm"`; an earlier one is raised to it.
   * @default undefined
   */
  min?: string;
  /**
   * The latest time, `"HH:mm"`; a later one is lowered to it. It is not before `min`: an overnight
   * window ("22:00" to "06:00") is not a range this field holds.
   * @default undefined
   */
  max?: string;
  /** Disable the field.
   * @default false
   */
  disabled?: boolean;
  /** BCP-47 locale for the clock and for reading AM/PM words.
   * @default "en-US"
   */
  locale?: string;
  /** Text shown in the empty field.
   * @default undefined
   */
  placeholder?: string;
  /** The field's accessible name, when no `<label>` names it.
   * @default undefined
   */
  "aria-label"?: string;
  /** Ids of the elements naming the field.
   * @default undefined
   */
  "aria-labelledby"?: string;
  /** Ids of the elements describing the field — a hint or an error.
   * @default undefined
   */
  "aria-describedby"?: string;
  /** Marks the field invalid (the destructive border).
   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /** `id` for the input, so a `Label htmlFor` names it.
   * @default undefined
   */
  id?: string;
  /** Classes for the bordered box (its width: `w-36` by default).
   * @default undefined
   */
  className?: string;
  /** Ref forwarded to the input.
   * @default undefined
   */
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * `TimeField` — a time of day as one typed field with a clock icon. The value is `"HH:mm"`
 * (24-hour) whatever the display: `hourCycle={12}` shows "9:30 AM", `24` shows "09:30", and the
 * locale decides when it is left out. Typing accepts "9", "930", "9:30", "9.30 pm", "21:30";
 * <kbd>Enter</kbd> or leaving the field sets it, a time outside `min`/`max` is moved inside, and
 * text that is not a time is marked invalid until it is fixed or left (then the field shows the
 * value again). <kbd>↑</kbd>/<kbd>↓</kbd> step by `step` minutes, <kbd>Page Up</kbd>/<kbd>Page
 * Down</kbd> by an hour, and <kbd>Home</kbd>/<kbd>End</kbd> jump to `min`/`max` when they are set.
 *
 * @example
 * const [time, setTime] = React.useState<string | null>("09:00");
 * <TimeField aria-label="Time" value={time} onChange={setTime} />
 *
 * @example
 * <TimeField aria-label="Start" value={start} onChange={setStart} step={30} hourCycle={24} min="08:00" max="18:00" />
 */
export function TimeField({
  value,
  onChange,
  step = 15,
  hourCycle: hourCycleProp,
  min,
  max,
  disabled = false,
  locale = DEFAULT_LOCALE,
  placeholder,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  id,
  className,
  ref,
}: TimeFieldProps) {
  const cycle =
    hourCycleProp === 12
      ? "h12"
      : hourCycleProp === 24
        ? "h23"
        : localeHourCycle(locale);
  const every = Math.min(720, Math.max(1, Math.round(step) || 15));
  const minMinutes = toMinutes(min) ?? 0;
  const maxMinutes = Math.max(minMinutes, toMinutes(max) ?? DAY_MINUTES - 1);
  const current = toMinutes(value);
  const clamp = (minutes: number) =>
    Math.min(maxMinutes, Math.max(minMinutes, minutes));
  // Stepping stays on the grid: without a `max` the last stop is 23:45, not 23:59.
  const lastStep =
    max != null ? maxMinutes : Math.floor(maxMinutes / every) * every;

  // What is typed: `null` while the field shows the value itself.
  const [draft, setDraft] = React.useState<string | null>(null);
  const parsed = draft == null ? undefined : parseTimeOfDay(draft, locale);
  const draftInvalid = draft != null && parsed === null;

  const emit = (next: string | null) => {
    if (next !== value) onChange(next);
  };

  /** Set what is typed: a time (moved inside min/max), `""` clears, other text is dropped. */
  const commit = () => {
    if (draft == null) return;
    if (parsed === "") emit(null);
    else if (parsed) {
      const minutes = toMinutes(parsed);
      if (minutes != null) emit(fromMinutes(clamp(minutes)));
    }
    setDraft(null);
  };

  /** Move by `delta` minutes on the step grid (an hour for Page Up/Down), inside min/max. */
  const stepBy = (direction: 1 | -1, size: number) => {
    const typed = parsed ? toMinutes(parsed) : null;
    const from = typed ?? current;
    let next: number;
    if (from == null) next = direction > 0 ? minMinutes : lastStep;
    else if (size === every) {
      // Snap onto the grid: 09:07 up is 09:15, down is 09:00.
      next =
        direction > 0
          ? Math.floor(from / every) * every + every
          : Math.ceil(from / every) * every - every;
    } else next = from + direction * size;
    setDraft(null);
    next = Math.min(lastStep, Math.max(minMinutes, next));
    // A typed 23:50 sits past the last step: going up leaves it, it never moves it back.
    if (from != null && direction > 0 && next < from) return;
    emit(fromMinutes(next));
  };

  const shown =
    draft ?? (current != null ? formatTimeValue(value!, locale, cycle) : "");
  const invalid =
    draftInvalid || ariaInvalid === true || ariaInvalid === "true";

  return (
    <InputGroup data-slot="time-field" className={cn("w-36", className)}>
      <InputGroupAddon aria-hidden>
        <Clock />
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        id={id}
        role="spinbutton"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid || undefined}
        aria-valuemin={minMinutes}
        aria-valuemax={maxMinutes}
        aria-valuenow={current ?? undefined}
        aria-valuetext={current != null ? shown : undefined}
        value={shown}
        className="tabular-nums"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          switch (event.key) {
            case "ArrowUp":
              event.preventDefault();
              stepBy(1, every);
              break;
            case "ArrowDown":
              event.preventDefault();
              stepBy(-1, every);
              break;
            case "PageUp":
              event.preventDefault();
              stepBy(1, 60);
              break;
            case "PageDown":
              event.preventDefault();
              stepBy(-1, 60);
              break;
            case "Home":
              // While typing, Home and End move the caret.
              if (min != null && draft == null) {
                event.preventDefault();
                emit(fromMinutes(minMinutes));
              }
              break;
            case "End":
              // While typing, Home and End move the caret.
              if (max != null && draft == null) {
                event.preventDefault();
                emit(fromMinutes(maxMinutes));
              }
              break;
            case "Enter":
              if (draft != null) {
                event.preventDefault();
                // Text that is not a time stays, marked invalid, to be fixed.
                if (!draftInvalid) commit();
              }
              break;
            case "Escape":
              // The first Escape drops what was typed; the next reaches the host (closes a popover).
              if (draft != null) {
                event.preventDefault();
                event.stopPropagation();
                setDraft(null);
              }
              break;
          }
        }}
      />
    </InputGroup>
  );
}
