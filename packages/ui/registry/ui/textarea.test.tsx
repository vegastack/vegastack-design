import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

const classesOf = (screen: { container: HTMLElement }) =>
  (screen.container.querySelector('[data-slot="textarea"]') as HTMLElement)
    .className;

test("renders a native textarea carrying data-slot (Usage)", async () => {
  const screen = await render(<Textarea aria-label="Message" />);
  const textarea = screen.getByRole("textbox", { name: "Message" });
  await expect.element(textarea).toBeInTheDocument();
  await expect.element(textarea).toHaveAttribute("data-slot", "textarea");
  expect((textarea.element() as HTMLElement).tagName).toBe("TEXTAREA");
});

test("typing updates the value", async () => {
  const screen = await render(<Textarea aria-label="Message" />);
  const textarea = screen.getByRole("textbox", { name: "Message" });
  await userEvent.fill(textarea, "hello");
  expect((textarea.element() as HTMLTextAreaElement).value).toBe("hello");
});

test("it sizes to its content rather than to a rows attribute (Usage)", async () => {
  const screen = await render(<Textarea aria-label="Message" />);
  expect(classesOf(screen)).toContain("field-sizing-content");
  expect(classesOf(screen)).toContain("min-h-16");
});

test("Field wires the label and description (Field)", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="message">Message</FieldLabel>
      <FieldDescription>Enter your message below.</FieldDescription>
      <Textarea id="message" />
    </Field>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Message" }))
    .toBeInTheDocument();
});

test("disabled reaches the element (Disabled)", async () => {
  const screen = await render(<Textarea aria-label="Message" disabled />);
  await expect
    .element(screen.getByRole("textbox", { name: "Message" }))
    .toBeDisabled();
});

test("aria-invalid reaches the element (Invalid)", async () => {
  const screen = await render(<Textarea aria-label="Message" aria-invalid />);
  await expect
    .element(screen.getByRole("textbox", { name: "Message" }))
    .toHaveAttribute("aria-invalid", "true");
});

test("it composes with a submit Button (Button)", async () => {
  let submits = 0;
  const screen = await render(
    <div className="grid gap-2">
      <Textarea aria-label="Message" />
      <Button onClick={() => (submits += 1)}>Send message</Button>
    </div>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));
  expect(submits).toBe(1);
});

test("RTL: the control inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Textarea aria-label="التعليقات" />
    </div>,
  );
  const textarea = screen
    .getByRole("textbox", { name: "التعليقات" })
    .element() as HTMLElement;
  expect(getComputedStyle(textarea).direction).toBe("rtl");
});

test("FOC-1/FOC-6: the recipe carries no focus glow", async () => {
  const screen = await render(<Textarea aria-label="Message" />);
  const classes = classesOf(screen);
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toContain("aria-invalid:ring-destructive");
});

test("FOC-3/FOC-8: focus is a border tint on :focus, with outline-hidden not outline-none", async () => {
  const screen = await render(<Textarea aria-label="Message" />);
  const classes = classesOf(screen);
  expect(classes).toContain("focus:border-ring/70");
  expect(classes).toContain("outline-hidden");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
});

test("FOC-5: the invalid tint stands down while the control is focused", async () => {
  const screen = await render(<Textarea aria-label="Message" aria-invalid />);
  expect(classesOf(screen)).toContain(
    "not-focus:aria-invalid:border-destructive",
  );
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="ta-rest">Message</FieldLabel>
      <Textarea id="ta-rest" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="ta-invalid">Message</FieldLabel>
      <Textarea id="ta-invalid" aria-invalid />
      <FieldError>Please enter a message.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Field data-disabled>
      <FieldLabel htmlFor="ta-disabled">Message</FieldLabel>
      <Textarea id="ta-disabled" disabled />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — filled", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="ta-filled">Message</FieldLabel>
      <Textarea id="ta-filled" defaultValue="Filled" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});
