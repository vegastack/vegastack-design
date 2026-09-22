// @vegastack login-01@0.12.0 sha256-9ZTN2SxWNU1JG7WXOFd3HT/2sTwuH0WO3gJGbRiy5vA=

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
