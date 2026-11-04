import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { TimeField, type TimeFieldProps } from "./time-field";

/** A controlled field that records every change. */
function Harness({
  initial,
  onChange,
  ...props
}: Omit<TimeFieldProps, "value" | "onChange"> & {
  initial: string | null;
  onChange?: (value: string | null) => void;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <TimeField
      aria-label="Time"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const field = () => page.getByRole("spinbutton", { name: "Time" });

test("shows the value on the chosen clock as a named spin button", async () => {
  const screen = await render(<Harness initial="21:30" hourCycle={12} />);
  const input = field();
  await expect.element(input).toHaveValue("9:30 PM");
  await expect.element(input).toHaveAttribute("aria-valuenow", "1290");
  await expect.element(input).toHaveAttribute("aria-valuetext", "9:30 PM");
  await expect.element(input).toHaveAttribute("aria-valuemin", "0");
  await expect.element(input).toHaveAttribute("aria-valuemax", "1439");
  expect(
    document.querySelector("[data-slot=time-field]")?.getAttribute("role"),
  ).toBe("group");
  await expectNoA11yViolations(document.body);
  await screen.unmount();

  const second = await render(<Harness initial="21:30" hourCycle={24} />);
  await expect.element(field()).toHaveValue("21:30");
  await second.unmount();
});

test("an empty field has no value and no value text", async () => {
  await render(<Harness initial={null} placeholder="Add a time" />);
  const input = field();
  await expect.element(input).toHaveValue("");
  expect(input.element().hasAttribute("aria-valuenow")).toBe(false);
  expect(input.element().hasAttribute("aria-valuetext")).toBe(false);
  await expect.element(input).toHaveAttribute("placeholder", "Add a time");
  await expectNoA11yViolations(document.body);
});

test("arrow keys step on the step grid; Page Up/Down move an hour", async () => {
  const onChange = vi.fn();
  await render(<Harness initial="09:07" hourCycle={24} onChange={onChange} />);
  await field().click();
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).toHaveBeenLastCalledWith("09:15");
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).toHaveBeenLastCalledWith("09:30");
  await userEvent.keyboard("{ArrowDown}");
  expect(onChange).toHaveBeenLastCalledWith("09:15");
  await userEvent.keyboard("{PageUp}");
  expect(onChange).toHaveBeenLastCalledWith("10:15");
  await userEvent.keyboard("{PageDown}");
  expect(onChange).toHaveBeenLastCalledWith("09:15");
  await expect.element(field()).toHaveValue("09:15");
});

test("step sets the grid; an empty field starts at the first or last time", async () => {
  const onChange = vi.fn();
  await render(
    <Harness initial={null} step={30} hourCycle={24} onChange={onChange} />,
  );
  await field().click();
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).toHaveBeenLastCalledWith("00:00");
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).toHaveBeenLastCalledWith("00:30");
});

test("min and max bound stepping, typing, Home and End", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial="17:45"
      min="08:00"
      max="18:00"
      hourCycle={24}
      onChange={onChange}
    />,
  );
  const input = field();
  await expect.element(input).toHaveAttribute("aria-valuemin", "480");
  await expect.element(input).toHaveAttribute("aria-valuemax", "1080");
  await input.click();
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).toHaveBeenLastCalledWith("18:00");
  onChange.mockClear();
  await userEvent.keyboard("{ArrowUp}");
  // Already at the end: nothing changes, nothing fires.
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.keyboard("{Home}");
  expect(onChange).toHaveBeenLastCalledWith("08:00");
  await userEvent.keyboard("{End}");
  expect(onChange).toHaveBeenLastCalledWith("18:00");
  await input.fill("7am");
  await userEvent.keyboard("{Enter}");
  expect(onChange).toHaveBeenLastCalledWith("08:00");
});

test("typing sets the time on Enter or blur; text that is not a time is invalid, then dropped", async () => {
  const onChange = vi.fn();
  await render(
    <>
      <Harness initial="09:00" hourCycle={12} onChange={onChange} />
      <Button>Elsewhere</Button>
    </>,
  );
  const input = field();
  await input.fill("930pm");
  await userEvent.keyboard("{Enter}");
  expect(onChange).toHaveBeenLastCalledWith("21:30");
  await expect.element(input).toHaveValue("9:30 PM");

  await input.fill("14:05");
  await page.getByRole("button", { name: "Elsewhere" }).click();
  expect(onChange).toHaveBeenLastCalledWith("14:05");
  await expect.element(input).toHaveValue("2:05 PM");

  onChange.mockClear();
  await input.fill("soon");
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  await expectNoA11yViolations(document.body);
  await page.getByRole("button", { name: "Elsewhere" }).click();
  expect(onChange).not.toHaveBeenCalled();
  await expect.element(input).toHaveValue("2:05 PM");
  expect(input.element().hasAttribute("aria-invalid")).toBe(false);

  await input.fill("");
  await page.getByRole("button", { name: "Elsewhere" }).click();
  expect(onChange).toHaveBeenLastCalledWith(null);
  await expect.element(input).toHaveValue("");
});

test("the first Escape drops what was typed and stays in the field", async () => {
  const onKeyDown = vi.fn();
  await render(
    <div onKeyDown={(event) => onKeyDown(event.key)}>
      <Harness initial="09:00" hourCycle={24} />
    </div>,
  );
  const input = field();
  await input.fill("10");
  await userEvent.keyboard("{Escape}");
  await expect.element(input).toHaveValue("09:00");
  expect(onKeyDown).not.toHaveBeenCalledWith("Escape");
  await userEvent.keyboard("{Escape}");
  expect(onKeyDown).toHaveBeenCalledWith("Escape");
});

test("disabled: the input is disabled", async () => {
  await render(<Harness initial="09:00" disabled />);
  await expect.element(field()).toBeDisabled();
  await expectNoA11yViolations(document.body);
});

test("stepping stops on the grid: 23:45 is the last step, and a later typed time is left alone", async () => {
  const onChange = vi.fn();
  await render(<Harness initial="23:45" hourCycle={24} onChange={onChange} />);
  await field().click();
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).not.toHaveBeenCalled();
  await field().fill("23:50");
  await userEvent.keyboard("{Enter}");
  onChange.mockClear();
  await userEvent.keyboard("{ArrowUp}");
  expect(onChange).not.toHaveBeenCalled();
  await expect.element(field()).toHaveValue("23:50");
  await userEvent.keyboard("{ArrowDown}");
  expect(onChange).toHaveBeenLastCalledWith("23:45");
});

test("an empty field steps down from the last step", async () => {
  const onChange = vi.fn();
  await render(<Harness initial={null} hourCycle={24} onChange={onChange} />);
  await field().click();
  await userEvent.keyboard("{ArrowDown}");
  expect(onChange).toHaveBeenLastCalledWith("23:45");
});

test("while typing, Home and End move the caret and Enter keeps text that is not a time", async () => {
  const onChange = vi.fn();
  await render(
    <Harness
      initial="09:00"
      min="08:00"
      max="18:00"
      hourCycle={24}
      onChange={onChange}
    />,
  );
  const input = field();
  await input.fill("10:3");
  await userEvent.keyboard("{Home}");
  expect(onChange).not.toHaveBeenCalled();
  await expect.element(input).toHaveValue("10:3");
  await input.fill("soon");
  await userEvent.keyboard("{Enter}");
  await expect.element(input).toHaveValue("soon");
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  expect(onChange).not.toHaveBeenCalled();
});

test("reads back what it shows in a locale with its own digits and day words", async () => {
  const onChange = vi.fn();
  await render(<Harness initial="09:30" locale="ko" onChange={onChange} />);
  const input = field();
  await expect.element(input).toHaveValue("오전 9:30");
  await input.fill("오후 9:30");
  await userEvent.keyboard("{Enter}");
  expect(onChange).toHaveBeenLastCalledWith("21:30");
});

test("the invalid prop and a label by id; ref reaches the input", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(
    <>
      <span id="start-label">Starts at</span>
      <TimeField
        ref={ref}
        aria-labelledby="start-label"
        aria-invalid
        value="09:00"
        onChange={() => {}}
        className="w-48"
      />
    </>,
  );
  const input = page.getByRole("spinbutton", { name: "Starts at" });
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  expect(ref.current).toBe(input.element());
  expect(document.querySelector("[data-slot=time-field]")?.className).toContain(
    "w-48",
  );
  await expectNoA11yViolations(document.body);
});
