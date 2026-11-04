import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import {
  RecurrencePicker,
  type RecurrencePickerProps,
  type RecurrencePickerView,
  type RecurrencePreset,
  type RecurrenceValue,
} from "./recurrence-picker";

const NEVER = { kind: "never" } as const;

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
    label: "Every month on the 10th",
    value: {
      freq: "monthly",
      interval: 1,
      month: { kind: "day", day: 10 },
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
    label: "Every year on 10 Nov",
    value: { freq: "yearly", interval: 1, ends: NEVER },
  },
];

/** A controlled picker that records every change and view request. */
function Harness({
  initial,
  initialView,
  onChange,
  onViewChange,
  ...props
}: Omit<RecurrencePickerProps, "value" | "onChange"> & {
  initial: RecurrenceValue | null;
  initialView?: RecurrencePickerView;
  onChange?: (value: RecurrenceValue | null) => void;
}) {
  const [value, setValue] = React.useState(initial);
  const [view, setView] = React.useState<RecurrencePickerView | undefined>(
    initialView,
  );
  return (
    <RecurrencePicker
      noneLabel="Doesn't repeat"
      presets={PRESETS}
      {...props}
      value={value}
      view={view}
      onViewChange={(next) => {
        setView(next);
        onViewChange?.(next);
      }}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const radio = (name: string) => page.getByRole("radio", { name });

/** The unit select's face. */
const unitText = () =>
  document.querySelector(
    "[data-slot=recurrence-picker-unit] [data-slot=select-value]",
  )?.textContent;

/** The cross-fade and the skeleton's delayed reveal are over, so the colours are the real ones. */
const settled = async () => {
  await expect
    .poll(() =>
      document.querySelector("[data-slot=recurrence-picker-preview-outgoing]"),
    )
    .toBeNull();
  await settle();
};

/** Let popups finish closing, so the contrast check reads settled colours. */
const settle = () =>
  Promise.all(
    document
      .getAnimations()
      // The skeleton's pulse never finishes.
      .filter(
        (a) =>
          a.playState === "running" &&
          a.effect?.getTiming().iterations !== Infinity,
      )
      .map((a) => a.finished.catch(() => undefined)),
  );

test("presets: a radio group; the matching preset is checked and choosing one sends its rule", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      // Weekday order doesn't matter: this is the Mon–Fri preset.
      initial={{
        freq: "weekly",
        interval: 1,
        weekdays: ["FR", "MO", "TU", "WE", "TH"],
        ends: NEVER,
      }}
      onChange={onChange}
    />,
  );
  await expect
    .element(page.getByRole("radiogroup", { name: "Repeat" }))
    .toBeInTheDocument();
  expect(page.getByRole("radio").elements()).toHaveLength(8);
  await expect
    .element(radio("Every weekday (Mon–Fri)"))
    .toHaveAttribute("aria-checked", "true");
  await expectNoA11yViolations(document.body);

  await radio("Every week on Monday").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "weekly",
    interval: 1,
    weekdays: ["MO"],
    ends: { kind: "never" },
  });
  await expect
    .element(radio("Every week on Monday"))
    .toHaveAttribute("aria-checked", "true");

  await radio("Doesn't repeat").click();
  expect(onChange).toHaveBeenLastCalledWith(null);
  await expect
    .element(radio("Doesn't repeat"))
    .toHaveAttribute("aria-checked", "true");
});

test("a rule no preset matches checks Custom…; without noneLabel null checks nothing", async () => {
  const screen = await render(
    <Harness
      initial={{ freq: "weekly", interval: 2, weekdays: ["MO"], ends: NEVER }}
    />,
  );
  await expect
    .element(radio("Custom…"))
    .toHaveAttribute("aria-checked", "true");
  await screen.unmount();

  await render(<Harness initial={null} noneLabel={undefined} />);
  expect(page.getByRole("radio").elements()).toHaveLength(7);
  for (const element of page.getByRole("radio").elements())
    expect(element.getAttribute("aria-checked")).toBe("false");
});

test("Custom… asks for the custom editor, starts a rule from the host's weekday and focuses the interval", async () => {
  const onChange = vi.fn();
  const onViewChange = vi.fn();
  await render(
    <Harness initial={null} onChange={onChange} onViewChange={onViewChange} />,
  );
  await radio("Custom…").click();
  expect(onViewChange).toHaveBeenCalledWith("custom");
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "weekly",
    interval: 1,
    weekdays: ["MO"],
    ends: { kind: "never" },
  });
  const interval = page.getByRole("textbox", { name: "Every" });
  await expect.element(interval).toHaveFocus();
  expect(
    document
      .querySelector("[data-slot=recurrence-picker]")
      ?.getAttribute("data-view"),
  ).toBe("custom");
  await expect
    .element(page.getByRole("button", { name: "Monday" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("Custom…, already checked, still opens the editor; keeps the rule", async () => {
  const onChange = vi.fn();
  const onViewChange = vi.fn();
  await render(
    <Harness
      initial={{ freq: "daily", interval: 3, ends: NEVER }}
      onChange={onChange}
      onViewChange={onViewChange}
    />,
  );
  await radio("Custom…").click();
  expect(onViewChange).toHaveBeenCalledWith("custom");
  expect(onChange).not.toHaveBeenCalled();
  await expect
    .element(page.getByRole("textbox", { name: "Every" }))
    .toHaveValue("3");
});

test("custom weekly: weekday buttons named in full, sorted, never empty; interval and unit", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{ freq: "weekly", interval: 2, weekdays: ["TH"], ends: NEVER }}
      initialView="custom"
      onChange={onChange}
    />,
  );
  const group = page.getByRole("group", { name: "On" });
  await expect.element(group).toBeInTheDocument();
  expect(
    group
      .getByRole("button")
      .elements()
      .map((b) => b.getAttribute("aria-label")),
  ).toEqual([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);
  await page.getByRole("button", { name: "Monday" }).click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "weekly",
    interval: 2,
    weekdays: ["MO", "TH"],
    ends: { kind: "never" },
  });
  await page.getByRole("button", { name: "Monday" }).click();
  onChange.mockClear();
  // The last day stays: a weekly rule keeps at least one.
  await page.getByRole("button", { name: "Thursday" }).click();
  expect(onChange).not.toHaveBeenCalled();
  await expect
    .element(page.getByRole("button", { name: "Thursday" }))
    .toHaveAttribute("aria-pressed", "true");

  expect(unitText()).toBe("weeks");
  await page.getByRole("textbox", { name: "Every" }).click();
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "weekly",
    interval: 3,
    weekdays: ["TH"],
    ends: { kind: "never" },
  });
  await expectNoA11yViolations(document.body);
});

test("weekStartsOn={0} puts Sunday first", async () => {
  await render(
    <Harness
      initial={{ freq: "weekly", interval: 1, weekdays: ["MO"], ends: NEVER }}
      initialView="custom"
      weekStartsOn={0}
    />,
  );
  expect(
    page
      .getByRole("group", { name: "On" })
      .getByRole("button")
      .elements()[0]
      ?.getAttribute("aria-label"),
  ).toBe("Sunday");
});

test("custom monthly: the unit seeds the host's day; day, nth weekday and last day; the month-end hint", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{ freq: "weekly", interval: 1, weekdays: ["MO"], ends: NEVER }}
      initialView="custom"
      onChange={onChange}
    />,
  );
  await page.getByRole("combobox", { name: "Unit" }).click();
  await page.getByRole("option", { name: "month" }).click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "monthly",
    interval: 1,
    month: { kind: "day", day: 10 },
    ends: { kind: "never" },
  });
  await expect
    .element(page.getByRole("radiogroup", { name: "On" }))
    .toBeInTheDocument();
  await expect.element(radio("day")).toHaveAttribute("aria-checked", "true");

  await radio("the second Monday").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "monthly",
    interval: 1,
    month: { kind: "weekday", ordinal: 2, weekday: "MO" },
    ends: { kind: "never" },
  });
  await page.getByRole("combobox", { name: "Week of the month" }).click();
  await page.getByRole("option", { name: "last" }).click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "monthly",
    interval: 1,
    month: { kind: "weekday", ordinal: -1, weekday: "MO" },
    ends: { kind: "never" },
  });
  await page.getByRole("combobox", { name: "Day of the week" }).click();
  await page.getByRole("option", { name: "Friday" }).click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "monthly",
    interval: 1,
    month: { kind: "weekday", ordinal: -1, weekday: "FR" },
    ends: { kind: "never" },
  });
  await expect
    .element(radio("the last Friday"))
    .toHaveAttribute("aria-checked", "true");

  await radio("the last day").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "monthly",
    interval: 1,
    month: { kind: "last_day" },
    ends: { kind: "never" },
  });

  // Editing the day selects "day"; 29–31 explain the short months.
  const day = page.getByRole("textbox", { name: "Day of the month" });
  await day.fill("31");
  await day.element().blur();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "monthly",
    interval: 1,
    month: { kind: "day", day: 31 },
    ends: { kind: "never" },
  });
  await expect
    .element(page.getByText("Months without a 31st use their last day"))
    .toBeInTheDocument();
  const hint = document.getElementById(
    day.element().getAttribute("aria-describedby")!,
  );
  expect(hint?.textContent).toBe("Months without a 31st use their last day");
  await settle();
  await expectNoA11yViolations(document.body);
});

test("custom yearly shows no extra row", async () => {
  await render(
    <Harness
      initial={{ freq: "yearly", interval: 1, ends: NEVER }}
      initialView="custom"
    />,
  );
  expect(unitText()).toBe("year");
  expect(page.getByRole("group", { name: "On" }).elements()).toHaveLength(0);
  expect(page.getByRole("radiogroup", { name: "On" }).elements()).toHaveLength(
    0,
  );
});

test("Ends: never, after n times (editing the count selects it), on a day", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{
        freq: "daily",
        interval: 1,
        ends: { kind: "on", date: "2027-03-31" },
      }}
      initialView="custom"
      onChange={onChange}
    />,
  );
  await expect
    .element(page.getByRole("radiogroup", { name: "Ends" }))
    .toBeInTheDocument();
  await expect.element(radio("On")).toHaveAttribute("aria-checked", "true");
  await expect
    .element(page.getByRole("button", { name: "Mar 31, 2027" }))
    .toBeInTheDocument();

  await radio("After 10 times").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "daily",
    interval: 1,
    ends: { kind: "after", count: 10 },
  });
  await radio("Never").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "daily",
    interval: 1,
    ends: { kind: "never" },
  });
  // The day picked before comes back.
  await radio("On").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "daily",
    interval: 1,
    ends: { kind: "on", date: "2027-03-31" },
  });
  const count = page.getByRole("textbox", { name: "Number of times" });
  await count.fill("4");
  await count.element().blur();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "daily",
    interval: 1,
    ends: { kind: "after", count: 4 },
  });
  await expect
    .element(radio("After 4 times"))
    .toHaveAttribute("aria-checked", "true");
  await expectNoA11yViolations(document.body);
});

test("Ends › On with no day yet opens the calendar and changes nothing until a day is picked", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{ freq: "daily", interval: 1, ends: NEVER }}
      initialView="custom"
      onChange={onChange}
    />,
  );
  await radio("On").click();
  await expect.element(page.getByRole("dialog")).toBeVisible();
  expect(onChange).not.toHaveBeenCalled();
  await expect.element(radio("Never")).toHaveAttribute("aria-checked", "true");
  await expect
    .element(page.getByRole("button", { name: "Pick a date" }))
    .toBeInTheDocument();
});

test("preview: chips after Next: in a polite live region; loading skeleton; error; time zone line", async () => {
  const value: RecurrenceValue = {
    freq: "weekly",
    interval: 1,
    weekdays: ["MO"],
    ends: NEVER,
  };
  const props = { value, onChange: () => {}, presets: PRESETS };
  const screen = await render(
    <RecurrencePicker
      {...props}
      preview={["Mon 10 Nov", "Mon 17 Nov", "Mon 24 Nov"]}
      timeZoneLabel="Times in Asia/Kolkata"
    />,
  );
  const region = document.querySelector<HTMLElement>(
    "[data-slot=recurrence-picker-preview]",
  )!;
  expect(region.getAttribute("aria-live")).toBe("polite");
  expect(region.getAttribute("role")).toBe("status");
  expect(region.className).not.toContain("sr-only");
  expect(region.textContent).toBe(
    "Next:Mon 10 Nov, Mon 17 Nov, Mon 24 NovTimes in Asia/Kolkata",
  );
  expect(region.querySelectorAll("[data-slot=badge]")).toHaveLength(3);
  // Nothing fades on first paint.
  expect(
    region.querySelector("[data-slot=recurrence-picker-preview-dates]")
      ?.className,
  ).not.toContain("animate-in");
  await settled();
  await expectNoA11yViolations(document.body);

  await screen.rerender(
    <RecurrencePicker {...props} preview={[]} previewLoading />,
  );
  expect(region.getAttribute("aria-busy")).toBe("true");
  expect(
    region.querySelectorAll(
      "[data-slot=recurrence-picker-preview-loading] [data-slot=skeleton]",
    ),
  ).toHaveLength(3);
  await settled();
  await expectNoA11yViolations(document.body);

  await screen.rerender(
    <RecurrencePicker
      {...props}
      preview={[]}
      previewError={
        <>
          Couldn't load the next dates
          <Button size="xs" variant="link">
            Try again
          </Button>
        </>
      }
    />,
  );
  expect(region.hasAttribute("aria-busy")).toBe(false);
  expect(
    region.querySelector("[data-slot=recurrence-picker-preview-error]")
      ?.textContent,
  ).toBe("Couldn't load the next datesTry again");
  await settled();
  await expectNoA11yViolations(document.body);

  // The region stays mounted, out of the flow, with nothing to show.
  await screen.rerender(<RecurrencePicker {...props} preview={[]} />);
  expect(document.querySelector("[data-slot=recurrence-picker-preview]")).toBe(
    region,
  );
  expect(region.className).toContain("sr-only");
  expect(
    document.querySelector(
      "[data-slot=recurrence-picker] > [data-slot=separator]",
    ),
  ).toBeNull();
});

test("extra sits in the custom editor between Ends and the preview, never in the presets", async () => {
  const extra = <p data-testid="extra">Create each task</p>;
  const screen = await render(
    <Harness
      initial={{ freq: "daily", interval: 1, ends: NEVER }}
      extra={extra}
      preview={["Tue 11 Nov"]}
    />,
  );
  expect(document.querySelector("[data-testid=extra]")).toBeNull();
  await screen.unmount();

  await render(
    <Harness
      initial={{ freq: "daily", interval: 1, ends: NEVER }}
      initialView="custom"
      extra={extra}
      preview={["Tue 11 Nov"]}
    />,
  );
  const slots = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-slot=recurrence-picker] > [data-slot]",
    ),
  ].map((el) => el.dataset.slot);
  expect(slots).toEqual([
    "recurrence-picker-custom",
    "separator",
    "recurrence-picker-extra",
    "separator",
    "recurrence-picker-preview",
  ]);
});

test("showTime: a time row; a preset keeps the time and presets match whatever the time", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{
        freq: "daily",
        interval: 1,
        ends: NEVER,
        time: "09:00",
      }}
      showTime
      hourCycle={24}
      onChange={onChange}
    />,
  );
  await expect
    .element(radio("Every day"))
    .toHaveAttribute("aria-checked", "true");
  const time = page.getByRole("spinbutton", { name: "Time" });
  await expect.element(time).toHaveValue("09:00");
  await radio("Every week on Monday").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "weekly",
    interval: 1,
    weekdays: ["MO"],
    ends: { kind: "never" },
    time: "09:00",
  });
  await time.click();
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "weekly",
    interval: 1,
    weekdays: ["MO"],
    ends: { kind: "never" },
    time: "09:15",
  });
  await expectNoA11yViolations(document.body);
});

test("without presets it is the custom editor alone", async () => {
  await render(
    <Harness
      initial={{ freq: "daily", interval: 1, ends: NEVER }}
      presets={undefined}
      noneLabel={undefined}
    />,
  );
  expect(page.getByRole("radiogroup", { name: "Repeat" }).elements()).toEqual(
    [],
  );
  await expect
    .element(page.getByRole("textbox", { name: "Every" }))
    .toBeInTheDocument();
});

test("labels replace every string", async () => {
  await render(
    <Harness
      initial={{ freq: "weekly", interval: 2, weekdays: ["MO"], ends: NEVER }}
      initialView="custom"
      labels={{
        every: "Toutes les",
        weeks: "semaines",
        on: "Le",
        ends: "Fin",
        never: "Jamais",
        decrease: "Moins",
        increase: "Plus",
        weekdays: {
          MO: "lundi",
          TU: "mardi",
          WE: "mercredi",
          TH: "jeudi",
          FR: "vendredi",
          SA: "samedi",
          SU: "dimanche",
        },
      }}
    />,
  );
  await expect
    .element(page.getByRole("textbox", { name: "Toutes les" }))
    .toBeInTheDocument();
  expect(unitText()).toBe("semaines");
  await expect
    .element(page.getByRole("button", { name: "lundi" }))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole("radiogroup", { name: "Fin" }))
    .toBeInTheDocument();
  await expect.element(radio("Jamais")).toBeInTheDocument();
  expect(page.getByRole("button", { name: "Moins" }).elements()).toHaveLength(
    2,
  );
  expect(page.getByRole("button", { name: "Plus" }).elements()).toHaveLength(2);
});

test("the arrow keys stay in a field inside a choice: they never pick another choice", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{
        freq: "monthly",
        interval: 1,
        month: { kind: "day", day: 15 },
        ends: { kind: "after", count: 17 },
      }}
      initialView="custom"
      onChange={onChange}
    />,
  );
  const day = page.getByRole("textbox", { name: "Day of the month" });
  const caretAt = (field: typeof day, position: number) => {
    const input = field.element() as HTMLInputElement;
    input.focus();
    input.setSelectionRange(position, position);
  };
  caretAt(day, 2);
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(day).toHaveFocus();
  caretAt(day, 0);
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(day).toHaveFocus();
  const count = page.getByRole("textbox", { name: "Number of times" });
  caretAt(count, 2);
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(count).toHaveFocus();
  const ordinal = page.getByRole("combobox", { name: "Week of the month" });
  (ordinal.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(ordinal).toHaveFocus();
  const date = page.getByRole("button", { name: "Pick a date" });
  (date.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(date).toHaveFocus();
  expect(onChange).not.toHaveBeenCalled();
});

test("arrowing onto Custom… only focuses it: browsing changes nothing, Space opens the editor", async () => {
  const onChange = vi.fn();
  const onViewChange = vi.fn();
  await render(
    <Harness initial={null} onChange={onChange} onViewChange={onViewChange} />,
  );
  (radio("Doesn't repeat").element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(radio("Custom…")).toHaveFocus();
  expect(onViewChange).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
  await expect
    .element(radio("Doesn't repeat"))
    .toHaveAttribute("aria-checked", "true");
  await userEvent.keyboard(" ");
  expect(onViewChange).toHaveBeenCalledWith("custom");
  await expect
    .element(page.getByRole("textbox", { name: "Every" }))
    .toHaveFocus();
});

test("Ends: arrowing past On with no day doesn't open the calendar; Space does", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{ freq: "daily", interval: 1, ends: NEVER }}
      initialView="custom"
      onChange={onChange}
    />,
  );
  (radio("Never").element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(radio("On")).toHaveFocus();
  expect(page.getByRole("dialog").elements()).toHaveLength(0);
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.keyboard(" ");
  await expect.element(page.getByRole("dialog")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  (radio("On").element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "daily",
    interval: 1,
    ends: { kind: "after", count: 10 },
  });
});

test("picking the end day already shown selects On and closes; the calendar starts on weekStartsOn", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={{
        freq: "daily",
        interval: 1,
        ends: { kind: "on", date: "2027-03-17" },
      }}
      initialView="custom"
      weekStartsOn={0}
      onChange={onChange}
    />,
  );
  await radio("Never").click();
  await page.getByRole("button", { name: "Mar 17, 2027" }).click();
  await expect.element(page.getByRole("dialog")).toBeVisible();
  const grid = page.getByRole("grid");
  await expect.element(grid).toBeInTheDocument();
  expect(
    grid.element().querySelector("thead th")?.getAttribute("aria-label"),
  ).toBe("Sunday");
  await page.getByRole("button", { name: /March 17th, 2027/ }).click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "daily",
    interval: 1,
    ends: { kind: "on", date: "2027-03-17" },
  });
  await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
});

test("with no weekly preset a new rule falls on the week's first day, never on none", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial={null}
      presets={PRESETS.slice(0, 1)}
      weekStartsOn={0}
      onChange={onChange}
    />,
  );
  await radio("Custom…").click();
  expect(onChange).toHaveBeenLastCalledWith({
    freq: "weekly",
    interval: 1,
    weekdays: ["SU"],
    ends: { kind: "never" },
  });
  await expect
    .element(page.getByRole("button", { name: "Sunday" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("uncontrolled: presets that arrive after mount show the preset list", async () => {
  const value: RecurrenceValue = { freq: "daily", interval: 1, ends: NEVER };
  const screen = await render(
    <RecurrencePicker value={value} onChange={() => {}} />,
  );
  await expect
    .element(page.getByRole("textbox", { name: "Every" }))
    .toBeInTheDocument();
  await screen.rerender(
    <RecurrencePicker value={value} onChange={() => {}} presets={PRESETS} />,
  );
  await expect
    .element(radio("Every day"))
    .toHaveAttribute("aria-checked", "true");
});

test("a new set of dates cross-fades: the old set stays hidden from assistive technology, then goes", async () => {
  const value = PRESETS[2]!.value;
  const props = { value, onChange: () => {}, presets: PRESETS };
  const screen = await render(
    <RecurrencePicker {...props} preview={["Mon 10 Nov"]} />,
  );
  await screen.rerender(
    <RecurrencePicker {...props} preview={["Mon 17 Nov"]} />,
  );
  const outgoing = document.querySelector(
    "[data-slot=recurrence-picker-preview-outgoing]",
  );
  expect(outgoing?.getAttribute("aria-hidden")).toBe("true");
  expect(outgoing?.textContent).toBe("Next:Mon 10 Nov");
  const incoming = document.querySelector(
    "[data-slot=recurrence-picker-preview-dates]",
  );
  expect(incoming?.textContent).toBe("Next:Mon 17 Nov");
  expect(incoming?.className).toContain("motion-safe:animate-in");
  await expect
    .poll(() =>
      document.querySelector("[data-slot=recurrence-picker-preview-outgoing]"),
    )
    .toBeNull();
});

test("the day hint names its target only while it is shown", async () => {
  await render(
    <Harness
      initial={{
        freq: "monthly",
        interval: 1,
        month: { kind: "day", day: 31 },
        ends: NEVER,
      }}
      initialView="custom"
    />,
  );
  const day = page.getByRole("textbox", { name: "Day of the month" });
  await expect.element(day).toHaveAttribute("aria-describedby");
  await radio("the last day").click();
  expect(day.element().hasAttribute("aria-describedby")).toBe(false);
  expect(
    document.querySelector("[data-slot=recurrence-picker-month-hint]"),
  ).toBeNull();
});

test("disabled: every control is disabled", async () => {
  const screen = await render(
    <Harness
      initial={{ freq: "weekly", interval: 1, weekdays: ["MO"], ends: NEVER }}
      disabled
    />,
  );
  for (const element of page.getByRole("radio").elements())
    expect(element.getAttribute("aria-disabled")).toBe("true");
  await expectNoA11yViolations(document.body);
  await screen.unmount();

  await render(
    <Harness
      initial={{
        freq: "monthly",
        interval: 1,
        month: { kind: "day", day: 10 },
        ends: NEVER,
        time: "09:00",
      }}
      initialView="custom"
      showTime
      disabled
    />,
  );
  await expect
    .element(page.getByRole("textbox", { name: "Every" }))
    .toBeDisabled();
  await expect
    .element(page.getByRole("textbox", { name: "Day of the month" }))
    .toBeDisabled();
  await expect
    .element(page.getByRole("textbox", { name: "Number of times" }))
    .toBeDisabled();
  await expect
    .element(page.getByRole("spinbutton", { name: "Time" }))
    .toBeDisabled();
  await expect
    .element(page.getByRole("button", { name: "Pick a date" }))
    .toBeDisabled();
  await expect
    .element(page.getByRole("combobox", { name: "Week of the month" }))
    .toBeDisabled();
  await expect
    .element(page.getByRole("combobox", { name: "Unit" }))
    .toBeDisabled();
  await expectNoA11yViolations(document.body);
});

test("disabled weekday buttons", async () => {
  await render(
    <Harness
      initial={{ freq: "weekly", interval: 1, weekdays: ["MO"], ends: NEVER }}
      initialView="custom"
      disabled
    />,
  );
  await expect
    .element(page.getByRole("button", { name: "Monday" }))
    .toBeDisabled();
});

test("in a popover, focus starts on the selected preset", async () => {
  function RepeatPopover() {
    const [value, setValue] = React.useState<RecurrenceValue | null>(
      PRESETS[2]!.value,
    );
    return (
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Repeat</Button>} />
        <PopoverContent aria-labelledby="repeat-title">
          <PopoverHeader>
            <PopoverTitle id="repeat-title">Repeat</PopoverTitle>
          </PopoverHeader>
          <RecurrencePicker
            value={value}
            onChange={setValue}
            noneLabel="Doesn't repeat"
            presets={PRESETS}
          />
        </PopoverContent>
      </Popover>
    );
  }
  await render(<RepeatPopover />);
  await page.getByRole("button", { name: "Repeat" }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Repeat" }))
    .toBeVisible();
  await expect.element(radio("Every week on Monday")).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(radio("Every month on the 10th"))
    .toHaveAttribute("aria-checked", "true");
});
