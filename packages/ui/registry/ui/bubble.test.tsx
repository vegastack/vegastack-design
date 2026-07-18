import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "./bubble";

test("renders the bubble + content slots with variant/align data", async () => {
  const screen = await render(
    <Bubble variant="tinted" align="end">
      <BubbleContent>On my way</BubbleContent>
    </Bubble>,
  );
  const content = screen.getByText("On my way");
  await expect.element(content).toHaveAttribute("data-slot", "bubble-content");
  const root = content.element().closest('[data-slot="bubble"]');
  expect(root).toHaveAttribute("data-variant", "tinted");
  expect(root).toHaveAttribute("data-align", "end");
});

test("does not carry the motion-enter-up class by default", async () => {
  const screen = await render(
    <Bubble>
      <BubbleContent>Hey there</BubbleContent>
    </Bubble>,
  );
  const root = screen.getByText("Hey there").element().closest('[data-slot="bubble"]');
  expect(root?.className).not.toContain("motion-enter-up");
});

test("animateIn applies the motion-enter-up entry class", async () => {
  const screen = await render(
    <Bubble animateIn>
      <BubbleContent>Just sent</BubbleContent>
    </Bubble>,
  );
  const root = screen.getByText("Just sent").element().closest('[data-slot="bubble"]');
  expect(root?.className).toContain("motion-enter-up");
});

test("renders an interactive bubble via the render prop", async () => {
  const screen = await render(
    <Bubble>
      <BubbleContent render={<button type="button" />}>Tap me</BubbleContent>
    </Bubble>,
  );
  const btn = screen.getByRole("button", { name: "Tap me" });
  await expect.element(btn).toHaveAttribute("data-slot", "bubble-content");
});

test("BubbleReactions exposes its slot + anchors", async () => {
  const screen = await render(
    <Bubble>
      <BubbleContent>Nice work!</BubbleContent>
      <BubbleReactions side="top" align="start">
        👍 3
      </BubbleReactions>
    </Bubble>,
  );
  const reactions = screen.container.querySelector(
    '[data-slot="bubble-reactions"]',
  );
  expect(reactions).not.toBeNull();
  expect(reactions).toHaveAttribute("data-side", "top");
  expect(reactions).toHaveAttribute("data-align", "start");
});

test("BubbleGroup exposes its slot", async () => {
  const screen = await render(
    <BubbleGroup>
      <Bubble>
        <BubbleContent>One</BubbleContent>
      </Bubble>
      <Bubble>
        <BubbleContent>Two</BubbleContent>
      </Bubble>
    </BubbleGroup>,
  );
  expect(
    screen.container.querySelector('[data-slot="bubble-group"]'),
  ).not.toBeNull();
});

test("forwards ref to the content element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Bubble>
      <BubbleContent ref={ref}>Ref</BubbleContent>
    </Bubble>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("bubble-content");
});

test("no a11y violations (interactive bubble)", async () => {
  const screen = await render(
    <Bubble variant="secondary">
      <BubbleContent render={<button type="button" />}>Reply</BubbleContent>
    </Bubble>,
  );
  await expectNoA11yViolations(screen.container);
});
