import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { useTabsSwipe } from "./use-tabs-swipe";

function Harness({ onValueChange }: { onValueChange: (v: string) => void }) {
  const swipe = useTabsSwipe({
    values: ["a", "b", "c"],
    value: "b",
    onValueChange,
  });
  return (
    <div data-testid="area" {...swipe}>
      panels
    </div>
  );
}

function swipe(el: Element, dx: number, pointerType = "touch") {
  const init = { pointerId: 1, pointerType, bubbles: true };
  el.dispatchEvent(
    new PointerEvent("pointerdown", { ...init, clientX: 200, clientY: 100 }),
  );
  el.dispatchEvent(
    new PointerEvent("pointerup", { ...init, clientX: 200 + dx, clientY: 104 }),
  );
}

test("a touch swipe moves to the neighbouring tab; mouse drags do not", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Harness onValueChange={onValueChange} />);
  const area = screen.getByTestId("area").element();
  swipe(area, -120);
  expect(onValueChange).toHaveBeenLastCalledWith("c");
  swipe(area, 120);
  expect(onValueChange).toHaveBeenLastCalledWith("a");
  onValueChange.mockClear();
  swipe(area, -120, "mouse");
  swipe(area, -10);
  expect(onValueChange).not.toHaveBeenCalled();
});
