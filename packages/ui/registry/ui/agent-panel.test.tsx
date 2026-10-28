import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import {
  AgentChip,
  AgentCard,
  AgentHoverCard,
  AgentPanel,
  AgentSlot,
  AgentStateBadge,
  AgentStateRing,
  type AgentPanelProps,
} from "./agent-panel";
import { PersonAvatar } from "./person-avatar";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const MINUTE = 60_000;

const agent = { name: "Claude Code", via: "Priya", access: "Read & write" };

const base: AgentPanelProps = { agent, state: "working", now: NOW };

const slot = (c: Element, name: string) =>
  c.querySelector<HTMLElement>(`[data-slot="${name}"]`);

test("working card: identity, acting for, elapsed time, live line, Stop and the ⋯ menu", async () => {
  const onStop = vi.fn();
  const onViewAgent = vi.fn();
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <AgentPanel
      {...base}
      ref={ref}
      startedAt={NOW - 4 * MINUTE}
      progress="Reading the 3 linked pages…"
      onStop={onStop}
      onViewAgent={onViewAgent}
      onChangeAgent={() => {}}
      onRemove={() => {}}
    />,
  );
  const root = slot(screen.container, "agent-panel")!;
  expect(ref.current).toBe(root);
  expect(root.dataset.variant).toBe("card");
  expect(root.dataset.state).toBe("working");
  expect(root.hasAttribute("data-attention")).toBe(false);
  expect(screen.container.textContent).toContain("Claude Code");
  expect(slot(root, "agent-identity-facts")!.textContent).toBe(
    "Acting for Priya · Read & write",
  );
  // The bot is decoration; the words say it is an agent.
  expect(
    root
      .querySelector("[data-slot=avatar][data-kind=agent]")!
      .getAttribute("aria-hidden"),
  ).toBe("true");
  expect(slot(root, "agent-panel-state")!.querySelector("p")!.textContent).toBe(
    "Working · 4 min",
  );
  expect(slot(root, "agent-panel-progress")!.textContent).toContain(
    "Reading the 3 linked pages…",
  );
  await expectNoA11yViolations(screen.container);

  await screen.getByRole("button", { name: "Stop", exact: true }).click();
  expect(onStop).toHaveBeenCalledTimes(1);

  await screen
    .getByRole("button", { name: "More actions for Claude Code" })
    .click();
  const items = page.getByRole("menuitem");
  await expect.element(items.first()).toBeVisible();
  expect(items.elements().map((el) => el.textContent)).toEqual([
    "View agent",
    "Change agent",
    "Stop",
    "Remove",
  ]);
  await page.getByRole("menuitem", { name: "View agent" }).click();
  expect(onViewAgent).toHaveBeenCalledTimes(1);
});

test("the menu shows only the handlers passed, and no Stop once the work is over", async () => {
  const screen = await render(
    <AgentPanel {...base} state="done" onStop={() => {}} onRemove={() => {}} />,
  );
  await screen
    .getByRole("button", { name: "More actions for Claude Code" })
    .click();
  await expect.element(page.getByRole("menuitem").first()).toBeVisible();
  expect(
    page
      .getByRole("menuitem")
      .elements()
      .map((el) => el.textContent),
  ).toEqual(["Remove"]);
});

test("no handlers: a read-only card, no menu, no reply, no edit", async () => {
  const screen = await render(
    <AgentPanel {...base} instructions="Draft the proposal from M-15." />,
  );
  expect(slot(screen.container, "agent-panel-menu")).toBeNull();
  expect(slot(screen.container, "agent-panel-reply")).toBeNull();
  expect(
    screen.container.querySelector("[aria-label='Edit instructions']"),
  ).toBeNull();
  expect(
    slot(screen.container, "agent-panel-instructions")!.textContent,
  ).toContain("Draft the proposal from M-15.");
});

test("queued: waiting line, Stop and the hint after a while", async () => {
  const screen = await render(
    <AgentPanel {...base} state="queued" queuedHint onStop={() => {}} />,
  );
  expect(slot(screen.container, "agent-panel-state")!.textContent).toContain(
    "Queued · Waiting for Claude Code to pick this up",
  );
  expect(slot(screen.container, "agent-panel-hint")!.textContent).toBe(
    "Claude Code picks up work when it's running on your machine.",
  );
  await expect
    .element(screen.getByRole("button", { name: "Stop", exact: true }))
    .toBeVisible();
});

test("question: needs you, the question, one-tap choices and Reply… focuses the reply box", async () => {
  const onAnswer = vi.fn();
  const screen = await render(
    <AgentPanel
      {...base}
      state="question"
      question="Which price list — v2 or the client's?"
      choices={[{ value: "v2" }, { value: "client", label: "Client's" }]}
      onAnswer={onAnswer}
      onReply={() => {}}
    />,
  );
  const root = slot(screen.container, "agent-panel")!;
  expect(root.hasAttribute("data-attention")).toBe(true);
  expect(slot(root, "agent-panel-state")!.textContent).toContain("Needs you");
  expect(slot(root, "agent-panel-question")!.textContent).toBe(
    "Which price list — v2 or the client's?",
  );
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Client's" }).click();
  expect(onAnswer).toHaveBeenCalledWith("client");
  await screen.getByRole("button", { name: "Reply…" }).click();
  expect(document.activeElement).toBe(
    screen.getByRole("textbox", { name: "Reply to Claude Code…" }).element(),
  );
});

test("approval, failed, blocked: each state's line and actions", async () => {
  const onApprove = vi.fn();
  const onDecline = vi.fn();
  const approval = await render(
    <AgentPanel
      {...base}
      state="approval"
      approval="Move 3 tasks to Trash"
      onApprove={onApprove}
      onDecline={onDecline}
    />,
  );
  expect(slot(approval.container, "agent-panel-state")!.textContent).toContain(
    "Wants approval · Move 3 tasks to Trash",
  );
  await approval.getByRole("button", { name: "Approve" }).click();
  await approval.getByRole("button", { name: "Decline" }).click();
  expect(onApprove).toHaveBeenCalledTimes(1);
  expect(onDecline).toHaveBeenCalledTimes(1);
  await approval.unmount();

  const onRetry = vi.fn();
  const onRemove = vi.fn();
  const failed = await render(
    <AgentPanel
      {...base}
      state="failed"
      error="Couldn't open M-15 — no access."
      onRetry={onRetry}
      onRemove={onRemove}
    />,
  );
  const failedLine = slot(failed.container, "agent-panel-state")!;
  expect(failedLine.textContent).toContain(
    "Failed · Couldn't open M-15 — no access.",
  );
  expect(failedLine.querySelector("q")).not.toBeNull();
  expect(
    failedLine
      .querySelector("[data-slot=agent-state-icon]")!
      .getAttribute("class"),
  ).toContain("text-destructive-text");
  await failed.getByRole("button", { name: "Retry" }).click();
  await failed.getByRole("button", { name: "Remove", exact: true }).click();
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(onRemove).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(failed.container);
  await failed.unmount();

  const onReconnect = vi.fn();
  const blocked = await render(
    <AgentPanel
      {...base}
      state="blocked"
      blockedReason="Its token expired"
      onReconnect={onReconnect}
    />,
  );
  expect(slot(blocked.container, "agent-panel-state")!.textContent).toContain(
    "Needs you · Its token expired",
  );
  await blocked.getByRole("button", { name: "Reconnect" }).click();
  expect(onReconnect).toHaveBeenCalledTimes(1);
});

test("done and stopped: date, duration, summary, the action, and the disconnect note", async () => {
  const onMarkDone = vi.fn();
  const done = await render(
    <AgentPanel
      {...base}
      state="done"
      finishedAt={NOW - 2 * 60 * MINUTE}
      durationSeconds={180}
      summary="Proposal drafted in P-42."
      onMarkDone={onMarkDone}
      disconnected
    />,
  );
  const line = slot(done.container, "agent-panel-state")!;
  expect(line.textContent).toMatch(/^Done · .+ · 3 min · Proposal drafted/);
  // A finished delegation never turns back into Needs you after a disconnect.
  expect(line.textContent).not.toContain("Needs you");
  expect(slot(done.container, "agent-panel-disconnected")!.textContent).toBe(
    "Agent since disconnected",
  );
  await done.getByRole("button", { name: "Mark task done" }).click();
  expect(onMarkDone).toHaveBeenCalledTimes(1);
  await done.unmount();

  const onDelegateAgain = vi.fn();
  const stopped = await render(
    <AgentPanel
      {...base}
      state="stopped"
      stoppedBy="Priya"
      finishedAt={NOW - MINUTE}
      changeCount={12}
      onDelegateAgain={onDelegateAgain}
    />,
  );
  expect(slot(stopped.container, "agent-panel-state")!.textContent).toMatch(
    /^Stopped by Priya · .+ · Its 12 changes stay — undo them in History/,
  );
  await stopped.getByRole("button", { name: "Delegate again" }).click();
  expect(onDelegateAgain).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(stopped.container);
});

test("none renders no card", async () => {
  const screen = await render(<AgentPanel {...base} state="none" />);
  expect(slot(screen.container, "agent-panel")).toBeNull();
});

test("a live state change is announced; the mount state is not", async () => {
  const screen = await render(<AgentPanel {...base} />);
  const region = () =>
    screen.container.querySelector("[role=status][aria-live=polite]");
  expect(region()?.textContent ?? "").toBe("");
  await screen.rerender(<AgentPanel {...base} state="question" />);
  await expect.poll(() => region()?.textContent).toBe("Claude Code: Needs you");
});

test("instructions: ✎ edits in place; Save sends the text, Escape cancels", async () => {
  const onInstructionsChange = vi.fn();
  const screen = await render(
    <AgentPanel
      {...base}
      instructions="Draft the proposal."
      onInstructionsChange={onInstructionsChange}
    />,
  );
  await screen.getByRole("button", { name: "Edit instructions" }).click();
  const box = screen.getByRole("textbox", { name: "Instructions" });
  await box.fill("Draft it from M-15's notes.");
  await screen.getByRole("button", { name: "Save" }).click();
  expect(onInstructionsChange).toHaveBeenCalledWith(
    "Draft it from M-15's notes.",
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Instructions" }))
    .not.toBeInTheDocument();

  await screen.getByRole("button", { name: "Edit instructions" }).click();
  await userEvent.keyboard("{Escape}");
  await expect
    .element(screen.getByRole("textbox", { name: "Instructions" }))
    .not.toBeInTheDocument();
  expect(onInstructionsChange).toHaveBeenCalledTimes(1);
});

test("empty instructions offer Add instructions to a viewer who may steer", async () => {
  const screen = await render(
    <AgentPanel {...base} onInstructionsChange={() => {}} />,
  );
  await screen.getByRole("button", { name: "Add instructions" }).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Instructions" }))
    .toBeVisible();
});

test("latest: up to three messages and changes, Show all, and the reply box sends on Cmd/Ctrl+Enter", async () => {
  const onShowAll = vi.fn();
  const onReply = vi.fn();
  const screen = await render(
    <AgentPanel
      {...base}
      latest={[
        {
          id: "1",
          kind: "message",
          text: "Two prices conflict; using v2",
          at: NOW - 2 * MINUTE,
        },
        {
          id: "2",
          kind: "change",
          text: "Status → In progress",
          at: NOW - 3 * MINUTE,
        },
        { id: "3", kind: "message", text: "Starting.", at: NOW - 4 * MINUTE },
        { id: "4", kind: "message", text: "Hidden", at: NOW - 5 * MINUTE },
      ]}
      latestTotal={5}
      onShowAll={onShowAll}
      onReply={onReply}
    />,
  );
  const events = screen.container.querySelectorAll(
    "[data-slot=agent-panel-event]",
  );
  expect(events).toHaveLength(3);
  expect(events[0]!.textContent).toContain("Message: Two prices conflict");
  expect(events[1]!.getAttribute("data-kind")).toBe("change");
  expect(events[0]!.querySelector("time")!.textContent).toBe("2m ago");
  await screen.getByRole("button", { name: "Show all 5" }).click();
  expect(onShowAll).toHaveBeenCalledTimes(1);

  const send = screen.getByRole("button", { name: "Send reply" });
  await expect.element(send).toBeDisabled();
  const box = screen.getByRole("textbox", { name: "Reply to Claude Code…" });
  await box.fill("Use v1 please.");
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(onReply).toHaveBeenCalledWith("Use v1 please.");
  await expect.element(box).toHaveValue("");
  await expectNoA11yViolations(screen.container);
});

test("reply disabled with its reason", async () => {
  const screen = await render(
    <AgentPanel
      {...base}
      onReply={() => {}}
      replyDisabledReason="Only Priya can steer it"
    />,
  );
  const box = screen.getByRole("textbox", { name: "Reply to Claude Code…" });
  await expect.element(box).toBeDisabled();
  await expect
    .element(box)
    .toHaveAccessibleDescription("Only Priya can steer it");
});

test("history: runs with View and Undo; Undo disabled with its reason", async () => {
  const onView = vi.fn();
  const onUndo = vi.fn();
  const blockedUndo = vi.fn();
  const screen = await render(
    <AgentPanel
      {...base}
      state="done"
      runs={[
        { id: "r1", changeCount: 3, at: NOW - 30 * MINUTE, onView, onUndo },
        {
          id: "r2",
          changeCount: 1,
          at: NOW - 3 * 24 * 60 * MINUTE,
          onUndo: blockedUndo,
          undoDisabledReason: "Edited since",
        },
      ]}
    />,
  );
  const runs = screen.container.querySelectorAll("[data-slot=agent-panel-run]");
  expect(runs[0]!.textContent).toMatch(/^Run · 3 changes ?· /);
  expect(runs[1]!.textContent).toMatch(/^Run · 1 change ?· /);
  await screen.getByRole("button", { name: "View" }).click();
  expect(onView).toHaveBeenCalledTimes(1);
  const undos = screen.getByRole("button", { name: "Undo" });
  await undos.first().click();
  expect(onUndo).toHaveBeenCalledTimes(1);
  const disabled = undos.nth(1);
  await expect.element(disabled).toHaveAttribute("aria-disabled", "true");
  await expect.element(disabled).toHaveAccessibleDescription("Edited since");
  await disabled.click({ force: true });
  expect(blockedUndo).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("section: a one-line summary header, open while working, closed when done", async () => {
  const onStop = vi.fn();
  const screen = await render(
    <AgentPanel
      {...base}
      variant="section"
      startedAt={NOW - 4 * MINUTE}
      progress="Reading the 3 linked pages…"
      onStop={onStop}
      onReply={() => {}}
    />,
  );
  const root = slot(screen.container, "agent-panel")!;
  expect(root.dataset.variant).toBe("section");
  expect(slot(root, "agent-panel-summary")!.textContent).toBe(
    "Working · 4 min · Reading the 3 linked pages…",
  );
  const trigger = screen.getByRole("button", { name: /^Agent/ });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await expect
    .element(screen.getByRole("textbox", { name: "Reply to Claude Code…" }))
    .toBeVisible();
  await screen.getByRole("button", { name: "Stop", exact: true }).click();
  expect(onStop).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
  await trigger.click();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await screen.unmount();

  const done = await render(
    <AgentPanel
      {...base}
      variant="section"
      state="done"
      finishedAt={NOW - MINUTE}
      durationSeconds={180}
      summary="Proposal drafted in P-42."
    />,
  );
  await expect
    .element(done.getByRole("button", { name: /^Agent/ }))
    .toHaveAttribute("aria-expanded", "false");
});

test("labels replace every string", async () => {
  const screen = await render(
    <AgentPanel
      {...base}
      state="queued"
      onStop={() => {}}
      labels={{ title: "Agente", stop: "Detener", waiting: () => "En cola" }}
      stateLabels={{ queued: "En espera" }}
    />,
  );
  expect(screen.container.textContent).toContain("Agente");
  expect(slot(screen.container, "agent-panel-state")!.textContent).toContain(
    "En espera · En cola",
  );
  await expect
    .element(screen.getByRole("button", { name: "Detener" }))
    .toBeVisible();
});

test("slot: the agent on one line, the empty ghost, the muted reason, and read-only", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  const onClick = vi.fn();
  const screen = await render(
    <div>
      <AgentSlot ref={ref} agent={agent} state="working" onClick={onClick} />
      <AgentSlot />
      <AgentSlot disabledReason="Only Priya can delegate — assign it to yourself first" />
      <AgentSlot agent={agent} state="done" readOnly />
    </div>,
  );
  const slots = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=agent-slot]",
  );
  expect(ref.current).toBe(slots[0]);
  expect(slots[0]!.textContent).toBe("Claude Code, Working");
  expect(slots[0]!.dataset.state).toBe("working");
  await screen.getByRole("button", { name: /^Claude Code.*Working$/ }).click();
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(slots[1]!.tagName).toBe("BUTTON");
  expect(slots[1]!.hasAttribute("data-empty")).toBe(true);
  expect(slots[1]!.textContent).toBe("Delegate to an agent…");
  expect(slots[2]!.tagName).toBe("SPAN");
  expect(slots[2]!.textContent).toBe(
    "Only Priya can delegate — assign it to yourself first",
  );
  expect(slots[3]!.tagName).toBe("SPAN");
  // The state word never truncates; the name does.
  const badge = slots[0]!.querySelector<HTMLElement>(
    "[data-slot=agent-state-badge]",
  )!;
  expect(getComputedStyle(badge).flexShrink).toBe("0");
  expect(getComputedStyle(badge).whiteSpace).toBe("nowrap");
  await expectNoA11yViolations(screen.container);
});

test("chip: the agent and its state as one pill, or the dashed Delegate pill", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <div>
      <AgentChip agent={agent} state="question" onClick={onClick} />
      <AgentChip />
    </div>,
  );
  const chips = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=agent-chip]",
  );
  expect(chips[0]!.textContent).toBe("Claude Code, ·Needs you");
  expect(chips[0]!.dataset.state).toBe("question");
  expect(chips[1]!.hasAttribute("data-empty")).toBe(true);
  expect(chips[1]!.textContent).toBe("Delegate");
  await screen.getByRole("button", { name: /Claude Code/ }).click();
  expect(onClick).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("badge and ring: icon and word; amber ring for needs you, red for failed, none otherwise", async () => {
  const screen = await render(
    <div>
      <AgentStateBadge state="done" />
      <AgentStateBadge state="none" />
      <AgentStateRing state="question">
        <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
      </AgentStateRing>
      <AgentStateRing state="failed" srLabel={false}>
        <PersonAvatar person={{ name: "Codex", kind: "agent" }} />
      </AgentStateRing>
      <AgentStateRing state="working">
        <PersonAvatar person={{ name: "Codex", kind: "agent" }} />
      </AgentStateRing>
    </div>,
  );
  const badges = screen.container.querySelectorAll(
    "[data-slot=agent-state-badge]",
  );
  expect(badges).toHaveLength(1);
  expect(badges[0]!.textContent).toBe("Done");
  expect(badges[0]!.className).toContain("text-success-text");
  const rings = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=agent-state-ring]",
  );
  expect(rings[0]!.className).toContain("ring-warning");
  expect(rings[0]!.textContent).toContain("Needs you");
  expect(rings[1]!.className).toContain("ring-destructive");
  expect(rings[1]!.textContent).toBe("");
  expect(rings[2]!.className).not.toContain("ring-2");
  await expectNoA11yViolations(screen.container);
});

test("hover card: name, Agent, acting for, access, state and View agent", async () => {
  const onViewAgent = vi.fn();
  const screen = await render(
    <AgentHoverCard agent={agent} state="working" onViewAgent={onViewAgent}>
      <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
    </AgentHoverCard>,
  );
  const trigger = screen.getByRole("button", {
    name: "Claude Code via Priya, agent",
  });
  await trigger.click();
  const card = page.getByText("Acting for Priya · Read & write");
  await expect.element(card).toBeVisible();
  await expect.element(page.getByText("Working")).toBeVisible();
  await page.getByRole("button", { name: "View agent" }).click();
  expect(onViewAgent).toHaveBeenCalledTimes(1);
});

test("hover card: the last action under the state, and AgentCard alone", async () => {
  const screen = await render(
    <>
      <AgentHoverCard
        agent={agent}
        state="question"
        lastAction="Which price list — v2 or the client's?"
      >
        <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
      </AgentHoverCard>
      <AgentCard agent={{ name: "Codex" }} />
    </>,
  );
  const bare = screen.container.querySelector("[data-slot=agent-hover-card]");
  expect(bare!.textContent).not.toContain("Last action");
  await screen
    .getByRole("button", { name: "Claude Code via Priya, agent" })
    .click();
  const last = page.getByText("Which price list — v2 or the client's?");
  await expect.element(last).toBeVisible();
  await expect.element(page.getByText("Last action")).toBeVisible();
  await expectNoA11yViolations(document.body);
});

test("section: closes when the work finishes and opens when it comes back", async () => {
  const screen = await render(<AgentPanel {...base} variant="section" />);
  const trigger = screen.getByRole("button", { name: /^Agent/ });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await screen.rerender(
    <AgentPanel {...base} variant="section" state="done" />,
  );
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await screen.rerender(
    <AgentPanel {...base} variant="section" state="question" />,
  );
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
});

test("reply: a draft typed while a reply sends is kept", async () => {
  let resolve!: () => void;
  const onReply = vi.fn(
    () =>
      new Promise<void>((r) => {
        resolve = r;
      }),
  );
  const screen = await render(<AgentPanel {...base} onReply={onReply} />);
  const box = screen.getByRole("textbox", { name: "Reply to Claude Code…" });
  await box.fill("First");
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await box.fill("Second");
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(onReply).toHaveBeenCalledTimes(1);
  resolve();
  await expect.element(box).toHaveValue("Second");
});

test("instructions: Escape hands focus back to ✎", async () => {
  const screen = await render(
    <AgentPanel
      {...base}
      instructions="Draft the proposal."
      onInstructionsChange={() => {}}
    />,
  );
  const edit = screen.getByRole("button", { name: "Edit instructions" });
  await edit.click();
  await userEvent.keyboard("{Escape}");
  await expect
    .poll(() => document.activeElement)
    .toBe(screen.getByRole("button", { name: "Edit instructions" }).element());
});

test("section: collapsing keeps a reply draft", async () => {
  const screen = await render(
    <AgentPanel {...base} variant="section" onReply={() => {}} />,
  );
  await screen
    .getByRole("textbox", { name: "Reply to Claude Code…" })
    .fill("Half a thought");
  const trigger = screen.getByRole("button", { name: /^Agent/ });
  await trigger.click();
  await trigger.click();
  await expect
    .element(screen.getByRole("textbox", { name: "Reply to Claude Code…" }))
    .toHaveValue("Half a thought");
});
