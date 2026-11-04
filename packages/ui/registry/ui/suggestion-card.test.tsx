import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { SuggestionCard } from "./suggestion-card";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const items = [
  { id: "a", label: "Keep 4000 K for IP65", meta: "Asha, Fri", checked: true },
  { id: "b", label: "Update the datasheet", meta: "you", checked: false },
];

const actions = (
  <>
    <Button size="sm" variant="secondary">
      Create 1 task
    </Button>
    <Button size="sm" variant="ghost">
      Dismiss
    </Button>
  </>
);

test("an open card is named by its title and holds what it's given", async () => {
  const screen = await render(
    <SuggestionCard
      privateLabel="Only you can see this"
      title="Assistant · 2 decisions"
      items={items}
      actions={actions}
      menu={<Button size="icon-xs" variant="ghost" aria-label="More" />}
      footnote="Expires tomorrow"
    />,
  );
  const card = page.getByRole("region", { name: "Assistant · 2 decisions" });
  await expect.element(card).toBeVisible();
  const root = slot(screen.container, "suggestion-card")!;
  expect(root.dataset.state).toBe("open");
  expect(root.dataset.variant).toBe("card");
  expect(slot(root, "suggestion-card-private")!.textContent).toBe(
    "Only you can see this",
  );
  expect(slot(root, "suggestion-card-footnote")!.textContent).toBe(
    "Expires tomorrow",
  );
  expect(
    root.querySelectorAll("[data-slot=suggestion-card-item]"),
  ).toHaveLength(2);
  await expectNoA11yViolations(screen.container);
});

test("ticking an item reports it; a row without checked has no checkbox", async () => {
  const onItemCheckedChange = vi.fn();
  const screen = await render(
    <SuggestionCard
      title="Suggestion"
      items={[...items, { id: "c", label: "Fixed" }]}
      onItemCheckedChange={onItemCheckedChange}
    />,
  );
  await page.getByRole("checkbox", { name: /Update the datasheet/ }).click();
  expect(onItemCheckedChange).toHaveBeenCalledWith("b", true);
  await page.getByRole("checkbox", { name: /Keep 4000 K/ }).click();
  expect(onItemCheckedChange).toHaveBeenLastCalledWith("a", false);
  expect(screen.container.querySelectorAll("[role=checkbox]")).toHaveLength(2);
  await expectNoA11yViolations(screen.container);
});

test("a long label is cut and keeps its row; a long meta can't erase it", async () => {
  const screen = await render(
    <div style={{ width: 240 }}>
      <SuggestionCard
        title="Suggestion"
        items={[
          {
            id: "a",
            label: "A very long item title that cannot fit on this line at all",
            meta: "Ravi, Wed",
            checked: true,
          },
        ]}
      />
    </div>,
  );
  const meta = slot(screen.container, "suggestion-card-item-meta")!;
  const label = slot(screen.container, "suggestion-card-item-label")!;
  expect(meta.scrollWidth).toBeLessThanOrEqual(meta.clientWidth + 1);
  expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  const card = slot(screen.container, "suggestion-card")!;
  expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  await screen.rerender(
    <div style={{ width: 240 }}>
      <SuggestionCard
        title="Suggestion"
        items={[
          {
            id: "a",
            label: "Short",
            meta: "A very long list of assignees that goes on and on and on",
            checked: true,
          },
        ]}
      />
    </div>,
  );
  expect(
    slot(screen.container, "suggestion-card-item-label")!.clientWidth,
  ).toBeGreaterThan(20);
  expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
});

test("unbroken text wraps inside the card and the row", async () => {
  const long = "x".repeat(200);
  for (const variant of ["card", "row"] as const) {
    const screen = await render(
      <div style={{ width: 320 }}>
        <SuggestionCard
          variant={variant}
          title={long}
          outcome={long}
          footnote={long}
        />
      </div>,
    );
    const root = slot(screen.container, "suggestion-card")!;
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth + 1);
    await screen.unmount();
  }
});

test("busy holds the items still and marks the card", async () => {
  const onItemCheckedChange = vi.fn();
  const screen = await render(
    <SuggestionCard
      title="Suggestion"
      state="busy"
      items={items}
      onItemCheckedChange={onItemCheckedChange}
      actions={actions}
    />,
  );
  const root = slot(screen.container, "suggestion-card")!;
  expect(root.getAttribute("aria-busy")).toBe("true");
  const box = page.getByRole("checkbox", { name: /Update the datasheet/ });
  await expect.element(box).toHaveAttribute("aria-disabled", "true");
  await box.click({ force: true });
  expect(onItemCheckedChange).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("accepted gives way to a line and its Undo, and is no landmark", async () => {
  const screen = await render(
    <SuggestionCard
      title="Suggestion"
      state="accepted"
      items={items}
      outcome="Assistant created 3 tasks from this chat"
      actions={
        <Button size="xs" variant="ghost">
          Undo
        </Button>
      }
    />,
  );
  const root = slot(screen.container, "suggestion-card")!;
  expect(root.hasAttribute("aria-labelledby")).toBe(false);
  await expect
    .element(page.getByRole("button", { name: "Undo" }))
    .toBeVisible();
  expect(slot(root, "suggestion-card-items")).toBeNull();
  expect(slot(root, "suggestion-card-outcome")!.textContent).toBe(
    "Assistant created 3 tasks from this chat",
  );
  await expectNoA11yViolations(screen.container);
  await screen.rerender(<SuggestionCard title="Fallback" state="accepted" />);
  expect(slot(screen.container, "suggestion-card-outcome")!.textContent).toBe(
    "Fallback",
  );
});

test("expired folds to its line; failed keeps the items for Retry", async () => {
  const props = { title: "Suggestion", items, footnote: "Expires tomorrow" };
  const screen = await render(
    <SuggestionCard
      {...props}
      state="expired"
      outcome="This suggestion expired."
      actions={
        <Button size="sm" variant="ghost">
          Ask again
        </Button>
      }
    />,
  );
  const root = slot(screen.container, "suggestion-card")!;
  expect(slot(root, "suggestion-card-items")).toBeNull();
  expect(slot(root, "suggestion-card-footnote")).toBeNull();
  expect(slot(root, "suggestion-card-outcome")!.className).toContain(
    "text-muted-foreground",
  );
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <SuggestionCard
      {...props}
      state="failed"
      outcome="Couldn't create the tasks."
      actions={
        <Button size="sm" variant="secondary">
          Retry
        </Button>
      }
    />,
  );
  expect(slot(root, "suggestion-card-items")).not.toBeNull();
  const outcome = slot(root, "suggestion-card-outcome")!;
  expect(outcome.className).toContain("text-destructive-text");
  expect(
    outcome.compareDocumentPosition(slot(root, "suggestion-card-actions")!) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await expectNoA11yViolations(screen.container);
});

test("a row is a group, side by side when wide and stacked when narrow", async () => {
  const row = (width: number) => (
    <div style={{ width }}>
      <SuggestionCard
        variant="row"
        title="Assistant · Create 2 tasks"
        privateLabel="Only you"
        items={items}
        footnote="Expires tomorrow"
        actions={actions}
      />
    </div>
  );
  const screen = await render(row(640));
  const root = slot(screen.container, "suggestion-card")!;
  expect(root.dataset.variant).toBe("row");
  expect(root.getAttribute("role")).toBe("group");
  expect(slot(root, "suggestion-card-items")).toBeNull();
  expect(slot(root, "suggestion-card-footnote")).toBeNull();
  expect(slot(root, "suggestion-card-private")).toBeNull();
  const layout = root.firstElementChild!;
  expect(getComputedStyle(layout).flexDirection).toBe("row");
  await expectNoA11yViolations(screen.container);
  await screen.rerender(row(360));
  await vi.waitFor(() =>
    expect(getComputedStyle(layout).flexDirection).toBe("column"),
  );
});

test("a row fills a shrink-to-fit parent", async () => {
  const screen = await render(
    <div style={{ display: "flex", width: 640 }}>
      <SuggestionCard variant="row" title="Suggestion" actions={actions} />
    </div>,
  );
  expect(
    slot(screen.container, "suggestion-card")!.getBoundingClientRect().width,
  ).toBe(640);
});
