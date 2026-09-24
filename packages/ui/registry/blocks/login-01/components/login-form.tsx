// @vegastack login-01@0.21.1 sha256-k8UvYIiynGjQKpts6dVF6FPXz8FL9xkghprYCcz6POw=

"use client";

import * as React from "react";
import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

/** What the form hands to `signIn` once both fields pass their checks. */
export interface LoginCredentials {
  /** The email address, trimmed. */
  email: string;
  /** The password, exactly as typed. */
  password: string;
}

/** Props for {@link LoginForm}. */
export interface LoginFormProps {
  /**
   * Your sign-in call. Resolve when the session is set; throw an `Error` whose message says what
   * happened and what to do, and the form shows it in its alert. The default is a stand-in that
   * rejects every attempt, so the rejected state is visible before you wire your own.
   * @default rejects with "The email or password is incorrect…"
   */
  signIn?: (credentials: LoginCredentials) => Promise<void>;
  /**
   * Where "Forgot password?" goes.
   * @default "/forgot-password"
   */
  forgotPasswordHref?: string;
  /**
   * Where "Sign up" goes.
   * @default "/sign-up"
   */
  signUpHref?: string;
}

type FieldErrors = Partial<Record<keyof LoginCredentials, string>>;

// A shape check only — the server is the authority on whether an address exists.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }: LoginCredentials): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = "Enter your email address";
  else if (!EMAIL_SHAPE.test(email))
    errors.email = "Enter an email address like name@example.com";
  if (!password) errors.password = "Enter your password";
  return errors;
}

// Replace with your auth provider's call. It rejects so the failed state shows in the preview.
async function demoSignIn(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  throw new Error(
    "The email or password is incorrect. Check both and try again, or reset your password.",
  );
}

/**
 * The sign-in card: an `h1` title, Email and Password fields with a `FieldError` each, a real
 * "Forgot password?" link, and a submit button that shows its loading state in place. A field
 * problem is reported on the field and focus moves to the first one; a rejected sign-in shows a
 * form-level alert, which is rendered only after that failed submit.
 *
 * @example
 * ```tsx
 * <LoginForm
 *   signIn={async ({ email, password }) => {
 *     const res = await fetch("/api/sign-in", {
 *       method: "POST",
 *       body: JSON.stringify({ email, password }),
 *     });
 *     if (!res.ok) throw new Error("The email or password is incorrect.");
 *   }}
 * />
 * ```
 */
export function LoginForm({
  signIn = demoSignIn,
  forgotPasswordHref = "/forgot-password",
  signUpHref = "/sign-up",
}: LoginFormProps) {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials: LoginCredentials = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    };
    const nextErrors = validate(credentials);
    setErrors(nextErrors);
    setFormError(null);
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();

    setLoading(true);
    try {
      await signIn(credentials);
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : "Sign-in failed. Try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearError(field: keyof LoginCredentials) {
    if (errors[field])
      setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle render={<h1 />}>Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            {formError ? (
              <Alert variant="destructive" live>
                <CircleAlertIcon aria-hidden />
                <AlertTitle>Couldn’t sign you in</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel>Email</FieldLabel>
              <Input
                ref={emailRef}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                onChange={() => clearError("email")}
              />
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field data-invalid={errors.password ? true : undefined}>
              <div className="flex items-center">
                <FieldLabel>Password</FieldLabel>
                <a
                  href={forgotPasswordHref}
                  className="relative ms-auto inline-block text-sm underline-offset-4 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <PasswordInput
                ref={passwordRef}
                name="password"
                autoComplete="current-password"
                required
                onChange={() => clearError("password")}
              />
              <FieldError>{errors.password}</FieldError>
            </Field>
            <Field>
              <Button type="submit" loading={loading}>
                Sign in
              </Button>
              <FieldDescription className="text-center">
                Don’t have an account? <a href={signUpHref}>Sign up</a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
