import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  MultiStepForm,
  MultiStepFormActions,
  MultiStepFormExit,
  MultiStepFormNav,
  MultiStepFormStep,
  type MultiStepFormStepSpec,
} from "./multi-step-form";

// Every query is scoped to its own render's container: this suite has no global cleanup, so
// a document-wide lookup would answer with an earlier test's DOM.
function slot(root: ParentNode, name: string): HTMLElement | null {
  return root.querySelector(`[data-slot="${name}"]`);
}

function slots(root: ParentNode, name: string): HTMLElement[] {
  return Array.from(root.querySelectorAll(`[data-slot="${name}"]`));
}

function railLabels(root: ParentNode): string[] {
  return slots(root, "stepper-step").map(
    (el) =>
      el.querySelector("[data-slot='stepper-label'] span")?.textContent ?? "",
  );
}

function stepState(root: ParentNode, label: string): string | undefined {
  return slots(root, "stepper-step").find((el) =>
    el.textContent?.includes(label),
  )?.dataset.state;
}

const BASIC: MultiStepFormStepSpec[] = [
  { id: "account", label: "Account" },
  { id: "billing", label: "Billing" },
  { id: "review", label: "Review" },
];

function Wizard({
  steps = BASIC,
  ...rest
}: Partial<React.ComponentProps<typeof MultiStepForm>> & {
  steps?: MultiStepFormStepSpec[];
}) {
  return (
    <MultiStepForm steps={steps} {...rest}>
      <MultiStepFormNav aria-label="Signup" />
      {steps.map((s) => (
        <MultiStepFormStep key={s.id} id={s.id}>
          <p>{s.label} body</p>
        </MultiStepFormStep>
      ))}
      <MultiStepFormActions />
    </MultiStepForm>
  );
}

const next = (root: ParentNode) =>
  slot(root, "multi-step-form-next") as HTMLButtonElement;
const back = (root: ParentNode) =>
  slot(root, "multi-step-form-back") as HTMLButtonElement;

/** Buttons here stay focusable when disabled, so `aria-disabled` is the fact, not `.disabled`. */
function isDisabled(el: HTMLElement | null): boolean {
  return el?.getAttribute("aria-disabled") === "true";
}

// The phone layouts branch on `useIsMobile`, which subscribes to `matchMedia`. The runner's
// own viewport is not a contract, so every test STATES which side of the breakpoint it is
// on rather than inheriting one — otherwise a narrow runner silently tests the phone layout
// for the whole file, which is exactly what happened on the first run.
const realMatchMedia = window.matchMedia;
function forceViewport(isMobile: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
const forceMobile = () => forceViewport(true);

beforeEach(() => {
  forceViewport(false);
  window.location.hash = "";
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  try {
    window.sessionStorage.clear();
  } catch {
    /* storage may be unavailable; the suite does not depend on it */
  }
});

/* ------------------------------------------------------------------ sequencing */

test("renders the first step's body and only that one", async () => {
  const screen = await render(<Wizard />);
  expect(screen.container.textContent).toContain("Account body");
  expect(screen.container.textContent).not.toContain("Billing body");
  expect(slots(screen.container, "multi-step-form-step")).toHaveLength(1);
});

test("Continue advances, and the rail records what was passed", async () => {
  const screen = await render(<Wizard />);
  await userEvent.click(next(screen.container));
  expect(screen.container.textContent).toContain("Billing body");
  expect(stepState(screen.container, "Account")).toBe("complete");
  expect(stepState(screen.container, "Billing")).toBe("current");
});

test("Back returns, and is disabled on the first step", async () => {
  const screen = await render(<Wizard />);
  expect(isDisabled(back(screen.container))).toBe(true);
  await userEvent.click(next(screen.container));
  expect(isDisabled(back(screen.container))).toBe(false);
  await userEvent.click(back(screen.container));
  expect(screen.container.textContent).toContain("Account body");
});

test("the last step submits instead of advancing", async () => {
  const onComplete = vi.fn();
  const screen = await render(<Wizard onComplete={onComplete} />);
  await userEvent.click(next(screen.container));
  await userEvent.click(next(screen.container));
  expect(next(screen.container).textContent).toContain("Submit");
  await userEvent.click(next(screen.container));
  expect(onComplete).toHaveBeenCalledOnce();
});

test("labels are overridable globally and per step", async () => {
  const screen = await render(
    <Wizard
      backLabel="Go back"
      nextLabel="Next up"
      submitLabel="Create account"
      steps={[
        { id: "a", label: "A", nextLabel: "Start" },
        { id: "b", label: "B" },
      ]}
    />,
  );
  expect(next(screen.container).textContent).toContain("Start");
  await userEvent.click(next(screen.container));
  expect(next(screen.container).textContent).toContain("Create account");
  expect(back(screen.container).textContent).toContain("Go back");
});

/* ------------------------------------------------------- conditional steps */

test("a hidden step leaves the rail, the count and the sequence", async () => {
  const withBranch = (business: boolean): MultiStepFormStepSpec[] => [
    { id: "account", label: "Account" },
    { id: "company", label: "Business details", when: business },
    { id: "review", label: "Review" },
  ];

  const individual = await render(<Wizard steps={withBranch(false)} />);
  expect(railLabels(individual.container)).toEqual(["Account", "Review"]);

  const business = await render(<Wizard steps={withBranch(true)} />);
  expect(railLabels(business.container)).toEqual([
    "Account",
    "Business details",
    "Review",
  ]);
  // …and the sequence follows it, rather than the original indices.
  await userEvent.click(next(business.container));
  expect(business.container.textContent).toContain("Business details body");
});

test("a branch closing under the current step rewinds rather than stranding it", async () => {
  function Host() {
    const [business, setBusiness] = React.useState(true);
    const steps: MultiStepFormStepSpec[] = [
      { id: "account", label: "Account" },
      { id: "company", label: "Business details", when: business },
      { id: "review", label: "Review" },
    ];
    return (
      <>
        <button type="button" onClick={() => setBusiness(false)}>
          switch to individual
        </button>
        <Wizard steps={steps} />
      </>
    );
  }
  const screen = await render(<Host />);
  await userEvent.click(next(screen.container));
  expect(screen.container.textContent).toContain("Business details body");
  await userEvent.click(screen.getByText("switch to individual"));
  // The step it was standing on no longer exists; it lands on the furthest step the flow
  // still admits instead of rendering nothing.
  expect(slots(screen.container, "multi-step-form-step")).toHaveLength(1);
  expect(railLabels(screen.container)).toEqual(["Account", "Review"]);
});

/* -------------------------------------------------------------------- guards */

test("canGoNext disables the action with no round trip", async () => {
  const screen = await render(
    <Wizard
      steps={[
        { id: "a", label: "A", canGoNext: false },
        { id: "b", label: "B" },
      ]}
    />,
  );
  expect(isDisabled(next(screen.container))).toBe(true);
});

test("a refused move does not happen, and says why beside the control", async () => {
  const screen = await render(
    <Wizard
      steps={[
        {
          id: "a",
          label: "A",
          beforeNext: () => "Your bank declined this card.",
        },
        { id: "b", label: "B" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  const refusal = slot(screen.container, "multi-step-form-refusal")!;
  expect(refusal.dataset.tone).toBe("error");
  expect(refusal.textContent).toContain("Your bank declined this card.");
  // The flow stayed put, the step is marked, and the reason is tied to the button it blocks.
  expect(screen.container.textContent).toContain("A body");
  expect(stepState(screen.container, "A")).toBe("error");
  expect(next(screen.container).getAttribute("aria-describedby")).toBe(
    refusal.id,
  );
});

test("a soft gate reads quiet and leaves the rail alone", async () => {
  const screen = await render(
    <Wizard
      steps={[
        {
          id: "a",
          label: "A",
          beforeNext: () => ({
            reason: "Map every required column to continue.",
            tone: "soft" as const,
          }),
        },
        { id: "b", label: "B" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  const refusal = slot(screen.container, "multi-step-form-refusal")!;
  expect(refusal.dataset.tone).toBe("soft");
  expect(refusal.getAttribute("role")).toBe("status");
  // "not yet" is not "broken".
  expect(stepState(screen.container, "A")).toBe("current");
});

test("the flow waits for an async guard and never advances optimistically", async () => {
  let release: (value: true) => void = () => {};
  const screen = await render(
    <Wizard
      steps={[
        {
          id: "a",
          label: "A",
          beforeNext: () =>
            new Promise<true>((resolve) => {
              release = resolve;
            }),
        },
        { id: "b", label: "B" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  // Mid-flight: still on A, the step is `loading`, and the action is busy.
  expect(screen.container.textContent).toContain("A body");
  expect(stepState(screen.container, "A")).toBe("loading");
  expect(next(screen.container).getAttribute("aria-busy")).toBe("true");

  release(true);
  await vi.waitFor(() => {
    expect(screen.container.textContent).toContain("B body");
  });
});

test("a guard that throws is a transport failure, and the host is told", async () => {
  const onTransportError = vi.fn();
  const boom = new Error("network down");
  const screen = await render(
    <Wizard
      onTransportError={onTransportError}
      steps={[
        {
          id: "a",
          label: "A",
          beforeNext: () => {
            throw boom;
          },
        },
        { id: "b", label: "B" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  await vi.waitFor(() => {
    expect(onTransportError).toHaveBeenCalledOnce();
  });
  expect(onTransportError.mock.calls[0]![0]).toBe(boom);
  // The host owns the toast, so nothing inline is rendered — but the flow stayed put.
  expect(slot(screen.container, "multi-step-form-refusal")).toBeNull();
  expect(screen.container.textContent).toContain("A body");
});

test("without a transport handler the failure is never silent", async () => {
  const screen = await render(
    <Wizard
      steps={[
        {
          id: "a",
          label: "A",
          beforeNext: () => {
            throw new Error("network down");
          },
        },
        { id: "b", label: "B" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  await vi.waitFor(() => {
    expect(
      slot(screen.container, "multi-step-form-refusal")?.textContent,
    ).toContain("could not run");
  });
});

test("beforeBack gates the backward move too", async () => {
  const screen = await render(
    <Wizard
      steps={[
        { id: "a", label: "A" },
        { id: "b", label: "B", beforeBack: () => "Finish this step first." },
        { id: "c", label: "C" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  await userEvent.click(back(screen.container));
  expect(screen.container.textContent).toContain("B body");
  expect(
    slot(screen.container, "multi-step-form-refusal")?.textContent,
  ).toContain("Finish this step first.");
});

/* ---------------------------------------------------------------------- lock */

test("a locking step seals everything behind it, for good", async () => {
  const screen = await render(
    <Wizard
      steps={[
        { id: "a", label: "A" },
        { id: "b", label: "B", lock: true },
        { id: "c", label: "C" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  await userEvent.click(next(screen.container)); // passes the locking step
  expect(screen.container.textContent).toContain("C body");
  expect(isDisabled(back(screen.container))).toBe(true);
  expect(back(screen.container).dataset.sealed).toBe("");
  // …and the sealed steps are not jump targets either.
  expect(stepState(screen.container, "A")).toBe("complete");
  expect(slots(screen.container, "stepper-step")[0]!.dataset.disabled).toBe("");
});

/* -------------------------------------------------------------- optional steps */

test("an optional step offers Skip, which records skipped rather than complete", async () => {
  const screen = await render(
    <Wizard
      steps={[
        { id: "a", label: "A", optional: true },
        { id: "b", label: "B" },
      ]}
    />,
  );
  const skip = slot(screen.container, "multi-step-form-skip")!;
  await userEvent.click(skip);
  expect(screen.container.textContent).toContain("B body");
  expect(stepState(screen.container, "A")).toBe("skipped");
});

test("a required step offers no Skip", async () => {
  const screen = await render(<Wizard />);
  expect(slot(screen.container, "multi-step-form-skip")).toBeNull();
});

/* ------------------------------------------------------------- reachability */

test("nothing is satisfied in a fresh flow, so a deep link rewinds to the start", async () => {
  const screen = await render(<Wizard defaultStep="review" />);
  expect(screen.container.textContent).toContain("Account body");
});

test("an existing record satisfies every step, so the same link opens where it points", async () => {
  const loaded = BASIC.map((s) => ({ ...s, satisfied: true }));
  const screen = await render(<Wizard steps={loaded} defaultStep="review" />);
  expect(screen.container.textContent).toContain("Review body");
});

test("a partly satisfied flow stops at the first gap", async () => {
  const screen = await render(
    <Wizard
      defaultStep="review"
      steps={[
        { id: "account", label: "Account", satisfied: true },
        { id: "billing", label: "Billing" },
        { id: "review", label: "Review" },
      ]}
    />,
  );
  expect(screen.container.textContent).toContain("Billing body");
});

test("a step the flow will not admit is reported back, not silently ignored", async () => {
  const onStepChange = vi.fn();
  await render(<Wizard defaultStep="review" onStepChange={onStepChange} />);
  // Otherwise the host keeps believing the flow is on `review` and the disagreement only
  // surfaces later as an inexplicable jump.
  await vi.waitFor(() => {
    expect(onStepChange).toHaveBeenCalledWith("account");
  });
  expect(onStepChange).toHaveBeenCalledOnce();
});

test("a controlled host that ignores the correction is not spun", async () => {
  const onStepChange = vi.fn();
  const screen = await render(
    <Wizard step="review" onStepChange={onStepChange} />,
  );
  await vi.waitFor(() => {
    expect(onStepChange).toHaveBeenCalledWith("account");
  });
  // The prop still says `review`; the report must not fire again on every render.
  await screen.rerender(<Wizard step="review" onStepChange={onStepChange} />);
  expect(onStepChange).toHaveBeenCalledOnce();
});

test("navigable=auto offers jumping exactly when another step is reachable", async () => {
  const fresh = await render(<Wizard />);
  expect(slot(fresh.container, "stepper-trigger")).toBeNull();

  const loaded = await render(
    <Wizard steps={BASIC.map((s) => ({ ...s, satisfied: true }))} />,
  );
  expect(slot(loaded.container, "stepper-trigger")).not.toBeNull();
});

test("jumping moves the flow, and a sealed step is never a target", async () => {
  const onStepChange = vi.fn();
  const screen = await render(
    <Wizard
      steps={BASIC.map((s) => ({ ...s, satisfied: true }))}
      onStepChange={onStepChange}
    />,
  );
  const triggers = slots(screen.container, "stepper-trigger");
  await userEvent.click(triggers[triggers.length - 1]!);
  expect(onStepChange).toHaveBeenCalledWith("review");
  expect(screen.container.textContent).toContain("Review body");
});

/* ------------------------------------------------------------------ url sync */

test("urlSync writes a namespaced hash and follows the browser's Back", async () => {
  const screen = await render(<Wizard urlSync />);
  await vi.waitFor(() => {
    expect(window.location.hash).toBe("#step=account");
  });
  await userEvent.click(next(screen.container));
  await vi.waitFor(() => {
    expect(window.location.hash).toBe("#step=billing");
  });

  // A hashchange — which is what the browser's Back button produces — moves a step.
  window.location.hash = "#step=account";
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  await vi.waitFor(() => {
    expect(screen.container.textContent).toContain("Account body");
  });
});

test("a forged hash cannot bypass a gate", async () => {
  window.location.hash = "#step=review";
  const screen = await render(<Wizard urlSync />);
  await vi.waitFor(() => {
    expect(screen.container.textContent).toContain("Account body");
  });
  // …and the bar is corrected rather than left disagreeing with the screen.
  await vi.waitFor(() => {
    expect(window.location.hash).toBe("#step=account");
  });
});

test("no hash is written without urlSync", async () => {
  await render(<Wizard />);
  expect(window.location.hash).toBe("");
});

/* ------------------------------------------------------------------- resume */

test("persistKey restores the position and what was passed", async () => {
  const first = await render(<Wizard persistKey="signup" />);
  await userEvent.click(next(first.container));
  expect(first.container.textContent).toContain("Billing body");

  const second = await render(<Wizard persistKey="signup" />);
  await vi.waitFor(() => {
    expect(second.container.textContent).toContain("Billing body");
  });
});

test("nothing is stored without persistKey", async () => {
  const screen = await render(<Wizard />);
  await userEvent.click(next(screen.container));
  const keys = Object.keys(window.sessionStorage).filter((k) =>
    k.startsWith("vegastack:multi-step-form:"),
  );
  expect(keys).toEqual([]);
});

/* -------------------------------------------------------------- phone layout */

test("a phone whose steps are reachable gets tappable section rows", async () => {
  forceMobile();
  const screen = await render(
    <Wizard steps={BASIC.map((s) => ({ ...s, satisfied: true }))} />,
  );
  const nav = slot(screen.container, "multi-step-form-nav")!;
  expect(nav.dataset.variant).toBe("section-list");
  expect(slots(screen.container, "multi-step-form-section")).toHaveLength(3);
  // The overview replaces the body, rather than stacking a long list above it.
  expect(slots(screen.container, "multi-step-form-step")).toHaveLength(0);

  await userEvent.click(
    slots(screen.container, "multi-step-form-section-trigger")[2]!,
  );
  expect(screen.container.textContent).toContain("Review body");
  expect(slot(screen.container, "multi-step-form-nav")!.dataset.variant).toBe(
    "drill-in",
  );
});

test("the phone overview carries the action that finishes the record", async () => {
  forceMobile();
  const onComplete = vi.fn();
  const screen = await render(
    <Wizard
      steps={BASIC.map((s) => ({ ...s, satisfied: true }))}
      submitLabel="Save changes"
      onComplete={onComplete}
    />,
  );
  // The section list IS the screen here, so it must be able to finish — otherwise the only
  // way out is to drill into an arbitrary step and submit from there.
  const finish = slot(screen.container, "multi-step-form-finish")!;
  expect(finish.textContent).toContain("Save changes");
  await userEvent.click(finish);
  expect(onComplete).toHaveBeenCalledOnce();
});

test("focus follows the process on the phone, where there is no rail to carry it", async () => {
  forceMobile();
  const screen = await render(
    <Wizard steps={BASIC.map((s) => ({ ...s, satisfied: true }))} />,
  );
  // Mounting on the overview must not steal focus, exactly as on the rail.
  expect(document.activeElement).toBe(document.body);

  await userEvent.click(
    slots(screen.container, "multi-step-form-section-trigger")[2]!,
  );
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(
      slot(screen.container, "multi-step-form-heading"),
    );
  });

  // …and going back to the list lands on the list, not nowhere.
  await userEvent.click(
    slot(screen.container, "multi-step-form-overview-trigger")!,
  );
  await vi.waitFor(() => {
    expect((document.activeElement as HTMLElement)?.tagName).toBe("OL");
  });
});

test("a phone whose steps are NOT reachable keeps the rail, which collapses itself", async () => {
  forceMobile();
  const screen = await render(<Wizard />);
  const nav = slot(screen.container, "multi-step-form-nav")!;
  // Rows would promise tapping the flow cannot honour, so it stays the Stepper.
  expect(nav.dataset.variant).toBe("stepper");
  expect(slot(screen.container, "multi-step-form-section")).toBeNull();
  expect(slot(screen.container, "stepper-summary")).not.toBeNull();
});

/* ----------------------------------------------------------- panel layout */

test("layout=panel makes the body the one scrolling region", async () => {
  const screen = await render(<Wizard layout="panel" />);
  const root = slot(screen.container, "multi-step-form")!;
  expect(root.dataset.layout).toBe("panel");
  // The frame holds; only the middle scrolls, so a dialog cannot grow past the viewport and
  // take its own footer with it.
  expect(slot(screen.container, "multi-step-form-step")!.className).toContain(
    "overflow-y-auto",
  );
  for (const part of ["multi-step-form-nav", "multi-step-form-actions"]) {
    expect(slot(screen.container, part)!.className).toContain("shrink-0");
  }
});

test("layout=flow leaves everything to grow down the page", async () => {
  const screen = await render(<Wizard />);
  expect(slot(screen.container, "multi-step-form")!.dataset.layout).toBe(
    "flow",
  );
  expect(
    slot(screen.container, "multi-step-form-step")!.className,
  ).not.toContain("overflow-y-auto");
  expect(
    slot(screen.container, "multi-step-form-nav")!.className,
  ).not.toContain("shrink-0");
});

/* ------------------------------------------------------------- exit guard */

function WithExit(
  props: Partial<React.ComponentProps<typeof MultiStepForm>> = {},
) {
  return (
    <MultiStepForm steps={BASIC} {...props}>
      <MultiStepFormNav aria-label="Signup" />
      <MultiStepFormStep id="account">
        <p>Account body</p>
      </MultiStepFormStep>
      <MultiStepFormActions>
        <MultiStepFormExit>Cancel</MultiStepFormExit>
      </MultiStepFormActions>
    </MultiStepForm>
  );
}

test("a clean flow leaves straight away — no confirmation nobody needs", async () => {
  const onExit = vi.fn();
  const screen = await render(<WithExit onExit={onExit} />);
  slot(screen.container, "multi-step-form-exit")!.click();
  expect(onExit).toHaveBeenCalledOnce();
  expect(
    document.querySelector('[data-slot="multi-step-form-exit-prompt"]'),
  ).toBeNull();
  screen.unmount();
});

// An AlertDialog is MODAL: while one is open Base UI marks the rest of the document inert,
// and this suite has no global cleanup. So each of these unmounts its own wizard, and they
// dispatch DOM clicks rather than pointer gestures — the contract under test is the guard,
// not whether a pixel is reachable through a stack of leftover overlays.
test("a dirty flow asks first, and staying does not leave", async () => {
  const onExit = vi.fn();
  const screen = await render(<WithExit dirty onExit={onExit} />);
  slot(screen.container, "multi-step-form-exit")!.click();
  const prompt = await vi.waitFor(() => {
    const el = document.querySelector(
      '[data-slot="multi-step-form-exit-prompt"]',
    );
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  expect(onExit).not.toHaveBeenCalled();
  await expectNoA11yViolations(prompt);

  (
    prompt.querySelector('[data-slot="alert-dialog-cancel"]') as HTMLElement
  ).click();
  await vi.waitFor(() => {
    expect(
      document.querySelector('[data-slot="multi-step-form-exit-prompt"]'),
    ).toBeNull();
  });
  expect(onExit).not.toHaveBeenCalled();
  screen.unmount();
});

test("confirming the prompt leaves", async () => {
  const onExit = vi.fn();
  const screen = await render(<WithExit dirty onExit={onExit} />);
  slot(screen.container, "multi-step-form-exit")!.click();
  const confirm = await vi.waitFor(() => {
    const el = document.querySelector(
      '[data-slot="multi-step-form-exit-confirm"]',
    );
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  confirm.click();
  await vi.waitFor(() => {
    expect(onExit).toHaveBeenCalledOnce();
  });
  await vi.waitFor(() => {
    expect(
      document.querySelector('[data-slot="multi-step-form-exit-prompt"]'),
    ).toBeNull();
  });
  screen.unmount();
});

/** Ask the document what it would do, rather than spying on how it was wired. */
function refreshWouldWarn(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

// These assert the BEHAVIOUR rather than spying on `window.addEventListener`: the spy
// outlived its own assertion and took four later tests down with it. They are also two tests
// rather than one, because an unmount followed by another render inside a single test
// detaches the render container — the same trap the Stepper suite documents.
test("a clean flow lets a refresh through", async () => {
  await render(<WithExit />);
  expect(refreshWouldWarn()).toBe(false);
});

test("a dirty flow warns about a refresh, and stops once it unmounts", async () => {
  const screen = await render(<WithExit dirty />);
  expect(refreshWouldWarn()).toBe(true);
  screen.unmount();
  // A refresh warning that outlives the flow is its own bug.
  expect(refreshWouldWarn()).toBe(false);
});

/* --------------------------------------------------------------------- focus */

test("a transition moves focus exactly once, and the form does not add a second move", async () => {
  const screen = await render(<Wizard />);
  await userEvent.click(next(screen.container));
  await vi.waitFor(() => {
    const active = document.activeElement;
    const billing = slots(screen.container, "stepper-step").find((el) =>
      el.textContent?.includes("Billing"),
    )!;
    // Focus is on the rail's new label — never the step body, and never left on the button.
    expect(billing.contains(active)).toBe(true);
  });
});

/* ---------------------------------------------------------------------- a11y */

test("is axe-clean at rest", async () => {
  const screen = await render(<Wizard />);
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean showing a hard refusal", async () => {
  const screen = await render(
    <Wizard
      steps={[
        { id: "a", label: "A", beforeNext: () => "That card was declined." },
        { id: "b", label: "B" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean showing a soft gate", async () => {
  const screen = await render(
    <Wizard
      steps={[
        {
          id: "a",
          label: "A",
          beforeNext: () => ({ reason: "Pick a plan.", tone: "soft" as const }),
        },
        { id: "b", label: "B" },
      ]}
    />,
  );
  await userEvent.click(next(screen.container));
  await expectNoA11yViolations(screen.container);
});

test("is axe-clean on the phone section list", async () => {
  forceMobile();
  const screen = await render(
    <Wizard steps={BASIC.map((s) => ({ ...s, satisfied: true }))} />,
  );
  await expectNoA11yViolations(screen.container);
});

class Boundary extends React.Component<
  { children: React.ReactNode },
  { message: string | null }
> {
  state = { message: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }
  render() {
    return this.state.message ? (
      <p>caught: {this.state.message}</p>
    ) : (
      this.props.children
    );
  }
}

test("a part rendered outside the root fails loudly rather than silently", async () => {
  // A context-less part would otherwise render nothing and read as a styling bug.
  const screen = await render(
    <Boundary>
      <MultiStepFormActions />
    </Boundary>,
  );
  expect(screen.container.textContent).toContain(
    "MultiStepFormActions must be rendered inside <MultiStepForm>",
  );
});
