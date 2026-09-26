/**
 * Questionnaire — upstream's `@shadcn/react` engine plus
 * `packages/ui/upstream/patches/questionnaire.patch`.
 *
 * COMPILED CSS IS LOAD-BEARING HERE. `../../test/geometry.css` compiles the real token theme, so
 * every exception this patch implements is proven by MEASUREMENT rather than by reading a class
 * string back: the choice card really takes the focus tint (and keeps its border colour) when the
 * invisible input inside it takes focus, the answer field really computes `outline-style: none`, a disabled choice really
 * still accepts pointer events, and every target really clears the 24px floor. axe's
 * `color-contrast` rule is live for the same reason.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "./questionnaire";

// ── helpers ───────────────────────────────────────────────────────────────────────────────────

const slot = (root: Element, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
const slots = (root: Element, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];
/** One of {@link slots}, by index — non-null so an off-by-one fails loudly rather than silently. */
const nth = (root: Element, name: string, index: number) => {
  const found = slots(root, name)[index];
  if (!found) throw new Error(`no [data-slot="${name}"] at index ${index}`);
  return found;
};

/** The ACTIVE item's subtree. Inactive items are `hidden` + `inert`, so every query is scoped. */
const activeItem = (root: Element) =>
  root.querySelector<HTMLElement>(
    '[data-slot="questionnaire-item"]:not([hidden])',
  )!;

/**
 * Freeze transitions for the duration of a colour reading. `getComputedStyle` immediately after
 * `focus()` reports the value the transition STARTS from, and a running colour transition
 * serialises in its interpolation space — same colour, different string. The geometry lane freezes
 * for exactly this reason; so does this file.
 */
function freezeTransitions() {
  const style = document.createElement("style");
  style.textContent = "*, *::before, *::after { transition: none !important; }";
  document.head.append(style);
  return () => style.remove();
}

/** Every `class` attribute in a rendered tree, as one string. */
const renderedClasses = (root: Element) =>
  [root, ...root.querySelectorAll("*")]
    .map((element) => element.getAttribute("class") ?? "")
    .join(" ");

const TWO_ITEMS = [
  { name: "task", required: true },
  { name: "review", required: true },
] as const;

function TwoStep({
  invalid = false,
  disabledChoice = false,
  onSubmit,
}: {
  invalid?: boolean;
  disabledChoice?: boolean;
  onSubmit?: (data: FormData) => void;
}) {
  return (
    <Questionnaire
      items={TWO_ITEMS}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(new FormData(event.currentTarget));
      }}
    >
      <QuestionnaireProgress />
      <QuestionnaireItem invalid={invalid} name="task" required>
        <QuestionnaireTitle>What kind of change is this?</QuestionnaireTitle>
        <QuestionnaireDescription>
          Choose the category that best describes the work.
        </QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="feature">
            <span>New feature</span>
            <QuestionnaireChoiceDescription>
              Something the product could not do before.
            </QuestionnaireChoiceDescription>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="fix" disabled={disabledChoice}>
            Bug fix
          </QuestionnaireChoice>
          <QuestionnaireInput
            aria-label="Another kind of change"
            placeholder="Describe it…"
          />
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireItem name="review" required>
        <QuestionnaireTitle>How should it be reviewed?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="tests">Tests</QuestionnaireChoice>
          <QuestionnaireChoice value="diff">Diff review</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>
  );
}

/**
 * A flow whose SECOND item is optional, so `Previous` and `Skip` are both rendered — the engine
 * hides navigation that does not apply rather than disabling it, so a state that never shows them
 * cannot measure them.
 */
function SkippableFlow() {
  return (
    <Questionnaire
      items={[
        { name: "task", required: true },
        { name: "notes" },
        { name: "review", required: true },
      ]}
      defaultItem="task"
    >
      <QuestionnaireProgress />
      <QuestionnaireItem name="task" required>
        <QuestionnaireTitle>What kind of change is this?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="feature">New feature</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireItem name="notes">
        <QuestionnaireTitle>Anything to add?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="yes">Yes</QuestionnaireChoice>
          <QuestionnaireInput aria-label="A note" placeholder="Optional…" />
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="review" required>
        <QuestionnaireTitle>How should it be reviewed?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="tests">Tests</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>
  );
}

/** Advance `SkippableFlow` to its optional second item, where every navigation control is shown. */
async function toOptionalStep(screen: { container: Element }) {
  await userEvent.click(
    screen.container.querySelector<HTMLElement>(
      '[data-slot="questionnaire-choice-input"]',
    )!,
  );
  await userEvent.click(slot(screen.container, "questionnaire-next"));
  await expect
    .poll(
      () =>
        slot(activeItem(screen.container), "questionnaire-title").textContent,
    )
    .toBe("Anything to add?");
}

// ── structure ─────────────────────────────────────────────────────────────────────────────────

test("renders every exported part, each carrying its slot", async () => {
  const screen = await render(<TwoStep />);
  for (const name of [
    "questionnaire",
    "questionnaire-progress",
    "questionnaire-item",
    "questionnaire-title",
    "questionnaire-description",
    "questionnaire-choices",
    "questionnaire-choice",
    "questionnaire-choice-input",
    "questionnaire-choice-label",
    "questionnaire-choice-description",
    "questionnaire-choice-shortcut",
    "questionnaire-input-wrapper",
    "questionnaire-input",
    "questionnaire-error",
    "questionnaire-actions",
    "questionnaire-previous",
    "questionnaire-skip",
    "questionnaire-next",
    "questionnaire-submit",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${name}"]`),
      `missing [data-slot="${name}"]`,
    ).not.toBeNull();
  }
  // The root is a real form, and the item is a real fieldset with the title as its legend.
  expect(slot(screen.container, "questionnaire").tagName).toBe("FORM");
  expect(activeItem(screen.container).tagName).toBe("FIELDSET");
  expect(slot(screen.container, "questionnaire-title").tagName).toBe("LEGEND");
});

test("only the active item is rendered; the rest are hidden and inert", async () => {
  const screen = await render(<TwoStep />);
  expect(slots(screen.container, "questionnaire-item").length).toBe(2);
  expect(
    nth(screen.container, "questionnaire-item", 0).hasAttribute("hidden"),
  ).toBe(false);
  expect(
    nth(screen.container, "questionnaire-item", 1).hasAttribute("hidden"),
  ).toBe(true);
  expect(
    nth(screen.container, "questionnaire-item", 1).hasAttribute("inert"),
  ).toBe(true);
});

test("the four navigation parts default their variant and size, and forward overrides", async () => {
  const screen = await render(<TwoStep />);
  const actions = slot(screen.container, "questionnaire-actions");
  for (const [name, variant] of [
    ["questionnaire-previous", "outline"],
    ["questionnaire-skip", "outline"],
    ["questionnaire-next", "default"],
    ["questionnaire-submit", "default"],
  ] as const) {
    const control = slot(actions, name);
    expect(control.getAttribute("data-variant"), name).toBe(variant);
    expect(control.getAttribute("data-size"), name).toBe("default");
    expect(control.tagName, name).toBe("BUTTON");
  }

  const custom = await render(
    <Questionnaire items={[{ name: "one", required: true }]}>
      <QuestionnaireItem name="one" required>
        <QuestionnaireTitle>Pick</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit variant="secondary" size="sm">
          Send
        </QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>,
  );
  const submit = slot(custom.container, "questionnaire-submit");
  expect(submit.getAttribute("data-variant")).toBe("secondary");
  expect(submit.getAttribute("data-size")).toBe("sm");
});

// ── one behaviour per upstream docs variant ────────────────────────────────────────────────────

test("Usage / Server Rendering: `items` gives progress its total before anything is measured", async () => {
  const screen = await render(<TwoStep />);
  const progress = slot(screen.container, "questionnaire-progress");
  expect(progress.getAttribute("aria-valuenow")).toBe("1");
  expect(progress.getAttribute("aria-valuemax")).toBe("2");
  expect(progress.getAttribute("aria-valuetext")).toBe("Question 1 of 2");
});

test("Composition / Navigation State: a required item blocks Next until it is answered", async () => {
  const screen = await render(<TwoStep />);
  const next = slot(screen.container, "questionnaire-next");
  const title = () =>
    slot(activeItem(screen.container), "questionnaire-title").textContent;

  // Previous is hidden on the first step, and Skip is hidden on a REQUIRED item: the engine
  // renders the navigation that applies and hides the rest, rather than disabling it.
  expect(
    slot(screen.container, "questionnaire-previous").hasAttribute("hidden"),
  ).toBe(true);
  expect(
    slot(screen.container, "questionnaire-skip").hasAttribute("hidden"),
  ).toBe(true);
  expect(next.getAttribute("data-status")).toBe("unanswered");

  // Unanswered: Next runs the item's own validity check and the flow stays put.
  await userEvent.click(next);
  expect(title()).toBe("What kind of change is this?");

  await screen.getByRole("radio", { name: /New feature/ }).click();
  await expect.poll(() => next.getAttribute("data-status")).toBe("answered");

  await userEvent.click(next);
  await expect
    .poll(
      () =>
        slot(activeItem(screen.container), "questionnaire-title").textContent,
    )
    .toBe("How should it be reviewed?");
  expect(
    slot(screen.container, "questionnaire-progress").getAttribute(
      "aria-valuenow",
    ),
  ).toBe("2");
});

test("Multiple Selection: `multiple` makes the choices checkboxes and the answer an array", async () => {
  let submitted: string[] = [];
  const screen = await render(
    <Questionnaire
      items={[{ name: "context", required: true }]}
      onSubmit={(event) => {
        event.preventDefault();
        submitted = new FormData(event.currentTarget).getAll(
          "context",
        ) as string[];
      }}
    >
      <QuestionnaireItem name="context" multiple required>
        <QuestionnaireTitle>What should it inspect?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="source">Source</QuestionnaireChoice>
          <QuestionnaireChoice value="tests">Tests</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit>Share</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>,
  );
  const boxes = screen.container.querySelectorAll<HTMLInputElement>(
    '[data-slot="questionnaire-choice-input"]',
  );
  expect([...boxes].map((box) => box.type)).toEqual(["checkbox", "checkbox"]);

  await screen.getByRole("checkbox", { name: "Source" }).click();
  await screen.getByRole("checkbox", { name: "Tests" }).click();
  await screen.getByRole("button", { name: "Share" }).click();
  await expect.poll(() => submitted).toEqual(["source", "tests"]);
});

test("Freeform Answer: typing into the input clears the fixed choice, and submits as the answer", async () => {
  let answer: FormDataEntryValue | null = null;
  const screen = await render(
    <TwoStep onSubmit={(data) => (answer = data.get("task"))} />,
  );
  const feature = screen.getByRole("radio", { name: /New feature/ });
  await feature.click();
  await expect.element(feature).toBeChecked();

  const input = screen.getByRole("textbox", { name: "Another kind of change" });
  await userEvent.fill(input, "Documentation only");
  await expect
    .poll(() => (feature.element() as HTMLInputElement).checked)
    .toBe(false);

  await userEvent.click(slot(screen.container, "questionnaire-next"));
  await screen.getByRole("radio", { name: "Tests" }).click();
  await userEvent.click(slot(screen.container, "questionnaire-submit"));
  await expect.poll(() => answer).toBe("Documentation only");
});

test("Explicit Skip: Skip reports the skipped status and moves on without an answer", async () => {
  const statuses: string[] = [];
  const screen = await render(
    <Questionnaire
      items={[{ name: "notes" }, { name: "review", required: true }]}
      defaultItem="notes"
    >
      <QuestionnaireItem name="notes" onStatusChange={(s) => statuses.push(s)}>
        <QuestionnaireTitle>Anything to add?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="yes">Yes</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="review" required>
        <QuestionnaireTitle>How should it be reviewed?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="tests">Tests</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>,
  );
  await userEvent.click(slot(screen.container, "questionnaire-skip"));
  await expect
    .poll(
      () =>
        slot(activeItem(screen.container), "questionnaire-title").textContent,
    )
    .toBe("How should it be reviewed?");
  expect(statuses).toContain("skipped");
});

test("Shortcuts: `shortcuts` puts a key on each choice and announces it", async () => {
  const screen = await render(
    <Questionnaire
      items={[
        {
          choices: [{ value: "a" }, { value: "b" }],
          name: "pick",
          required: true,
        },
      ]}
      shortcuts="letters"
    >
      <QuestionnaireItem name="pick" required>
        <QuestionnaireTitle>Pick one</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="a">Alpha</QuestionnaireChoice>
          <QuestionnaireChoice value="b">Beta</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit>Go</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>,
  );
  const choices = slots(screen.container, "questionnaire-choice");
  expect(choices.map((choice) => choice.getAttribute("data-shortcut"))).toEqual(
    ["A", "B"],
  );
  expect(
    slots(screen.container, "questionnaire-choice-shortcut").map(
      (element) => element.textContent,
    ),
  ).toEqual(["A", "B"]);
  expect(
    screen.container
      .querySelector('[data-slot="questionnaire-choice-input"]')
      ?.getAttribute("aria-keyshortcuts"),
  ).toBe("A");
});

test("Custom Validation / Controlled: `invalid` marks the item and surfaces the error", async () => {
  const screen = await render(
    <Questionnaire items={[{ name: "detail", required: true }]} item="detail">
      <QuestionnaireItem invalid name="detail" required>
        <QuestionnaireTitle>How much detail?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="summary">Summary</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError>
          Public answers need more context.
        </QuestionnaireError>
      </QuestionnaireItem>
    </Questionnaire>,
  );
  const item = activeItem(screen.container);
  expect(item.getAttribute("aria-invalid")).toBe("true");
  expect(item.getAttribute("data-invalid")).toBe("");
  const error = slot(screen.container, "questionnaire-error");
  expect(error.textContent).toBe("Public answers need more context.");
  expect(item.getAttribute("aria-describedby")?.split(" ")).toContain(error.id);
  // A11Y-13: error copy reads through the family's `-text` ink, never the fill used as ink.
  const ink = error.className.split(/\s+/);
  expect(ink).toContain("text-destructive-text");
  expect(ink).not.toContain("text-destructive");
});

test("Resume: defaultChecked and defaultValue restore a saved answer", async () => {
  const screen = await render(
    <Questionnaire
      items={[{ name: "change", required: true }, { name: "notes" }]}
      defaultItem="notes"
    >
      <QuestionnaireItem name="change" required>
        <QuestionnaireTitle>Which migration?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="incremental" defaultChecked>
            Incremental
          </QuestionnaireChoice>
          <QuestionnaireChoice value="cutover">Cutover</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="notes">
        <QuestionnaireTitle>Saved note</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label="Saved note"
          defaultValue="Keep the public API stable."
        />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>,
  );
  // `defaultItem` resumed at the second question…
  expect(
    slot(activeItem(screen.container), "questionnaire-title").textContent,
  ).toBe("Saved note");
  expect(
    slot(screen.container, "questionnaire-input").getAttribute("value") ??
      (slot(screen.container, "questionnaire-input") as HTMLInputElement).value,
  ).toBe("Keep the public API stable.");
  // …and the first question's saved answer is still there behind it.
  const restored = screen.container.querySelector<HTMLInputElement>(
    '[data-slot="questionnaire-choice-input"][value="incremental"]',
  )!;
  expect(restored.checked).toBe(true);
});

test("Conditional Items: a disabled item is stepped over and stops counting toward progress", async () => {
  const screen = await render(
    <Questionnaire
      items={[
        { name: "runtime", required: true },
        { disabled: true, name: "environment", required: true },
        { name: "approval", required: true },
      ]}
      defaultItem="runtime"
    >
      <QuestionnaireProgress />
      <QuestionnaireItem name="runtime" required>
        <QuestionnaireTitle>Where should it run?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="local">Local</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem disabled name="environment" required>
        <QuestionnaireTitle>Which environment?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="preview">Preview</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="approval" required>
        <QuestionnaireTitle>When to ask for approval?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="writes">
            Before writes
          </QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>,
  );
  // Three items declared, one disabled — progress counts the two that apply.
  expect(
    slot(screen.container, "questionnaire-progress").getAttribute(
      "aria-valuemax",
    ),
  ).toBe("2");

  await screen.getByRole("radio", { name: "Local" }).click();
  await userEvent.click(slot(screen.container, "questionnaire-next"));
  await expect
    .poll(
      () =>
        slot(activeItem(screen.container), "questionnaire-title").textContent,
    )
    .toBe("When to ask for approval?");
});

test("Custom Progress: `render` keeps the engine's progressbar semantics on your own markup", async () => {
  const screen = await render(
    <Questionnaire items={TWO_ITEMS}>
      <QuestionnaireProgress
        render={(props, state) => (
          <div {...props}>
            Checkpoint {state.current} of {state.total}
          </div>
        )}
      />
      <QuestionnaireItem name="task" required>
        <QuestionnaireTitle>One</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="review" required>
        <QuestionnaireTitle>Two</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="b">B</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
    </Questionnaire>,
  );
  const progress = slot(screen.container, "questionnaire-progress");
  expect(progress.textContent).toBe("Checkpoint 1 of 2");
  expect(progress.getAttribute("role")).toBe("progressbar");
  expect(progress.getAttribute("aria-live")).toBe("polite");
});

test("Animated Items: data-active is the hook the entrance animation keys on", async () => {
  const screen = await render(<TwoStep />);
  expect(
    nth(screen.container, "questionnaire-item", 0).getAttribute("data-active"),
  ).toBe("");
  expect(
    nth(screen.container, "questionnaire-item", 1).hasAttribute("data-active"),
  ).toBe(false);
});

test("Card / Dialog: `render` re-hosts the title and description without losing the question", async () => {
  const screen = await render(
    <Questionnaire items={[{ name: "scope", required: true }]}>
      <QuestionnaireItem aria-labelledby="scope-title" name="scope" required>
        <QuestionnaireTitle
          id="scope-title"
          render={<h3 className="text-base font-medium" />}
        >
          Which files are in scope?
        </QuestionnaireTitle>
        <QuestionnaireDescription render={<p className="text-sm" />}>
          Choose how broadly the agent can update the workspace.
        </QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="component">Component</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
    </Questionnaire>,
  );
  const title = slot(screen.container, "questionnaire-title");
  expect(title.tagName).toBe("H3");
  expect(activeItem(screen.container).getAttribute("aria-labelledby")).toBe(
    "scope-title",
  );
  await expect
    .element(screen.getByRole("group", { name: "Which files are in scope?" }))
    .toBeInTheDocument();
});

// ── the engine contracts the patch claims WITHOUT a hunk ───────────────────────────────────────

test("A11Y-3 (NO HUNK): Progress is a named, polite progressbar", async () => {
  const screen = await render(<TwoStep />);
  const progress = slot(screen.container, "questionnaire-progress");
  expect(progress.getAttribute("role")).toBe("progressbar");
  expect(progress.getAttribute("aria-live")).toBe("polite");
  expect(progress.getAttribute("aria-label")).toBe("Questionnaire progress");
});

test("A11Y-3/A11Y-4 (NO HUNK): Error is role=alert ONLY while invalid, and hidden otherwise", async () => {
  const valid = await render(<TwoStep />);
  const quiet = slot(valid.container, "questionnaire-error");
  expect(quiet.hasAttribute("role")).toBe(false);
  expect(quiet.hasAttribute("hidden")).toBe(true);

  const broken = await render(<TwoStep invalid />);
  const loud = slot(activeItem(broken.container), "questionnaire-error");
  expect(loud.getAttribute("role")).toBe("alert");
  expect(loud.hasAttribute("hidden")).toBe(false);
  // A11Y-4: the progressbar and the one alert are the only live regions in the component.
  expect(
    slots(broken.container, "questionnaire-item").length > 0 &&
      broken.container.querySelectorAll(
        '[aria-live], [role="alert"], [role="status"], [role="log"]',
      ).length,
  ).toBe(2);
});

// ── the exceptions the patch DOES implement, by measurement ────────────────────────────────────

test("FOC-1/FOC-6: no ring-3 and no ring-ring glow anywhere in the rendered tree", async () => {
  const screen = await render(<TwoStep />);
  expect(renderedClasses(screen.container)).not.toMatch(
    /ring-3|ring-\[3px\]|ring-ring\//,
  );
});

test("FOC-14: the CHOICE CARD's tint is the affordance for its invisible input; its border holds", async () => {
  const screen = await render(<TwoStep />);
  const card = slot(activeItem(screen.container), "questionnaire-choice");
  const input = card.querySelector<HTMLInputElement>(
    '[data-slot="questionnaire-choice-input"]',
  )!;
  // The premise: the real control is invisible and covers the whole card, so an outline on IT
  // would paint on nothing.
  expect(Number.parseFloat(getComputedStyle(input).opacity)).toBe(0);
  // `inset-0` is the card's PADDING box, so the invisible control is the card minus its 1px
  // hairline on each edge — the whole surface a pointer can reach.
  expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(
    card.getBoundingClientRect().height - 2.5,
  );

  const thaw = freezeTransitions();
  try {
    const rest = getComputedStyle(card);
    const restBorder = rest.borderColor;
    const restImage = rest.backgroundImage;
    await userEvent.tab();
    expect(document.activeElement).toBe(input);
    expect(input.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(card).borderColor).toBe(restBorder);
    expect(restImage).not.toContain("gradient");
    expect(getComputedStyle(card).backgroundImage).toContain("gradient");
  } finally {
    thaw();
    (document.activeElement as HTMLElement | null)?.blur?.();
  }
});

test("FOC-14/FOC-8: the answer input paints NO outline and NO border change on focus, only the tint", async () => {
  const screen = await render(<TwoStep />);
  const input = slot(activeItem(screen.container), "questionnaire-input");
  const thaw = freezeTransitions();
  try {
    const rest = getComputedStyle(input).borderColor;
    input.focus();
    const style = getComputedStyle(input);
    // FOC-8: `outline-hidden`, not `outline-none` — and it computes to no ring at all.
    expect(style.outlineStyle).toBe("none");
    // FOC-14: the border holds; base.css's background tint IS the affordance.
    expect(style.borderColor).toBe(rest);
    expect(style.backgroundImage).toContain("gradient");
  } finally {
    thaw();
    input.blur();
  }
});

test("FOC-14: the invalid border holds under focus on both the choice and the answer input", async () => {
  const screen = await render(<TwoStep invalid />);
  const classes = renderedClasses(screen.container);
  expect(classes).toContain("data-invalid:border-destructive");
  expect(classes).toContain("aria-invalid:border-destructive");
  expect(classes).not.toMatch(/not-(?:focus|has-\[>input:focus)/);

  const input = slot(activeItem(screen.container), "questionnaire-input");
  const thaw = freezeTransitions();
  try {
    const invalidRest = getComputedStyle(input).borderColor;
    input.focus();
    expect(getComputedStyle(input).borderColor).toBe(invalidRest);
  } finally {
    thaw();
    input.blur();
  }
});

test("FRM-4: a disabled choice and a disabled answer field still accept pointer events", async () => {
  const screen = await render(<TwoStep disabledChoice />);
  const item = activeItem(screen.container);
  const disabled = nth(item, "questionnaire-choice", 1);
  expect(disabled.getAttribute("data-disabled")).toBe("");
  // The card is still hoverable, so a Tooltip can explain why it cannot be picked…
  expect(getComputedStyle(disabled).pointerEvents).not.toBe("none");
  expect(getComputedStyle(disabled).cursor).toBe("not-allowed");
  // …and nothing about it became answerable: the engine keeps the input's own `disabled`.
  const input = disabled.querySelector<HTMLInputElement>(
    '[data-slot="questionnaire-choice-input"]',
  )!;
  expect(input.disabled).toBe(true);

  const answer = slot(item, "questionnaire-input") as HTMLInputElement;
  expect(renderedClasses(screen.container)).not.toContain(
    "disabled:pointer-events-none",
  );
  expect(getComputedStyle(answer).pointerEvents).not.toBe("none");
});

test("A11Y-2: every target clears the 24px floor — choices, the answer input, and navigation", async () => {
  // Step to the optional item, where the choice card, the freeform input and ALL FOUR navigation
  // controls are rendered at once. Measuring on the first step would silently skip Previous and
  // Skip, which the engine hides there.
  const screen = await render(<SkippableFlow />);
  await toOptionalStep(screen);

  const item = activeItem(screen.container);
  const measured: Array<[string, number]> = [
    ...slots(item, "questionnaire-choice").map(
      (choice) =>
        ["choice", choice.getBoundingClientRect().height] as [string, number],
    ),
    ["input", slot(item, "questionnaire-input").getBoundingClientRect().height],
    ...[
      "questionnaire-previous",
      "questionnaire-skip",
      "questionnaire-next",
    ].map(
      (name) =>
        [name, slot(screen.container, name).getBoundingClientRect().height] as [
          string,
          number,
        ],
    ),
  ];
  // Nothing measured may be zero-height: a hidden control would otherwise pass as "not undersized"
  // only because the filter below saw it, which is exactly the vacuity this guards.
  expect(measured.length).toBe(5);
  const undersized = measured.filter(([, height]) => height < 23.5);
  expect(
    undersized,
    `measured ${measured.map(([n, h]) => `${n}=${h.toFixed(2)}px`).join(", ")}`,
  ).toEqual([]);
});

// ── a11y, per distinct state ───────────────────────────────────────────────────────────────────

test("no a11y violations — rest", async () => {
  const screen = await render(<TwoStep />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — answered", async () => {
  const screen = await render(<TwoStep />);
  await screen.getByRole("radio", { name: /New feature/ }).click();
  await expect
    .element(screen.getByRole("radio", { name: /New feature/ }))
    .toBeChecked();
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(<TwoStep invalid />);
  expect(
    slot(activeItem(screen.container), "questionnaire-error").getAttribute(
      "role",
    ),
  ).toBe("alert");
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a disabled choice", async () => {
  const screen = await render(<TwoStep disabledChoice />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — skipped, and on the last step", async () => {
  const screen = await render(<SkippableFlow />);
  await toOptionalStep(screen);
  await expectNoA11yViolations(screen.container);

  await userEvent.click(slot(screen.container, "questionnaire-skip"));
  await expect
    .poll(
      () =>
        slot(activeItem(screen.container), "questionnaire-title").textContent,
    )
    .toBe("How should it be reviewed?");
  // Last step: Submit has replaced Next, and Skip is gone again because the item is required.
  expect(
    slot(screen.container, "questionnaire-submit").hasAttribute("hidden"),
  ).toBe(false);
  expect(
    slot(screen.container, "questionnaire-next").hasAttribute("hidden"),
  ).toBe(true);
  await expectNoA11yViolations(screen.container);
});
