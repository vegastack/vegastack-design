import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ChatCard, ChatGroup, ChatRow, formatChatDuration } from "./chat-card";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

test("ChatCard: the COL-25 surface — faint fill, hairline, 12px corner, no shadow, the same in both themes", async () => {
  const screen = await render(
    <ChatCard title="Send this email?" meta="Gmail" aside={<span>⋯</span>}>
      Weekly summary.
    </ChatCard>,
  );
  const card = slot(screen.container, "chat-card")!;
  expect(card.tagName).toBe("SECTION");
  for (const cls of [
    "bg-chat-card",
    "border-chat-hairline",
    "rounded-chat-card",
    "p-4",
    "max-sm:p-3",
  ])
    expect(card.classList.contains(cls)).toBe(true);
  expect(card.className).not.toMatch(/shadow|dark:/);
  expect(slot(card, "chat-card-title")?.textContent).toBe("Send this email?");
  expect(slot(card, "chat-card-meta")?.textContent).toBe("Gmail");
  expect(slot(card, "chat-card-aside")?.textContent).toBe("⋯");
  expect(slot(card, "chat-card-body")?.textContent).toBe("Weekly summary.");
});

test("ChatCard: every part renders only when given; `as` picks the element", async () => {
  const bare = await render(<ChatCard as="div">Only a body</ChatCard>);
  const card = slot(bare.container, "chat-card")!;
  expect(card.tagName).toBe("DIV");
  expect(slot(card, "chat-card-header")).toBeNull();
  expect(slot(card, "chat-card-actions")).toBeNull();
  expect(slot(card, "chat-card-footnote")).toBeNull();
  const full = await render(
    <ChatCard
      title="Plan"
      actions={<button type="button">Approve</button>}
      footnote="Only you can see this"
    />,
  );
  expect(slot(full.container, "chat-card-actions")).not.toBeNull();
  expect(slot(full.container, "chat-card-footnote")?.textContent).toBe(
    "Only you can see this",
  );
  expect(slot(full.container, "chat-card-body")).toBeNull();
});

test("formatChatDuration: the chat's short durations", () => {
  expect(formatChatDuration(400)).toBe("<1s");
  expect(formatChatDuration(4_200)).toBe("4s");
  expect(formatChatDuration(60_000)).toBe("1m");
  expect(formatChatDuration(80_000)).toBe("1m 20s");
  expect(formatChatDuration(7_500_000)).toBe("2h 5m");
});

test("ChatRow: glyph, muted verb, subject, then meta and duration right after it", async () => {
  const screen = await render(
    <ChatRow
      status="done"
      verb="Searched"
      subject="Indian lighting makers"
      meta="8 results"
      durationMs={4_200}
    />,
  );
  const row = slot(screen.container, "chat-row")!;
  expect(row.dataset.status).toBe("done");
  expect(row.classList.contains("min-h-7")).toBe(true);
  expect(slot(row, "status-glyph")).not.toBeNull();
  expect(slot(row, "chat-row-verb")?.className).toContain(
    "text-muted-foreground",
  );
  expect(slot(row, "chat-row-subject")?.className).toContain("truncate");
  const meta = slot(row, "chat-row-meta")!;
  expect(meta.textContent).toBe("8 results 4s");
  expect(meta.className).toContain("tabular-nums");
  // G57: the subject does not grow, so the meta sits beside it rather than at the far edge.
  expect(slot(row, "chat-row-subject")?.className).not.toContain("flex-1");
});

test("ChatRow: onOpen makes a button and href a link, each on the hover layer", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <>
      <ChatRow verb="Opened" subject="Quote sheet" onOpen={onOpen} />
      <ChatRow verb="Opened" subject="regentlighting.com" href="#site" />
    </>,
  );
  const button = screen.getByRole("button", { name: "Opened Quote sheet" });
  await userEvent.click(button);
  expect(onOpen).toHaveBeenCalledOnce();
  expect(button.element().className).toContain("state-layer");
  const link = screen.getByRole("link", { name: "Opened regentlighting.com" });
  expect(link.element().getAttribute("href")).toBe("#site");
});

test("ChatGroup: a closed fold with a summary and a chevron; it opens on click", async () => {
  const onOpenChange = vi.fn();
  const screen = await render(
    <ChatGroup summary="Worked for 41s" onOpenChange={onOpenChange}>
      <ChatRow verb="Searched" subject="makers" />
    </ChatGroup>,
  );
  const trigger = screen.getByRole("button", { name: "Worked for 41s" });
  expect(trigger.element().getAttribute("aria-expanded")).toBe("false");
  expect(slot(screen.container, "chat-group-content")).toBeNull();
  await userEvent.click(trigger);
  expect(onOpenChange).toHaveBeenCalledWith(true);
  await expect
    .poll(() => slot(screen.container, "chat-group-content"))
    .not.toBeNull();
  const content = slot(screen.container, "chat-group-content")!;
  // The fold's height motion is Collapsible's (MOT-14).
  expect(content.className).toContain("duration-state");
  expect(
    slot(screen.container, "collapsible-content-body")?.className,
  ).toContain("border-chat-hairline");
});

test("ChatGroup: live leads with the braille spinner; guide={false} drops the hairline", async () => {
  const screen = await render(
    <ChatGroup summary="Searching" live defaultOpen guide={false}>
      <ChatRow subject="one" />
    </ChatGroup>,
  );
  expect(slot(screen.container, "chat-group")?.dataset.live).toBe("");
  expect(slot(screen.container, "text-spinner")).not.toBeNull();
  expect(
    slot(screen.container, "collapsible-content-body")?.className,
  ).not.toContain("border-chat-hairline");
});

test("no a11y violations — card, rows and an open group", async () => {
  const screen = await render(
    <div>
      <ChatCard title="Plan" meta="4 steps">
        <ChatRow status="pending" subject="Find makers" />
      </ChatCard>
      <ChatGroup summary="Worked for 41s" defaultOpen>
        <ChatRow verb="Searched" subject="makers" onOpen={() => {}} />
      </ChatGroup>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
