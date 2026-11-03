import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { TimePicker, type TimePickerProps } from "./time-picker";

/** A TimePicker that holds its own value, reporting each change. */
function Held({
  initial = null,
  onValueChange,
  ...props
}: Omit<TimePickerProps, "value"> & { initial?: string | null }) {
  const [value, setValue] = React.useState<string | null>(initial);
  return (
    <TimePicker
      aria-label="Start"
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const field = (screen: { container: HTMLElement }) =>
  screen.container.querySelector("input") as HTMLInputElement;
const options = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).map(
    (el) => el.textContent?.trim(),
  );

test("renders a named combobox with a clock, showing the value in the locale's clock", async () => {
  const screen = await render(<TimePicker aria-label="Start" value="21:30" />);
  const input = screen.getByRole("combobox", { name: "Start" });
  await expect.element(input).toHaveValue("9:30 PM");
  const root = screen.container.querySelector<HTMLElement>(
    "[data-slot=time-picker]",
  )!;
  expect(root.dataset.size).toBe("default");
  expect(root.dataset.variant).toBe("outline");
  expect(root.hasAttribute("data-empty")).toBe(false);
  expect(
    root.querySelector("[data-slot=input-group-addon] svg"),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("empty: the placeholder shows and the root is data-empty", async () => {
  const screen = await render(<TimePicker aria-label="Start" />);
  expect(field(screen).placeholder).toBe("Pick a time");
  expect(
    screen.container
      .querySelector("[data-slot=time-picker]")!
      .hasAttribute("data-empty"),
  ).toBe(true);
});

test("hourCycle h23 writes a 24-hour face; the locale decides when it is left out", async () => {
  const screen = await render(
    <TimePicker aria-label="Start" value="09:05" hourCycle="h23" />,
  );
  expect(field(screen).value).toBe("09:05");
  await screen.rerender(
    <TimePicker aria-label="Start" value="21:05" locale="en-GB" />,
  );
  expect(field(screen).value).toBe("21:05");
  await screen.rerender(
    <TimePicker aria-label="Start" value="21:05" locale="en-US" />,
  );
  expect(field(screen).value).toBe("9:05 PM");
});

test("the list offers the day at step minutes and picking one reports HH:MM", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Held step={60} onValueChange={onValueChange} />);
  await userEvent.click(field(screen));
  await expect.poll(() => options().length).toBe(24);
  expect(options()[0]).toBe("12:00 AM");
  expect(options()[13]).toBe("1:00 PM");
  await expectNoA11yViolations(document.body);
  const one = Array.from(
    document.querySelectorAll<HTMLElement>('[role="option"]'),
  ).find((el) => el.textContent?.trim() === "1:00 PM")!;
  await userEvent.click(one);
  expect(onValueChange).toHaveBeenLastCalledWith("13:00");
  await expect.element(screen.getByRole("combobox")).toHaveValue("1:00 PM");
});

test("an off-step value is listed in its place", async () => {
  const screen = await render(<Held step={60} initial="09:37" />);
  await userEvent.click(field(screen));
  await expect.poll(() => options().length).toBe(25);
  expect(options().slice(9, 11)).toEqual(["9:00 AM", "9:37 AM"]);
});

test.each([
  ["930", "09:30"],
  ["9:30 pm", "21:30"],
  ["9p", "21:00"],
  ["21:30", "21:30"],
  ["0745", "07:45"],
  ["12", "12:00"],
  ["12am", "00:00"],
  ["9.5", "09:50"],
  ["9:3", "09:30"],
])("typing %s and leaving the field commits %s", async (typed, expected) => {
  const onValueChange = vi.fn();
  const screen = await render(
    <>
      <Held onValueChange={onValueChange} />
      <button type="button">After</button>
    </>,
  );
  await userEvent.click(field(screen));
  await userEvent.fill(field(screen), typed);
  await userEvent.keyboard("{Tab}");
  await expect.poll(() => onValueChange.mock.calls.at(-1)?.[0]).toBe(expected);
});

test("Enter takes the typed time: it leads the list, even between steps", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Held onValueChange={onValueChange} />);
  await userEvent.click(field(screen));
  await userEvent.fill(field(screen), "9:37");
  await expect.poll(() => options()[0]).toBe("9:37 AM");
  await userEvent.keyboard("{Enter}");
  expect(onValueChange).toHaveBeenLastCalledWith("09:37");
  await expect.element(screen.getByRole("combobox")).toHaveValue("9:37 AM");
});

test("typing filters the list to the times it can still become", async () => {
  const screen = await render(<Held />);
  await userEvent.click(field(screen));
  await userEvent.fill(field(screen), "10p");
  await expect.poll(() => options()[0]).toBe("10:00 PM");
  expect(options().every((text) => text?.endsWith("PM"))).toBe(true);
  expect(options().every((text) => text?.startsWith("10:"))).toBe(true);
});

test("text that is not a time marks the field invalid, and leaving it goes back to the value", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <>
      <Held initial="08:00" onValueChange={onValueChange} />
      <button type="button">After</button>
    </>,
  );
  await userEvent.click(field(screen));
  await userEvent.fill(field(screen), "soon");
  await expect
    .element(screen.getByRole("combobox"))
    .toHaveAttribute("aria-invalid", "true");
  await expect
    .poll(() => document.body.textContent)
    .toContain("No matching time");
  // The picker alone: Base UI hides the page's other controls while the list is open.
  await expectNoA11yViolations(
    screen.container.querySelector<HTMLElement>("[data-slot=time-picker]")!,
  );
  await userEvent.keyboard("{Tab}");
  await expect.element(screen.getByRole("combobox")).toHaveValue("8:00 AM");
  await expect
    .element(screen.getByRole("combobox"))
    .not.toHaveAttribute("aria-invalid");
  expect(onValueChange).not.toHaveBeenCalled();
});

test("Escape reverts what was typed", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Held initial="08:00" onValueChange={onValueChange} />,
  );
  await userEvent.click(field(screen));
  await userEvent.fill(field(screen), "11");
  await userEvent.keyboard("{Escape}");
  await expect.element(screen.getByRole("combobox")).toHaveValue("8:00 AM");
  expect(onValueChange).not.toHaveBeenCalled();
});

test("emptying the field reports null", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <>
      <Held initial="08:00" onValueChange={onValueChange} />
      <button type="button">After</button>
    </>,
  );
  await userEvent.click(field(screen));
  await userEvent.fill(field(screen), "");
  await userEvent.keyboard("{Tab}");
  await expect.poll(() => onValueChange.mock.calls.at(-1)?.[0]).toBeNull();
});

test("sm and ghost: the inline tier, written as data attributes", async () => {
  const screen = await render(
    <TimePicker aria-label="Start" size="sm" variant="ghost" value="09:00" />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    "[data-slot=time-picker]",
  )!;
  expect(root.dataset.size).toBe("sm");
  expect(root.dataset.variant).toBe("ghost");
  const group = root.querySelector<HTMLElement>("[data-slot=input-group]")!;
  expect(group.className).toContain("h-7");
  expect(group.className).toContain("border-transparent");
  await expectNoA11yViolations(screen.container);
});

test("disabled: the input is disabled and nothing opens", async () => {
  const screen = await render(
    <TimePicker aria-label="Start" value="09:00" disabled />,
  );
  expect(field(screen).disabled).toBe(true);
  field(screen).click();
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("ref reaches the input", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(<TimePicker aria-label="Start" ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
});

fieldWiringTests({
  name: "TimePicker",
  render: (props) => <TimePicker {...props} />,
  find: (screen, name) => screen.getByRole("combobox", { name }),
});
