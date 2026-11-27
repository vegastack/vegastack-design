import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import {
  ChatRequestCard,
  RequestBundleCard,
  RequestLine,
  type RequestData,
} from "./chat-request-card";

const agent = { name: "William" };
const EMAIL: RequestData = {
  interactionId: "i1",
  kind: "gmail_send",
  title: "Email sm@vegastack.com",
  detail: "Weekly summary",
  offer: {
    choices: [
      { id: "once", label: "Allow once" },
      {
        id: "always:recipient",
        label: "Always allow",
        scope: {
          kind: "recipient",
          value: "sm@vegastack.com",
          label: "for sm@vegastack.com",
        },
      },
      {
        id: "always:domain",
        label: "Always allow",
        scope: {
          kind: "domain",
          value: "vegastack.com",
          label: "for anyone at vegastack.com",
        },
      },
      { id: "decline", label: "Decline" },
    ],
  },
  state: "open",
};
const ONCE_ONLY: RequestData = {
  ...EMAIL,
  interactionId: "i2",
  kind: "web_open",
  title: "Open halonix.co.in",
  detail: undefined,
  offer: {
    choices: [
      { id: "once", label: "Allow once" },
      { id: "decline", label: "Decline" },
    ],
    noAlways: { code: "tainted", words: "This one asks each time." },
  },
};

test("draws exactly the offered choices: no Always button when the offer has none, and says why", async () => {
  const screen = await render(
    <ChatRequestCard
      agent={agent}
      data={ONCE_ONLY}
      onAnswer={async () => {}}
    />,
  );
  await expect
    .element(screen.getByText("William needs your OK"))
    .toBeInTheDocument();
  expect(screen.container.querySelector('[data-choice="always"]')).toBeNull();
  const buttons = [...screen.container.querySelectorAll("button")].map(
    (b) => b.textContent,
  );
  expect(buttons).toEqual(["Allow once", "Decline"]);
  await expect
    .element(screen.getByText("This one asks each time."))
    .toBeInTheDocument();
});

test("Allow once answers once and the card holds until the request settles", async () => {
  const onAnswer = vi.fn(async () => {});
  const screen = await render(
    <ChatRequestCard agent={agent} data={EMAIL} onAnswer={onAnswer} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Allow once" }));
  expect(onAnswer).toHaveBeenCalledWith("once", undefined);
  const card = screen.container.querySelector<HTMLElement>(
    '[data-slot="chat-request-card"]',
  )!;
  expect(card.getAttribute("aria-busy")).toBe("true");
  await expect
    .element(screen.getByRole("button", { name: "Decline" }))
    .toBeDisabled();
  expect(onAnswer).toHaveBeenCalledOnce();
  await screen.rerender(
    <ChatRequestCard
      agent={agent}
      onAnswer={onAnswer}
      data={{
        ...EMAIL,
        state: "answered",
        answer: { choiceId: "once", byName: "you", at: "", undoable: false },
      }}
    />,
  );
  await expect
    .element(screen.getByText("Allowed once · Email sm@vegastack.com"))
    .toBeInTheDocument();
});

test("Always allow lists each offered scope and answers with its id", async () => {
  const onAnswer = vi.fn(async () => {});
  const screen = await render(
    <ChatRequestCard agent={agent} data={EMAIL} onAnswer={onAnswer} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Always allow" }));
  await userEvent.click(
    screen.getByRole("menuitem", { name: /anyone at vegastack.com/ }),
  );
  expect(onAnswer).toHaveBeenCalledWith("always:domain", undefined);
});

test("Never and Decline share one Decline menu; Never answers at once", async () => {
  const onAnswer = vi.fn(async () => {});
  const choices = [...EMAIL.offer.choices];
  choices.splice(3, 0, { id: "never", label: "Never allow this" });
  const screen = await render(
    <ChatRequestCard
      agent={agent}
      data={{ ...EMAIL, offer: { choices } }}
      onAnswer={onAnswer}
    />,
  );
  expect(screen.container.querySelector('[data-choice="never"]')).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  await expect
    .element(screen.getByRole("menuitem", { name: /Decline with a note/ }))
    .toBeVisible();
  await userEvent.click(
    screen.getByRole("menuitem", { name: /Never allow this/ }),
  );
  expect(onAnswer).toHaveBeenCalledWith("never", undefined);
});

test("Decline with a note… opens the note and sends it", async () => {
  const onAnswer = vi.fn(async () => {});
  const choices = [...EMAIL.offer.choices];
  choices.splice(3, 0, { id: "never", label: "Never allow this" });
  const screen = await render(
    <ChatRequestCard
      agent={agent}
      data={{ ...EMAIL, offer: { choices } }}
      onAnswer={onAnswer}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  await userEvent.click(
    screen.getByRole("menuitem", { name: /Decline with a note/ }),
  );
  await userEvent.fill(screen.getByRole("textbox"), "Not this week");
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  expect(onAnswer).toHaveBeenCalledWith("decline", "Not this week");
});

test("Decline alone opens a note and sends it", async () => {
  const onAnswer = vi.fn(async () => {});
  const screen = await render(
    <ChatRequestCard agent={agent} data={EMAIL} onAnswer={onAnswer} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  await userEvent.fill(screen.getByRole("textbox"), "Not this week");
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  expect(onAnswer).toHaveBeenCalledWith("decline", "Not this week");
});

test("at 390px Allow once, Always allow and Decline sit on one row", async () => {
  await page.viewport(390, 800);
  const choices = [...EMAIL.offer.choices];
  choices.splice(3, 0, { id: "never", label: "Never allow this" });
  const screen = await render(
    <div style={{ width: 358 }}>
      <ChatRequestCard
        agent={agent}
        data={{ ...EMAIL, offer: { choices } }}
        onAnswer={async () => {}}
      />
    </div>,
  );
  const tops = ["once", "always", "decline"].map(
    (id) =>
      screen.container
        .querySelector<HTMLElement>(`[data-choice="${id}"]`)!
        .getBoundingClientRect().top,
  );
  expect(new Set(tops).size).toBe(1);
});

test("Decline opens a note and sends it", async () => {
  const onAnswer = vi.fn(async () => {});
  const screen = await render(
    <ChatRequestCard agent={agent} data={EMAIL} onAnswer={onAnswer} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  await userEvent.fill(screen.getByRole("textbox"), "Not this week");
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  expect(onAnswer).toHaveBeenCalledWith("decline", "Not this week");
});

test("a failed answer releases the buttons and says so", async () => {
  const screen = await render(
    <ChatRequestCard
      agent={agent}
      data={EMAIL}
      onAnswer={() => Promise.reject(new Error("x"))}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Allow once" }));
  await expect
    .element(screen.getByText("Couldn't send your answer. Try again."))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Allow once" }))
    .toBeEnabled();
});

test("settled requests become one line: primary ✓, muted ⊘ with the way on, Undo when undoable", async () => {
  const onUndo = vi.fn();
  const screen = await render(
    <>
      <ChatRequestCard
        agent={agent}
        onAnswer={async () => {}}
        onUndo={onUndo}
        data={{
          ...EMAIL,
          state: "answered",
          answer: {
            choiceId: "always:recipient",
            byName: "you",
            at: "",
            undoable: true,
          },
        }}
      />
      <RequestLine
        data={{
          ...EMAIL,
          title: "Share “Comparison” with sm@vegastack.com",
          state: "refused",
          refusal: {
            words: "sharing outside the workspace needs an admin's OK",
            way: { label: "Ask an admin", href: "#admin" },
          },
        }}
      />
    </>,
  );
  const lines = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="request-line"]',
  );
  expect(lines[0]!.textContent).toContain(
    "Always allowed for sm@vegastack.com · Email sm@vegastack.com",
  );
  expect(
    lines[0]!
      .querySelector('[data-slot="status-glyph"]')!
      .getAttribute("class"),
  ).toContain("text-check");
  await userEvent.click(screen.getByRole("button", { name: "Undo ›" }));
  expect(onUndo).toHaveBeenCalledOnce();
  expect(lines[1]!.textContent).toContain(
    "Didn't share “Comparison” with sm@vegastack.com: sharing outside",
  );
  expect(
    lines[1]!
      .querySelector('[data-slot="status-glyph"]')!
      .getAttribute("class"),
  ).toContain("text-muted-foreground");
  await expect
    .element(screen.getByRole("link", { name: "Ask an admin ›" }))
    .toHaveAttribute("href", "#admin");
});

const bundle = (n: number): RequestData => ({
  ...EMAIL,
  interactionId: `b${n}`,
  kind: "web_open",
  title: `Open site${n}.com`,
  from: { subagentTitle: `Maker ${n}`, callId: `c${n}` },
  offer: {
    choices: [
      { id: "once", label: "Allow once" },
      {
        id: `always:site${n}`,
        label: "Always allow",
        scope: {
          kind: "site",
          value: `site${n}.com`,
          label: `for site${n}.com`,
        },
      },
      { id: "never", label: "Never allow this" },
      { id: "decline", label: "Decline" },
    ],
    bundle: {
      key: "b",
      count: 4,
      choices: [
        { id: "once", label: "Allow once" },
        {
          id: "always:exact",
          label: "Always allow",
          scope: { kind: "exact", value: "", label: "" },
        },
        { id: "never", label: "Never allow this" },
        { id: "decline", label: "Decline" },
      ],
    },
  },
});

test("a bundle answers all at once, or each row on its own after Choose each", async () => {
  const onAnswerAll = vi.fn(async () => {});
  const onAnswer = vi.fn(async () => {});
  const screen = await render(
    <RequestBundleCard
      agent={agent}
      items={[1, 2, 3, 4].map(bundle)}
      onAnswerAll={onAnswerAll}
      onAnswer={onAnswer}
    />,
  );
  await expect
    .element(screen.getByText("William needs 4 answers"))
    .toBeInTheDocument();
  await expect.element(screen.getByText("for “Maker 3”")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Always allow these sites" }),
  );
  expect(onAnswerAll).toHaveBeenCalledWith("always:exact");
  expect(onAnswerAll).toHaveBeenCalledOnce();
  await expect
    .element(screen.getByRole("button", { name: "Never allow these" }))
    .toBeInTheDocument();
});

test("Choose each answers a row on its own, carries a decline note, and holds the answers for all meanwhile", async () => {
  const onAnswerAll = vi.fn(async () => {});
  const onAnswer = vi.fn(() => new Promise<void>(() => {}));
  const screen = await render(
    <RequestBundleCard
      agent={agent}
      items={[1, 2, 3, 4].map(bundle)}
      onAnswerAll={onAnswerAll}
      onAnswer={onAnswer}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Choose each" }));
  await userEvent.click(screen.getByRole("button", { name: "Decline" }).nth(2));
  await userEvent.click(
    screen.getByRole("menuitem", { name: /Decline with a note/ }),
  );
  await userEvent.fill(screen.getByRole("textbox"), "Not needed");
  await userEvent.keyboard("{Enter}");
  expect(onAnswer).toHaveBeenCalledWith("b3", "decline", "Not needed");
  await expect
    .element(screen.getByRole("button", { name: "Answer all together" }))
    .toBeDisabled();
  await userEvent.click(
    screen.getByRole("button", { name: "Allow once" }).nth(1),
  );
  expect(onAnswer).toHaveBeenCalledWith("b2", "once", undefined);
  expect(onAnswerAll).not.toHaveBeenCalled();
});

test("no a11y violations — open, once-only, bundle and lines", async () => {
  const screen = await render(
    <div>
      <ChatRequestCard agent={agent} data={EMAIL} onAnswer={async () => {}} />
      <ChatRequestCard
        agent={agent}
        data={ONCE_ONLY}
        onAnswer={async () => {}}
      />
      <RequestBundleCard
        items={[1, 2].map(bundle)}
        onAnswerAll={async () => {}}
        onAnswer={async () => {}}
      />
      <RequestLine data={{ ...EMAIL, state: "expired" }} />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("an answer for all holds only the asks it covered; a later ask arrives free", async () => {
  const onAnswerAll = vi.fn(async () => {});
  const asks = [1, 2].map(bundle);
  const screen = await render(
    <RequestBundleCard
      agent={agent}
      items={asks}
      onAnswerAll={onAnswerAll}
      onAnswer={async () => {}}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Allow all once" }));
  await expect
    .element(screen.getByRole("button", { name: "Allow all once" }))
    .toBeDisabled();
  const settled = asks.map((ask) => ({
    ...ask,
    state: "answered" as const,
    answer: { choiceId: "once", byName: "you", at: "", undoable: false },
  }));
  await screen.rerender(
    <RequestBundleCard
      agent={agent}
      items={[...settled, bundle(3)]}
      onAnswerAll={onAnswerAll}
      onAnswer={async () => {}}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Allow all once" }))
    .toBeEnabled();
});

test("a late failure of an answer whose asks already settled can't free a newer answer", async () => {
  const rejects: (() => void)[] = [];
  const onAnswerAll = vi.fn(
    () =>
      new Promise<void>((_, reject) =>
        rejects.push(() => reject(new Error("late"))),
      ),
  );
  const asks = [1, 2].map(bundle);
  const props = { agent, onAnswerAll, onAnswer: async () => {} };
  const screen = await render(<RequestBundleCard items={asks} {...props} />);
  await userEvent.click(screen.getByRole("button", { name: "Allow all once" }));
  const settled = asks.map((ask) => ({
    ...ask,
    state: "answered" as const,
    answer: { choiceId: "once", byName: "you", at: "", undoable: false },
  }));
  await screen.rerender(
    <RequestBundleCard items={[...settled, bundle(3)]} {...props} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Allow all once" }));
  expect(onAnswerAll).toHaveBeenCalledTimes(2);
  rejects[0]!();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await expect
    .element(screen.getByRole("button", { name: "Allow all once" }))
    .toBeDisabled();
});

test("quotes the exact words it would send under the subject, line breaks kept", async () => {
  const screen = await render(
    <ChatRequestCard
      data={{
        ...EMAIL,
        quote:
          "To: sm@vegastack.com\nSubject: Weekly summary\n\nHi Simran,\nhere it is.",
      }}
      agent={agent}
      onAnswer={vi.fn()}
    />,
  );
  const quote = screen.container.querySelector<HTMLElement>(
    "[data-slot=request-quote]",
  )!;
  expect(quote.tagName).toBe("BLOCKQUOTE");
  expect(quote.tabIndex).toBe(0);
  expect(quote.textContent).toBe(
    "To: sm@vegastack.com\nSubject: Weekly summary\n\nHi Simran,\nhere it is.",
  );
  await expectNoA11yViolations(screen.container);
});

test("a reason shows whole under the subject while open; a long Always scope wraps and the menu stays narrow", async () => {
  const reason = "Auto-check asked: the recipient isn't one anyone named.";
  const scope =
    "Saves: William may email anyone at vegastack.com without asking, in any chat.";
  const data: RequestData = {
    ...EMAIL,
    offer: {
      choices: [
        { id: "once", label: "Allow once" },
        {
          id: "always:domain",
          label: "Always allow",
          scope: { kind: "domain", value: "vegastack.com", label: scope },
        },
        { id: "decline", label: "Decline" },
      ],
    },
  };
  await page.viewport(390, 844);
  const screen = await render(
    <div style={{ width: 390 }}>
      <ChatRequestCard
        agent={agent}
        data={data}
        reason={reason}
        onAnswer={async () => {}}
      />
    </div>,
  );
  const line = screen.container.querySelector<HTMLElement>(
    '[data-slot="request-reason"]',
  )!;
  expect(line.textContent).toBe(reason);
  expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth);
  await userEvent.click(screen.getByRole("button", { name: "Always allow" }));
  const hint = document.querySelector<HTMLElement>(
    '[data-slot="chat-menu-item-hint"]',
  )!;
  expect(hint.textContent).toBe(scope);
  // Two lines at most, nothing cut sideways, and the menu no wider than the phone.
  expect(hint.scrollWidth).toBeLessThanOrEqual(hint.clientWidth);
  expect(hint.getBoundingClientRect().height).toBeGreaterThan(20);
  const menu = document.querySelector<HTMLElement>(
    '[data-slot="chat-menu-content"]',
  )!;
  expect(menu.getBoundingClientRect().width).toBeLessThanOrEqual(320);
  expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(390);
  await userEvent.keyboard("{Escape}");
  await screen.rerender(
    <div style={{ width: 390 }}>
      <ChatRequestCard
        agent={agent}
        data={{
          ...data,
          state: "answered",
          answer: { choiceId: "once", byName: "you", at: "", undoable: false },
        }}
        reason={reason}
        onAnswer={async () => {}}
      />
    </div>,
  );
  expect(
    screen.container.querySelector('[data-slot="request-reason"]'),
  ).toBeNull();
  expect(screen.container.textContent).not.toContain("Auto-check asked");
});
