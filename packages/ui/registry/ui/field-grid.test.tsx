import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Field, FieldLabel, FieldLegend, FieldSet } from "./field";
import { Input } from "./input";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Textarea } from "./textarea";
import { FieldChoices, FieldGrid, FieldGridItem } from "./field-grid";

test("lays fields out in a grid; a textarea field and a full item take the row", async () => {
  const screen = await render(
    <FieldGrid columns={2}>
      <Field>
        <FieldLabel htmlFor="w">Width</FieldLabel>
        <Input id="w" />
      </Field>
      <Field>
        <FieldLabel htmlFor="n">Notes</FieldLabel>
        <Textarea id="n" />
      </Field>
      <FieldGridItem span="full">Full</FieldGridItem>
    </FieldGrid>,
  );
  const root = screen.container.querySelector('[data-slot="field-grid"]');
  expect(root?.getAttribute("data-columns")).toBe("2");
  expect(
    screen.container
      .querySelector('[data-slot="field-grid-item"]')
      ?.getAttribute("data-span"),
  ).toBe("full");
  await expectNoA11yViolations(screen.container);
});

test("FieldChoices sets a radio group in a row", async () => {
  const screen = await render(
    <FieldSet>
      <FieldLegend>Type</FieldLegend>
      <FieldChoices orientation="horizontal">
        <RadioGroup defaultValue="a">
          <Field orientation="horizontal">
            <RadioGroupItem value="a" id="a" />
            <FieldLabel htmlFor="a">Standard</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="b" id="b" />
            <FieldLabel htmlFor="b">Custom</FieldLabel>
          </Field>
        </RadioGroup>
      </FieldChoices>
    </FieldSet>,
  );
  const choices = screen.container.querySelector('[data-slot="field-choices"]');
  expect(choices?.getAttribute("data-orientation")).toBe("horizontal");
  await expect
    .element(screen.getByRole("radio", { name: "Custom" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});
