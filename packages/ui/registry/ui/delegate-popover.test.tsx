import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import { DelegatePopover, type DelegatePopoverAgent } from "./delegate-popover";
import { Button } from "./button";

const AGENTS: DelegatePopoverAgent[] = [
  { id: "claude", name: "Claude Code", access: "Read & write · Tasks" },
  { id: "codex", name: "Codex", disabledReason: "Can't — read only" },
];

const FINISH = [
  { value: "review", label: "Move to review" },
  { value: "done", label: "Mark done" },
];

/** Let the popup finish opening, so the compiled-CSS contrast check reads its settled colours. */
const settle = () =>
  Promise.all(
    document
      .getAnimations()
      .filter((a) => a.playState === "running")
      .map((a) => a.finished.catch(() => undefined)),
  );

const open = async () => {
  await page.getByRole("button", { name: "Delegate…" }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Delegate to an agent" }))
    .toBeVisible();
};

const trigger = <Button variant="outline">Delegate…</Button>;

test("picks the only agent that can take it, lists the other with its reason, and delegates", async () => {
  const onDelegate = vi.fn();
  const screen = await render(
    <DelegatePopover
      agents={AGENTS}
      whenFinishedOptions={FINISH}
      onConnect={() => {}}
      onDelegate={onDelegate}
    >
      {trigger}
    </DelegatePopover>,
  );
  await open();
  const options = page.getByRole("option");
  expect(options.elements()).toHaveLength(2);
  // The one agent that can take it is chosen; the other is disabled with its reason.
  expect(options.nth(0).element().getAttribute("data-checked")).toBe("true");
  expect(options.nth(0).element().textContent).toContain(
    "Read & write · Tasks",
  );
  expect(options.nth(1).element().getAttribute("aria-disabled")).toBe("true");
  expect(options.nth(1).element().textContent).toContain("Can't — read only");
  await settle();
  await expectNoA11yViolations(document.body);

  await page
    .getByRole("textbox", { name: "Instructions (optional)" })
    .fill("  Draft the proposal from M-15's notes.  ");
  await page.getByRole("button", { name: "Delegate", exact: true }).click();
  expect(onDelegate).toHaveBeenCalledWith({
    agentId: "claude",
    instructions: "Draft the proposal from M-15's notes.",
    whenFinished: "review",
  });
  await expect
    .element(page.getByRole("dialog", { name: "Delegate to an agent" }))
    .not.toBeInTheDocument();
  screen.unmount();
});

test("search filters; arrow keys move and Enter picks; Cmd/Ctrl+Enter delegates", async () => {
  const onDelegate = vi.fn();
  await render(
    <DelegatePopover
      agents={[
        { id: "a", name: "Claude Code" },
        { id: "b", name: "Cursor" },
        { id: "c", name: "Codex" },
      ]}
      onDelegate={onDelegate}
    >
      {trigger}
    </DelegatePopover>,
  );
  await open();
  const submit = page.getByRole("button", { name: "Delegate", exact: true });
  // Nothing is chosen while more than one agent can take it.
  await expect.element(submit).toHaveAttribute("aria-disabled", "true");
  const search = page.getByRole("combobox", { name: "Search agents" });
  await search.fill("c");
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await expect
    .element(page.getByRole("option", { name: /Cursor/ }))
    .toHaveAttribute("data-checked", "true");
  await search.fill("zzz");
  await expect.element(page.getByText("No agents found")).toBeVisible();
  await page.getByRole("textbox", { name: "Instructions (optional)" }).click();
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(onDelegate).toHaveBeenCalledWith({ agentId: "b", instructions: "" });
});

test("When finished: choose another option; rows (no options) send none", async () => {
  const onDelegate = vi.fn();
  await render(
    <DelegatePopover
      agents={AGENTS}
      whenFinishedOptions={FINISH}
      onDelegate={onDelegate}
    >
      {trigger}
    </DelegatePopover>,
  );
  await open();
  await page.getByRole("combobox", { name: "When finished" }).click();
  await page.getByRole("option", { name: "Mark done" }).click();
  await page.getByRole("button", { name: "Delegate", exact: true }).click();
  expect(onDelegate).toHaveBeenCalledWith({
    agentId: "claude",
    instructions: "",
    whenFinished: "done",
  });
});

test("bulk: its own title and no When finished", async () => {
  await render(
    <DelegatePopover
      title="Delegate 40 rows to…"
      agents={AGENTS}
      onDelegate={() => {}}
    >
      {trigger}
    </DelegatePopover>,
  );
  await page.getByRole("button", { name: "Delegate…" }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Delegate 40 rows to…" }))
    .toBeVisible();
  expect(
    document.querySelector("[data-slot=delegate-popover-finish]"),
  ).toBeNull();
});

test("no agents: the connect empty state", async () => {
  const onConnect = vi.fn();
  await render(
    <DelegatePopover agents={[]} onConnect={onConnect} onDelegate={() => {}}>
      {trigger}
    </DelegatePopover>,
  );
  await open();
  await expect
    .element(
      page.getByText("Connect Claude, Codex or any MCP app to delegate work."),
    )
    .toBeVisible();
  expect(
    document.querySelector("[data-slot=delegate-popover-form]"),
  ).toBeNull();
  await settle();
  await expectNoA11yViolations(document.body);
  await page.getByRole("button", { name: "Connect an app" }).click();
  expect(onConnect).toHaveBeenCalledTimes(1);
});

test("loading: skeleton rows, no options", async () => {
  await render(
    <DelegatePopover agents={[]} loading onDelegate={() => {}}>
      {trigger}
    </DelegatePopover>,
  );
  await open();
  expect(
    document.querySelector("[data-slot=delegate-popover-loading]"),
  ).not.toBeNull();
  expect(
    document.querySelector("[data-slot=delegate-popover-empty]"),
  ).toBeNull();
});

test("a pending delegate keeps it open and busy until it settles; a failure keeps the choice", async () => {
  let reject!: (error: Error) => void;
  const onDelegate = vi.fn(
    () =>
      new Promise<void>((_, r) => {
        reject = r;
      }),
  );
  await render(
    <DelegatePopover agents={AGENTS} onDelegate={onDelegate}>
      {trigger}
    </DelegatePopover>,
  );
  await open();
  const submit = page.getByRole("button", { name: "Delegate", exact: true });
  await submit.click();
  await expect.element(submit).toHaveAttribute("aria-busy", "true");
  reject(new Error("nope"));
  await expect.element(submit).not.toHaveAttribute("aria-busy");
  await expect
    .element(page.getByRole("dialog", { name: "Delegate to an agent" }))
    .toBeVisible();
});

test("labels replace every string", async () => {
  await render(
    <DelegatePopover
      agents={AGENTS}
      title="Delegar a un agente"
      labels={{ delegate: "Delegar", search: "Buscar agentes" }}
      onDelegate={() => {}}
    >
      {trigger}
    </DelegatePopover>,
  );
  await page.getByRole("button", { name: "Delegate…" }).click();
  await expect
    .element(page.getByRole("combobox", { name: "Buscar agentes" }))
    .toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Delegar" }))
    .toBeVisible();
});

test("a delegation in flight is never sent twice, even after closing and reopening", async () => {
  let resolve!: () => void;
  const onDelegate = vi.fn(
    () =>
      new Promise<void>((r) => {
        resolve = r;
      }),
  );
  await render(
    <DelegatePopover agents={AGENTS} onDelegate={onDelegate}>
      {trigger}
    </DelegatePopover>,
  );
  await open();
  await page.getByRole("button", { name: "Delegate", exact: true }).click();
  await userEvent.keyboard("{Escape}");
  await expect
    .element(page.getByRole("dialog", { name: "Delegate to an agent" }))
    .not.toBeInTheDocument();
  await open();
  const submit = page.getByRole("button", { name: "Delegate", exact: true });
  await expect.element(submit).toHaveAttribute("aria-busy", "true");
  await submit.click({ force: true });
  expect(onDelegate).toHaveBeenCalledTimes(1);
  resolve();
  // The first request's success does not close the newer session.
  await expect.element(submit).not.toHaveAttribute("aria-busy");
  await expect
    .element(page.getByRole("dialog", { name: "Delegate to an agent" }))
    .toBeVisible();
});

test("a note sits under the access in its tone, never blocks the pick, and a disabled agent shows only its reason", async () => {
  const onDelegate = vi.fn();
  const agents: DelegatePopoverAgent[] = [
    {
      id: "claude",
      name: "Claude Code",
      access: "Read & write",
      note: "Usually starts within 2 minutes",
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      note: "Can't start on its own",
      noteTone: "warning",
    },
    {
      id: "codex",
      name: "Codex",
      disabledReason: "Paused",
      note: "Starts within seconds",
    },
  ];
  await render(
    <DelegatePopover agents={agents} onDelegate={onDelegate}>
      {trigger}
    </DelegatePopover>,
  );
  await open();
  const noteIn = (name: RegExp) =>
    page
      .getByRole("option", { name })
      .element()
      .querySelector<HTMLElement>('[data-slot="people-picker-note"]');
  const plain = noteIn(/Claude Code/)!;
  expect(plain.textContent).toBe("Usually starts within 2 minutes");
  expect(plain.dataset.tone).toBe("default");
  expect(plain.previousElementSibling!.textContent).toBe("Read & write");
  const warned = noteIn(/ChatGPT/)!;
  expect(warned.dataset.tone).toBe("warning");
  expect(warned.className).toContain("text-warning-text");
  expect(noteIn(/Codex/)).toBeNull();
  await page.getByRole("option", { name: /ChatGPT/ }).click();
  await page.getByRole("button", { name: "Delegate", exact: true }).click();
  expect(onDelegate).toHaveBeenCalledWith({
    agentId: "chatgpt",
    instructions: "",
  });
});

test("the beforeInstructions row sits above the instructions, and a picked step replaces it", async () => {
  const agents: DelegatePopoverAgent[] = [
    { id: "boq", name: "BOQ Intake", hint: "Can't see this space yet" },
    { id: "claude", name: "Claude Code" },
  ];
  await render(
    <DelegatePopover
      agents={agents}
      onDelegate={() => {}}
      beforeInstructions={<p>If it hasn't started</p>}
      renderPicked={(agent) => (agent.hint ? <p>Needs access</p> : null)}
    >
      {trigger}
    </DelegatePopover>,
  );
  await open();
  const form = document.querySelector('[data-slot="delegate-popover-form"]')!;
  const row = form.querySelector(
    '[data-slot="delegate-popover-before-instructions"]',
  )!;
  expect(row.textContent).toBe("If it hasn't started");
  expect(row.nextElementSibling!.querySelector("textarea")).not.toBeNull();
  await page.getByRole("option", { name: /BOQ Intake/ }).click();
  await expect.element(page.getByText("Needs access")).toBeVisible();
  expect(
    document.querySelector(
      '[data-slot="delegate-popover-before-instructions"]',
    ),
  ).toBeNull();
});

test("an agent with a hint can be picked, and the host's step replaces the form until it is cleared", async () => {
  const onDelegate = vi.fn();
  const agents: DelegatePopoverAgent[] = [
    { id: "boq", name: "BOQ Intake", hint: "Can't see this space yet" },
    { id: "claude", name: "Claude Code", access: "Read & write" },
  ];
  const screen = await render(
    <DelegatePopover
      agents={agents}
      onDelegate={onDelegate}
      connectHref="/agents/connect"
      renderPicked={(agent, { clear }) =>
        agent.hint ? (
          <>
            <p>{agent.name} can't see Showroom yet.</p>
            <Button size="sm" variant="outline" onClick={clear}>
              Cancel
            </Button>
          </>
        ) : null
      }
    >
      {trigger}
    </DelegatePopover>,
  );
  await open();
  await expect.element(page.getByText("Agents you can use")).toBeVisible();
  const boq = page.getByRole("option", { name: /BOQ Intake/ });
  expect(boq.element().getAttribute("aria-disabled")).not.toBe("true");
  expect(
    boq.element().querySelector('[data-slot="people-picker-hint"]')!
      .textContent,
  ).toBe("Can't see this space yet");
  // Every row is an agent here: no "Agent" label.
  expect(
    boq.element().querySelector('[data-slot="person-agent-label"]'),
  ).toBeNull();
  await boq.click();
  await expect
    .element(page.getByText("BOQ Intake can't see Showroom yet."))
    .toBeVisible();
  expect(
    screen.container.ownerDocument.querySelector(
      '[data-slot="delegate-popover-form"]',
    ),
  ).toBeNull();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect
    .element(page.getByRole("button", { name: "Delegate", exact: true }))
    .toBeDisabled();
  // The connect link is a real link to the page.
  await expect
    .element(page.getByRole("link", { name: "Connect an app" }))
    .toHaveAttribute("href", "/agents/connect");
  await page.getByRole("option", { name: /Claude Code/ }).click();
  await page.getByRole("button", { name: "Delegate", exact: true }).click();
  expect(onDelegate).toHaveBeenCalledWith({
    agentId: "claude",
    instructions: "",
  });
});

test("one agent with a hint is never picked for you, and Cancel on its step stays cancelled", async () => {
  await render(
    <DelegatePopover
      agents={[{ id: "a", name: "Orbit", hint: "Can't see this space yet" }]}
      onDelegate={() => {}}
      renderPicked={(_, { clear }) => (
        <Button size="sm" onClick={clear}>
          Cancel
        </Button>
      )}
    >
      {trigger}
    </DelegatePopover>,
  );
  await open();
  const step = () =>
    document.querySelector('[data-slot="delegate-popover-picked"]');
  expect(step()).toBeNull();
  await page.getByRole("option", { name: /Orbit/ }).click();
  await expect.poll(step).not.toBeNull();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect.poll(step).toBeNull();
  expect(
    document.querySelector('[data-slot="delegate-popover-form"]'),
  ).not.toBeNull();
});

test("a picked agent that can no longer take it is un-picked", async () => {
  const both: DelegatePopoverAgent[] = [
    { id: "a", name: "Orbit" },
    { id: "b", name: "Knot" },
  ];
  const view = (agents: DelegatePopoverAgent[]) => (
    <DelegatePopover agents={agents} open onDelegate={() => {}}>
      {trigger}
    </DelegatePopover>
  );
  const screen = await render(view(both));
  await page.getByRole("option", { name: /Orbit/ }).click();
  await expect
    .poll(() =>
      page
        .getByRole("option", { name: /Orbit/ })
        .element()
        .getAttribute("data-checked"),
    )
    .toBe("true");
  await screen.rerender(
    view([{ id: "a", name: "Orbit", disabledReason: "Paused" }, both[1]!]),
  );
  await expect
    .poll(() =>
      page
        .getByRole("option", { name: /Orbit/ })
        .element()
        .getAttribute("data-checked"),
    )
    .toBeNull();
});
