import * as React from "react";
import { render } from "vitest-browser-react";
// Real layout: the toolbar and its tools measure and size themselves from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test } from "vitest";
import { measureFold, useOverflowFold } from "./use-overflow-fold";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

test("measureFold folds past the room and unfolds only past the hysteresis", () => {
  expect(measureFold({ need: 300, available: 299, folded: false })).toBe(true);
  expect(measureFold({ need: 300, available: 310, folded: true })).toBe(true);
  expect(measureFold({ need: 300, available: 325, folded: true })).toBe(false);
  expect(measureFold({ need: 300, available: 300, folded: false })).toBe(false);
});

function Row({ width }: { width: number }) {
  const { rootRef, contentRef, folded } = useOverflowFold<
    HTMLDivElement,
    HTMLDivElement
  >();
  return (
    <div style={{ width }}>
      <div
        ref={rootRef}
        className="relative w-full min-w-0"
        data-folded={folded ? "" : undefined}
      >
        <div
          ref={contentRef}
          className={folded ? "invisible absolute flex" : "flex"}
        >
          <span style={{ width: 200, flex: "none" }}>a</span>
        </div>
      </div>
    </div>
  );
}

test("folds when the content is wider than the root, unfolds when it fits again", async () => {
  const screen = await render(<Row width={150} />);
  await expect
    .poll(() => document.querySelector("[data-folded]"))
    .not.toBeNull();
  await screen.rerender(<Row width={400} />);
  await expect.poll(() => document.querySelector("[data-folded]")).toBeNull();
});
