import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import {
  ForYouCard,
  ForYouCardSkeleton,
  type ForYouCardProps,
  type ForYouOption,
} from "./for-you-card";

const OPTIONS: ForYouOption[] = [
  { id: "approve", label: "Approve", kind: "primary" },
  { id: "decline", label: "Decline", kind: "decline" },
  { id: "open", label: "Open claim", kind: "navigate", href: "/claims/9" },
  { id: "why", label: "Inspect", kind: "inspect" },
];

const base: ForYouCardProps = {
  verb: "approve",
  from: { name: "Expense checker", avatar: <span aria-hidden>E</span> },
  title: "Ravi's taxi claim, ₹4,200",
  summary: "Airport run on 12 Nov; over the policy cap.",
  facts: [
    { label: "Amount", value: "₹4,200" },
    { label: "Over policy by", value: "₹1,200", tone: "warning" },
  ],
  deadline: { label: "Due today", urgent: true },
  ifNobodyAnswers: "It goes to Finance on Friday.",
  state: "open",
  options: OPTIONS,
};

const filled = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>("[data-variant]")].filter(
    (el) => el.dataset.variant === "default",
  );

test("an open card: verb, who asks, facts, what happens if nobody answers, options in order with the primary secondary", async () => {
  const onOption = vi.fn();
  const onInspect = vi.fn();
  const screen = await render(
    <ForYouCard
      {...base}
      onOption={onOption}
      onInspect={onInspect}
      onSnooze={vi.fn()}
      onSkip={vi.fn()}
    />,
  );
  await expect
    .element(page.getByRole("article", { name: "Ravi's taxi claim, ₹4,200" }))
    .toBeVisible();
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="for-you-card"]',
  )!;
  expect(
    root.querySelector('[data-slot="for-you-card-verb"]')!.textContent,
  ).toBe("Approve");
  expect(
    root.querySelector('[data-slot="for-you-card-if-nobody"]')!.textContent,
  ).toBe("If nobody answers: It goes to Finance on Friday.");
  const kinds = [...root.querySelectorAll<HTMLElement>("[data-option]")].map(
    (el) => el.dataset.option,
  );
  expect(kinds).toEqual(["primary", "decline", "navigate", "inspect"]);
  expect(
    root.querySelector('[data-option="primary"]')!.getAttribute("data-variant"),
  ).toBe("secondary");
  expect(filled(root)).toEqual([]);
  await page.getByRole("button", { name: "Approve" }).click();
  expect(onOption).toHaveBeenCalledWith("approve");
  await page.getByRole("button", { name: "Inspect" }).click();
  expect(onInspect).toHaveBeenCalledWith("why");
  expect(onOption).toHaveBeenCalledTimes(1);
  await expect
    .element(page.getByRole("link", { name: "Open claim" }))
    .toHaveAttribute("href", "/claims/9");
  await expectNoA11yViolations(screen.container);
});

test("sending holds every other option, Skip and Snooze; the option in flight keeps its label", async () => {
  const screen = await render(
    <ForYouCard
      {...base}
      state="sending"
      sendingOptionId="approve"
      onOption={vi.fn()}
      onSnooze={vi.fn()}
      onSkip={vi.fn()}
    />,
  );
  const root = screen.container.querySelector('[data-slot="for-you-card"]')!;
  expect(root.getAttribute("aria-busy")).toBe("true");
  const approve = root.querySelector('[data-option-id="approve"]')!;
  expect(approve.textContent).toContain("Approve");
  expect(approve.getAttribute("aria-busy")).toBe("true");
  expect(
    root
      .querySelector('[data-option-id="decline"]')!
      .hasAttribute("data-disabled"),
  ).toBe(true);
  expect(
    root
      .querySelector('[data-slot="for-you-card-skip"]')!
      .hasAttribute("data-disabled"),
  ).toBe(true);
  await expectNoA11yViolations(screen.container);
});

test("settled states read as their outcome; Skip reads differently from Decline", async () => {
  const outcome = {
    label: "Approved",
    actorName: "Priya",
    via: "slack",
    at: "14:02",
  };
  const screen = await render(
    <>
      <ForYouCard {...base} state="done" outcome={outcome} />
      <ForYouCard
        {...base}
        state="declined"
        outcome={{ ...outcome, label: "Declined", note: "Use the bus" }}
      />
      <ForYouCard {...base} state="skipped" />
      <ForYouCard {...base} state="expired" />
      <ForYouCard {...base} state="stale" />
      <ForYouCard {...base} state="withdrawn" />
    </>,
  );
  const lines = [
    ...screen.container.querySelectorAll('[data-slot="for-you-card-outcome"]'),
  ].map((el) => el.textContent);
  expect(lines).toEqual([
    "Approved by Priya in Slack · 14:02",
    "Declined by Priya in Slack · 14:02 · Use the bus",
    "Skipped",
    "Not answered in time",
    "This changed. Review the new version.",
    "No longer needed",
  ]);
  const cards = screen.container.querySelectorAll('[data-slot="for-you-card"]');
  // A stale card keeps only its way to the new version.
  expect(
    [...cards[4]!.querySelectorAll<HTMLElement>("[data-option]")].map(
      (el) => el.dataset.option,
    ),
  ).toEqual(["navigate", "inspect"]);
  expect(cards[0]!.querySelectorAll("[data-option]")).toHaveLength(0);
  await expectNoA11yViolations(screen.container);
});

test("withdrawn because access was lost shows nothing of the source and no action", async () => {
  const screen = await render(
    <ForYouCard
      {...base}
      state="withdrawn"
      withdrawnReason="access_lost"
      evidence={<p>secret evidence</p>}
      onSnooze={vi.fn()}
      onSkip={vi.fn()}
    >
      <p>secret body</p>
    </ForYouCard>,
  );
  const root = screen.container.querySelector('[data-slot="for-you-card"]')!;
  expect(root.textContent).toBe("No longer available to you");
  expect(root.querySelector("button, a")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("a question_form body renders the question form and submits through onSubmitBody; submit_failed keeps options live", async () => {
  const onSubmitBody = vi.fn(async () => null);
  const screen = await render(
    <>
      <ForYouCard
        {...base}
        verb="answer"
        options={undefined}
        sourceBody={{
          kind: "question_form",
          questions: [
            {
              header: "Colour",
              question: "Which colour temperature?",
              options: [{ label: "3000 K" }, { label: "4000 K" }],
            },
          ],
        }}
        onSubmitBody={onSubmitBody}
      />
      <ForYouCard
        {...base}
        state="submit_failed"
        onOption={vi.fn()}
        sourceBody={{ kind: "checkin", v: 1, checkinId: "c1" }}
        renderBody={(body) => <p data-testid="custom">{body.kind}</p>}
      />
    </>,
  );
  expect(
    screen.container.querySelector('[data-slot="agent-question-form"]'),
  ).not.toBeNull();
  await expect.element(page.getByTestId("custom")).toHaveTextContent("checkin");
  const failed = screen.container.querySelectorAll(
    '[data-slot="for-you-card"]',
  )[1]!;
  expect(
    failed.querySelector('[data-slot="for-you-card-failed"]')!.textContent,
  ).toBe("Your answer didn't save. Try again.");
  expect(
    failed
      .querySelector('[data-option-id="approve"]')!
      .hasAttribute("data-disabled"),
  ).toBe(false);
});

test("offline holds the options; fewer-like-this only on suggest; selected and skeleton", async () => {
  const screen = await render(
    <>
      <ForYouCard {...base} offline onOption={vi.fn()} />
      <ForYouCard
        {...base}
        verb="suggest"
        selected
        onSnooze={vi.fn()}
        onFewerLikeThis={vi.fn()}
      />
      <ForYouCardSkeleton />
    </>,
  );
  const [offline, suggest] = screen.container.querySelectorAll(
    '[data-slot="for-you-card"]',
  );
  expect(offline!.textContent).toContain("Connect to answer");
  expect(
    offline!
      .querySelector('[data-option-id="approve"]')!
      .hasAttribute("data-disabled"),
  ).toBe(true);
  expect(suggest!.hasAttribute("data-selected")).toBe(true);
  await page
    .getByRole("button", { name: "More for Ravi's taxi claim, ₹4,200" })
    .click();
  await expect
    .element(page.getByRole("menuitem", { name: "Fewer like this" }))
    .toBeVisible();
});

test("a body-only card keeps Skip; its question form draws no filled primary; a custom body holds while sending", async () => {
  const screen = await render(
    <>
      <ForYouCard
        {...base}
        verb="answer"
        options={undefined}
        onSkip={vi.fn()}
        sourceBody={{
          kind: "question_form",
          questions: [
            {
              header: "Colour",
              question: "Which colour temperature?",
              options: [{ label: "3000 K" }, { label: "4000 K" }],
            },
          ],
        }}
        onSubmitBody={vi.fn(async () => null)}
      />
      <ForYouCard
        {...base}
        state="sending"
        sendingOptionId="body"
        options={undefined}
        sourceBody={{ kind: "checkin", v: 1, checkinId: "c1" }}
        renderBody={() => <button type="button">Send check-in</button>}
      />
    </>,
  );
  const [bodyOnly, sending] = screen.container.querySelectorAll(
    '[data-slot="for-you-card"]',
  );
  expect(
    bodyOnly!.querySelector('[data-slot="for-you-card-skip"]'),
  ).not.toBeNull();
  expect(filled(bodyOnly!)).toEqual([]);
  await expect
    .element(page.getByRole("button", { name: "Send check-in" }))
    .toBeDisabled();
  expect(sending).toBeDefined();
});
