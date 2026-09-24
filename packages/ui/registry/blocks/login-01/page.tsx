// @vegastack login-01@0.17.0 sha256-l6EuvFF6E4fFluyLbDpC4O0z64HSzcALw0bHf07mEug=

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
