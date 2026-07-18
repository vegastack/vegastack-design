import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "./message";

test("renders a message row and exposes its slot + alignment", async () => {
  const screen = await render(
    <Message>
      <MessageContent>Hello there</MessageContent>
    </Message>,
  );
  const content = screen.getByText("Hello there");
  await expect.element(content).toHaveAttribute("data-slot", "message-content");
  const root = content.element().closest('[data-slot="message"]');
  expect(root).not.toBeNull();
  expect(root).toHaveAttribute("data-align", "start");
});

test("align='end' flips the row", async () => {
  const screen = await render(
    <Message align="end">
      <MessageContent>Sent</MessageContent>
    </Message>,
  );
  const root = screen
    .getByText("Sent")
    .element()
    .closest('[data-slot="message"]');
  expect(root).toHaveAttribute("data-align", "end");
});

test("does not carry the motion-enter-up class by default", async () => {
  const screen = await render(
    <Message>
      <MessageContent>Hello there</MessageContent>
    </Message>,
  );
  const root = screen
    .getByText("Hello there")
    .element()
    .closest('[data-slot="message"]');
  expect(root?.className).not.toContain("motion-enter-up");
});

test("animateIn applies the motion-enter-up entry class", async () => {
  const screen = await render(
    <Message animateIn>
      <MessageContent>Just sent</MessageContent>
    </Message>,
  );
  const root = screen
    .getByText("Just sent")
    .element()
    .closest('[data-slot="message"]');
  expect(root?.className).toContain("motion-enter-up");
});

test("renders header, footer, avatar, and group slots", async () => {
  const screen = await render(
    <MessageGroup>
      <Message>
        <MessageAvatar>
          <span>AL</span>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Ada</MessageHeader>
          Body
          <MessageFooter>Sent 2m ago</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>,
  );
  expect(
    screen.container.querySelector('[data-slot="message-group"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="message-avatar"]'),
  ).not.toBeNull();
  await expect
    .element(screen.getByText("Ada"))
    .toHaveAttribute("data-slot", "message-header");
  await expect
    .element(screen.getByText("Sent 2m ago"))
    .toHaveAttribute("data-slot", "message-footer");
});

test("no a11y violations", async () => {
  const screen = await render(
    <MessageGroup>
      <Message>
        <MessageContent>
          <MessageHeader>Ada</MessageHeader>
          Hello there
        </MessageContent>
      </Message>
    </MessageGroup>,
  );
  await expectNoA11yViolations(screen.container);
});
