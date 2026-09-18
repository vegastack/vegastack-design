// @vegastack login-01@0.10.0 sha256-84LMgv3s2a2BDIcyM1ADZWzrhhsVpBkabKVvIgihEQ8=

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
