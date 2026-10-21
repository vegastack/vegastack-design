import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  INLINE_CHIP_KINDS,
  InlineChip,
  InlineChipProvider,
} from "./inline-chip";
import { MarkdownView } from "./markdown-view";
import { TextEdit } from "./text-edit";

test("the label sits on the surrounding text's baseline", async () => {
  const screen = await render(
    <p style={{ fontSize: 16, lineHeight: "24px" }}>
      <span data-testid="before">Before</span>{" "}
      <InlineChip kind="task" label="Ship" data-testid="chip" />
    </p>,
  );
  const before = screen.getByTestId("before").element().getBoundingClientRect();
  const chip = screen.getByTestId("chip").element().getBoundingClientRect();
  // Same font, same baseline: an inline box's content area is centred on the same line as the
  // text beside it, padding or not. (An inline-flex chip led by an icon sat ~4px higher.)
  const centre = (r: DOMRect) => r.top + r.height / 2;
  expect(Math.abs(centre(chip) - centre(before))).toBeLessThanOrEqual(0.5);
});

test("a linked chip is an anchor; onOpen takes a plain click and Enter, not a ⌘-click", async () => {
  const onOpen = vi.fn(() => undefined);
  const screen = await render(
    <InlineChip
      kind="page"
      targetId="p1"
      label="Q3 plan"
      href="#p1"
      onOpen={onOpen}
    />,
  );
  const link = screen.getByRole("link", { name: "Q3 plan" });
  await expect.element(link).toHaveAttribute("href", "#p1");
  await link.click();
  expect(onOpen).toHaveBeenCalledWith(
    { kind: "page", id: "p1", label: "Q3 plan", href: "#p1" },
    expect.anything(),
  );
  await link.click({ modifiers: ["ControlOrMeta"] });
  expect(onOpen).toHaveBeenCalledTimes(1);
});

test("a linked chip passes its keys to the caller's onKeyDown", async () => {
  const onKeyDown = vi.fn();
  const screen = await render(
    <InlineChip kind="page" label="Q3 plan" href="#p1" onKeyDown={onKeyDown} />,
  );
  const link = screen.getByRole("link", { name: "Q3 plan" });
  (link.element() as HTMLElement).focus();
  await userEvent.keyboard("x");
  expect(onKeyDown).toHaveBeenCalledTimes(1);
});

test("an unlinked chip with onOpen is a keyboard button", async () => {
  const onOpen = vi.fn(() => undefined);
  const screen = await render(
    <InlineChip kind="file" label="spec.pdf" onOpen={onOpen} />,
  );
  const button = screen.getByRole("button", { name: "spec.pdf" });
  (button.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  expect(onOpen).toHaveBeenCalledTimes(1);
});

test("a restricted chip is muted and never links", async () => {
  const screen = await render(
    <InlineChip
      kind="page"
      targetId="restricted:p9"
      label="Private"
      href="#p9"
    />,
  );
  const chip = screen.container.querySelector("[data-slot=inline-chip]");
  expect(chip).toHaveAttribute("data-restricted", "");
  expect(screen.container.querySelector("a")).toBeNull();
});

test("the provider resolves a person; focus opens the card with the email", async () => {
  const screen = await render(
    <InlineChipProvider
      value={{
        person: (id) =>
          id === "u1" ? { name: "Asha Rao", email: "asha@acme.com" } : null,
      }}
    >
      <InlineChip kind="user" targetId="u1" label="Asha Rao" />
    </InlineChipProvider>,
  );
  await userEvent.tab();
  await expect.element(screen.getByText("asha@acme.com")).toBeVisible();
});

test("a person chip's avatar never breaks its initials (a mention in a narrow comment)", async () => {
  const screen = await render(
    <InlineChipProvider value={{ person: () => ({ name: "Priya Raman" }) }}>
      <InlineChip kind="user" targetId="u1" label="Priya Raman" />
    </InlineChipProvider>,
  );
  // This harness compiles no CSS: pin the recipe. `whitespace-nowrap` keeps "PR" on one line
  // inside an `overflow-wrap: anywhere` comment body; `shrink-0` keeps the circle round.
  const avatar = screen.container.querySelector(
    '[data-slot="inline-chip-avatar"]',
  );
  expect(avatar).toHaveClass("whitespace-nowrap", "shrink-0");
});

test("MarkdownView renders mentions of every kind and file links as chips", async () => {
  const screen = await render(
    <MarkdownView
      content={
        "[@A](mention://user/u1) [@M](mention://meeting/m1) [@C](mention://customer/c1) [@P](mention://project/p1) [f.pdf](/api/files/f1)"
      }
    />,
  );
  const kinds = [
    ...screen.container.querySelectorAll("[data-slot=inline-chip]"),
  ].map((el) => el.getAttribute("data-kind"));
  expect(kinds).toEqual(["user", "meeting", "customer", "project", "file"]);
});

test("has no accessibility violations", async () => {
  const screen = await render(
    <p>
      <InlineChip kind="task" label="Ship" href="#t" />{" "}
      <InlineChip kind="user" label="Asha" person={{ name: "Asha" }} />
    </p>,
  );
  await expectNoA11yViolations(screen.container);
});

test("a person is the one coloured chip; every other kind is the neutral page chip with its own icon", async () => {
  const screen = await render(
    <p>
      <InlineChip kind="user" label="Asha" data-testid="user" />
      {INLINE_CHIP_KINDS.filter((kind) => kind !== "user").map((kind) => (
        <InlineChip key={kind} kind={kind} label={kind} data-testid={kind} />
      ))}
    </p>,
  );
  const tone = (id: string) =>
    screen.getByTestId(id).element().getAttribute("class") ?? "";
  expect(tone("user")).toContain("bg-tag-blue-subtle");
  const icons = new Set<string>();
  for (const kind of INLINE_CHIP_KINDS.filter((k) => k !== "user")) {
    expect(tone(kind)).toContain("bg-muted");
    expect(tone(kind)).not.toMatch(/bg-tag-/);
    if (kind !== "file")
      icons.add(
        screen
          .getByTestId(kind)
          .element()
          .querySelector("svg")!
          .getAttribute("class")!,
      );
  }
  // Told apart by the icon alone (a file's follows its type).
  expect(icons.size).toBe(INLINE_CHIP_KINDS.length - 2);
  expect(
    screen
      .getByTestId("agent")
      .element()
      .querySelector("svg")!
      .getAttribute("class"),
  ).toContain("lucide-bot");
  expect(
    screen
      .getByTestId("family")
      .element()
      .querySelector("svg")!
      .getAttribute("class"),
  ).toContain("lucide-layers");
  await expectNoA11yViolations(screen.container);
});

test("a task chip shows the task glyph until done; done swaps in the check", async () => {
  const screen = await render(
    <p>
      <InlineChip kind="task" label="Open task" data-testid="open" />{" "}
      <InlineChip kind="task" label="Done task" done data-testid="done" />
    </p>,
  );
  const icon = (id: string) =>
    screen
      .getByTestId(id)
      .element()
      .querySelector("[data-slot=inline-chip-icon]")!;
  expect(icon("open").getAttribute("class")).toContain("lucide-list-todo");
  expect(screen.getByTestId("open").element()).not.toHaveAttribute("data-done");
  expect(icon("done").getAttribute("class")).toContain("lucide-circle-check");
  expect(screen.getByTestId("done").element()).toHaveAttribute("data-done", "");
  expect(icon("done")).toHaveAttribute("aria-label", "Done");
  expect(icon("open")).toHaveAttribute("aria-hidden", "true");
});

test("a key typed anywhere closes a chip's card, so it never covers what is being typed", async () => {
  const screen = await render(
    <p>
      <InlineChip
        kind="user"
        label="Asha Rao"
        person={{ name: "Asha Rao", email: "asha@acme.com" }}
        data-testid="chip"
      />
      <input aria-label="Reply" />
    </p>,
  );
  await userEvent.hover(screen.getByTestId("chip"));
  const card = () => document.querySelector('[data-slot="hover-card-content"]');
  await vi.waitFor(() => expect(card()).not.toBeNull());
  // Typing into a box the card would cover closes it.
  screen.getByRole("textbox", { name: "Reply" }).element().focus();
  await userEvent.keyboard("h");
  await vi.waitFor(() => expect(card()).toBeNull());
});

test("the provider's state shows on every surface — a bare chip, a rendered body, an editor; a surface's own state wins", async () => {
  const state = (kind: string, id: string) =>
    kind !== "task"
      ? null
      : id === "t-done"
        ? { done: true }
        : id === "t-cancel"
          ? { struck: true, status: "Canceled" }
          : null;
  const body =
    "[@Ship](mention://task/t-done) [@Old](mention://task/t-cancel) [@Open](mention://task/t-open)";
  const screen = await render(
    <InlineChipProvider value={{ state }}>
      <div data-testid="bare">
        <InlineChip kind="task" targetId="t-done" label="Ship" />
        <InlineChip kind="task" targetId="t-cancel" label="Old" />
        <InlineChip
          kind="task"
          targetId="t-cancel"
          label="Own"
          struck={false}
        />
      </div>
      <div data-testid="view">
        <MarkdownView>{body}</MarkdownView>
      </div>
      <div data-testid="edit">
        <TextEdit format="markdown" aria-label="Notes" defaultValue={body} />
      </div>
    </InlineChipProvider>,
  );
  const chips = (id: string) =>
    [
      ...screen
        .getByTestId(id)
        .element()
        .querySelectorAll<HTMLElement>("[data-slot=inline-chip]"),
    ].map((chip) => [
      chip.hasAttribute("data-done"),
      chip.hasAttribute("data-struck"),
    ]);
  expect(chips("bare")).toEqual([
    [true, false],
    [false, true],
    [false, false],
  ]);
  expect(chips("view")).toEqual([
    [true, false],
    [false, true],
    [false, false],
  ]);
  await vi.waitFor(() =>
    expect(chips("edit")).toEqual([
      [true, false],
      [false, true],
      [false, false],
    ]),
  );
  expect(screen.getByTestId("view").element().textContent).toContain(
    "Canceled",
  );
});
