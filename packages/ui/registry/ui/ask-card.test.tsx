import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import {
  AskCard,
  type AskBundleItem,
  type AskCardProps,
  type AskChoice,
} from "./ask-card";

const agent = {
  name: "Donna",
  avatar: <span aria-hidden>D</span>,
  onBehalfOf: "Anu's Assistant",
};

const CHOICES: AskChoice[] = [
  { id: "once", label: "Allow once", kind: "once" },
  {
    id: "always:thread",
    label: "Always in this thread",
    kind: "always",
    scopeLabel: "only in this thread",
  },
  { id: "never", label: "Never", kind: "never" },
  { id: "decline", label: "Decline", kind: "decline", needsNote: true },
];

const action: AskCardProps["action"] = {
  title: "Email sm@vegastack.com",
  toolClass: "delete_send",
  facts: [{ label: "Subject", value: "Weekly summary" }],
  preview: "Hi team, the weekly summary is attached.",
};

const item = (
  id: string,
  overrides: Partial<AskBundleItem> = {},
): AskBundleItem => ({
  id,
  title: `Create task ${id}`,
  toolClass: "write",
  state: "pending",
  choices: [
    { id: "once", label: "Allow once", kind: "once" },
    { id: "decline", label: "Decline", kind: "decline" },
  ],
  onAnswer: vi.fn(),
  ...overrides,
});

/** Every rendered button's variant: the card never draws a filled primary. */
function filled(root: ParentNode) {
  return [...root.querySelectorAll<HTMLElement>('[data-slot="button"]')].filter(
    (button) => button.dataset.variant === "default",
  );
}

test("a pending ask names itself by its action, shows the preview first and the server's choices in order", async () => {
  const screen = await render(
    <AskCard
      agent={agent}
      action={action}
      state="pending"
      choices={CHOICES}
      onAnswer={vi.fn()}
      deadline="Until 17:00"
      ifNobodyAnswers="It won't send."
    />,
  );
  await expect
    .element(page.getByRole("region", { name: "Email sm@vegastack.com" }))
    .toBeVisible();
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="ask-card"]',
  )!;
  expect(root.dataset.state).toBe("pending");
  const preview = root.querySelector('[data-slot="ask-card-preview"]')!;
  const choices = root.querySelector('[data-slot="ask-card-choices"]')!;
  expect(
    preview.compareDocumentPosition(choices) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const ids = [...choices.querySelectorAll("[data-choice-id]")].map(
    (el) => (el as HTMLElement).dataset.choiceId,
  );
  // Decline, then its arrow holding a note and Never.
  expect(ids).toEqual(["once", "always:thread", "decline", "decline:more"]);
  expect(
    root.querySelector('[data-choice="once"]')!.getAttribute("data-variant"),
  ).toBe("secondary");
  expect(
    root.querySelector('[data-choice="decline"]')!.getAttribute("data-variant"),
  ).toBe("outline");
  expect(
    root.querySelector('[data-slot="ask-card-deadline"]')!.textContent,
  ).toBe("Until 17:00 · If nobody answers: It won't send.");
  await expectNoA11yViolations(screen.container);
});

test("an answer passes the choice id back unchanged; a decline with a note sends the note", async () => {
  const onAnswer = vi.fn();
  await render(
    <AskCard
      agent={agent}
      action={action}
      state="pending"
      choices={CHOICES}
      onAnswer={onAnswer}
    />,
  );
  await page.getByRole("button", { name: "Always in this thread" }).click();
  expect(onAnswer).toHaveBeenLastCalledWith("always:thread");
  await page.getByRole("button", { name: "More ways to decline" }).click();
  // Never keeps its destructive ink inside the menu.
  await expect
    .element(page.getByRole("menuitem", { name: "Never" }))
    .toHaveAttribute("data-variant", "destructive");
  await page.getByRole("menuitem", { name: "Never" }).click();
  expect(onAnswer).toHaveBeenLastCalledWith("never");
  await page.getByRole("button", { name: "Decline" }).click();
  expect(onAnswer).toHaveBeenLastCalledWith("decline");
  await page.getByRole("button", { name: "More ways to decline" }).click();
  await page.getByRole("menuitem", { name: "Decline with a note…" }).click();
  const note = page.getByRole("textbox", { name: /note to the agent/i });
  await expect.element(note).toBeVisible();
  await userEvent.type(note, "Send it Monday");
  await page.getByRole("button", { name: "Decline" }).click();
  expect(onAnswer).toHaveBeenLastCalledWith("decline", "Send it Monday");
});

test("more than one Always choice folds into one Always… menu listing every scope", async () => {
  const onAnswer = vi.fn();
  const screen = await render(
    <AskCard
      agent={agent}
      action={{ ...action, toolClass: "write", preview: undefined }}
      state="pending"
      choices={[
        { id: "once", label: "Allow once", kind: "once" },
        { id: "always:a", label: "Always in #ops", kind: "always" },
        { id: "always:b", label: "Always in this space", kind: "always" },
        { id: "always:c", label: "Always", kind: "always" },
      ]}
      onAnswer={onAnswer}
    />,
  );
  expect(
    screen.container.querySelectorAll('[data-choice="always"]'),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Always…" }).click();
  await page.getByRole("menuitem", { name: "Always in this space" }).click();
  expect(onAnswer).toHaveBeenCalledWith("always:b");
});

test("at 390px Allow once, Always… and Decline ▾ sit on one row", async () => {
  await page.viewport(390, 800);
  const screen = await render(
    <div style={{ width: 358 }}>
      <AskCard
        agent={agent}
        action={{ ...action, toolClass: "write", preview: undefined }}
        state="pending"
        choices={[
          { id: "once", label: "Allow once", kind: "once" },
          { id: "always:a", label: "Always in this thread", kind: "always" },
          { id: "always:b", label: "Always in this space", kind: "always" },
          { id: "never", label: "Never allow this", kind: "never" },
          { id: "decline", label: "Decline", kind: "decline", needsNote: true },
        ]}
        onAnswer={vi.fn()}
      />
    </div>,
  );
  const tops = ["once", "always", "decline"].map(
    (id) =>
      screen.container
        .querySelector<HTMLElement>(`[data-choice="${id}"]`)!
        .getBoundingClientRect().top,
  );
  expect(new Set(tops).size).toBe(1);
});

test("no state draws a filled primary button, in either density or in a bundle", async () => {
  const bundle = {
    items: [item("1"), item("2")],
    sharedChoices: [
      { id: "once", label: "Allow all once", kind: "once" as const },
      { id: "decline", label: "Decline all", kind: "decline" as const },
    ],
    onAnswerAll: vi.fn(),
  };
  const screen = await render(
    <>
      {(["card", "inline"] as const).map((density) => (
        <div key={density}>
          <AskCard
            agent={agent}
            action={action}
            state="pending"
            choices={CHOICES}
            onAnswer={vi.fn()}
            density={density}
          />
          <AskCard
            agent={agent}
            action={{ title: "Create 2 tasks", toolClass: "write" }}
            state="pending"
            choices={[]}
            bundle={bundle}
            density={density}
          />
          <AskCard
            agent={agent}
            action={action}
            state="allowed"
            choices={CHOICES}
            answered={{
              choiceLabel: "Allowed once",
              by: "Priya",
              via: "slack",
              at: "14:02",
              undo: vi.fn(),
            }}
            density={density}
          />
        </div>
      ))}
    </>,
  );
  expect(
    screen.container.querySelectorAll('[data-slot="button"]').length,
  ).toBeGreaterThan(10);
  expect(filled(screen.container)).toEqual([]);
});

test("a bundle answers each item on its own and offers only the server's shared choices", async () => {
  const one = item("1");
  const two = item("2");
  const onAnswerAll = vi.fn();
  const screen = await render(
    <AskCard
      agent={agent}
      action={{ title: "Create 2 tasks", toolClass: "write" }}
      state="pending"
      choices={[]}
      bundle={{
        items: [one, two],
        sharedChoices: [{ id: "once", label: "Allow all once", kind: "once" }],
        onAnswerAll,
      }}
    />,
  );
  const rows = screen.container.querySelectorAll('[data-slot="ask-card-item"]');
  expect(rows).toHaveLength(2);
  await page
    .getByRole("group", { name: "Answer: Create task 2" })
    .getByRole("button", { name: "Allow once" })
    .click();
  expect(two.onAnswer).toHaveBeenCalledWith("once");
  expect(one.onAnswer).not.toHaveBeenCalled();
  await page.getByRole("button", { name: "Allow all once" }).click();
  expect(onAnswerAll).toHaveBeenCalledWith("once");
  await expectNoA11yViolations(screen.container);
});

test("a bundle with a send hides Answer all: those are answered one by one", async () => {
  const screen = await render(
    <AskCard
      agent={agent}
      action={{ title: "Two actions", toolClass: "delete_send" }}
      state="pending"
      choices={[]}
      bundle={{
        items: [
          item("1"),
          item("2", { toolClass: "delete_send", preview: "Hello Acme" }),
        ],
        sharedChoices: [{ id: "once", label: "Allow all once", kind: "once" }],
        onAnswerAll: vi.fn(),
      }}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="ask-card-shared"]'),
  ).toBeNull();
  expect(
    screen.container.querySelectorAll('[data-slot="ask-card-preview"]'),
  ).toHaveLength(1);
});

test("settled states read as one muted line, with Undo when offered and the way out of a refusal", async () => {
  const undo = vi.fn();
  const screen = await render(
    <>
      <AskCard
        agent={agent}
        action={action}
        state="allowed_always"
        choices={CHOICES}
        answered={{
          choiceLabel: "Always in this thread",
          by: "Priya",
          via: "slack",
          at: "14:02",
          undo,
        }}
      />
      <AskCard
        agent={agent}
        action={action}
        state="refused"
        choices={[]}
        refusal={{
          words: "Sending outside the workspace is blocked.",
          way: { label: "Ask an admin", href: "/settings/agents" },
        }}
      />
      <AskCard agent={agent} action={action} state="expired" choices={[]} />
      <AskCard agent={agent} action={action} state="stale" choices={[]} />
      <AskCard agent={agent} action={action} state="cancelled" choices={[]} />
    </>,
  );
  const lines = [
    ...screen.container.querySelectorAll('[data-slot="ask-card-settled"]'),
  ].map((line) => line.textContent);
  expect(lines[0]).toContain("Always in this thread · Priya in Slack · 14:02");
  expect(lines[1]).toContain("Sending outside the workspace is blocked.");
  expect(lines[1]).toContain("Ask an admin ›");
  expect(lines.slice(2)).toEqual([
    "Not answered in time",
    "This changed. Review the new version.",
    "No longer needed",
  ]);
  expect(
    screen.container.querySelectorAll('[data-slot="ask-card-choices"]'),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Undo" }).click();
  expect(undo).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("read-only, offline and busy hold the buttons", async () => {
  const screen = await render(
    <>
      <AskCard
        agent={agent}
        action={action}
        state="pending"
        choices={CHOICES}
      />
      <AskCard
        agent={agent}
        action={action}
        state="pending"
        choices={CHOICES}
        onAnswer={vi.fn()}
        offline
      />
      <AskCard
        agent={agent}
        action={action}
        state="pending"
        choices={CHOICES}
        onAnswer={vi.fn()}
        busy
        noAlways={{ words: "Always isn't offered for sends to new people." }}
      />
    </>,
  );
  const [readOnly, offline, busy] = screen.container.querySelectorAll(
    '[data-slot="ask-card"]',
  );
  expect(readOnly!.querySelector('[data-slot="ask-card-choices"]')).toBeNull();
  expect(readOnly!.textContent).toContain("Waiting for an answer");
  expect(offline!.textContent).toContain("Connect to answer");
  for (const button of offline!.querySelectorAll(
    '[data-slot="ask-card-choices"] button',
  ))
    expect(button.hasAttribute("data-disabled")).toBe(true);
  expect(busy!.getAttribute("aria-busy")).toBe("true");
  expect(busy!.textContent).toContain(
    "Always isn't offered for sends to new people.",
  );
  await expectNoA11yViolations(screen.container);
});

test("a send with nothing to preview keeps only its refusals; settled states without an answer line still say what happened", async () => {
  const screen = await render(
    <>
      <AskCard
        agent={agent}
        action={{
          title: "Delete branch main",
          toolClass: "delete_send",
          preview: "",
        }}
        state="pending"
        choices={CHOICES}
        onAnswer={vi.fn()}
      />
      <AskCard agent={agent} action={action} state="blocked" choices={[]} />
    </>,
  );
  const [withheld, blocked] = screen.container.querySelectorAll(
    '[data-slot="ask-card"]',
  );
  const ids = [...withheld!.querySelectorAll("[data-choice-id]")].map(
    (el) => (el as HTMLElement).dataset.choiceId,
  );
  expect(ids).toEqual(["decline", "decline:more"]);
  expect(
    withheld!.querySelector('[data-slot="ask-card-withheld"]'),
  ).not.toBeNull();
  expect(
    blocked!.querySelector('[data-slot="ask-card-settled"]')!.textContent,
  ).toBe("Never allowed");
});

test("a reason shows whole under the title while open, and a long scope sentence wraps in the Always menu at 390px", async () => {
  const reason =
    "Auto-check asked: the channel isn't one anyone named in this chat, so a person decides.";
  const scope = "Saves: Inbox helper may post in Slack in #ops without asking.";
  const choices: AskChoice[] = [
    { id: "once", label: "Allow once", kind: "once" },
    {
      id: "always:a",
      label: "Always in #ops",
      kind: "always",
      scopeLabel: scope,
    },
    {
      id: "always:b",
      label: "Always in Slack",
      kind: "always",
      scopeLabel: "Anywhere",
    },
    { id: "always:c", label: "Always", kind: "always" },
  ];
  await page.viewport(390, 844);
  const screen = await render(
    <div style={{ width: 390 }}>
      <AskCard
        agent={agent}
        action={{ ...action, toolClass: "write", preview: undefined }}
        reason={reason}
        state="pending"
        choices={choices}
        onAnswer={vi.fn()}
      />
    </div>,
  );
  const line = screen.container.querySelector<HTMLElement>(
    '[data-slot="ask-card-reason"]',
  )!;
  expect(line.textContent).toBe(reason);
  // It wraps rather than cutting: nothing overflows its box.
  expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth);
  expect(line.getBoundingClientRect().height).toBeGreaterThan(20);
  await page.getByRole("button", { name: "Always…" }).click();
  const description = document.querySelector<HTMLElement>(
    '[data-choice-id="always:a"] [data-slot="item-description"]',
  )!;
  expect(description.textContent).toBe(scope);
  expect(description.scrollHeight).toBeLessThanOrEqual(
    description.clientHeight + 1,
  );
  expect(description.getBoundingClientRect().right).toBeLessThanOrEqual(390);
  await userEvent.keyboard("{Escape}");
  // Settled, the reason goes with the buttons.
  await screen.rerender(
    <AskCard
      agent={agent}
      action={{ ...action, toolClass: "write", preview: undefined }}
      reason={reason}
      state="allowed"
      choices={[]}
    />,
  );
  await expect
    .poll(() => screen.container.querySelector('[data-slot="ask-card-reason"]'))
    .toBeNull();
});
