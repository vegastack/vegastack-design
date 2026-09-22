// @vegastack login-04@0.12.1 sha256-vmFGWdEkUOysMwDCW3k69P4AQ6tgjm4TmIR2JhkYcKA=

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
