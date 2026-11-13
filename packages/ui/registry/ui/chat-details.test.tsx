import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ChatDetails,
  ChatDetailsBack,
  ChatDetailsRow,
  ChatDetailsSection,
} from "./chat-details";

test("sections name themselves, show their count and fold past the limit", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <ChatDetails>
      <ChatDetailsSection title="Outputs" count={7} limit={5}>
        {Array.from({ length: 7 }, (_, i) => (
          <ChatDetailsRow
            key={i}
            title={`File ${i + 1}.pdf`}
            meta="2m ago"
            onOpen={onOpen}
          />
        ))}
      </ChatDetailsSection>
      <ChatDetailsSection title="Connectors" empty="This chat used none." />
    </ChatDetails>,
  );
  await expect
    .element(screen.getByRole("complementary", { name: "Chat details" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("region", { name: "Outputs" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelectorAll('[data-slot="chat-details-row"]'),
  ).toHaveLength(5);
  await userEvent.click(screen.getByRole("button", { name: "Show 2 more" }));
  expect(
    screen.container.querySelectorAll('[data-slot="chat-details-row"]'),
  ).toHaveLength(7);
  await userEvent.click(screen.getByRole("button", { name: /File 1\.pdf/ }));
  expect(onOpen).toHaveBeenCalledOnce();
  expect(screen.container.textContent).toContain("This chat used none.");
  await expectNoA11yViolations(screen.container);
});

test("a nested view has a back link", async () => {
  const onBack = vi.fn();
  const screen = await render(
    <ChatDetails>
      <ChatDetailsBack
        label="Chat details"
        title="Hublit and Halonix"
        meta="3 steps · 0:41"
        onBack={onBack}
      />
    </ChatDetails>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Chat details" }));
  expect(onBack).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});
