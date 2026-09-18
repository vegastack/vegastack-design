// @vegastack login-01@0.9.1 sha256-FY3/jeO0uxa+66gzOV7oMBepTh+h5yn+285yhtSEnlo=

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
