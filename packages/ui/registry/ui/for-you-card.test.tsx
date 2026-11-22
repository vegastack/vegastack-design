import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { DropdownMenuItem } from "./dropdown-menu";
import { Inbox, InboxGroup, InboxItem } from "./inbox";
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
  const outcome: NonNullable<ForYouCardProps["outcome"]> = {
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
      <ForYouCard {...base} state="done" outcome={{ ...outcome, via: "app" }} />
      <ForYouCard
        {...base}
        state="done"
        outcome={{ ...outcome, via: "desktop" }}
      />
      <ForYouCard
        {...base}
        state="done"
        outcome={{ ...outcome, via: "phone" }}
      />
      <ForYouCard
        {...base}
        state="expired"
        outcome={{
          ...outcome,
          label: "Expired",
          actorName: null,
          via: "system",
        }}
      />
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
    "Approved by Priya on the web · 14:02",
    "Approved by Priya in the desktop app · 14:02",
    "Approved by Priya in the mobile app · 14:02",
    "Not answered in time · Expired · 14:02",
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

test("in an Inbox the card is its row: J / K reach it, the active row selects it, unread is read out, its menu stays when settled", async () => {
  const onActiveChange = vi.fn();
  const onArchive = vi.fn();
  const archive = (
    <DropdownMenuItem onClick={onArchive}>Archive</DropdownMenuItem>
  );
  const screen = await render(
    <Inbox onActiveChange={onActiveChange}>
      <InboxGroup label="For you">
        <InboxItem value="n1" title="First" href="#first" />
        <ForYouCard {...base} value="c1" unread menu={archive} />
        <ForYouCard
          {...base}
          value="c2"
          title="Done claim"
          state="done"
          menu={archive}
        />
      </InboxGroup>
    </Inbox>,
  );
  const first = screen.getByRole("link", { name: "First" });
  (first.element() as HTMLElement).focus();
  await userEvent.keyboard("jj");
  expect(onActiveChange).toHaveBeenLastCalledWith("c1");
  const row = screen.container.querySelector<HTMLElement>('[data-value="c1"]')!;
  expect(row.tagName).toBe("LI");
  expect(row.dataset.slot).toBe("inbox-item");
  expect(document.activeElement).toBe(row);
  expect(row).toHaveAttribute("aria-current", "true");
  expect(row).toHaveAttribute("data-unread");
  const card = row.querySelector('[data-slot="for-you-card"]')!;
  expect(card).toHaveAttribute("data-selected");
  await expect
    .element(screen.getByRole("article", { name: /^Unread: Ravi's taxi/ }))
    .toBeInTheDocument();

  await userEvent.keyboard("j");
  expect(onActiveChange).toHaveBeenLastCalledWith("c2");
  expect(card).not.toHaveAttribute("data-selected");
  // A settled card keeps the row's menu (Archive, Mark read) though its own items are gone.
  await screen.getByRole("button", { name: "More for Done claim" }).click();
  await screen.getByRole("menuitem", { name: "Archive" }).click();
  expect(onArchive).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("in an Inbox that opens rows, the card's title is the row's button and a click on the card opens it, not on its options", async () => {
  const onOpen = vi.fn();
  const onOption = vi.fn();
  const screen = await render(
    <Inbox onOpen={onOpen}>
      <InboxGroup label="For you">
        <ForYouCard {...base} value="c1" onOption={onOption} />
      </InboxGroup>
    </Inbox>,
  );
  await screen.getByRole("button", { name: "Approve" }).click();
  expect(onOption).toHaveBeenCalledWith("approve");
  expect(onOpen).not.toHaveBeenCalled();
  const title = screen.container.querySelector<HTMLElement>(
    '[data-slot="inbox-item-link"]',
  )!;
  expect(title.textContent).toBe("Ravi's taxi claim, ₹4,200");
  title.click();
  expect(onOpen).toHaveBeenCalledWith("c1");
});

test("in an Inbox that opens rows, a card withdrawn for lost access is still reached and opened by the keyboard", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <Inbox onOpen={onOpen}>
      <InboxGroup label="For you">
        <InboxItem value="n1" title="First" href="#first" />
        <ForYouCard
          {...base}
          value="c1"
          state="withdrawn"
          withdrawnReason="access_lost"
        />
      </InboxGroup>
    </Inbox>,
  );
  (
    screen.getByRole("link", { name: "First" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("jj");
  const title = screen.container.querySelector<HTMLElement>(
    '[data-value="c1"] [data-slot="inbox-item-link"]',
  )!;
  expect(document.activeElement).toBe(title);
  expect(title).toHaveAttribute("aria-current", "true");
  await userEvent.keyboard("{Enter}");
  expect(onOpen).toHaveBeenCalledWith("c1");
});

test("compact: a quiet row with no buttons; the row opens its menu, whose keys answer", async () => {
  const onOption = vi.fn();
  const onDone = vi.fn();
  const screen = await render(
    <ForYouCard
      {...base}
      compact
      kindLabel="Approval"
      why="Over the policy cap, so it needs your approval."
      time="2h"
      onOption={onOption}
      onSnooze={vi.fn()}
      menuActions={[
        { id: "done", label: "Mark done", shortcut: "E", onSelect: onDone },
      ]}
    />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="for-you-card"]',
  )!;
  expect(root.dataset.compact).toBe("");
  expect(
    root.querySelector('[data-slot="for-you-card-why"]')!.textContent,
  ).toBe("Over the policy cap, so it needs your approval.");
  expect(
    root.querySelector('[data-slot="for-you-card-verb"]')!.textContent,
  ).toBe("Approval");
  // Nothing on the row but its trigger.
  expect(root.querySelectorAll("button")).toHaveLength(1);
  expect(root.querySelectorAll("[data-option]")).toHaveLength(0);
  await page.getByRole("button", { name: "Ravi's taxi claim, ₹4,200" }).click();
  const menu = page.getByRole("menu");
  await expect.element(menu).toBeVisible();
  await expect
    .element(page.getByRole("menuitem", { name: "Snooze H" }))
    .toBeVisible();
  await userEvent.keyboard("1");
  expect(onOption).toHaveBeenCalledWith("approve");
  await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
  await page.getByRole("button", { name: "Ravi's taxi claim, ₹4,200" }).click();
  await expect.element(page.getByRole("menu")).toBeVisible();
  // The keys go to the open menu once it holds focus.
  await expect
    .poll(() => document.activeElement?.closest('[role="menu"]') != null)
    .toBe(true);
  await userEvent.keyboard("e");
  expect(onDone).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("compact: a card with a form opens it in place from the menu, and Less folds it", async () => {
  const screen = await render(
    <ForYouCard
      {...base}
      compact
      options={[]}
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
    />,
  );
  await page.getByRole("button", { name: "Ravi's taxi claim, ₹4,200" }).click();
  await page.getByRole("menuitem", { name: "Answer here… A" }).click();
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="for-you-card"]',
  )!;
  expect(root.dataset.expanded).toBe("");
  await page.getByRole("button", { name: "Less" }).click();
  expect(root.dataset.expanded).toBeUndefined();
  // Focus returns to the row.
  await expect
    .element(page.getByRole("button", { name: "Ravi's taxi claim, ₹4,200" }))
    .toHaveFocus();
});

test("compact in an Inbox: the row's trigger is its focus target; with no body, Show details opens the facts", async () => {
  const screen = await render(
    <Inbox title="Inbox">
      <InboxGroup label="Needs you">
        <ForYouCard {...base} compact value="claim" />
      </InboxGroup>
    </Inbox>,
  );
  expect(
    screen.container.querySelector('[data-slot="inbox-item-link"]')
      ?.textContent,
  ).toContain("Ravi's taxi claim");
  await page.getByRole("button", { name: "Ravi's taxi claim, ₹4,200" }).click();
  await page.getByRole("menuitem", { name: "Show details A" }).click();
  expect(
    screen.container.querySelector('[data-slot="for-you-card-facts"]'),
  ).not.toBeNull();
});

test("compact, settled: one line with the outcome and the title, and Undo", async () => {
  const onUndo = vi.fn();
  const screen = await render(
    <ForYouCard
      {...base}
      compact
      state="done"
      outcome={{ label: "Approved", actorName: null, via: null, at: "14:02" }}
      onUndo={onUndo}
    />,
  );
  const line = screen.container.querySelector(
    '[data-slot="for-you-card-outcome"]',
  )!;
  expect(line.textContent).toBe("Approved · 14:02: Ravi's taxi claim, ₹4,200");
  expect(screen.container.querySelectorAll("[data-option]")).toHaveLength(0);
  await page
    .getByRole("button", { name: "Undo: Ravi's taxi claim, ₹4,200" })
    .click();
  expect(onUndo).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("compact: stale keeps its links to the new version; a failed answer says so while folded", async () => {
  const screen = await render(
    <ForYouCard
      {...base}
      compact
      state="stale"
      menu={<DropdownMenuItem>Archive</DropdownMenuItem>}
    />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="for-you-card"]',
  )!;
  expect(
    root.querySelector('[data-slot="for-you-card-why"]')!.textContent,
  ).toBe("This changed. Review the new version.");
  await page.getByRole("button", { name: "Ravi's taxi claim, ₹4,200" }).click();
  await expect
    .element(page.getByRole("menuitem", { name: "Open claim 1" }))
    .toBeVisible();
  await expect
    .element(page.getByRole("menuitem", { name: "Inspect 2" }))
    .toBeVisible();
  expect(
    page.getByRole("menuitem", { name: /Approve/ }).elements(),
  ).toHaveLength(0);
  await userEvent.keyboard("{Escape}");
  await screen.rerender(<ForYouCard {...base} compact state="submit_failed" />);
  await expect
    .element(page.getByRole("alert"))
    .toHaveTextContent("Your answer didn't save. Try again.");
});

test("compact: the row's own menu items and Fewer like this sit in its menu", async () => {
  const onFewerLikeThis = vi.fn();
  await render(
    <ForYouCard
      {...base}
      verb="suggest"
      compact
      onFewerLikeThis={onFewerLikeThis}
      menu={<DropdownMenuItem>Mark read</DropdownMenuItem>}
    />,
  );
  await page.getByRole("button", { name: "Ravi's taxi claim, ₹4,200" }).click();
  await expect
    .element(page.getByRole("menuitem", { name: "Mark read" }))
    .toBeVisible();
  await page.getByRole("menuitem", { name: "Fewer like this" }).click();
  expect(onFewerLikeThis).toHaveBeenCalledTimes(1);
});
