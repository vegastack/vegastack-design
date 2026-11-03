import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import {
  AgentEditBanner,
  type AgentEditBannerProps,
} from "./agent-edit-banner";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const MINUTE = 60_000;

const base: AgentEditBannerProps = {
  agent: { name: "Claude", via: "Manoj" },
  changeCount: 3,
  at: NOW - 2 * MINUTE,
  now: NOW,
};

const slot = (c: Element, name: string) =>
  c.querySelector<HTMLElement>(`[data-slot="agent-edit-banner-${name}"]`);

const UNDO = "Undo Claude (for Manoj)'s changes";
const VIEW = "View Claude (for Manoj)'s changes";
const APPROVE = "Approve Claude (for Manoj)'s changes";

test("edited: the purple bot, the summary, View changes, Undo and Dismiss, in a polite region", async () => {
  const onViewChanges = vi.fn();
  const onUndo = vi.fn();
  const onDismiss = vi.fn();
  const screen = await render(
    <AgentEditBanner
      {...base}
      onViewChanges={onViewChanges}
      onUndo={onUndo}
      onDismiss={onDismiss}
    />,
  );
  const banner = screen.container.querySelector<HTMLElement>(
    "[data-slot=agent-edit-banner]",
  )!;
  expect(banner.getAttribute("role")).toBe("status");
  expect(banner.getAttribute("aria-live")).toBe("polite");
  expect(banner.dataset.status).toBe("idle");
  expect(banner.dataset.kind).toBe("edited");
  // The purple look is decoration: the avatar is hidden, the words carry it.
  const avatar = banner.querySelector("[data-slot=avatar][data-kind=agent]");
  expect(avatar).not.toBeNull();
  expect(avatar!.getAttribute("aria-hidden")).toBe("true");
  expect(slot(banner, "summary")!.textContent).toBe(
    "Edited by Claude (for Manoj) · 3 changes · 2m ago",
  );
  // The ticking time is not re-announced by the live region.
  expect(banner.querySelector("time")!.getAttribute("aria-live")).toBe("off");
  await expectNoA11yViolations(screen.container);

  await screen.getByRole("button", { name: VIEW }).click();
  expect(onViewChanges).toHaveBeenCalledTimes(1);
  await screen.getByRole("button", { name: UNDO }).click();
  expect(onUndo).toHaveBeenCalledTimes(1);
  await screen.getByRole("button", { name: "Dismiss" }).click();
  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(screen.container.textContent).toContain("Undo this agent's changes");
  expect(slot(banner, "reason")).toBeNull();
});

test("one change reads in the singular", async () => {
  const screen = await render(<AgentEditBanner {...base} changeCount={1} />);
  expect(slot(screen.container, "summary")!.textContent).toBe(
    "Edited by Claude (for Manoj) · 1 change · 2m ago",
  );
});

test("undoing: Undo spins and both buttons are disabled", async () => {
  const onUndo = vi.fn();
  const onViewChanges = vi.fn();
  const screen = await render(
    <AgentEditBanner
      {...base}
      status="undoing"
      onViewChanges={onViewChanges}
      onUndo={onUndo}
      onDismiss={vi.fn()}
    />,
  );
  const undo = screen.getByRole("button", { name: UNDO });
  await expect.element(undo).toHaveAttribute("aria-busy", "true");
  await expect.element(undo).toHaveAttribute("data-disabled");
  expect(
    undo.element().querySelector("[data-slot=spinner], svg"),
  ).not.toBeNull();
  await expect
    .element(screen.getByRole("button", { name: VIEW }))
    .toHaveAttribute("data-disabled");
  (undo.element() as HTMLElement).click();
  (screen.getByRole("button", { name: VIEW }).element() as HTMLElement).click();
  expect(onUndo).not.toHaveBeenCalled();
  expect(onViewChanges).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("approve: Approve sits beside Undo in the actions and calls onApprove", async () => {
  const onApprove = vi.fn();
  const onUndo = vi.fn();
  const screen = await render(
    <AgentEditBanner
      {...base}
      onViewChanges={vi.fn()}
      onApprove={onApprove}
      onUndo={onUndo}
      onDismiss={vi.fn()}
    />,
  );
  const actions = slot(screen.container, "actions")!;
  const names = Array.from(actions.querySelectorAll("button")).map((b) =>
    b.getAttribute("aria-label"),
  );
  // View changes, then Approve, then Undo: Approve leads Undo.
  expect(names).toEqual([VIEW, APPROVE, UNDO]);
  const approve = screen.getByRole("button", { name: APPROVE });
  expect(approve.element().textContent).toBe("Approve");
  expect(approve.element().getAttribute("data-variant")).toBe("outline");
  await approve.click();
  expect(onApprove).toHaveBeenCalledTimes(1);
  expect(onUndo).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("approve alone: the actions show with only Approve (no Undo checkpoint)", async () => {
  const screen = await render(
    <AgentEditBanner {...base} onApprove={vi.fn()} onDismiss={vi.fn()} />,
  );
  const actions = slot(screen.container, "actions")!;
  expect(actions.querySelectorAll("button")).toHaveLength(1);
  await expect
    .element(screen.getByRole("button", { name: APPROVE }))
    .toBeInTheDocument();
});

test("approving: Approve spins and every action is disabled; undoing disables Approve", async () => {
  const onApprove = vi.fn();
  const onUndo = vi.fn();
  const onViewChanges = vi.fn();
  const props = {
    ...base,
    onViewChanges,
    onApprove,
    onUndo,
    onDismiss: vi.fn(),
  };
  const screen = await render(
    <AgentEditBanner {...props} status="approving" />,
  );
  const banner = screen.container.querySelector<HTMLElement>(
    "[data-slot=agent-edit-banner]",
  )!;
  expect(banner.dataset.status).toBe("approving");
  const approve = screen.getByRole("button", { name: APPROVE });
  await expect.element(approve).toHaveAttribute("aria-busy", "true");
  for (const name of [APPROVE, UNDO, VIEW])
    await expect
      .element(screen.getByRole("button", { name }))
      .toHaveAttribute("data-disabled");
  for (const name of [APPROVE, UNDO, VIEW])
    (screen.getByRole("button", { name }).element() as HTMLElement).click();
  expect(onApprove).not.toHaveBeenCalled();
  expect(onUndo).not.toHaveBeenCalled();
  expect(onViewChanges).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);

  await screen.rerender(<AgentEditBanner {...props} status="undoing" />);
  await expect
    .element(screen.getByRole("button", { name: UNDO }))
    .toHaveAttribute("aria-busy", "true");
  const approveWhileUndoing = screen.getByRole("button", { name: APPROVE });
  await expect.element(approveWhileUndoing).toHaveAttribute("data-disabled");
  await expect.element(approveWhileUndoing).not.toHaveAttribute("aria-busy");
  (approveWhileUndoing.element() as HTMLElement).click();
  expect(onApprove).not.toHaveBeenCalled();
});

test("refused: the reason line, then View changes and Open versions — no Undo", async () => {
  const onOpenVersions = vi.fn();
  const screen = await render(
    <AgentEditBanner
      {...base}
      status="refused"
      onViewChanges={vi.fn()}
      onUndo={vi.fn()}
      onOpenVersions={onOpenVersions}
      onDismiss={vi.fn()}
    />,
  );
  expect(slot(screen.container, "reason")!.textContent).toBe(
    "Couldn't undo only Claude's changes because people edited the page since.",
  );
  expect(screen.container.querySelector(`[aria-label="${UNDO}"]`)).toBeNull();
  await screen.getByRole("button", { name: "Open versions" }).click();
  expect(onOpenVersions).toHaveBeenCalledTimes(1);
  await expect
    .element(screen.getByRole("button", { name: VIEW }))
    .not.toHaveAttribute("data-disabled");
  await expectNoA11yViolations(screen.container);
});

test("refused for another reason: the host's sentence", async () => {
  const screen = await render(
    <AgentEditBanner
      {...base}
      status="refused"
      refusedReason="Couldn't undo only Claude's changes because the page was restored since."
    />,
  );
  expect(slot(screen.container, "reason")!.textContent).toBe(
    "Couldn't undo only Claude's changes because the page was restored since.",
  );
});

test("too old or read-only: no buttons but the ✕; no ✕ without onDismiss", async () => {
  const screen = await render(
    <div>
      <AgentEditBanner {...base} onDismiss={vi.fn()} />
      <AgentEditBanner {...base} />
    </div>,
  );
  const [withDismiss, bare] = screen.container.querySelectorAll(
    "[data-slot=agent-edit-banner]",
  );
  expect(slot(withDismiss!, "actions")).toBeNull();
  expect(withDismiss!.querySelectorAll("button")).toHaveLength(1);
  expect(slot(withDismiss!, "dismiss")!.getAttribute("aria-label")).toBe(
    "Dismiss",
  );
  expect(bare!.querySelectorAll("button")).toHaveLength(0);
  await expectNoA11yViolations(screen.container);
});

test("created: who created it and when, no count", async () => {
  const screen = await render(
    <AgentEditBanner
      {...base}
      kind="created"
      at={NOW - 5 * MINUTE}
      onDismiss={vi.fn()}
    />,
  );
  expect(slot(screen.container, "summary")!.textContent).toBe(
    "Created by Claude (for Manoj) · 5m ago",
  );
  await expectNoA11yViolations(screen.container);
});

test("more agents: the line ends with +N more agents, a popover with each one's own Approve and Undo", async () => {
  const undoPriya = vi.fn();
  const approvePriya = vi.fn();
  const screen = await render(
    <AgentEditBanner
      {...base}
      onUndo={vi.fn()}
      moreAgents={[
        {
          id: "priya",
          agent: { name: "Codex", via: "Priya" },
          changeCount: 2,
          at: NOW - 10 * MINUTE,
          onUndo: undoPriya,
          onApprove: approvePriya,
        },
        {
          id: "asha",
          agent: { name: "Claude", via: "Asha" },
          changeCount: 1,
          at: NOW - 20 * MINUTE,
          status: "undoing",
          onUndo: vi.fn(),
          onApprove: vi.fn(),
        },
        {
          id: "ravi",
          agent: { name: "Gemini", via: "Ravi" },
          changeCount: 4,
          at: NOW - 30 * MINUTE,
          status: "refused",
          onUndo: vi.fn(),
        },
      ]}
    />,
  );
  expect(slot(screen.container, "summary")!.textContent).toBe(
    "Edited by Claude (for Manoj) · 3 changes · 2m ago · +3 more agents",
  );
  await screen.getByRole("button", { name: "+3 more agents" }).click();
  const items = document.body.querySelectorAll<HTMLElement>(
    "[data-slot=agent-edit-banner-more-item]",
  );
  expect(items).toHaveLength(3);
  expect(items[0]!.textContent).toContain(
    "Edited by Codex (for Priya) · 2 changes · 10m ago",
  );
  await screen
    .getByRole("button", { name: "Undo Codex (for Priya)'s changes" })
    .click();
  expect(undoPriya).toHaveBeenCalledTimes(1);
  await screen
    .getByRole("button", { name: "Approve Codex (for Priya)'s changes" })
    .click();
  expect(approvePriya).toHaveBeenCalledTimes(1);
  // A row's undo in flight holds its Approve too.
  await expect
    .element(
      screen.getByRole("button", {
        name: "Approve Claude (for Asha)'s changes",
      }),
    )
    .toHaveAttribute("data-disabled");
  await expect
    .element(
      screen.getByRole("button", { name: "Undo Claude (for Asha)'s changes" }),
    )
    .toHaveAttribute("aria-busy", "true");
  expect(items[2]!.dataset.status).toBe("refused");
  expect(items[2]!.querySelector("button")).toBeNull();
  expect(items[2]!.textContent).toContain(
    "Couldn't undo only Gemini's changes because people edited the page since.",
  );
  await expectNoA11yViolations(document.body);
});

test("one more agent reads in the singular", async () => {
  const screen = await render(
    <AgentEditBanner
      {...base}
      moreAgents={[
        { id: "p", agent: { name: "Codex", via: "Priya" }, at: NOW - MINUTE },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "+1 more agent" }))
    .toBeInTheDocument();
});

test("every string can be replaced", async () => {
  const screen = await render(
    <AgentEditBanner
      {...base}
      onUndo={vi.fn()}
      onDismiss={vi.fn()}
      labels={{
        edited: (agent) => `Bearbeitet von ${agent}`,
        changes: (n) => `${n} Änderungen`,
        undoName: (agent) => `${agent} rückgängig machen`,
        dismiss: "Schließen",
      }}
    />,
  );
  expect(slot(screen.container, "summary")!.textContent).toBe(
    "Bearbeitet von Claude (for Manoj) · 3 Änderungen · 2m ago",
  );
  await expect
    .element(
      screen.getByRole("button", {
        name: "Claude (for Manoj) rückgängig machen",
      }),
    )
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Schließen" }))
    .toBeInTheDocument();
});

test("narrow, the text wraps and the buttons take their own row; wide, one row", async () => {
  const banner = (
    <AgentEditBanner
      {...base}
      onViewChanges={vi.fn()}
      onUndo={vi.fn()}
      onDismiss={vi.fn()}
    />
  );
  const screen = await render(
    <div>
      <div style={{ width: 375 }}>{banner}</div>
      <div style={{ width: 960 }}>{banner}</div>
    </div>,
  );
  const [narrow, wide] = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=agent-edit-banner]",
  );
  const box = (el: Element | null) => el!.getBoundingClientRect();
  // The Undo label the reader sees: the narrow or the full one.
  const undoLabel = (root: Element) =>
    [...root.querySelectorAll(`[aria-label="${UNDO}"] span`)]
      .filter((span) => getComputedStyle(span).display !== "none")
      .map((span) => span.textContent)
      .join("");

  const nSummary = box(slot(narrow!, "summary"));
  const nActions = box(slot(narrow!, "actions"));
  const nDismiss = box(slot(narrow!, "dismiss"));
  expect(nActions.top).toBeGreaterThanOrEqual(nSummary.bottom);
  // The ✕ stays at the first row's end, beside the text.
  expect(nDismiss.top).toBeLessThan(nSummary.bottom);
  expect(nDismiss.left).toBeGreaterThanOrEqual(nSummary.right);
  // The short Undo label shows in a narrow banner.
  expect(undoLabel(narrow!)).toBe("Undo changes");

  const wSummary = box(slot(wide!, "summary"));
  const wActions = box(slot(wide!, "actions"));
  const wDismiss = box(slot(wide!, "dismiss"));
  expect(wActions.top).toBeLessThan(wSummary.bottom);
  expect(wActions.left).toBeGreaterThanOrEqual(wSummary.right);
  expect(wDismiss.left).toBeGreaterThanOrEqual(wActions.right);
  expect(undoLabel(wide!)).toBe("Undo this agent's changes");

  // A desktop page column (about 27rem) already reads the full label; 24rem is the switch.
  const column = await render(<div style={{ width: 436 }}>{banner}</div>);
  expect(
    undoLabel(column.container.querySelector("[data-slot=agent-edit-banner]")!),
  ).toBe("Undo this agent's changes");
});

test("ref reaches the banner's root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<AgentEditBanner {...base} ref={ref} />);
  expect(ref.current?.dataset.slot).toBe("agent-edit-banner");
});
