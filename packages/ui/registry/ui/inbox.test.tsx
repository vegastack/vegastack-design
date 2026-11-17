import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DropdownMenuItem } from "./dropdown-menu";
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

test("a meta line that repeats the title is dropped, and the row is marked one-line", async () => {
  const screen = await render(
    <Inbox>
      <InboxGroup label="Today">
        <InboxItem
          value="a"
          avatar={{ name: "Asha Kumar" }}
          title={
            <>
              <InboxEmphasis>Asha</InboxEmphasis> commented on Pricing
            </>
          }
          meta="Asha commented"
          time={new Date()}
          onToggleRead={() => {}}
        />
        <InboxItem
          value="b"
          avatar={{ name: "Ravi Rao" }}
          title="Ravi assigned you Pricing"
          meta="Due tomorrow"
        />
        <InboxItem value="c" title="Joanne joined Pricing" meta="Ann" />
        <InboxItem
          value="d"
          title="Ravi commented on Pricing"
          meta={
            <>
              Ravi <InboxEmphasis>commented</InboxEmphasis>
            </>
          }
        />
      </InboxGroup>
    </Inbox>,
  );
  const rows = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="inbox-item"]',
  );
  await expect.poll(() => rows.length).toBe(4);
  // The title's line only: no meta line under it.
  expect(rows[0]!.querySelectorAll("p").length).toBe(1);
  expect(rows[0]!.hasAttribute("data-single-line")).toBe(true);
  expect(rows[1]!.querySelectorAll("p").length).toBe(2);
  expect(rows[1]!.textContent).toContain("Due tomorrow");
  expect(rows[1]!.hasAttribute("data-single-line")).toBe(false);
  // Whole words only, and never a meta it cannot read in full (a component may render more).
  expect(rows[2]!.querySelectorAll("p").length).toBe(2);
  expect(rows[3]!.querySelectorAll("p").length).toBe(2);
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

test("an event with its own href is a link above the row that opens that record, not the row", async () => {
  const openedRow: string[] = [];
  const openedEvent: string[] = [];
  const screen = await render(
    <Inbox onOpen={(key) => openedRow.push(key)}>
      <InboxGroup label="Today">
        <InboxItem
          value="batch"
          title="Neha completed 2 tasks you follow"
          count={2}
          countLabel={(n) => `${n} tasks`}
          events={[
            {
              id: "a",
              text: "Fix driver",
              href: "/tasks/a",
              onOpen: () => openedEvent.push("a"),
            },
            { id: "b", text: "Order samples", href: "/tasks/b" },
          ]}
        />
      </InboxGroup>
    </Inbox>,
  );
  await screen.getByRole("button", { name: "2 tasks" }).click();
  const link = screen.getByRole("link", { name: "Fix driver" });
  await expect.element(link).toHaveAttribute("href", "/tasks/a");
  await link.click();
  expect(openedEvent).toEqual(["a"]);
  expect(openedRow).toEqual([]);
  await expect
    .element(screen.getByRole("link", { name: "Order samples" }))
    .toHaveAttribute("data-slot", "inbox-item-event-link");
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

test("a page Inbox has no visible header, is named by its hidden title and pages from the viewport", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <Inbox
      layout="page"
      title={<span>Mentions</span>}
      onLoadMore={onLoadMore}
      hasMore
    >
      <InboxGroup label="Today">
        <InboxItem title="Asha mentioned you" href="/tasks/1" />
      </InboxGroup>
    </Inbox>,
  );
  await expect
    .element(screen.getByRole("region", { name: "Mentions" }))
    .toBeInTheDocument();
  expect(screen.container.querySelector("header")).toBeNull();
  await expect
    .element(screen.getByRole("heading", { name: "Mentions" }))
    .toHaveClass("sr-only");
  await vi.waitFor(() => expect(onLoadMore).toHaveBeenCalled());
});

/** A touch held on `target` for `ms`, ending in the click a release may send. */
async function longPress(target: Element, ms = 600, drift = 0) {
  const at = target.getBoundingClientRect();
  const x = at.left + 10;
  const y = at.top + 10;
  const fire = (type: string, dx = 0) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerType: "touch",
        isPrimary: true,
        clientX: x + dx,
        clientY: y,
      }),
    );
  fire("pointerdown");
  if (drift) fire("pointermove", drift);
  await new Promise((resolve) => setTimeout(resolve, ms));
  fire("pointerup", drift);
  target.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, detail: 1 }),
  );
  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }),
  );
}

test("on touch, a long press opens the row's menu and its trailing click neither opens the row nor closes the menu", async () => {
  const onOpen = vi.fn();
  const onArchive = vi.fn();
  const screen = await render(
    <Inbox onOpen={onOpen}>
      <InboxGroup label="Today">
        <InboxItem
          value="one"
          title="Asha assigned you a task"
          href="/tasks/1"
          menu={
            <DropdownMenuItem onClick={onArchive}>Archive</DropdownMenuItem>
          }
        />
      </InboxGroup>
    </Inbox>,
  );
  const link = screen.getByRole("link", { name: /Asha assigned you/ });
  await longPress(link.element());
  const archive = screen.getByRole("menuitem", { name: "Archive" });
  await expect.element(archive).toBeVisible();
  expect(onOpen).not.toHaveBeenCalled();
  // A keyboard's activation (a click with no pointer behind it) is never swallowed.
  archive
    .element()
    .dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 }),
    );
  expect(onArchive).toHaveBeenCalledOnce();
});

test("on touch, a press that moves is a scroll, not a long press", async () => {
  const screen = await render(
    <Inbox>
      <InboxGroup label="Today">
        <InboxItem
          value="one"
          title="Asha assigned you a task"
          menu={<DropdownMenuItem>Archive</DropdownMenuItem>}
        />
      </InboxGroup>
    </Inbox>,
  );
  await longPress(
    screen.getByText("Asha assigned you a task").element(),
    600,
    40,
  );
  expect(screen.getByRole("menuitem", { name: "Archive" }).query()).toBeNull();
});
