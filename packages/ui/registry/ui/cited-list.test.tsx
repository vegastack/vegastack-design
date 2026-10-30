import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Citation, CitedList, CitedListItem } from "./cited-list";
import "../../test/geometry.css";

test("a numbered list whose citations follow the sentence after a space", async () => {
  const screen = await render(
    <CitedList>
      <CitedListItem
        citations={
          <>
            <Citation href="#a">Source A</Citation>
            <Citation href="#b">Source B</Citation>
          </>
        }
      >
        The launch moved.
      </CitedListItem>
      <CitedListItem>No source.</CitedListItem>
    </CitedList>,
  );
  const list = screen.container.querySelector("ol[data-slot=cited-list]")!;
  expect(list).not.toBeNull();
  const items = list.querySelectorAll("li[data-slot=cited-list-item]");
  expect(items).toHaveLength(2);
  expect(items[0]!.textContent).toBe("The launch moved. Source ASource B");
  expect(
    items[0]!.querySelectorAll("[data-slot=cited-list-citations] a"),
  ).toHaveLength(2);
  expect(
    items[1]!.querySelector("[data-slot=cited-list-citations]"),
  ).toBeNull();
  await expect
    .element(screen.getByRole("link", { name: "Source A" }))
    .toHaveAttribute("href", "#a");
  await expectNoA11yViolations(screen.container);
});

test("a citation renders as a button through render, with its icon hidden", async () => {
  const onClick = vi.fn();
  const ref = React.createRef<HTMLAnchorElement>();
  const screen = await render(
    <CitedList>
      <CitedListItem
        citations={
          <Citation
            ref={ref}
            icon={<svg />}
            aria-label="Play from 04:12"
            render={<button type="button" onClick={onClick} />}
          >
            04:12
          </Citation>
        }
      >
        Agreed.
      </CitedListItem>
    </CitedList>,
  );
  const button = screen.getByRole("button", { name: "Play from 04:12" });
  await button.click();
  expect(onClick).toHaveBeenCalledOnce();
  expect(ref.current?.tagName).toBe("BUTTON");
  expect(ref.current?.dataset.slot).toBe("citation");
  expect(
    ref.current?.querySelector("[data-slot=citation-icon]"),
  ).toHaveAttribute("aria-hidden");
  await expectNoA11yViolations(screen.container);
});

test("a long label is cut with an ellipsis at its max width", async () => {
  const screen = await render(
    <Citation href="#x">
      A very long source title that keeps going well past the chip's maximum
      width
    </Citation>,
  );
  const chip = screen.container.querySelector<HTMLElement>(
    "[data-slot=citation]",
  )!;
  const style = getComputedStyle(chip);
  expect(style.textOverflow).toBe("ellipsis");
  expect(style.whiteSpace).toBe("nowrap");
  expect(chip.scrollWidth).toBeGreaterThan(chip.clientWidth);
});
