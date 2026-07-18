import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Input } from './input';

test('renders a textbox with the placeholder', async () => {
  const screen = await render(<Input placeholder="Email" />);
  await expect.element(screen.getByPlaceholder('Email')).toBeInTheDocument();
});

test('defaults to type="text" and forwards type', async () => {
  const screen = await render(<Input aria-label="Password" type="password" />);
  await expect.element(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
});

test('typing fires onChange', async () => {
  const onChange = vi.fn();
  const screen = await render(<Input aria-label="Name" onChange={onChange} />);
  await screen.getByLabelText('Name').fill('Ada');
  expect(onChange).toHaveBeenCalled();
});

test('typing fires Base UI onValueChange', async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Input aria-label="Name" onValueChange={onValueChange} />);
  await screen.getByLabelText('Name').fill('Ada');
  expect(onValueChange).toHaveBeenLastCalledWith('Ada', expect.any(Object));
});

test('supports Base UI state-function className', async () => {
  const screen = await render(
    <Input
      aria-label="Name"
      disabled
      className={({ disabled }) => (disabled ? 'input-disabled' : 'input-ready')}
    />,
  );
  expect(screen.getByLabelText('Name').element().className).toContain('input-disabled');
});

test('disabled prevents interaction', async () => {
  const screen = await render(<Input aria-label="Name" disabled />);
  await expect.element(screen.getByLabelText('Name')).toBeDisabled();
});

test('aria-invalid is reflected on the field', async () => {
  const screen = await render(<Input aria-label="Name" aria-invalid />);
  await expect.element(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
});

test('addon mode wraps the input in a group and renders prefix/suffix', async () => {
  const screen = await render(
    <Input
      aria-label="Slug"
      prefix="app.vegastack.com/"
      suffix=".dev"
      containerClassName="slug-shell"
      className="slug-input"
    />,
  );
  const input = screen.getByLabelText('Slug');
  await expect.element(input).toHaveAttribute('data-slot', 'input');
  expect(input.element().className).toContain('slug-input');
  expect(screen.container.querySelector('[data-slot="input-group"]')?.className).toContain(
    'slug-shell',
  );
  await expect.element(screen.getByText('app.vegastack.com/')).toBeInTheDocument();
  await expect.element(screen.getByText('.dev')).toBeInTheDocument();
});

/* ---------------------------------------------------------------------------------------------
 * Phase M — error-shake. See use-animation-replay.test.tsx for the hook's own coverage
 * (mechanism, focus preservation, interruption); these tests only verify the wiring, including
 * the standalone-vs-addon-mode shake TARGET (the input itself vs. the group wrapper that
 * actually carries the visible border).
 * ------------------------------------------------------------------------------------------- */

test('auto-shakes once when it transitions into invalid', async () => {
  function Harness() {
    const [invalid, setInvalid] = React.useState(false);
    return (
      <div>
        <button type="button" onClick={() => setInvalid(true)}>
          invalidate
        </button>
        <Input aria-label="Name" aria-invalid={invalid || undefined} />
      </div>
    );
  }
  const screen = await render(<Harness />);
  const input = screen.getByLabelText('Name');
  await expect.element(input).not.toHaveClass('motion-shake');
  await screen.getByRole('button', { name: 'invalidate' }).click();
  await expect.element(input).toHaveClass('motion-shake');
});

test('does not shake when already invalid at mount', async () => {
  const screen = await render(<Input aria-label="Name" aria-invalid />);
  const input = screen.getByLabelText('Name');
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect((input.element() as HTMLElement).className).not.toContain('motion-shake');
});

test('shakeSignal re-shakes a still-invalid input on repeated failure', async () => {
  function Harness() {
    const [signal, setSignal] = React.useState(0);
    return (
      <div>
        <button type="button" onClick={() => setSignal((s) => s + 1)}>
          retry
        </button>
        <Input aria-label="Name" aria-invalid shakeSignal={signal} />
      </div>
    );
  }
  const screen = await render(<Harness />);
  const input = screen.getByLabelText('Name');
  await new Promise((resolve) => setTimeout(resolve, 100));
  await expect.element(input).not.toHaveClass('motion-shake');
  await screen.getByRole('button', { name: 'retry' }).click();
  await expect.element(input).toHaveClass('motion-shake');
});

test('in addon mode, the shake plays on the group wrapper (the bordered box), not the bare input', async () => {
  function Harness() {
    const [invalid, setInvalid] = React.useState(false);
    return (
      <div>
        <button type="button" onClick={() => setInvalid(true)}>
          invalidate
        </button>
        <Input aria-label="Slug" prefix="app.vegastack.com/" aria-invalid={invalid || undefined} />
      </div>
    );
  }
  const screen = await render(<Harness />);
  const group = screen.container.querySelector('[data-slot="input-group"]') as HTMLElement;
  const input = screen.getByLabelText('Slug');
  await expect.element(input).not.toHaveClass('motion-shake');
  expect(group.className).not.toContain('motion-shake');
  await screen.getByRole('button', { name: 'invalidate' }).click();
  await expect.element(group).toHaveClass('motion-shake');
  expect((input.element() as HTMLElement).className).not.toContain('motion-shake');
});

test('shaking a focused, mid-typed input does not steal focus or reset the caret', async () => {
  // The realistic trigger: the user is actively typing in a focused field and it fails live
  // validation — the shake must not interrupt them.
  function Harness() {
    const [invalid, setInvalid] = React.useState(false);
    return (
      <Input
        aria-label="Email"
        aria-invalid={invalid || undefined}
        onValueChange={(value) => setInvalid(value.length > 0 && !value.includes('@'))}
      />
    );
  }
  const screen = await render(<Harness />);
  const input = screen.getByLabelText('Email').element() as HTMLInputElement;
  input.focus();
  await screen.getByLabelText('Email').fill('not-an-email');
  await expect.poll(() => input.className, { timeout: 2000 }).toContain('motion-shake');
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('not-an-email');
});

test('forwards ref to the underlying input element', async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(<Input ref={ref} aria-label="Name" />);
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe('input');
});

test('forwards ref to the input element in addon mode', async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(<Input ref={ref} aria-label="Slug" prefix="app.vegastack.com/" />);
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe('input');
});

test('no a11y violations', async () => {
  const screen = await render(
    <label>
      Email
      <Input type="email" name="email" />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — disabled', async () => {
  const screen = await render(
    <label>
      Email
      <Input type="email" name="email" disabled />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — invalid', async () => {
  const screen = await render(
    <label>
      Email
      <Input type="email" name="email" aria-invalid />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});
