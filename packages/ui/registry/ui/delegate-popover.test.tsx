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
  await page.getByRole("button", { name: "Connect an agent" }).click();
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
