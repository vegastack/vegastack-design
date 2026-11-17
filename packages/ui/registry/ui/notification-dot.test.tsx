import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { NotificationDot } from "./notification-dot";

test("NotificationDot is a decorative info dot by default", async () => {
  const screen = await render(<NotificationDot className="ms-auto" />);
  const dot = screen.container.querySelector<HTMLElement>(
    '[data-slot="notification-dot"]',
  )!;
  expect(dot).not.toBeNull();
  expect(dot).toHaveAttribute("aria-hidden", "true");
  expect(dot.classList.contains("bg-info")).toBe(true);
  expect(dot.classList.contains("bg-destructive")).toBe(false);
  expect(dot.classList.contains("ms-auto")).toBe(true);
  expect(dot.textContent).toBe("");
});

test('NotificationDot intent="destructive" is the destructive fill', async () => {
  const screen = await render(<NotificationDot intent="destructive" />);
  const dot = screen.container.querySelector<HTMLElement>(
    '[data-slot="notification-dot"]',
  )!;
  expect(dot.classList.contains("bg-destructive")).toBe(true);
  expect(dot.classList.contains("bg-info")).toBe(false);
});

test("NotificationDot inside a labelled row has no axe violations", async () => {
  const screen = await render(
    <ul>
      <li>
        Design review <span className="sr-only">, unread</span>
        <NotificationDot />
      </li>
    </ul>,
  );
  await expectNoA11yViolations(screen.container);
});
