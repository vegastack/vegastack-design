// @vegastack login-01@0.17.1 sha256-0PduFLGxLjvOIGtrhc+xmi1VQjtHuGuNmUoQiJ3GNBM=

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
