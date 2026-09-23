// @vegastack login-01@0.13.0 sha256-GLQbFFBfKwIiXnoMJ5r/rUPXnZU6Yg30UhnhJ9hGBc8=

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
