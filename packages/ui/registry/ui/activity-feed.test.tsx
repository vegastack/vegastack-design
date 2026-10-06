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
import "../../test/geometry.css";

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

test("combined changes stay visible with one actor and latest time, aligned when wrapping", async () => {
  const screen = await render(
    <div style={{ width: 320 }}>
      <ActivityEventGroup
        events={[
          {
            actor: priya,
            date: NOW - HOUR,
            now: NOW,
            children: (
              <>
                set priority to <ActivityValue>High</ActivityValue>
              </>
            ),
          },
          {
            actor: priya,
            date: NOW,
            now: NOW,
            children: (
              <>
                changed status from <ActivityValue>Open</ActivityValue> to{" "}
                <ActivityValue>Done</ActivityValue>
              </>
            ),
          },
        ]}
      />
    </div>,
  );
  await expect.element(screen.getByText("Done", { exact: true })).toBeVisible();
  const event = screen.container.querySelector('[data-slot="activity-event"]')!;
  expect(event.textContent).toContain("High; changed status");
  expect(
    event.querySelectorAll('[data-slot="person-hover-card-name"]'),
  ).toHaveLength(1);
  expect(event.querySelectorAll("time")).toHaveLength(1);
  expect(event.querySelector("time")?.getAttribute("datetime")).toBe(
    new Date(NOW).toISOString(),
  );
  expect(
    screen.container.querySelector('[data-slot="activity-event-group-toggle"]'),
  ).toBeNull();
  const actor = event
    .querySelector('[data-slot="person-hover-card-name"]')!
    .getBoundingClientRect();
  const icon = event
    .querySelector('[data-slot="activity-event-icon"] svg')!
    .getBoundingClientRect();
  expect(
    Math.abs(icon.y + icon.height / 2 - actor.y - actor.height / 2),
  ).toBeLessThan(1);
  expect(event.scrollWidth).toBeLessThanOrEqual(event.clientWidth);
  await expectNoA11yViolations(screen.container);
});

test("the unread divider reports once when it is on screen", async () => {
  const onVisible = vi.fn();
  const screen = await render(<ActivityUnreadDivider onVisible={onVisible} />);
  await expect
    .element(screen.getByRole("separator", { name: "New" }))
    .toBeVisible();
  await vi.waitFor(() => expect(onVisible).toHaveBeenCalledTimes(1));
});

test("a reset can page its new dataset while an obsolete cursor request is outstanding", async () => {
  let releaseOld!: () => void;
  const oldRequest = new Promise<void>((resolve) => {
    releaseOld = resolve;
  });
  function Resettable() {
    const [dataset, setDataset] = React.useState("A");
    const [loaded, setLoaded] = React.useState(false);
    return (
      <>
        <button type="button" onClick={() => setDataset("B")}>
          Switch dataset
        </button>
        <div
          data-testid="reset-scroll"
          style={{ height: 160, overflowY: "auto" }}
        >
          <ActivityFeed
            order="newest"
            paginationKey={`${dataset}:${loaded ? "end" : "cursor"}`}
            loadingMoreLabel="Fetching history…"
            retryMoreLabel="Try history again"
            loadMore={{
              hasMore: !loaded,
              onLoadMore: async () => {
                if (dataset === "A") {
                  await oldRequest;
                  return;
                }
                setLoaded(true);
              },
            }}
          >
            <ActivityFeedList>
              {Array.from({ length: 12 }, (_, i) => (
                <ActivityFeedItem key={i}>
                  <ActivityEvent actor={priya} date={NOW} now={NOW}>
                    current {dataset} entry {i}
                  </ActivityEvent>
                </ActivityFeedItem>
              ))}
              {loaded ? (
                <ActivityFeedItem>
                  <ActivityEvent actor={priya} date={NOW} now={NOW}>
                    older B entry
                  </ActivityEvent>
                </ActivityFeedItem>
              ) : null}
            </ActivityFeedList>
          </ActivityFeed>
        </div>
      </>
    );
  }
  const screen = await render(<Resettable />);
  const scroller = screen.container.querySelector<HTMLElement>(
    '[data-testid="reset-scroll"]',
  )!;
  scroller.scrollTop = scroller.scrollHeight;
  await expect
    .element(screen.getByRole("button", { name: "Fetching history…" }))
    .toBeVisible();
  await screen.getByRole("button", { name: "Switch dataset" }).click();
  await expect
    .element(screen.getByText("older B entry", { exact: false }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="activity-feed-more"]'),
  ).toBeNull();
  releaseOld();
  await vi.waitFor(() =>
    expect(screen.container.textContent).toContain("older B entry"),
  );
});

test("prepending a cursor page preserves the visible change even when its group joins older edits", async () => {
  function Joined() {
    const [loaded, setLoaded] = React.useState(false);
    const change = (id: number) => ({
      id: String(id),
      actor: priya,
      date: NOW + id * 1000,
      now: NOW,
      children: `Recorded change ${id}`,
    });
    const groups = loaded
      ? [
          [0, 30, 60, 90],
          [150, 210],
        ]
      : [[90, 150, 210]];
    return (
      <div
        data-testid="joined-scroll"
        style={{ height: 160, width: 320, overflowY: "auto" }}
      >
        <ActivityFeed
          paginationKey={loaded ? null : "older"}
          loadMore={{
            hasMore: !loaded,
            onLoadMore: async () => {
              setLoaded(true);
            },
          }}
        >
          <ActivityFeedList>
            {groups.map((group) => (
              <ActivityFeedItem key={group[0]}>
                <ActivityEventGroup events={group.map(change)} />
              </ActivityFeedItem>
            ))}
            {Array.from({ length: 12 }, (_, i) => (
              <ActivityFeedItem key={`tail-${i}`}>
                <ActivityEvent actor={priya} date={NOW} now={NOW}>
                  Later entry {i}
                </ActivityEvent>
              </ActivityFeedItem>
            ))}
          </ActivityFeedList>
        </ActivityFeed>
      </div>
    );
  }
  const screen = await render(<Joined />);
  const scroller = screen.container.querySelector<HTMLElement>(
    '[data-testid="joined-scroll"]',
  )!;
  scroller.scrollTop = 40;
  const top = screen.container
    .querySelector('[data-activity-id="90"]')!
    .getBoundingClientRect().top;
  await vi.waitFor(() =>
    expect(screen.container.textContent).toContain("Recorded change 0"),
  );
  expect(
    Math.abs(
      screen.container
        .querySelector('[data-activity-id="90"]')!
        .getBoundingClientRect().top - top,
    ),
  ).toBeLessThan(1);
});

test("cursor pages load at the scroll edge and a failed page requires a retry", async () => {
  function Paged() {
    const [cursor, setCursor] = React.useState<string | null>("earlier");
    const [attempted, setAttempted] = React.useState(false);
    const [older, setOlder] = React.useState(false);
    return (
      <div
        data-testid="scroll-history"
        style={{ height: 160, overflowY: "auto" }}
      >
        <ActivityFeed
          order="newest"
          paginationKey={cursor}
          loadMore={{
            hasMore: cursor !== null,
            onLoadMore: async () => {
              if (!attempted) {
                setAttempted(true);
                throw new Error("Temporary network failure");
              }
              setOlder(true);
              setCursor(null);
            },
          }}
        >
          <ActivityFeedList>
            {Array.from({ length: 12 }, (_, i) => (
              <ActivityFeedItem key={i}>
                <ActivityEvent actor={priya} date={NOW} now={NOW}>
                  recent change {i}
                </ActivityEvent>
              </ActivityFeedItem>
            ))}
            {older ? (
              <ActivityFeedItem>
                <ActivityEvent actor={priya} date={NOW - HOUR} now={NOW}>
                  earlier change
                </ActivityEvent>
              </ActivityFeedItem>
            ) : null}
          </ActivityFeedList>
        </ActivityFeed>
      </div>
    );
  }
  const screen = await render(<Paged />);
  expect(screen.container.textContent).not.toContain("earlier change");
  const scroller = screen.container.querySelector<HTMLElement>(
    '[data-testid="scroll-history"]',
  )!;
  scroller.scrollTop = scroller.scrollHeight;
  await expect
    .element(screen.getByRole("button", { name: "Retry loading earlier" }))
    .toBeVisible();
  expect(screen.container.textContent).not.toContain("earlier change");
  await screen.getByRole("button", { name: "Retry loading earlier" }).click();
  await expect
    .element(screen.getByText("earlier change", { exact: false }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="activity-feed-more"]'),
  ).toBeNull();
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
