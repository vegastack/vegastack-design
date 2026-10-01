import { render } from "vitest-browser-react";
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
    <Inbox
      filters={
        <InboxFilters value="all" onValueChange={() => {}} unreadCount={1} />
      }
    >
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

test("the error state offers Try again", async () => {
  const onRetry = vi.fn();
  const screen = await render(<InboxError onRetry={onRetry} />);
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onRetry).toHaveBeenCalledOnce();
});

test("InboxFilters: extra chips follow All and Unread, with their counts", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <InboxFilters
      value="requests"
      onValueChange={onValueChange}
      unreadCount={3}
      extra={[
        { value: "requests", label: "Requests", count: 2 },
        { value: "mentions", label: "Mentions" },
      ]}
    />,
  );
  const group = screen.getByRole("group", { name: "Show" });
  const chips = Array.from(
    group.element().querySelectorAll("button"),
    (chip) => chip.textContent,
  );
  expect(chips).toEqual(["All", "Unread 3", "Requests 2", "Mentions"]);
  await expect
    .element(group.getByRole("button", { name: "Requests 2" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(group.getByRole("button", { name: "All" }))
    .toHaveAttribute("aria-pressed", "false");
  await group.getByRole("button", { name: "Mentions" }).click();
  expect(onValueChange).toHaveBeenCalledWith("mentions");
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});
