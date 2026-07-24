import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";

function Basic({ defaultOpen }: { defaultOpen?: boolean } = {}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>Show details</CollapsibleTrigger>
      <CollapsibleContent>
        <div>Panel body</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

test("renders the trigger", async () => {
  const screen = await render(<Basic />);
  await expect
    .element(screen.getByRole("button", { name: "Show details" }))
    .toBeInTheDocument();
});

test("is closed by default — trigger collapsed, no panel content", async () => {
  const screen = await render(<Basic />);
  await expect
    .element(screen.getByRole("button", { name: "Show details" }))
    .toHaveAttribute("aria-expanded", "false");
  expect(
    screen.container.querySelector('[data-slot="collapsible-content"]'),
  ).toBeNull();
});

test("clicking the trigger opens the panel and sets data-open", async () => {
  const screen = await render(<Basic />);
  const trigger = screen.getByRole("button", { name: "Show details" });
  await trigger.click();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await expect.element(trigger).toHaveAttribute("data-panel-open");
  await expect.element(screen.getByText("Panel body")).toBeInTheDocument();
  const panel = screen.container.querySelector(
    '[data-slot="collapsible-content"]',
  );
  expect(panel).not.toBeNull();
  expect(panel).toHaveAttribute("data-open");
});

test("clicking again closes the panel and hides its content", async () => {
  const screen = await render(<Basic defaultOpen />);
  const trigger = screen.getByRole("button", { name: "Show details" });
  await expect.element(screen.getByText("Panel body")).toBeInTheDocument();
  await trigger.click();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.container.querySelector('[data-slot="collapsible-content"]'),
  ).toBeNull();
});

test("open by default renders the panel content", async () => {
  const screen = await render(<Basic defaultOpen />);
  await expect.element(screen.getByText("Panel body")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Show details" }))
    .toHaveAttribute("aria-expanded", "true");
});

test("disabled root marks the trigger disabled and stays closed", async () => {
  const screen = await render(
    <Collapsible disabled>
      <CollapsibleTrigger>Show details</CollapsibleTrigger>
      <CollapsibleContent>Panel body</CollapsibleContent>
    </Collapsible>,
  );
  const trigger = screen.getByRole("button", { name: "Show details" });
  await expect.element(trigger).toHaveAttribute("data-disabled");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.container.querySelector('[data-slot="collapsible-content"]'),
  ).toBeNull();
});

test("disabled trigger dims via data-disabled (Base UI surfaces root-level disabled as a data attribute)", async () => {
  const screen = await render(
    <Collapsible disabled>
      <CollapsibleTrigger>Show details</CollapsibleTrigger>
      <CollapsibleContent>Panel body</CollapsibleContent>
    </Collapsible>,
  );
  const trigger = screen.getByRole("button", { name: "Show details" });
  // Base UI writes `data-disabled` on the trigger (no native `disabled` attribute
  // when the root is disabled), so the class string must carry the data-disabled dim.
  await expect.element(trigger).toHaveAttribute("data-disabled");
  const el = screen.container.querySelector(
    '[data-slot="collapsible-trigger"]',
  )!;
  expect(el.className).toContain("data-disabled:opacity-(--opacity-dim)");
  expect(el.className).toContain("data-disabled:pointer-events-none");
});

test("parts carry their data-slot attributes", async () => {
  const screen = await render(<Basic defaultOpen />);
  expect(
    screen.container.querySelector('[data-slot="collapsible"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="collapsible-trigger"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="collapsible-content"]'),
  ).not.toBeNull();
});

test("forwards ref to the underlying collapsible root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Collapsible ref={ref}>
      <CollapsibleTrigger>Show details</CollapsibleTrigger>
      <CollapsibleContent>Panel body</CollapsibleContent>
    </Collapsible>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("collapsible");
});

test("no a11y violations", async () => {
  const screen = await render(<Basic defaultOpen />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Collapsible disabled>
      <CollapsibleTrigger>Show details</CollapsibleTrigger>
      <CollapsibleContent>Panel body</CollapsibleContent>
    </Collapsible>,
  );
  await expectNoA11yViolations(screen.container);
});
