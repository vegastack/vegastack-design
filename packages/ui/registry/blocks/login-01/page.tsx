// @vegastack login-01@0.14.0 sha256-iKmIdREkz/LMuqzCG/sp6RIwB83sVOxJl6WkFIO//lU=

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
