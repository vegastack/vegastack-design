// @vegastack login-01@0.18.0 sha256-w8+v54DV7sdiu6CI83S26ZLnjAR3plG9UzC8dX/9cfo=

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
