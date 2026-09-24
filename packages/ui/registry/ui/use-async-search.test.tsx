import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import {
  useAsyncSearch,
  type AsyncSearchLoader,
  type UseAsyncSearchOptions,
  type UseAsyncSearchResult,
} from "./use-async-search";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Renders the hook and hands its latest result to the test through `out`. */
function mount<T>(load: AsyncSearchLoader<T>, options?: UseAsyncSearchOptions) {
  const out: { current: UseAsyncSearchResult<T> } = {
    current: undefined as never,
  };
  function Host(props: { options?: UseAsyncSearchOptions }) {
    out.current = useAsyncSearch(load, props.options);
    return null;
  }
  return { out, Host, element: <Host options={options} /> };
}

test("drops an out-of-order response and aborts the stale request", async () => {
  vi.useFakeTimers();
  try {
    const slow = deferred<{ items: string[] }>();
    const fast = deferred<{ items: string[] }>();
    const load = vi.fn((q: string, _ctx: { signal: AbortSignal }) =>
      q === "a" ? slow.promise : fast.promise,
    );
    const { out, element } = mount(load, { debounceMs: 10, enabled: false });
    await render(element);
    React.act(() => out.current.onSearchChange("a"));
    await vi.advanceTimersByTimeAsync(10);
    React.act(() => out.current.onSearchChange("ab"));
    await vi.advanceTimersByTimeAsync(10);
    fast.resolve({ items: ["ab"] });
    slow.resolve({ items: ["a"] });
    await vi.runAllTimersAsync();
    expect(out.current.items).toEqual(["ab"]);
    expect(load.mock.calls[0]![1].signal.aborted).toBe(true);
    expect(out.current.loading).toBe(false);
  } finally {
    vi.useRealTimers();
  }
});

test("debounces typing: one request with the settled query", async () => {
  vi.useFakeTimers();
  try {
    const load = vi.fn(async (q: string) => ({ items: [q] }));
    const { out, element } = mount(load, { debounceMs: 300, enabled: false });
    await render(element);
    React.act(() => out.current.onSearchChange("a"));
    await vi.advanceTimersByTimeAsync(100);
    React.act(() => out.current.onSearchChange("ac"));
    await vi.advanceTimersByTimeAsync(100);
    React.act(() => out.current.onSearchChange("acm"));
    // The query itself is instant; only the fetch waits.
    expect(out.current.query).toBe("acm");
    await vi.advanceTimersByTimeAsync(299);
    expect(load).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(load).toHaveBeenCalledOnce();
    expect(load.mock.calls[0]![0]).toBe("acm");
    await vi.runAllTimersAsync();
    expect(out.current.items).toEqual(["acm"]);
  } finally {
    vi.useRealTimers();
  }
});

test("loads the first page on mount when enabled, with initialQuery", async () => {
  const load = vi.fn(async (q: string) => ({ items: [`${q}-1`] }));
  const { out, element } = mount(load, { initialQuery: "ac" });
  await render(element);
  await expect.poll(() => out.current.items).toEqual(["ac-1"]);
  expect(load).toHaveBeenCalledOnce();
  expect(load.mock.calls[0]![0]).toBe("ac");
  expect(out.current.query).toBe("ac");
});

test("does not load on mount while disabled, and loads once it is enabled", async () => {
  const load = vi.fn(async () => ({ items: ["x"] }));
  const { out, Host } = mount(load);
  const screen = await render(<Host options={{ enabled: false }} />);
  await new Promise((r) => setTimeout(r, 20));
  expect(load).not.toHaveBeenCalled();
  await screen.rerender(<Host options={{ enabled: true }} />);
  await expect.poll(() => out.current.items).toEqual(["x"]);
});

test("pages with the cursor through loadMore and appends", async () => {
  const load = vi.fn(async (_q: string, ctx: { cursor?: string | null }) =>
    ctx.cursor == null
      ? { items: ["a", "b"], nextCursor: "c2" }
      : { items: ["c"], nextCursor: null },
  );
  const { out, element } = mount(load);
  await render(element);
  await expect.poll(() => out.current.items).toEqual(["a", "b"]);
  expect(out.current.loadMore.hasMore).toBe(true);
  React.act(() => out.current.loadMore.onLoadMore());
  await expect.poll(() => out.current.items).toEqual(["a", "b", "c"]);
  expect(load.mock.calls[1]![1].cursor).toBe("c2");
  expect(out.current.loadMore.hasMore).toBe(false);
});

test("keeps the items on error and reload fetches again", async () => {
  let fail = false;
  const load = vi.fn(async (_q: string, ctx: { cursor?: string | null }) => {
    if (fail) throw new Error("network");
    return ctx.cursor == null
      ? { items: ["a"], nextCursor: "c2" }
      : { items: ["b"], nextCursor: null };
  });
  const { out, element } = mount(load, {
    errorMessage: () => "Couldn't load customers.",
  });
  await render(element);
  await expect.poll(() => out.current.items).toEqual(["a"]);
  fail = true;
  React.act(() => out.current.loadMore.onLoadMore());
  await expect.poll(() => out.current.error).toBe("Couldn't load customers.");
  expect(out.current.items).toEqual(["a"]);
  expect(out.current.loadMore.error).toBe("Couldn't load customers.");
  // Retrying a failed next page asks for the same cursor again.
  fail = false;
  React.act(() => out.current.loadMore.onLoadMore());
  await expect.poll(() => out.current.items).toEqual(["a", "b"]);
  expect(load.mock.calls.at(-1)![1].cursor).toBe("c2");
  expect(out.current.error).toBeUndefined();

  React.act(() => out.current.reload());
  await expect.poll(() => load.mock.calls.length).toBe(4);
  expect(load.mock.calls.at(-1)![1].cursor).toBeNull();
  await expect.poll(() => out.current.items).toEqual(["a"]);
});

test("a deps change resets and loads the first page again", async () => {
  const load = vi.fn(async () => ({ items: ["x"] }));
  const { out, Host } = mount(load);
  const screen = await render(<Host options={{ deps: ["open"] }} />);
  await expect.poll(() => load.mock.calls.length).toBe(1);
  await screen.rerender(<Host options={{ deps: ["open"] }} />);
  await new Promise((r) => setTimeout(r, 20));
  expect(load).toHaveBeenCalledOnce();
  await screen.rerender(<Host options={{ deps: ["closed"] }} />);
  await expect.poll(() => load.mock.calls.length).toBe(2);
  expect(out.current.items).toEqual(["x"]);
});

test("loading is true while a request is in flight", async () => {
  const gate = deferred<{ items: string[] }>();
  const load = vi.fn(() => gate.promise);
  const { out, element } = mount(load);
  await render(element);
  await expect.poll(() => out.current.loading).toBe(true);
  expect(out.current.loadMore.loading).toBe(true);
  gate.resolve({ items: ["a"] });
  await expect.poll(() => out.current.loading).toBe(false);
});

test("unmount aborts the request in flight", async () => {
  const gate = deferred<{ items: string[] }>();
  const load = vi.fn(
    (_q: string, _ctx: { signal: AbortSignal }) => gate.promise,
  );
  const { element } = mount(load);
  const screen = await render(element);
  await expect.poll(() => load.mock.calls.length).toBe(1);
  await screen.unmount();
  expect(load.mock.calls[0]![1].signal.aborted).toBe(true);
});
