// @vegastack login-01@0.16.1 sha256-SnSKOb+d+uWvkXXu9mf6H20tQCBvox1qjGpLaqQuK9E=

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
