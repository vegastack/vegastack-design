// @vegastack login-05@0.9.1 sha256-OwnpdgxITnKCo+UANlG/ZnKFoCLT5umegCtazK6Qt3g=

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
