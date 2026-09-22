// @vegastack login-05@0.11.3 sha256-GgP3Kf4PoyCH0ukG4KlNO+p3Ch/NHqKbAvfGrSB4on4=

import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
