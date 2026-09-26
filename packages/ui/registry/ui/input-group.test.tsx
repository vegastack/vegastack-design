import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Kbd } from "./kbd";
import { Spinner } from "./spinner";

/** Upstream's four addon alignments. */
const ALIGNS = [
  "inline-start",
  "inline-end",
  "block-start",
  "block-end",
] as const;

/** Upstream's four button size tiers. */
const BUTTON_SIZES = ["xs", "sm", "icon-xs", "icon-sm"] as const;

const groupClasses = (screen: { container: HTMLElement }) =>
  (screen.container.querySelector('[data-slot="input-group"]') as HTMLElement)
    .className;

test("renders a role=group wrapper around the control (Usage)", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" placeholder="Search..." />
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  );
  const group = screen.container.querySelector('[data-slot="input-group"]');
  expect(group?.getAttribute("role")).toBe("group");
  const control = screen.getByRole("textbox", { name: "Search" });
  await expect
    .element(control)
    .toHaveAttribute("data-slot", "input-group-control");
});

test("the control is an Input, so it keeps its native semantics (Composition)", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Email" type="email" />
    </InputGroup>,
  );
  const control = screen
    .getByRole("textbox", { name: "Email" })
    .element() as HTMLInputElement;
  expect(control.tagName).toBe("INPUT");
  expect(control.type).toBe("email");
});

test("every upstream align sets its own data-align (Align)", async () => {
  for (const align of ALIGNS) {
    const screen = await render(
      <InputGroup>
        <InputGroupInput aria-label={align} />
        <InputGroupAddon align={align}>
          <InputGroupText>{align}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );
    const addon = screen.container.querySelector(
      '[data-slot="input-group-addon"]',
    );
    expect(addon?.getAttribute("data-align")).toBe(align);
  }
});

test("every upstream button size produces its own class string (Button)", async () => {
  const seen = new Set<string>();
  for (const size of BUTTON_SIZES) {
    const screen = await render(
      <InputGroup>
        <InputGroupInput aria-label="Search" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size={size} aria-label={size}>
            go
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    const button = screen.getByRole("button", { name: size });
    await expect.element(button).toHaveAttribute("data-size", size);
    seen.add((button.element() as HTMLElement).className);
  }
  expect(seen.size).toBe(BUTTON_SIZES.length);
});

test("clicking the addon focuses the control (Align, Icon)", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" />
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  );
  const addon = screen.container.querySelector(
    '[data-slot="input-group-addon"]',
  ) as HTMLElement;
  addon.click();
  expect(document.activeElement).toBe(
    screen.getByRole("textbox", { name: "Search" }).element(),
  );
});

test("clicking a button inside the addon does not steal focus to the control (Button)", async () => {
  let clicks = 0;
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Share link" readOnly />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Copy" onClick={() => (clicks += 1)}>
          copy
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Copy" }));
  expect(clicks).toBe(1);
});

test("a Kbd addon renders inside the group (Kbd)", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>,
  );
  await expect.element(screen.getByText("⌘K")).toBeInTheDocument();
});

test("a Spinner addon renders inside the group (Spinner)", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" />
      <InputGroupAddon align="inline-end">
        <Spinner />
      </InputGroupAddon>
    </InputGroup>,
  );
  expect(
    screen.container.querySelector('[data-slot="spinner"]'),
  ).not.toBeNull();
});

test("InputGroupTextarea is a Textarea wearing the control slot (Textarea)", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupTextarea aria-label="Message" />
      <InputGroupAddon align="block-end">
        <InputGroupText>0/280</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  );
  const control = screen
    .getByRole("textbox", { name: "Message" })
    .element() as HTMLElement;
  expect(control.tagName).toBe("TEXTAREA");
  expect(control.getAttribute("data-slot")).toBe("input-group-control");
});

test("any control marked data-slot=input-group-control joins the group's state (Custom Input)", async () => {
  const screen = await render(
    <InputGroup>
      <textarea data-slot="input-group-control" aria-label="Custom" />
      <InputGroupAddon align="block-end">
        <InputGroupButton>Submit</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>,
  );
  expect(
    screen.container
      .querySelector('[data-slot="input-group"]')
      ?.hasAttribute("data-field-group"),
  ).toBe(true);
  await expect
    .element(screen.getByRole("textbox", { name: "Custom" }))
    .toBeInTheDocument();
});

test("a disabled control dims the whole group (Align, States)", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" disabled />
    </InputGroup>,
  );
  expect(groupClasses(screen)).toContain("has-disabled:opacity-50");
  await expect
    .element(screen.getByRole("textbox", { name: "Search" }))
    .toBeDisabled();
});

test("RTL: the group inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <InputGroup>
        <InputGroupInput aria-label="ابحث" />
      </InputGroup>
    </div>,
  );
  const group = screen.container.querySelector(
    '[data-slot="input-group"]',
  ) as HTMLElement;
  expect(getComputedStyle(group).direction).toBe("rtl");
});

test("FOC-1/FOC-6: neither the group nor its control carries a focus glow", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" />
    </InputGroup>,
  );
  const group = groupClasses(screen);
  const control = (
    screen.getByRole("textbox", { name: "Search" }).element() as HTMLElement
  ).className;
  for (const classes of [group, control]) {
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
  }
  expect(control).not.toMatch(/(?:^|\s)ring-0(?:\s|$)/);
  expect(control).not.toContain("aria-invalid:ring-0");
});

test("FOC-14: the GROUP is a field group (it wears base.css's tint) and never moves its border on focus", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" />
    </InputGroup>,
  );
  const group = screen.container.querySelector(
    '[data-slot="input-group"]',
  ) as HTMLElement;
  expect(group.hasAttribute("data-field-group")).toBe(true);
  expect(groupClasses(screen)).not.toMatch(/focus[\w-]*\]?:border-/);
});

test("FOC-14: the invalid border holds while the group holds focus", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" aria-invalid />
    </InputGroup>,
  );
  expect(groupClasses(screen)).toContain(
    "has-[[data-slot][aria-invalid=true]]:border-destructive",
  );
  expect(groupClasses(screen)).not.toContain("not-focus-within:");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" placeholder="Search..." />
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — with a named icon button", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Share link" readOnly />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Copy">
          <svg aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" aria-invalid />
    </InputGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupInput aria-label="Search" disabled />
    </InputGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — textarea", async () => {
  const screen = await render(
    <InputGroup>
      <InputGroupTextarea aria-label="Message" />
      <InputGroupAddon align="block-end">
        <InputGroupText>0/280</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

/* API-26 — no hunk: InputGroupInput is our Input (Base UI Field.Control) and InputGroupTextarea is
   our Textarea (Field.Control since API-26), so both read the Field through the controls they wrap */

test("API-26: inside a Field the group input is labelled, described and invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Website</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput />
      </InputGroup>
      <FieldDescription>Your public site.</FieldDescription>
      <FieldError>Enter a domain.</FieldError>
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "Website" });
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  await expect.element(input).toHaveAccessibleDescription(/Your public site/);
  await expect.element(input).toHaveAccessibleDescription(/Enter a domain/);
});

test("API-26: inside a Field the group textarea is labelled, described and invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Message</FieldLabel>
      <InputGroup>
        <InputGroupTextarea />
      </InputGroup>
      <FieldError>Too long.</FieldError>
    </Field>,
  );
  const box = screen.getByRole("textbox", { name: "Message" });
  await expect.element(box).toHaveAttribute("aria-invalid", "true");
  await expect.element(box).toHaveAccessibleDescription(/Too long/);
});

test("no a11y violations — inside a Field, valid", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Website</FieldLabel>
      <InputGroup>
        <InputGroupInput />
      </InputGroup>
      <FieldDescription>Your public site.</FieldDescription>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a Field, invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Website</FieldLabel>
      <InputGroup>
        <InputGroupInput />
      </InputGroup>
      <FieldError>Enter a domain.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "InputGroupInput",
  render: (props) => (
    <InputGroup>
      <InputGroupInput {...props} />
    </InputGroup>
  ),
  find: (screen, name) => screen.getByRole("textbox", { name }),
});

fieldWiringTests({
  name: "InputGroupTextarea",
  render: (props) => (
    <InputGroup>
      <InputGroupTextarea {...props} />
    </InputGroup>
  ),
  find: (screen, name) => screen.getByRole("textbox", { name }),
});
