import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Textarea } from "./textarea";

test("renders a textbox with the placeholder", async () => {
  const screen = await render(<Textarea placeholder="Description" />);
  await expect
    .element(screen.getByPlaceholder("Description"))
    .toBeInTheDocument();
});

test("carries the textarea data-slot", async () => {
  const screen = await render(<Textarea aria-label="Bio" />);
  await expect
    .element(screen.getByLabelText("Bio"))
    .toHaveAttribute("data-slot", "textarea");
});

test("typing fires onChange", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Textarea aria-label="Notes" onChange={onChange} />,
  );
  await screen.getByLabelText("Notes").fill("Hello\nWorld");
  expect(onChange).toHaveBeenCalled();
});

test("disabled prevents interaction", async () => {
  const screen = await render(<Textarea aria-label="Notes" disabled />);
  await expect.element(screen.getByLabelText("Notes")).toBeDisabled();
});

test("aria-invalid is reflected on the field", async () => {
  const screen = await render(<Textarea aria-label="Notes" aria-invalid />);
  await expect
    .element(screen.getByLabelText("Notes"))
    .toHaveAttribute("aria-invalid", "true");
});

test("darkens its border as the sole focus cue (no ring), matching Input", async () => {
  const screen = await render(<Textarea aria-label="Notes" />);
  const el = screen.getByLabelText("Notes");
  await expect
    .element(el)
    .toHaveClass("focus:border-ring/(--alpha-tint-border)");
  await expect.element(el).not.toHaveClass("focus-visible:ring-2");
});

test("autoGrow opts into field-sizing instead of vertical resize", async () => {
  const screen = await render(<Textarea aria-label="Notes" autoGrow />);
  const el = screen.getByLabelText("Notes");
  await expect.element(el).toHaveClass("field-sizing-content");
  await expect.element(el).not.toHaveClass("resize-y");
});

test("no a11y violations", async () => {
  const screen = await render(
    <label>
      Description
      <Textarea name="description" />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <label>
      Description
      <Textarea name="description" disabled />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <label>
      Description
      <Textarea name="description" aria-invalid />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the underlying textarea element", async () => {
  const ref = React.createRef<HTMLTextAreaElement>();
  await render(<Textarea ref={ref} aria-label="Bio" />);
  expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  expect(ref.current?.dataset.slot).toBe("textarea");
});
