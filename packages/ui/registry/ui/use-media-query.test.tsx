import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { useMediaQuery, usePrefersReducedMotion } from "./use-media-query";

/**
 * Mock `window.matchMedia` so `matchingQuery` matches, and hand the test a way to fire a real
 * `change` event on the mocked list. Same shape as `use-mobile.test.tsx`'s helper (mock + spy,
 * restored in `finally`), plus a subscription counter — this hook's whole point is that there is
 * ONE subscription per query, so the tests below have to be able to see attach/detach.
 */
async function withMatchMedia(
  matchingQuery: string,
  run: (api: {
    dispatchChange: (matches: boolean) => void;
    listenerCount: () => number;
  }) => Promise<void>,
) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let currentMatches = true;
  const matchMediaSpy = vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return query === matchingQuery ? currentMatches : false;
        },
        media: query,
        onchange: null,
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.add(listener);
        },
        removeEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.delete(listener);
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );

  try {
    await run({
      dispatchChange: (matches) => {
        currentMatches = matches;
        for (const listener of listeners) {
          listener({ matches, media: matchingQuery } as MediaQueryListEvent);
        }
      },
      listenerCount: () => listeners.size,
    });
  } finally {
    matchMediaSpy.mockRestore();
  }
}

function Harness({
  query,
  serverFallback,
}: {
  query: string;
  serverFallback?: boolean;
}) {
  const matches = useMediaQuery(query, { serverFallback });
  return <span data-testid="result">{String(matches)}</span>;
}

test("reports the live match for a query that matches", async () => {
  await withMatchMedia("(min-width: 100px)", async () => {
    const screen = await render(<Harness query="(min-width: 100px)" />);
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("true");
  });
});

test("reports false for a query that does not match", async () => {
  await withMatchMedia("(min-width: 100px)", async () => {
    const screen = await render(<Harness query="(max-width: 1px)" />);
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("false");
  });
});

test("updates when the media query fires a change event", async () => {
  await withMatchMedia("(min-width: 100px)", async ({ dispatchChange }) => {
    const screen = await render(<Harness query="(min-width: 100px)" />);
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("true");

    dispatchChange(false);
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("false");

    dispatchChange(true);
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("true");
  });
});

test("subscribes once and detaches the listener on unmount", async () => {
  await withMatchMedia("(min-width: 100px)", async ({ listenerCount }) => {
    const screen = await render(<Harness query="(min-width: 100px)" />);
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("true");
    expect(listenerCount()).toBe(1);

    screen.unmount();
    expect(listenerCount()).toBe(0);
  });
});

/**
 * Run `body` with `window.matchMedia` removed — an SSR pass, or a runtime that simply has no
 * media queries. Exactly ONE `render` per test: two roots inside a single test overlap React's
 * `act()` bookkeeping, and the second container is torn down out from under the assertion.
 */
async function withoutMatchMedia(body: () => Promise<void>) {
  const original = window.matchMedia;
  // @ts-expect-error — simulate a runtime with no matchMedia.
  delete window.matchMedia;
  try {
    await body();
  } finally {
    window.matchMedia = original;
  }
}

test("serverFallback is what an environment without matchMedia reports", async () => {
  await withoutMatchMedia(async () => {
    const screen = await render(
      <Harness query="(min-width: 100px)" serverFallback />,
    );
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("true");
  });
});

test("the default fallback is false, so an undeclared caller is unchanged", async () => {
  await withoutMatchMedia(async () => {
    const screen = await render(<Harness query="(min-width: 100px)" />);
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("false");
  });
});

test("a live match wins over serverFallback once matchMedia is available", async () => {
  // The fallback is the SERVER's answer, not a client default: a caller that declares
  // `serverFallback: true` must still see the real (non-matching) query on the client.
  await withMatchMedia("(min-width: 100px)", async () => {
    const screen = await render(
      <Harness query="(max-width: 1px)" serverFallback />,
    );
    await expect
      .element(screen.getByTestId("result"))
      .toHaveTextContent("false");
  });
});

function ReducedMotionHarness() {
  const prefersReducedMotion = usePrefersReducedMotion();
  return <span data-testid="rm">{String(prefersReducedMotion)}</span>;
}

test("usePrefersReducedMotion reads (prefers-reduced-motion: reduce), live", async () => {
  await withMatchMedia(
    "(prefers-reduced-motion: reduce)",
    async ({ dispatchChange }) => {
      const screen = await render(<ReducedMotionHarness />);
      await expect.element(screen.getByTestId("rm")).toHaveTextContent("true");

      dispatchChange(false);
      await expect.element(screen.getByTestId("rm")).toHaveTextContent("false");
    },
  );
});

test("no a11y violations — hook harness", async () => {
  const { expectNoA11yViolations } = await import("../../test/a11y");
  const screen = await render(<Harness query="(min-width: 100px)" />);
  await expectNoA11yViolations(screen.container);
});
