import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { useIsMobile } from './use-mobile';

/**
 * Mock `window.matchMedia` so the given query matches — simulating a viewport at/under a
 * breakpoint for the duration of the callback. Mirrors the house pattern in
 * `truncated-text.test.tsx`'s `withNoHoverDevice` (mock + spy, restored in `finally`), extended
 * to expose the mocked `MediaQueryList` so a test can fire a synthetic `change` event on it.
 */
async function withMatchMedia(
  matchingQuery: string,
  run: (dispatchChange: (matches: boolean) => void) => Promise<void>,
) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let currentMatches = true;
  const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return query === matchingQuery ? currentMatches : false;
        },
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );

  try {
    await run((matches) => {
      currentMatches = matches;
      for (const listener of listeners) {
        listener({ matches, media: matchingQuery } as MediaQueryListEvent);
      }
    });
  } finally {
    matchMediaSpy.mockRestore();
  }
}

function Harness({ breakpoint }: { breakpoint?: number }) {
  const isMobile = useIsMobile(breakpoint);
  return <span data-testid="result">{String(isMobile)}</span>;
}

test('reports false (desktop) when the media query does not match', async () => {
  await withMatchMedia('(max-width: 9999px)', async () => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByTestId('result')).toHaveTextContent('false');
  });
});

test('reports true (mobile) when the default 767px query matches', async () => {
  await withMatchMedia('(max-width: 767px)', async () => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByTestId('result')).toHaveTextContent('true');
  });
});

test('honors a custom breakpoint', async () => {
  await withMatchMedia('(max-width: 1023px)', async () => {
    const screen = await render(<Harness breakpoint={1024} />);
    await expect.element(screen.getByTestId('result')).toHaveTextContent('true');
  });
});

test('updates live when the media query change event fires', async () => {
  await withMatchMedia('(max-width: 767px)', async (dispatchChange) => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByTestId('result')).toHaveTextContent('true');

    dispatchChange(false);
    await expect.element(screen.getByTestId('result')).toHaveTextContent('false');

    dispatchChange(true);
    await expect.element(screen.getByTestId('result')).toHaveTextContent('true');
  });
});

test('SSR-safe: does not throw when matchMedia is unavailable', async () => {
  const original = window.matchMedia;
  // @ts-expect-error — simulate an environment with no matchMedia (mirrors getPrefersNoHover's guard).
  delete window.matchMedia;
  try {
    const screen = await render(<Harness />);
    await expect.element(screen.getByTestId('result')).toHaveTextContent('false');
  } finally {
    window.matchMedia = original;
  }
});
