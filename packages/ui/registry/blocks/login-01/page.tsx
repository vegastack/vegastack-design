// @vegastack login-01@0.11.3 sha256-QC2EqMIN9o7a0xSMZpCGFbozmVK7kziN70UA28/vUlI=

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
