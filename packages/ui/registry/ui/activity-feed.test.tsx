import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ActivityEvent,
  ActivityEventGroup,
  ActivityFeed,
  ActivityFeedItem,
  ActivityFeedList,
  ActivityFeedSkeleton,
  ActivityJumpToLatest,
  ActivityKindIcon,
  ActivityUnreadDivider,
  ActivityValue,
  useActivityFeedKeyboard,
} from "./activity-feed";
import { CommentThread } from "./comments";

const NOW = Date.parse("2026-10-04T12:00:00Z");
const HOUR = 3_600_000;
const priya = {
  name: "Priya Shah",
  email: "priya@acme.com",
  hue: "blue" as const,
};

test("the header shows the count, the filter and the order toggle, and reports changes", async () => {
  const onFilterChange = vi.fn();
  const onOrderChange = vi.fn();
  const screen = await render(
    <ActivityFeed
      count={3}
      filter="all"
      onFilterChange={onFilterChange}
      order="oldest"
      onOrderChange={onOrderChange}
    >
      <ActivityFeedList />
    </ActivityFeed>,
  );
  await expect
    .element(screen.getByRole("heading", { name: /^Activity\s*3$/ }))
    .toBeVisible();
  await screen.getByRole("button", { name: "Oldest first" }).click();
  expect(onOrderChange).toHaveBeenCalledWith("newest");
  await screen.getByRole("combobox", { name: "Show" }).click();
  await screen.getByRole("option", { name: "Comments" }).click();
  expect(onFilterChange).toHaveBeenCalledWith("comments");
});

test("an event shows its actor, value and time; icon='avatar' draws the actor", async () => {
  const screen = await render(
    <>
      <ActivityEvent
        actor={priya}
        icon={<ActivityKindIcon kind="status" />}
        date={NOW - 2 * HOUR}
        now={NOW}
      >
        changed status to <ActivityValue>Done</ActivityValue>
      </ActivityEvent>
      <ActivityEvent actor={priya} icon="avatar" date={NOW} now={NOW}>
        assigned <ActivityValue>Kavya Nair</ActivityValue>
      </ActivityEvent>
      <ActivityEvent actor={null} date={NOW} now={NOW}>
        archived the task
      </ActivityEvent>
    </>,
  );
  const [first, second, third] = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      "[data-slot=activity-event]",
    ),
  );
  expect(first!.textContent).toContain("Priya Shah");
  expect(first!.textContent).toContain("Done");
  expect(first!.querySelector("time")).not.toBeNull();
  expect(first!.querySelector("[data-slot=activity-kind-icon]")).not.toBeNull();
  expect(
    second!.querySelector("[data-slot=activity-event-icon] [data-slot=avatar]"),
  ).not.toBeNull();
  expect(third!.textContent).toContain("System");
  expect(
    first!.querySelector("[data-slot=person-hover-card-name]")?.textContent,
  ).toBe("Priya Shah");
});

test("a group folds to one event with 'N more changes' and unfolds to 'Show less'", async () => {
  const screen = await render(
    <ActivityEventGroup>
      {["one", "two", "three"].map((w) => (
        <ActivityEvent key={w} actor={priya} date={NOW} now={NOW}>
          edit {w}
        </ActivityEvent>
      ))}
    </ActivityEventGroup>,
  );
  const events = () =>
    screen.container.querySelectorAll("[data-slot=activity-event]").length;
  expect(events()).toBe(1);
  const toggle = screen.getByRole("button", { name: "2 more changes" });
  await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  expect(events()).toBe(3);
  await screen.getByRole("button", { name: "Show less" }).click();
  expect(events()).toBe(1);
});

test("the unread divider reports once when it is on screen", async () => {
  const onVisible = vi.fn();
  const screen = await render(<ActivityUnreadDivider onVisible={onVisible} />);
  await expect
    .element(screen.getByRole("separator", { name: "New" }))
    .toBeVisible();
  await vi.waitFor(() => expect(onVisible).toHaveBeenCalledTimes(1));
});

function KeyboardFeed({ onToggle }: { onToggle: (item: HTMLElement) => void }) {
  const ref = useActivityFeedKeyboard({ onToggle });
  return (
    <ActivityFeed ref={ref}>
      <input aria-label="Reply" />
      <ActivityFeedList>
        {["a", "b", "c"].map((id) => (
          <ActivityFeedItem key={id} id={id}>
            <ActivityEvent actor={priya} date={NOW} now={NOW}>
              did {id}
            </ActivityEvent>
          </ActivityFeedItem>
        ))}
      </ActivityFeedList>
    </ActivityFeed>
  );
}

test("J/K move the focused item, X toggles it, Esc clears, and typing in a field is ignored", async () => {
  const onToggle = vi.fn();
  const screen = await render(<KeyboardFeed onToggle={onToggle} />);
  const focused = () =>
    screen.container.querySelector(
      "[data-slot=activity-feed-item][data-focused]",
    )?.id;
  await userEvent.keyboard("j");
  expect(focused()).toBe("a");
  await userEvent.keyboard("jj");
  expect(focused()).toBe("c");
  await userEvent.keyboard("k");
  expect(focused()).toBe("b");
  await userEvent.keyboard("x");
  expect(onToggle).toHaveBeenCalledWith(screen.container.querySelector("#b"));
  await userEvent.keyboard("{Escape}");
  expect(focused()).toBeUndefined();
  await screen.getByRole("textbox", { name: "Reply" }).click();
  await userEvent.keyboard("j");
  expect(focused()).toBeUndefined();
});

test("a full feed — events, a group, a thread, the New line, jump button — is axe-clean", async () => {
  const screen = await render(
    <ActivityFeed count={1} onFilterChange={() => {}} onOrderChange={() => {}}>
      <ActivityFeedList>
        <ActivityFeedItem>
          <ActivityEvent
            actor={priya}
            icon={<ActivityKindIcon kind="created" />}
            date={NOW - 5 * HOUR}
            now={NOW}
          >
            created the task
          </ActivityEvent>
        </ActivityFeedItem>
        <ActivityFeedItem>
          <ActivityEventGroup>
            <ActivityEvent actor={priya} date={NOW - 4 * HOUR} now={NOW}>
              set priority to <ActivityValue>High</ActivityValue>
            </ActivityEvent>
            <ActivityEvent actor={priya} date={NOW - 4 * HOUR} now={NOW}>
              set due date to <ActivityValue>Oct 9</ActivityValue>
            </ActivityEvent>
          </ActivityEventGroup>
        </ActivityFeedItem>
        <ActivityFeedItem kind="divider">
          <ActivityUnreadDivider />
        </ActivityFeedItem>
        <ActivityFeedItem kind="thread">
          <CommentThread
            now={NOW}
            thread={{
              id: "t1",
              root: {
                id: "c1",
                author: { name: "Kavya Nair" },
                body: "Looks good.",
                createdAt: NOW - HOUR,
              },
              replies: [],
            }}
          />
        </ActivityFeedItem>
      </ActivityFeedList>
      <ActivityJumpToLatest />
    </ActivityFeed>,
  );
  await expect.element(screen.getByText("Looks good.")).toBeVisible();
  await expectNoA11yViolations(screen.container);
  const skeleton = await render(<ActivityFeedSkeleton />);
  expect(
    skeleton.container.querySelector("[data-slot=activity-feed-skeleton]"),
  ).not.toBeNull();
});

test("pending dims the list and marks the section busy; an agent's event says Agent", async () => {
  const screen = await render(
    <ActivityFeed pending>
      <ActivityFeedList>
        <ActivityFeedItem>
          <ActivityEvent actor={priya} agent date={NOW - HOUR} now={NOW}>
            set priority to <ActivityValue>High</ActivityValue>
          </ActivityEvent>
        </ActivityFeedItem>
      </ActivityFeedList>
    </ActivityFeed>,
  );
  const section = screen.container.querySelector(
    '[data-slot="activity-feed"]',
  )!;
  expect(section.getAttribute("aria-busy")).toBe("true");
  expect(section.hasAttribute("data-pending")).toBe(true);
  await expect
    .element(screen.getByText("Agent", { exact: true }))
    .toBeVisible();
});

test("Jump to latest shows while the end is off screen, scrolls there and takes focus with it", async () => {
  const screen = await render(
    <div style={{ height: 200, overflowY: "auto" }} data-testid="scroller">
      <ActivityFeed>
        <ActivityFeedList>
          {Array.from({ length: 30 }, (_, i) => (
            <ActivityFeedItem key={i}>
              <ActivityEvent actor={priya} date={NOW - i * HOUR} now={NOW}>
                changed something {i}
              </ActivityEvent>
            </ActivityFeedItem>
          ))}
        </ActivityFeedList>
        <ActivityJumpToLatest />
      </ActivityFeed>
    </div>,
  );
  const floating = () =>
    screen.container.querySelector('[data-slot="activity-jump-floating"]')!;
  await vi.waitFor(() =>
    expect(floating().hasAttribute("data-shown")).toBe(true),
  );
  await screen.getByRole("button", { name: "Jump to latest" }).click();
  const end = screen.container.querySelector(
    '[data-slot="activity-feed-end"]',
  )!;
  await vi.waitFor(() => expect(document.activeElement).toBe(end));
  await vi.waitFor(() =>
    expect(floating().hasAttribute("data-shown")).toBe(false),
  );
});

test("keys already handled elsewhere are left alone, and X never acts on an item that left", async () => {
  const onToggle = vi.fn();
  function Feed({ items }: { items: number[] }) {
    const ref = useActivityFeedKeyboard({ onToggle });
    return (
      <ActivityFeed ref={ref as React.RefObject<HTMLElement>}>
        <ActivityFeedList>
          {items.map((i) => (
            <ActivityFeedItem key={i}>item {i}</ActivityFeedItem>
          ))}
        </ActivityFeedList>
      </ActivityFeed>
    );
  }
  const screen = await render(<Feed items={[1, 2]} />);
  const handled = (event: KeyboardEvent) => event.preventDefault();
  document.addEventListener("keydown", handled, { capture: true });
  await userEvent.keyboard("j");
  expect(screen.container.querySelector("[data-focused]")).toBeNull();
  document.removeEventListener("keydown", handled, { capture: true });
  await userEvent.keyboard("j");
  expect(screen.container.querySelector("[data-focused]")?.textContent).toBe(
    "item 1",
  );
  await screen.rerender(<Feed items={[2]} />);
  await userEvent.keyboard("x");
  expect(onToggle).not.toHaveBeenCalled();
});
