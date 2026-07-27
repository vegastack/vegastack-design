import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ChipInput } from "./chip-input";

function chipTexts(): string[] {
  // Visible chip text only — invalid chips carry an sr-only ", invalid entry"
  // suffix inside the label span.
  return Array.from(document.querySelectorAll('[data-slot="tag"]')).map((el) =>
    Array.from(el.querySelector("span")?.childNodes ?? [])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent)
      .join(""),
  );
}

test("Enter commits the draft as a chip", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ChipInput aria-label="Tags" onValueChange={onValueChange} />,
  );
  const input = screen.getByRole("textbox", { name: "Tags" });
  await input.fill("alpha");
  await userEvent.keyboard("{Enter}");
  expect(onValueChange).toHaveBeenLastCalledWith(["alpha"]);
  expect(chipTexts()).toEqual(["alpha"]);
  await expect.element(input).toHaveValue("");
});

test("comma commits like Enter", async () => {
  const screen = await render(<ChipInput aria-label="Tags" />);
  const input = screen.getByRole("textbox", { name: "Tags" });
  await input.fill("beta");
  await userEvent.keyboard(",");
  expect(chipTexts()).toEqual(["beta"]);
});

test("blur commits the pending draft", async () => {
  const screen = await render(<ChipInput aria-label="Tags" />);
  const input = screen.getByRole("textbox", { name: "Tags" });
  await input.fill("gamma");
  (input.element() as HTMLInputElement).blur();
  await expect.poll(() => chipTexts()).toEqual(["gamma"]);
});

test("paste splits on the delimiter set", async () => {
  const screen = await render(<ChipInput aria-label="Recipients" />);
  const input = screen.getByRole("textbox", { name: "Recipients" });
  (input.element() as HTMLInputElement).focus();
  const dt = new DataTransfer();
  dt.setData("text", "a@x.com, b@x.com\nc@x.com");
  input.element().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
    }),
  );
  await expect
    .poll(() => chipTexts())
    .toEqual(["a@x.com", "b@x.com", "c@x.com"]);
});

test("Backspace in the empty input removes the last chip", async () => {
  const screen = await render(
    <ChipInput aria-label="Tags" defaultValue={["one", "two"]} />,
  );
  const input = screen.getByRole("textbox", { name: "Tags" });
  (input.element() as HTMLInputElement).focus();
  await userEvent.keyboard("{Backspace}");
  expect(chipTexts()).toEqual(["one"]);
});

test("each chip's remove button removes exactly that chip", async () => {
  const screen = await render(
    <ChipInput aria-label="Tags" defaultValue={["one", "two", "three"]} />,
  );
  await screen.getByRole("button", { name: "Remove two" }).click();
  expect(chipTexts()).toEqual(["one", "three"]);
});

test("duplicates are rejected and announced; the field keeps the draft", async () => {
  const screen = await render(
    <ChipInput aria-label="Tags" defaultValue={["alpha"]} />,
  );
  const input = screen.getByRole("textbox", { name: "Tags" });
  await input.fill("alpha");
  await userEvent.keyboard("{Enter}");
  expect(chipTexts()).toEqual(["alpha"]);
  const status = document.querySelector('[role="status"]') as HTMLElement;
  expect(status.textContent).toContain("duplicate");
});

test("invalid entries are ADDED and marked data-invalid, and flip the field invalid", async () => {
  const screen = await render(
    <ChipInput
      aria-label="Recipients"
      validate={(chip) => chip.includes("@")}
    />,
  );
  const input = screen.getByRole("textbox", { name: "Recipients" });
  await input.fill("not-an-email");
  await userEvent.keyboard("{Enter}");
  expect(chipTexts()).toEqual(["not-an-email"]);
  const tag = document.querySelector('[data-slot="tag"]') as HTMLElement;
  expect(tag.hasAttribute("data-invalid")).toBe(true);
  const root = document.querySelector(
    '[data-slot="chip-input"]',
  ) as HTMLElement;
  expect(root.hasAttribute("data-invalid")).toBe(true);
  // Removing the invalid chip clears the field-level invalid state.
  await screen.getByRole("button", { name: "Remove not-an-email" }).click();
  expect(root.hasAttribute("data-invalid")).toBe(false);
});

test("normalize runs before duplicate checking", async () => {
  const screen = await render(
    <ChipInput
      aria-label="Tags"
      defaultValue={["alpha"]}
      normalize={(raw) => raw.trim().toLowerCase()}
    />,
  );
  const input = screen.getByRole("textbox", { name: "Tags" });
  await input.fill("  ALPHA  ");
  await userEvent.keyboard("{Enter}");
  expect(chipTexts()).toEqual(["alpha"]);
});

test("controlled value round-trips through onValueChange", async () => {
  function Controlled() {
    const [value, setValue] = React.useState<string[]>(["seed"]);
    return (
      <ChipInput aria-label="Tags" value={value} onValueChange={setValue} />
    );
  }
  const screen = await render(<Controlled />);
  const input = screen.getByRole("textbox", { name: "Tags" });
  await input.fill("next");
  await userEvent.keyboard("{Enter}");
  expect(chipTexts()).toEqual(["seed", "next"]);
});

test("disabled blocks input and removes the remove affordances", async () => {
  const screen = await render(
    <ChipInput aria-label="Tags" defaultValue={["one"]} disabled />,
  );
  const input = screen
    .getByRole("textbox", { name: "Tags" })
    .element() as HTMLInputElement;
  expect(input.disabled).toBe(true);
  expect(document.querySelector('[data-slot="tag"] button')).toBeNull();
  const root = document.querySelector(
    '[data-slot="chip-input"]',
  ) as HTMLElement;
  expect(root.hasAttribute("data-disabled")).toBe(true);
});

test("ref forwards to the group root; inputRef to the inner input", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  await render(<ChipInput aria-label="Tags" ref={ref} inputRef={inputRef} />);
  expect(ref.current?.dataset.slot).toBe("chip-input");
  expect(inputRef.current?.dataset.slot).toBe("input");
});

test("focus: the group carries the focus-within border tint (text-entry affordance)", async () => {
  const screen = await render(<ChipInput aria-label="Tags" />);
  const root = document.querySelector(
    '[data-slot="chip-input"]',
  ) as HTMLElement;
  expect(root.className).toContain("focus-within:border-ring");
  const input = screen
    .getByRole("textbox", { name: "Tags" })
    .element() as HTMLInputElement;
  input.focus();
  expect(document.activeElement).toBe(input);
});

test("no a11y violations — empty, chips, invalid chip, disabled", async () => {
  const screen = await render(
    <div>
      <ChipInput aria-label="Empty" />
      <ChipInput aria-label="Filled" defaultValue={["one", "two"]} />
      <ChipInput
        aria-label="Invalid"
        defaultValue={["bad"]}
        validate={() => false}
      />
      <ChipInput aria-label="Disabled" defaultValue={["one"]} disabled />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("keyboard-only: removing a chip via its button returns focus to the field's input", async () => {
  const screen = await render(
    <ChipInput aria-label="Tags" defaultValue={["one", "two"]} />,
  );
  const remove = screen
    .getByRole("button", { name: "Remove one" })
    .element() as HTMLElement;
  remove.focus();
  await userEvent.keyboard("{Enter}");
  expect(chipTexts()).toEqual(["two"]);
  // Focus must not fall to <body> when the focused button unmounts.
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.dataset.slot)
    .toBe("input");
});

test("a second identical duplicate rejection still announces (sequence-keyed live region)", async () => {
  const screen = await render(
    <ChipInput aria-label="Tags" defaultValue={["alpha"]} />,
  );
  const input = screen.getByRole("textbox", { name: "Tags" });
  await input.fill("alpha");
  await userEvent.keyboard("{Enter}");
  const region = document.querySelector('[role="status"]')!;
  const first = region.querySelector("span");
  await input.fill("alpha");
  await userEvent.keyboard("{Enter}");
  // The keyed span remounted — the DOM mutated, so AT re-announces.
  await expect.poll(() => region.querySelector("span") !== first).toBe(true);
  expect(region.textContent).toContain("duplicate");
});
