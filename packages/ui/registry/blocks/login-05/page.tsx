// @vegastack login-05@0.13.0 sha256-PUrSktxzZaVCbckWWcClwj9oLnu3LmMSoySstIEI5/M=

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
