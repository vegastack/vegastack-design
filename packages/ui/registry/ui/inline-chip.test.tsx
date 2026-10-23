import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Building2, Layers, ListTodo } from "lucide-react";
import {
  InlineChip,
  InlineChipProvider,
  type InlineChipResolver,
} from "./inline-chip";
import { MarkdownView } from "./markdown-view";
import { TextEdit } from "./text-edit";

/** The record kinds a host names (`InlineChipResolver.kinds`). */
const HOST_KINDS: InlineChipResolver["kinds"] = {
  task: { icon: <ListTodo />, noun: "Task" },
  customer: { icon: <Building2 />, noun: "Customer" },
  family: { icon: <Layers />, noun: "Family" },
};

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
  const others = ["agent", "file", "task", "customer", "family", "subfamily"];
  const screen = await render(
    <InlineChipProvider value={{ kinds: HOST_KINDS }}>
      <p>
        <InlineChip kind="user" label="Asha" data-testid="user" />
        {others.map((kind) => (
          <InlineChip key={kind} kind={kind} label={kind} data-testid={kind} />
        ))}
      </p>
    </InlineChipProvider>,
  );
  const tone = (id: string) =>
    screen.getByTestId(id).element().getAttribute("class") ?? "";
  const glyph = (id: string) =>
    screen
      .getByTestId(id)
      .element()
      .querySelector("[data-slot=inline-chip-icon]")!
      .getAttribute("class")!;
  expect(tone("user")).toContain("bg-tag-blue-subtle");
  for (const kind of others) {
    expect(tone(kind)).toContain("bg-muted");
    expect(tone(kind)).not.toMatch(/bg-tag-/);
  }
  // Built-ins draw their own glyph, a host kind the host's, an unnamed kind a link.
  expect(glyph("agent")).toContain("lucide-bot");
  expect(glyph("task")).toContain("lucide-list-todo");
  expect(glyph("customer")).toContain("lucide-building-2");
  expect(glyph("family")).toContain("lucide-layers");
  expect(glyph("subfamily")).toContain("lucide-link-2");
  // The host's glyph is set like a built-in one: 1em, nudged to the baseline, decorative.
  expect(glyph("family")).toContain("size-[1em]");
  expect(
    screen
      .getByTestId("family")
      .element()
      .querySelector("[data-slot=inline-chip-icon]"),
  ).toHaveAttribute("aria-hidden", "true");
  await expectNoA11yViolations(screen.container);
});

test("the hover card names the kind with the host's noun, else Item", async () => {
  const screen = await render(
    <InlineChipProvider value={{ kinds: HOST_KINDS, preview: () => "Linear" }}>
      <p>
        <InlineChip kind="family" label="Linear" data-testid="family" />{" "}
        <InlineChip kind="subfamily" label="Linear 2" data-testid="sub" />
      </p>
    </InlineChipProvider>,
  );
  await userEvent.hover(screen.getByTestId("family"));
  await vi.waitFor(() =>
    expect(
      document.querySelector("[data-inline-chip-card]")?.textContent,
    ).toContain("Family"),
  );
  await userEvent.unhover(screen.getByTestId("family"));
  await vi.waitFor(() =>
    expect(document.querySelector("[data-inline-chip-card]")).toBeNull(),
  );
  await userEvent.hover(screen.getByTestId("sub"));
  await vi.waitFor(() =>
    expect(
      document.querySelector("[data-inline-chip-card]")?.textContent,
    ).toContain("Item"),
  );
});

test("a task chip shows the task glyph until done; done swaps in the check", async () => {
  const screen = await render(
    <InlineChipProvider value={{ kinds: HOST_KINDS }}>
      <p>
        <InlineChip kind="task" label="Open task" data-testid="open" />{" "}
        <InlineChip kind="task" label="Done task" done data-testid="done" />
      </p>
    </InlineChipProvider>,
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
      <div data-testid="own">
        <MarkdownView mentionStatus={(_, id) => (id === "t-done" ? {} : null)}>
          {body}
        </MarkdownView>
      </div>
      <div data-testid="restricted">
        <InlineChip kind="task" targetId="restricted:t-done" label="Hidden" />
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
  // A surface's own answer wins (`{}`: plain); `null` leaves the chip to the provider.
  expect(chips("own")).toEqual([
    [false, false],
    [false, true],
    [false, false],
  ]);
  // A restricted target shows no state.
  expect(chips("restricted")).toEqual([[false, false]]);
});
