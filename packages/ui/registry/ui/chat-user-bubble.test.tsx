import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { UserBubble } from "./chat-user-bubble";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

test("the person's Markdown renders: bold, code, lists, links", async () => {
  const screen = await render(
    <UserBubble
      text={
        "there are **multiple issues**:\n\n- the `ring` is bland\n- [docs](https://example.com)"
      }
    />,
  );
  const body = slot(screen.container, "user-bubble-body")!;
  expect(body.querySelector("strong")?.textContent).toBe("multiple issues");
  expect(body.querySelector("code")?.textContent).toBe("ring");
  expect(body.querySelectorAll("li")).toHaveLength(2);
  expect(slot(screen.container, "user-bubble-more")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("a long message folds at about nine lines with a fade and Show more, which opens and becomes Show less", async () => {
  const text = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join(
    "\n\n",
  );
  const screen = await render(<UserBubble text={text} />);
  const more = screen.getByRole("button", { name: "Show more" });
  await expect.element(more).toBeInTheDocument();
  expect(slot(screen.container, "user-bubble-fade")).not.toBeNull();
  expect(
    slot(screen.container, "user-bubble-body")!.hasAttribute("data-clipped"),
  ).toBe(true);
  await userEvent.click(more);
  await expect
    .element(screen.getByRole("button", { name: "Show less" }))
    .toBeInTheDocument();
  expect(slot(screen.container, "user-bubble-fade")).toBeNull();
  expect(
    screen
      .getByRole("button", { name: "Show less" })
      .element()
      .getAttribute("aria-expanded"),
  ).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("Copy keeps the source; Edit and attached files call back", async () => {
  const onEdit = vi.fn();
  const onOpenFile = vi.fn();
  const screen = await render(
    <UserBubble
      text="**hi**"
      time="14:02"
      onEdit={onEdit}
      onOpenFile={onOpenFile}
      files={[
        {
          url: "data:image/png;base64,iVBORw0KGgo=",
          mediaType: "image/png",
          filename: "shot.png",
        },
        {
          url: "/api/files/2",
          mediaType: "application/pdf",
          filename: "brief.pdf",
        },
      ]}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Edit message" }));
  expect(onEdit).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole("button", { name: "Open shot.png" }));
  await userEvent.click(screen.getByRole("button", { name: "brief.pdf" }));
  expect(onOpenFile).toHaveBeenCalledTimes(2);
  await expect
    .element(screen.getByRole("button", { name: "Copy message" }))
    .toBeInTheDocument();
  expect(slot(screen.container, "user-bubble-actions")!.textContent).toContain(
    "14:02",
  );
});

test("a link below the fold opens the message when it takes focus", async () => {
  const text = [
    ...Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`),
    "[the brief](https://example.com/brief)",
  ].join("\n\n");
  const screen = await render(<UserBubble text={text} />);
  await expect
    .element(screen.getByRole("button", { name: "Show more" }))
    .toBeInTheDocument();
  screen
    .getByRole("link", { name: /the brief/ })
    .element()
    .focus();
  await expect
    .element(screen.getByRole("button", { name: "Show less" }))
    .toBeInTheDocument();
});
