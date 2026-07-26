import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Stepper, type StepperStep } from "./stepper";

const STEPS: StepperStep[] = [
  { id: "upload", label: "Upload file", state: "complete" },
  { id: "map", label: "Map columns", state: "current" },
  { id: "review", label: "Review", state: "upcoming" },
];

function step(id: string): HTMLElement {
  return Array.from(
    document.querySelectorAll('[data-slot="stepper-step"]'),
  ).find((el) => el.textContent?.includes(id)) as HTMLElement;
}

test("renders an ordered list with aria-current on the current step", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  const list = screen.getByRole("list", { name: "Import" });
  await expect.element(list).toBeInTheDocument();
  expect((list.element() as HTMLElement).tagName).toBe("OL");
  const items = document.querySelectorAll('[data-slot="stepper-step"]');
  expect(items).toHaveLength(3);
  expect(step("Map columns").getAttribute("aria-current")).toBe("step");
  expect(step("Upload file").getAttribute("aria-current")).toBeNull();
});

test("never uses tab semantics", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  expect(screen.container.querySelector('[role="tab"]')).toBeNull();
  expect(screen.container.querySelector('[role="tablist"]')).toBeNull();
});

test("every state renders its icon AND text — never colour alone", async () => {
  const steps: StepperStep[] = [
    { id: "a", label: "Done step", state: "complete" },
    { id: "b", label: "Now step", state: "current" },
    { id: "c", label: "Next step", state: "upcoming" },
    { id: "d", label: "Broken step", state: "error" },
  ];
  await render(<Stepper aria-label="Flow" steps={steps} />);
  expect(step("Done step").textContent).toContain("Completed");
  expect(step("Now step").textContent).toContain("Current step");
  expect(step("Next step").textContent).toContain("Not started");
  expect(step("Broken step").textContent).toContain("Needs attention");
  expect(step("Broken step").dataset.state).toBe("error");
  const icon = step("Broken step").querySelector('[data-slot="status-icon"]');
  expect(icon?.getAttribute("data-status")).toBe("blocked");
});

test("linear mode renders no interactive steps", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  expect(screen.container.querySelector("button")).toBeNull();
});

test("navigable mode: completed steps are buttons; upcoming/current/disabled are not", async () => {
  const onStepSelect = vi.fn();
  const steps: StepperStep[] = [
    { id: "a", label: "First", state: "complete" },
    { id: "b", label: "Second", state: "complete", disabled: true },
    { id: "c", label: "Third", state: "current" },
    { id: "d", label: "Fourth", state: "upcoming" },
  ];
  const screen = await render(
    <Stepper
      aria-label="Flow"
      steps={steps}
      navigable
      onStepSelect={onStepSelect}
    />,
  );
  const buttons = screen.container.querySelectorAll("button");
  expect(buttons).toHaveLength(1);
  await screen.getByRole("button", { name: /First/ }).click();
  expect(onStepSelect).toHaveBeenCalledWith("a");
});

test("blockedReason renders against the current step, polite, with a wireable id", async () => {
  await render(
    <Stepper
      aria-label="Import"
      steps={STEPS}
      blockedReason="Map every required column to continue"
      blockedReasonId="advance-block"
    />,
  );
  const reason = document.getElementById("advance-block")!;
  expect(reason.textContent).toBe("Map every required column to continue");
  expect(reason.getAttribute("aria-live")).toBe("polite");
  // Rendered inside the CURRENT step's item.
  expect(step("Map columns").contains(reason)).toBe(true);
});

test("focus moves to the NEW current step's label on change — never on mount", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  // Mount must not steal focus.
  expect(document.activeElement).toBe(document.body);
  const advanced: StepperStep[] = [
    { id: "upload", label: "Upload file", state: "complete" },
    { id: "map", label: "Map columns", state: "complete" },
    { id: "review", label: "Review", state: "current" },
  ];
  await screen.rerender(<Stepper aria-label="Import" steps={advanced} />);
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.textContent ?? "")
    .toContain("Review");
});

test("orientation is reflected as data-orientation with identical DOM order", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={STEPS} orientation="vertical" />,
  );
  const list = screen
    .getByRole("list", { name: "Import" })
    .element() as HTMLElement;
  expect(list.dataset.orientation).toBe("vertical");
  const labels = Array.from(
    list.querySelectorAll('[data-slot="stepper-label"]'),
  ).map((el) => el.textContent);
  expect(labels[0]).toContain("Upload file");
  expect(labels[2]).toContain("Review");
});

test("the current step's status glyph does not spin — current is a position, not activity", async () => {
  await render(<Stepper aria-label="Import" steps={STEPS} />);
  const icon = step("Map columns").querySelector(
    '[data-slot="status-icon"]',
  ) as HTMLElement;
  expect(icon.getAttribute("data-status")).toBe("progress");
  expect(icon.getAttribute("class") ?? "").toContain("animate-none");
});

test("ref forwards to the list root", async () => {
  const ref = React.createRef<HTMLOListElement>();
  await render(<Stepper ref={ref} aria-label="Import" steps={STEPS} />);
  expect(ref.current?.dataset.slot).toBe("stepper");
});

test("no a11y violations — linear, navigable, blocked, vertical", async () => {
  const screen = await render(
    <div>
      <Stepper aria-label="Linear" steps={STEPS} />
      <Stepper aria-label="Navigable" steps={STEPS} navigable />
      <Stepper
        aria-label="Blocked"
        steps={STEPS}
        blockedReason="Finish mapping first"
      />
      <Stepper aria-label="Vertical" steps={STEPS} orientation="vertical" />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
