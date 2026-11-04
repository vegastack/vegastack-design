"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/recurrence-picker` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  RecurrencePicker,
  type RecurrencePickerView,
  type RecurrencePreset,
  type RecurrenceValue,
  type Weekday,
} from "@/components/ui/recurrence-picker";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------------------------------------
 * The HOST's half, written here only so the examples run: the picker never computes a date. A real
 * app turns the value into an RRULE and asks its server for the next dates (debounced); these
 * pages are statically exported, so the anchor day and the formatting are fixed (UTC, en-GB)
 * rather than read from the reader's clock.
 * ----------------------------------------------------------------------------------------------*/

/** The record's due date: Monday 9 November 2026, the month's second Monday. */
const ANCHOR = Date.UTC(2026, 10, 9);
const DAY = 24 * 60 * 60 * 1000;
const WEEK: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const NEVER = { kind: "never" } as const;

const formatDay = (time: number) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(time)
    .replace(",", "");

function onMonthRule(rule: RecurrenceValue["month"], date: Date) {
  const day = date.getUTCDate();
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  if (!rule || rule.kind === "day") {
    const want = rule?.kind === "day" ? rule.day : 9;
    return day === Math.min(want, last);
  }
  if (rule.kind === "last_day") return day === last;
  if (WEEK[date.getUTCDay()] !== rule.weekday) return false;
  return rule.ordinal === -1
    ? day + 7 > last
    : Math.ceil(day / 7) === rule.ordinal;
}

/** The next three dates of `value` from the anchor — the host's job, done crudely for the docs. */
function nextDates(value: RecurrenceValue | null, count = 3): string[] {
  if (!value) return [];
  const anchor = new Date(ANCHOR);
  const found: string[] = [];
  let seen = 0;
  for (let i = 0; i < 366 * 4 && found.length < count; i++) {
    const time = ANCHOR + i * DAY;
    const date = new Date(time);
    if (value.ends.kind === "on" && formatIso(time) > value.ends.date) break;
    const months =
      (date.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
      date.getUTCMonth() -
      anchor.getUTCMonth();
    const hit =
      value.freq === "daily"
        ? i % value.interval === 0
        : value.freq === "weekly"
          ? Math.floor(i / 7) % value.interval === 0 &&
            (value.weekdays ?? ["MO"]).includes(WEEK[date.getUTCDay()]!)
          : value.freq === "monthly"
            ? months % value.interval === 0 && onMonthRule(value.month, date)
            : months % (12 * value.interval) === 0 &&
              date.getUTCDate() === anchor.getUTCDate();
    if (!hit) continue;
    seen++;
    if (value.ends.kind === "after" && seen > value.ends.count) break;
    found.push(formatDay(time));
  }
  return found;
}

const formatIso = (time: number) => new Date(time).toISOString().slice(0, 10);

const PRESETS: RecurrencePreset[] = [
  {
    id: "daily",
    label: "Every day",
    value: { freq: "daily", interval: 1, ends: NEVER },
  },
  {
    id: "weekdays",
    label: "Every weekday (Mon–Fri)",
    value: {
      freq: "weekly",
      interval: 1,
      weekdays: ["MO", "TU", "WE", "TH", "FR"],
      ends: NEVER,
    },
  },
  {
    id: "weekly",
    label: "Every week on Monday",
    value: { freq: "weekly", interval: 1, weekdays: ["MO"], ends: NEVER },
  },
  {
    id: "monthly",
    label: "Every month on the 9th",
    value: {
      freq: "monthly",
      interval: 1,
      month: { kind: "day", day: 9 },
      ends: NEVER,
    },
  },
  {
    id: "monthly-nth",
    label: "Every month on the second Monday",
    value: {
      freq: "monthly",
      interval: 1,
      month: { kind: "weekday", ordinal: 2, weekday: "MO" },
      ends: NEVER,
    },
  },
  {
    id: "yearly",
    label: "Every year on 9 Nov",
    value: { freq: "yearly", interval: 1, ends: NEVER },
  },
];

const PRIMARY: Record<string, string> = {
  daily: "Repeat daily",
  weekdays: "Repeat on weekdays",
  weekly: "Repeat weekly",
  monthly: "Repeat monthly",
  "monthly-nth": "Repeat monthly",
  yearly: "Repeat yearly",
};

const sameRule = (a: RecurrenceValue, b: RecurrenceValue) =>
  JSON.stringify({ ...a, weekdays: a.weekdays?.slice().sort() }) ===
  JSON.stringify({ ...b, weekdays: b.weekdays?.slice().sort() });

/** The host's names for the rule: the button that saves it and the property's summary. */
function describeRule(
  value: RecurrenceValue | null,
  view: RecurrencePickerView,
) {
  if (!value) return { primary: "Save", summary: "Doesn't repeat" };
  const preset = PRESETS.find((p) => sameRule(p.value, value));
  if (preset && view === "presets")
    return { primary: PRIMARY[preset.id]!, summary: String(preset.label) };
  const unit = {
    daily: "day",
    weekly: "week",
    monthly: "month",
    yearly: "year",
  }[value.freq];
  return {
    primary: "Save repeat",
    summary:
      value.interval === 1
        ? `Every ${unit}`
        : `Every ${value.interval} ${unit}s`,
  };
}

function TimeZoneLine({ change = true }: { change?: boolean }) {
  return (
    <>
      Times in Asia/Kolkata
      {change ? (
        <>
          <span aria-hidden>·</span>
          <Button variant="link" size="xs" className="px-0">
            Change
          </Button>
        </>
      ) : null}
    </>
  );
}

/** The popover body plus its title and footer, around a draft the host commits on save. */
function RepeatPopover({
  value,
  onSave,
  extra,
}: {
  value: RecurrenceValue | null;
  onSave: (value: RecurrenceValue | null) => void;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [view, setView] = useState<RecurrencePickerView>("presets");
  const { summary } = describeRule(value, "presets");
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(value);
          setView("presets");
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="-ms-2 font-normal data-[empty]:text-muted-foreground"
            data-empty={value ? undefined : ""}
          >
            {summary}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        size={view === "custom" ? "lg" : "default"}
        className="gap-3"
      >
        <PopoverHeader>
          <PopoverTitle>
            {view === "custom" ? "Custom repeat" : "Repeat"}
          </PopoverTitle>
        </PopoverHeader>
        <RecurrencePicker
          value={draft}
          onChange={setDraft}
          noneLabel="Doesn't repeat"
          presets={PRESETS}
          view={view}
          onViewChange={setView}
          preview={nextDates(draft)}
          timeZoneLabel={<TimeZoneLine />}
          extra={extra}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(draft);
              setOpen(false);
            }}
          >
            {view === "custom"
              ? "Save repeat"
              : describeRule(draft, view).primary}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The Repeat property: presets in the default popover; Custom… grows it to `lg`. */
export function recurrencePicker(): ReactNode {
  const [value, setValue] = useState<RecurrenceValue | null>(PRESETS[2]!.value);
  return (
    <Wrapper className="items-start">
      <PropertyList className="w-full max-w-80">
        <PropertyRow>
          <PropertyLabel>Due</PropertyLabel>
          <PropertyValue>Mon 9 Nov</PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Repeat</PropertyLabel>
          <PropertyValue>
            <RepeatPopover value={value} onSave={setValue} />
          </PropertyValue>
        </PropertyRow>
      </PropertyList>
    </Wrapper>
  );
}

/** The app's own fields in the `extra` slot: they sit between Ends and the preview. */
function CreateFields() {
  const [lead, setLead] = useState("due");
  const [mode, setMode] = useState("schedule");
  const leads = [
    { value: "due", label: "On its due date" },
    { value: "1d", label: "1 day before" },
    { value: "3d", label: "3 days before" },
    { value: "1w", label: "1 week before" },
  ];
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
      <Label id="create-each" className="h-8 text-muted-foreground">
        Create each task
      </Label>
      <Select
        items={leads}
        value={lead}
        onValueChange={(next) => setLead(next as string)}
      >
        <SelectTrigger aria-labelledby="create-each" className="w-fit min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {leads.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span
        id="create-next"
        className="flex h-8 items-center text-sm leading-none font-medium text-muted-foreground"
      >
        Create the next one
      </span>
      <RadioGroup
        aria-labelledby="create-next"
        value={mode}
        onValueChange={(next) => setMode(next as string)}
        className="gap-2"
      >
        <div className="flex min-h-8 items-center gap-2.5">
          <RadioGroupItem id="create-schedule" value="schedule" />
          <Label htmlFor="create-schedule" className="font-normal">
            On schedule
          </Label>
        </div>
        <div className="flex min-h-8 items-center gap-2.5">
          <RadioGroupItem id="create-done" value="done" />
          <Label htmlFor="create-done" className="font-normal">
            When this one is done
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

/** A popover-shaped panel, so a state is visible without opening anything. */
function Panel({
  title,
  wide,
  children,
}: {
  title: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={
        wide
          ? "flex w-full max-w-96 flex-col gap-3 rounded-lg border border-border bg-popover p-2.5 text-sm text-popover-foreground shadow-md"
          : "flex w-full max-w-72 flex-col gap-3 rounded-lg border border-border bg-popover p-2.5 text-sm text-popover-foreground shadow-md"
      }
    >
      <p className="font-heading text-base font-medium">{title}</p>
      {children}
    </section>
  );
}

/** The custom editor at the `lg` width, with the app's fields in `extra`. */
export function recurrencePickerCustom(): ReactNode {
  const [value, setValue] = useState<RecurrenceValue | null>({
    freq: "weekly",
    interval: 2,
    weekdays: ["MO", "TH"],
    ends: NEVER,
  });
  return (
    <Wrapper>
      <Panel title="Custom repeat" wide>
        <RecurrencePicker
          value={value}
          onChange={setValue}
          presets={PRESETS}
          view="custom"
          preview={nextDates(value)}
          timeZoneLabel={<TimeZoneLine />}
          extra={<CreateFields />}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save repeat</Button>
        </div>
      </Panel>
    </Wrapper>
  );
}

/** Monthly: a day, the nth weekday, or the last day; a day of 29–31 says what short months do. */
export function recurrencePickerMonthly(): ReactNode {
  const [value, setValue] = useState<RecurrenceValue | null>({
    freq: "monthly",
    interval: 1,
    month: { kind: "day", day: 31 },
    ends: { kind: "after", count: 10 },
  });
  return (
    <Wrapper>
      <Panel title="Custom repeat" wide>
        <RecurrencePicker
          value={value}
          onChange={setValue}
          presets={PRESETS}
          view="custom"
          preview={nextDates(value)}
          locale="en-GB"
        />
      </Panel>
    </Wrapper>
  );
}

/** Loading (three chip skeletons), an error with the host's retry, and disabled. */
export function recurrencePickerStates(): ReactNode {
  const value = PRESETS[2]!.value;
  return (
    <Wrapper className="items-start">
      <Panel title="Loading">
        <RecurrencePicker
          value={value}
          onChange={() => {}}
          noneLabel="Doesn't repeat"
          presets={PRESETS.slice(0, 3)}
          preview={[]}
          previewLoading
          timeZoneLabel={<TimeZoneLine change={false} />}
        />
      </Panel>
      <Panel title="Error">
        <RecurrencePicker
          value={value}
          onChange={() => {}}
          noneLabel="Doesn't repeat"
          presets={PRESETS.slice(0, 3)}
          preview={[]}
          previewError={
            <>
              Couldn't load the next dates
              <Button variant="link" size="xs" className="px-0">
                Try again
              </Button>
            </>
          }
          timeZoneLabel={<TimeZoneLine change={false} />}
        />
      </Panel>
      <Panel title="Disabled">
        <RecurrencePicker
          value={value}
          onChange={() => {}}
          noneLabel="Doesn't repeat"
          presets={PRESETS.slice(0, 3)}
          preview={nextDates(value)}
          disabled
        />
      </Panel>
    </Wrapper>
  );
}

const SCHEDULE_PRESETS: RecurrencePreset[] = [
  {
    id: "daily",
    label: "Every day",
    value: { freq: "daily", interval: 1, ends: NEVER },
  },
  {
    id: "weekdays",
    label: "Every weekday",
    value: {
      freq: "weekly",
      interval: 1,
      weekdays: ["MO", "TU", "WE", "TH", "FR"],
      ends: NEVER,
    },
  },
  {
    id: "weekly",
    label: "Every Monday",
    value: { freq: "weekly", interval: 1, weekdays: ["MO"], ends: NEVER },
  },
];

/** A schedule: `showTime` adds the time of day, and a preset keeps the time already set. */
export function recurrencePickerTime(): ReactNode {
  const [value, setValue] = useState<RecurrenceValue | null>({
    ...SCHEDULE_PRESETS[2]!.value,
    time: "09:00",
  });
  const at = value?.time ? `, ${value.time}` : "";
  return (
    <Wrapper>
      <Panel title="Run on a schedule">
        <RecurrencePicker
          value={value}
          onChange={setValue}
          presets={SCHEDULE_PRESETS}
          showTime
          hourCycle={24}
          preview={nextDates(value).map((day) => `${day}${at}`)}
          timeZoneLabel={<TimeZoneLine />}
        />
      </Panel>
    </Wrapper>
  );
}

/** On a phone the host's popover becomes a sheet: the same body in a `ResponsiveDialog`. */
export function recurrencePickerDialog(): ReactNode {
  const [value, setValue] = useState<RecurrenceValue | null>(null);
  const [draft, setDraft] = useState<RecurrenceValue | null>(null);
  const [view, setView] = useState<RecurrencePickerView>("presets");
  const [open, setOpen] = useState(false);
  return (
    <Wrapper>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setDraft(value);
            setView("presets");
          }
        }}
      >
        <ResponsiveDialogTrigger
          render={
            <Button variant="outline">
              {describeRule(value, "presets").summary}
            </Button>
          }
        />
        <ResponsiveDialogContent size={view === "custom" ? "md" : "sm"}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {view === "custom" ? "Custom repeat" : "Repeat"}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <RecurrencePicker
              value={draft}
              onChange={setDraft}
              noneLabel="Doesn't repeat"
              presets={PRESETS}
              view={view}
              onViewChange={setView}
              preview={nextDates(draft)}
              timeZoneLabel={<TimeZoneLine change={false} />}
            />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              render={<Button variant="outline">Cancel</Button>}
            />
            <Button
              onClick={() => {
                setValue(draft);
                setOpen(false);
              }}
            >
              {view === "custom"
                ? "Save repeat"
                : describeRule(draft, view).primary}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Wrapper>
  );
}
