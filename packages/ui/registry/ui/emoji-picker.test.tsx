import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { EmojiPicker } from "./emoji-picker";

test("renders the default trigger button", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await expect
    .element(screen.getByRole("button", { name: "Pick an emoji" }))
    .toBeInTheDocument();
});

test("is closed by default — no grid in the DOM", async () => {
  await render(<EmojiPicker onValueChange={() => {}} />);
  expect(document.querySelector('[data-slot="emoji-picker"]')).toBeNull();
});

test("opens the grid on trigger click", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();

  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();
  // The curated dataset renders category headings and emoji buttons.
  await expect
    .element(screen.getByRole("button", { name: "grinning face", exact: true }))
    .toBeInTheDocument();
});

test("searching filters the grid by name and keyword", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  const search = screen.getByRole("searchbox", { name: "Search emoji" });
  await userEvent.type(search, "pizza");

  // The matching emoji stays; an unrelated one is filtered out.
  await expect
    .element(screen.getByRole("button", { name: "pizza" }))
    .toBeInTheDocument();
  await expect
    .poll(() => document.querySelector('[aria-label="grinning face"]'))
    .toBeNull();
});

test("keyword search surfaces emoji whose name does not contain the query", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  // "thumbs up" carries the keyword "approve".
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search emoji" }),
    "approve",
  );
  await expect
    .element(screen.getByRole("button", { name: "thumbs up" }))
    .toBeInTheDocument();
});

test("shows an empty state when nothing matches", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search emoji" }),
    "zzzznope",
  );
  expect(
    document.querySelector('[data-slot="emoji-picker-empty"]')?.textContent,
  ).toBe("No emoji found.");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("No emoji found.");
});

test("announces the result count while filtering", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search emoji" }),
    "pizza",
  );
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("1 emoji result available.");
});

test("selecting an emoji fires onValueChange with the character and closes", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<EmojiPicker onValueChange={onValueChange} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  await screen
    .getByRole("button", { name: "grinning face", exact: true })
    .click();

  expect(onValueChange).toHaveBeenCalledOnce();
  expect(onValueChange).toHaveBeenCalledWith("😀");
  // closeOnSelect defaults to true → the panel leaves the DOM.
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .toBeNull();
});

test("closeOnSelect=false keeps the panel open after a pick", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <EmojiPicker onValueChange={onValueChange} closeOnSelect={false} />,
  );
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  await screen.getByRole("button", { name: "red heart" }).click();
  expect(onValueChange).toHaveBeenCalledWith("❤️");
  // Still open.
  expect(document.querySelector('[data-slot="emoji-picker"]')).not.toBeNull();
});

test("accepts a custom trigger", async () => {
  const screen = await render(
    <EmojiPicker
      onValueChange={() => {}}
      trigger={<button type="button">Add reaction</button>}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Add reaction" }))
    .toBeInTheDocument();
});

test("no a11y violations when open", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();
  // The panel portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("roving tabindex: only one emoji button is Tab-reachable at a time", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  const first = screen.getByRole("button", { name: "grinning face", exact: true });
  const second = screen.getByRole("button", { name: "grinning face with big eyes" });
  await expect.element(first).toHaveAttribute("tabindex", "0");
  await expect.element(second).toHaveAttribute("tabindex", "-1");
});

test("ArrowRight moves the roving tabindex (and focus) to the next emoji", async () => {
  const screen = await render(<EmojiPicker onValueChange={() => {}} />);
  await screen.getByRole("button", { name: "Pick an emoji" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="emoji-picker"]'))
    .not.toBeNull();

  const first = screen.getByRole("button", { name: "grinning face", exact: true });
  const second = screen.getByRole("button", { name: "grinning face with big eyes" });
  first.element().focus();
  await userEvent.keyboard("{ArrowRight}");

  await expect.element(second).toHaveFocus();
  await expect.element(second).toHaveAttribute("tabindex", "0");
  await expect.element(first).toHaveAttribute("tabindex", "-1");
});

test("forwards ref to the trigger button", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(<EmojiPicker ref={ref} onValueChange={() => {}} />);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
});
