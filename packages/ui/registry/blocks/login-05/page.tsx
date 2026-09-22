// @vegastack login-05@0.11.3 sha256-7cuBsoJks4qniWRos3S4wD9ThQjdi3OCxsxBSLlR7V0=

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
