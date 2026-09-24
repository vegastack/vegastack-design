// @vegastack login-01@0.19.0 sha256-IKKfQGIsIRWGSOLX+Whshbs7nB+p5N6a8NMJSMeBaxE=

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
