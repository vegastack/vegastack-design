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

const UNDO = "Undo Claude (via Manoj)'s changes";
const VIEW = "View Claude (via Manoj)'s changes";

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
    "Edited by Claude (via Manoj) · 3 changes · 2m ago",
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
    "Edited by Claude (via Manoj) · 1 change · 2m ago",
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
    "Created by Claude (via Manoj) · 5m ago",
  );
  await expectNoA11yViolations(screen.container);
});

test("more agents: the line ends with +N more agents, a popover with each one's own Undo", async () => {
  const undoPriya = vi.fn();
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
        },
        {
          id: "asha",
          agent: { name: "Claude", via: "Asha" },
          changeCount: 1,
          at: NOW - 20 * MINUTE,
          status: "undoing",
          onUndo: vi.fn(),
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
    "Edited by Claude (via Manoj) · 3 changes · 2m ago · +3 more agents",
  );
  await screen.getByRole("button", { name: "+3 more agents" }).click();
  const items = document.body.querySelectorAll<HTMLElement>(
    "[data-slot=agent-edit-banner-more-item]",
  );
  expect(items).toHaveLength(3);
  expect(items[0]!.textContent).toContain(
    "Edited by Codex (via Priya) · 2 changes · 10m ago",
  );
  await screen
    .getByRole("button", { name: "Undo Codex (via Priya)'s changes" })
    .click();
  expect(undoPriya).toHaveBeenCalledTimes(1);
  await expect
    .element(
      screen.getByRole("button", { name: "Undo Claude (via Asha)'s changes" }),
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
    "Bearbeitet von Claude (via Manoj) · 3 Änderungen · 2m ago",
  );
  await expect
    .element(
      screen.getByRole("button", {
        name: "Claude (via Manoj) rückgängig machen",
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
});

test("ref reaches the banner's root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<AgentEditBanner {...base} ref={ref} />);
  expect(ref.current?.dataset.slot).toBe("agent-edit-banner");
});
