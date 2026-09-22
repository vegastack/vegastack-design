// @vegastack login-04@0.12.2 sha256-usi2G5qjU4Jstg274DixVANIkPsk42E+JGq4MOkmHf8=

import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
