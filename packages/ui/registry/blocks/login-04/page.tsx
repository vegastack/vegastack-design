// @vegastack login-04@0.11.1 sha256-jvswCjhZgREqmW+gbxZ7N7R5u1YlWiTzc8DQOXciidI=

import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
