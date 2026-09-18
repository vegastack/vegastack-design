// @vegastack login-01@0.9.1 sha256-J4l5/P8lXg+/XM7iPoySQqN7mwjS7m74lF0NRRjlMDk=

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
