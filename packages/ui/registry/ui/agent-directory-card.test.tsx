import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import {
  AgentDirectoryCard,
  AgentDirectoryCardSkeleton,
  type AgentDirectoryCardProps,
} from "./agent-directory-card";

const base: AgentDirectoryCardProps = {
  name: "Expense checker",
  href: "/agents/expense-checker",
  avatar: <span aria-hidden>E</span>,
  job: "Checks expense claims against the travel policy and flags what needs a receipt.",
  place: "Workspace · Finance team",
};

test("the name is the card's one link; Chat and examples are separate targets outside it", async () => {
  const onExample = vi.fn();
  const onChat = vi.fn();
  const screen = await render(
    <AgentDirectoryCard
      {...base}
      examples={["Check this week's claims", "Which lack a receipt?", "Third"]}
      onExample={onExample}
      chat={{ onClick: onChat }}
      actions={<button type="button" aria-label="More for Expense checker" />}
    />,
  );
  const link = page.getByRole("link", { name: "Expense checker" });
  await expect.element(link).toHaveAttribute("href", "/agents/expense-checker");
  const anchor = screen.container.querySelector("a")!;
  expect(anchor.querySelector("button, a")).toBeNull();
  expect(
    screen.container.querySelectorAll(
      '[data-slot="agent-directory-card-examples"] li',
    ),
  ).toHaveLength(2);
  await page.getByRole("button", { name: "“Which lack a receipt?”" }).click();
  expect(onExample).toHaveBeenCalledWith("Which lack a receipt?");
  await page.getByRole("button", { name: "Chat with Expense checker" }).click();
  expect(onChat).toHaveBeenCalled();
  const chat = screen.container.querySelector(
    '[data-slot="agent-directory-card-chat"]',
  )!;
  expect(chat.getAttribute("data-variant")).toBe("secondary");
  await expectNoA11yViolations(screen.container);
});

test("status, verified and apps: draft and paused badges, the verified words, four apps then +n", async () => {
  const app = (label: string) => ({ icon: <span>{label[0]}</span>, label });
  const screen = await render(
    <>
      <AgentDirectoryCard
        {...base}
        status="paused"
        verified={{ by: "Asha", at: "12 Nov", version: 4, changedSince: true }}
        apps={["Gmail", "Slack", "Drive", "GitHub", "Calendar", "Sheets"].map(
          app,
        )}
        chat={{ href: "/agents/expense-checker/chat" }}
      />
      <AgentDirectoryCard {...base} name="Draft agent" status="draft" />
    </>,
  );
  const [paused, draft] = screen.container.querySelectorAll(
    '[data-slot="agent-directory-card"]',
  );
  expect(paused!.getAttribute("data-status")).toBe("paused");
  expect(paused!.textContent).toContain("Paused");
  expect(draft!.textContent).toContain("Draft");
  await expect
    .element(
      page.getByRole("img", {
        name: "Verified by Asha · v4 · 12 Nov · changed since",
      }),
    )
    .toBeVisible();
  await expect
    .element(
      page.getByRole("img", {
        name: "Uses Gmail, Slack, Drive, GitHub, Calendar, Sheets",
      }),
    )
    .toBeVisible();
  expect(paused!.textContent).toContain("+2");
  await expect
    .element(page.getByRole("link", { name: "Chat with Expense checker" }))
    .toHaveAttribute("href", "/agents/expense-checker/chat");
  await expectNoA11yViolations(screen.container);
});

test("a router link renders through linkRender; the row layout and skeletons", async () => {
  const screen = await render(
    <>
      <AgentDirectoryCard
        {...base}
        layout="row"
        linkRender={<a data-router="" />}
      />
      <AgentDirectoryCardSkeleton />
      <AgentDirectoryCardSkeleton layout="row" />
    </>,
  );
  const row = screen.container.querySelector(
    '[data-slot="agent-directory-card"]',
  )!;
  expect(row.getAttribute("data-layout")).toBe("row");
  expect(row.querySelector("a")!.hasAttribute("data-router")).toBe(true);
  expect(
    screen.container.querySelectorAll(
      '[data-slot="agent-directory-card-skeleton"]',
    ),
  ).toHaveLength(2);
  await expectNoA11yViolations(screen.container);
});
