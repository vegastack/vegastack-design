import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { LoadMore, type LoadMoreProps } from "./load-more";

const root = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="load-more"]');

test("renders a Load more button while more rows exist", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(<LoadMore hasMore onLoadMore={onLoadMore} />);
  const button = screen.getByRole("button", { name: "Load more" });
  await expect.element(button).toBeInTheDocument();
  expect(root(screen.container)?.dataset.state).toBe("idle");
  await button.click();
  expect(onLoadMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("renders nothing when complete and no endLabel", async () => {
  const screen = await render(
    <LoadMore hasMore={false} onLoadMore={() => {}} />,
  );
  expect(root(screen.container)).toBeNull();
});

test("renders the endLabel when complete", async () => {
  const screen = await render(
    <LoadMore hasMore={false} onLoadMore={() => {}} endLabel="End of list" />,
  );
  expect(root(screen.container)?.dataset.state).toBe("done");
  expect(root(screen.container)?.textContent).toBe("End of list");
  expect(screen.container.querySelector("button")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("loading sets aria-busy, keeps the label's box and does not fire again", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(<LoadMore hasMore onLoadMore={onLoadMore} />);
  const button = screen.getByRole("button", { name: "Load more" });
  await screen.rerender(<LoadMore hasMore loading onLoadMore={onLoadMore} />);
  await expect.element(button).toHaveAttribute("aria-busy", "true");
  expect(root(screen.container)?.dataset.state).toBe("loading");
  // Button's own loading contract keeps the label in place at opacity 0 (API-5, A11Y-12);
  // the rendered width proof for the footer is the load-more geometry fixture.
  await expect.element(screen.getByText("Load more")).toHaveClass("opacity-0");
  await button.click({ force: true });
  expect(onLoadMore).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("error shows the message and Try again retries", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <LoadMore hasMore onLoadMore={onLoadMore} error="Couldn't load more." />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn't load more.");
  expect(root(screen.container)?.dataset.state).toBe("error");
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onLoadMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("labels are overridable", async () => {
  const props: LoadMoreProps = {
    hasMore: true,
    onLoadMore: () => {},
    label: "Show more tasks",
    retryLabel: "Retry",
  };
  const screen = await render(<LoadMore {...props} />);
  await expect
    .element(screen.getByRole("button", { name: "Show more tasks" }))
    .toBeInTheDocument();
  await screen.rerender(<LoadMore {...props} error="Failed." />);
  await expect
    .element(screen.getByRole("button", { name: "Retry" }))
    .toBeInTheDocument();
});

test("focus stays on the button while rows append", async () => {
  function Host() {
    const [rows, setRows] = React.useState(3);
    const [loading, setLoading] = React.useState(false);
    return (
      <div>
        <ul>
          {Array.from({ length: rows }, (_, i) => (
            <li key={i}>Row {i + 1}</li>
          ))}
        </ul>
        <LoadMore
          hasMore={rows < 9}
          loading={loading}
          onLoadMore={() => {
            setLoading(true);
            setTimeout(() => {
              setRows((n) => n + 3);
              setLoading(false);
            }, 0);
          }}
        />
      </div>
    );
  }
  const screen = await render(<Host />);
  const button = screen.getByRole("button", { name: "Load more" });
  (button.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByText("Row 6")).toBeInTheDocument();
  await expect.element(button).not.toHaveAttribute("aria-busy");
  expect(document.activeElement).toBe(button.element());
  // The last batch removes the button; the footer keeps focus rather than dropping it to the page.
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByText("Row 9")).toBeInTheDocument();
  await expect
    .poll(() => document.activeElement?.getAttribute("data-slot"))
    .toBe("load-more");
});

test("forwards ref and className to the root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <LoadMore hasMore onLoadMore={() => {}} ref={ref} className="mt-4" />,
  );
  expect(ref.current).toBe(root(screen.container));
  expect(ref.current?.className).toContain("mt-4");
});
