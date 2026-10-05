import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { InlineChip, InlineChipProvider } from "./inline-chip";
import { MarkdownView } from "./markdown-view";

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
