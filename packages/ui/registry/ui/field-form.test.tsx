import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { expectNoA11yViolations } from "../../test/a11y";
// `@/components/ui/*` is the alias to the registry source (vitest.config `resolve.alias`), so this
// test type-checks the form contract against the SHIPPED API consumers copy in.
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/*
 * UPSTREAM'S `form` REGISTRY ITEM SHIPS NO FILE.
 *
 * shadcn's `form` is a docs-only item: the CLI writes nothing for it, and upstream documents the
 * react-hook-form wiring on `field` and in its Forms guide instead. `packages/ui/upstream/migrated.json`
 * records that, and `verify-parity.mjs` asserts it on both sides. This file is the executable half:
 * the exact composition the Field page's "Form" section shows, type-checked and exercised, so the
 * documented integration is a contract rather than prose.
 *
 * Batch 3 of the shadcn reset rewrote it. It used to drive Base UI's own `Form`/`Field.Control`
 * parts through a `Controller`; upstream's Field has neither, so it now uses `register`, which is
 * what upstream's own examples use and what a consumer copying this page will write.
 */
const schema = z.object({ email: z.email("Invalid email") });
type FormValues = z.infer<typeof schema>;

function SignupForm({ onValid }: { onValid: (values: FormValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="signup-email">Email</FieldLabel>
          <Input
            id="signup-email"
            type="email"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          <FieldDescription>We only use it to sign you in.</FieldDescription>
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>
        <Field orientation="horizontal">
          <Button type="submit">Sign up</Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

test("valid email submits with the typed value through zodResolver", async () => {
  const onValid = vi.fn();
  const screen = await render(<SignupForm onValid={onValid} />);

  await screen.getByLabelText("Email").fill("dev@vegastack.com");
  await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

  await vi.waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
  // The handler receives the Zod-validated, typed payload — the form contract end to end.
  // (RHF's `handleSubmit` also forwards the submit event as a 2nd arg, so assert on the data arg.)
  expect(onValid.mock.calls[0]?.[0]).toEqual({ email: "dev@vegastack.com" });
});

test("invalid email surfaces the Zod message via FieldError + aria-invalid", async () => {
  const onValid = vi.fn();
  const screen = await render(<SignupForm onValid={onValid} />);

  await screen.getByLabelText("Email").fill("not-an-email");
  await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

  // Submission is blocked and the Zod message flows through `FieldError`, which upstream renders as
  // `role="alert"`. The reset adopted that verbatim (A11Y-3 is decided per component, and upstream's
  // choice here is the one on the page).
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Invalid email");
  await expect
    .element(screen.getByLabelText("Email"))
    .toHaveAttribute("aria-invalid", "true");
  expect(onValid).not.toHaveBeenCalled();
});

test("A11Y-8: the error is marked by shape as well as by hue", async () => {
  const screen = await render(<SignupForm onValid={() => {}} />);
  await screen.getByLabelText("Email").fill("not-an-email");
  await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
  const error = screen.container.querySelector(
    '[data-slot="field-error"]',
  ) as HTMLElement;
  expect(error.querySelector("svg")).not.toBeNull();
});

test("no a11y violations", async () => {
  const screen = await render(<SignupForm onValid={() => {}} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — error", async () => {
  const screen = await render(<SignupForm onValid={() => {}} />);

  await screen.getByLabelText("Email").fill("not-an-email");
  await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Invalid email");

  await expectNoA11yViolations(screen.container);
});
