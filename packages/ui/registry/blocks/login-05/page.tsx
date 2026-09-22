// @vegastack login-05@0.11.2 sha256-MWJXBkXUFxZcpg4MEMHQbEviVwgOZTmRt+Qt7agLE38=

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
