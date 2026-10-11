import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { LoadMore } from "./load-more";

const root = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="load-more"]');
const sentinel = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="load-more-sentinel"]');
const skeleton = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="load-more-skeleton"]');

test("loads the next page once when the sentinel is in view, with no button", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(<LoadMore hasMore onLoadMore={onLoadMore} />);
  expect(root(screen.container)?.dataset.state).toBe("idle");
  expect(sentinel(screen.container)).not.toBeNull();
  expect(screen.container.querySelector("button")).toBeNull();
  await expect.poll(() => onLoadMore.mock.calls.length).toBe(1);
  // The host has not answered: the guard holds, however long the sentinel stays in view.
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(onLoadMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("loading shows skeleton rows and fires nothing", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <LoadMore hasMore loading onLoadMore={onLoadMore} className="pt-1" />,
  );
  expect(root(screen.container)?.dataset.state).toBe("loading");
  expect(root(screen.container)?.className).toContain("pt-1");
  expect(skeleton(screen.container)).not.toBeNull();
  expect(screen.container.querySelector("button")).toBeNull();
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(onLoadMore).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("a custom skeleton replaces the bars, and null leaves them to the host", async () => {
  const screen = await render(
    <LoadMore
      hasMore
      loading
      onLoadMore={() => {}}
      skeleton={<div data-testid="rows" />}
    />,
  );
  await expect.element(screen.getByTestId("rows")).toBeInTheDocument();
  await screen.rerender(
    <LoadMore hasMore loading onLoadMore={() => {}} skeleton={null} />,
  );
  expect(skeleton(screen.container)).toBeNull();
  expect(sentinel(screen.container)).not.toBeNull();
});

test("pages until the cursor runs out, one request per page", async () => {
  const onLoadMore = vi.fn();
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
          hasMore={rows < 12}
          loading={loading}
          endLabel="End of list"
          onLoadMore={() => {
            onLoadMore();
            setLoading(true);
            setTimeout(() => {
              setRows((n) => n + 3);
              setLoading(false);
            }, 20);
          }}
        />
      </div>
    );
  }
  const screen = await render(<Host />);
  await expect.element(screen.getByText("Row 12")).toBeInTheDocument();
  await expect.element(screen.getByText("End of list")).toBeInTheDocument();
  expect(onLoadMore).toHaveBeenCalledTimes(3);
});

test("a host that omits loading is still asked once per render it answers", async () => {
  const onLoadMore = vi.fn();
  function Host() {
    const [rows, setRows] = React.useState(2);
    return (
      <div>
        <ul>
          {Array.from({ length: rows }, (_, i) => (
            <li key={i}>Row {i + 1}</li>
          ))}
        </ul>
        <LoadMore
          hasMore={rows < 6}
          onLoadMore={() => {
            onLoadMore();
            setTimeout(() => setRows((n) => n + 2), 20);
          }}
        />
      </div>
    );
  }
  const screen = await render(<Host />);
  await expect.element(screen.getByText("Row 6")).toBeInTheDocument();
  expect(onLoadMore).toHaveBeenCalledTimes(2);
});

test("a first load that finishes with the sentinel in view loads the next page", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <LoadMore hasMore loading onLoadMore={onLoadMore} />,
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(onLoadMore).not.toHaveBeenCalled();
  await screen.rerender(<LoadMore hasMore onLoadMore={onLoadMore} />);
  await expect.poll(() => onLoadMore.mock.calls.length).toBe(1);
});

test("an unrelated re-render while a page is in flight never asks twice", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(<LoadMore hasMore onLoadMore={onLoadMore} />);
  await expect.poll(() => onLoadMore.mock.calls.length).toBe(1);
  await screen.rerender(
    <LoadMore hasMore onLoadMore={onLoadMore} className="mt-1" />,
  );
  await screen.rerender(<LoadMore hasMore onLoadMore={() => onLoadMore()} />);
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(onLoadMore).toHaveBeenCalledOnce();
});

test("a returned promise releases the guard when it settles, even for an empty page", async () => {
  let calls = 0;
  const screen = await render(
    <LoadMore
      hasMore
      onLoadMore={() => {
        calls += 1;
        // A page the host filtered empty: nothing moves, the promise is the only answer.
        return new Promise((resolve) => setTimeout(resolve, 20));
      }}
    />,
  );
  await expect.poll(() => calls).toBeGreaterThanOrEqual(2);
  screen.unmount();
});

test("in a scroll container it waits until the end nears the edge", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <div data-testid="scroller" style={{ height: 160, overflowY: "auto" }}>
      <div style={{ height: 2000 }} />
      <LoadMore hasMore onLoadMore={onLoadMore} rootMargin="0px" />
    </div>,
  );
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(onLoadMore).not.toHaveBeenCalled();
  const scroller = screen.getByTestId("scroller").element() as HTMLElement;
  scroller.scrollTop = scroller.scrollHeight;
  await expect.poll(() => onLoadMore.mock.calls.length).toBe(1);
});

test("an error shows the message and Try again, and pauses auto-loading", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <LoadMore hasMore onLoadMore={onLoadMore} error="Couldn't load more." />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn't load more.");
  expect(root(screen.container)?.dataset.state).toBe("error");
  expect(sentinel(screen.container)).toBeNull();
  expect(onLoadMore).not.toHaveBeenCalled();
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onLoadMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <LoadMore
      hasMore
      onLoadMore={() => {}}
      error="Failed."
      retryLabel="Retry"
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Retry" }))
    .toBeInTheDocument();
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
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <LoadMore hasMore loading onLoadMore={() => {}} ref={ref} />,
  );
  expect(ref.current).toBe(root(screen.container));
});
