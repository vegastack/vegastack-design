# Date and time picker — proposal (P-71 #3)

Status: **proposal, not built.** Waiting on design input from Manoj (comment on Regent P-71 #3).
Nothing in `packages/ui` changes until the anatomy below is agreed.

## Problem

`FieldInput type="datetime"` renders `DateTimeEditor` (`data-slot="field-datetime-editor"`,
`field-cell.tsx`): our `DatePicker` next to a native `<Input type="time">`. The time half is the
browser's own control: its clock icon, its spin segments and its dropdown differ in each browser
and OS, and none of them match the date trigger beside it. Regent's "Date and time" field uses
this editor in four places: the grid cell (`variant="cell"`, inline ghost), the row panel, forms,
and Edit field for all.

What the editor does today, which a replacement must keep:

- The value is an ISO instant. It is shown and edited in the workspace zone (`useTimeZone()`),
  split by `zonedParts` and joined by `fromZoned`. `fromZoned` handles DST: a skipped wall time
  moves forward past the gap, and an ambiguous one keeps the offset the previous value had.
- Picking only a day sets the time to 09:00.
- Time is disabled until there is a day. Clearing the day clears the value.
- The parts are a `role="group"` named by the field. Each part has its own name ("Date", "Time").
  `aria-invalid` and `aria-describedby` reach both.

What upstream offers: shadcn 4.21 ships no time component. Its Calendar docs have a "Date and
Time Picker" example, which is `Calendar` plus `InputGroupInput type="time"` with the picker
indicator hidden. So the time is still native, which is the problem we have now.

## Anatomy: three options

**A. One trigger.** "3 Nov 2026, 9:00 AM" opens one popover with the Calendar and a time list
beside it (below it on a phone). It is compact, and it is the only option that fits a grid cell
on one line. But the time cannot be typed without opening the popover, and a long list beside
the calendar makes the popover wide.

**B. Two segments.** The date trigger (today's `DatePicker`), then a time trigger, "9:00 AM",
which is a combobox. You can type into it ("930", "9:30p", "21:30"), or open it for a list of
times at the minute step, scrolled to the current value. This is how a calendar app's event
editor works. Each half stays small and is typed or picked on its own.

**C. Date trigger + segmented time input.** The time is `hh`:`mm` [`AM`/`PM`] spin-button
segments, edited with the keyboard. It is the most precise for typing, but it is a new input
engine (segment focus, digit buffering, RTL, IME), the most to build and test, and it gives no
list to pick from.

**Recommendation: B for forms, the row panel and Edit field for all. A for `variant="cell"`.**
Both are built from the same parts:

- `TimePicker` (ours, new): an `InputGroup`-styled combobox on Base UI `Combobox`/`Popover`, so
  it takes the select/combobox chrome, sizes (`sm`, `default`) and `outline`/`ghost` variants
  the DS already has. It has no engine of its own.
- `DateTimePicker` (ours, new): `DatePicker` + `TimePicker` in a `role="group"`. Its
  `layout="split"` is B. Its `layout="single"` is A: one trigger, and the popover holds
  `Calendar` with the time list as a second column.

## Behaviour

- **12/24 h** comes from the locale:
  `new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle`. A
  `hourCycle` prop can override it. Text is formatted with `Intl`, never with hand-built
  strings.
- **Minute step**: `step` (minutes) defaults to 15 and sets the list. A typed time may use any
  minute; the list only suggests. Whether to add a `strictStep` is a question for design.
- **Typed entry**: digits with an optional separator and meridiem: "9", "930", "9:30", "9.30p",
  "21:30". Text that does not parse keeps the previous value and marks the field invalid while
  it is focused. It never silently becomes midnight.
- **Default time**: `defaultTime="09:00"` is used when only a day is picked. This is today's
  behaviour, now a prop.
- **Clear**: `clearable` works as on `DatePicker` and clears the whole value. A time with no
  date cannot exist, so the time stays disabled until a day is picked, as today.
- **Time zone**: the value stays an ISO instant, and the zone comes from `useTimeZone()` (or a
  `timeZone` prop). `zonedParts`/`fromZoned` move out of `field-cell.tsx` into one shared
  helper, so DST handling stays in one place. In the list, a skipped hour is left out. A
  repeated hour shows twice, each with its offset ("1:30 AM GMT−4", "1:30 AM GMT−5").

## Keyboard (TimePicker)

| Key                 | Action                                                         |
| ------------------- | -------------------------------------------------------------- |
| Type                | Edit the time; the list filters and highlights the closest one |
| ↓ / ↑               | Open the list, then move by one step                           |
| Page Down / Page Up | Move by an hour                                                |
| Home / End          | First / last time of the day                                   |
| Enter               | Commit the highlighted (or typed) time and close               |
| Escape              | Close; a second Escape reverts what was typed                  |
| Tab                 | Commit what was typed and move on                              |

The Calendar half keeps Calendar's own grid keyboard. In `layout="single"`, Tab moves between
the calendar and the time list inside the popover.

## Accessibility

- The group is named by the field. The parts are named "Date" and "Time" (from `labels`, so they
  can be translated).
- The time list follows the APG combobox pattern: an input with `aria-activedescendant` over a
  `listbox`. The options are named by their text ("9:30 AM").
- The single trigger is named with the field and the full value ("Due, 3 November 2026 at 9:00
  AM"), plus the zone when it differs from the viewer's.
- Invalid and described-by reach every part, as today. Touch targets are ≥24px, and the coarse-
  pointer 44px area comes from Button/Input as it does elsewhere.

## Field-cell swap

`DateTimeEditor`'s internals become `DateTimePicker`: `layout="single"` and `variant="ghost"`
when `inline`, otherwise `layout="split"` and `variant="outline"`. Its props, `onChange(iso |
null)` contract and `data-slot="field-datetime-editor"` stay the same, so Regent only pulls the
registry update. Grid cells, the row panel, forms and Edit field for all change together. The
native `Input type="time"` leaves `field-cell.tsx`.

## Questions for design (Manoj)

1. Is it B in forms and A in cells, or one anatomy everywhere?
2. Is 15 minutes the right default step for Regent, and may a typed time be off-step?
3. Should the time list appear beside the calendar or under it in `layout="single"`? Should it
   be a full day list, or "suggested" times around the current one?
4. Should the zone show on the trigger always, never, or only when it differs from the
   viewer's?
5. Should there be presets in the date popover for date-times ("Tomorrow 9:00", "Next Monday")?

## Not in scope

Time ranges (start–end), durations, seconds, and a time-only field type. Each one can build on
`TimePicker` later, if Regent needs it.
