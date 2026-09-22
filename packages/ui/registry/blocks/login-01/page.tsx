// @vegastack login-01@0.12.1 sha256-1JuU8N/DSUHmSYJRSSeJwhkhCl7a5JnQoOiAOj7KLV8=

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
