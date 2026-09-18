import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DirectionProvider, useDirection } from "./direction";
import { Input } from "./input";

function Reporter() {
  const direction = useDirection();
  return <span data-testid="direction">{direction}</span>;
}

test("the provider renders no element of its own (Usage)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <span data-testid="child">child</span>
    </DirectionProvider>,
  );
  const child = screen.container.querySelector('[data-testid="child"]');
  expect(child?.parentElement).toBe(screen.container);
});

test("useDirection reports the nearest provider's value (useDirection)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <Reporter />
    </DirectionProvider>,
  );
  await expect
    .element(screen.getByTestId("direction"))
    .toHaveTextContent("rtl");
});

test("useDirection reports ltr under an ltr provider (useDirection)", async () => {
  const screen = await render(
    <DirectionProvider direction="ltr">
      <Reporter />
    </DirectionProvider>,
  );
  await expect
    .element(screen.getByTestId("direction"))
    .toHaveTextContent("ltr");
});

test("a nested provider wins over its ancestor (useDirection)", async () => {
  const screen = await render(
    <DirectionProvider direction="ltr">
      <DirectionProvider direction="rtl">
        <Reporter />
      </DirectionProvider>
    </DirectionProvider>,
  );
  await expect
    .element(screen.getByTestId("direction"))
    .toHaveTextContent("rtl");
});

test("the provider does not set dir itself — the document attribute still does (Usage)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Input aria-label="الاسم" />
      </div>
    </DirectionProvider>,
  );
  const input = screen
    .getByRole("textbox", { name: "الاسم" })
    .element() as HTMLElement;
  expect(getComputedStyle(input).direction).toBe("rtl");
});

test("no a11y violations — rtl subtree", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Input aria-label="الاسم" />
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — ltr subtree", async () => {
  const screen = await render(
    <DirectionProvider direction="ltr">
      <div dir="ltr">
        <Input aria-label="Name" />
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});
