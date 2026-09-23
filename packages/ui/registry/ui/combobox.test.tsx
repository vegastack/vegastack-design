import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "./combobox";
import { Button } from "./button";
import { Field, FieldError, FieldLabel } from "./field";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

function Basic(props: Partial<React.ComponentProps<typeof ComboboxInput>>) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput
        aria-label="Framework"
        placeholder="Select a framework"
        {...props}
      />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** The one real `<input>` a Combobox renders, whatever it is labelled. */
const input = (screen: { container: HTMLElement }) =>
  screen.container.querySelector(
    '[data-slot="input-group-control"]',
  ) as HTMLInputElement;

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

test("renders a combobox input inside an input group (Usage, Composition)", async () => {
  const screen = await render(<Basic />);
  const control = screen.getByRole("combobox", { name: "Framework" });
  await expect
    .element(control)
    .toHaveAttribute("data-slot", "input-group-control");
  expect(
    screen.container.querySelector('[data-slot="input-group"]'),
  ).not.toBeNull();
});

test("the trigger opens the list (Usage, Basic)", async () => {
  const screen = await render(<Basic />);
  await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
  expect(
    document.querySelector('[data-slot="combobox-content"]'),
  ).not.toBeNull();
  expect(document.querySelectorAll('[role="option"]').length).toBe(
    frameworks.length,
  );
});

test("typing filters the list (Basic, Custom Items)", async () => {
  const screen = await render(<Basic />);
  const control = input(screen);
  await userEvent.click(control);
  await userEvent.fill(control, "Rem");
  const labels = [...document.querySelectorAll('[role="option"]')].map(
    (option) => option.textContent,
  );
  expect(labels).toEqual(["Remix"]);
});

test("choosing an option writes it back into the input (Basic)", async () => {
  const screen = await render(<Basic />);
  const control = input(screen);
  await userEvent.click(control);
  await userEvent.click([...document.querySelectorAll('[role="option"]')][0]!);
  expect(control.value).toBe("Next.js");
});

test("an object list filters through itemToStringValue (Custom Items)", async () => {
  const objects = [
    { label: "Next.js", value: "next" },
    { label: "Remix", value: "remix" },
  ];
  const screen = await render(
    <Combobox
      items={objects}
      itemToStringValue={(item: (typeof objects)[number]) => item.label}
    >
      <ComboboxInput aria-label="Framework" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof objects)[number]) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  const control = input(screen);
  await userEvent.click(control);
  await userEvent.fill(control, "Rem");
  expect(
    [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent),
  ).toEqual(["Remix"]);
});

test("multiple renders one chip per value (Multiple Selection, Multiple)", async () => {
  const screen = await render(
    <Combobox multiple items={frameworks} defaultValue={["Next.js", "Astro"]}>
      <ComboboxChips>
        <ComboboxValue>
          {(values: string[]) => (
            <React.Fragment>
              {values.map((value) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput aria-label="Add framework" />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  expect(
    screen.container.querySelectorAll('[data-slot="combobox-chip"]').length,
  ).toBe(2);
  expect(
    screen.container.querySelectorAll('[data-slot="combobox-chip-remove"]')
      .length,
  ).toBe(2);
});

test("showClear renders a clear control (Clear Button)", async () => {
  const screen = await render(
    <Combobox items={frameworks} defaultValue={frameworks[0]}>
      <ComboboxInput aria-label="Framework" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  expect(
    screen.container.querySelector('[data-slot="combobox-clear"]'),
  ).not.toBeNull();
});

test("groups and labels render inside the popup (Groups)", async () => {
  const groups = [
    { value: "Americas", items: ["New York", "Chicago"] },
    { value: "Europe", items: ["London", "Paris"] },
  ];
  const screen = await render(
    <Combobox items={groups}>
      <ComboboxInput aria-label="Timezone" />
      <ComboboxContent>
        <ComboboxEmpty>No timezones found.</ComboboxEmpty>
        <ComboboxList>
          {(group: (typeof groups)[number]) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  await userEvent.click(screen.getByRole("combobox", { name: "Timezone" }));
  expect(document.querySelectorAll('[data-slot="combobox-label"]').length).toBe(
    2,
  );
});

test("autoHighlight marks the first match as active (Auto Highlight)", async () => {
  const screen = await render(
    <Combobox items={frameworks} autoHighlight>
      <ComboboxInput aria-label="Framework" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  const control = input(screen);
  await userEvent.click(control);
  await userEvent.fill(control, "Rem");
  expect(
    document.querySelector('[role="option"][data-highlighted]'),
  ).not.toBeNull();
});

test("a Button trigger opens the popup with the search inside it (Popup)", async () => {
  const screen = await render(
    <Combobox items={frameworks}>
      <ComboboxTrigger render={<Button variant="outline" />}>
        <ComboboxValue>Select framework</ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput showTrigger={false} aria-label="Search frameworks" />
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  await userEvent.click(
    screen.container.querySelector(
      '[data-slot="combobox-trigger"]',
    ) as HTMLElement,
  );
  expect(
    document.querySelector('[data-slot="combobox-content"]'),
  ).not.toBeNull();
  expect(
    document.querySelector('[data-slot="input-group-control"]'),
  ).not.toBeNull();
});

test("disabled disables the control and its trigger (Disabled)", async () => {
  const screen = await render(<Basic disabled />);
  await expect
    .element(screen.getByRole("combobox", { name: "Framework" }))
    .toBeDisabled();
});

test("aria-invalid on the control and FieldError carry the error (Invalid)", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="cb-invalid">Framework</FieldLabel>
      <Combobox items={frameworks}>
        <ComboboxInput id="cb-invalid" aria-invalid="true" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldError>Choose a framework to continue.</FieldError>
    </Field>,
  );
  await expect
    .element(screen.getByRole("combobox", { name: "Framework" }))
    .toHaveAttribute("aria-invalid", "true");
  await expect
    .element(screen.getByText("Choose a framework to continue."))
    .toBeInTheDocument();
});

test("RTL: the field inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Basic />
    </div>,
  );
  const group = screen.container.querySelector(
    '[data-slot="input-group"]',
  ) as HTMLElement;
  expect(getComputedStyle(group).direction).toBe("rtl");
});

test("A11Y-3/A11Y-4: the empty region stays mounted and is never display:none", async () => {
  const screen = await render(<Basic />);
  await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
  const empty = document.querySelector(
    '[data-slot="combobox-empty"]',
  ) as HTMLElement;
  expect(empty).not.toBeNull();
  expect(empty.className).not.toMatch(/(?:^|\s)hidden(?:\s|$)/);
  // It is in the layout with zero height while the list has results, so the platform has been
  // observing it by the time the filter empties.
  expect(getComputedStyle(empty).display).not.toBe("none");
});

test("A11Y-3/A11Y-4: the empty region expands when the filter matches nothing", async () => {
  const screen = await render(<Basic />);
  const control = input(screen);
  await userEvent.click(control);
  await userEvent.fill(control, "zzzz");
  const empty = document.querySelector(
    '[data-slot="combobox-empty"]',
  ) as HTMLElement;
  expect(empty.getBoundingClientRect().height).toBeGreaterThan(0);
});

test("INT-1/FRM-4: an item forces neither the default cursor nor pointer-events-none", async () => {
  const screen = await render(<Basic />);
  await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
  const item = document.querySelector(
    '[data-slot="combobox-item"]',
  ) as HTMLElement;
  expect(item.className).not.toContain("cursor-default");
  expect(item.className).not.toContain("data-disabled:pointer-events-none");
});

test("FOC-1/FOC-3/FOC-6: the chips field takes a border tint and no glow", async () => {
  const screen = await render(
    <Combobox multiple items={frameworks} defaultValue={["Astro"]}>
      <ComboboxChips>
        <ComboboxValue>
          {(values: string[]) => (
            <React.Fragment>
              {values.map((value) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput aria-label="Add framework" />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  const chips = screen.container.querySelector(
    '[data-slot="combobox-chips"]',
  ) as HTMLElement;
  expect(chips.className).toContain("focus-within:border-ring/70");
  expect(chips.className).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  const chipInput = screen.container.querySelector(
    '[data-slot="combobox-chip-input"]',
  ) as HTMLElement;
  expect(chipInput.className).toContain("outline-hidden");
  expect(chipInput.className).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
});

test("FOC-5: the chips field's invalid tint stands down while it holds focus", async () => {
  const screen = await render(
    <Combobox multiple items={frameworks}>
      <ComboboxChips>
        <ComboboxChipsInput aria-label="Add framework" />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  const chips = screen.container.querySelector(
    '[data-slot="combobox-chips"]',
  ) as HTMLElement;
  expect(chips.className).toContain(
    "not-focus-within:has-aria-invalid:border-destructive",
  );
});

test("OVL-13: the popup is portaled out of the component's own subtree", async () => {
  const screen = await render(<Basic />);
  await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
  const popup = document.querySelector('[data-slot="combobox-content"]');
  expect(popup).not.toBeNull();
  expect(screen.container.contains(popup)).toBe(false);
});

test("BRD-1: the combobox popup draws a real border, not a ring outline", async () => {
  const screen = await render(<Basic />);
  await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
  expectBorderNotRing(
    document.querySelector<HTMLElement>('[data-slot="combobox-content"]')!,
  );
});

test("no a11y violations — closed", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="cb-a11y">Framework</FieldLabel>
      <Combobox items={frameworks}>
        <ComboboxInput id="cb-a11y" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Basic />);
  await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
  // No disable list: the open state is audited whole. Its one violation — a tabbable control
  // inside the addon Base UI marks `aria-hidden` — is fixed in the source under A11Y-9.
  await expectNoA11yViolations(document.body);
});

test("A11Y-9: nothing inside the open popup's aria-hidden addon is tabbable", async () => {
  const screen = await render(<Basic />);
  const addon = screen.container.querySelector(
    '[data-slot="input-group-addon"]',
  ) as HTMLElement;
  const toggle = addon.querySelector("button") as HTMLButtonElement;
  // Closed, the addon is exposed to assistive technology; the toggle is still out of the tab
  // sequence, exactly as Base UI's own `Combobox.Clear` is and as APG's editable combobox asks.
  expect(addon.getAttribute("aria-hidden")).toBe(null);
  expect(toggle.tabIndex).toBe(-1);

  await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
  // Open, Base UI hides the whole addon from assistive technology. Pin that shape: the day Base UI
  // stops hiding it, this fails as stale rather than lingering as a silent exemption.
  expect(addon.getAttribute("aria-hidden")).toBe("true");
  expect(
    [
      ...addon.querySelectorAll<HTMLElement>("button,input,a,[tabindex]"),
    ].filter((element) => element.tabIndex >= 0),
  ).toEqual([]);
});

test("A11Y-9: the toggle still works with a mouse, so it is not inert (Usage)", async () => {
  const screen = await render(<Basic />);
  const addon = screen.container.querySelector(
    '[data-slot="input-group-addon"]',
  ) as HTMLElement;
  expect(addon.hasAttribute("inert")).toBe(false);
  await userEvent.click(addon.querySelector("button") as HTMLElement);
  expect(
    document.querySelector('[data-slot="combobox-content"]'),
  ).not.toBeNull();
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Basic disabled />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — multiple", async () => {
  const screen = await render(
    <Combobox multiple items={frameworks} defaultValue={["Astro"]}>
      <ComboboxChips>
        <ComboboxValue>
          {(values: string[]) => (
            <React.Fragment>
              {values.map((value) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput aria-label="Add framework" />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  await expectNoA11yViolations(screen.container);
});
