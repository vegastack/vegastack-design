import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ChatSkeleton, ScrollToLatest } from "./chat-skeleton";

test("ChatSkeleton sketches each turn's shapes and waits before it shows", async () => {
  const screen = await render(<ChatSkeleton turns={3} />);
  const root = screen
    .getByRole("status", { name: "Loading the chat" })
    .element();
  expect(root.className).toContain("motion-reveal");
  expect(root.children).toHaveLength(3);
  expect(
    root.children[0]!.querySelectorAll('[data-slot="skeleton"]'),
  ).toHaveLength(6);
  await expectNoA11yViolations(screen.container);
});

test("ScrollToLatest parks out of reach while hidden and says when new words arrived", async () => {
  const onClick = vi.fn();
  const hidden = await render(
    <ScrollToLatest visible={false} onClick={onClick} />,
  );
  const parked = hidden.container.querySelector<HTMLElement>(
    '[data-slot="scroll-to-latest"]',
  )!;
  expect(parked.getAttribute("data-active")).toBe("false");
  expect(parked.getAttribute("tabindex")).toBe("-1");
  await hidden.unmount();

  const shown = await render(
    <ScrollToLatest visible hasNew onClick={onClick} />,
  );
  const button = shown.getByRole("button", {
    name: "Scroll to latest, new messages",
  });
  expect(
    button.element().querySelector('[data-slot="scroll-to-latest-dot"]'),
  ).not.toBeNull();
  await userEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
  await expectNoA11yViolations(shown.container);
});
