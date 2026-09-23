// @vegastack login-01@0.15.0 sha256-uoUlI0u7yZXbP57PthrwYyHtjP8ZmYxCJ3oy5TeyZsY=

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
