import * as React from "react";
import { renderHook } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import {
  useGridSelection,
  type UseGridSelectionOptions,
} from "./use-grid-selection";

const ROWS = ["r1", "r2", "r3", "r4"];
const COLS = ["name", "qty", "due"];

async function setup(options: Partial<UseGridSelectionOptions> = {}) {
  return renderHook((props?: Partial<UseGridSelectionOptions>) =>
    useGridSelection({ rowIds: ROWS, colKeys: COLS, ...options, ...props }),
  );
}

test("select collapses to one cell; extend grows from the anchor by ids", async () => {
  const { result, act } = await setup();
  await act(() => result.current.select({ rowId: "r2", colKey: "qty" }));
  expect(result.current.bounds).toEqual({
    top: 1,
    bottom: 1,
    left: 1,
    right: 1,
    rows: 1,
    columns: 1,
  });
  await act(() => void result.current.extend("down"));
  await act(() => void result.current.extend("right"));
  expect(result.current.anchor).toEqual({ rowId: "r2", colKey: "qty" });
  expect(result.current.focus).toEqual({ rowId: "r3", colKey: "due" });
  expect(result.current.bounds).toMatchObject({ rows: 2, columns: 2 });
  expect(result.current.isSelected("r3", "due")).toBe(true);
  expect(result.current.isSelected("r1", "qty")).toBe(false);
  // Extending past an edge stays at the edge.
  await act(() => void result.current.extend("right"));
  expect(result.current.focus?.colKey).toBe("due");
});

test("extendTo keeps the anchor (Shift+click); row, column and all", async () => {
  const onChange = vi.fn();
  const { result, act } = await setup({ onChange });
  await act(() => result.current.select({ rowId: "r1", colKey: "name" }));
  await act(() => result.current.extendTo({ rowId: "r3", colKey: "qty" }));
  expect(result.current.bounds).toMatchObject({
    top: 0,
    bottom: 2,
    left: 0,
    right: 1,
  });
  await act(() => result.current.selectRow("r4"));
  expect(result.current.bounds).toMatchObject({
    top: 3,
    bottom: 3,
    left: 0,
    right: 2,
  });
  await act(() => result.current.selectColumn("due"));
  expect(result.current.bounds).toMatchObject({
    top: 0,
    bottom: 3,
    left: 2,
    right: 2,
  });
  await act(() => result.current.selectAll());
  expect(result.current.bounds).toMatchObject({ rows: 4, columns: 3 });
  await act(() => result.current.clear());
  expect(result.current.ranges).toEqual([]);
  expect(onChange).toHaveBeenLastCalledWith(null);
});

test("a range follows its ids when rows reorder, and ends when its row leaves", async () => {
  const { result, act, rerender } = await setup();
  await act(() => result.current.select({ rowId: "r1", colKey: "name" }));
  await act(() => result.current.extendTo({ rowId: "r2", colKey: "name" }));
  await rerender({ rowIds: ["r3", "r2", "r1", "r4"] });
  expect(result.current.bounds).toMatchObject({ top: 1, bottom: 2 });
  expect(result.current.isSelected("r1", "name")).toBe(true);
  await rerender({ rowIds: ["r3", "r2", "r4"] });
  expect(result.current.bounds).toBeNull();
  expect(result.current.isSelected("r2", "name")).toBe(false);
});
