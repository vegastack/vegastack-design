// @vegastack login-04@0.11.0 sha256-nrshaw8s09ZfpgLT1NVtMqg5eBiaQz/qxd/vBu5OW+E=

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
