import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Inbox,
  InboxEmphasis,
  InboxError,
  InboxFilters,
  InboxGroup,
  InboxItem,
} from "./inbox";

test("groups are named lists, rows are links, and the read toggle is reachable", async () => {
  const onToggleRead = vi.fn();
  const screen = await render(
    <Inbox filters={<InboxFilters value="for-you" onValueChange={() => {}} />}>
      <InboxGroup label="Today">
        <InboxItem
          unread
          avatar={{ name: "Asha Kumar" }}
          title={
            <>
              <InboxEmphasis>Asha</InboxEmphasis> assigned you a task
            </>
          }
          href="/tasks/1"
          onToggleRead={onToggleRead}
        />
      </InboxGroup>
    </Inbox>,
  );
  const list = screen.getByRole("list", { name: "Today" });
  await expect
    .element(
      list.getByRole("link", { name: /Unread: Asha assigned you a task/ }),
    )
    .toHaveAttribute("href", "/tasks/1");
  await screen.getByRole("button", { name: "Mark read" }).click();
  expect(onToggleRead).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("an unread row shows a dot, a read row none; the badge sits on the avatar, hidden from the name", async () => {
  const screen = await render(
    <InboxGroup label="Today">
      <InboxItem
        unread
        avatar={{ name: "Asha Kumar" }}
        badge={<svg data-testid="kind" />}
        title="Asha mentioned you"
        href="/tasks/1"
      />
      <InboxItem
        avatar={{ name: "Raj Patel" }}
        title="Raj commented"
        href="/tasks/2"
      />
    </InboxGroup>,
  );
  const [unread, read] = Array.from(
    screen.container.querySelectorAll('[data-slot="inbox-item"]'),
  );
  const dot = unread!.querySelector('[data-slot="inbox-item-unread"]');
  expect(dot).not.toBeNull();
  expect(dot).toHaveAttribute("aria-hidden", "true");
  expect(read!.querySelector('[data-slot="inbox-item-unread"]')).toBeNull();
  const badge = unread!.querySelector('[data-slot="inbox-item-badge"]');
  expect(badge?.querySelector('[data-testid="kind"]')).not.toBeNull();
  expect(badge?.closest('[aria-hidden="true"]')).not.toBeNull();
  await expect
    .element(screen.getByRole("link", { name: "Unread: Asha mentioned you" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("the error state offers Try again", async () => {
  const onRetry = vi.fn();
  const screen = await render(<InboxError onRetry={onRetry} />);
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onRetry).toHaveBeenCalledOnce();
});

test("InboxFilters: For you · Updates · Archived tabs, and no Unread toggle (T31)", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <InboxFilters value="for-you" onValueChange={onValueChange} />,
  );
  const tabs = screen.getByRole("tablist", { name: "Show" });
  const names = Array.from(
    tabs.element().querySelectorAll('[role="tab"]'),
    (tab) => tab.textContent,
  );
  expect(names).toEqual(["For you", "Updates", "Archived"]);
  await expect
    .element(tabs.getByRole("tab", { name: "For you" }))
    .toHaveAttribute("aria-selected", "true");
  await tabs.getByRole("tab", { name: "Archived" }).click();
  expect(onValueChange).toHaveBeenCalledWith("archived");
  expect(
    screen.container.querySelectorAll("button[aria-pressed]"),
  ).toHaveLength(0);
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("InboxFilters: app tabs carry counts", async () => {
  const screen = await render(
    <InboxFilters
      value="mentions"
      onValueChange={() => {}}
      tabs={[
        { value: "for-you", label: "For you", count: 4 },
        { value: "mentions", label: "Mentions", count: 2 },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("tab", { name: "Mentions 2" }))
    .toHaveAttribute("aria-selected", "true");
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("a grouped row stacks its actors and expands to its events", async () => {
  const screen = await render(
    <InboxGroup label="Today">
      <InboxItem
        title="#39 Agent link RCA test"
        actors={[
          { name: "Sanjay Desai" },
          { name: "Arjun Mehta" },
          { name: "Asha Kumar" },
          { name: "Kavya Nair" },
        ]}
        count={9}
        events={[
          { id: "a", actor: { name: "Sanjay Desai" }, text: "commented" },
          { id: "b", actor: null, text: "Status changed to Done" },
        ]}
        meta="Sanjay commented"
        href="/tasks/39"
      />
    </InboxGroup>,
  );
  const actors = screen.container.querySelector(
    '[data-slot="inbox-item-actors"]',
  )!;
  expect(actors.querySelectorAll('[data-slot="avatar"]')).toHaveLength(3);
  expect(actors.textContent).toContain("+1");
  expect(actors.querySelector(".sr-only")?.textContent).toBe(
    "Sanjay Desai, Arjun Mehta, Asha Kumar, Kavya Nair",
  );
  const toggle = screen.getByRole("button", { name: "9 updates" });
  await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
  const list = screen.container.querySelector(
    '[data-slot="inbox-item-events"]',
  ) as HTMLElement;
  expect(toggle.element().getAttribute("aria-controls")).toBe(list.id);
  expect(list.hidden).toBe(true);
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  expect(list.hidden).toBe(false);
  expect(list.querySelectorAll("li")).toHaveLength(2);
  expect(list.textContent).toContain("Sanjay Desai commented");
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("a count without events reads through countLabel and is not a button", async () => {
  const screen = await render(
    <InboxGroup label="Today">
      <InboxItem
        title="Raj assigned you 3 tasks"
        count={3}
        countLabel={(n) => `${n} tasks`}
        href="/tasks"
      />
      <InboxItem title="One event" count={1} href="/one" />
    </InboxGroup>,
  );
  const counts = screen.container.querySelectorAll(
    '[data-slot="inbox-item-count"]',
  );
  expect(counts).toHaveLength(1);
  expect(counts[0]!.tagName).toBe("SPAN");
  expect(counts[0]!.textContent).toBe("3 tasks");
});

test("a pending request shows Allow / Decline; an answered one its line instead", async () => {
  const onAllow = vi.fn();
  const actions = [
    { label: "Allow", variant: "primary" as const, onClick: onAllow },
    { label: "Decline", onClick: () => {} },
  ];
  const screen = await render(
    <InboxGroup label="Today">
      <InboxItem
        title="Arjun wants access"
        status="pending"
        answeredLabel="Granted by Sanjay · 5d"
        actions={actions}
      />
      <InboxItem
        title="Asha wanted access"
        status="answered"
        answeredLabel="Granted by Sanjay · 5d"
        actions={actions}
      />
    </InboxGroup>,
  );
  const [pending, answered] = Array.from(
    screen.container.querySelectorAll('[data-slot="inbox-item"]'),
  );
  expect(pending).toHaveAttribute("data-status", "pending");
  // T32: a row's main action (`primary`) is secondary and the rest outline — never filled.
  expect(
    screen.getByRole("button", { name: "Allow" }).element(),
  ).toHaveAttribute("data-variant", "secondary");
  expect(
    screen.getByRole("button", { name: "Decline" }).element(),
  ).toHaveAttribute("data-variant", "outline");
  await screen.getByRole("button", { name: "Allow" }).click();
  expect(onAllow).toHaveBeenCalledOnce();
  expect(answered!.querySelector("button")).toBeNull();
  expect(
    answered!.querySelector('[data-slot="inbox-item-answered"]')?.textContent,
  ).toBe("Granted by Sanjay · 5d");
  expect(
    pending!.querySelector('[data-slot="inbox-item-answered"]'),
  ).toBeNull();
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("the row menu is named by menuLabel", async () => {
  const screen = await render(
    <InboxGroup label="Today">
      <InboxItem
        title="Raj commented"
        href="/tasks/2"
        menuLabel="Notification actions"
        menu={<span>Archive</span>}
      />
    </InboxGroup>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Notification actions" }))
    .toBeInTheDocument();
});

function Triage({
  onOpen,
  onActiveChange,
}: {
  onOpen?: (value: string) => void;
  onActiveChange?: (value: string) => void;
}) {
  return (
    <Inbox onOpen={onOpen} onActiveChange={onActiveChange}>
      <InboxGroup label="Today">
        <InboxItem value="a" title="First" href="#first" />
        <InboxItem value="b" title="Second" href="#second" />
        <InboxItem value="c" title="Third, no link" />
        <InboxItem title="Untracked" href="#untracked" />
      </InboxGroup>
    </Inbox>
  );
}

test("J / K walk the rows: focus follows, the active row is marked and scrolled into view", async () => {
  const onActiveChange = vi.fn();
  const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
  const screen = await render(<Triage onActiveChange={onActiveChange} />);
  const first = screen.getByRole("link", { name: "First" });
  (first.element() as HTMLElement).focus();

  await userEvent.keyboard("j");
  expect(onActiveChange).toHaveBeenLastCalledWith("a");
  await expect.element(first).toHaveAttribute("aria-current", "true");
  expect(document.activeElement).toBe(first.element());
  const rowA = first.element().closest('[data-slot="inbox-item"]')!;
  expect(rowA).toHaveAttribute("data-active");
  await expect.poll(() => scroll.mock.contexts.includes(rowA)).toBe(true);

  await userEvent.keyboard("j");
  expect(onActiveChange).toHaveBeenLastCalledWith("b");
  await expect
    .element(screen.getByRole("link", { name: "Second" }))
    .toHaveAttribute("aria-current", "true");
  await expect.element(first).not.toHaveAttribute("aria-current");
  expect(rowA).not.toHaveAttribute("data-active");

  // A row with no link takes focus itself; the untracked row is skipped.
  await userEvent.keyboard("{ArrowDown}");
  expect(onActiveChange).toHaveBeenLastCalledWith("c");
  const rowC = screen.container.querySelector('[data-value="c"]')!;
  expect(document.activeElement).toBe(rowC);
  expect(rowC).toHaveAttribute("aria-current", "true");
  await userEvent.keyboard("j");
  expect(onActiveChange).toHaveBeenLastCalledWith("c");

  await userEvent.keyboard("k");
  expect(onActiveChange).toHaveBeenLastCalledWith("b");
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
  scroll.mockRestore();
});

test("Enter and a plain click open the row in place; a modified click keeps the link", async () => {
  const onOpen = vi.fn();
  const screen = await render(<Triage onOpen={onOpen} />);
  const before = window.location.hash;
  const first = screen.getByRole("link", { name: "First" });
  (first.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  expect(onOpen).toHaveBeenLastCalledWith("a");
  expect(window.location.hash).toBe(before);

  (
    screen.getByRole("link", { name: "Second" }).element() as HTMLElement
  ).click();
  expect(onOpen).toHaveBeenLastCalledWith("b");
  expect(window.location.hash).toBe(before);
  await expect
    .element(screen.getByRole("link", { name: "Second" }))
    .toHaveAttribute("aria-current", "true");

  // A row with no link opens through its title, a button, on Enter and on a click.
  const third = screen.getByRole("button", { name: "Third, no link" });
  (third.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  expect(onOpen).toHaveBeenLastCalledWith("c");
  await expect.element(third).toHaveAttribute("aria-current", "true");
  onOpen.mockClear();
  screen.container.querySelector<HTMLElement>('[data-value="c"]')!.click();
  expect(onOpen).toHaveBeenCalledWith("c");
  await expectNoA11yViolations(screen.container, ["color-contrast"]);

  // A modified click is the browser's (a new tab): no open.
  onOpen.mockClear();
  const link = screen.getByRole("link", { name: "First" }).element();
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    metaKey: true,
  });
  link.addEventListener("click", (e) => e.preventDefault(), { once: true });
  link.dispatchEvent(event);
  expect(onOpen).not.toHaveBeenCalled();
});

test("J / K work inside a sheet that holds the Inbox; a linkless row that opens is a button", async () => {
  const onActiveChange = vi.fn();
  const screen = await render(
    <div role="dialog" aria-label="Inbox panel">
      <Triage onOpen={() => {}} onActiveChange={onActiveChange} />
    </div>,
  );
  (
    screen.getByRole("link", { name: "First" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("j");
  expect(onActiveChange).toHaveBeenLastCalledWith("a");
  await userEvent.keyboard("jj");
  expect(onActiveChange).toHaveBeenLastCalledWith("c");
  const third = screen.getByRole("button", { name: "Third, no link" });
  expect(document.activeElement).toBe(third.element());
  await expect.element(third).toHaveAttribute("tabindex", "0");
});
