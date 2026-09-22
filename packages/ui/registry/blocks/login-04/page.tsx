// @vegastack login-04@0.11.3 sha256-aFvk3d9gdnsCggRk4W0cYUSMxW3BKbg0v44gVqRxpmk=

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
