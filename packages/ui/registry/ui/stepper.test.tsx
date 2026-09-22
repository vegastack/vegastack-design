import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Stepper,
  StepperNode,
  type StepperStep,
  type StepperStepState,
} from "./stepper";

const STEPS: StepperStep[] = [
  { id: "upload", label: "Upload file", state: "complete" },
  { id: "map", label: "Map columns", state: "current" },
  { id: "review", label: "Review", state: "upcoming" },
];

const ALL_STATES: StepperStepState[] = [
  "complete",
  "current",
  "loading",
  "warning",
  "error",
  "skipped",
  "upcoming",
];

// Every query is scoped to its own render's container. This suite has no global cleanup —
// nothing under `packages/ui` has — so a document-wide lookup would quietly answer with an
// earlier test's DOM. One render per test, for the same reason.
function slot(root: ParentNode, name: string): HTMLElement | null {
  return root.querySelector(`[data-slot="${name}"]`);
}

function slots(root: ParentNode, name: string): HTMLElement[] {
  return Array.from(root.querySelectorAll(`[data-slot="${name}"]`));
}

function step(root: ParentNode, label: string): HTMLElement {
  const found = slots(root, "stepper-step").find((el) =>
    el.textContent?.includes(label),
  );
  if (!found) throw new Error(`no step containing "${label}"`);
  return found;
}

function many(count: number): StepperStep[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i}`,
    label: `Step ${i + 1}`,
    state: i === 0 ? ("current" as const) : ("upcoming" as const),
  }));
}

/* ------------------------------------------------------------------ semantics */

test("renders an ordered list with aria-current on the current step", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  const list = screen.getByRole("list", { name: "Import" });
  await expect.element(list).toBeInTheDocument();
  expect((list.element() as HTMLElement).tagName).toBe("OL");
  expect(slots(screen.container, "stepper-step")).toHaveLength(3);
  expect(
    step(screen.container, "Map columns").getAttribute("aria-current"),
  ).toBe("step");
  expect(
    step(screen.container, "Upload file").getAttribute("aria-current"),
  ).toBeNull();
});

test("a loading step is still the current step", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      steps={STEPS.map((s) =>
        s.id === "map" ? { ...s, state: "loading" as const } : s,
      )}
    />,
  );
  expect(
    step(screen.container, "Map columns").getAttribute("aria-current"),
  ).toBe("step");
});

test("never uses tab semantics", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  expect(screen.container.querySelector('[role="tab"]')).toBeNull();
  expect(screen.container.querySelector('[role="tablist"]')).toBeNull();
});

test("forwards its ref to the root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Stepper aria-label="Import" steps={STEPS} ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("stepper");
});

/* --------------------------------------------------------------------- states */

test("every state carries text, never colour or glyph alone", async () => {
  const screen = await render(
    <Stepper
      aria-label="States"
      collapse={false}
      steps={ALL_STATES.map((state) => ({
        id: state,
        label: `${state} step`,
        state,
      }))}
    />,
  );

  const expected: Record<StepperStepState, string> = {
    complete: "Completed",
    current: "Current step",
    loading: "Checking",
    warning: "Needs review",
    error: "Needs attention",
    skipped: "Skipped",
    upcoming: "Not started",
  };
  for (const state of ALL_STATES) {
    const li = step(screen.container, `${state} step`);
    expect(li.dataset.state).toBe(state);
    expect(li.textContent).toContain(expected[state]);
    expect(slot(li, "stepper-node")).not.toBeNull();
  }
});

test("the ordinal shows where there is no glyph, and is replaced where there is", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "Done", state: "complete" },
        { id: "b", label: "Here", state: "current" },
        { id: "c", label: "Later", state: "upcoming" },
      ]}
    />,
  );
  const node = (label: string) =>
    slot(step(screen.container, label), "stepper-node")!;

  // The current step keeps its ordinal, so "how far in am I" stays answerable.
  expect(node("Here").textContent?.trim()).toBe("2");
  expect(node("Later").textContent?.trim()).toBe("3");
  // A completed step gives the ordinal up for a check glyph.
  expect(node("Done").textContent?.trim()).toBe("");
  expect(node("Done").querySelector("svg")).not.toBeNull();
});

test("colour is reserved for warning and error", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "Done", state: "complete" },
        { id: "b", label: "Here", state: "current" },
        { id: "c", label: "Caveat", state: "warning" },
        { id: "d", label: "Failed", state: "error" },
      ]}
    />,
  );
  const label = (text: string) =>
    slot(step(screen.container, text), "stepper-label")!.className;
  const node = (text: string) =>
    slot(step(screen.container, text), "stepper-node")!.className;

  // A11Y-13: a tinted status surface reads through the family's `-text` ink, while the
  // solid node fill carries its `-foreground`. Using the fill as ink would measure under
  // the AA floor. The resolved colours are gated by the contrast lane, which compiles
  // Tailwind; this lane owns which token the component reached for.
  expect(label("Caveat")).toContain("text-warning-text");
  expect(label("Failed")).toContain("text-destructive-text");
  expect(node("Caveat")).toContain("text-warning-foreground");
  expect(node("Failed")).toContain("text-destructive-foreground");

  // Progress is not success: the neutral states stay off the status palette entirely, so
  // colour keeps meaning "this one needs you".
  for (const neutral of ["Done", "Here"]) {
    expect(label(neutral)).not.toMatch(/text-(warning|destructive|success)/);
    expect(node(neutral)).not.toMatch(/bg-(warning|destructive|success)/);
  }
});

test("the loading node spins and the others do not", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "Done", state: "complete" },
        { id: "b", label: "Checking", state: "loading" },
      ]}
    />,
  );
  const glyphClass = (label: string) =>
    slot(step(screen.container, label), "stepper-node")!
      .querySelector("svg")!
      .getAttribute("class") ?? "";

  expect(glyphClass("Checking")).toContain("animate-spin");
  expect(glyphClass("Done")).not.toContain("animate-spin");
});

test("an optional step says so, and skipping it is a separate state", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "Notify owners", state: "upcoming", optional: true },
        { id: "b", label: "Import", state: "current" },
      ]}
    />,
  );
  const notify = step(screen.container, "Notify owners");
  expect(slot(notify, "stepper-optional")?.textContent).toBe("Optional");
  // `optional` is a label, not a state — this step has not been passed over yet.
  expect(notify.dataset.state).toBe("upcoming");
});

/* -------------------------------------------------------------------- the rail */

test("the connector fills behind the flow, from state and never from index", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "Passed", state: "complete" },
        { id: "b", label: "Passed over", state: "skipped" },
        { id: "c", label: "Here", state: "current" },
        { id: "d", label: "Later", state: "upcoming" },
      ]}
    />,
  );
  const connectors = slots(screen.container, "stepper-connector");
  // One fewer connector than steps — the last step has nothing to join.
  expect(connectors).toHaveLength(3);
  expect(connectors[0]!.dataset.passed).toBe(""); // after complete
  expect(connectors[1]!.dataset.passed).toBe(""); // after skipped
  expect(connectors[2]!.dataset.passed).toBeUndefined(); // after current
});

test("an error step behind the current one does not claim to be passed", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "Failed", state: "error" },
        { id: "b", label: "Here", state: "current" },
      ]}
    />,
  );
  expect(
    slots(screen.container, "stepper-connector")[0]!.dataset.passed,
  ).toBeUndefined();
});

/* ----------------------------------------------------------------- orientation */

test("orientation auto stays horizontal below the threshold", async () => {
  const screen = await render(<Stepper aria-label="Five" steps={many(5)} />);
  expect(slot(screen.container, "stepper")?.dataset.orientation).toBe(
    "horizontal",
  );
});

test("orientation auto flips to vertical once the rail would crush its labels", async () => {
  const screen = await render(<Stepper aria-label="Six" steps={many(6)} />);
  expect(slot(screen.container, "stepper")?.dataset.orientation).toBe(
    "vertical",
  );
});

test("an explicit orientation always wins over the step count", async () => {
  const screen = await render(
    <Stepper aria-label="Forced" orientation="horizontal" steps={many(8)} />,
  );
  expect(slot(screen.container, "stepper")?.dataset.orientation).toBe(
    "horizontal",
  );
});

test("verticalFrom moves the threshold", async () => {
  const screen = await render(
    <Stepper aria-label="Import" verticalFrom={3} steps={STEPS} />,
  );
  expect(slot(screen.container, "stepper")?.dataset.orientation).toBe(
    "vertical",
  );
});

test("size and labelPosition are reflected for CSS targeting", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      steps={STEPS}
      size="sm"
      labelPosition="inline"
    />,
  );
  const root = slot(screen.container, "stepper")!;
  expect(root.dataset.size).toBe("sm");
  expect(root.dataset.labelPosition).toBe("inline");
});

test("a vertical rail reports no label position — the axis does not apply", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      orientation="vertical"
      labelPosition="inline"
      steps={STEPS}
    />,
  );
  expect(slot(screen.container, "stepper")?.dataset.labelPosition).toBe(
    undefined,
  );
});

/* -------------------------------------------------------------------- collapse */

test("the compact summary and the full rail are both present, and CSS picks one", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  const summary = slot(screen.container, "stepper-summary")!;
  const rail = screen.container.querySelector("ol")!;

  // The summary names the current step and its position, and carries a real progressbar
  // rather than a decorative bar.
  expect(summary.textContent).toContain("Map columns");
  expect(summary.textContent).toContain("Step 2 of 3");
  expect(summary.querySelector('[role="progressbar"]')).not.toBeNull();

  // Exactly one of the two is laid out at any width, so neither doubles up in the
  // accessibility tree — `display: none` removes a subtree from it outright.
  // `collapse="auto"` derives the breakpoint from the step count — three steps share the
  // width comfortably down to @md, where five would already be shredded.
  expect(summary.className).toContain("@md/stepper:hidden");
  expect(rail.className).toContain("hidden");
  expect(rail.className).toContain("@md/stepper:flex");
});

test("collapse={false} keeps the rail at every width and renders no summary", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={STEPS} collapse={false} />,
  );
  expect(slot(screen.container, "stepper-summary")).toBeNull();
  expect(screen.container.querySelector("ol")!.className).not.toContain(
    "hidden",
  );
});

test("a vertical rail never collapses — it already reads correctly when narrow", async () => {
  const screen = await render(
    <Stepper aria-label="Import" orientation="vertical" steps={STEPS} />,
  );
  expect(slot(screen.container, "stepper-summary")).toBeNull();
});

test("showCount states the position above the rail", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={STEPS} showCount collapse={false} />,
  );
  const counts = slots(screen.container, "stepper-count");
  expect(counts).toHaveLength(1);
  expect(counts[0]!.textContent).toBe("Step 2 of 3");
});

/* ------------------------------------------------------------------- navigable */

test("navigable turns revisitable steps into buttons, and only those", async () => {
  const onStepSelect = vi.fn();
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      navigable
      onStepSelect={onStepSelect}
      steps={[
        { id: "done", label: "Done", state: "complete" },
        { id: "skip", label: "Passed over", state: "skipped" },
        { id: "bad", label: "Failed", state: "error" },
        { id: "here", label: "Here", state: "current" },
        { id: "next", label: "Later", state: "upcoming" },
        { id: "locked", label: "Locked", state: "complete", disabled: true },
      ]}
    />,
  );
  const trigger = (label: string) =>
    slot(step(screen.container, label), "stepper-trigger");

  // A failed step is exactly the one the user needs to get back to.
  expect(trigger("Done")).not.toBeNull();
  expect(trigger("Passed over")).not.toBeNull();
  expect(trigger("Failed")).not.toBeNull();
  // The current step, steps not yet reached, and explicitly disabled steps are not targets.
  expect(trigger("Here")).toBeNull();
  expect(trigger("Later")).toBeNull();
  expect(trigger("Locked")).toBeNull();

  trigger("Failed")!.click();
  expect(onStepSelect).toHaveBeenCalledExactlyOnceWith("bad");
});

// The 24px touch floor on the navigable trigger is proved by the geometry lane
// (`packages/ui/test/geometry.browser.test.tsx`), which compiles Tailwind and hit-tests the
// effective target with `elementFromPoint`. This lane loads no CSS, so a pixel assertion here
// would measure an unstyled box and pass or fail for the wrong reason.
test("without navigable nothing in the rail is interactive", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={STEPS} collapse={false} />,
  );
  expect(screen.container.querySelector("button")).toBeNull();
});

/* ----------------------------------------------------------------------- focus */

test("mounting mid-flow does not steal focus", async () => {
  await render(<Stepper aria-label="Import" steps={STEPS} collapse={false} />);
  expect(document.activeElement).toBe(document.body);
});

test("focus moves to the new step when the current step changes", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={STEPS} collapse={false} />,
  );
  await screen.rerender(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "upload", label: "Upload file", state: "complete" },
        { id: "map", label: "Map columns", state: "complete" },
        { id: "review", label: "Review", state: "current" },
      ]}
    />,
  );
  await vi.waitFor(() => {
    expect(
      step(screen.container, "Review").contains(document.activeElement),
    ).toBe(true);
  });
});

test("re-rendering without changing the current step leaves focus alone", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={STEPS} collapse={false} />,
  );
  await screen.rerender(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={STEPS.map((s) =>
        s.id === "review" ? { ...s, description: "Added later" } : s,
      )}
    />,
  );
  expect(document.activeElement).toBe(document.body);
});

/* ------------------------------------------------------------------------ a11y */

test("is axe-clean at rest", async () => {
  const screen = await render(<Stepper aria-label="Import" steps={STEPS} />);
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean when navigable", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={STEPS} navigable collapse={false} />,
  );
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean when vertical", async () => {
  const screen = await render(
    <Stepper aria-label="Import" orientation="vertical" steps={STEPS} />,
  );
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean with inline labels", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      labelPosition="inline"
      steps={STEPS}
      collapse={false}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean in every step state at once", async () => {
  const screen = await render(
    <Stepper
      aria-label="States"
      collapse={false}
      steps={ALL_STATES.map((state) => ({
        id: state,
        label: `${state} step`,
        state,
        description: "Secondary line",
      }))}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean with optional and disabled steps", async () => {
  const screen = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "Notify", state: "skipped", optional: true },
        { id: "b", label: "Locked", state: "upcoming", disabled: true },
        { id: "c", label: "Here", state: "current" },
      ]}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("collapse=auto widens the breakpoint as steps are added", async () => {
  const three = await render(<Stepper aria-label="Three" steps={many(3)} />);
  expect(slot(three.container, "stepper-summary")!.className).toContain(
    "@md/stepper:hidden",
  );

  const five = await render(<Stepper aria-label="Five" steps={many(5)} />);
  expect(slot(five.container, "stepper-summary")!.className).toContain(
    "@xl/stepper:hidden",
  );
});

test("a named collapse breakpoint pins it regardless of the count", async () => {
  const screen = await render(
    <Stepper aria-label="Import" steps={many(5)} collapse="sm" />,
  );
  expect(slot(screen.container, "stepper-summary")!.className).toContain(
    "@sm/stepper:hidden",
  );
});

/* ------------------------------------------------------------------ the node */

test("StepperNode draws a state on its own, for surfaces without a rail", async () => {
  const screen = await render(
    <>
      <StepperNode state="upcoming" index={4} data-testid="ordinal" />
      <StepperNode state="complete" index={1} data-testid="glyph" />
    </>,
  );
  const [ordinal, glyph] = slots(screen.container, "stepper-node");
  expect(ordinal!.textContent?.trim()).toBe("4");
  expect(glyph!.textContent?.trim()).toBe("");
  expect(glyph!.querySelector("svg")).not.toBeNull();
});

test("StepperNode is the same node the rail renders", async () => {
  // One owner for the glyph-and-ordinal branch: a second copy would drift the first time a
  // state is added, which is the whole reason this part is exported.
  const standalone = await render(<StepperNode state="error" index={2} />);
  const inRail = await render(
    <Stepper
      aria-label="Import"
      collapse={false}
      steps={[
        { id: "a", label: "First", state: "current" },
        { id: "b", label: "Failed", state: "error" },
      ]}
    />,
  );
  expect(slot(standalone.container, "stepper-node")!.className).toBe(
    slot(step(inRail.container, "Failed"), "stepper-node")!.className,
  );
});
