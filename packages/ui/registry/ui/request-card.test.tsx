import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import {
  PermissionList,
  RequestCard,
  type CardSpec,
  type CardState,
} from "./request-card";

const exact = {
  scope: "exact" as const,
  place: { kind: "slack_channel" as const, id: "C1", label: "#ops" },
  label: "Always allow in #ops",
};
const wider = {
  scope: "wider" as const,
  place: { kind: "audience" as const, id: "slack", label: "Slack" },
  label: "Always allow in any of its Slack channels",
};

const spec: CardSpec = {
  agent: { id: "a1", name: "Inbox assistant", avatar: null },
  title: "Inbox assistant wants to post in #ops",
  why: "It read an email in this run, so it checks with you first.",
  preview: { kind: "quote", text: "Friday demo time?" },
  from: "From the 09:46 run · asked 2 min ago",
  answers: { once: true, always: [exact, wider], decline: true, never: true },
  footnote: "Always also covers runs that read email.",
  nudge: null,
  hard: false,
};

const slot = (c: HTMLElement, name: string) =>
  c.querySelector<HTMLElement>(`[data-slot="request-card-${name}"]`);

test("pending: the title, why, preview, from, footnote and the three answers", async () => {
  const onAllowOnce = vi.fn();
  const onAlways = vi.fn();
  const onDecline = vi.fn();
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      onAllowOnce={onAllowOnce}
      onAlways={onAlways}
      onDecline={onDecline}
      onNever={vi.fn()}
    />,
  );
  const card = screen.getByRole("region", {
    name: "Inbox assistant wants to post in #ops",
  });
  await expect.element(card).toHaveAttribute("data-state", "pending");
  expect(slot(screen.container, "preview")!.textContent).toBe(
    "“Friday demo time?”",
  );
  expect(slot(screen.container, "from")!.textContent).toBe(
    "From the 09:46 run · asked 2 min ago",
  );
  expect(slot(screen.container, "footnote")).not.toBeNull();
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Allow once" }).click();
  expect(onAllowOnce).toHaveBeenCalledTimes(1);
  await screen.getByRole("button", { name: "Always allow in #ops" }).click();
  expect(onAlways).toHaveBeenCalledWith(exact);
  await screen.getByRole("button", { name: "Decline", exact: true }).click();
  expect(onDecline).toHaveBeenCalledWith();
});

test("neither Allow once nor Always is the primary button", async () => {
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      onAllowOnce={vi.fn()}
      onAlways={vi.fn()}
      onDecline={vi.fn()}
    />,
  );
  for (const b of screen.container.querySelectorAll("[data-slot=button]")) {
    expect(b.getAttribute("data-variant")).not.toBe("default");
  }
});

test("the Always menu widens one step", async () => {
  const onAlways = vi.fn();
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      onAllowOnce={vi.fn()}
      onAlways={onAlways}
      onDecline={vi.fn()}
    />,
  );
  await screen
    .getByRole("button", { name: "More ways to always allow" })
    .click();
  await screen
    .getByRole("menuitem", {
      name: "Always allow in any of its Slack channels",
    })
    .click();
  expect(onAlways).toHaveBeenCalledWith(wider);
});

test("the Decline menu: Never allow this, and a note", async () => {
  const onNever = vi.fn();
  const onDecline = vi.fn();
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      onAllowOnce={vi.fn()}
      onAlways={vi.fn()}
      onDecline={onDecline}
      onNever={onNever}
    />,
  );
  await screen.getByRole("button", { name: "More ways to decline" }).click();
  await screen.getByRole("menuitem", { name: "Never allow this" }).click();
  expect(onNever).toHaveBeenCalledTimes(1);

  await screen.getByRole("button", { name: "More ways to decline" }).click();
  await screen.getByRole("menuitem", { name: "Decline with a note…" }).click();
  await screen
    .getByRole("textbox", { name: "A note for the agent" })
    .fill("Use #sales instead");
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Decline", exact: true }).click();
  expect(onDecline).toHaveBeenCalledWith("Use #sales instead");
});

test("a hard-rule request has Allow once and Decline only", async () => {
  const screen = await render(
    <RequestCard
      spec={{ ...spec, hard: true }}
      state="pending"
      onAllowOnce={vi.fn()}
      onAlways={vi.fn()}
      onDecline={vi.fn()}
      onNever={vi.fn()}
    />,
  );
  const buttons = [
    ...screen.container.querySelectorAll<HTMLElement>(
      "[data-slot=request-card-actions] [data-slot=button]",
    ),
  ].map((b) => b.textContent);
  expect(buttons).toEqual(["Allow once", "Decline"]);
  await expect
    .element(screen.getByRole("region"))
    .toHaveAttribute("data-hard", "true");
  await expectNoA11yViolations(screen.container);
});

test("the nudge shows above the buttons and puts Always first", async () => {
  const screen = await render(
    <RequestCard
      spec={{ ...spec, nudge: "You've allowed this 3 times. Always allow?" }}
      state="pending"
      onAllowOnce={vi.fn()}
      onAlways={vi.fn()}
      onDecline={vi.fn()}
    />,
  );
  expect(slot(screen.container, "nudge")!.textContent).toBe(
    "You've allowed this 3 times. Always allow?",
  );
  const first = slot(screen.container, "actions")!.firstElementChild!;
  expect(first.getAttribute("data-answer")).toBe("always");
  await expectNoA11yViolations(screen.container);
});

test("a bundle answers a run's requests together", async () => {
  const onReviewEach = vi.fn();
  const onAlways = vi.fn();
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      bundle={{
        items: [
          { title: "post in #ops", place: "Slack" },
          { title: "save Weekly digest.pdf", place: "Ops / Reports" },
        ],
      }}
      onAllowOnce={vi.fn()}
      onAlways={onAlways}
      onDecline={vi.fn()}
      onReviewEach={onReviewEach}
    />,
  );
  expect(slot(screen.container, "bundle")!.querySelectorAll("li")).toHaveLength(
    2,
  );
  for (const name of [
    "Allow all once",
    "Always allow these",
    "Review each",
    "Decline all",
  ]) {
    await expect.element(screen.getByRole("button", { name })).toBeVisible();
  }
  await screen.getByRole("button", { name: "Always allow these" }).click();
  expect(onAlways).toHaveBeenCalledWith(exact);
  await screen.getByRole("button", { name: "Review each" }).click();
  expect(onReviewEach).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("busy: the pressed button spins and the rest are disabled", async () => {
  function Host() {
    const [busy, setBusy] = React.useState(false);
    return (
      <RequestCard
        spec={spec}
        state="pending"
        busy={busy}
        onAllowOnce={() => setBusy(true)}
        onAlways={vi.fn()}
        onDecline={vi.fn()}
      />
    );
  }
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "Allow once" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Allow once" }))
    .toHaveAttribute("aria-busy", "true");
  await expect
    .element(screen.getByRole("button", { name: "Decline", exact: true }))
    .toBeDisabled();
});

test.each<[CardState, string, string | null]>([
  ["allowed_once", "Allowed once by Priya from Slack", null],
  ["allowed_always", "Always allowed by Priya from Slack", "Revoke"],
  ["declined", "Declined by Priya from Slack", null],
  ["never", "Never: set by Priya from Slack", "Undo"],
  ["skipped", "Skipped: no answer in 24 h", "Do it now"],
  ["withdrawn", "Withdrawn: a new message was sent", null],
  ["cancelled", "Cancelled: the agent was archived", null],
  ["expired", "Expired: no answer in 7 days", null],
  ["refused", "Not allowed: a workspace rule blocks this", null],
])("%s reads the same words everywhere", async (state, words, action) => {
  const onRevoke = vi.fn();
  const onDoItNow = vi.fn();
  const screen = await render(
    <RequestCard
      spec={spec}
      state={state}
      answeredBy="Priya"
      answeredVia="slack"
      onRevoke={onRevoke}
      onDoItNow={onDoItNow}
      onAllowOnce={vi.fn()}
    />,
  );
  expect(slot(screen.container, "actions")).toBeNull();
  const status = slot(screen.container, "status")!;
  expect(status.textContent).toContain(words);
  if (action) {
    await screen.getByRole("button", { name: action }).click();
    expect(onRevoke.mock.calls.length + onDoItNow.mock.calls.length).toBe(1);
  } else {
    expect(
      screen.container.querySelector("[data-answer=status-action]"),
    ).toBeNull();
  }
  await expectNoA11yViolations(screen.container);
});

test("a viewer who can't answer sees whose answer it waits for", async () => {
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      canAnswer={false}
      waitingFor="Manoj"
      onAllowOnce={vi.fn()}
    />,
  );
  expect(slot(screen.container, "status")!.textContent).toBe(
    "Waiting for Manoj's answer",
  );
});

test("a settled state is announced when it changes on screen, not on first paint", async () => {
  const screen = await render(<RequestCard spec={spec} state="pending" />);
  const region = () =>
    screen.container.querySelector("[role=status]")?.textContent ?? "";
  expect(region()).toBe("");
  await screen.rerender(
    <RequestCard spec={spec} state="allowed_once" answeredBy="you" />,
  );
  await expect.poll(region).toBe("Allowed once by you");
});

test("compact: one row with the title, from and small buttons", async () => {
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      compact
      onAllowOnce={vi.fn()}
      onAlways={vi.fn()}
      onDecline={vi.fn()}
    />,
  );
  await expect
    .element(screen.getByRole("region"))
    .toHaveAttribute("data-compact", "true");
  expect(slot(screen.container, "why")).toBeNull();
  // The words a send would send stay, so Allow once is never pressed blind.
  expect(slot(screen.container, "preview")?.textContent).toContain(
    "Friday demo time?",
  );
  await expect
    .element(screen.getByRole("button", { name: "Allow once" }))
    .toHaveClass("h-7");
  await expectNoA11yViolations(screen.container);
});

test("compact: other previews stay out of the row", async () => {
  const screen = await render(
    <RequestCard
      spec={{
        ...spec,
        preview: { kind: "recipients", items: ["sm@vegastack.com"] },
      }}
      state="pending"
      compact
      onAllowOnce={vi.fn()}
      onAlways={vi.fn()}
      onDecline={vi.fn()}
    />,
  );
  expect(slot(screen.container, "preview")).toBeNull();
});

test("What I've allowed: uses, last used, paused, Revoke, Undo and Keep", async () => {
  const onRevoke = vi.fn();
  const onConfirm = vi.fn();
  const screen = await render(
    <>
      <PermissionList
        title="Allowed"
        items={[
          {
            id: "p1",
            effect: "allow",
            title: "Post in #ops",
            note: "also after email",
            uses: 14,
            lastUsed: "2 h ago",
          },
          {
            id: "p2",
            effect: "allow",
            title: "Post in #sales",
            uses: 0,
            paused: "Paused: the owner changed",
            confirmable: true,
          },
        ]}
        onRevoke={onRevoke}
        onConfirm={onConfirm}
      />
      <PermissionList
        title="Never"
        items={[
          {
            id: "n1",
            effect: "never",
            title: "Email outside",
            setOn: "10 Nov",
          },
        ]}
        onRevoke={onRevoke}
      />
      <PermissionList title="Empty" items={[]} empty="Nothing yet." />
    </>,
  );
  const metas = [
    ...screen.container.querySelectorAll("[data-slot=permission-row-meta]"),
  ].map((m) => m.textContent);
  expect(metas).toEqual([
    "Used 14× · last 2 h ago",
    "Not used yet",
    "Set 10 Nov",
  ]);
  await expect
    .element(screen.getByText("Paused: the owner changed"))
    .toBeVisible();
  await expect.element(screen.getByText("Nothing yet.")).toBeVisible();
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Revoke" }).first().click();
  expect(onRevoke).toHaveBeenCalledWith("p1");
  await screen.getByRole("button", { name: "Undo" }).click();
  expect(onRevoke).toHaveBeenCalledWith("n1");
  await screen.getByRole("button", { name: "Keep" }).click();
  expect(onConfirm).toHaveBeenCalledWith("p2");
});

test("an error shows under the card, and a same-state change of words is announced", async () => {
  const screen = await render(
    <RequestCard spec={spec} state="allowed_once" answeredBy="you" />,
  );
  const region = () =>
    screen.container.querySelector("[role=status]")?.textContent ?? "";
  await screen.rerender(
    <RequestCard
      spec={spec}
      state="allowed_once"
      answeredBy="you"
      statusText="Already answered by Priya"
      error="Couldn't answer. Try again."
    />,
  );
  await expect.poll(region).toBe("Already answered by Priya");
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn't answer. Try again.");
  await expectNoA11yViolations(screen.container);
});

test("Never allow this keeps Decline busy while it is on its way", async () => {
  function Host() {
    const [busy, setBusy] = React.useState(false);
    return (
      <RequestCard
        spec={spec}
        state="pending"
        busy={busy}
        onAllowOnce={vi.fn()}
        onDecline={vi.fn()}
        onNever={() => setBusy(true)}
      />
    );
  }
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "More ways to decline" }).click();
  await screen.getByRole("menuitem", { name: "Never allow this" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Decline", exact: true }))
    .toHaveAttribute("aria-busy", "true");
  await expect
    .element(screen.getByRole("button", { name: "Allow once" }))
    .toBeDisabled();
});

test("cancelling a note returns focus to Decline", async () => {
  const screen = await render(
    <RequestCard
      spec={spec}
      state="pending"
      onAllowOnce={vi.fn()}
      onDecline={vi.fn()}
    />,
  );
  await screen.getByRole("button", { name: "More ways to decline" }).click();
  await screen.getByRole("menuitem", { name: "Decline with a note…" }).click();
  await expect
    .element(screen.getByRole("textbox", { name: "A note for the agent" }))
    .toHaveFocus();
  await screen.getByRole("button", { name: "Cancel" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Decline", exact: true }))
    .toHaveFocus();
});

test("compact: the title and the answers share a row in a wide container", async () => {
  const screen = await render(
    <div style={{ width: "48rem" }}>
      <RequestCard
        spec={spec}
        state="pending"
        compact
        onAllowOnce={vi.fn()}
        onAlways={vi.fn()}
        onDecline={vi.fn()}
      />
    </div>,
  );
  const title = slot(screen.container, "title")!.getBoundingClientRect();
  const actions = slot(screen.container, "actions")!.getBoundingClientRect();
  expect(actions.left).toBeGreaterThan(title.left);
  expect(actions.top).toBeLessThan(title.bottom);
});

test("the agent's own glyph is its face when it has no image", async () => {
  const screen = await render(
    <RequestCard
      spec={{
        ...spec,
        agent: {
          ...spec.agent,
          mark: <svg data-testid="agent-glyph" />,
          hue: "green",
        },
      }}
      state="pending"
      onAllowOnce={vi.fn()}
      onAlways={vi.fn()}
      onDecline={vi.fn()}
      onNever={vi.fn()}
    />,
  );
  expect(
    screen.container.querySelector('[data-testid="agent-glyph"]'),
  ).not.toBeNull();
  expect(screen.container.querySelector(".bg-tag-green-subtle")).not.toBeNull();
});

test("a permission row draws its agent's own glyph and hue", async () => {
  const screen = await render(
    <PermissionList
      title="Allowed"
      items={[
        {
          id: "p1",
          effect: "allow",
          title: "Post in #ops",
          uses: 1,
          agent: {
            id: "a1",
            name: "Inbox assistant",
            avatar: null,
            mark: <svg data-testid="agent-glyph" />,
            hue: "green",
          },
        },
      ]}
      onRevoke={vi.fn()}
    />,
  );
  expect(
    screen.container.querySelector('[data-testid="agent-glyph"]'),
  ).not.toBeNull();
  expect(screen.container.querySelector(".bg-tag-green-subtle")).not.toBeNull();
});
