import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { InfoHint } from "./info-hint";

test("an icon-only ghost trigger named by label, closed by default", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  const screen = await render(
    <InfoHint ref={ref} label="About spaces">
      A space groups the people and records that work together.
    </InfoHint>,
  );
  const trigger = screen.getByRole("button", { name: "About spaces" });
  await expect.element(trigger).toHaveAttribute("data-slot", "info-hint");
  await expect.element(trigger).toHaveAttribute("data-variant", "ghost");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await expect.element(trigger).toHaveAttribute("type", "button");
  expect(ref.current).toBe(trigger.element());
  expect(document.querySelector('[data-slot="info-hint-content"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("click opens the sentence; Escape closes it and returns focus", async () => {
  const screen = await render(
    <InfoHint label="About spaces">
      A space groups the people and records that work together.
    </InfoHint>,
  );
  const trigger = screen.getByRole("button", { name: "About spaces" });
  await userEvent.click(trigger);
  await expect
    .element(screen.getByText(/A space groups the people/))
    .toBeVisible();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  expect(document.querySelector('[data-slot="info-hint-link"]')).toBeNull();
  await expectNoA11yViolations(document.body);
  await userEvent.keyboard("{Escape}");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(document.activeElement).toBe(trigger.element());
});

test("keyboard: Enter opens it; the link opens in a new tab and says so", async () => {
  const screen = await render(
    <InfoHint
      label="About publishing"
      href="https://help.example.com/publish"
      linkLabel="Read the guide"
    >
      Published pages can be opened by anyone with the link.
    </InfoHint>,
  );
  const trigger = screen.getByRole("button", { name: "About publishing" });
  (trigger.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  const link = screen.getByRole("link", {
    name: "Read the guide (opens in a new tab)",
  });
  await expect.element(link).toHaveAttribute("target", "_blank");
  await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect
    .element(link)
    .toHaveAttribute("href", "https://help.example.com/publish");
  await expectNoA11yViolations(document.body);
});

test("the default link label is Learn more", async () => {
  const screen = await render(
    <InfoHint label="About roles" href="https://help.example.com/roles">
      Roles decide what members can change.
    </InfoHint>,
  );
  await userEvent.click(screen.getByRole("button", { name: "About roles" }));
  await expect
    .element(
      screen.getByRole("link", { name: "Learn more (opens in a new tab)" }),
    )
    .toBeInTheDocument();
});

test("inside a Dialog, initialFocus keeps focus off the hint in the title", async () => {
  function Example() {
    const nameRef = React.useRef<HTMLInputElement>(null);
    return (
      <Dialog open>
        <DialogContent initialFocus={nameRef}>
          <DialogTitle className="flex items-center gap-1">
            New space
            <InfoHint label="About spaces">
              A space groups the people and records that work together.
            </InfoHint>
          </DialogTitle>
          <input ref={nameRef} aria-label="Name" />
        </DialogContent>
      </Dialog>
    );
  }
  const screen = await render(<Example />);
  await expect
    .poll(() => document.activeElement)
    .toBe(screen.getByRole("textbox", { name: "Name" }).element());
  await expect
    .element(screen.getByRole("button", { name: "About spaces" }))
    .toHaveAttribute("aria-expanded", "false");
});

test("hover opens the sentence without taking focus, like a tooltip", async () => {
  const screen = await render(
    <InfoHint label="About runners">The script runner is down.</InfoHint>,
  );
  const trigger = screen.getByRole("button", { name: "About runners" });
  await userEvent.hover(trigger);
  await expect
    .element(screen.getByText("The script runner is down."))
    .toBeVisible();
  expect(document.activeElement).not.toBe(trigger.element());
  await userEvent.unhover(trigger);
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
});

test("keyboard focus opens it and keeps focus on the trigger; Enter keeps it open; Tab away closes it", async () => {
  const screen = await render(
    <>
      <button type="button">Before</button>
      <InfoHint label="About runners">The script runner is down.</InfoHint>
      <button type="button">After</button>
    </>,
  );
  (
    screen.getByRole("button", { name: "Before" }).element() as HTMLElement
  ).focus();
  await userEvent.tab();
  const trigger = screen.getByRole("button", { name: "About runners" });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await expect
    .element(screen.getByText("The script runner is down."))
    .toBeVisible();
  expect(document.activeElement).toBe(trigger.element());
  await userEvent.keyboard("{Enter}");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  (
    screen.getByRole("button", { name: "After" }).element() as HTMLElement
  ).focus();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
});

test("Tab from a focus-opened hint reaches its link; Tab past the link closes it", async () => {
  const screen = await render(
    <>
      <button type="button">Before</button>
      <InfoHint label="About runners" href="https://help.example.com/runners">
        The script runner is down.
      </InfoHint>
      <button type="button">After</button>
    </>,
  );
  (
    screen.getByRole("button", { name: "Before" }).element() as HTMLElement
  ).focus();
  await userEvent.tab();
  const trigger = screen.getByRole("button", { name: "About runners" });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await userEvent.tab();
  const link = screen.getByRole("link", {
    name: "Learn more (opens in a new tab)",
  });
  await expect.poll(() => document.activeElement).toBe(link.element());
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await userEvent.tab();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
});

test("a press or the pointer leaving keeps a focus-opened hint open", async () => {
  const screen = await render(
    <>
      <button type="button">Before</button>
      <InfoHint label="About runners">The script runner is down.</InfoHint>
    </>,
  );
  (
    screen.getByRole("button", { name: "Before" }).element() as HTMLElement
  ).focus();
  await userEvent.tab();
  const trigger = screen.getByRole("button", { name: "About runners" });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await userEvent.hover(trigger);
  await userEvent.unhover(trigger);
  await new Promise((resolve) => setTimeout(resolve, 400));
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await userEvent.keyboard("{Enter}");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
});
