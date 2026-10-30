import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  OptionListEditor,
  type OptionListEditorOption,
} from "./option-list-editor";

const OPTIONS: OptionListEditorOption[] = [
  { id: "a", label: "Open", hue: "green" },
  { id: "b", label: "Closed" },
];

function Host(props: {
  onChange?: (next: OptionListEditorOption[]) => void;
  onCommit?: (next: OptionListEditorOption[]) => void;
  inMenu?: boolean;
}) {
  const [options, setOptions] = React.useState(OPTIONS);
  return (
    <div onKeyDown={() => props.onChange && void 0}>
      <OptionListEditor
        options={options}
        inMenu={props.inMenu}
        createId={() => "new"}
        onChange={(next) => {
          setOptions(next);
          props.onChange?.(next);
        }}
        onCommit={(next) => props.onCommit?.(next)}
      />
    </div>
  );
}

test("renders a hue, a name and a remove control per option, and an add button", async () => {
  const screen = await render(<Host />);
  await expect
    .element(screen.getByRole("textbox", { name: "Option 1" }))
    .toHaveValue("Open");
  await expect
    .element(screen.getByRole("button", { name: "Colour of Open" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Remove Closed" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Add option" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("onChange follows every keystroke; onCommit waits for blur or Enter", async () => {
  const onChange = vi.fn();
  const onCommit = vi.fn();
  const screen = await render(<Host onChange={onChange} onCommit={onCommit} />);
  const name = screen.getByRole("textbox", { name: "Option 2" });
  await name.click();
  await userEvent.keyboard("!?");
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange).toHaveBeenLastCalledWith([
    OPTIONS[0],
    { id: "b", label: "Closed!?" },
  ]);
  expect(onCommit).not.toHaveBeenCalled();
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledTimes(1);
  expect(onCommit).toHaveBeenLastCalledWith([
    OPTIONS[0],
    { id: "b", label: "Closed!?" },
  ]);
  await screen.getByRole("textbox", { name: "Option 1" }).click();
  expect(onCommit).toHaveBeenCalledTimes(2);
});

test("picking a hue and removing an option commit at once; adding one does not", async () => {
  const onCommit = vi.fn();
  const screen = await render(<Host onCommit={onCommit} />);
  await screen.getByRole("button", { name: "Colour of Closed" }).click();
  await screen.getByRole("button", { name: "Red" }).click();
  expect(onCommit).toHaveBeenLastCalledWith([
    OPTIONS[0],
    { id: "b", label: "Closed", hue: "red" },
  ]);
  await screen.getByRole("button", { name: "Remove Open" }).click();
  expect(onCommit).toHaveBeenLastCalledWith([
    { id: "b", label: "Closed", hue: "red" },
  ]);
  const commits = onCommit.mock.calls.length;
  await screen.getByRole("button", { name: "Add option" }).click();
  expect(onCommit).toHaveBeenCalledTimes(commits);
  await expect
    .element(screen.getByRole("textbox", { name: "Option 2" }))
    .toHaveValue("");
});

test("inMenu keeps typing keys from reaching a menu around the editor", async () => {
  const outer = vi.fn();
  const screen = await render(
    <div onKeyDown={outer}>
      <Host inMenu />
    </div>,
  );
  await screen.getByRole("textbox", { name: "Option 1" }).click();
  await userEvent.keyboard("x{ArrowDown}");
  expect(outer).not.toHaveBeenCalled();
  await userEvent.keyboard("{Escape}");
  expect(outer).toHaveBeenCalledTimes(1);
});
