// @vegastack login-05@0.10.0 sha256-7s96++S5C034a0F1gAEWbdXcnoRzxntmDqIQ9/ez7vQ=

import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
