import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { useRecordPeekRow } from "./use-record-peek-row";

function Row({ id, active }: { id: string; active: string | null }) {
  const peek = useRecordPeekRow<HTMLLIElement>(id, active);
  return (
    <li {...peek} data-testid={id} style={{ height: 200 }}>
      {id}
    </li>
  );
}

function List({ active }: { active: string | null }) {
  return (
    <ul data-testid="list" style={{ height: 200, overflow: "auto" }}>
      {["a", "b", "c", "d"].map((id) => (
        <Row key={id} id={id} active={active} />
      ))}
    </ul>
  );
}

test("marks only the open row with data-peek-active", async () => {
  const screen = await render(<List active="b" />);
  expect(
    screen.getByTestId("b").element().getAttribute("data-peek-active"),
  ).toBe("");
  expect(
    screen.getByTestId("a").element().hasAttribute("data-peek-active"),
  ).toBe(false);
});

test("scrolls the open row into view when it becomes the open one", async () => {
  const screen = await render(<List active={null} />);
  const list = screen.getByTestId("list").element() as HTMLElement;
  expect(list.scrollTop).toBe(0);
  await screen.rerender(<List active="d" />);
  await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
});
