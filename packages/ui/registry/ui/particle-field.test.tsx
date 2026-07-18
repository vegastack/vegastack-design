import * as React from 'react';
import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { ParticleField, PARTICLE_FIELD_MAX_COUNT } from './particle-field';

function mockReducedMotion(matches: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

let restoreMatchMedia: (() => void) | undefined;

beforeEach(() => {
  // Deterministic-frame tests want a single static draw, not an animating loop —
  // reduced motion is the mechanism this component already uses for exactly that.
  restoreMatchMedia = mockReducedMotion(true);
});

afterEach(() => {
  restoreMatchMedia?.();
  vi.restoreAllMocks();
});

function sized(children: React.ReactNode) {
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>{children}</div>
  );
}

test('renders an aria-hidden container with a full-size canvas', async () => {
  const screen = await render(sized(<ParticleField data-testid="field" />));
  const el = screen.getByTestId('field').element() as HTMLElement;
  expect(el.getAttribute('aria-hidden')).toBe('true');
  expect(el.dataset.slot).toBe('particle-field');
  const canvas = el.querySelector('canvas[data-slot="particle-field-canvas"]');
  expect(canvas).not.toBeNull();
});

test('draws a static frame under reduced motion (deterministic per seed)', async () => {
  const screenA = await render(sized(<ParticleField seed={7} count={12} data-testid="a" />));
  const screenB = await render(sized(<ParticleField seed={7} count={12} data-testid="b" />));

  const canvasA = screenA.getByTestId('a').element().querySelector('canvas') as HTMLCanvasElement;
  const canvasB = screenB.getByTestId('b').element().querySelector('canvas') as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(screenA.getByTestId('a').element().hasAttribute('data-drawn')).toBe(true);
    expect(screenB.getByTestId('b').element().hasAttribute('data-drawn')).toBe(true);
  });

  expect(canvasA.toDataURL()).toBe(canvasB.toDataURL());
});

test('a different seed produces a different deterministic layout', async () => {
  const screenA = await render(sized(<ParticleField seed={1} count={12} data-testid="a" />));
  const screenB = await render(sized(<ParticleField seed={2} count={12} data-testid="b" />));

  const canvasA = screenA.getByTestId('a').element().querySelector('canvas') as HTMLCanvasElement;
  const canvasB = screenB.getByTestId('b').element().querySelector('canvas') as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(screenA.getByTestId('a').element().hasAttribute('data-drawn')).toBe(true);
    expect(screenB.getByTestId('b').element().hasAttribute('data-drawn')).toBe(true);
  });

  expect(canvasA.toDataURL()).not.toBe(canvasB.toDataURL());
});

test('count is clamped to PARTICLE_FIELD_MAX_COUNT — an oversized count draws the same frame as the cap', async () => {
  expect(PARTICLE_FIELD_MAX_COUNT).toBeGreaterThan(0);

  const screenA = await render(
    sized(<ParticleField seed={3} count={PARTICLE_FIELD_MAX_COUNT} data-testid="a" />),
  );
  const screenB = await render(
    sized(<ParticleField seed={3} count={PARTICLE_FIELD_MAX_COUNT + 500} data-testid="b" />),
  );
  const canvasA = screenA.getByTestId('a').element().querySelector('canvas') as HTMLCanvasElement;
  const canvasB = screenB.getByTestId('b').element().querySelector('canvas') as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(screenA.getByTestId('a').element().hasAttribute('data-drawn')).toBe(true);
    expect(screenB.getByTestId('b').element().hasAttribute('data-drawn')).toBe(true);
  });

  // Same seed + the cap wins for both → identical particle set → identical frame.
  expect(canvasA.toDataURL()).toBe(canvasB.toDataURL());
});

test('sets data-drawn once the first frame has painted', async () => {
  const screen = await render(sized(<ParticleField seed={1} count={4} data-testid="field" />));
  const el = screen.getByTestId('field').element() as HTMLElement;
  expect(el.hasAttribute('data-drawn')).toBe(false);
  await vi.waitFor(() => {
    expect(el.hasAttribute('data-drawn')).toBe(true);
  });
});

test('no a11y violations', async () => {
  const screen = await render(<ParticleField />);
  await expectNoA11yViolations(screen.container);
});
