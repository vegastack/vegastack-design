// @vegastack login-01@0.12.2 sha256-uYG+bxOdJPkBNFRi1bhZIbMhLj6nRE7/gTP85GZCKr8=

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
