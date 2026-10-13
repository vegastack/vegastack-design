import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import { ApprovalCard, type ApprovalCardProps } from "./approval-card";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const DAY = 86_400_000;

const base: ApprovalCardProps = {
  actor: { name: "Claude Code", kind: "agent", via: "Manoj" },
  verb: (
    <>
      wants to <strong>move 2 tasks to Trash</strong>
    </>
  ),
  items: [
    {
      id: "12",
      title: "#12 Update launch spec",
      href: "#12",
      meta: "Marketing",
    },
    { id: "14", title: "#14 Draft copy", meta: "Marketing" },
  ],
  moreCount: 3,
  reason: "These duplicate #10 and #11.",
  reassurance: "You can restore them from Trash for 30 days.",
  requestedAt: NOW - 2 * 60_000,
  expiresAt: NOW + 5 * DAY,
  now: NOW,
};

const slot = (c: HTMLElement, name: string) =>
  c.querySelector<HTMLElement>(`[data-slot="approval-card-${name}"]`);

test("pending: the agent, the action, the records, the reason, the expiry, and Approve / Decline", async () => {
  const onApprove = vi.fn();
  const onDecline = vi.fn();
  const screen = await render(
    <ApprovalCard {...base} onApprove={onApprove} onDecline={onDecline} />,
  );
  const card = screen.getByRole("region", {
    name: "Claude Code, agent of Manoj wants to move 2 tasks to Trash",
  });
  await expect.element(card).toHaveAttribute("data-status", "pending");
  expect(
    screen.container.querySelector("[data-slot=avatar][data-kind=agent]"),
  ).not.toBeNull();
  expect(
    screen.container.querySelectorAll("[data-slot=approval-card-item]"),
  ).toHaveLength(2);
  await expect
    .element(screen.getByRole("link", { name: "#12 Update launch spec" }))
    .toHaveAttribute("href", "#12");
  expect(slot(screen.container, "more")!.textContent).toBe("and 3 more");
  expect(slot(screen.container, "reason")!.textContent).toBe(
    "“These duplicate #10 and #11.”",
  );
  expect(slot(screen.container, "meta")!.textContent).toBe(
    "Requested 2m ago · Expires in 5 days",
  );
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Approve" }).click();
  expect(onApprove).toHaveBeenCalledTimes(1);
  await screen.getByRole("button", { name: "Decline" }).click();
  expect(onDecline).toHaveBeenCalledTimes(1);
});

test("a pending promise keeps its button busy and the other disabled; a rejection shows the error", async () => {
  let fail!: (error: Error) => void;
  const onApprove = vi.fn(
    () => new Promise<void>((_, reject) => (fail = reject)),
  );
  const screen = await render(
    <ApprovalCard {...base} onApprove={onApprove} onDecline={vi.fn()} />,
  );
  await screen.getByRole("button", { name: "Approve" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Approve" }))
    .toHaveAttribute("aria-busy", "true");
  await expect
    .element(screen.getByRole("button", { name: "Decline" }))
    .toHaveAttribute("data-disabled");
  fail(new Error("Couldn't do it: 1 task is already in Trash."));
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn't do it: 1 task is already in Trash.");
});

test("approving: Approve is busy while the host carries it out", async () => {
  const screen = await render(
    <ApprovalCard
      {...base}
      status="approving"
      onApprove={vi.fn()}
      onDecline={vi.fn()}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Approve" }))
    .toHaveAttribute("aria-busy", "true");
});

test("each outcome replaces the buttons and drops the expiry", async () => {
  const cases: [ApprovalCardProps["status"], string][] = [
    ["approved", "Approved"],
    ["declined", "Declined. Claude Code was told."],
    ["expired", "Expired. Claude Code can ask again."],
    ["cancelled", "Cancelled"],
    ["already", "Already answered on another device"],
  ];
  const screen = await render(
    <div>
      {cases.map(([status]) => (
        <ApprovalCard
          key={status}
          {...base}
          status={status}
          onApprove={vi.fn()}
        />
      ))}
    </div>,
  );
  const cards = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=approval-card]",
  );
  cases.forEach(([status, line], i) => {
    const card = cards[i]!;
    expect(card.dataset.status).toBe(status);
    expect(slot(card, "actions")).toBeNull();
    expect(slot(card, "status")!.textContent).toBe(line);
    expect(slot(card, "meta")!.textContent).toBe("Requested 2m ago");
  });
  await expectNoA11yViolations(screen.container);
});

test("a decision made while the card is open is announced", async () => {
  const live = await render(<ApprovalCard {...base} onApprove={vi.fn()} />);
  live.rerender(
    <ApprovalCard
      {...base}
      status="approved"
      statusLine="Approved by you · just now"
      onApprove={vi.fn()}
    />,
  );
  await expect
    .element(live.getByRole("status"))
    .toHaveTextContent("Approved by you · just now");
  expect(slot(live.container, "status")!.textContent).toBe(
    "Approved by you · just now",
  );
});

test("someone who can't decide sees whose approval it waits for", async () => {
  const screen = await render(
    <ApprovalCard {...base} canDecide={false} onApprove={vi.fn()} />,
  );
  expect(slot(screen.container, "actions")).toBeNull();
  expect(slot(screen.container, "status")!.textContent).toBe(
    "Waiting for Manoj's approval",
  );
});

test("narrow, the buttons stack full width with Approve on top", async () => {
  const screen = await render(
    <div style={{ width: 320 }}>
      <ApprovalCard {...base} onApprove={vi.fn()} onDecline={vi.fn()} />
    </div>,
  );
  const approve = screen
    .getByRole("button", { name: "Approve" })
    .element()
    .getBoundingClientRect();
  const decline = screen
    .getByRole("button", { name: "Decline" })
    .element()
    .getBoundingClientRect();
  expect(approve.bottom).toBeLessThanOrEqual(decline.top);
  expect(Math.round(approve.width)).toBe(Math.round(decline.width));
});
