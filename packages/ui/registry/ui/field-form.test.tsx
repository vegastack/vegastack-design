import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@base-ui/react/form';
import { expectNoA11yViolations } from '../../test/a11y';
// `@/components/ui/field` is the alias to the registry source (vitest.config `resolve.alias`),
// so this test type-checks the form contract against the SHIPPED Field API consumers copy in.
import { FieldRoot, FieldLabel, FieldControl, FieldError } from '@/components/ui/field';

// The exact schema + resolver wiring documented in field.mdx ("Form integration").
// `z.email()` is the Zod 4 top-level email validator.
const schema = z.object({ email: z.email('Invalid email') });
type FormValues = z.infer<typeof schema>;

// Type-level proof of the contract: the resolver-validated value is `{ email: string }`,
// and `Controller`'s render prop hands us exactly the props Base UI's Field parts consume
// (`onValueChange`, `value`, `onBlur`, `ref`, plus `invalid`/`touched`). If the shipped Field
// API or the RHF/Zod surface drifts, this file fails to TYPECHECK — that is what makes the
// documented integration a real, enforced contract rather than untested prose.
function SignupForm({ onValid }: { onValid: (values: FormValues) => void }) {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <Form onSubmit={handleSubmit(onValid)}>
      <Controller
        name="email"
        control={control}
        render={({ field: { name, ref, value, onBlur, onChange }, fieldState }) => (
          <FieldRoot name={name} invalid={fieldState.invalid} touched={fieldState.isTouched}>
            <FieldLabel>Email</FieldLabel>
            <FieldControl value={value} onBlur={onBlur} onValueChange={onChange} ref={ref} />
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </FieldRoot>
        )}
      />
      <button type="submit">Sign up</button>
    </Form>
  );
}

test('valid email submits with the typed value through zodResolver', async () => {
  const onValid = vi.fn();
  const screen = await render(<SignupForm onValid={onValid} />);

  await screen.getByLabelText('Email').fill('dev@vegastack.com');
  await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

  await vi.waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
  // The handler receives the Zod-validated, typed payload — the form contract end to end.
  // (RHF's `handleSubmit` also forwards the submit event as a 2nd arg, so assert on the data arg.)
  expect(onValid.mock.calls[0]?.[0]).toEqual({ email: 'dev@vegastack.com' });
});

test('invalid email surfaces the Zod message via FieldError + aria-invalid', async () => {
  const onValid = vi.fn();
  const screen = await render(<SignupForm onValid={onValid} />);

  await screen.getByLabelText('Email').fill('not-an-email');
  await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

  // Submission is blocked; the Zod error message flows through Base UI's Field.Error (role="alert").
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  await expect.element(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  expect(onValid).not.toHaveBeenCalled();
});

test('no a11y violations', async () => {
  const screen = await render(<SignupForm onValid={() => {}} />);
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — error', async () => {
  const screen = await render(<SignupForm onValid={() => {}} />);

  await screen.getByLabelText('Email').fill('not-an-email');
  await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Invalid email');

  await expectNoA11yViolations(screen.container);
});
