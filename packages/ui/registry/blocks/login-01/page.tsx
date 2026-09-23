// @vegastack login-01@0.16.0 sha256-3t6pAzkomSBqK42NuWYPx3Z69+ZQ5XoXgQ6NFn0Htek=

import { LoginForm } from "./components/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
