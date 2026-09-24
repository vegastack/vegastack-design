// @vegastack login-05@0.16.1 sha256-3KGZyRxm7kBzt+dlKyqf9L5J3d2bZP4qLUwwc0VSg1M=

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
