import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { mergeRefs, useAnimationReplay, useShakeOnInvalid } from './use-animation-replay';

/* ---------------------------------------------------------------------------------------------
 * Real-animation mirror (same technique as checkbox.test.tsx's "Touch-target remediation" suite
 * and animated-number.test.tsx's fast-tween mirror): this package's fast unit-test harness
 * compiles no Tailwind/token CSS, so `@utility motion-shake` (and its `@keyframes vs-shake`) never
 * resolve here. Injecting a literal `<style>` that defines `.motion-shake` with a short REAL
 * keyframe animation lets the browser fire genuine `animationstart`/`animationend` events — this
 * exercises the hook's actual class-toggle + `animationend`-cleanup mechanism, not a mocked one.
 * ------------------------------------------------------------------------------------------- */
function injectShakeMirror(durationMs = 60): () => void {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes test-shake { to { translate: 0 0; } }
    .motion-shake { animation: test-shake ${durationMs}ms linear; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

/* -------------------------------------------------------------------------------------------
 * useAnimationReplay — low-level class-toggle primitive.
 * ----------------------------------------------------------------------------------------- */

function ReplayHarness() {
  const replay = useAnimationReplay('motion-shake');
  return (
    <div>
      <button type="button" onClick={replay.replay}>
        replay
      </button>
      <span
        data-testid="target"
        className={replay.className}
        onAnimationEnd={replay.onAnimationEnd}
      >
        target
      </span>
    </div>
  );
}

test('at rest, no animation class is applied', async () => {
  const screen = await render(<ReplayHarness />);
  await expect.element(screen.getByTestId('target')).not.toHaveClass('motion-shake');
});

test('replay() applies the animation class', async () => {
  const screen = await render(<ReplayHarness />);
  await screen.getByRole('button', { name: 'replay' }).click();
  await expect.element(screen.getByTestId('target')).toHaveClass('motion-shake');
});

test('the class clears itself once the CSS animation actually finishes (animationend)', async () => {
  const cleanup = injectShakeMirror(50);
  try {
    const screen = await render(<ReplayHarness />);
    const target = screen.getByTestId('target');
    await screen.getByRole('button', { name: 'replay' }).click();
    await expect.element(target).toHaveClass('motion-shake');
    await expect
      .poll(() => target.element().className, { timeout: 2000 })
      .not.toContain('motion-shake');
  } finally {
    cleanup();
  }
});

test('replaying while already playing restarts cleanly instead of getting stuck active', async () => {
  const cleanup = injectShakeMirror(300);
  try {
    const screen = await render(<ReplayHarness />);
    const button = screen.getByRole('button', { name: 'replay' });
    const target = screen.getByTestId('target');

    await button.click();
    await expect.element(target).toHaveClass('motion-shake');

    // Interrupt mid-animation — a second failed submission while the control is still shaking.
    await button.click();
    // Still (or again) playing — the interruption didn't cancel the animation outright.
    await expect.element(target).toHaveClass('motion-shake');

    // And it still settles back to rest afterwards — doesn't get permanently stuck "active".
    await expect
      .poll(() => target.element().className, { timeout: 3000 })
      .not.toContain('motion-shake');
  } finally {
    cleanup();
  }
});

test('an animationend bubbling from a descendant does not clear the parent state', async () => {
  // The child's own animation is much SHORTER than the parent's, and unconditionally applied —
  // it fires (and bubbles) an `animationend` WHILE the parent's replayed animation is still
  // supposed to be mid-playback. The `event.target === event.currentTarget` guard in
  // `onAnimationEnd` must ignore that bubbled event so the parent doesn't clear early.
  function NestedHarness() {
    const replay = useAnimationReplay('motion-shake');
    return (
      <div>
        <button type="button" onClick={replay.replay}>
          replay
        </button>
        <span
          data-testid="parent"
          className={replay.className}
          onAnimationEnd={replay.onAnimationEnd}
        >
          <span data-testid="child" className="child-shake" />
        </span>
      </div>
    );
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes test-shake { to { translate: 0 0; } }
    @keyframes test-shake-short { to { translate: 0 0; } }
    .motion-shake { animation: test-shake 400ms linear; }
    .child-shake { animation: test-shake-short 30ms linear; }
  `;
  document.head.appendChild(style);
  try {
    const screen = await render(<NestedHarness />);
    await screen.getByRole('button', { name: 'replay' }).click();
    const parent = screen.getByTestId('parent');
    await expect.element(parent).toHaveClass('motion-shake');
    // The child's short animation has already fired+bubbled `animationend` by now, well before
    // the parent's own 400ms animation would naturally finish.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(parent.element().className).toContain('motion-shake');
  } finally {
    document.head.removeChild(style);
  }
});

/* -------------------------------------------------------------------------------------------
 * mergeRefs
 * ----------------------------------------------------------------------------------------- */

test('mergeRefs attaches the same node to an object ref and a callback ref', async () => {
  const objectRef = React.createRef<HTMLDivElement>();
  const seen: Array<HTMLDivElement | null> = [];
  const callbackRef = (node: HTMLDivElement | null) => {
    seen.push(node);
  };
  const combined = mergeRefs(objectRef, callbackRef);

  const screen = await render(<div ref={combined} data-testid="merged" />);
  const el = screen.container.querySelector('[data-testid="merged"]');
  expect(objectRef.current).toBe(el);
  expect(seen.at(-1)).toBe(el);
});

test('mergeRefs skips null/undefined entries without throwing', async () => {
  const objectRef = React.createRef<HTMLDivElement>();
  const combined = mergeRefs(objectRef, null, undefined);
  await render(<div ref={combined} data-testid="merged-safe" />);
  expect(objectRef.current).not.toBeNull();
});

/* -------------------------------------------------------------------------------------------
 * useShakeOnInvalid — auto-shake-on-invalid-transition, built on useAnimationReplay.
 * ----------------------------------------------------------------------------------------- */

function TransitionHarness() {
  const [invalid, setInvalid] = React.useState(false);
  const shake = useShakeOnInvalid();
  return (
    <div>
      <button type="button" onClick={() => setInvalid(true)}>
        invalidate
      </button>
      <input
        aria-label="Name"
        aria-invalid={invalid || undefined}
        ref={shake.invalidRef}
        className={shake.className}
        onAnimationEnd={shake.onAnimationEnd}
      />
    </div>
  );
}

test('auto-shakes once when the observed element transitions into invalid', async () => {
  const screen = await render(<TransitionHarness />);
  const input = screen.getByLabelText('Name');
  await expect.element(input).not.toHaveClass('motion-shake');
  await screen.getByRole('button', { name: 'invalidate' }).click();
  await expect.element(input).toHaveClass('motion-shake');
});

test('does not shake a control that is already invalid at mount (no shake on first paint)', async () => {
  function AlreadyInvalidHarness() {
    const shake = useShakeOnInvalid();
    return (
      <input
        aria-label="Code"
        aria-invalid
        ref={shake.invalidRef}
        className={shake.className}
        onAnimationEnd={shake.onAnimationEnd}
      />
    );
  }
  const screen = await render(<AlreadyInvalidHarness />);
  const input = screen.getByLabelText('Code');
  // Give the mount effect + any (incorrect) auto-shake a moment to run before asserting absence.
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect((input.element() as HTMLElement).className).not.toContain('motion-shake');
});

test('staying invalid across re-renders (no attribute change) does not re-shake', async () => {
  function StaysInvalidHarness() {
    const [, forceRerender] = React.useReducer((count: number) => count + 1, 0);
    const shake = useShakeOnInvalid();
    return (
      <div>
        <button type="button" onClick={forceRerender}>
          rerender
        </button>
        <input
          aria-label="Code"
          aria-invalid
          ref={shake.invalidRef}
          className={shake.className}
          onAnimationEnd={shake.onAnimationEnd}
        />
      </div>
    );
  }
  const screen = await render(<StaysInvalidHarness />);
  const input = screen.getByLabelText('Code');
  await new Promise((resolve) => setTimeout(resolve, 100));
  await screen.getByRole('button', { name: 'rerender' }).click();
  await screen.getByRole('button', { name: 'rerender' }).click();
  expect((input.element() as HTMLElement).className).not.toContain('motion-shake');
});

function SignalHarness({ initiallyInvalid }: { initiallyInvalid: boolean }) {
  const [invalid] = React.useState(initiallyInvalid);
  const [signal, setSignal] = React.useState(0);
  const shake = useShakeOnInvalid({ shakeSignal: signal });
  return (
    <div>
      <button type="button" onClick={() => setSignal((s) => s + 1)}>
        retry
      </button>
      <input
        aria-label="Name"
        aria-invalid={invalid || undefined}
        ref={shake.invalidRef}
        className={shake.className}
        onAnimationEnd={shake.onAnimationEnd}
      />
    </div>
  );
}

test('shakeSignal re-triggers the shake on repeated failure while already invalid', async () => {
  const screen = await render(<SignalHarness initiallyInvalid />);
  const input = screen.getByLabelText('Name');
  // Mounts already invalid — no shake yet (see the mount test above).
  await new Promise((resolve) => setTimeout(resolve, 100));
  await expect.element(input).not.toHaveClass('motion-shake');

  await screen.getByRole('button', { name: 'retry' }).click();
  await expect.element(input).toHaveClass('motion-shake');
});

test('shakeSignal is ignored while the control is valid', async () => {
  const screen = await render(<SignalHarness initiallyInvalid={false} />);
  const input = screen.getByLabelText('Name');
  await screen.getByRole('button', { name: 'retry' }).click();
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect((input.element() as HTMLElement).className).not.toContain('motion-shake');
});

/* -------------------------------------------------------------------------------------------
 * Focus preservation — the core constraint this hook exists to satisfy. A key-remount would
 * blur a focused <input> and reset its caret/selection; class-toggle must not.
 * ----------------------------------------------------------------------------------------- */

function FocusHarness() {
  // Flips itself into invalid shortly after mount, with NO click/interaction on any other
  // element in between — isolates "does the shake itself steal focus" from "does clicking a
  // button elsewhere steal focus" (clicking a <button> naturally focuses it in Chromium, which
  // would otherwise confound this test with browser behavior that has nothing to do with the hook).
  const [invalid, setInvalid] = React.useState(false);
  const shake = useShakeOnInvalid();
  React.useEffect(() => {
    const timer = setTimeout(() => setInvalid(true), 30);
    return () => clearTimeout(timer);
  }, []);
  return (
    <input
      aria-label="Email"
      aria-invalid={invalid || undefined}
      ref={shake.invalidRef}
      className={shake.className}
      onAnimationEnd={shake.onAnimationEnd}
    />
  );
}

test('shaking a focused input preserves focus, value, and caret/selection', async () => {
  const cleanup = injectShakeMirror();
  try {
    const screen = await render(<FocusHarness />);
    const input = screen.getByLabelText('Email').element() as HTMLInputElement;

    input.focus();
    input.value = 'ada@example.com';
    input.setSelectionRange(3, 6);
    expect(document.activeElement).toBe(input);

    await expect.poll(() => input.className, { timeout: 2000 }).toContain('motion-shake');

    // The element identity never changed (no remount), so all of this survives the shake.
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('ada@example.com');
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(6);
  } finally {
    cleanup();
  }
});
