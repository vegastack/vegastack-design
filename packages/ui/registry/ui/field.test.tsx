import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Slider } from "./slider";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

/** Upstream's three orientations. */
const ORIENTATIONS = ["vertical", "horizontal", "responsive"] as const;

const fieldRoot = (screen: { container: HTMLElement }) =>
  screen.container.querySelector('[data-slot="field"]') as HTMLElement;

test("Field is a role=group carrying its orientation (Usage, Anatomy)", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="name">Full name</FieldLabel>
      <Input id="name" />
    </Field>,
  );
  const root = fieldRoot(screen);
  expect(root.getAttribute("role")).toBe("group");
  expect(root.getAttribute("data-orientation")).toBe("vertical");
});

test("every upstream orientation sets its own data-orientation (Responsive Layout)", async () => {
  for (const orientation of ORIENTATIONS) {
    const screen = await render(
      <Field orientation={orientation}>
        <FieldLabel htmlFor={orientation}>Label</FieldLabel>
        <Input id={orientation} />
      </Field>,
    );
    expect(fieldRoot(screen).getAttribute("data-orientation")).toBe(
      orientation,
    );
  }
});

test("every upstream orientation produces its own class string (Responsive Layout)", async () => {
  const seen = new Set<string>();
  for (const orientation of ORIENTATIONS) {
    const screen = await render(
      <Field orientation={orientation}>
        <Input aria-label={orientation} />
      </Field>,
    );
    seen.add(fieldRoot(screen).className);
  }
  expect(seen.size).toBe(ORIENTATIONS.length);
});

test("FieldLabel binds to its control with htmlFor (Usage, Composition)", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" />
    </Field>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Username" }))
    .toBeInTheDocument();
});

test("FieldSet renders a real fieldset and FieldLegend its legend (Fieldset)", async () => {
  const screen = await render(
    <FieldSet>
      <FieldLegend>Address Information</FieldLegend>
      <FieldDescription>We need it to deliver your order.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="street">Street</FieldLabel>
          <Input id="street" />
        </Field>
      </FieldGroup>
    </FieldSet>,
  );
  const set = screen.container.querySelector('[data-slot="field-set"]');
  expect(set?.tagName).toBe("FIELDSET");
  const legend = screen.container.querySelector('[data-slot="field-legend"]');
  expect(legend?.tagName).toBe("LEGEND");
  await expect
    .element(screen.getByRole("group", { name: "Address Information" }))
    .toBeInTheDocument();
});

test("FieldLegend takes a variant (Fieldset, Checkbox)", async () => {
  const screen = await render(
    <FieldSet>
      <FieldLegend variant="label">Show on the desktop</FieldLegend>
    </FieldSet>,
  );
  expect(
    screen.container
      .querySelector('[data-slot="field-legend"]')
      ?.getAttribute("data-variant"),
  ).toBe("label");
});

test("FieldSeparator divides a FieldGroup (Field Group, Composition)", async () => {
  const screen = await render(
    <FieldGroup>
      <Field>
        <Input aria-label="One" />
      </Field>
      <FieldSeparator />
      <Field>
        <Input aria-label="Two" />
      </Field>
    </FieldGroup>,
  );
  expect(
    screen.container.querySelector('[data-slot="field-separator"]'),
  ).not.toBeNull();
});

test("FieldSeparator carries its content marker when given children (Field Group)", async () => {
  const screen = await render(<FieldSeparator>or</FieldSeparator>);
  const separator = screen.container.querySelector(
    '[data-slot="field-separator"]',
  );
  expect(separator?.getAttribute("data-content")).toBe("true");
  await expect.element(screen.getByText("or")).toBeInTheDocument();
});

test("FieldError renders role=alert with its message (Validation and Errors)", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" aria-invalid />
      <FieldError>Enter a valid email address.</FieldError>
    </Field>,
  );
  const error = screen.container.querySelector('[data-slot="field-error"]');
  expect(error?.getAttribute("role")).toBe("alert");
  expect(error?.textContent).toContain("Enter a valid email address.");
});

test("FieldError de-duplicates an errors array into a list (Validation and Errors)", async () => {
  const screen = await render(
    <FieldError
      errors={[
        { message: "Too short." },
        { message: "Too short." },
        { message: "Needs a number." },
      ]}
    />,
  );
  const items = screen.container.querySelectorAll("li");
  expect(items.length).toBe(2);
});

test("FieldError renders nothing when there is nothing to say (Validation and Errors)", async () => {
  const screen = await render(<FieldError errors={[]} />);
  expect(
    screen.container.querySelector('[data-slot="field-error"]'),
  ).toBeNull();
});

test("Field composes with every control the docs page pairs it with", async () => {
  const screen = await render(
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="c-input">Input</FieldLabel>
        <Input id="c-input" />
      </Field>
      <Field>
        <FieldLabel htmlFor="c-textarea">Textarea</FieldLabel>
        <Textarea id="c-textarea" />
      </Field>
      <Field>
        <FieldTitle>Slider</FieldTitle>
        <Slider defaultValue={[50]} aria-label="Price" />
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="c-checkbox" />
        <FieldLabel htmlFor="c-checkbox">Checkbox</FieldLabel>
      </Field>
      <RadioGroup defaultValue="one" aria-label="Radio">
        <Field orientation="horizontal">
          <RadioGroupItem value="one" id="c-radio" />
          <FieldLabel htmlFor="c-radio">Radio</FieldLabel>
        </Field>
      </RadioGroup>
      <Field orientation="horizontal">
        <Switch id="c-switch" />
        <FieldLabel htmlFor="c-switch">Switch</FieldLabel>
      </Field>
    </FieldGroup>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Input" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("slider", { name: "Price" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("checkbox", { name: "Checkbox" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("radio", { name: "Radio" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("switch", { name: "Switch" }))
    .toBeInTheDocument();
});

test("a choice card wraps the whole Field and stays clickable (Choice Card)", async () => {
  const screen = await render(
    <RadioGroup aria-label="Environment">
      <FieldLabel htmlFor="k8s">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Kubernetes</FieldTitle>
            <FieldDescription>Run GPU workloads.</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="k8s" id="k8s" />
        </Field>
      </FieldLabel>
    </RadioGroup>,
  );
  await userEvent.click(screen.getByText("Kubernetes"));
  await expect
    .element(screen.getByRole("radio", { name: /Kubernetes/ }))
    .toHaveAttribute("aria-checked", "true");
});

test("it composes a submitting form (Form)", async () => {
  let submitted = false;
  const screen = await render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitted = true;
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="f-email">Email</FieldLabel>
          <Input id="f-email" type="email" />
        </Field>
        <Field orientation="horizontal">
          <button type="submit">Continue</button>
        </Field>
      </FieldGroup>
    </form>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(submitted).toBe(true);
});

test("RTL: the field inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Field>
        <FieldLabel htmlFor="rtl-name">الاسم</FieldLabel>
        <Input id="rtl-name" />
      </Field>
    </div>,
  );
  expect(getComputedStyle(fieldRoot(screen)).direction).toBe("rtl");
});

test("A11Y-8: a field error is marked by shape as well as by hue", async () => {
  const screen = await render(
    <FieldError>Enter a valid email address.</FieldError>,
  );
  const error = screen.container.querySelector(
    '[data-slot="field-error"]',
  ) as HTMLElement;
  const icon = error.querySelector("svg");
  expect(icon).not.toBeNull();
  expect(icon?.getAttribute("aria-hidden")).toBe("true");
});

test("A11Y-13/COL-12: the error takes the destructive family's TEXT ink, not its fill", async () => {
  const screen = await render(<FieldError>Nope.</FieldError>);
  const error = screen.container.querySelector(
    '[data-slot="field-error"]',
  ) as HTMLElement;
  expect(error.className).toContain("text-destructive-text");
  expect(error.className).not.toMatch(/(?:^|\s)text-destructive(?:\s|$)/);
});

test("A11Y-13: an invalid Field tints its block with the same TEXT ink", async () => {
  const screen = await render(
    <Field data-invalid>
      <Input aria-label="Email" aria-invalid />
    </Field>,
  );
  expect(fieldRoot(screen).className).toContain(
    "data-[invalid=true]:text-destructive-text",
  );
});

test("FOC-1/FOC-6/FOC-12: the choice card carries no ring of its own", async () => {
  const screen = await render(
    <FieldLabel htmlFor="ring-check">
      <Field orientation="horizontal">
        <Checkbox id="ring-check" />
      </Field>
    </FieldLabel>,
  );
  const label = screen.container.querySelector(
    '[data-slot="field-label"]',
  ) as HTMLElement;
  expect(label.className).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(label.className).not.toContain("has-[:focus-visible]:border-ring");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <FieldSet>
      <FieldLegend>Profile</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="a11y-name">Full name</FieldLabel>
          <Input id="a11y-name" />
          <FieldDescription>Shown on invoices.</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="a11y-invalid">Email</FieldLabel>
      <Input id="a11y-invalid" aria-invalid />
      <FieldError>Enter a valid email address.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Field data-disabled>
      <FieldLabel htmlFor="a11y-disabled">Email</FieldLabel>
      <Input id="a11y-disabled" disabled />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — choice card", async () => {
  const screen = await render(
    <RadioGroup aria-label="Environment">
      <FieldLabel htmlFor="a11y-k8s">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Kubernetes</FieldTitle>
            <FieldDescription>Run GPU workloads.</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="k8s" id="a11y-k8s" />
        </Field>
      </FieldLabel>
    </RadioGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — horizontal", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <FieldLabel htmlFor="a11y-h">Email</FieldLabel>
      <Input id="a11y-h" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------------------------- */
/* API-26 — Field renders Base UI Field underneath, and the control reads it                       */
/* ---------------------------------------------------------------------------------------------- */

test("API-26: Field wires label, description, error and invalid onto the control", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Name</FieldLabel>
      <Input />
      <FieldDescription>Shown on invoices</FieldDescription>
      <FieldError>Name is required</FieldError>
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "Name" });
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  await expect.element(input).toHaveAccessibleDescription(/Shown on invoices/);
  await expect.element(input).toHaveAccessibleDescription(/Name is required/);
});

test("API-26: a description or error id is described only while it is rendered", async () => {
  function Toggle({ show }: { show: boolean }) {
    return (
      <Field data-invalid={show}>
        <FieldLabel>Code</FieldLabel>
        <Input />
        {show && <FieldDescription>Six characters</FieldDescription>}
        <FieldError>{show ? "Code is taken" : null}</FieldError>
      </Field>
    );
  }
  const screen = await render(<Toggle show />);
  const input = screen.getByRole("textbox", { name: "Code" });
  const ids = () =>
    (input.element().getAttribute("aria-describedby") ?? "")
      .split(" ")
      .filter(Boolean);
  expect(ids()).toHaveLength(2);
  const [description, error] = [
    screen.container.querySelector('[data-slot="field-description"]')!,
    screen.container.querySelector('[data-slot="field-error"]')!,
  ];
  expect(ids()).toEqual(expect.arrayContaining([description.id, error.id]));

  await screen.rerender(<Toggle show={false} />);
  await expect.poll(() => ids()).toEqual([]);
  expect(input.element().hasAttribute("aria-invalid")).toBe(false);
});

test("API-26: data-invalid={false} leaves the field valid", async () => {
  const screen = await render(
    <Field data-invalid={false}>
      <FieldLabel>Name</FieldLabel>
      <Input />
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "Name" }).element();
  expect(input.hasAttribute("aria-invalid")).toBe(false);
  expect(fieldRoot(screen).getAttribute("data-invalid")).toBe("false");
});

test("API-26: an explicit id and htmlFor win; an explicit aria-describedby keeps its ids first", async () => {
  const screen = await render(
    <>
      <p id="external-hint">Managed elsewhere</p>
      <Field>
        <FieldLabel htmlFor="explicit-name">Name</FieldLabel>
        <Input id="explicit-name" aria-describedby="external-hint" />
        <FieldDescription>Shown on invoices</FieldDescription>
      </Field>
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Name" });
  await expect.element(input).toHaveAttribute("id", "explicit-name");
  // Base UI's own merge: the caller's ids stay, first and de-duplicated, and the Field's
  // rendered messages follow — an explicit id is never dropped or reordered.
  const description = screen.container.querySelector(
    '[data-slot="field-description"]',
  )!;
  await expect
    .element(input)
    .toHaveAttribute("aria-describedby", `external-hint ${description.id}`);
  await expect
    .element(input)
    .toHaveAccessibleDescription("Managed elsewhere Shown on invoices");
  expect(
    screen.container
      .querySelector('[data-slot="field-label"]')!
      .getAttribute("for"),
  ).toBe("explicit-name");
});

test("API-26: a control outside a Field is unchanged", async () => {
  const screen = await render(<Input aria-label="Loose" />);
  const input = screen.getByRole("textbox", { name: "Loose" }).element();
  expect(input.hasAttribute("aria-describedby")).toBe(false);
  expect(input.hasAttribute("aria-invalid")).toBe(false);
  expect(input.hasAttribute("aria-labelledby")).toBe(false);
});

test("API-26: the parts keep their slots, classes and the error's alert role", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Name</FieldLabel>
      <Input />
      <FieldDescription>Hint</FieldDescription>
      <FieldError>Bad</FieldError>
    </Field>,
  );
  const root = fieldRoot(screen);
  expect(root.getAttribute("role")).toBe("group");
  expect(root.getAttribute("data-invalid")).toBe("true");
  const label = screen.container.querySelector('[data-slot="field-label"]')!;
  expect(label.tagName).toBe("LABEL");
  expect(label.className).toContain("font-medium");
  const description = screen.container.querySelector(
    '[data-slot="field-description"]',
  )!;
  expect(description.tagName).toBe("P");
  const error = screen.getByRole("alert").element();
  expect(error.getAttribute("data-slot")).toBe("field-error");
  expect(error.querySelector("svg")).not.toBeNull();
});

test("no a11y violations — automatic wiring, valid", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Name</FieldLabel>
      <Input />
      <FieldDescription>Shown on invoices.</FieldDescription>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — automatic wiring, invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Name</FieldLabel>
      <Input />
      <FieldDescription>Shown on invoices.</FieldDescription>
      <FieldError>Name is required.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});
